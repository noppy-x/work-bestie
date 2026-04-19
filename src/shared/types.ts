// ── Voice & Personality ──────────────────────────────────────────────
export type VoicePreset = "male" | "female";
export type RoastIntensity = "soft" | "medium" | "savage";

// ── Session ─────────────────────────────────────────────────────────
export type SessionMode = "open-focus" | "1-hour" | "2-hour" | "pomodoro";

// ── Distraction Categories ──────────────────────────────────────────
export type DistractionCategory =
  | "social-media"
  | "entertainment"
  | "news"
  | "gaming"
  | "shopping"
  | "custom";

// ── User Preferences (Chrome Storage) ───────────────────────────────
export interface UserPreferences {
  onboardingComplete: boolean;
  voicePreset: VoicePreset;
  roastIntensity: RoastIntensity;
  defaultSessionMode: SessionMode;
  apiKey: string;
  apiKeyValidated: boolean;
}

// ── Session State ───────────────────────────────────────────────────
export interface SessionState {
  isActive: boolean;
  mode: SessionMode;
  startTimestamp: number;
  elapsedMs: number;
  remainingMs: number | null;
  isPomodoroBreak: boolean;
  pomodoroWorkMs: number;
  pomodoroBreakMs: number;
  currentIntervalStartMs: number;
  distractionsThisSession: number;
}

// ── Session Summary ─────────────────────────────────────────────────
export interface SessionSummary {
  mode: SessionMode;
  totalFocusTimeMs: number;
  distractionsCaught: number;
  startTimestamp: number;
  endTimestamp: number;
  pomodoroIntervalsCompleted: number;
}

// ── Stats (Chrome Storage) ──────────────────────────────────────────
export interface Stats {
  totalFocusTimeMs: number;
  totalDistractionsCaught: number;
  currentStreak: number;
  lastSessionDate: string; // ISO date "YYYY-MM-DD"
  sessionsCompleted: number;
}

// ── Phrase Pool (IndexedDB) ─────────────────────────────────────────
export interface PhrasePoolEntry {
  id: string;
  category: DistractionCategory;
  intensity: RoastIntensity;
  text: string;
  voicePreset: VoicePreset;
  audioBlob: Blob;
  createdAt: number;
}

// ── Escalation State (in-memory, service worker) ────────────────────
export interface EscalationState {
  currentDistractionDomain: string | null;
  firstRoastTimestamp: number | null;
  escalationLevel: 0 | 1 | 2;
  roastsDelivered: number;
  baseVolume: number;
}

// ── Site Lists ──────────────────────────────────────────────────────
export type SiteListMap = Record<DistractionCategory, string[]>;

// ── Roast Templates ─────────────────────────────────────────────────
export interface RoastTemplate {
  category: DistractionCategory;
  intensity: RoastIntensity;
  templates: string[];
}

// ── Distraction Match ───────────────────────────────────────────────
export interface DistractionMatch {
  category: DistractionCategory;
  domain: string;
}
