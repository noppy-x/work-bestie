import type { SessionMode, SessionState, SessionSummary } from "../shared/types";
import type { SessionStateMessage, TimerTickMessage } from "../shared/messages";
import { getSessionState, setSessionState, getStats, setStats } from "../shared/storage";
import { createSessionSummary, updateStats } from "../shared/stats-utils";

// ── Constants ───────────────────────────────────────────────────────

const SESSION_ALARM_NAME = "session-tick";
const TICK_PERIOD_MINUTES = 1 / 60; // ~1 second

const MODE_DURATIONS: Record<SessionMode, number | null> = {
  "open-focus": null,
  "1-hour": 60 * 60 * 1000,
  "2-hour": 120 * 60 * 1000,
  pomodoro: null, // pomodoro uses interval-based timing
};

const POMODORO_WORK_MS = 25 * 60 * 1000;
const POMODORO_BREAK_MS = 5 * 60 * 1000;

// ── In-memory state (fast access, persisted to storage on each tick) ─

let currentSession: SessionState | null = null;

// ── Broadcast helpers ───────────────────────────────────────────────

function broadcastSessionState(state: SessionState): void {
  const message: SessionStateMessage = { type: "SESSION_STATE", state };
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners — popup may be closed, that's fine
  });
}

function broadcastTimerTick(state: SessionState): void {
  const message: TimerTickMessage = {
    type: "TIMER_TICK",
    elapsed: state.elapsedMs,
    remaining: state.remainingMs ?? undefined,
  };
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners — popup may be closed
  });
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Start a new focus session with the given mode.
 */
export async function startSession(mode: SessionMode): Promise<void> {
  const now = Date.now();

  const state: SessionState = {
    isActive: true,
    mode,
    startTimestamp: now,
    elapsedMs: 0,
    remainingMs: mode === "pomodoro" ? POMODORO_WORK_MS : (MODE_DURATIONS[mode] ?? null),
    isPomodoroBreak: false,
    pomodoroWorkMs: POMODORO_WORK_MS,
    pomodoroBreakMs: POMODORO_BREAK_MS,
    currentIntervalStartMs: now,
    distractionsThisSession: 0,
  };

  currentSession = state;

  // Persist to storage for service worker recovery
  await setSessionState(state);

  // Create alarm for reliable ticking
  await chrome.alarms.create(SESSION_ALARM_NAME, {
    periodInMinutes: TICK_PERIOD_MINUTES,
  });

  broadcastSessionState(state);
}

/**
 * Stop the current session, generate summary, update stats, and clean up.
 */
export async function stopSession(): Promise<SessionSummary> {
  // Use in-memory state if available, otherwise recover from storage
  const state = currentSession ?? await getSessionState();

  // Recalculate elapsed from startTimestamp for accuracy
  if (state.startTimestamp > 0) {
    state.elapsedMs = Date.now() - state.startTimestamp;
  }

  const summary = createSessionSummary(state);

  // Update cumulative stats
  const stats = await getStats();
  const updatedStats = updateStats(stats, summary);
  await setStats(updatedStats);

  // Clear the tick alarm
  await chrome.alarms.clear(SESSION_ALARM_NAME);

  // Reset session state
  const resetState: SessionState = {
    isActive: false,
    mode: "open-focus",
    startTimestamp: 0,
    elapsedMs: 0,
    remainingMs: null,
    isPomodoroBreak: false,
    pomodoroWorkMs: POMODORO_WORK_MS,
    pomodoroBreakMs: POMODORO_BREAK_MS,
    currentIntervalStartMs: 0,
    distractionsThisSession: 0,
  };

  currentSession = null;
  await setSessionState(resetState);

  broadcastSessionState(resetState);

  return summary;
}

/**
 * Handle a single tick from chrome.alarms. Called by the alarm listener.
 * Updates elapsed/remaining time, handles pomodoro transitions, and
 * auto-stops timed sessions when they expire.
 */
export async function handleSessionTick(): Promise<void> {
  // Recover from storage if in-memory state was lost (service worker restart)
  if (!currentSession) {
    currentSession = await getSessionState();
  }

  if (!currentSession || !currentSession.isActive) {
    // No active session — clear stale alarm just in case
    await chrome.alarms.clear(SESSION_ALARM_NAME);
    return;
  }

  const tickMs = 1000; // approximate 1-second tick

  // Calculate elapsed from start timestamp (accurate even after service worker restarts)
  const now = Date.now();
  currentSession.elapsedMs = now - currentSession.startTimestamp;

  // Update remaining time for timed sessions based on elapsed
  if (currentSession.remainingMs !== null && currentSession.mode !== "pomodoro") {
    const totalMs = currentSession.mode === "1-hour" ? 3600000 : currentSession.mode === "2-hour" ? 7200000 : 0;
    if (totalMs > 0) {
      currentSession.remainingMs = Math.max(0, totalMs - currentSession.elapsedMs);
    }
  }

  // Handle pomodoro work/break transitions
  if (currentSession.mode === "pomodoro") {
    const intervalElapsed = now - currentSession.currentIntervalStartMs;

    if (currentSession.isPomodoroBreak) {
      // Break interval — update remaining
      currentSession.remainingMs = Math.max(0, currentSession.pomodoroBreakMs - intervalElapsed);
      if (intervalElapsed >= currentSession.pomodoroBreakMs) {
        // Transition back to work
        currentSession.isPomodoroBreak = false;
        currentSession.currentIntervalStartMs = now;
        currentSession.remainingMs = currentSession.pomodoroWorkMs;
      }
    } else {
      // Work interval — update remaining
      currentSession.remainingMs = Math.max(0, currentSession.pomodoroWorkMs - intervalElapsed);
      if (intervalElapsed >= currentSession.pomodoroWorkMs) {
        // Transition to break
        currentSession.isPomodoroBreak = true;
        currentSession.currentIntervalStartMs = now;
        currentSession.remainingMs = currentSession.pomodoroBreakMs;
      }
    }
  }

  // Check if a timed (non-pomodoro) session has ended
  if (
    currentSession.mode !== "open-focus" &&
    currentSession.mode !== "pomodoro" &&
    currentSession.remainingMs !== null &&
    currentSession.remainingMs <= 0
  ) {
    // Session time expired — auto-stop
    await stopSession();
    return;
  }

  // Persist updated state for service worker recovery
  await setSessionState(currentSession);

  // Broadcast tick to popup
  broadcastTimerTick(currentSession);
}

/**
 * Returns the current session state. Reads from storage to handle
 * service worker restarts.
 */
export async function getActiveSession(): Promise<SessionState> {
  if (currentSession) {
    return currentSession;
  }
  return getSessionState();
}

/**
 * Fast in-memory check for whether a session is currently active.
 */
export function isSessionActive(): boolean {
  return currentSession !== null && currentSession.isActive;
}

/**
 * Restore in-memory session state from storage.
 * Call this on service worker startup to recover from restarts.
 */
export async function restoreSession(): Promise<void> {
  const state = await getSessionState();
  if (state.isActive) {
    currentSession = state;
    // Re-create the alarm in case it was lost
    await chrome.alarms.create(SESSION_ALARM_NAME, {
      periodInMinutes: TICK_PERIOD_MINUTES,
    });
  }
}

/**
 * Reset in-memory state for testing purposes only.
 * @internal
 */
export function _resetForTesting(): void {
  currentSession = null;
}
