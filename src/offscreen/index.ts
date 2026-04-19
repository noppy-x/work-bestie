// WorkBestie — Offscreen Document (voice only)

console.log('[WorkBestie] Offscreen document loaded');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PLAY_AUDIO_DATA') {
    const base64 = message.audioBase64 as string;
    const volume = message.volume ?? 0.6;
    playBase64Audio(base64, volume)
      .then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: String(e) }));
    return true;
  }
  return false;
});

async function playBase64Audio(base64: string, volume: number): Promise<void> {
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  audio.volume = Math.max(0, Math.min(volume, 1));
  return new Promise<void>((resolve, reject) => {
    audio.addEventListener('ended', () => resolve());
    audio.addEventListener('error', (e) => reject(e));
    audio.play().catch(reject);
  });
}
