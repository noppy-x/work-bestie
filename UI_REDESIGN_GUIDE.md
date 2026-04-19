# Work Bestie — UI Redesign Guide for Claude

You are redesigning the popup UI for a Chrome extension called "Work Bestie" — a GenZ productivity buddy that roasts you when you visit distraction sites.

## What you can change
- ALL CSS in `src/popup/popup.css` — go wild, redesign everything
- HTML structure/layout in `src/popup/popup.html` — rearrange, restyle, add wrappers
- Text content, emojis, copy

## What you MUST NOT change
The JavaScript hooks into the HTML via element IDs and CSS classes. These are the contracts:

### Required Element IDs (JS reads/writes these)
```
HEADER:
  btn-theme-toggle          — theme toggle button
  btn-settings              — settings nav button

ONBOARDING (view-onboarding):
  view-onboarding           — onboarding view container
  onboarding-steps          — steps container
  onboarding-api-key        — API key input (type=password)
  btn-validate-key          — validate API key button
  api-key-status            — validation status text
  btn-finish-onboarding     — finish onboarding button

MAIN SESSION (view-main):
  view-main                 — main view container
  timer-progress            — SVG circle for timer ring (needs stroke-dasharray="439.82")
  timer-display             — timer text (shows "00:00")
  timer-label               — timer label text
  btn-session               — start/stop session button
  quick-focus-time          — quick stat: focus time
  quick-distractions        — quick stat: distractions count
  pomodoro-break-banner     — break indicator (hidden by default)

STATS (view-stats):
  view-stats                — stats view container
  stats-focus-time          — total focus time
  stats-distractions        — total distractions
  stats-streak              — streak counter
  stats-sessions            — sessions completed
  stats-current-session     — current session card (hidden when no session)
  stats-current-elapsed     — current session elapsed time
  stats-current-distractions — current session distractions

SETTINGS (view-settings):
  view-settings             — settings view container
  settings-intensity-label  — intensity badge label
  settings-intensity-slider — range input (min=0, max=2, step=1)
  settings-api-key-saved    — saved key display container
  settings-api-key-masked   — masked key text
  btn-settings-update-key   — update key button
  btn-settings-remove-key   — remove key button
  settings-api-key-input-area — key input area container
  settings-api-key-input    — API key input field
  btn-settings-validate-key — validate key button
  settings-api-key-status   — key validation status
  settings-add-site-input   — add site input field
  btn-settings-add-site     — add site button
  settings-add-site-error   — site add error text
  settings-site-categories  — site list categories container (dynamically populated)

SESSION SUMMARY:
  session-summary-overlay   — overlay container (display: none by default)
  summary-emoji             — random emoji
  summary-title             — random title text
  summary-subtitle          — random subtitle text
  summary-focus-time        — session focus time
  summary-distractions      — session distractions
  summary-pomodoro-row      — pomodoro row (hidden for non-pomodoro)
  summary-pomodoros         — pomodoro intervals count
  btn-dismiss-summary       — dismiss button

BOTTOM NAV:
  (no IDs, uses data-view attributes)
```

### Required CSS Classes (JS toggles these)
```
.view                — all view containers have this
.view-active         — JS adds this to show a view, removes to hide
.chip-active         — added to selected session mode button
.session-mode-btn    — session mode buttons (data-mode attribute)
.nav-item            — nav bar buttons (data-view attribute)
.nav-item.active     — active nav item
.onboarding-step     — onboarding step containers (data-step attribute)
.onboarding-step.active — visible step
.onboarding-progress .dot — progress dots (data-step attribute)
.onboarding-progress .dot.active — filled dot
.voice-card          — voice selection cards (data-voice attribute)
.voice-card.selected — selected voice
.intensity-card      — intensity cards (data-intensity attribute)
.intensity-card.selected — selected intensity
.session-card        — session type cards (data-session attribute)
.session-card.selected — selected session
.btn-onboarding-next — next buttons in onboarding
.btn-onboarding-back — back buttons in onboarding
.btn-preview-voice   — voice preview buttons (data-voice attribute)
.voice-toggle-btn    — settings voice toggle (data-settings-voice attribute)
.voice-toggle-active — active voice toggle
.chip-remove         — site remove buttons (data-category, data-site attributes)
.btn-stop            — added to session button when active (replaces btn-primary)
.btn-primary         — added to session button when inactive
```

### Required data-* Attributes
```
data-mode="open-focus|1-hour|2-hour|pomodoro"  — on .session-mode-btn
data-view="main|stats|settings"                — on .nav-item
data-step="0|1|2|3"                            — on .onboarding-step and .dot
data-voice="female|male"                       — on .voice-card and .btn-preview-voice
data-intensity="soft|medium|savage"             — on .intensity-card
data-session="open-focus|1-hour|2-hour|pomodoro" — on .session-card
data-settings-voice="female|male"              — on .voice-toggle-btn
data-category="..."                            — on .chip-remove (dynamically generated)
data-site="..."                                — on .chip-remove (dynamically generated)
```

### SVG Timer Ring
The timer ring SVG must keep this structure (IDs and attributes):
```html
<svg viewBox="0 0 160 160">
  <defs>
    <linearGradient id="timerGradient" ...>...</linearGradient>
  </defs>
  <circle class="ring-bg" cx="80" cy="80" r="70" />
  <circle id="timer-progress" class="ring-progress" cx="80" cy="80" r="70"
    stroke-dasharray="439.82" stroke-dashoffset="0" />
</svg>
```
You can change the SVG size, colors, gradient, stroke-width — but keep r=70 and the dasharray value.

## Design Direction
- GenZ aesthetic — playful, expressive, bold, fun
- Light & dark mode (use CSS custom properties + data-theme attribute)
- Neon gradients, vibrant purples/pinks/blues/greens
- Rounded corners, micro-animations
- Popup is 400px wide, scrollable height
- Should feel like a fun app, not a boring tool

## Files to Edit
- `src/popup/popup.html` — HTML structure
- `src/popup/popup.css` — all styles

## Files to NOT Touch
- `src/popup/index.ts`
- `src/popup/views.ts`
- `src/popup/onboarding.ts`
- `src/popup/settings.ts`
- `src/popup/stats.ts`
- Anything in `src/background/`, `src/offscreen/`, `src/shared/`

## Build & Test
After changes, run: `npx vite build`
Then reload the extension from the `dist/` folder in chrome://extensions
