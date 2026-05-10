# DESIGN.md — Solana AI Teacher

> Retro desktop OS simulator for teaching Solana. Make dark rectangles look cool.

---

## 1. Visual Identity

- **Vibe**: Warp terminal meets retro pixel OS — glass panels on a dark animated canvas
- **Aesthetic reference**: termcn.dev component density + CRT terminal nostalgia + Solana brand
- **Rule**: Terminal window is always the hero. Everything else is chrome.
- **Desktop metaphor**: Floating draggable windows over an animated pixel-art Solana background
- Monospace everywhere. No rounded sans-serif. No pastel UI.

---

## 2. Color Palette

```
Background (desktop):   #0a0a0f          ← near-black, slightly blue-tinted
Terminal surface:        rgba(13,17,23,0.95)  with backdrop-filter: blur(12px)
Desktop overlay:         rgba(10,10,15,0.6)

Primary accent:          #9945FF          ← Solana purple
Secondary accent:        #14F195          ← Solana green
Dim accent:              #512da8          ← muted purple (inactive states)

Prompt text:             #14F195          ← green  →  solana@devnet:~$
Output text:             #e6edf3          ← near-white
Dim text:                #6e7681          ← secondary / timestamps
Error:                   #f47067          ← red
Warning:                 #f0c060          ← amber
Info:                    #58a6ff          ← blue
Success:                 #3fb950          ← green (distinct from prompt)

Titlebar:                rgba(22,27,34,0.98)
Border:                  rgba(48,54,61,0.8)
Selection highlight:     rgba(153,69,255,0.3)
```

---

## 3. Typography

```
Primary:   'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace
UI labels: Same — no exceptions. Even taskbar clock.
Size:      Terminal body 13px / Prompt 13px / Titlebar 12px / Desktop label 11px
Weight:    400 body, 600 for command names, 700 for accents sparingly
```

Load via Google Fonts: `JetBrains+Mono:wght@400;600;700`

---

## 4. Animated Background

Three layered canvas elements (z-index 0):

1. **Pixel grid** — subtle `#9945FF` grid lines at 32px spacing, 4% opacity
2. **Floating particles** — 40–60 tiny dots drifting upward, Solana purple/green, 15–30% opacity
3. **ASCII Solana logo** — large, centered, 3% opacity, slow pulse animation

Optional: Matrix-style falling hex characters in `#14F195` at 8% opacity if you want extra drama.

```css
.desktop-bg {
  background: radial-gradient(ellipse at 20% 50%, rgba(153,69,255,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(20,241,149,0.05) 0%, transparent 50%),
              #0a0a0f;
}
```

---

## 5. Window Rules

| Property        | Value                                      |
|----------------|--------------------------------------------|
| Border radius  | `10px`                                     |
| Border         | `1px solid rgba(48,54,61,0.8)`             |
| Shadow (idle)  | `0 8px 32px rgba(0,0,0,0.6)`              |
| Shadow (active)| `0 16px 48px rgba(153,69,255,0.25)`       |
| Backdrop blur  | `blur(12px) saturate(1.4)`                 |
| Min size       | `400 × 300px`                              |
| Titlebar height| `36px`                                     |

**Titlebar anatomy (left → right):**
```
[⚫ 🟡 🟢]  Terminal 1          [🎤] [─] [□] [✕]
```
- Traffic light buttons: 12px circles, `#ff5f57` / `#ffbd2e` / `#28c840`
- Title: centered, dim color `#6e7681`, 12px
- Right icons: mic (voice toggle), minimize, maximize, close

**Window stack**: Active window gets `z-index` priority + purple shadow glow. Others go flat.

---

## 6. Terminal Interior

```
┌─ Titlebar ───────────────────────────────────────────┐
│ ⚫ 🟡 🟢   Terminal 1                    🎤  ─  □  ✕ │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Solana Voice Teacher v1.0                           │  ← dim, on load
│  Connected to DEVNET · Type 'help' to start          │
│                                                      │
│  solana@devnet:~$ balance                            │  ← #14F195 prompt
│  Fetching wallet balance...                          │  ← #e6edf3, typed char-by-char
│  ◆ Balance: 2.5 SOL                                  │  ← #9945FF bullet for success
│                                                      │
│  solana@devnet:~$ █                                  │  ← blinking cursor
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Scrollable output, `overflow-y: auto`, custom scrollbar (`#9945FF`, 4px, rounded)
- Input sits at bottom, inline with prompt — NOT a separate input box
- Blinking cursor: `animation: blink 1s step-end infinite`

---

## 7. Motion Rules

| Interaction         | Duration  | Easing              |
|--------------------|-----------|---------------------|
| Window open        | `200ms`   | `ease-out`          |
| Window close       | `150ms`   | `ease-in`           |
| Window minimize    | `180ms`   | `cubic-bezier(...)` scale to taskbar |
| Drag shadow pop    | `100ms`   | `ease-out`          |
| Typing (AI output) | `25–40ms/char` | none (interval) |
| Hover states       | `120ms`   | `ease`              |
| Voice pulse        | `800ms`   | `ease-in-out`, infinite |

**No** bounce. **No** spring physics. **No** excessive parallax.  
Framer Motion `AnimatePresence` for mount/unmount. Keep `duration` values tight.

---

## 8. Taskbar

Bottom bar, `52px` tall, `rgba(13,17,23,0.9)`, `border-top: 1px solid rgba(48,54,61,0.6)`.

```
[Solana Logo]  [Terminal ●]  [Wallet ○]  [Explorer ○]  ·····  [DEVNET ●]  [12:34]
  ← app dock (left)                                           status (right) →
```

- Active app (Terminal): dot indicator `#14F195` below icon
- Inactive apps: `opacity: 0.4`, not clickable (greyed out with tooltip "Coming soon")
- DEVNET badge: `#14F195` pulsing dot + text
- Minimized windows appear as labeled tabs between dock and status

---

## 9. Desktop Icons

Grid-snapped, top-left corner. Two icons on load:

```
[📟]              [📄]
Solana Teacher    Quick Start
(double-click     (non-functional,
opens terminal)    aesthetic only)
```

Icon style: pixel-art style emoji or SVG, 48×48, with label below in 11px monospace. Hover: faint purple glow. Selected: `rgba(153,69,255,0.2)` box.

---

## 10. UX Philosophy

- **One interaction model**: type in the terminal, or speak. Nothing else.
- **AI responses stream in**, character by character. Never appear all at once.
- **Errors are helpful**, not cryptic: `Command not found. Try 'help'.`
- **Backend offline**: show `[OFFLINE]` badge in titlebar, disable input, explain in terminal.
- **Voice button**: pulsing purple ring while listening. Auto-submits on silence (1.5s).
- **New windows cascade** offset `+24px / +24px` from last.
- **Focus follows click** — z-index bump + shadow glow on active window.
- **No modals, no sidebars, no settings panels**. This is a hackathon demo. Keep it surgical.

---

## 11. Tech Constraints

```
react-rnd          → drag/resize windows
framer-motion      → mount/unmount animations
zustand            → window state (list, focus, positions)
react-hot-toast    → connection/error notifications (bottom-right)
Web Speech API     → voice input + TTS output (no external lib needed)
CSS backdrop-filter → glass panels (no extra lib)
```

CSS-in-JS or plain CSS modules — avoid Tailwind for terminal components (inline control beats utility classes here). Tailwind fine for desktop shell.

---

## 12. Welcome ASCII Art (Terminal Boot)

Display this on first terminal open, typed out at `15ms/char`:

```
  ██████  ██████  ██      █████  ███    ██  █████
  ██      ██  ██  ██     ██   ██ ████   ██ ██   ██
  ███████ ██  ██  ██     ███████ ██ ██  ██ ███████
       ██ ██  ██  ██     ██   ██ ██  ██ ██ ██   ██
  ██████  ██████  ██████ ██   ██ ██   ████ ██   ██

  AI Teacher  ·  Devnet  ·  v1.0.0
  ─────────────────────────────────
  Type 'help' for commands.
  Press 🎤 or say "hey solana" to use voice.
```