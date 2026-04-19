// Work Bestie — Background Service Worker
// Entry point: wires session management, tab monitoring, escalation, and badge updates

import type { Message } from "../shared/messages";
import type { RoastIntensity, VoicePreset } from "../shared/types";
import { getPreferences, setPreferences, setSessionState } from "../shared/storage";
import { VOICE_CONFIG, ROAST_TEMPLATES, POSITIVE_FEEDBACK, SESSION_COMPLETE_FEEDBACK, SESSION_START } from "../shared/constants";
import {
  startSession,
  stopSession,
  handleSessionTick,
  restoreSession,
  isSessionActive,
  getActiveSession,
} from "./session-manager";
import { initTabMonitor, resetTabMonitorState } from "./tab-monitor";
import {
  handleDistractionDetected,
  handleSafeNavigation,
  recordRoastDelivered,
} from "./escalation-manager";
import { updateBadge, clearBadge } from "./badge-manager";

// ── TTS Generation (direct from service worker) ────────────────────

async function generateRoastAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<ArrayBuffer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[Work Bestie] TTS API error:", response.status);
      return null;
    }

    return await response.arrayBuffer();
  } catch (e) {
    console.error("[Work Bestie] TTS generation failed:", e);
    return null;
  }
}

function formatSiteName(domain: string): string {
  return domain
    .replace(/\.(com|org|net|io|co\.uk|tv|app)$/, '')
    .split('.').pop()!
    .replace(/^./, c => c.toUpperCase());
}

function getRandomRoastText(
  category: string,
  intensity: RoastIntensity,
  siteName: string
): string {
  const formatted = formatSiteName(siteName);
  const entry = ROAST_TEMPLATES.find(
    (t) => t.category === category && t.intensity === intensity
  );
  if (!entry || entry.templates.length === 0) {
    return `Hey, get off ${formatted} and get back to work!`;
  }
  const template = entry.templates[Math.floor(Math.random() * entry.templates.length)];
  return template.replace(/\{site\}/g, formatted);
}

// ── Smart Reaction Timing — cancellation instead of queuing ─────────

let pendingPositiveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastRoastTimestamp = 0;
let isCurrentlyPlaying = false;

async function playReaction(text: string, volume: number): Promise<void> {
  if (isCurrentlyPlaying) return; // Skip if something is already playing
  isCurrentlyPlaying = true;
  try {
    const prefs = await getPreferences();
    if (!prefs.apiKey) return;
    const voiceId = VOICE_CONFIG[prefs.voicePreset as VoicePreset].voiceId;
    console.log("[WorkBestie] Playing:", text);
    const audioData = await generateRoastAudio(text, voiceId, prefs.apiKey);
    if (audioData) {
      await ensureOffscreenDocument();
      await sendAudioToOffscreen(audioData, volume);
    }
  } catch (e) {
    console.error("[Work Bestie] Reaction playback failed:", e);
  } finally {
    isCurrentlyPlaying = false;
  }
}

function playRoastImmediate(text: string, volume: number): void {
  // Cancel any pending positive feedback
  if (pendingPositiveTimeout) {
    clearTimeout(pendingPositiveTimeout);
    pendingPositiveTimeout = null;
  }
  lastRoastTimestamp = Date.now();
  playReaction(text, volume);
}

function playPositiveDelayed(templates: string[]): void {
  // Cancel any existing pending positive
  if (pendingPositiveTimeout) {
    clearTimeout(pendingPositiveTimeout);
  }
  // Delay 500ms — if a roast triggers within this window, it cancels
  pendingPositiveTimeout = setTimeout(() => {
    pendingPositiveTimeout = null;
    // Don't play if a roast happened in the last 3 seconds
    if (Date.now() - lastRoastTimestamp < 3000) {
      console.log("[Work Bestie] Skipping positive — too close to last roast");
      return;
    }
    const text = templates[Math.floor(Math.random() * templates.length)];
    playReaction(text, 0.5); // sfxAfter for positive
  }, 500);
}

// ── Offscreen document for audio playback ───────────────────────────

const OFFSCREEN_URL = "offscreen.html";
let offscreenReady = false;

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenReady) return;
  
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
    });
    if (contexts.length > 0) {
      offscreenReady = true;
      return;
    }
  } catch {
    // getContexts might not be available
  }

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: "Play TTS roasts and SFX audio",
    });
    offscreenReady = true;
    // Wait for the document to load its scripts
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("[Work Bestie] Offscreen document created");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("single offscreen") || msg.includes("already")) {
      offscreenReady = true;
      // Document exists but might need a moment if service worker just restarted
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      console.error("[Work Bestie] Offscreen creation failed:", e);
      throw e;
    }
  }
}

async function sendAudioToOffscreen(audioData: ArrayBuffer, volume: number): Promise<void> {
  // Convert to base64
  const bytes = new Uint8Array(audioData);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  console.log("[WorkBestie] Sending audio to offscreen, base64 length:", base64.length);
  
  const msg = { type: "PLAY_AUDIO_DATA", audioBase64: base64, volume };
  
  try {
    const response = await chrome.runtime.sendMessage(msg);
    console.log("[Work Bestie] Offscreen playback response:", response);
  } catch (e) {
    console.warn("[Work Bestie] First send failed, recreating offscreen and retrying...");
    // Offscreen might have died — recreate and retry
    offscreenReady = false;
    try {
      await ensureOffscreenDocument();
      const response = await chrome.runtime.sendMessage(msg);
      console.log("[Work Bestie] Retry playback response:", response);
    } catch (e2) {
      console.error("[Work Bestie] Retry also failed:", e2);
    }
  }
}

// ── Tab monitor callbacks ───────────────────────────────────────────

let wasOnDistractionSite = false;

async function onDistraction(event: {
  category: string;
  domain: string;
  siteName: string;
  siteUrl: string;
}): Promise<void> {
  console.log("[Work Bestie] onDistraction fired:", event.domain, event.category);
  const prefs = await getPreferences();
  const baseIntensity: RoastIntensity = prefs.roastIntensity;
  const baseVolume = 0.6;

  const escalation = handleDistractionDetected(
    event.domain,
    baseIntensity,
    baseVolume
  );

  // Update badge to red (distraction detected)
  updateBadge(true, true);
  wasOnDistractionSite = true;

  if (escalation.shouldRoast) {
    const voiceId = VOICE_CONFIG[prefs.voicePreset as VoicePreset].voiceId;
    const roastText = getRandomRoastText(event.category, escalation.intensity, event.siteName);

    console.log("[Work Bestie] Queuing roast:", roastText);
    playRoastImmediate(roastText, escalation.volume);
    recordRoastDelivered();

    // Update distraction count and persist
    const session = await getActiveSession();
    if (session.isActive) {
      session.distractionsThisSession += 1;
      await setSessionState(session);
    }
  }
}

function onSafeNavigation(): void {
  handleSafeNavigation();

  if (isSessionActive()) {
    updateBadge(true, false);
    // Play positive feedback only when leaving a distraction site
    if (wasOnDistractionSite) {
      wasOnDistractionSite = false;
      playPositiveDelayed(POSITIVE_FEEDBACK);
    }
  } else {
    clearBadge();
  }
}

// ── Initialize tab monitor ──────────────────────────────────────────

function setupTabMonitor(): void {
  initTabMonitor(onDistraction, onSafeNavigation);
}


// ── Message listener (popup → service worker) ───────────────────────

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.type) {
      case "START_SESSION": {
        (async () => {
          try {
            await startSession(message.mode);
            updateBadge(true, false);
            sendResponse({ success: true });
            // Play session start message
            await ensureOffscreenDocument();
            const startText = SESSION_START[Math.floor(Math.random() * SESSION_START.length)];
            playReaction(startText, 0.5);
          } catch (e) {
            console.error("[Work Bestie] Failed to start session:", e);
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }

      case "STOP_SESSION": {
        (async () => {
          try {
            const summary = await stopSession();
            clearBadge();
            resetTabMonitorState();
            sendResponse({ success: true, summary });
            // Play session complete feedback after responding
            const endText = SESSION_COMPLETE_FEEDBACK[Math.floor(Math.random() * SESSION_COMPLETE_FEEDBACK.length)];
            playReaction(endText, 0.5);
          } catch (e) {
            console.error("[Work Bestie] Failed to stop session:", e);
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }

      case "GET_SESSION_STATE": {
        (async () => {
          try {
            await restoreSession();
            const session = await getActiveSession();
            // Recalculate elapsed for accuracy
            if (session.isActive && session.startTimestamp > 0) {
              session.elapsedMs = Date.now() - session.startTimestamp;
            }
            sendResponse({ success: true, state: session });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }

      case "SETTINGS_UPDATED": {
        (async () => {
          try {
            const prefs = await getPreferences();
            if (message.voicePreset) prefs.voicePreset = message.voicePreset;
            if (message.roastIntensity) prefs.roastIntensity = message.roastIntensity;
            await setPreferences(prefs);
            sendResponse({ success: true });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }

      case "ROAST_DELIVERED": {
        recordRoastDelivered();
        break;
      }

      default:
        break;
    }

    return false;
  }
);

// ── Alarm listener (session ticks) ──────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "session-tick") {
    handleSessionTick();
  }
});

// ── Service worker startup ──────────────────────────────────────────

// Ensure tab monitor is set up on every service worker activation
setupTabMonitor();

(async () => {
  console.log("[Work Bestie] Service worker loaded 🚀");

  try {
    await restoreSession();

    const session = await getActiveSession();
    if (session.isActive) {
      console.log("[Work Bestie] Restored active session");
      updateBadge(true, false);
    } else {
      clearBadge();
    }
  } catch (e) {
    console.error("[Work Bestie] Error during startup:", e);
  }
})();
