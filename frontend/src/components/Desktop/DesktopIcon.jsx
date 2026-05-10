import { useState } from 'react';

export default function DesktopIcon({ icon, label, onDoubleClick }) {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`desktop-icon${selected ? ' selected' : ''}`}
      onClick={() => setSelected(!selected)}
      onDoubleClick={() => {
        onDoubleClick?.();
        setSelected(false);
      }}
    >
      <div className="desktop-icon__image">{icon}</div>
      <span className="desktop-icon__label">{label}</span>
    </div>
  );
}
