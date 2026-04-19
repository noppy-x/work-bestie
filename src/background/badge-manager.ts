/**
 * Updates the extension toolbar icon based on session/distraction state.
 * Safe (blue checkmark) when focused, Warning (coral) when distracted.
 * No badge text overlay — just icon swap.
 */
export function updateBadge(isActive: boolean, isDistraction: boolean): void {
  if (!isActive) {
    clearBadge();
    return;
  }

  if (isDistraction) {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon-warning-16.png",
        "32": "icons/icon-warning-32.png",
        "48": "icons/icon-warning-48.png",
        "128": "icons/icon-warning-128.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon-safe-16.png",
        "32": "icons/icon-safe-32.png",
        "48": "icons/icon-safe-48.png",
        "128": "icons/icon-safe-128.png",
      },
    });
  }
  chrome.action.setBadgeText({ text: "" });
}

/**
 * Clears badge and resets to default safe icon.
 */
export function clearBadge(): void {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setIcon({
    path: {
      "16": "icons/icon-safe-16.png",
      "32": "icons/icon-safe-32.png",
      "48": "icons/icon-safe-48.png",
      "128": "icons/icon-safe-128.png",
    },
  });
}
