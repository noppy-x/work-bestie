// Work Bestie — Phrase Pool Pre-Generation
// Iterates through roast templates and SFX descriptions to pre-generate audio clips

import type { VoicePreset, DistractionCategory, RoastIntensity } from '../shared/types';
import { ROAST_TEMPLATES, SFX_DESCRIPTIONS, VOICE_CONFIG } from '../shared/constants';
import { generateTTS, generateSFX } from './elevenlabs-api';
import { storePhraseClip } from './phrase-pool-db';

/**
 * Pre-generate TTS phrase pool clips for all roast templates with the given voice preset.
 * Picks the first template text from each template group, generates TTS, and stores in IndexedDB.
 * Errors are logged but never thrown — failed clips are skipped.
 *
 * @param apiKey - ElevenLabs API key
 * @param voicePreset - Voice preset to generate clips for
 * @returns Counts of generated and failed clips
 */
export async function preGeneratePhrasePool(
  apiKey: string,
  voicePreset: VoicePreset,
): Promise<{ generated: number; failed: number }> {
  const voiceId = VOICE_CONFIG[voicePreset].voiceId;
  let generated = 0;
  let failed = 0;

  for (const template of ROAST_TEMPLATES) {
    const text = template.templates[0];
    if (!text) {
      continue;
    }

    try {
      const audioBlob = await generateTTS(text, voiceId, apiKey);

      await storePhraseClip({
        id: `phrase-${template.category}-${template.intensity}-${voicePreset}-${Date.now()}-${generated}`,
        category: template.category as DistractionCategory,
        intensity: template.intensity as RoastIntensity,
        text,
        voicePreset,
        audioBlob,
        createdAt: Date.now(),
      });

      generated++;
    } catch (error) {
      console.error(
        `[Work Bestie] Failed to generate phrase clip: category=${template.category}, intensity=${template.intensity}`,
        error,
      );
      failed++;
    }
  }

  return { generated, failed };
}


/**
 * Pre-generate SFX clips for each intensity level using SFX_DESCRIPTIONS.
 * Generates audio for each description and stores in IndexedDB with a special "sfx" category marker.
 * Errors are logged but never thrown — failed clips are skipped.
 *
 * @param apiKey - ElevenLabs API key
 * @returns Counts of generated and failed clips
 */
export async function preGenerateSFX(
  apiKey: string,
): Promise<{ generated: number; failed: number }> {
  let generated = 0;
  let failed = 0;

  const intensities = Object.keys(SFX_DESCRIPTIONS) as RoastIntensity[];

  for (const intensity of intensities) {
    const descriptions = SFX_DESCRIPTIONS[intensity];

    for (const description of descriptions) {
      try {
        const audioBlob = await generateSFX(description, apiKey);

        await storePhraseClip({
          id: `sfx-${intensity}-${Date.now()}-${generated}`,
          category: 'custom' as DistractionCategory, // SFX stored with "custom" category as sfx marker
          intensity,
          text: `[sfx] ${description}`,
          voicePreset: 'male', // SFX are voice-independent; use a default
          audioBlob,
          createdAt: Date.now(),
        });

        generated++;
      } catch (error) {
        console.error(
          `[Work Bestie] Failed to generate SFX clip: intensity=${intensity}, description="${description}"`,
          error,
        );
        failed++;
      }
    }
  }

  return { generated, failed };
}
