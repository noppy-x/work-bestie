import type { RoastIntensity, EscalationState } from "../shared/types";
import {
  getEscalatedIntensity,
  getEscalatedVolume,
  resetEscalation,
} from "../shared/escalation";

// ── Escalation timing thresholds (ms since first roast) ─────────────

const ESCALATION_LEVEL_1_MS = 30_000; // 30 seconds → level 1
const ESCALATION_LEVEL_2_MS = 60_000; // 60 seconds → level 2

// ── In-memory escalation state ──────────────────────────────────────

let state: EscalationState = {
  currentDistractionDomain: null,
  firstRoastTimestamp: null,
  escalationLevel: 0,
  roastsDelivered: 0,
  baseVolume: 0.6,
};

// ── Helpers ─────────────────────────────────────────────────────────

function computeEscalationLevel(msSinceFirstRoast: number): 0 | 1 | 2 {
  if (msSinceFirstRoast >= ESCALATION_LEVEL_2_MS) return 2;
  if (msSinceFirstRoast >= ESCALATION_LEVEL_1_MS) return 1;
  return 0;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Called when a distraction is detected on a given domain.
 * Determines whether a roast should fire and at what intensity/volume.
 */
export function handleDistractionDetected(
  domain: string,
  baseIntensity: RoastIntensity,
  baseVolume: number
): { intensity: RoastIntensity; volume: number; shouldRoast: boolean } {
  const now = Date.now();

  // New distraction domain — initialize fresh escalation state
  if (state.currentDistractionDomain !== domain) {
    state = {
      currentDistractionDomain: domain,
      firstRoastTimestamp: null,
      escalationLevel: 0,
      roastsDelivered: 0,
      baseVolume,
    };

    // First roast for this domain — always fire
    return {
      intensity: getEscalatedIntensity(baseIntensity, 0),
      volume: getEscalatedVolume(baseVolume, 0),
      shouldRoast: true,
    };
  }

  // Same domain — check if escalation timers have triggered
  if (state.firstRoastTimestamp === null) {
    // No roast delivered yet for this domain — fire at base level
    return {
      intensity: getEscalatedIntensity(baseIntensity, state.escalationLevel),
      volume: getEscalatedVolume(baseVolume, state.escalationLevel),
      shouldRoast: true,
    };
  }

  const elapsed = now - state.firstRoastTimestamp;
  const newLevel = computeEscalationLevel(elapsed);

  // Only roast if we've reached a new escalation level
  if (newLevel > state.escalationLevel) {
    state.escalationLevel = newLevel;
    state.baseVolume = baseVolume;

    return {
      intensity: getEscalatedIntensity(baseIntensity, newLevel),
      volume: getEscalatedVolume(baseVolume, newLevel),
      shouldRoast: true,
    };
  }

  // Not enough time has passed since last roast — suppress
  return {
    intensity: getEscalatedIntensity(baseIntensity, state.escalationLevel),
    volume: getEscalatedVolume(baseVolume, state.escalationLevel),
    shouldRoast: false,
  };
}

/**
 * Called when the user navigates away from a distraction site.
 * Resets escalation state for the browsing episode.
 */
export function handleSafeNavigation(): void {
  state = resetEscalation(state);
}

/**
 * Returns the current in-memory escalation state.
 */
export function getEscalationState(): EscalationState {
  return { ...state };
}

/**
 * Record that a roast was successfully delivered.
 * Updates firstRoastTimestamp (if first) and increments roastsDelivered.
 */
export function recordRoastDelivered(): void {
  if (state.firstRoastTimestamp === null) {
    state.firstRoastTimestamp = Date.now();
  }
  state.roastsDelivered += 1;
}

/**
 * Reset internal state for testing purposes only.
 * @internal
 */
export function _resetForTesting(): void {
  state = {
    currentDistractionDomain: null,
    firstRoastTimestamp: null,
    escalationLevel: 0,
    roastsDelivered: 0,
    baseVolume: 0.6,
  };
}
