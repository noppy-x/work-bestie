/**
 * Masks an API key for display, showing first 4 and last 4 characters
 * with asterisks in between for keys ≥ 8 chars. Shorter keys are fully masked.
 */
export function maskApiKey(key: string): string {
  if (key.length === 0) return "";
  if (key.length < 8) return "*".repeat(key.length);
  return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4);
}

/**
 * Determines badge color and text based on session/distraction state.
 * Returns null when no session is active (no badge should be shown).
 */
export function getBadgeColor(
  isActive: boolean,
  isDistraction: boolean
): { color: string; text: string } | null {
  if (!isActive) return null;
  if (isDistraction) return { color: "#EF4444", text: "!" };
  return { color: "#22C55E", text: "✓" };
}
