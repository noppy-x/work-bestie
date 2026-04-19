// Work Bestie — Settings Module
// Handles voice/personality, API key management, and site list editor

import { getPreferences, setPreferences, getSiteLists, setSiteLists } from '../shared/storage';
import { maskApiKey } from '../shared/ui-utils';
import { validateDomain } from '../shared/url-utils';
import { addSiteToCategory, removeSiteFromCategory } from '../shared/site-list-utils';
import type { VoicePreset, RoastIntensity, DistractionCategory, SiteListMap } from '../shared/types';

// ── State ───────────────────────────────────────────────────────────

let currentVoice: VoicePreset = 'female';
let currentIntensity: RoastIntensity = 'medium';
let currentApiKey = '';
let currentSiteLists: SiteListMap | null = null;

const INTENSITY_MAP: RoastIntensity[] = ['soft', 'medium', 'savage'];
const INTENSITY_LABELS: Record<RoastIntensity, string> = {
  soft: 'Soft',
  medium: 'Medium',
  savage: 'Savage',
};

const CATEGORY_LABELS: Record<DistractionCategory, { emoji: string; label: string }> = {
  'social-media': { emoji: '<i class="ph-duotone ph-chat-circle"></i>', label: 'Social Media' },
  entertainment: { emoji: '<i class="ph-duotone ph-film-strip"></i>', label: 'Entertainment' },
  news: { emoji: '<i class="ph-duotone ph-newspaper"></i>', label: 'News' },
  gaming: { emoji: '<i class="ph-duotone ph-game-controller"></i>', label: 'Gaming' },
  shopping: { emoji: '<i class="ph-duotone ph-shopping-bag"></i>', label: 'Shopping' },
  custom: { emoji: '<i class="ph-duotone ph-pencil-simple"></i>', label: 'Custom' },
};

const CATEGORY_ORDER: DistractionCategory[] = [
  'social-media', 'entertainment', 'news', 'gaming', 'shopping', 'custom',
];

// ── DOM Helpers ─────────────────────────────────────────────────────

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// ── Persistence Helpers ─────────────────────────────────────────────

async function persistSettings(): Promise<void> {
  const prefs = await getPreferences();
  prefs.voicePreset = currentVoice;
  prefs.roastIntensity = currentIntensity;
  await setPreferences(prefs);

  // Notify service worker
  try {
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATED',
      voicePreset: currentVoice,
      roastIntensity: currentIntensity,
    });
  } catch {
    // Background may not be ready
  }
}

// ── Voice Preset ────────────────────────────────────────────────────

function updateVoiceUI(): void {
  document.querySelectorAll('.voice-toggle-btn').forEach((btn) => {
    const voice = btn.getAttribute('data-settings-voice');
    if (voice === currentVoice) {
      btn.classList.add('voice-toggle-active');
    } else {
      btn.classList.remove('voice-toggle-active');
    }
  });
}

function selectVoice(voice: VoicePreset): void {
  currentVoice = voice;
  updateVoiceUI();
  persistSettings();
}

// ── Roast Intensity ─────────────────────────────────────────────────

function updateIntensityUI(): void {
  const slider = $('settings-intensity-slider') as HTMLInputElement | null;
  const label = $('settings-intensity-label');
  if (slider) slider.value = String(INTENSITY_MAP.indexOf(currentIntensity));
  if (label) label.textContent = INTENSITY_LABELS[currentIntensity];
}

function onIntensityChange(value: number): void {
  currentIntensity = INTENSITY_MAP[value] ?? 'medium';
  updateIntensityUI();
  persistSettings();
}

// ── API Key Management ──────────────────────────────────────────────

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

function showSavedKeyUI(): void {
  const savedArea = $('settings-api-key-saved');
  const inputArea = $('settings-api-key-input-area');
  const maskedEl = $('settings-api-key-masked');

  if (savedArea) savedArea.style.display = 'block';
  if (inputArea) inputArea.style.display = 'none';
  if (maskedEl) maskedEl.textContent = maskApiKey(currentApiKey);
}

function showKeyInputUI(): void {
  const savedArea = $('settings-api-key-saved');
  const inputArea = $('settings-api-key-input-area');
  const statusEl = $('settings-api-key-status');
  const input = $('settings-api-key-input') as HTMLInputElement | null;

  if (savedArea) savedArea.style.display = 'none';
  if (inputArea) inputArea.style.display = 'block';
  if (statusEl) { statusEl.textContent = ''; statusEl.className = 'text-xs mt-1'; }
  if (input) { input.value = ''; input.focus(); }
}

async function handleValidateKey(): Promise<void> {
  const input = $('settings-api-key-input') as HTMLInputElement | null;
  const statusEl = $('settings-api-key-status');
  const validateBtn = $('btn-settings-validate-key');
  if (!input || !statusEl) return;

  const key = input.value.trim();
  if (!key) {
    statusEl.textContent = 'please enter an API key';
    statusEl.className = 'text-xs mt-1 api-key-error';
    return;
  }

  statusEl.innerHTML = '<span class="spinner"></span> validating...';
  statusEl.className = 'text-xs mt-1 api-key-loading';
  if (validateBtn) validateBtn.setAttribute('disabled', 'true');

  const valid = await validateApiKey(key);

  if (validateBtn) validateBtn.removeAttribute('disabled');

  if (valid) {
    currentApiKey = key;
    const prefs = await getPreferences();
    prefs.apiKey = key;
    prefs.apiKeyValidated = true;
    await setPreferences(prefs);
    statusEl.textContent = '✅ key saved!';
    statusEl.className = 'text-xs mt-1 api-key-success';
    setTimeout(() => showSavedKeyUI(), 800);
  } else {
    statusEl.textContent = '❌ invalid key, try again';
    statusEl.className = 'text-xs mt-1 api-key-error';
  }
}

async function handleRemoveKey(): Promise<void> {
  currentApiKey = '';
  const prefs = await getPreferences();
  prefs.apiKey = '';
  prefs.apiKeyValidated = false;
  await setPreferences(prefs);
  showKeyInputUI();
}

// ── Site List Editor ────────────────────────────────────────────────

function renderSiteCategories(): void {
  const container = $('settings-site-categories');
  if (!container || !currentSiteLists) return;

  container.innerHTML = '';

  for (const category of CATEGORY_ORDER) {
    const sites = currentSiteLists[category] ?? [];
    const info = CATEGORY_LABELS[category];

    const section = document.createElement('div');
    section.className = 'site-category-section';

    // Header (collapsible)
    const header = document.createElement('button');
    header.className = 'site-category-header';
    header.setAttribute('aria-expanded', 'true');
    header.innerHTML = `<span>${info.emoji} ${info.label} <span class="text-muted text-xs">(${sites.length})</span></span><span class="site-category-chevron">▼</span>`;

    const body = document.createElement('div');
    body.className = 'site-category-body';

    if (sites.length === 0) {
      body.innerHTML = '<p class="text-muted text-xs" style="padding: 6px 0;">no sites yet</p>';
    } else {
      for (const site of sites) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${site} <button class="chip-remove" data-category="${category}" data-site="${site}" aria-label="Remove ${site}">×</button>`;
        body.appendChild(chip);
      }
    }

    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!expanded));
      body.style.display = expanded ? 'none' : 'flex';
      const chevron = header.querySelector('.site-category-chevron');
      if (chevron) chevron.textContent = expanded ? '▶' : '▼';
    });

    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }

  // Wire remove buttons
  container.querySelectorAll('.chip-remove').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const category = target.getAttribute('data-category') as DistractionCategory;
      const site = target.getAttribute('data-site');
      if (category && site && currentSiteLists) {
        currentSiteLists = removeSiteFromCategory(currentSiteLists, site, category);
        await setSiteLists(currentSiteLists);
        renderSiteCategories();
      }
    });
  });
}

async function handleAddSite(): Promise<void> {
  const input = $('settings-add-site-input') as HTMLInputElement | null;
  const errorEl = $('settings-add-site-error');
  if (!input || !errorEl || !currentSiteLists) return;

  let domain = input.value.trim().toLowerCase();
  if (!domain) return;

  // Strip protocol if user pasted a full URL
  try {
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(domain).hostname.replace(/^www\./, '');
    }
  } catch {
    // keep as-is
  }

  if (!validateDomain(domain)) {
    errorEl.textContent = 'invalid domain — use format like example.com';
    errorEl.style.display = 'block';
    input.classList.add('input-error');
    return;
  }

  errorEl.style.display = 'none';
  input.classList.remove('input-error');

  const result = addSiteToCategory(currentSiteLists, domain);
  if (result.success) {
    currentSiteLists = result.siteLists;
    await setSiteLists(currentSiteLists);
    input.value = '';
    renderSiteCategories();
  } else {
    errorEl.textContent = result.error ?? 'could not add site';
    errorEl.style.display = 'block';
  }
}

// ── Wire Events ─────────────────────────────────────────────────────

function wireSettingsEvents(): void {
  // Voice toggle buttons
  document.querySelectorAll('.voice-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const voice = btn.getAttribute('data-settings-voice') as VoicePreset;
      if (voice) selectVoice(voice);
    });
  });

  // Intensity slider
  const slider = $('settings-intensity-slider') as HTMLInputElement | null;
  slider?.addEventListener('input', () => {
    onIntensityChange(parseInt(slider.value, 10));
  });

  // API key validate
  $('btn-settings-validate-key')?.addEventListener('click', handleValidateKey);

  // API key update/remove
  $('btn-settings-update-key')?.addEventListener('click', showKeyInputUI);
  $('btn-settings-remove-key')?.addEventListener('click', handleRemoveKey);

  // Add site
  $('btn-settings-add-site')?.addEventListener('click', handleAddSite);
  const siteInput = $('settings-add-site-input') as HTMLInputElement | null;
  siteInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddSite();
  });
  // Clear error on input
  siteInput?.addEventListener('input', () => {
    const errorEl = $('settings-add-site-error');
    if (errorEl) errorEl.style.display = 'none';
    siteInput.classList.remove('input-error');
  });
}

// ── Initialize ──────────────────────────────────────────────────────

export async function initSettings(): Promise<void> {
  wireSettingsEvents();

  // Load current preferences
  try {
    const prefs = await getPreferences();
    currentVoice = prefs.voicePreset;
    currentIntensity = prefs.roastIntensity;
    currentApiKey = prefs.apiKey;

    updateVoiceUI();
    updateIntensityUI();

    // Show saved key or input
    if (currentApiKey && prefs.apiKeyValidated) {
      showSavedKeyUI();
    } else {
      showKeyInputUI();
    }
  } catch {
    showKeyInputUI();
  }

  // Load site lists
  try {
    currentSiteLists = await getSiteLists();
    renderSiteCategories();
  } catch {
    // ignore
  }
}

/**
 * Returns true if a valid API key is configured.
 * Used by session start to block if no key.
 */
export async function hasValidApiKey(): Promise<boolean> {
  const prefs = await getPreferences();
  return !!(prefs.apiKey && prefs.apiKeyValidated);
}
