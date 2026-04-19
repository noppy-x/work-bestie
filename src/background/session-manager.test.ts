import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock chrome APIs before importing the module ────────────────────

const mockStorage: Record<string, unknown> = {};

const chromeAlarmsMock = {
  create: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(true),
};

const chromeRuntimeMock = {
  sendMessage: vi.fn().mockResolvedValue(undefined),
};

const chromeStorageMock = {
  local: {
    get: vi.fn((key: string) => {
      const val = mockStorage[key];
      return Promise.resolve(val !== undefined ? { [key]: val } : {});
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    }),
  },
};

// Assign to globalThis so chrome.* calls work
Object.assign(globalThis, {
  chrome: {
    alarms: chromeAlarmsMock,
    runtime: chromeRuntimeMock,
    storage: chromeStorageMock,
  },
});

import {
  startSession,
  stopSession,
  handleSessionTick,
  getActiveSession,
  isSessionActive,
  restoreSession,
  _resetForTesting,
} from "./session-manager";

// ── Helpers ─────────────────────────────────────────────────────────

function clearMocks() {
  vi.clearAllMocks();
  _resetForTesting();
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe("session-manager", () => {
  beforeEach(clearMocks);

  describe("startSession", () => {
    it("initializes open-focus session with no remainingMs", async () => {
      await startSession("open-focus");

      const state = await getActiveSession();
      expect(state.isActive).toBe(true);
      expect(state.mode).toBe("open-focus");
      expect(state.remainingMs).toBeNull();
      expect(state.elapsedMs).toBe(0);
      expect(state.isPomodoroBreak).toBe(false);
    });

    it("initializes 1-hour session with 60min remaining", async () => {
      await startSession("1-hour");

      const state = await getActiveSession();
      expect(state.isActive).toBe(true);
      expect(state.mode).toBe("1-hour");
      expect(state.remainingMs).toBe(60 * 60 * 1000);
    });

    it("initializes 2-hour session with 120min remaining", async () => {
      await startSession("2-hour");

      const state = await getActiveSession();
      expect(state.mode).toBe("2-hour");
      expect(state.remainingMs).toBe(120 * 60 * 1000);
    });

    it("initializes pomodoro session with 25min work interval", async () => {
      await startSession("pomodoro");

      const state = await getActiveSession();
      expect(state.mode).toBe("pomodoro");
      expect(state.remainingMs).toBe(25 * 60 * 1000);
      expect(state.isPomodoroBreak).toBe(false);
    });

    it("creates a chrome alarm for session ticks", async () => {
      await startSession("open-focus");

      expect(chromeAlarmsMock.create).toHaveBeenCalledWith("session-tick", {
        periodInMinutes: 1 / 60,
      });
    });

    it("persists state to chrome storage", async () => {
      await startSession("1-hour");

      expect(chromeStorageMock.local.set).toHaveBeenCalled();
      const storedState = mockStorage["work-bestie-session"] as Record<string, unknown>;
      expect(storedState).toBeDefined();
      expect(storedState.isActive).toBe(true);
    });

    it("broadcasts SESSION_STATE message", async () => {
      await startSession("open-focus");

      expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SESSION_STATE" })
      );
    });
  });

  describe("stopSession", () => {
    it("returns a session summary", async () => {
      await startSession("1-hour");
      const summary = await stopSession();

      expect(summary.mode).toBe("1-hour");
      expect(summary.totalFocusTimeMs).toBe(0);
      expect(summary.distractionsCaught).toBe(0);
    });

    it("clears the session alarm", async () => {
      await startSession("open-focus");
      await stopSession();

      expect(chromeAlarmsMock.clear).toHaveBeenCalledWith("session-tick");
    });

    it("resets session state to inactive", async () => {
      await startSession("open-focus");
      await stopSession();

      expect(isSessionActive()).toBe(false);
      const state = await getActiveSession();
      expect(state.isActive).toBe(false);
    });

    it("updates cumulative stats", async () => {
      await startSession("open-focus");
      await stopSession();

      const storedStats = mockStorage["work-bestie-stats"] as Record<string, unknown>;
      expect(storedStats).toBeDefined();
      expect(storedStats.sessionsCompleted).toBe(1);
    });
  });

  describe("handleSessionTick", () => {
    it("increments elapsedMs by ~1000ms", async () => {
      await startSession("open-focus");
      await handleSessionTick();

      const state = await getActiveSession();
      expect(state.elapsedMs).toBe(1000);
    });

    it("decrements remainingMs for timed sessions", async () => {
      await startSession("1-hour");
      await handleSessionTick();

      const state = await getActiveSession();
      expect(state.remainingMs).toBe(60 * 60 * 1000 - 1000);
    });

    it("broadcasts TIMER_TICK message", async () => {
      await startSession("open-focus");
      chromeRuntimeMock.sendMessage.mockClear();
      await handleSessionTick();

      expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "TIMER_TICK" })
      );
    });

    it("clears alarm if no active session", async () => {
      // No session started — tick should be a no-op
      await handleSessionTick();
      expect(chromeAlarmsMock.clear).toHaveBeenCalledWith("session-tick");
    });

    it("auto-stops timed session when remainingMs reaches 0", async () => {
      await startSession("1-hour");

      // Simulate enough ticks to exhaust the timer
      const state = await getActiveSession();
      state.remainingMs = 500; // almost done
      state.elapsedMs = 60 * 60 * 1000 - 500;
      await (await import("../shared/storage")).setSessionState(state);

      // Force re-read from storage by clearing in-memory state
      // We need to stop and restart to clear in-memory, so let's just tick
      await handleSessionTick();

      // After tick, remainingMs should be 0 and session should auto-stop
      expect(isSessionActive()).toBe(false);
    });
  });

  describe("isSessionActive", () => {
    it("returns false when no session is running", () => {
      expect(isSessionActive()).toBe(false);
    });

    it("returns true after starting a session", async () => {
      await startSession("open-focus");
      expect(isSessionActive()).toBe(true);
    });

    it("returns false after stopping a session", async () => {
      await startSession("open-focus");
      await stopSession();
      expect(isSessionActive()).toBe(false);
    });
  });

  describe("getActiveSession", () => {
    it("returns current session state when active", async () => {
      await startSession("pomodoro");
      const state = await getActiveSession();
      expect(state.isActive).toBe(true);
      expect(state.mode).toBe("pomodoro");
    });

    it("returns default inactive state when no session", async () => {
      const state = await getActiveSession();
      expect(state.isActive).toBe(false);
    });
  });

  describe("restoreSession", () => {
    it("restores active session from storage and re-creates alarm", async () => {
      // Simulate a persisted active session in storage
      mockStorage["work-bestie-session"] = {
        isActive: true,
        mode: "1-hour",
        startTimestamp: Date.now() - 10000,
        elapsedMs: 10000,
        remainingMs: 60 * 60 * 1000 - 10000,
        isPomodoroBreak: false,
        pomodoroWorkMs: 25 * 60 * 1000,
        pomodoroBreakMs: 5 * 60 * 1000,
        currentIntervalStartMs: Date.now() - 10000,
        distractionsThisSession: 1,
      };

      await restoreSession();

      expect(isSessionActive()).toBe(true);
      expect(chromeAlarmsMock.create).toHaveBeenCalledWith("session-tick", {
        periodInMinutes: 1 / 60,
      });
    });

    it("does nothing when no active session in storage", async () => {
      await restoreSession();
      expect(isSessionActive()).toBe(false);
      expect(chromeAlarmsMock.create).not.toHaveBeenCalled();
    });
  });
});
