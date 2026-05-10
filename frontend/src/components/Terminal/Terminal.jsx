import { useState, useEffect, useRef, useCallback } from 'react';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: '🌑' },
  { id: 'matrix', label: 'Matrix', icon: '🟢' },
  { id: 'solana', label: 'Solana', icon: '💜' },
  { id: 'retro', label: 'Retro', icon: '🟠' },
];
import useVoice from '../../hooks/useVoice.js';
import { getWelcome, executeCommand, getPrompt } from '../../services/commands.js';

const TYPE_SPEED = 7; // ms per char

export default function Terminal({ id, title, isFocused, onClose, onMinimize, onMaximize, isMaximized }) {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [connected, setConnected] = useState(true);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeDropdownRef = useRef(null);
  const [terminalUser, setTerminalUser] = useState('solana');
  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const typingRef = useRef(null);

  // Voice
  const onVoiceResult = useCallback((transcript) => {
    if (transcript.trim()) {
      handleSubmit(transcript.trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { listening, transcript, supported, startListening, stopListening, speak } = useVoice(onVoiceResult);

  // Welcome message on mount (guarded for StrictMode)
  const welcomeShown = useRef(false);
  useEffect(() => {
    if (!welcomeShown.current) {
      welcomeShown.current = true;
      const welcomeText = getWelcome();
      typeTextToOutput(welcomeText, 'welcome', 12);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on click
  const focusInput = useCallback(() => {
    // If user is selecting text, don't steal focus
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    if (inputRef.current && !isProcessing) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  // Type text character by character
  const typeTextToOutput = useCallback((text, type = 'info', speed = TYPE_SPEED) => {
    return new Promise((resolve) => {
      const lineId = Date.now() + Math.random();
      setLines((prev) => [...prev, { id: lineId, text: '', type, typing: true }]);

      let i = 0;
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setLines((prev) =>
            prev.map((l) => (l.id === lineId ? { ...l, text: text.slice(0, i + 1) } : l))
          );
          i++;
        } else {
          clearInterval(intervalId);
          setLines((prev) =>
            prev.map((l) => (l.id === lineId ? { ...l, typing: false } : l))
          );
          resolve();
        }
      }, speed);
      
      typingRef.current = intervalId;
    });
  }, []);

  // Submit command
  const handleSubmit = useCallback(async (cmd) => {
    const command = cmd || input;
    if (!command.trim() || isProcessing) return;

    // Add command to output
    setLines((prev) => [
      ...prev,
      { id: Date.now(), text: command, type: 'command', prompt: getPrompt(terminalUser), typing: false },
    ]);

    // Add to history
    setHistory((prev) => [command, ...prev].slice(0, 50));
    setHistoryIdx(-1);
    setInput('');
    setIsProcessing(true);

    try {
      const result = await executeCommand(command, terminalUser);

      if (!result) {
        setIsProcessing(false);
        return;
      }

      if (result.newUser) {
        setTerminalUser(result.newUser);
      }

      // Handle system commands
      if (result.text === '__CLEAR__') {
        setLines([]);
        setIsProcessing(false);
        return;
      }

      await typeTextToOutput(result.text, result.type);

      // Speak the response (only first 200 chars to avoid long TTS)
      if (result.type !== 'system') {
        const speakText = result.text.replace(/[◆✕⚠]/g, '').trim();
        if (speakText.length > 0 && speakText.length < 300) {
          speak(speakText);
        }
      }
    } catch (err) {
      await typeTextToOutput(`  ✕ Error: ${err.message}`, 'error');
    }

    setIsProcessing(false);
    setTimeout(focusInput, 50);
  }, [input, isProcessing, typeTextToOutput, speak, focusInput]);

  // Handle key events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [handleSubmit, history, historyIdx, onClose]);

  const themeClass = theme !== 'dark' ? `theme-${theme}` : '';

  return (
    <div
      className={`terminal-window ${isFocused ? 'focused' : ''} ${themeClass}`}
      onClick={focusInput}
    >
      {/* Titlebar */}
      <div className="titlebar">
        <div className="titlebar__lights">
          <button className="titlebar__light titlebar__light--close" onClick={onClose} />
          <button className="titlebar__light titlebar__light--minimize" onClick={onMinimize} />
          <button className="titlebar__light titlebar__light--maximize" onClick={onMaximize} />
        </div>

        <span className="titlebar__title">
          {title}
          {!connected && <span className="titlebar__offline">[OFFLINE]</span>}
        </span>

        <div className="titlebar__actions">
          {/* Theme Dropdown */}
          <div className="theme-dropdown-wrapper" ref={themeDropdownRef}>
            <button
              className="titlebar__btn theme-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setThemeOpen((o) => !o);
              }}
              title="Switch theme"
            >
              {THEMES.find((t) => t.id === theme)?.icon || '🎨'}
            </button>
            {themeOpen && (
              <div className="theme-dropdown">
                <div className="theme-dropdown__header">Theme</div>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-dropdown__item ${theme === t.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(t.id);
                      setThemeOpen(false);
                    }}
                  >
                    <span className="theme-dropdown__icon">{t.icon}</span>
                    <span className="theme-dropdown__label">{t.label}</span>
                    {theme === t.id && <span className="theme-dropdown__check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Button */}
          {supported && (
            <button
              className={`voice-btn ${listening ? 'listening' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                listening ? stopListening() : startListening();
              }}
              title={listening ? 'Stop listening' : 'Start voice input'}
            >
              🎤
            </button>
          )}

          <button className="titlebar__btn" onClick={onMinimize} title="Minimize">─</button>
          <button className="titlebar__btn" onClick={onMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? '❐' : '□'}
          </button>
          <button className="titlebar__btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body" ref={bodyRef}>
        <div className="terminal-output">
          {lines.map((line) => (
            <div key={line.id} className={`output-line output-line--${line.type}`}>
              {line.type === 'command' ? (
                <>
                  <span className="prompt">{line.prompt || getPrompt(terminalUser)}</span>
                  {line.text}
                </>
              ) : (
                line.text
              )}
              {line.typing && <span className="cursor-blink">▌</span>}
            </div>
          ))}
        </div>

        {/* Input */}
        {!isProcessing && (
          <div className="terminal-input-area">
            <span className="prompt">{getPrompt(terminalUser)}</span>
            <input
              ref={inputRef}
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : ''}
              autoFocus={isFocused}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        )}
      </div>

      {/* Voice Transcript */}
      {listening && transcript && (
        <div className="voice-transcript">
          🎤 {transcript}
        </div>
      )}
    </div>
  );
}
