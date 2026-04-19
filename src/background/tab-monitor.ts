import type { DistractionCategory, SiteListMap } from "../shared/types";
import { extractDomain, isDistractionSite } from "../shared/url-utils";
import { getSiteLists, getSessionState } from "../shared/storage";
import { isSessionActive, restoreSession } from "./session-manager";

// ── Types ───────────────────────────────────────────────────────────

export interface DistractionEvent {
  category: DistractionCategory;
  domain: string;
  siteName: string;
  siteUrl: string;
}

type OnDistractionCallback = (event: DistractionEvent) => void;
type OnSafeNavigationCallback = () => void;

// ── Internal state ──────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastDetectedDomain: string | null = null;
let lastDetectedTime: number = 0;
let isOnDistraction = false;

const DEBOUNCE_MS = 500;
const COOLDOWN_MS = 30_000; // allow re-roast after 30 seconds on same domain

// Stored callbacks
let onDistractionCb: OnDistractionCallback | null = null;
let onSafeNavigationCb: OnSafeNavigationCallback | null = null;

// ── Core detection logic ────────────────────────────────────────────

async function checkTab(tabId: number, url: string | undefined): Promise<void> {
  if (!url) return;

  const domain = extractDomain(url);
  if (!domain) return;

  // Skip if same domain detected recently (avoid spam), but allow re-roast after cooldown
  if (domain === lastDetectedDomain && isOnDistraction) {
    const elapsed = Date.now() - lastDetectedTime;
    if (elapsed < COOLDOWN_MS) return;
  }

  // Check if session is active — try in-memory first, fall back to storage
  // (service worker may have restarted and lost in-memory state)
  if (!isSessionActive()) {
    // Try restoring from storage
    await restoreSession();
    if (!isSessionActive()) {
      // Still not active — check storage directly as last resort
      const storedSession = await getSessionState();
      if (!storedSession.isActive) return;
    }
  }

  // Load site lists and check for distraction match
  const siteLists: SiteListMap = await getSiteLists();
  const match = isDistractionSite(domain, siteLists);

  if (match) {
    console.log(`[Work Bestie] Distraction detected: ${domain} (${match.category})`);
    lastDetectedDomain = domain;
    lastDetectedTime = Date.now();
    isOnDistraction = true;
    onDistractionCb?.({
      category: match.category,
      domain: match.domain,
      siteName: domain,
      siteUrl: url,
    });
  } else {
    // Always reset to safe state when on a non-distraction site
    lastDetectedDomain = null;
    isOnDistraction = false;
    // Always notify safe navigation during active session so icon resets
    onSafeNavigationCb?.();
  }
}

function debouncedCheckTab(tabId: number, url: string | undefined): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    checkTab(tabId, url);
  }, DEBOUNCE_MS);
}

// ── Chrome event handlers ───────────────────────────────────────────

function handleTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  _tab: chrome.tabs.Tab
): void {
  // Only react to URL changes (not title, favicon, etc.)
  if (changeInfo.url) {
    debouncedCheckTab(tabId, changeInfo.url);
  }
}

function handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): void {
  // When user switches tabs, always check the new tab's URL
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    // Reset distraction state on tab switch so we re-evaluate
    const domain = tab.url ? extractDomain(tab.url) : null;
    if (domain !== lastDetectedDomain) {
      isOnDistraction = false;
      lastDetectedDomain = null;
    }
    debouncedCheckTab(activeInfo.tabId, tab.url);
  });
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Initialize the tab monitor with distraction and safe-navigation callbacks.
 * Registers Chrome tab event listeners.
 */
export function initTabMonitor(
  onDistraction: OnDistractionCallback,
  onSafeNavigation: OnSafeNavigationCallback
): void {
  onDistractionCb = onDistraction;
  onSafeNavigationCb = onSafeNavigation;

  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  chrome.tabs.onActivated.addListener(handleTabActivated);
}

/**
 * Reset internal tab monitor state. Useful for testing or session end cleanup.
 */
export function resetTabMonitorState(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  lastDetectedDomain = null;
  lastDetectedTime = 0;
  isOnDistraction = false;
}

/**
 * Expose internal state for testing.
 * @internal
 */
export function _getInternalState() {
  return { lastDetectedDomain, isOnDistraction, debounceTimer };
}
