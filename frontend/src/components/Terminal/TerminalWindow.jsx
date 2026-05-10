import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { motion } from 'framer-motion';
import useWindowStore from '../../hooks/useWindowManager.js';
import Terminal from './Terminal.jsx';

export default function TerminalWindow({ win, isFocused }) {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updatePosition,
    updateSize,
  } = useWindowStore();

  const handleDragStop = useCallback((_e, d) => {
    updatePosition(win.id, d.x, d.y);
  }, [win.id, updatePosition]);

  const handleResizeStop = useCallback((_e, _dir, ref, _delta, pos) => {
    updateSize(win.id, parseInt(ref.style.width), parseInt(ref.style.height));
    updatePosition(win.id, pos.x, pos.y);
  }, [win.id, updateSize, updatePosition]);

  return (
    <Rnd
      position={{ x: win.x, y: win.y }}
      size={{ width: win.width, height: win.height }}
      minWidth={400}
      minHeight={300}
      bounds="parent"
      dragHandleClassName="titlebar"
      style={{ zIndex: win.zIndex }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => focusWindow(win.id)}
      disableDragging={win.maximized}
      enableResizing={!win.maximized}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Terminal
          id={win.id}
          title={win.title}
          isFocused={isFocused}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          isMaximized={win.maximized}
        />
      </motion.div>
    </Rnd>
  );
}
