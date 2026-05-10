import { create } from 'zustand';

let nextId = 1;
let nextZ = 10;

const CASCADE_OFFSET = 24;

const useWindowStore = create((set, get) => ({
  windows: [],
  focusedId: null,

  createWindow: () => {
    const existing = get().windows;
    let titleNum = 1;
    const existingTitles = existing.map(w => w.title);
    while (existingTitles.includes(`Terminal ${titleNum}`)) {
      titleNum++;
    }
    const id = `terminal-${nextId++}`;
    const active = existing.filter((w) => !w.minimized);
    const offset = active.length * CASCADE_OFFSET;
    const win = {
      id,
      title: `Terminal ${titleNum}`,
      x: 80 + offset,
      y: 40 + offset,
      width: 680,
      height: 440,
      zIndex: nextZ++,
      minimized: false,
      maximized: false,
      prevBounds: null,
    };
    set((s) => ({
      windows: [...s.windows, win],
      focusedId: id,
    }));
    return id;
  },

  closeWindow: (id) => {
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      focusedId: s.focusedId === id ? (s.windows.find((w) => w.id !== id)?.id || null) : s.focusedId,
    }));
  },

  focusWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex: nextZ++ } : w
      ),
      focusedId: id,
    }));
  },

  minimizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w
      ),
      focusedId: s.focusedId === id
        ? (s.windows.find((w) => w.id !== id && !w.minimized)?.id || null)
        : s.focusedId,
    }));
  },

  restoreWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: nextZ++ } : w
      ),
      focusedId: id,
    }));
  },

  maximizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.prevBounds?.x ?? 80,
            y: w.prevBounds?.y ?? 40,
            width: w.prevBounds?.width ?? 680,
            height: w.prevBounds?.height ?? 440,
            zIndex: nextZ++,
          };
        }
        return {
          ...w,
          maximized: true,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 52,
          zIndex: nextZ++,
        };
      }),
      focusedId: id,
    }));
  },

  updatePosition: (id, x, y) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  updateSize: (id, width, height) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },
}));

export default useWindowStore;
