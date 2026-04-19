// Work Bestie — View Management
// Handles switching between popup views: onboarding, main, stats, settings

export type ViewName = 'onboarding' | 'main' | 'stats' | 'settings';

const VIEW_IDS: Record<ViewName, string> = {
  onboarding: 'view-onboarding',
  main: 'view-main',
  stats: 'view-stats',
  settings: 'view-settings',
};

let currentView: ViewName = 'main';

/**
 * Show a specific view by toggling `.view-active` CSS class.
 * Hides all other views.
 */
export function showView(viewName: ViewName): void {
  for (const [name, id] of Object.entries(VIEW_IDS)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (name === viewName) {
      el.classList.add('view-active');
    } else {
      el.classList.remove('view-active');
    }
  }
  currentView = viewName;

  // Hide nav bar on all views (removed from UI)
  const navBar = document.querySelector('.nav-bar') as HTMLElement | null;
  if (navBar) navBar.style.display = 'none';

  // Hide settings button during onboarding
  const settingsBtn = document.getElementById('btn-settings');
  const focusBtn = document.getElementById('btn-focus');
  if (viewName === 'onboarding') {
    if (settingsBtn) settingsBtn.style.display = 'none';
    if (focusBtn) focusBtn.style.display = 'none';
  } else if (viewName === 'settings') {
    if (settingsBtn) settingsBtn.style.display = 'none';
    if (focusBtn) focusBtn.style.display = '';
  } else {
    if (settingsBtn) settingsBtn.style.display = '';
    if (focusBtn) focusBtn.style.display = 'none';
  }

  // Update nav bar active state
  document.querySelectorAll('.nav-item').forEach((item) => {
    const target = item.getAttribute('data-view') as ViewName | null;
    if (target === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Returns the currently active view name.
 */
export function getCurrentView(): ViewName {
  return currentView;
}

/**
 * Initialize views — check onboarding status and show appropriate view.
 */
export async function initViews(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('work-bestie-preferences');
    const prefs = result['work-bestie-preferences'];
    if (prefs && prefs.onboardingComplete) {
      showView('main');
    } else {
      showView('onboarding');
    }
  } catch {
    // If chrome.storage isn't available (e.g. dev), default to main
    showView('main');
  }
}
