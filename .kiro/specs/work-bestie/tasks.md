# Implementation Plan: Work Bestie

## Overview

Build a Chrome Manifest V3 browser extension that acts as a GenZ-personality focus buddy. The implementation follows an incremental approach: project scaffolding → core data models & pure logic → Chrome extension infrastructure (service worker, offscreen document) → popup UI with onboarding → ElevenLabs API integration → audio playback pipeline → session management → distraction detection & roast delivery → escalation system → stats dashboard → settings & polish. Property-based tests (fast-check) and unit tests (vitest) validate correctness at each step.

## Tasks

- [x] 1. Project scaffolding and Chrome extension skeleton
  - [x] 1.1 Initialize project with TypeScript, Vite, and Chrome MV3 structure
    - Create `package.json` with dependencies: `typescript`, `vite`, `vitest`, `fast-check`, `@crxjs/vite-plugin` (or manual build config)
    - Create `tsconfig.json` with Chrome extension type support
    - Create `vite.config.ts` for building background service worker, offscreen document, and popup
    - Create directory structure: `src/background/`, `src/offscreen/`, `src/popup/`, `src/shared/`, `src/tests/`
    - _Requirements: N/A (scaffolding)_

  - [x] 1.2 Create `manifest.json` with MV3 configuration
    - Define manifest with permissions: `tabs`, `activeTab`, `storage`, `alarms`, `offscreen`
    - Set `background.service_worker`, `action.default_popup`, `host_permissions` for `https://api.elevenlabs.io/*`
    - Add placeholder icons (16, 48, 128)
    - _Requirements: 12.1_

  - [x] 1.3 Create placeholder entry files
    - Create `src/background/index.ts` (empty service worker entry)
    - Create `src/offscreen/offscreen.html` and `src/offscreen/index.ts` (offscreen document entry)
    - Create `src/popup/popup.html` and `src/popup/index.ts` (popup entry)
    - Create `src/popup/popup.css` with CSS custom properties for theming (light/dark mode, GenZ color palette: vibrant purples, pinks, electric blues, lime greens, neon gradients)
    - _Requirements: N/A (scaffolding)_

- [x] 2. Core data models, types, and constants
  - [x] 2.1 Define shared TypeScript types and interfaces
    - Create `src/shared/types.ts` with all types: `VoicePreset`, `RoastIntensity`, `SessionMode`, `DistractionCategory`, `UserPreferences`, `SessionState`, `SessionSummary`, `Stats`, `PhrasePoolEntry`, `EscalationState`, `SiteListMap`, `RoastTemplate`
    - Create `src/shared/constants.ts` with `STORAGE_KEYS`, `VOICE_CONFIG`, `DEFAULT_SITE_LISTS`, `ROAST_TEMPLATES`, `SFX_DESCRIPTIONS`
    - _Requirements: 1.5, 3.1, 5.4, 6.2, 7.1, 7.2, 7.3_

  - [x] 2.2 Implement Chrome Storage helper module
    - Create `src/shared/storage.ts` with typed get/set wrappers around `chrome.storage.local`
    - Implement `getPreferences()`, `setPreferences()`, `getSiteLists()`, `setSiteLists()`, `getStats()`, `setStats()`, `getSessionState()`, `setSessionState()`, `getOnboardingStep()`, `setOnboardingStep()`
    - Implement `serializePreferences()` and `deserializePreferences()` as pure functions for round-trip testing
    - _Requirements: 1.5, 4.2, 4.3, 9.2, 9.3, 10.4, 11.4_

  - [x] 2.3 Implement message types for inter-component communication
    - Create `src/shared/messages.ts` with all message interfaces: `PlayRoastMessage`, `SessionStateMessage`, `StartSessionMessage`, `StopSessionMessage`, `RoastDeliveredMessage`, `PreGeneratePhrasesCommand`, `TimerTickMessage`, `StatsUpdatedMessage`
    - _Requirements: N/A (architecture)_

- [x] 3. Pure logic functions and property-based tests
  - [x] 3.1 Implement URL matching and domain utilities
    - Create `src/shared/url-utils.ts` with `extractDomain(url)`, `isDistractionSite(domain, siteListMap)`, and `validateDomain(input)` functions
    - `extractDomain` strips protocol and `www.` prefix, returns hostname
    - `isDistractionSite` checks domain against all categories including subdomain matching (e.g., `m.facebook.com` matches `facebook.com`)
    - `validateDomain` rejects empty strings, strings with spaces, strings without TLD, special-character-only strings
    - _Requirements: 3.2, 3.3, 3.4, 4.5_

  - [ ]* 3.2 Write property test: Non-distraction URL passthrough (Property 4)
    - **Property 4: Non-distraction URL passthrough**
    - Generate arbitrary domain strings not in any distraction list; assert `isDistractionSite` returns `null`
    - **Validates: Requirements 3.4**

  - [ ]* 3.3 Write property test: Invalid URL rejection (Property 7)
    - **Property 7: Invalid URL rejection**
    - Generate strings with spaces, no TLD, empty, special chars only; assert `validateDomain` returns false
    - **Validates: Requirements 4.5**

  - [x] 3.4 Implement escalation logic functions
    - Create `src/shared/escalation.ts` with `getEscalatedIntensity(base, level)`, `getEscalatedVolume(baseVolume, level)`, and `resetEscalation(state)` functions
    - Intensity escalation: level 0 = base, level 1 = base+1 (capped at savage), level 2 = always savage
    - Volume escalation: base + level * 0.2, capped at 1.0
    - Reset: all fields to initial values (level 0, null timestamps, 0 roasts)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 3.5 Write property test: Escalation intensity calculation (Property 10)
    - **Property 10: Escalation intensity calculation**
    - For any base intensity and level (0, 1, 2), assert result ≥ base, ≤ savage, monotonically non-decreasing, and level 2 always returns savage
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 3.6 Write property test: Escalation state reset (Property 11)
    - **Property 11: Escalation state reset**
    - For any EscalationState, assert reset produces level 0, null timestamps, 0 roasts, null domain
    - **Validates: Requirements 8.3**

  - [ ]* 3.7 Write property test: Escalation volume monotonicity (Property 12)
    - **Property 12: Escalation volume monotonicity**
    - For any base volume (0.0–1.0) and levels 0, 1, 2, assert monotonically non-decreasing and capped at 1.0
    - **Validates: Requirements 8.4**

  - [x] 3.8 Implement stats and streak calculation functions
    - Create `src/shared/stats-utils.ts` with `updateStats(stats, summary)`, `calculateStreak(lastSessionDate, currentDate)`, and `createSessionSummary(state)` functions
    - `updateStats` accumulates focus time and distractions, increments sessions completed, updates streak
    - `calculateStreak` computes consecutive days from last session date
    - `createSessionSummary` extracts summary from active session state
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 3.9 Write property test: Stats accumulation correctness (Property 15)
    - **Property 15: Stats accumulation correctness**
    - For any Stats and SessionSummary, assert totalFocusTimeMs and totalDistractionsCaught are correctly accumulated
    - **Validates: Requirements 10.4**

  - [ ]* 3.10 Write property test: Streak calculation correctness (Property 14)
    - **Property 14: Streak calculation correctness**
    - For any sequence of session dates, assert streak equals longest suffix of consecutive calendar days
    - **Validates: Requirements 10.3**

  - [ ]* 3.11 Write property test: Session summary accuracy (Property 3)
    - **Property 3: Session summary accuracy**
    - For any session mode, timestamps, elapsed time, and distraction count, assert summary fields match tracked values
    - **Validates: Requirements 2.7, 2.8**

  - [x] 3.12 Implement API key masking and badge color utilities
    - Create `src/shared/ui-utils.ts` with `maskApiKey(key)` and `getBadgeColor(isActive, isDistraction)` functions
    - `maskApiKey`: keys ≥ 8 chars show first 4 + asterisks + last 4; shorter keys fully masked
    - `getBadgeColor`: no badge when inactive, green when active + not distracted, red when active + distracted
    - _Requirements: 11.5, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 3.13 Write property test: API key masking (Property 16)
    - **Property 16: API key masking**
    - For any non-empty string, assert masking rules: ≥8 chars shows first/last 4 with asterisks; <8 chars fully masked
    - **Validates: Requirements 11.5**

  - [ ]* 3.14 Write property test: Badge color determination (Property 17)
    - **Property 17: Badge color determination**
    - For any combination of isActive and isDistraction booleans, assert correct badge color output
    - **Validates: Requirements 12.1**

  - [x] 3.15 Implement phrase pool selection and TTS request builder
    - Create `src/shared/roast-utils.ts` with `selectPhrasePoolClip(pool, category, intensity, voicePreset)` and `buildTTSRequest(text, voicePreset, intensity)` functions
    - `selectPhrasePoolClip`: filters pool by category + intensity + voicePreset, returns random matching clip or null
    - `buildTTSRequest`: constructs ElevenLabs TTS API request body with correct voice_id from VOICE_CONFIG
    - _Requirements: 5.2, 5.3, 6.1, 6.2_

  - [ ]* 3.16 Write property test: Phrase pool clip selection correctness (Property 8)
    - **Property 8: Phrase pool clip selection correctness**
    - For any category and intensity with matching clips in pool, assert selected clip's fields match requested values
    - **Validates: Requirements 5.3**

  - [ ]* 3.17 Write property test: TTS request construction correctness (Property 9)
    - **Property 9: TTS request construction correctness**
    - For any VoicePreset and RoastIntensity, assert request has correct voice_id and non-empty text
    - **Validates: Requirements 6.2**

  - [x] 3.18 Implement preferences serialization and site list management
    - Create `src/shared/site-list-utils.ts` with `addSiteToCategory(siteLists, domain, category?)`, `removeSiteFromCategory(siteLists, domain, category)` functions
    - If no category specified, add to "custom" category
    - Validate domain before adding; reject invalid domains
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.19 Write property test: Preferences round-trip persistence (Property 1)
    - **Property 1: Preferences round-trip persistence**
    - For any valid UserPreferences, assert serialize then deserialize produces equivalent object
    - **Validates: Requirements 1.5, 9.2, 9.3, 11.4**

  - [ ]* 3.20 Write property test: Site list add/remove round-trip (Property 5)
    - **Property 5: Site list add/remove round-trip**
    - For any valid domain and category, assert add then query includes domain; remove then query excludes it
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 3.21 Write property test: Custom category default assignment (Property 6)
    - **Property 6: Custom category default assignment**
    - For any valid domain added without category, assert it appears in "custom" and no other category
    - **Validates: Requirements 4.4**

  - [ ]* 3.22 Write property test: Settings change preserves active session (Property 13)
    - **Property 13: Settings change preserves active session**
    - For any active SessionState and valid settings change, assert isActive, elapsedMs, startTimestamp, distractionsThisSession are unchanged
    - **Validates: Requirements 9.4**

- [x] 4. Checkpoint — Ensure all pure logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Service worker: session management and tab monitoring
  - [x] 5.1 Implement session manager in service worker
    - Create `src/background/session-manager.ts`
    - Implement `startSession(mode)`, `stopSession()`, `handleSessionTick()` functions
    - Use `chrome.alarms.create("session-tick", { periodInMinutes: 1/60 })` for reliable 1-second ticks
    - Handle all session modes: open-focus (elapsed timer), 1-hour (60min countdown), 2-hour (120min countdown), pomodoro (25min work / 5min break cycles)
    - Persist session state to Chrome Storage on each tick for service worker recovery
    - Generate `SessionSummary` on session end (timer expiry or manual stop)
    - Update stats via `updateStats()` on session end
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 5.2 Implement tab monitor in service worker
    - Create `src/background/tab-monitor.ts`
    - Register `chrome.tabs.onUpdated` and `chrome.tabs.onActivated` listeners
    - Extract domain from active tab URL using `extractDomain()`
    - Match against distraction site lists using `isDistractionSite()`
    - Implement 500ms debounce for rapid tab switches
    - Skip detection during pomodoro break intervals
    - Report distraction detection to escalation manager
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 5.3 Implement escalation manager in service worker
    - Create `src/background/escalation-manager.ts`
    - Track in-memory `EscalationState` per browsing episode
    - Set timers: 30s after first roast → escalation level 1, 60s → escalation level 2
    - Use `getEscalatedIntensity()` and `getEscalatedVolume()` for escalated roast parameters
    - Reset escalation when user navigates away from distraction site
    - Cap at savage intensity and max volume (no further escalation)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.4 Implement badge manager in service worker
    - Create `src/background/badge-manager.ts`
    - Use `chrome.action.setBadgeBackgroundColor()` and `chrome.action.setBadgeText()` to set badge
    - Green badge when session active + on work site; red badge when on distraction site
    - Clear badge when no session is active
    - Update within 2 seconds of navigation events
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 5.5 Wire service worker entry point
    - Update `src/background/index.ts` to initialize all modules: session manager, tab monitor, escalation manager, badge manager
    - Register `chrome.runtime.onMessage` listener to handle messages from popup (START_SESSION, STOP_SESSION, settings changes)
    - Register `chrome.alarms.onAlarm` listener for session ticks
    - Handle offscreen document lifecycle (create on session start, close on session end)
    - Restore session state from Chrome Storage on service worker wake
    - _Requirements: 2.1–2.10, 3.2–3.5, 8.1–8.5, 9.4, 12.1–12.4_

- [x] 6. Offscreen document: audio playback and ElevenLabs API integration
  - [x] 6.1 Implement ElevenLabs API client
    - Create `src/offscreen/elevenlabs-api.ts`
    - Implement `generateTTS(text, voiceId, apiKey)` — POST to `/v1/text-to-speech/{voice_id}` with model `eleven_multilingual_v2`, returns audio Blob
    - Implement `generateSFX(description, apiKey)` — POST to `/v1/sound-generation`, returns audio Blob
    - Implement `validateApiKey(apiKey)` — GET `/v1/voices` to verify key validity
    - Add 5-second timeout for TTS requests
    - _Requirements: 6.1, 6.2, 6.3, 7.5, 11.2_

  - [x] 6.2 Implement IndexedDB phrase pool storage
    - Create `src/offscreen/phrase-pool-db.ts`
    - Initialize IndexedDB database `work-bestie-audio` with object store `phrases`
    - Create compound index on `[category, intensity, voicePreset]`
    - Implement `storePhraseClip(entry)`, `getClipsByFilter(category, intensity, voicePreset)`, `clearPool()` functions
    - _Requirements: 5.1, 5.4_

  - [x] 6.3 Implement phrase pool pre-generation
    - Create `src/offscreen/phrase-generator.ts`
    - On `PRE_GENERATE_PHRASES` command, iterate through `ROAST_TEMPLATES` × intensity × voicePreset combinations
    - Call `generateTTS()` for each template text and store resulting audio Blob in IndexedDB
    - Generate SFX clips for each intensity level using `SFX_DESCRIPTIONS` and store them
    - Handle API errors gracefully (skip failed clips, continue with others)
    - _Requirements: 5.1, 5.4, 7.1, 7.2, 7.3_

  - [x] 6.4 Implement audio playback engine
    - Create `src/offscreen/audio-player.ts`
    - Implement `playAudio(blob, volume)` using `Audio()` element with blob URL
    - Implement `playRoastWithSFX(roastBlob, sfxBlob, volume)` — play SFX first or simultaneously with roast
    - Handle playback errors gracefully (log and continue)
    - _Requirements: 5.2, 6.3, 7.4_

  - [x] 6.5 Wire offscreen document message handler
    - Update `src/offscreen/index.ts` to handle incoming messages
    - On `PLAY_ROAST`: look up phrase pool clip via `selectPhrasePoolClip()`; if found, play cached clip; if not, call `generateTTS()` for dynamic nudge with site name; on TTS failure/timeout, fall back to generic cached clip
    - Generate and play matching SFX via `generateSFX()` simultaneously; skip SFX on API failure
    - On `PRE_GENERATE_PHRASES`: trigger phrase pool pre-generation
    - Send `ROAST_DELIVERED` message back to service worker after playback
    - _Requirements: 5.2, 5.3, 6.1, 6.3, 6.4, 7.1–7.5_

- [x] 7. Checkpoint — Ensure service worker and offscreen document build correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Popup UI: theming, layout, and main view
  - [x] 8.1 Implement CSS theming system
    - Update `src/popup/popup.css` with full GenZ aesthetic theme
    - Define CSS custom properties for light and dark mode (vibrant purples, pinks, electric blues, lime greens, neon gradients)
    - Implement `prefers-color-scheme` media query for system preference detection
    - Add manual theme toggle support via a `data-theme` attribute on `<html>`
    - Style rounded corners, friendly sans-serif typography (Inter/Nunito), emoji-forward elements, micro-animations (transitions, keyframes)
    - Set popup dimensions (~400px wide, scrollable)
    - _Requirements: N/A (UI/UX direction from steering doc)_

  - [x] 8.2 Implement popup navigation and view management
    - Create `src/popup/views.ts` with view switching logic
    - Define views: `onboarding`, `main`, `stats`, `settings`
    - Implement `showView(viewName)` to toggle visibility of view containers
    - On popup open: check `onboardingComplete` preference; if false, show onboarding; if true, show main view
    - _Requirements: 1.1, 1.6_

  - [x] 8.3 Implement main session view
    - Create session controls UI in `src/popup/popup.html`: session mode selector (Open Focus, 1-Hour, 2-Hour, Pomodoro), start/stop button
    - Implement animated progress ring timer display (countdown for timed sessions, elapsed for open focus)
    - Show quick stats (focus time this session, distractions caught this session)
    - Display pomodoro break indicator when in break interval
    - Wire start/stop buttons to send `START_SESSION` / `STOP_SESSION` messages to service worker
    - Listen for `SESSION_STATE`, `TIMER_TICK`, `STATS_UPDATED` messages to update UI
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9, 10.6_

  - [x] 8.4 Implement session summary display
    - Show session summary overlay/card when session ends (total focus time, distractions caught, pomodoro intervals completed)
    - Display fun emoji and GenZ copy for the summary
    - Allow dismissing summary to return to main view
    - _Requirements: 2.7, 2.8_

- [x] 9. Popup UI: onboarding flow
  - [x] 9.1 Implement onboarding quiz UI
    - Create multi-step onboarding card layout in popup HTML
    - Step 1: Welcome / personality intro card
    - Step 2: Voice selection — male and female Voice_Preset cards with audio preview buttons (call `validateApiKey` + play sample TTS)
    - Step 3: Roast intensity selector — Soft, Medium, Savage options with example audio preview for each
    - Step 4: Session type selector — Open Focus, 1-Hour, 2-Hour, Pomodoro
    - Style as quiz cards with GenZ aesthetic (rounded corners, gradients, emojis, micro-animations)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 9.2 Implement onboarding state persistence and resume
    - Persist current onboarding step index to Chrome Storage on each step transition
    - On popup open with incomplete onboarding, resume at last saved step
    - On completion, set `onboardingComplete: true` in preferences and navigate to main view
    - Trigger phrase pool pre-generation after onboarding completes (send `PRE_GENERATE_PHRASES` to offscreen)
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ]* 9.3 Write property test: Onboarding step resume (Property 2)
    - **Property 2: Onboarding step resume**
    - For any step index (1 through N), assert persisting and re-initializing resumes at that step
    - **Validates: Requirements 1.7**

- [x] 10. Popup UI: settings and API key management
  - [x] 10.1 Implement settings view
    - Create settings panel in popup HTML with sections: Voice & Personality, API Key, Site Lists
    - Voice preset selector (male/female) with immediate apply
    - Animated roast intensity slider (Soft → Medium → Savage) with immediate apply
    - Persist changes to Chrome Storage and send settings update message to service worker
    - Apply changes immediately without interrupting active session
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.2 Implement API key management UI
    - Add API key input field with validation button
    - On submit: call `validateApiKey()` via message to offscreen document or direct fetch from popup
    - Show success/error feedback (invalid key error message, success confirmation)
    - Display masked API key (using `maskApiKey()`) with update/remove options
    - Block session start if no valid API key configured
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.3 Implement site list editor
    - Display distraction site lists organized by category (social media, entertainment, news, gaming, shopping, custom)
    - Add site input with domain validation (using `validateDomain()`)
    - Show validation error for invalid URLs
    - Add/remove sites with immediate persistence to Chrome Storage
    - Sites added without category go to "custom" category
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Popup UI: stats dashboard
  - [x] 11.1 Implement stats dashboard view
    - Create stats view in popup HTML with fun icons and emojis
    - Display total focus time (formatted as hours/minutes) across all sessions
    - Display total distractions caught with playful counter
    - Display streak counter (consecutive days with ≥1 session) with fire emoji
    - Display sessions completed count
    - Show current session stats (elapsed focus time, distractions this session) when session is active
    - Load stats from Chrome Storage on popup open
    - Listen for `STATS_UPDATED` messages to refresh display
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

- [x] 12. Checkpoint — Ensure full extension builds and loads in Chrome
  - Ensure all tests pass, ask the user if questions arise.
  - Verify extension loads in `chrome://extensions` with developer mode
  - Verify popup opens and displays correctly

- [x] 13. Integration wiring: distraction detection → roast delivery pipeline
  - [x] 13.1 Wire end-to-end distraction detection to roast playback
    - In service worker: when tab monitor detects distraction, determine roast parameters (category, intensity with escalation, volume, voice preset, site name)
    - Send `PLAY_ROAST` message to offscreen document with all parameters
    - Offscreen document handles phrase pool lookup → dynamic TTS fallback → SFX generation → audio playback
    - On `ROAST_DELIVERED` response: update escalation state, increment distraction count, update stats, update badge to red
    - On navigation away from distraction: reset escalation, update badge to green
    - _Requirements: 3.3, 5.2, 6.1, 7.1–7.4, 8.1–8.5, 12.3, 12.4_

  - [x] 13.2 Implement error handling and fallback chain
    - TTS API timeout (>5s): fall back to pre-generated phrase pool clip
    - TTS API error (4xx/5xx): fall back to phrase pool clip, log error
    - SFX API failure: skip SFX, deliver roast audio only
    - API key invalid (401/403): show error in popup, disable session start
    - Network offline: use only pre-generated clips, skip dynamic nudges and SFX
    - Offscreen document creation failure: retry once, show error if persistent
    - Audio playback failure: log error, continue session
    - _Requirements: 6.4, Error handling strategy from design_

  - [ ]* 13.3 Write unit tests for distraction-to-roast pipeline
    - Test: distraction detected → correct PLAY_ROAST message constructed
    - Test: escalation timers trigger at 30s and 60s
    - Test: TTS fallback to phrase pool on API failure
    - Test: SFX skipped on SFX API failure
    - Test: badge color changes on distraction/navigation events
    - _Requirements: 3.3, 5.2, 6.4, 7.1–7.4, 8.1–8.5, 12.3, 12.4_

- [x] 14. Extension icons and visual assets
  - [x] 14.1 Create extension icons and visual assets
    - Create or generate icon set: 16x16, 48x48, 128x128 PNG icons with GenZ-style Work Bestie branding
    - Place in `public/icons/` directory
    - Update manifest.json icon paths if needed
    - _Requirements: 12.1_

- [x] 15. Final checkpoint — Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete flow: install → onboarding → start session → detect distraction → hear roast → escalation → stop session → view stats

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 17 universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript throughout, with vitest for testing and fast-check for property-based tests
- UI follows GenZ aesthetic from steering doc: neon gradients, vibrant colors, rounded corners, emoji-forward, micro-animations, light/dark mode
