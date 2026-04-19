import { describe, it, expect, vi } from "vitest";
import { calculateStreak, updateStats, createSessionSummary } from "./stats-utils";
import type { Stats, SessionSummary, SessionState } from "./types";

describe("calculateStreak", () => {
  it("returns 1 for first session (empty lastSessionDate)", () => {
    expect(calculateStreak("", 0, "2025-01-15")).toBe(1);
  });

  it("returns current streak when lastSessionDate is today", () => {
    expect(calculateStreak("2025-01-15", 5, "2025-01-15")).toBe(5);
  });

  it("increments streak when lastSessionDate is yesterday", () => {
    expect(calculateStreak("2025-01-14", 3, "2025-01-15")).toBe(4);
  });

  it("resets streak to 1 when gap is more than one day", () => {
    expect(calculateStreak("2025-01-10", 7, "2025-01-15")).toBe(1);
  });

  it("handles month boundary (Jan 31 → Feb 1)", () => {
    expect(calculateStreak("2025-01-31", 2, "2025-02-01")).toBe(3);
  });

  it("handles year boundary (Dec 31 → Jan 1)", () => {
    expect(calculateStreak("2024-12-31", 10, "2025-01-01")).toBe(11);
  });
});

describe("updateStats", () => {
  const baseStats: Stats = {
    totalFocusTimeMs: 100000,
    totalDistractionsCaught: 5,
    currentStreak: 2,
    lastSessionDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    sessionsCompleted: 3,
  };

  const summary: SessionSummary = {
    mode: "open-focus",
    totalFocusTimeMs: 50000,
    distractionsCaught: 3,
    startTimestamp: Date.now() - 50000,
    endTimestamp: Date.now(),
    pomodoroIntervalsCompleted: 0,
  };

  it("accumulates totalFocusTimeMs", () => {
    const result = updateStats(baseStats, summary);
    expect(result.totalFocusTimeMs).toBe(150000);
  });

  it("accumulates totalDistractionsCaught", () => {
    const result = updateStats(baseStats, summary);
    expect(result.totalDistractionsCaught).toBe(8);
  });

  it("increments sessionsCompleted", () => {
    const result = updateStats(baseStats, summary);
    expect(result.sessionsCompleted).toBe(4);
  });

  it("sets lastSessionDate to today", () => {
    const result = updateStats(baseStats, summary);
    const today = new Date().toISOString().slice(0, 10);
    expect(result.lastSessionDate).toBe(today);
  });

  it("updates streak correctly", () => {
    const result = updateStats(baseStats, summary);
    // lastSessionDate was yesterday, so streak should increment
    expect(result.currentStreak).toBe(3);
  });
});

describe("createSessionSummary", () => {
  it("extracts correct fields from session state", () => {
    const now = Date.now();
    const state: SessionState = {
      isActive: true,
      mode: "1-hour",
      startTimestamp: now - 3600000,
      elapsedMs: 3600000,
      remainingMs: 0,
      isPomodoroBreak: false,
      pomodoroWorkMs: 25 * 60 * 1000,
      pomodoroBreakMs: 5 * 60 * 1000,
      currentIntervalStartMs: now - 3600000,
      distractionsThisSession: 4,
    };

    const summary = createSessionSummary(state);
    expect(summary.mode).toBe("1-hour");
    expect(summary.totalFocusTimeMs).toBe(3600000);
    expect(summary.distractionsCaught).toBe(4);
    expect(summary.startTimestamp).toBe(state.startTimestamp);
    expect(summary.endTimestamp).toBeGreaterThan(0);
    expect(summary.pomodoroIntervalsCompleted).toBe(0);
  });

  it("calculates pomodoro intervals from elapsed time", () => {
    const now = Date.now();
    const pomodoroWorkMs = 25 * 60 * 1000;
    const state: SessionState = {
      isActive: true,
      mode: "pomodoro",
      startTimestamp: now - 55 * 60 * 1000,
      elapsedMs: 55 * 60 * 1000, // 55 minutes = 2 full 25-min intervals
      remainingMs: null,
      isPomodoroBreak: false,
      pomodoroWorkMs,
      pomodoroBreakMs: 5 * 60 * 1000,
      currentIntervalStartMs: now - 5 * 60 * 1000,
      distractionsThisSession: 2,
    };

    const summary = createSessionSummary(state);
    expect(summary.mode).toBe("pomodoro");
    expect(summary.pomodoroIntervalsCompleted).toBe(2);
  });

  it("returns 0 pomodoro intervals for non-pomodoro modes", () => {
    const state: SessionState = {
      isActive: true,
      mode: "open-focus",
      startTimestamp: Date.now() - 100000,
      elapsedMs: 100000,
      remainingMs: null,
      isPomodoroBreak: false,
      pomodoroWorkMs: 25 * 60 * 1000,
      pomodoroBreakMs: 5 * 60 * 1000,
      currentIntervalStartMs: Date.now() - 100000,
      distractionsThisSession: 0,
    };

    const summary = createSessionSummary(state);
    expect(summary.pomodoroIntervalsCompleted).toBe(0);
  });
});
