import type { RoastIntensity, EscalationState } from "./types";

const INTENSITY_ORDER: RoastIntensity[] = ["soft", "medium", "savage"];

/**
 * Returns the escalated roast intensity based on the base intensity and escalation level.
 * - level 0: base intensity (no change)
 * - level 1: base + 1 step (capped at savage)
 * - level 2: always savage regardless of base
 */
export function getEscalatedIntensity(
  base: RoastIntensity,
  level: 0 | 1 | 2
): RoastIntensity {
  if (level === 2) return "savage";
  const baseIndex = INTENSITY_ORDER.indexOf(base);
  const escalatedIndex = Math.min(baseIndex + level, 2);
  return INTENSITY_ORDER[escalatedIndex];
}

/**
 * Returns the escalated volume based on the base volume and escalation level.
 * Each level adds 0.2 to the base volume, capped at 1.0.
 */
export function getEscalatedVolume(
  baseVolume: number,
  level: 0 | 1 | 2
): number {
  return Math.min(baseVolume + level * 0.2, 1.0);
}

/**
 * Resets escalation state to initial values, preserving the original baseVolume.
 */
export function resetEscalation(state: EscalationState): EscalationState {
  return {
    escalationLevel: 0,
    firstRoastTimestamp: null,
    roastsDelivered: 0,
    currentDistractionDomain: null,
    baseVolume: state.baseVolume,
  };
}
