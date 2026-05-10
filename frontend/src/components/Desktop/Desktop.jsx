import { useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import useWindowStore from '../../hooks/useWindowManager.js';
import Background from './Background.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import Taskbar from './Taskbar.jsx';
import TerminalWindow from '../Terminal/TerminalWindow.jsx';
import '../../styles/desktop.css';
import '../../styles/terminal.css';

export default function Desktop() {
  const { windows, createWindow, focusedId } = useWindowStore();
  const initialized = useRef(false);

  // Auto-open first terminal on mount (guarded for StrictMode)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      createWindow();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      createWindow();
    }
  }, [createWindow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const visibleWindows = windows.filter((w) => !w.minimized);

  return (
    <div className="desktop">
      <Background />

      {/* Desktop Icons */}
      <div className="desktop-icons">
        <DesktopIcon
          icon="📟"
          label="Solana Teacher"
          onDoubleClick={createWindow}
        />
        <DesktopIcon
          icon="📄"
          label="Quick Start"
          onDoubleClick={() => {}}
        />
      </div>

      {/* Windows */}
      <div className="desktop-windows">
        <AnimatePresence>
          {visibleWindows.map((win) => (
            <TerminalWindow key={win.id} win={win} isFocused={win.id === focusedId} />
          ))}
        </AnimatePresence>
      </div>

      <Taskbar />
    </div>
  );
}
