// Work Bestie — Stats Dashboard
// Loads stats from Chrome Storage and renders a fun GenZ stats dashboard

import type { Stats, SessionState } from '../shared/types';
import { getStats, getSessionState } from '../shared/storage';

// ── State ───────────────────────────────────────────────────────────

let cachedStats: Stats | null = null;
let cachedSession: SessionState | null = null;

// ── Helpers ─────────────────────────────────────────────────────────

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function formatFocusTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ── Render ──────────────────────────────────────────────────────────

function render(): void {
  const stats = cachedStats;
  const session = cachedSession;

  // Total focus time
  const focusEl = $('stats-focus-time');
  if (focusEl) focusEl.textContent = stats ? formatFocusTime(stats.totalFocusTimeMs) : '0m';

  // Total distractions caught
  const distEl = $('stats-distractions');
  if (distEl) distEl.textContent = stats ? String(stats.totalDistractionsCaught) : '0';

  // Streak
  const streakEl = $('stats-streak');
  if (streakEl) streakEl.textContent = stats ? String(stats.currentStreak) : '0';

  // Sessions completed
  const sessionsEl = $('stats-sessions');
  if (sessionsEl) sessionsEl.textContent = stats ? String(stats.sessionsCompleted) : '0';

  // Current session card
  const currentCard = $('stats-current-session');
  if (currentCard) {
    if (session && session.isActive) {
      currentCard.style.display = 'block';
      const elapsedEl = $('stats-current-elapsed');
      if (elapsedEl) elapsedEl.textContent = formatFocusTime(session.elapsedMs);
      const curDistEl = $('stats-current-distractions');
      if (curDistEl) curDistEl.textContent = String(session.distractionsThisSession);
    } else {
      currentCard.style.display = 'none';
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Loads stats from Chrome Storage and renders the dashboard.
 */
export async function initStats(): Promise<void> {
  try {
    cachedStats = await getStats();
    cachedSession = await getSessionState();
  } catch {
    // Storage may not be available
  }
  render();
}

/**
 * Re-renders with latest data. Called on STATS_UPDATED message.
 */
export function refreshStats(stats?: Stats, session?: SessionState): void {
  if (stats) cachedStats = stats;
  if (session) cachedSession = session;
  render();
}
