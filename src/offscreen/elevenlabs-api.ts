// Work Bestie — ElevenLabs API Client
// Handles TTS generation, SFX generation, and API key validation

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const TTS_TIMEOUT_MS = 5000;

/**
 * Generate text-to-speech audio via ElevenLabs TTS API.
 * Uses the eleven_multilingual_v2 model with tuned voice settings.
 *
 * @param text - The text to convert to speech
 * @param voiceId - ElevenLabs voice ID
 * @param apiKey - ElevenLabs API key
 * @returns Audio Blob (MP3)
 * @throws On network error, API error, or timeout (5s)
 */
export async function generateTTS(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `ElevenLabs TTS API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("ElevenLabs TTS API request timed out after 5 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate a sound effect via ElevenLabs Sound Generation API.
 *
 * @param description - Text description of the desired sound effect
 * @param apiKey - ElevenLabs API key
 * @returns Audio Blob
 * @throws On network error or API error
 */
export async function generateSFX(
  description: string,
  apiKey: string
): Promise<Blob> {
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/sound-generation`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: description,
        duration_seconds: 2.0,
        prompt_influence: 0.5,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs SFX API error: ${response.status} ${response.statusText}`
    );
  }

  return await response.blob();
}

/**
 * Validate an ElevenLabs API key by making a test request to the voices endpoint.
 *
 * @param apiKey - ElevenLabs API key to validate
 * @returns true if the key is valid (200 response), false otherwise
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    // Use a minimal TTS request to validate — works even with limited-permission keys
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/EXAVITQu4vr4xnSDxMaL`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "hi",
          model_id: "eleven_multilingual_v2",
        }),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
