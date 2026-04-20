# Requirements Document

## Introduction

Work Bestie is a Chrome browser extension that acts as a GenZ-personality work buddy. During focus sessions, the extension monitors the user's active browser tabs and uses ElevenLabs voice AI to deliver roasts, nudges, and sound effects when the user drifts to distraction websites. The extension features configurable session modes, roast intensity levels with automatic escalation, a pre-generated and on-the-fly TTS phrase system, and a stats dashboard — all designed to keep users focused with humor and personality.

Built for the ElevenHacks Hack #5 (ElevenLabs × Kiro), the extension deeply integrates multiple ElevenLabs APIs: Text-to-Speech for voice delivery, Sound Effects API for reaction SFX, and pre-generated audio pools for low-latency responses.

## Glossary

- **Extension**: The Work Bestie Chrome browser extension built on Manifest V3
- **Bestie**: The GenZ-personality voice assistant that delivers roasts and nudges to the user
- **Session**: A timed or untimed focus period during which the Extension monitors browsing activity
- **Distraction_Site**: A website categorized as non-work-related (e.g., social media, entertainment, news, gaming, shopping)
- **Work_Site**: A website categorized as work-related or uncategorized (not in any distraction list)
- **Roast**: A humorous verbal nudge delivered by the Bestie via TTS to redirect the user away from a Distraction_Site
- **Roast_Intensity**: The severity level of a Roast, configurable as Soft, Medium, or Savage
- **Escalation**: The automatic increase of Roast_Intensity when the user ignores previous nudges on a Distraction_Site
- **Phrase_Pool**: A library of pre-generated TTS audio clips for common distraction scenarios, stored locally for instant playback
- **Dynamic_Nudge**: A context-specific Roast generated on-the-fly via the ElevenLabs TTS API, referencing the actual site name or situation
- **Reaction_SFX**: Sound effects generated via the ElevenLabs Sound Effects API that accompany Roasts (e.g., dramatic stings, sad trombone, airhorn)
- **Popup**: The Chrome extension popup UI that displays session controls, stats, and settings
- **Onboarding_Flow**: The first-time setup experience where the user configures Bestie personality, voice, and preferences
- **Stats_Dashboard**: The section of the Popup displaying focus time, distractions caught, and streak counter
- **Pomodoro_Mode**: A session type consisting of 25-minute work intervals followed by 5-minute break intervals
- **Voice_Preset**: A pre-configured ElevenLabs voice option representing either a male or female GenZ personality
- **Chrome_Storage**: The Chrome storage API used to persist user preferences, session stats, and site lists
- **ElevenLabs_TTS_API**: The ElevenLabs Text-to-Speech API used to generate voice audio
- **ElevenLabs_SFX_API**: The ElevenLabs Sound Effects API used to generate Reaction_SFX audio

## Requirements

### Requirement 1: First-Time Onboarding

**User Story:** As a new user, I want a personality-quiz-style onboarding flow when I first install the extension, so that I can configure my Bestie's voice and personality to my preferences.

#### Acceptance Criteria

1. WHEN the user opens the Extension for the first time, THE Onboarding_Flow SHALL present a step-by-step personality quiz interface.
2. WHEN the user reaches the voice selection step, THE Onboarding_Flow SHALL display male and female Voice_Preset options with audio preview playback.
3. WHEN the user reaches the intensity selection step, THE Onboarding_Flow SHALL display a Roast_Intensity selector with Soft, Medium, and Savage options and example audio for each level.
4. WHEN the user reaches the session type step, THE Onboarding_Flow SHALL display session mode options: Open Focus, 1-Hour, 2-Hour, and Pomodoro_Mode.
5. WHEN the user completes all onboarding steps, THE Extension SHALL persist the selected preferences to Chrome_Storage.
6. WHEN the user completes the Onboarding_Flow, THE Extension SHALL navigate to the main Popup view with the configured settings active.
7. IF the user closes the Extension before completing the Onboarding_Flow, THEN THE Extension SHALL resume the Onboarding_Flow at the last incomplete step on next open.

### Requirement 2: Session Management

**User Story:** As a user, I want to start, monitor, and stop focus sessions of different types, so that I can structure my work time with the Bestie's help.

#### Acceptance Criteria

1. WHEN the user selects "Open Focus" and starts a session, THE Extension SHALL begin an untimed session that runs until the user manually stops the session.
2. WHEN the user selects "1-Hour" and starts a session, THE Extension SHALL begin a 60-minute countdown session.
3. WHEN the user selects "2-Hour" and starts a session, THE Extension SHALL begin a 120-minute countdown session.
4. WHEN the user selects "Pomodoro" and starts a session, THE Extension SHALL begin a 25-minute work interval followed by a 5-minute break interval, repeating until the user stops the session.
5. WHILE a timed session is active, THE Extension SHALL display the remaining time in the Popup.
6. WHILE an Open Focus session is active, THE Extension SHALL display the elapsed time in the Popup.
7. WHEN a timed session countdown reaches zero, THE Extension SHALL end the session and display a session summary.
8. WHEN the user clicks the stop button during an active session, THE Extension SHALL end the session and display a session summary.
9. WHILE a Pomodoro_Mode break interval is active, THE Extension SHALL pause distraction monitoring and display the break countdown.
10. WHEN a Pomodoro_Mode break interval ends, THE Extension SHALL resume distraction monitoring and start the next 25-minute work interval.

### Requirement 3: Distraction Site Detection

**User Story:** As a user, I want the extension to detect when I visit distraction websites during a focus session, so that my Bestie can nudge me back to work.

#### Acceptance Criteria

1. THE Extension SHALL include pre-built distraction category lists for social media, entertainment, news, gaming, and shopping websites.
2. WHILE a session is active, THE Extension SHALL monitor the user's active browser tab URL.
3. WHEN the user navigates to a Distraction_Site during an active session, THE Extension SHALL detect the navigation within 2 seconds.
4. WHEN the user navigates to a Work_Site or uncategorized site during an active session, THE Extension SHALL take no distraction action.
5. WHILE a Pomodoro_Mode break interval is active, THE Extension SHALL skip distraction detection.

### Requirement 4: Site List Customization

**User Story:** As a user, I want to add and remove websites from the distraction lists, so that I can tailor the detection to my specific work habits.

#### Acceptance Criteria

1. THE Extension SHALL display the current distraction site lists organized by category in the settings view.
2. WHEN the user adds a website URL to a distraction category, THE Extension SHALL persist the addition to Chrome_Storage and apply the change immediately.
3. WHEN the user removes a website URL from a distraction category, THE Extension SHALL persist the removal to Chrome_Storage and apply the change immediately.
4. WHEN the user adds a custom website URL that does not belong to an existing category, THE Extension SHALL add the URL to a "Custom" distraction category.
5. IF the user enters an invalid URL format when adding a site, THEN THE Extension SHALL display a validation error message and reject the entry.

### Requirement 5: Roast Delivery via Pre-Generated Phrase Pool

**User Story:** As a user, I want instant voice roasts when I visit distraction sites, so that the experience feels responsive and natural.

#### Acceptance Criteria

1. THE Extension SHALL store a Phrase_Pool of pre-generated TTS audio clips covering common distraction categories.
2. WHEN a distraction is detected and a matching Phrase_Pool clip exists for the distraction category and current Roast_Intensity, THE Extension SHALL play the pre-generated audio clip within 500 milliseconds.
3. THE Extension SHALL select a random clip from the matching category and intensity subset of the Phrase_Pool to avoid repetitive playback.
4. THE Extension SHALL include Phrase_Pool clips for each combination of distraction category (social media, entertainment, news, gaming, shopping) and Roast_Intensity level (Soft, Medium, Savage).

### Requirement 6: Dynamic Nudge Generation via ElevenLabs TTS

**User Story:** As a user, I want context-specific roasts that reference the actual website I'm on, so that the nudges feel personalized and aware.

#### Acceptance Criteria

1. WHEN a distraction is detected and no suitable Phrase_Pool clip is available, THE Extension SHALL generate a Dynamic_Nudge via the ElevenLabs_TTS_API referencing the detected site name.
2. WHEN a Dynamic_Nudge is generated, THE Extension SHALL use the user's selected Voice_Preset and current Roast_Intensity to configure the TTS request.
3. WHEN the ElevenLabs_TTS_API returns the generated audio, THE Extension SHALL play the audio to the user.
4. IF the ElevenLabs_TTS_API request fails or times out after 5 seconds, THEN THE Extension SHALL fall back to playing a generic Phrase_Pool clip for the detected distraction category.

### Requirement 7: Reaction Sound Effects

**User Story:** As a user, I want fun sound effects to accompany roasts, so that the experience is entertaining and engaging.

#### Acceptance Criteria

1. WHEN a Roast is delivered at Soft intensity, THE Extension SHALL play a mild Reaction_SFX (e.g., gentle chime or subtle notification sound).
2. WHEN a Roast is delivered at Medium intensity, THE Extension SHALL play a moderate Reaction_SFX (e.g., sad trombone or comedic sting).
3. WHEN a Roast is delivered at Savage intensity, THE Extension SHALL play an intense Reaction_SFX (e.g., airhorn or dramatic sting).
4. THE Extension SHALL play the Reaction_SFX before or simultaneously with the Roast audio, not after.
5. THE Extension SHALL generate Reaction_SFX audio using the ElevenLabs_SFX_API.

### Requirement 8: Roast Escalation System

**User Story:** As a user, I want my Bestie to get progressively more intense if I keep ignoring nudges, so that I have stronger motivation to return to work.

#### Acceptance Criteria

1. WHEN the user remains on a Distraction_Site for more than 30 seconds after the first Roast, THE Extension SHALL deliver a second Roast at one intensity level higher than the current Roast_Intensity setting.
2. WHEN the user remains on a Distraction_Site for more than 60 seconds after the first Roast, THE Extension SHALL deliver a third Roast at Savage intensity regardless of the user's configured Roast_Intensity.
3. WHEN the user navigates away from a Distraction_Site, THE Extension SHALL reset the Escalation state for that browsing episode.
4. WHILE Escalation is active, THE Extension SHALL increase the audio volume with each escalation step.
5. THE Extension SHALL cap Escalation at Savage intensity and maximum volume, delivering no further escalation beyond that level.

### Requirement 9: Voice and Personality Settings

**User Story:** As a user, I want to change my Bestie's voice and roast intensity at any time, so that I can adjust the experience to my mood.

#### Acceptance Criteria

1. THE Extension SHALL display voice and personality settings in the Popup settings view.
2. WHEN the user selects a different Voice_Preset (male or female), THE Extension SHALL persist the selection to Chrome_Storage and use the new voice for all subsequent Roasts.
3. WHEN the user adjusts the Roast_Intensity slider, THE Extension SHALL persist the new intensity to Chrome_Storage and apply the change to subsequent Roasts.
4. WHEN the user changes settings during an active session, THE Extension SHALL apply the new settings immediately without interrupting the session.

### Requirement 10: Stats Dashboard

**User Story:** As a user, I want to see my focus statistics, so that I can track my productivity and feel motivated by my progress.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL display the total focus time accumulated across all completed sessions.
2. THE Stats_Dashboard SHALL display the total number of distractions caught across all completed sessions.
3. THE Stats_Dashboard SHALL display a streak counter showing consecutive days with at least one completed session.
4. WHEN a session ends, THE Extension SHALL update the Stats_Dashboard data in Chrome_Storage.
5. WHEN the user opens the Popup, THE Stats_Dashboard SHALL load and display the latest stats from Chrome_Storage.
6. THE Stats_Dashboard SHALL display stats for the current session (elapsed focus time, distractions caught this session) while a session is active.

### Requirement 11: ElevenLabs API Key Management

**User Story:** As a user, I want to securely provide my ElevenLabs API key, so that the extension can access TTS and Sound Effects services.

#### Acceptance Criteria

1. WHEN the user has not configured an API key, THE Extension SHALL prompt the user to enter an ElevenLabs API key before starting a session.
2. WHEN the user enters an API key, THE Extension SHALL validate the key by making a test request to the ElevenLabs API.
3. IF the API key validation fails, THEN THE Extension SHALL display an error message indicating the key is invalid.
4. WHEN the API key is validated successfully, THE Extension SHALL persist the key securely to Chrome_Storage.
5. THE Extension SHALL display the API key in a masked format in the settings view, with an option to update or remove the key.

### Requirement 12: Extension Badge and Visual Indicators

**User Story:** As a user, I want visual indicators showing my session status at a glance, so that I know the extension is active without opening the popup.

#### Acceptance Criteria

1. WHILE a session is active, THE Extension SHALL display a colored badge on the browser toolbar icon (green for focused, red when on a Distraction_Site).
2. WHILE no session is active, THE Extension SHALL display no badge on the browser toolbar icon.
3. WHEN the user navigates to a Distraction_Site during a session, THE Extension SHALL change the badge color to red within 2 seconds.
4. WHEN the user navigates away from a Distraction_Site during a session, THE Extension SHALL change the badge color back to green within 2 seconds.
