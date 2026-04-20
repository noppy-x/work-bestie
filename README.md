# WorkBestie 🔥

> Your GenZ AI accountability buddy that roasts you back to focus

**ElevenLabs Hackathon Submission** | Built with Kiro AI

Stop scrolling, start working. AI voice bestie that roasts you when you're distracted. Real-time callouts, GenZ energy. Focus accountability that hits different.

**🎥 [Watch Demo Video](YOUR_VIDEO_LINK_HERE)**

## 📸 Screenshots

### Main View
<img src="main-view-default.png" width="400" alt="WorkBestie default state">
<img src="main-view-active.png" width="400" alt="WorkBestie active session">

### Onboarding Flow
<img src="onboarding-1.png" width="400" alt="Voice selection">
<img src="onboarding-2.png" width="400" alt="Intensity settings">
<img src="onboarding-3.png" width="400" alt="Session type selection">

### Settings
<img src="settings.png" width="400" alt="Settings panel with blocked sites">

---

## ✨ Features

- 🎤 **AI Voice Roasts** — Get called out when you visit distraction sites
- 🔊 **Customizable Intensity** — Soft, Medium, or Savage roasting
- ⏰ **Focus Sessions** — Open Focus, 1 Hour, 2 Hours, or Pomodoro
- 📊 **Track Progress** — Monitor focus time, distractions
- 🎯 **Custom Block Lists** — Add any site you want to avoid
- 💬 **GenZ Authentic** — Real talk, no corporate BS

## 🚀 Installation

### For Hackathon Judges

**This demo version has a pre-configured API key for easy testing.**

1. **Download the repository:**
```bash
git clone https://github.com/yourusername/work-bestie.git
cd work-bestie
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the extension:**
```bash
npm run build
```

4. **Load in Chrome:**
- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist/` folder

5. **Pin the extension:**
- Click the puzzle piece icon 🧩 in your Chrome toolbar
- Find "WorkBestie" in the extensions list
- Click the pin icon 📌 to pin it to your toolbar

6. **Start testing!**
- Click the WorkBestie icon in your toolbar
- Extension is pre-configured and ready to test
- Try visiting Instagram, YouTube, or TikTok to get roasted!

### For End Users (Future Release)

The public release will require users to provide their own ElevenLabs API key:
- Get a free API key from [ElevenLabs](https://elevenlabs.io)
- Enter it in the extension's onboarding flow

## 🎤 ElevenLabs Integration

WorkBestie uses **ElevenLabs Text-to-Speech API** to deliver:
- **Real-time voice roasts** when you visit distraction sites
- **Positive voice feedback** when you refocus
- **Session start/end messages** with personality
- **Customizable voices** (male/female options)
- **72+ unique roast phrases** across 3 intensity levels (soft, medium, savage)

The voice is what makes WorkBestie feel like an actual bestie holding you accountable — not just another productivity tool.

## 🛠️ Tech Stack

- **Framework:** Vanilla JavaScript
- **Build Tool:** Vite
- **Voice AI:** ElevenLabs Text-to-Speech API
- **Platform:** Chrome Extension (Manifest V3)
- **UI:** Custom CSS with neo-brutalist GenZ aesthetic
- **Development:** Built with Kiro AI

## 🎨 Design

Neo-brutalist candy aesthetic with:
- Electric blue (#3B9EFF) for focus states
- Navy (#1E293B) for UI chrome
- Bricolage Grotesque × Plus Jakarta Sans typography
- Phosphor Duotone icons
- Authentic GenZ language

## 📝 Development

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

## 🔑 Environment Variables

Create a `.env` file for local development:

```
ELEVENLABS_API_KEY=your_key_here
```

**Note:** Never commit your actual API key to the repo.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Voice powered by [ElevenLabs](https://elevenlabs.io)
- Icons by [Phosphor Icons](https://phosphoricons.com)
- Inspired by GenZ productivity culture


---

**Built with ☕ for people who actually want to get sh*t done.**
