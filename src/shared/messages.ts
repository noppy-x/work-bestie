import type {
  DistractionCategory,
  RoastIntensity,
  SessionMode,
  SessionState,
  Stats,
  VoicePreset,
} from "./types";

// ── Messages sent FROM service worker ───────────────────────────────

export interface PlayRoastMessage {
  type: "PLAY_ROAST";
  category: DistractionCategory;
  intensity: RoastIntensity;
  siteName: string;
  siteUrl: string;
  voicePreset: VoicePreset;
  volume: number;
}

export interface SessionStateMessage {
  type: "SESSION_STATE";
  state: SessionState;
}

export interface TimerTickMessage {
  type: "TIMER_TICK";
  remaining?: number;
  elapsed?: number;
}

export interface StatsUpdatedMessage {
  type: "STATS_UPDATED";
  stats: Stats;
}

// ── Messages sent TO service worker ─────────────────────────────────

export interface StartSessionMessage {
  type: "START_SESSION";
  mode: SessionMode;
}

export interface StopSessionMessage {
  type: "STOP_SESSION";
}

// ── Messages from offscreen → service worker ────────────────────────

export interface RoastDeliveredMessage {
  type: "ROAST_DELIVERED";
  timestamp: number;
}

// ── Commands sent TO offscreen document ─────────────────────────────

export interface PreGeneratePhrasesCommand {
  type: "PRE_GENERATE_PHRASES";
  apiKey: string;
  voicePreset: VoicePreset;
}

// ── Additional useful messages ──────────────────────────────────────

export interface SettingsUpdatedMessage {
  type: "SETTINGS_UPDATED";
  voicePreset?: VoicePreset;
  roastIntensity?: RoastIntensity;
}

export interface ValidateApiKeyMessage {
  type: "VALIDATE_API_KEY";
  apiKey: string;
}

export interface ApiKeyResultMessage {
  type: "API_KEY_RESULT";
  valid: boolean;
  error?: string;
}

// ── Union type for type-safe message handling ───────────────────────

export type Message =
  | PlayRoastMessage
  | SessionStateMessage
  | TimerTickMessage
  | StatsUpdatedMessage
  | StartSessionMessage
  | StopSessionMessage
  | RoastDeliveredMessage
  | PreGeneratePhrasesCommand
  | SettingsUpdatedMessage
  | ValidateApiKeyMessage
  | ApiKeyResultMessage;
