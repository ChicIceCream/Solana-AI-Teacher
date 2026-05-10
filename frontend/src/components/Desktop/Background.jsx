import { useEffect, useRef } from 'react';

/*
 * Animated background with three layers:
 * 1. Pixel grid (purple lines)
 * 2. Floating particles (purple + green)
 * 3. Matrix-style falling hex chars
 */
export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.1),
      size: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? '#9945ff' : '#14f195',
      alpha: Math.random() * 0.15 + 0.08,
    }));

    // Matrix columns
    const FONT_SIZE = 12;
    const cols = Math.floor(w / FONT_SIZE);
    const drops = Array.from({ length: cols }, () => Math.random() * -100);
    const hexChars = '0123456789ABCDEF';

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Layer 1: Grid
      ctx.strokeStyle = 'rgba(153, 69, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Layer 2: Matrix rain
      ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < drops.length; i++) {
        if (Math.random() > 0.97) { // Sparse rain
          const char = hexChars[Math.floor(Math.random() * hexChars.length)];
          const x = i * FONT_SIZE;
          const y = drops[i] * FONT_SIZE;
          ctx.fillStyle = 'rgba(20, 241, 149, 0.06)';
          ctx.fillText(char, x, y);
          drops[i]++;
          if (y > h && Math.random() > 0.95) drops[i] = 0;
        }
      }

      // Layer 3: Floating particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba').replace('#9945ff', 'rgba(153,69,255').replace('#14f195', 'rgba(20,241,149');
        // Simpler approach:
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="desktop-bg">
      <canvas ref={canvasRef} />
    </div>
  );
}
