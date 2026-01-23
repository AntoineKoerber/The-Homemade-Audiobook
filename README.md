# The Homemade Audiobook

A free, browser-based text-to-speech tool that transforms any text into spoken audio. No installation, no sign-up, completely private.

**[Try it live →](https://antoinekoerber.github.io/The-Homemade-Audiobook/)**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://antoinekoerber.github.io/The-Homemade-Audiobook/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Screenshot](https://via.placeholder.com/800x400?text=Screenshot+Coming+Soon)

## Features

- **100% Browser-Based** — Uses the Web Speech API, no server required
- **Multiple Voices** — Choose from any voice installed on your system
- **Adjustable Settings** — Control speed, pitch, and volume
- **Play/Pause/Stop** — Full playback controls
- **Progress Tracking** — Visual progress bar and word counter
- **Dark Mode** — Easy on the eyes, with preference persistence
- **Keyboard Shortcuts** — Space to play/pause, Escape to stop
- **Privacy First** — Your text never leaves your browser
- **Responsive Design** — Works on desktop and mobile

## Quick Start

### Use Online (Recommended)

Just visit the live demo — no installation needed:

**[https://antoinekoerber.github.io/The-Homemade-Audiobook/](https://antoinekoerber.github.io/The-Homemade-Audiobook/)**

### Run Locally

```bash
# Clone the repository
git clone https://github.com/AntoineKoerber/The-Homemade-Audiobook.git
cd The-Homemade-Audiobook

# Open in browser (no build step needed)
open index.html
# Or on Linux:
xdg-open index.html
# Or just drag index.html into your browser
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Escape` | Stop |
| `Ctrl + ↑` | Increase speed |
| `Ctrl + ↓` | Decrease speed |

## Browser Support

The app uses the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), supported in:

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Safari | ✅ Full support |
| Firefox | ⚠️ Limited (no voice events) |

## Project Structure

```
The-Homemade-Audiobook/
├── index.html              # Main web application
├── static/
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       └── app.js          # Web Speech API implementation
├── main.py                 # Desktop version (Python/Tkinter)
├── requirements.txt        # Python dependencies
├── LICENSE                 # MIT License
└── README.md
```

## Technical Implementation

### Web Version (Primary)
- **Speech Synthesis**: Web Speech API (`SpeechSynthesisUtterance`)
- **State Management**: Vanilla JavaScript with IIFE module pattern
- **Styling**: CSS Custom Properties for theming
- **Storage**: localStorage for settings persistence
- **No Dependencies**: Pure HTML/CSS/JS, no build step

### Desktop Version (Alternative)
- **GUI**: Python Tkinter
- **TTS Engine**: pyttsx3 (offline)
- **Threading**: Background speech for responsive UI

## Deploying Your Own Instance

### GitHub Pages (Recommended)

1. Fork this repository
2. Go to Settings → Pages
3. Set source to "main" branch
4. Your site will be live at `https://[username].github.io/The-Homemade-Audiobook/`

### Other Hosting

Since this is a static site, you can host it anywhere:
- Netlify
- Vercel
- Cloudflare Pages
- Any static file server

Just upload the `index.html` and `static/` folder.

## Privacy

This application runs entirely in your browser. Your text is never sent to any server. The Web Speech API uses your system's built-in text-to-speech engine.

## Use Cases

- 📚 **Reading** — Listen to articles, emails, or documents
- ✍️ **Proofreading** — Hear your writing read back to you
- 🎓 **Learning** — Study notes hands-free
- ♿ **Accessibility** — Alternative to reading text
- 🌍 **Language** — Practice pronunciation with different voices

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Antoine Koerber**

- GitHub: [@AntoineKoerber](https://github.com/AntoineKoerber)
