"""
The Homemade Audiobook - Text-to-Speech Application

A simple GUI application that converts user-provided text into spoken audio
using Python's pyttsx3 library for offline text-to-speech synthesis.

Features:
    - Clean Tkinter GUI interface
    - Multi-line text input
    - Configurable TTS engine settings
    - Status feedback during playback
    - Error handling for TTS operations

Author: Antoine Koerber
License: MIT
"""

from __future__ import annotations

import logging
import threading
import tkinter as tk
from tkinter import messagebox
from typing import TYPE_CHECKING

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lazy import for pyttsx3 to handle import errors gracefully
if TYPE_CHECKING:
    import pyttsx3

# ============================================
# Configuration Constants
# ============================================
WINDOW_WIDTH: int = 700
WINDOW_HEIGHT: int = 350
WINDOW_TITLE: str = "The Homemade Audiobook"

TEXT_AREA_HEIGHT: int = 10
TEXT_AREA_WIDTH: int = 50
TEXT_FONT: tuple[str, int] = ("Arial", 18)

TITLE_FONT: tuple[str, int] = ("Arial", 14)
STATUS_FONT: tuple[str, int] = ("Arial", 10)

# TTS Settings
TTS_RATE: int = 150  # Words per minute
TTS_VOLUME: float = 0.9  # Volume (0.0 to 1.0)


class AudiobookApp:
    """
    Main application class for the Text-to-Speech GUI.

    Manages the Tkinter interface and pyttsx3 TTS engine,
    providing a user-friendly way to convert text to speech.

    Attributes:
        root: The main Tkinter window
        engine: The pyttsx3 TTS engine instance
        text_input: The text input widget
        status_label: Label showing current status
        convert_button: Button to trigger TTS conversion
    """

    def __init__(self, root: tk.Tk) -> None:
        """
        Initialize the AudiobookApp.

        Args:
            root: The Tkinter root window instance
        """
        self.root = root
        self.engine: pyttsx3.Engine | None = None
        self.is_speaking: bool = False

        self._setup_window()
        self._create_widgets()
        self._initialize_engine()

        logger.info("AudiobookApp initialized successfully")

    def _setup_window(self) -> None:
        """Configure the main window properties."""
        self.root.title(WINDOW_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.root.resizable(True, True)
        self.root.minsize(400, 250)

    def _create_widgets(self) -> None:
        """Create and arrange all GUI widgets."""
        # Title label
        title_frame = tk.Frame(self.root)
        title_frame.pack(pady=(15, 10))

        self.title_label = tk.Label(
            title_frame,
            text="Transform any text into spoken audio",
            font=TITLE_FONT
        )
        self.title_label.pack()

        # Text input area
        text_frame = tk.Frame(self.root)
        text_frame.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)

        self.text_input = tk.Text(
            text_frame,
            height=TEXT_AREA_HEIGHT,
            width=TEXT_AREA_WIDTH,
            font=TEXT_FONT,
            wrap=tk.WORD,
            padx=10,
            pady=10
        )
        self.text_input.pack(fill=tk.BOTH, expand=True)

        # Placeholder text
        self.text_input.insert("1.0", "Enter your text here...")
        self.text_input.bind("<FocusIn>", self._clear_placeholder)

        # Button frame
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)

        self.convert_button = tk.Button(
            button_frame,
            text="Convert to Audio",
            command=self._on_convert_click,
            font=("Arial", 12),
            padx=20,
            pady=5
        )
        self.convert_button.pack(side=tk.LEFT, padx=5)

        self.stop_button = tk.Button(
            button_frame,
            text="Stop",
            command=self._stop_speaking,
            font=("Arial", 12),
            padx=20,
            pady=5,
            state=tk.DISABLED
        )
        self.stop_button.pack(side=tk.LEFT, padx=5)

        # Status label
        status_frame = tk.Frame(self.root)
        status_frame.pack(pady=(5, 15))

        self.status_label = tk.Label(
            status_frame,
            text="Ready",
            font=STATUS_FONT,
            fg="gray"
        )
        self.status_label.pack()

    def _initialize_engine(self) -> None:
        """
        Initialize the pyttsx3 TTS engine with configured settings.

        Handles import and initialization errors gracefully.
        """
        try:
            import pyttsx3
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', TTS_RATE)
            self.engine.setProperty('volume', TTS_VOLUME)
            logger.info("TTS engine initialized with rate=%d, volume=%.1f", TTS_RATE, TTS_VOLUME)
        except ImportError:
            logger.error("pyttsx3 module not found")
            self._update_status("Error: pyttsx3 not installed", "red")
            self.convert_button.config(state=tk.DISABLED)
        except Exception as e:
            logger.error("Failed to initialize TTS engine: %s", e)
            self._update_status(f"Error: {e}", "red")
            self.convert_button.config(state=tk.DISABLED)

    def _clear_placeholder(self, event: tk.Event) -> None:
        """
        Clear the placeholder text when the user focuses on the text input.

        Args:
            event: The focus event (unused but required by Tkinter)
        """
        if self.text_input.get("1.0", tk.END).strip() == "Enter your text here...":
            self.text_input.delete("1.0", tk.END)

    def _update_status(self, message: str, color: str = "gray") -> None:
        """
        Update the status label with a message.

        Args:
            message: The status message to display
            color: The text color for the message
        """
        self.status_label.config(text=message, fg=color)
        self.root.update_idletasks()

    def _validate_input(self) -> str | None:
        """
        Validate and retrieve the text input.

        Returns:
            The trimmed text if valid, None otherwise
        """
        text = self.text_input.get("1.0", tk.END).strip()

        if not text or text == "Enter your text here...":
            messagebox.showwarning(
                "Empty Text",
                "Please enter some text before converting to audio."
            )
            return None

        return text

    def _on_convert_click(self) -> None:
        """Handle the convert button click event."""
        if self.engine is None:
            messagebox.showerror(
                "Engine Error",
                "Text-to-speech engine is not available."
            )
            return

        text = self._validate_input()
        if text is None:
            return

        # Run speech in a separate thread to keep UI responsive
        self.is_speaking = True
        self._update_status("Converting to audio...", "blue")
        self.convert_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)

        thread = threading.Thread(target=self._speak_text, args=(text,))
        thread.daemon = True
        thread.start()

    def _speak_text(self, text: str) -> None:
        """
        Convert text to speech in a background thread.

        Args:
            text: The text to convert to speech
        """
        try:
            logger.info("Starting TTS conversion for %d characters", len(text))
            self.engine.say(text)
            self.engine.runAndWait()
            logger.info("TTS conversion completed")

            if self.is_speaking:
                self.root.after(0, self._on_speech_complete)
        except Exception as e:
            logger.error("TTS error: %s", e)
            self.root.after(0, lambda: self._on_speech_error(str(e)))

    def _on_speech_complete(self) -> None:
        """Handle successful speech completion."""
        self.is_speaking = False
        self._update_status("Playback complete", "green")
        self.convert_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)

    def _on_speech_error(self, error: str) -> None:
        """
        Handle speech conversion errors.

        Args:
            error: The error message
        """
        self.is_speaking = False
        self._update_status(f"Error: {error}", "red")
        self.convert_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)

    def _stop_speaking(self) -> None:
        """Stop the current speech playback."""
        if self.engine and self.is_speaking:
            self.engine.stop()
            self.is_speaking = False
            self._update_status("Playback stopped", "orange")
            self.convert_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            logger.info("Speech stopped by user")

    def run(self) -> None:
        """Start the main application loop."""
        logger.info("Starting main event loop")
        self.root.mainloop()


def main() -> None:
    """
    Application entry point.

    Creates the Tkinter root window and initializes the AudiobookApp.
    """
    root = tk.Tk()
    app = AudiobookApp(root)
    app.run()


if __name__ == "__main__":
    main()
