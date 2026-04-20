---
inclusion: auto
---

# ElevenHacks Hackathon #5: Kiro — Context & Strategy

## Hackathon Overview
- **Event**: ElevenHacks Hack #5 — ElevenLabs x Kiro
- **Challenge**: Build an AI-powered app using Kiro's spec-driven development and ElevenLabs APIs
- **Prizes**: $11,980 total — 1st: $5,990 / 2nd: $3,660 / 3rd: $2,330
- **Submissions close**: Thu 23 Apr 2026, 17:00
- **Winners announced**: Tue 28 Apr 2026, 17:00
- **Judges**: Karthik Rao (Engineering Leader, Kiro Agentic AI), Joe Reeve (Growth, ElevenLabs)

## Our Project: Work Bestie
A browser extension (or similar digital product) that acts as your GenZ work buddy. It monitors which websites you're on during a work session and uses ElevenLabs voice AI to nudge/roast you back to focus.

### Core Concept
- User starts a "work session"
- Extension tracks active websites
- When user drifts to non-work sites (social media, YouTube, etc.), Work Bestie speaks up
- The voice is a GenZ personality (female or male, user picks)
- Roast/nudge intensity is configurable: soft → medium → savage
- Uses ElevenLabs TTS API for the voice output

## Key Hackathon Requirements

### Must-haves for submission
1. Built with Kiro (spec-driven development)
2. Uses ElevenLabs APIs (TTS is our primary integration)
3. Open source repo with OSI license
4. `.kiro/` directory at root (specs, hooks, steering) — NOT in .gitignore
5. Demo video (60-90 seconds, viral-style)
6. Text description explaining features
7. Write-up on how Kiro was used (specs, hooks, steering, powers, etc.)
8. Social media posts tagging @kirodotdev and @elevenlabsio with #ElevenHacks #CodeWithKiro

### Scoring
- Social posts: +50 pts per platform (X, LinkedIn, Instagram, TikTok) = up to +200
- Placement: 1st +400 pts, 2nd +200 pts, 3rd +150 pts
- Most Viral: +200 pts (most engagement)
- Most Popular: +200 pts (community vote)

### Judging Criteria
1. **Potential Value**: Unique idea, intuitive UI, real need, scalability
2. **Implementation**: Effective use of Kiro features (specs, hooks, steering, powers, MCP)
3. **Quality and Design**: Creativity, originality, polished design, delightful UX

### Kiro Feature Usage to Showcase
- Spec-driven development (primary focus the judges want to see)
- Agent hooks (automated workflows)
- Steering docs (improved AI responses)
- Kiro powers (ElevenLabs Power recommended)
- MCP integrations if applicable

## Video Strategy (from submission guide)
- Spend at LEAST half the time on the video
- 5-second rule: communicate what it does in one sentence upfront
- 60-90 seconds max
- Show, don't tell (80% demo)
- Add captions (muted viewing)
- Background music (ElevenLabs Music)
- Film in real-world context if possible
- Mention ElevenLabs and Kiro clearly

## Product Decisions (Locked In)

### Format
- Chrome browser extension

### ElevenLabs API Usage (deep integration for judges)
- **Text-to-Speech**: Core — GenZ voice delivers roasts/nudges in real-time
- **Pre-generated phrase pool**: Library of pre-generated TTS audio for common situations (faster, no latency)
- **On-the-fly generation**: Context-specific nudges generated dynamically (e.g., referencing the actual site name)
- **Sound Effects API**: Reaction SFX per roast level (dramatic stings, sad trombone, airhorn, etc.)
- **Voice options**: Male and female GenZ voice presets user can choose between

### Site Tracking
- Pre-built distraction categories (social media, entertainment, news, gaming, shopping, etc.)
- User can adjust/customize the lists (add/remove sites)
- Whitelist approach: anything not in "work" or uncategorized triggers bestie

### Session Modes
- Open focus session (no timer, manual stop)
- 1-hour session
- 2-hour session
- Pomodoro (25 min work / 5 min break cycles)

### Roast System
- Intensity slider: Soft → Medium → Savage
- Escalation: If user ignores first nudge, bestie escalates intensity automatically
- Personality: GenZ slang, humor, pop culture references

### User Preferences (onboarding + settings)
- Pick bestie gender (male/female voice)
- Set roast intensity (soft/medium/savage)
- Choose session type
- Customize site lists

### MVP Scope (must ship)
- Stats/dashboard in popup (focus time, distractions caught, streak counter)
- First-time onboarding flow (personality quiz style)
- Escalation system (ignore nudge → bestie gets louder/meaner)
- "Bestie reacts" SFX via ElevenLabs Sound Effects API

### Nice-to-haves (if time allows)
- ElevenLabs Music API for lo-fi focus playlist
- Share your focus stats / bestie quotes on social

## UI/UX Design Direction
- **Theme**: Light & dark mode (system preference detection + manual toggle)
- **Aesthetic**: GenZ — playful, expressive, bold
- **Color palette**: Neon/gradient accents, vibrant purples, pinks, electric blues, lime greens
- **Typography**: Rounded, friendly sans-serif (e.g., Inter, Nunito, or similar)
- **Vibe**: Emoji-forward, rounded corners, micro-animations, personality-driven copy
- **Popup size**: Standard Chrome extension popup (~400px wide, scrollable)
- **Key UI moments**: Onboarding quiz cards, animated roast intensity slider, session timer with progress ring, stats with fun icons/emojis

## Tech Stack
- **Extension**: Chrome Manifest V3
- **Frontend**: HTML/CSS/JS (or lightweight framework TBD)
- **Backend/API**: Minimal — mostly client-side, ElevenLabs API calls
- **Storage**: Chrome storage API for preferences and stats
- **ElevenLabs APIs**: TTS, Sound Effects
