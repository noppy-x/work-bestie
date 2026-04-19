// Work Bestie — Popup UI
// Main popup entry point

import { showView, initViews } from './views';
import type { ViewName } from './views';
import type { SessionMode, SessionState, SessionSummary } from '../shared/types';
import { initOnboarding } from './onboarding';
import { initSettings } from './settings';
import { initStats, refreshStats } from './stats';

console.log('[Work Bestie] Popup loaded 💅');

// ── State ───────────────────────────────────────────────────────────

let selectedMode: SessionMode = 'open-focus';
let sessionActive = false;
let currentTheme: 'light' | 'dark' = 'light';

// ── DOM References ──────────────────────────────────────────────────

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// ── Time Formatting ─────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatFocusTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ── Timer Ring ──────────────────────────────────────────────────────

const RING_CIRCUMFERENCE = 2 * Math.PI * 70; // r=70

function setTimerProgress(fraction: number): void {
  const progress = $('timer-progress') as SVGCircleElement | null;
  if (!progress) return;
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction)));
  progress.style.strokeDashoffset = String(offset);
}

// ── Session Mode Selection ──────────────────────────────────────────

function selectMode(mode: SessionMode): void {
  selectedMode = mode;
  document.querySelectorAll('.session-mode-btn').forEach((btn) => {
    const btnMode = btn.getAttribute('data-mode');
    if (btnMode === mode) {
      btn.classList.add('chip-active');
    } else {
      btn.classList.remove('chip-active');
    }
  });
}

// ── Session Controls ────────────────────────────────────────────────

function startSession(): void {
  console.log('[Work Bestie] Start session clicked, mode:', selectedMode);
  // Reset quick stats for the new session
  updateQuickStats(0, 0);
  chrome.runtime.sendMessage(
    { type: 'START_SESSION', mode: selectedMode },
    (response) => {
      console.log('[Work Bestie] Start session response:', response);
      if (response && response.success) {
        updateSessionButton(true);
      } else {
        console.error('[Work Bestie] Start session failed:', response);
      }
    }
  );
}

function stopSession(): void {
  chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
}

function updateSessionButton(active: boolean): void {
  const btn = $('btn-session');
  if (!btn) return;
  sessionActive = active;
  if (active) {
    btn.innerHTML = '<i class="ph-duotone ph-stop"></i> stop session';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-stop');
  } else {
    btn.innerHTML = '<i class="ph-duotone ph-play"></i> start session';
    btn.classList.remove('btn-stop');
    btn.classList.add('btn-primary');
  }
}

// ── UI Updates from Messages ────────────────────────────────────────

function updateTimerDisplay(state: SessionState): void {
  const display = $('timer-display');
  const label = $('timer-label');
  const breakBanner = $('pomodoro-break-banner');

  if (!state.isActive) {
    if (display) display.textContent = '00:00';
    if (label) label.textContent = 'ready to lock in?';
    setTimerProgress(0);
    if (breakBanner) breakBanner.style.display = 'none';
    return;
  }

  if (state.isPomodoroBreak) {
    if (display) display.textContent = formatTime(state.remainingMs ?? 0);
    if (label) label.textContent = '☕ break time';
    if (breakBanner) breakBanner.style.display = 'block';
  } else if (state.mode === 'open-focus') {
    if (display) display.textContent = formatTime(state.elapsedMs);
    if (label) label.textContent = 'session active';
    setTimerProgress(1);
    if (breakBanner) breakBanner.style.display = 'none';
  } else {
    const remaining = state.remainingMs ?? 0;
    if (display) display.textContent = formatTime(remaining);
    if (label) label.textContent = 'session active';
    if (breakBanner) breakBanner.style.display = 'none';

    // Calculate progress for timed sessions
    const totalMs = state.mode === '1-hour' ? 3600000 : state.mode === '2-hour' ? 7200000 : state.pomodoroWorkMs;
    const fraction = totalMs > 0 ? 1 - (remaining / totalMs) : 0;
    setTimerProgress(fraction);
  }
}

function updateQuickStats(focusMs: number, distractions: number): void {
  const focusEl = $('quick-focus-time');
  const distEl = $('quick-distractions');
  if (focusEl) focusEl.textContent = formatFocusTime(focusMs);
  if (distEl) distEl.textContent = String(distractions);
}

// ── Session Summary ─────────────────────────────────────────────────

const SUMMARY_EMOJIS = ['🎉', '💅', '👑', '🔥', '✨', '💪', '🏆'];
const SUMMARY_TITLES = [
  'slay bestie!',
  'you ate that up!',
  'main character energy!',
  'no cap, you crushed it!',
  'period. 💅',
  'that was giving productive!',
];
const SUMMARY_SUBTITLES = [
  'you actually locked in. proud of u fr',
  'the grind was real and so were you',
  'bestie really said "watch me work" 💅',
  'your focus was immaculate ngl',
  'serving productivity realness',
];

function showSessionSummary(summary: SessionSummary): void {
  const overlay = $('session-summary-overlay');
  if (!overlay) return;

  const emoji = $('summary-emoji');
  const title = $('summary-title');
  const subtitle = $('summary-subtitle');
  const focusTime = $('summary-focus-time');
  const distractions = $('summary-distractions');
  const pomodoroRow = $('summary-pomodoro-row');
  const pomodoros = $('summary-pomodoros');

  if (emoji) emoji.textContent = SUMMARY_EMOJIS[Math.floor(Math.random() * SUMMARY_EMOJIS.length)];
  if (title) title.textContent = SUMMARY_TITLES[Math.floor(Math.random() * SUMMARY_TITLES.length)];
  if (subtitle) subtitle.textContent = SUMMARY_SUBTITLES[Math.floor(Math.random() * SUMMARY_SUBTITLES.length)];
  if (focusTime) focusTime.textContent = formatFocusTime(summary.totalFocusTimeMs);
  if (distractions) distractions.textContent = String(summary.distractionsCaught);

  if (summary.mode === 'pomodoro' && summary.pomodoroIntervalsCompleted > 0) {
    if (pomodoroRow) pomodoroRow.style.display = 'grid';
    if (pomodoros) pomodoros.textContent = String(summary.pomodoroIntervalsCompleted);
  } else {
    if (pomodoroRow) pomodoroRow.style.display = 'none';
  }

  overlay.style.display = 'flex';
}

function hideSessionSummary(): void {
  const overlay = $('session-summary-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Theme Toggle ────────────────────────────────────────────────────

function toggleTheme(): void {
  const root = document.documentElement;
  const btn = $('btn-theme-toggle');
  if (currentTheme === 'light') {
    currentTheme = 'dark';
    root.setAttribute('data-theme', 'dark');
    if (btn) btn.textContent = '☀️';
  } else {
    currentTheme = 'light';
    root.setAttribute('data-theme', 'light');
    if (btn) btn.textContent = '🌙';
  }
}

function initTheme(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    currentTheme = 'dark';
    document.documentElement.setAttribute('data-theme', 'dark');
    const btn = $('btn-theme-toggle');
    if (btn) btn.textContent = '☀️';
  }
}

// ── Message Listener ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SESSION_STATE': {
      const state = message.state as SessionState;
      updateSessionButton(state.isActive);
      updateTimerDisplay(state);
      // Only update quick stats when session is active (preserve last session's numbers on stop)
      if (state.isActive) {
        updateQuickStats(state.elapsedMs, state.distractionsThisSession);
      }
      if (state.mode) selectMode(state.mode);
      refreshStats(undefined, state);
      break;
    }
    case 'TIMER_TICK': {
      const display = $('timer-display');
      if (message.remaining != null) {
        if (display) display.textContent = formatTime(message.remaining);
      } else if (message.elapsed != null) {
        if (display) display.textContent = formatTime(message.elapsed);
      }
      break;
    }
    case 'STATS_UPDATED': {
      // Quick stats update during session
      if (message.stats) {
        updateQuickStats(
          message.stats.totalFocusTimeMs ?? 0,
          message.stats.totalDistractionsCaught ?? 0
        );
        refreshStats(message.stats);
      }
      break;
    }
    case 'SESSION_SUMMARY': {
      const summary = message.summary as SessionSummary;
      showSessionSummary(summary);
      updateSessionButton(false);
      break;
    }
  }
});

// ── Initialization ──────────────────────────────────────────────────

async function init(): Promise<void> {
  initTheme();
  await initViews();

  // Load saved default mode from preferences
  try {
    const result = await chrome.storage.local.get('work-bestie-preferences');
    const prefs = result['work-bestie-preferences'];
    selectMode(prefs?.defaultSessionMode || 'open-focus');
  } catch {
    selectMode('open-focus');
  }

  // Wire session mode buttons
  document.querySelectorAll('.session-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') as SessionMode;
      if (mode && !sessionActive) selectMode(mode);
    });
  });

  // Wire start/stop button
  $('btn-session')?.addEventListener('click', () => {
    if (sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  });

  // Wire theme toggle
  $('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // Wire settings button → show settings view
  $('btn-settings')?.addEventListener('click', () => showView('settings'));

  // Wire focus button → show main view
  $('btn-focus')?.addEventListener('click', () => showView('main'));

  // Wire nav bar
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view') as ViewName | null;
      if (view) showView(view);
    });
  });

  // Wire dismiss summary
  $('btn-dismiss-summary')?.addEventListener('click', hideSessionSummary);

  // Initialize onboarding module
  await initOnboarding();

  // Initialize settings module
  await initSettings();

  // Initialize stats module
  await initStats();

  // Request current session state from background
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' });
    if (response && response.state) {
      const state = response.state as SessionState;
      updateSessionButton(state.isActive);
      updateTimerDisplay(state);
      updateQuickStats(state.elapsedMs, state.distractionsThisSession);
      if (state.mode) selectMode(state.mode);
      refreshStats(undefined, state);
    }
  } catch {
    // Background may not be ready yet
  }
}

document.addEventListener('DOMContentLoaded', init);
