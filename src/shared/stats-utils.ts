import type { Stats, SessionSummary, SessionState } from "./types";

/**
 * Calculates the streak based on the last session date and current date.
 * Dates are ISO format "YYYY-MM-DD".
 */
export function calculateStreak(
  lastSessionDate: string,
  currentStreak: number,
  currentDate: string
): number {
  if (!lastSessionDate) return 1;
  if (lastSessionDate === currentDate) return currentStreak;

  const last = new Date(lastSessionDate + "T00:00:00");
  const current = new Date(currentDate + "T00:00:00");
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

/**
 * Accumulates stats from a completed session summary.
 */
export function updateStats(stats: Stats, summary: SessionSummary): Stats {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalFocusTimeMs: stats.totalFocusTimeMs + summary.totalFocusTimeMs,
    totalDistractionsCaught:
      stats.totalDistractionsCaught + summary.distractionsCaught,
    sessionsCompleted: stats.sessionsCompleted + 1,
    currentStreak: calculateStreak(
      stats.lastSessionDate,
      stats.currentStreak,
      today
    ),
    lastSessionDate: today,
  };
}

/**
 * Extracts a SessionSummary from an active SessionState.
 */
export function createSessionSummary(state: SessionState): SessionSummary {
  const pomodoroIntervalsCompleted =
    state.mode === "pomodoro" && state.pomodoroWorkMs > 0
      ? Math.floor(state.elapsedMs / state.pomodoroWorkMs)
      : 0;

  return {
    mode: state.mode,
    totalFocusTimeMs: state.elapsedMs,
    distractionsCaught: state.distractionsThisSession,
    startTimestamp: state.startTimestamp,
    endTimestamp: Date.now(),
    pomodoroIntervalsCompleted,
  };
}
