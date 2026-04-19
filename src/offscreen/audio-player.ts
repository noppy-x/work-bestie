// Work Bestie — Audio Playback Engine
// Handles audio playback via Audio() elements in the offscreen document

/**
 * Play an audio Blob at the specified volume.
 *
 * Creates a blob URL, plays it via an Audio element, and cleans up afterward.
 * Errors are logged and swallowed — the returned promise always resolves.
 *
 * @param blob - Audio data to play
 * @param volume - Playback volume (0.0–1.0)
 */
export function playAudio(blob: Blob, volume: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let blobUrl: string | null = null;

    try {
      blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      audio.volume = Math.max(0, Math.min(volume, 1));

      const cleanup = () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
      };

      audio.addEventListener("ended", () => {
        cleanup();
        resolve();
      });

      audio.addEventListener("error", (e) => {
        console.error("[Work Bestie] Audio playback error:", e);
        cleanup();
        resolve();
      });

      audio.play().catch((err) => {
        console.error("[Work Bestie] Audio play() failed:", err);
        cleanup();
        resolve();
      });
    } catch (err) {
      console.error("[Work Bestie] Audio setup error:", err);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      resolve();
    }
  });
}

/**
 * Play a roast audio clip, optionally preceded by a sound effect.
 *
 * If an SFX blob is provided it plays first, then the roast follows.
 * If sfxBlob is null the roast plays immediately.
 * All errors are handled gracefully — the promise always resolves.
 *
 * @param roastBlob - The roast TTS audio blob
 * @param sfxBlob - Optional SFX audio blob (played before the roast)
 * @param volume - Playback volume (0.0–1.0)
 */
export async function playRoastWithSFX(
  roastBlob: Blob,
  sfxBlob: Blob | null,
  volume: number
): Promise<void> {
  try {
    if (sfxBlob) {
      // Play SFX first, then roast
      await playAudio(sfxBlob, volume);
    }
    await playAudio(roastBlob, volume);
  } catch (err) {
    console.error("[Work Bestie] playRoastWithSFX error:", err);
  }
}
