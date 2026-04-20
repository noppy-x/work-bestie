# How I Used Kiro to Build WorkBestie

## Spec-Driven Development (Primary Approach)

I used Kiro's spec-driven workflow from the very beginning. Before writing a single line of code, I created a full spec with Kiro:

- **Requirements document** (`requirements.md`) — 12 detailed requirements with user stories and acceptance criteria covering onboarding, session management, distraction detection, roast delivery, escalation, stats, and more
- **Technical design** (`design.md`) — Complete Chrome MV3 architecture with service worker, offscreen document for audio, popup UI, data models, TypeScript interfaces, ElevenLabs API integration details, and 17 correctness properties
- **Implementation tasks** (`tasks.md`) — 15 top-level tasks with 45+ sub-tasks, executed sequentially with checkpoints

The spec-driven approach meant Kiro implemented the entire extension systematically — from project scaffolding through core logic, service worker, offscreen audio, popup UI, to final integration. Each task referenced specific requirements for traceability. This produced a working extension with 55 passing tests on the first build.

## Steering Docs

I created a steering file (`hackathon-context.md`) that persisted all hackathon rules, product decisions, UI direction, and technical choices across sessions. This was critical — when I lost a chat session, the steering doc preserved everything so Kiro could pick up exactly where we left off. It included the hackathon scoring criteria, submission requirements, and our locked-in product decisions (voice options, session modes, roast intensity levels, etc.).

## Vibe Coding

After the spec-driven implementation was complete, I switched to conversational vibe coding for all the polish and iteration:

- **UI redesign** — I used Claude to generate a new editorial design (Bricolage Grotesque + Plus Jakarta Sans fonts, electric blue + navy palette, Phosphor icons), then had Kiro integrate it
- **Voice selection** — tested different ElevenLabs voices conversationally until finding the right GenZ-sounding ones
- **Phrase pool tuning** — iterated on 72+ roast templates, positive feedback, and session messages through conversation
- **Bug fixing** — debugged service worker lifecycle issues, Chrome MV3 offscreen document messaging, and timer accuracy through back-and-forth with Kiro

## ElevenLabs API Integration

WorkBestie uses the **ElevenLabs Text-to-Speech API** to deliver:
- Voice roasts in real-time when catching distractions
- Positive voice feedback when users refocus
- Session start/end messages with personality

The extension uses the `eleven_multilingual_v2` model with tuned voice settings (stability, similarity boost, style) for natural-sounding GenZ delivery across 72+ unique phrases with 3 intensity levels (soft, medium, savage).

## What Made Kiro Different

The spec-driven approach gave me a working, tested extension in one session. The steering doc meant I never lost context. And the conversational iteration let me polish the UX, voices, and phrases rapidly. The combination of structured spec work + freeform vibe coding was the sweet spot — specs for architecture, vibes for personality.
