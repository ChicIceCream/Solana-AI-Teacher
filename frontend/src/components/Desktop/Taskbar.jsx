import { useState, useEffect } from 'react';
import useWindowStore from '../../hooks/useWindowManager.js';

export default function Taskbar() {
  const { windows, createWindow, focusedId, restoreWindow } = useWindowStore();
  const minimized = windows.filter((w) => w.minimized);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="taskbar">
      {/* Dock */}
      <div className="taskbar__dock">
        <div className="taskbar__logo">◎</div>

        <div
          className={`taskbar__app tooltip-wrapper active`}
          data-tooltip="Terminal"
          onClick={() => createWindow()}
        >
          ⌨️
        </div>

        <div className="taskbar__app tooltip-wrapper disabled" data-tooltip="Coming soon">
          💰
        </div>

        <div className="taskbar__app tooltip-wrapper disabled" data-tooltip="Coming soon">
          🔍
        </div>
      </div>

      {/* Minimized windows */}
      <div className="taskbar__minimized">
        {minimized.map((w) => (
          <button
            key={w.id}
            className="taskbar__minimized-tab"
            onClick={() => restoreWindow(w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>

      <div className="taskbar__spacer" />

      {/* Status */}
      <div className="taskbar__status">
        <div className="taskbar__devnet">
          <span className="taskbar__devnet-dot" />
          DEVNET
        </div>
        <div className="taskbar__clock">{time}</div>
      </div>
    </div>
  );
}
