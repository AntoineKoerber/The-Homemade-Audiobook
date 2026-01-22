# The Homemade Audiobook

A simple text-to-speech application built with Python and Tkinter. Convert any text into spoken audio with just one click!

## Features

- **Simple Interface**: Clean, easy-to-use GUI
- **Real-time Conversion**: Instant text-to-speech processing
- **Large Text Area**: Comfortable space for longer texts
- **Cross-platform**: Works on Windows, macOS, and Linux

## Requirements

- Python 3.6+
- pyttsx3 (text-to-speech library)
- tkinter (usually included with Python)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AntoineKoerber/The-Homemade-Audiobook.git
   cd The-Homemade-Audiobook
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python main.py
   ```

## Usage

1. Launch the application
2. Type or paste your text into the text area
3. Click "Turn into audio" button
4. Listen to your text being read aloud!

## Project Structure

```
├── main.py             # Main application
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Technical Details

- **GUI Framework**: Tkinter
- **Text-to-Speech**: pyttsx3 (offline TTS engine)
- **Font**: Arial 20pt for comfortable reading

## Use Cases

- Proofreading written content
- Creating audio versions of notes
- Accessibility tool for reading text aloud
- Learning pronunciation

## Customization

You can modify in `main.py`:
- Window size (default: 700x300)
- Font size and family
- Button text and styling

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Antoine Koerber
