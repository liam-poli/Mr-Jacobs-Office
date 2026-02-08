import { useEffect, useRef } from 'react';

const RAIN_CHARS = ['0', '1', '/', '\\', '|', '-', '+', '*', '#'];
const GRID_SPACING = 48;
const GRID_COLOR = 'rgba(0, 255, 65, 0.08)';
const COLUMN_COUNT = 35;
const RAIN_COLOR = '#00ff41';
const RAIN_ALPHA_MIN = 0.04;
const RAIN_ALPHA_MAX = 0.12;
const RAIN_SPEED_MIN = 15;
const RAIN_SPEED_MAX = 30;
const RAIN_FONT_SIZE = 14;
const BG_COLOR = '#0c0f16';

interface Drop {
  x: number;
  y: number;
  speed: number;
  alpha: number;
  char: string;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomChar() {
  return RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
}

export function AdminMatrixBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let lastTime = 0;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Init drops
    const drops: Drop[] = [];
    const spacing = window.innerWidth / COLUMN_COUNT;
    for (let i = 0; i < COLUMN_COUNT; i++) {
      drops.push({
        x: i * spacing + spacing / 2,
        y: Math.random() * window.innerHeight,
        speed: rand(RAIN_SPEED_MIN, RAIN_SPEED_MAX),
        alpha: rand(RAIN_ALPHA_MIN, RAIN_ALPHA_MAX),
        char: randomChar(),
      });
    }

    let frameCount = 0;

    function draw(time: number) {
      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Fill with bg color (covers the whole canvas cleanly)
      ctx!.fillStyle = BG_COLOR;
      ctx!.fillRect(0, 0, w, h);

      // Grid
      ctx!.strokeStyle = GRID_COLOR;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let x = 0; x <= w; x += GRID_SPACING) {
        ctx!.moveTo(x + 0.5, 0);
        ctx!.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += GRID_SPACING) {
        ctx!.moveTo(0, y + 0.5);
        ctx!.lineTo(w, y + 0.5);
      }
      ctx!.stroke();

      // Rain drops
      ctx!.font = `${RAIN_FONT_SIZE}px "Courier New", monospace`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      for (const drop of drops) {
        drop.y += drop.speed * dt;
        if (drop.y > h + RAIN_FONT_SIZE) {
          drop.y = -RAIN_FONT_SIZE;
          drop.char = randomChar();
          drop.alpha = rand(RAIN_ALPHA_MIN, RAIN_ALPHA_MAX);
          drop.speed = rand(RAIN_SPEED_MIN, RAIN_SPEED_MAX);
        }
        ctx!.globalAlpha = drop.alpha;
        ctx!.fillStyle = RAIN_COLOR;
        ctx!.fillText(drop.char, drop.x, drop.y);
      }
      ctx!.globalAlpha = 1;

      // Occasional flicker
      frameCount++;
      if (frameCount % 10 === 0) {
        const idx = Math.floor(Math.random() * drops.length);
        drops[idx].char = randomChar();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
