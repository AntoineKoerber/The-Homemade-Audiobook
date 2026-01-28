/**
 * The Homemade Audiobook - Web Speech API Application
 *
 * A browser-based text-to-speech application using the Web Speech API.
 *
 * Features:
 * - Voice selection from available system voices
 * - Adjustable speech rate, pitch, and volume
 * - Play, pause, and stop controls
 * - Progress tracking during playback
 * - Dark mode support with persistence
 * - Keyboard shortcuts
 *
 * @author Antoine Koerber
 * @license MIT
 */

const AudiobookApp = (() => {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    STORAGE_KEY: 'audiobook-settings',
    CHAR_LIMIT: 5000,
    SAMPLE_TEXT: `Welcome to The Homemade Audiobook!

This is a free, browser-based text-to-speech tool. Simply paste or type any text you want to listen to, adjust the voice settings to your preference, and press Play.

Perfect for:
• Listening to articles while doing other tasks
• Proofreading your own writing by hearing it read aloud
• Accessibility needs
• Learning and studying

The app uses the Web Speech API, which means it works entirely in your browser - no data is sent to any server. Your privacy is fully protected.

Try adjusting the speed, pitch, and voice settings to find what works best for you. Different voices may be available depending on your operating system and browser.

Enjoy your listening experience!`,
  };

  // ============================================
  // State
  // ============================================
  const state = {
    synth: null,
    utterance: null,
    voices: [],
    isPlaying: false,
    isPaused: false,
    currentCharIndex: 0,
    totalChars: 0,
    sentenceQueue: [],
    sentenceIndex: 0,
    charOffset: 0,
    pauseTimerId: null,
    settings: {
      voiceIndex: 0,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      theme: 'light',
    },
  };

  // ============================================
  // DOM Elements
  // ============================================
  const elements = {};

  const cacheElements = () => {
    elements.textInput = document.getElementById('text-input');
    elements.charCount = document.getElementById('char-count');
    elements.voiceSelect = document.getElementById('voice-select');
    elements.rateSlider = document.getElementById('rate-slider');
    elements.rateValue = document.getElementById('rate-value');
    elements.pitchSlider = document.getElementById('pitch-slider');
    elements.pitchValue = document.getElementById('pitch-value');
    elements.volumeSlider = document.getElementById('volume-slider');
    elements.volumeValue = document.getElementById('volume-value');
    elements.playBtn = document.getElementById('play-btn');
    elements.stopBtn = document.getElementById('stop-btn');
    elements.skipBackBtn = document.getElementById('skip-back-btn');
    elements.skipForwardBtn = document.getElementById('skip-forward-btn');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.pasteBtn = document.getElementById('paste-btn');
    elements.sampleBtn = document.getElementById('sample-btn');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.progressBar = document.getElementById('progress-bar');
    elements.currentWord = document.getElementById('current-word');
    elements.wordProgress = document.getElementById('word-progress');
    elements.statusBar = document.getElementById('status-bar');
    elements.statusText = document.getElementById('status-text');
    elements.browserWarning = document.getElementById('browser-warning');
  };

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Debounce function to limit rapid function calls
   */
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  /**
   * Update status bar with message and optional type
   */
  const updateStatus = (message, type = '') => {
    elements.statusText.textContent = message;
    elements.statusBar.className = 'status-bar';
    if (type) {
      elements.statusBar.classList.add(type);
    }
  };

  /**
   * Update progress bar and word info
   */
  const updateProgress = (charIndex, totalChars) => {
    const progress = totalChars > 0 ? (charIndex / totalChars) * 100 : 0;
    elements.progressBar.style.width = `${progress}%`;

    const text = elements.textInput.value;
    const wordsBefore = text.substring(0, charIndex).split(/\s+/).filter(Boolean).length;
    const totalWords = text.split(/\s+/).filter(Boolean).length;
    elements.wordProgress.textContent = `${wordsBefore} / ${totalWords} words`;
  };

  // ============================================
  // Speech Synthesis Functions
  // ============================================

  /**
   * Check if Web Speech API is supported
   */
  const checkBrowserSupport = () => {
    if (!('speechSynthesis' in window)) {
      elements.browserWarning.hidden = false;
      return false;
    }
    state.synth = window.speechSynthesis;
    return true;
  };

  /**
   * Check if a voice is high quality (premium/enhanced)
   */
  const isHighQualityVoice = (voice) => {
    const name = voice.name.toLowerCase();
    return name.includes('premium') || name.includes('enhanced') ||
           name.includes('natural') || name.includes('neural') ||
           name.includes('samantha') || name.includes('karen') ||
           name.includes('daniel') || name.includes('moira') ||
           name.includes('tessa') || name.includes('fiona');
  };

  /**
   * Load available voices, preferring high-quality English voices
   */
  const loadVoices = () => {
    state.voices = state.synth.getVoices();

    // Sort: high-quality English first, then English, then others
    state.voices.sort((a, b) => {
      const aIsEnglish = a.lang.startsWith('en');
      const bIsEnglish = b.lang.startsWith('en');
      const aIsHQ = isHighQualityVoice(a);
      const bIsHQ = isHighQualityVoice(b);

      // High-quality English first
      if (aIsEnglish && aIsHQ && !(bIsEnglish && bIsHQ)) return -1;
      if (bIsEnglish && bIsHQ && !(aIsEnglish && aIsHQ)) return 1;
      // Then regular English
      if (aIsEnglish && !bIsEnglish) return -1;
      if (!aIsEnglish && bIsEnglish) return 1;
      return a.name.localeCompare(b.name);
    });

    // Populate voice select
    elements.voiceSelect.innerHTML = '';
    state.voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      const langLabel = voice.lang.split('-')[0].toUpperCase();
      const quality = isHighQualityVoice(voice) ? ' ★' : '';
      option.textContent = `${voice.name} (${langLabel})${quality}${voice.default ? ' - Default' : ''}`;
      elements.voiceSelect.appendChild(option);
    });

    // Restore saved voice preference, or auto-select best voice
    if (state.settings.voiceIndex < state.voices.length) {
      elements.voiceSelect.value = state.settings.voiceIndex;
    }

    updateStatus(`${state.voices.length} voices available`);
  };

  // ============================================
  // Natural Speech Processing
  // ============================================

  /**
   * Split text into sentences for more natural delivery.
   * Each sentence gets slight rate/pitch variation.
   */
  const splitIntoSentences = (text) => {
    // Split on sentence-ending punctuation, keeping the delimiter
    const raw = text.split(/(?<=[.!?…])\s+/);
    const sentences = [];

    for (const chunk of raw) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      // Further split very long chunks at commas/semicolons if > 200 chars
      if (trimmed.length > 200) {
        const subChunks = trimmed.split(/(?<=[,;:])\s+/);
        for (const sub of subChunks) {
          if (sub.trim()) sentences.push(sub.trim());
        }
      } else {
        sentences.push(trimmed);
      }
    }

    return sentences.length > 0 ? sentences : [text];
  };

  /**
   * Get a small random variation for natural cadence
   */
  const vary = (base, range) => {
    return base + (Math.random() - 0.5) * 2 * range;
  };

  /**
   * Determine pause duration after a sentence based on punctuation
   */
  const getPauseDuration = (sentence) => {
    const lastChar = sentence.trim().slice(-1);
    if (lastChar === '.' || lastChar === '…') return 400;
    if (lastChar === '!' || lastChar === '?') return 500;
    if (lastChar === ':' || lastChar === ';') return 300;
    if (lastChar === ',') return 150;
    return 200;
  };

  /**
   * Create and configure speech utterance for a single chunk
   */
  const createUtterance = (text, options = {}) => {
    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    const voiceIndex = parseInt(elements.voiceSelect.value, 10);
    if (state.voices[voiceIndex]) {
      utterance.voice = state.voices[voiceIndex];
    }

    // Set speech parameters with optional variation
    const baseRate = parseFloat(elements.rateSlider.value);
    const basePitch = parseFloat(elements.pitchSlider.value);
    utterance.rate = Math.max(0.5, Math.min(2.0, options.rate || baseRate));
    utterance.pitch = Math.max(0.5, Math.min(2.0, options.pitch || basePitch));
    utterance.volume = parseFloat(elements.volumeSlider.value);

    return utterance;
  };

  /**
   * Speak sentences sequentially with natural pauses and variation.
   * This is the core improvement — instead of one giant utterance,
   * each sentence is spoken individually with slight variations.
   */
  const speakNaturally = (fullText) => {
    const sentences = splitIntoSentences(fullText);
    const baseRate = parseFloat(elements.rateSlider.value);
    const basePitch = parseFloat(elements.pitchSlider.value);

    state.totalChars = fullText.length;
    state.isPlaying = true;
    state.isPaused = false;
    state.sentenceQueue = sentences;
    state.sentenceIndex = 0;
    state.charOffset = 0;

    updatePlayButton();
    updateStatus('Playing...', 'playing');

    const speakNext = () => {
      if (!state.isPlaying || state.sentenceIndex >= sentences.length) {
        // All done
        state.isPlaying = false;
        state.isPaused = false;
        state.currentCharIndex = 0;
        updatePlayButton();
        updateProgress(0, 0);
        updateStatus('Playback complete', 'success');
        elements.currentWord.textContent = 'Finished';
        return;
      }

      const sentence = sentences[state.sentenceIndex];
      const sentenceCharOffset = state.charOffset;

      // Slight natural variation per sentence
      const utterance = createUtterance(sentence, {
        rate: vary(baseRate, 0.05),
        pitch: vary(basePitch, 0.03),
      });

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const globalCharIndex = sentenceCharOffset + event.charIndex;
          state.currentCharIndex = globalCharIndex;
          updateProgress(globalCharIndex, state.totalChars);

          // Highlight current word
          const wordEnd = sentence.indexOf(' ', event.charIndex);
          const currentWord = wordEnd > -1
            ? sentence.substring(event.charIndex, wordEnd)
            : sentence.substring(event.charIndex);
          elements.currentWord.textContent = currentWord.trim() || '...';
        }
      };

      utterance.onend = () => {
        state.charOffset += sentence.length + 1; // +1 for space
        state.sentenceIndex++;

        // Pause between sentences for natural rhythm
        const pauseMs = getPauseDuration(sentence);
        state.pauseTimerId = setTimeout(speakNext, pauseMs);
      };

      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          state.isPlaying = false;
          state.isPaused = false;
          updatePlayButton();
          updateStatus(`Error: ${event.error}`, 'error');
          console.error('Speech synthesis error:', event);
        }
      };

      state.utterance = utterance;
      state.synth.speak(utterance);
    };

    speakNext();
  };

  /**
   * Update play button state
   */
  const updatePlayButton = () => {
    const btn = elements.playBtn;
    const icon = btn.querySelector('.play-icon');
    const text = btn.querySelector('.play-text');

    if (state.isPlaying && !state.isPaused) {
      icon.textContent = '⏸️';
      text.textContent = 'Pause';
      btn.classList.add('playing');
    } else if (state.isPaused) {
      icon.textContent = '▶️';
      text.textContent = 'Resume';
      btn.classList.remove('playing');
    } else {
      icon.textContent = '▶️';
      text.textContent = 'Play';
      btn.classList.remove('playing');
    }
  };

  /**
   * Start or resume speech
   */
  const play = () => {
    const text = elements.textInput.value.trim();

    if (!text) {
      updateStatus('Please enter some text first', 'error');
      elements.textInput.focus();
      return;
    }

    if (state.isPaused) {
      state.synth.resume();
      state.isPaused = false;
      state.isPlaying = true;
      updatePlayButton();
      updateStatus('Playing...', 'playing');
      return;
    }

    if (state.isPlaying) {
      state.synth.pause();
      state.isPaused = true;
      updatePlayButton();
      updateStatus('Paused', '');
      return;
    }

    // Cancel any existing speech and timers
    state.synth.cancel();
    if (state.pauseTimerId) {
      clearTimeout(state.pauseTimerId);
      state.pauseTimerId = null;
    }

    // Speak with natural sentence-by-sentence delivery
    speakNaturally(text);
  };

  /**
   * Stop speech completely
   */
  const stop = () => {
    state.synth.cancel();
    if (state.pauseTimerId) {
      clearTimeout(state.pauseTimerId);
      state.pauseTimerId = null;
    }
    state.isPlaying = false;
    state.isPaused = false;
    state.currentCharIndex = 0;
    state.sentenceIndex = 0;
    state.charOffset = 0;
    updatePlayButton();
    updateProgress(0, 0);
    updateStatus('Stopped', '');
    elements.currentWord.textContent = 'Ready';
  };

  /**
   * Skip forward/back (restart with position - limited browser support)
   */
  const skipForward = () => {
    // Most browsers don't support seeking, so we restart faster
    if (state.isPlaying) {
      const currentRate = parseFloat(elements.rateSlider.value);
      const newRate = Math.min(2, currentRate + 0.25);
      elements.rateSlider.value = newRate;
      elements.rateValue.textContent = newRate.toFixed(1);
      updateStatus(`Speed: ${newRate.toFixed(1)}x`, '');

      // Restart with new rate if playing
      if (state.utterance) {
        stop();
        play();
      }
    }
  };

  const skipBack = () => {
    if (state.isPlaying) {
      const currentRate = parseFloat(elements.rateSlider.value);
      const newRate = Math.max(0.5, currentRate - 0.25);
      elements.rateSlider.value = newRate;
      elements.rateValue.textContent = newRate.toFixed(1);
      updateStatus(`Speed: ${newRate.toFixed(1)}x`, '');

      if (state.utterance) {
        stop();
        play();
      }
    }
  };

  // ============================================
  // Settings Functions
  // ============================================

  /**
   * Save settings to localStorage
   */
  const saveSettings = () => {
    state.settings = {
      voiceIndex: parseInt(elements.voiceSelect.value, 10) || 0,
      rate: parseFloat(elements.rateSlider.value),
      pitch: parseFloat(elements.pitchSlider.value),
      volume: parseFloat(elements.volumeSlider.value),
      theme: document.documentElement.getAttribute('data-theme') || 'light',
    };

    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.settings));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  };

  /**
   * Load settings from localStorage
   */
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.settings = { ...state.settings, ...parsed };

        // Apply loaded settings
        elements.rateSlider.value = state.settings.rate;
        elements.rateValue.textContent = state.settings.rate.toFixed(1);
        elements.pitchSlider.value = state.settings.pitch;
        elements.pitchValue.textContent = state.settings.pitch.toFixed(1);
        elements.volumeSlider.value = state.settings.volume;
        elements.volumeValue.textContent = Math.round(state.settings.volume * 100);

        // Apply theme
        if (state.settings.theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          elements.themeToggle.querySelector('.theme-icon').textContent = '☀️';
        }
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  };

  /**
   * Toggle dark/light theme
   */
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeToggle.querySelector('.theme-icon').textContent =
      newTheme === 'dark' ? '☀️' : '🌙';

    saveSettings();
  };

  // ============================================
  // Event Handlers
  // ============================================

  const handleTextInput = () => {
    const length = elements.textInput.value.length;
    elements.charCount.textContent = length;

    // Warn when approaching limit
    if (length >= CONFIG.CHAR_LIMIT * 0.9) {
      elements.charCount.style.color = 'var(--color-danger)';
    } else {
      elements.charCount.style.color = '';
    }
  };

  const handleClear = () => {
    elements.textInput.value = '';
    handleTextInput();
    stop();
    elements.textInput.focus();
    updateStatus('Text cleared', '');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      elements.textInput.value = text.substring(0, CONFIG.CHAR_LIMIT);
      handleTextInput();
      updateStatus('Text pasted from clipboard', 'success');
    } catch (e) {
      updateStatus('Could not access clipboard', 'error');
      elements.textInput.focus();
    }
  };

  const handleSampleText = () => {
    elements.textInput.value = CONFIG.SAMPLE_TEXT;
    handleTextInput();
    updateStatus('Sample text loaded', '');
  };

  const handleSliderChange = (slider, display, format = (v) => v.toFixed(1)) => {
    return () => {
      const value = parseFloat(slider.value);
      display.textContent = format(value);
      saveSettings();
    };
  };

  const handleVoiceChange = () => {
    saveSettings();
    const voice = state.voices[elements.voiceSelect.value];
    if (voice) {
      updateStatus(`Voice: ${voice.name}`, '');
    }
  };

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  const handleKeyboard = (event) => {
    // Ignore if typing in textarea
    if (event.target === elements.textInput) return;

    switch (event.key) {
      case ' ':
        event.preventDefault();
        play();
        break;
      case 'Escape':
        stop();
        break;
      case 'ArrowUp':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          skipForward();
        }
        break;
      case 'ArrowDown':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          skipBack();
        }
        break;
    }
  };

  // ============================================
  // Event Binding
  // ============================================

  const bindEvents = () => {
    // Text input
    elements.textInput.addEventListener('input', handleTextInput);

    // Action buttons
    elements.playBtn.addEventListener('click', play);
    elements.stopBtn.addEventListener('click', stop);
    elements.skipBackBtn.addEventListener('click', skipBack);
    elements.skipForwardBtn.addEventListener('click', skipForward);
    elements.clearBtn.addEventListener('click', handleClear);
    elements.pasteBtn.addEventListener('click', handlePaste);
    elements.sampleBtn.addEventListener('click', handleSampleText);
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Settings sliders
    elements.rateSlider.addEventListener('input',
      handleSliderChange(elements.rateSlider, elements.rateValue));
    elements.pitchSlider.addEventListener('input',
      handleSliderChange(elements.pitchSlider, elements.pitchValue));
    elements.volumeSlider.addEventListener('input',
      handleSliderChange(elements.volumeSlider, elements.volumeValue, (v) => Math.round(v * 100)));

    // Voice selection
    elements.voiceSelect.addEventListener('change', handleVoiceChange);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Voice loading (Chrome loads voices async)
    if (state.synth.onvoiceschanged !== undefined) {
      state.synth.onvoiceschanged = loadVoices;
    }
  };

  // ============================================
  // Initialization
  // ============================================

  const init = () => {
    cacheElements();

    if (!checkBrowserSupport()) {
      return;
    }

    loadSettings();
    bindEvents();

    // Load voices (may be async in Chrome)
    loadVoices();
    if (state.voices.length === 0) {
      // Chrome loads voices asynchronously
      setTimeout(loadVoices, 100);
    }

    // Initialize character count
    handleTextInput();

    console.log('The Homemade Audiobook initialized');
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API for debugging
  return {
    getState: () => ({ ...state }),
    play,
    stop,
  };
})();
