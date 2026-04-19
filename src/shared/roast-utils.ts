import type {
  PhrasePoolEntry,
  DistractionCategory,
  RoastIntensity,
  VoicePreset,
} from "./types";
import { VOICE_CONFIG, ROAST_TEMPLATES } from "./constants";

/**
 * Filters the phrase pool by category, intensity, and voice preset,
 * then returns a random matching clip or null if none match.
 */
export function selectPhrasePoolClip(
  pool: PhrasePoolEntry[],
  category: DistractionCategory,
  intensity: RoastIntensity,
  voicePreset: VoicePreset
): PhrasePoolEntry | null {
  const matches = pool.filter(
    (entry) =>
      entry.category === category &&
      entry.intensity === intensity &&
      entry.voicePreset === voicePreset
  );

  if (matches.length === 0) {
    return null;
  }

  return matches[Math.floor(Math.random() * matches.length)];
}

/**
 * Constructs an ElevenLabs TTS API request config object.
 * The xi-api-key header is set to a placeholder — the actual key
 * should be injected at call time.
 */
export function buildTTSRequest(
  text: string,
  voicePreset: VoicePreset,
  intensity: RoastIntensity
): { url: string; body: object; headers: Record<string, string> } {
  const { voiceId } = VOICE_CONFIG[voicePreset];

  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    body: {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
      },
    },
    headers: {
      "xi-api-key": "",
      "Content-Type": "application/json",
    },
  };
}

/**
 * Formats a domain name for display in roast messages.
 * "instagram.com" → "Instagram", "m.youtube.com" → "Youtube"
 */
export function formatSiteName(domain: string): string {
  return domain
    .replace(/\.(com|org|net|io|co\.uk|tv|app)$/, '')
    .split('.').pop()!
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Picks a random roast template matching the given category and intensity,
 * replaces the {site} placeholder with the formatted site name, and returns
 * the filled text. Returns a generic fallback if no template matches.
 */
export function getRandomRoastText(
  category: DistractionCategory,
  intensity: RoastIntensity,
  siteName: string
): string {
  const entry = ROAST_TEMPLATES.find(
    (t) => t.category === category && t.intensity === intensity
  );

  const formatted = formatSiteName(siteName);

  if (!entry || entry.templates.length === 0) {
    return `Hey, get off ${formatted} and get back to work!`;
  }

  const template =
    entry.templates[Math.floor(Math.random() * entry.templates.length)];

  return template.replace(/\{site\}/g, formatted);
}
