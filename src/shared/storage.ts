import { STORAGE_KEYS, DEFAULT_SITE_LISTS } from "./constants";
import type {
  UserPreferences,
  SiteListMap,
  Stats,
  SessionState,
} from "./types";

// ── Defaults ────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingComplete: false,
  voicePreset: "female",
  roastIntensity: "medium",
  defaultSessionMode: "open-focus",
  apiKey: "sk_408044152e86d3eb0f17f3a5c53123b91a6981cbc05f0f51",
  apiKeyValidated: true,
};

const DEFAULT_STATS: Stats = {
  totalFocusTimeMs: 0,
  totalDistractionsCaught: 0,
  currentStreak: 0,
  lastSessionDate: "",
  sessionsCompleted: 0,
};

const DEFAULT_SESSION_STATE: SessionState = {
  isActive: false,
  mode: "open-focus",
  startTimestamp: 0,
  elapsedMs: 0,
  remainingMs: null,
  isPomodoroBreak: false,
  pomodoroWorkMs: 25 * 60 * 1000,
  pomodoroBreakMs: 5 * 60 * 1000,
  currentIntervalStartMs: 0,
  distractionsThisSession: 0,
};

// ── Pure serialization helpers (for round-trip testing) ─────────────

export function serializePreferences(prefs: UserPreferences): string {
  return JSON.stringify(prefs);
}

export function deserializePreferences(data: string): UserPreferences {
  const parsed = JSON.parse(data) as UserPreferences;
  return {
    onboardingComplete: parsed.onboardingComplete ?? DEFAULT_PREFERENCES.onboardingComplete,
    voicePreset: parsed.voicePreset ?? DEFAULT_PREFERENCES.voicePreset,
    roastIntensity: parsed.roastIntensity ?? DEFAULT_PREFERENCES.roastIntensity,
    defaultSessionMode: parsed.defaultSessionMode ?? DEFAULT_PREFERENCES.defaultSessionMode,
    apiKey: parsed.apiKey ?? DEFAULT_PREFERENCES.apiKey,
    apiKeyValidated: parsed.apiKeyValidated ?? DEFAULT_PREFERENCES.apiKeyValidated,
  };
}

// ── Preferences ─────────────────────────────────────────────────────

export async function getPreferences(): Promise<UserPreferences> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES);
  const stored = result[STORAGE_KEYS.PREFERENCES];
  if (!stored) return { ...DEFAULT_PREFERENCES };
  const merged = { ...DEFAULT_PREFERENCES, ...stored };
  // If stored apiKey is empty, fall back to the bundled default
  if (!merged.apiKey && DEFAULT_PREFERENCES.apiKey) {
    merged.apiKey = DEFAULT_PREFERENCES.apiKey;
    merged.apiKeyValidated = DEFAULT_PREFERENCES.apiKeyValidated;
  }
  return merged;
}

export async function setPreferences(prefs: UserPreferences): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PREFERENCES]: prefs });
}

// ── Site Lists ──────────────────────────────────────────────────────

export async function getSiteLists(): Promise<SiteListMap> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_LISTS);
  const stored = result[STORAGE_KEYS.SITE_LISTS];
  if (!stored) return { ...DEFAULT_SITE_LISTS };
  return { ...DEFAULT_SITE_LISTS, ...stored };
}

export async function setSiteLists(lists: SiteListMap): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SITE_LISTS]: lists });
}

// ── Stats ───────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
  const stored = result[STORAGE_KEYS.STATS];
  if (!stored) return { ...DEFAULT_STATS };
  return { ...DEFAULT_STATS, ...stored };
}

export async function setStats(stats: Stats): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
}

// ── Session State ───────────────────────────────────────────────────

export async function getSessionState(): Promise<SessionState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SESSION_STATE);
  const stored = result[STORAGE_KEYS.SESSION_STATE];
  if (!stored) return { ...DEFAULT_SESSION_STATE };
  return { ...DEFAULT_SESSION_STATE, ...stored };
}

export async function setSessionState(state: SessionState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SESSION_STATE]: state });
}

// ── Onboarding Step ─────────────────────────────────────────────────

export async function getOnboardingStep(): Promise<number> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ONBOARDING_STEP);
  return result[STORAGE_KEYS.ONBOARDING_STEP] ?? 0;
}

export async function setOnboardingStep(step: number): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING_STEP]: step });
}
