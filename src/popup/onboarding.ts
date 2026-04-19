// Work Bestie — Onboarding Module
// Multi-step personality quiz with state persistence and resume

import { showView } from './views';
import { getPreferences, setPreferences, getOnboardingStep, setOnboardingStep } from '../shared/storage';
import { VOICE_CONFIG } from '../shared/constants';
import type { VoicePreset, RoastIntensity, SessionMode } from '../shared/types';

// ── State ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
let currentStep = 0;
let selectedVoice: VoicePreset = 'female';
let selectedIntensity: RoastIntensity = 'medium';
let selectedSession: SessionMode = 'open-focus';
let apiKeyValidated = false;
let validatedApiKey = '';

// ── DOM Helpers ─────────────────────────────────────────────────────

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function qAll(selector: string): NodeListOf<Element> {
  return document.querySelectorAll(selector);
}

// ── Step Navigation ─────────────────────────────────────────────────

function showStep(step: number): void {
  currentStep = Math.max(0, Math.min(step, TOTAL_STEPS - 1));

  // Update step visibility
  qAll('.onboarding-step').forEach((el) => {
    const stepIndex = parseInt(el.getAttribute('data-step') ?? '-1', 10);
    if (stepIndex === currentStep) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Update progress dots
  qAll('.onboarding-progress .dot').forEach((dot) => {
    const dotStep = parseInt(dot.getAttribute('data-step') ?? '-1', 10);
    if (dotStep <= currentStep) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Persist step
  setOnboardingStep(currentStep).catch(() => {});
}

function goNext(): void {
  if (currentStep < TOTAL_STEPS - 1) {
    showStep(currentStep + 1);
  }
}

function goBack(): void {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
}

// ── API Key Validation ──────────────────────────────────────────────

async function validateApiKey(key: string): Promise<boolean> {
  try {
    // Use a minimal TTS request to validate — works even with limited-permission keys
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'hi',
        model_id: 'eleven_multilingual_v2',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function updateNextButtonState(): void {
  const step0 = document.querySelector('.onboarding-step[data-step="0"]');
  const nextBtn = step0?.querySelector('.btn-onboarding-next') as HTMLButtonElement | null;
  if (nextBtn) {
    nextBtn.disabled = !apiKeyValidated;
  }
}

// ── Voice Preview ───────────────────────────────────────────────────

async function previewVoice(preset: VoicePreset): Promise<void> {
  if (!validatedApiKey) return;

  const voiceId = VOICE_CONFIG[preset].voiceId;
  const text = preset === 'female'
    ? "Hey bestie! I'm gonna keep you focused today, no cap."
    : "Yo what's good! Let's lock in and get this bread.";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': validatedApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
        }),
      }
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));
    await audio.play();
  } catch {
    // Silently fail preview
  }
}

// ── Selection Handlers ──────────────────────────────────────────────

function selectVoiceCard(preset: VoicePreset): void {
  selectedVoice = preset;
  qAll('.voice-card').forEach((card) => {
    if (card.getAttribute('data-voice') === preset) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function selectIntensityCard(intensity: RoastIntensity): void {
  selectedIntensity = intensity;
  qAll('.intensity-card').forEach((card) => {
    if (card.getAttribute('data-intensity') === intensity) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function selectSessionCard(mode: SessionMode): void {
  selectedSession = mode;
  qAll('.session-card').forEach((card) => {
    if (card.getAttribute('data-session') === mode) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

// ── Finish Onboarding ───────────────────────────────────────────────

async function finishOnboarding(): Promise<void> {
  const prefs = await getPreferences();
  prefs.onboardingComplete = true;
  prefs.voicePreset = selectedVoice;
  prefs.roastIntensity = selectedIntensity;
  prefs.defaultSessionMode = selectedSession;
  // Only overwrite API key if user manually entered one
  if (validatedApiKey) {
    prefs.apiKey = validatedApiKey;
  }
  prefs.apiKeyValidated = true;
  await setPreferences(prefs);

  // Clear onboarding step
  await setOnboardingStep(0);

  // Navigate to main view
  showView('main');

  // Trigger phrase pool pre-generation
  try {
    chrome.runtime.sendMessage({
      type: 'PRE_GENERATE_PHRASES',
      apiKey: prefs.apiKey,
      voicePreset: selectedVoice,
    });
  } catch {
    // Offscreen may not be ready yet
  }
}

// ── Wire Events ─────────────────────────────────────────────────────

function wireEvents(): void {
  // Next buttons
  qAll('.btn-onboarding-next').forEach((btn) => {
    btn.addEventListener('click', goNext);
  });

  // Back buttons
  qAll('.btn-onboarding-back').forEach((btn) => {
    btn.addEventListener('click', goBack);
  });

  // API key validation
  const validateBtn = $('btn-validate-key');
  const apiKeyInput = $('onboarding-api-key') as HTMLInputElement | null;
  const statusEl = $('api-key-status');

  validateBtn?.addEventListener('click', async () => {
    if (!apiKeyInput || !statusEl) return;
    const key = apiKeyInput.value.trim();
    if (!key) {
      statusEl.textContent = 'please enter an API key';
      statusEl.className = 'text-xs mt-1 api-key-error';
      return;
    }

    statusEl.innerHTML = '<span class="spinner"></span> validating...';
    statusEl.className = 'text-xs mt-1 api-key-loading';
    validateBtn.setAttribute('disabled', 'true');

    const valid = await validateApiKey(key);

    validateBtn.removeAttribute('disabled');

    if (valid) {
      apiKeyValidated = true;
      validatedApiKey = key;
      statusEl.textContent = '✅ key is valid! let\'s go';
      statusEl.className = 'text-xs mt-1 api-key-success';
    } else {
      apiKeyValidated = false;
      validatedApiKey = '';
      statusEl.textContent = '❌ invalid key, try again';
      statusEl.className = 'text-xs mt-1 api-key-error';
    }
    updateNextButtonState();
  });

  // Voice selection cards
  qAll('.voice-card').forEach((card) => {
    card.addEventListener('click', () => {
      const voice = card.getAttribute('data-voice') as VoicePreset;
      if (voice) selectVoiceCard(voice);
    });
  });

  // Voice preview buttons
  qAll('.btn-preview-voice').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const voice = btn.getAttribute('data-voice') as VoicePreset;
      if (voice) previewVoice(voice);
    });
  });

  // Intensity selection cards
  qAll('.intensity-card').forEach((card) => {
    card.addEventListener('click', () => {
      const intensity = card.getAttribute('data-intensity') as RoastIntensity;
      if (intensity) selectIntensityCard(intensity);
    });
  });

  // Session type selection cards
  qAll('.session-card').forEach((card) => {
    card.addEventListener('click', () => {
      const mode = card.getAttribute('data-session') as SessionMode;
      if (mode) selectSessionCard(mode);
    });
  });

  // Finish button
  $('btn-finish-onboarding')?.addEventListener('click', finishOnboarding);
}

// ── Initialize ──────────────────────────────────────────────────────

export async function initOnboarding(): Promise<void> {
  wireEvents();

  // Set default selections visually
  selectVoiceCard(selectedVoice);
  selectIntensityCard(selectedIntensity);
  selectSessionCard(selectedSession);

  // Resume at last saved step
  try {
    const savedStep = await getOnboardingStep();
    if (savedStep > 0 && savedStep < TOTAL_STEPS) {
      showStep(savedStep);
    } else {
      showStep(0);
    }
  } catch {
    showStep(0);
  }

  // Check if API key was previously validated (e.g., user closed mid-onboarding)
  // Also handles the bundled default API key
  try {
    const prefs = await getPreferences();
    if (prefs.apiKey && prefs.apiKeyValidated) {
      apiKeyValidated = true;
      validatedApiKey = prefs.apiKey;
      const statusEl = $('api-key-status');
      if (statusEl) {
        statusEl.textContent = '✅ key ready';
        statusEl.className = 'text-xs mt-1 api-key-success';
      }
      updateNextButtonState();

      // If we have a bundled key and we're on step 0, skip to step 1 (voice selection)
      if (currentStep === 0) {
        showStep(1);
      }
    }
  } catch {
    // ignore
  }
}
