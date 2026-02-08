import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const RAIN_CHARS = ['0', '1', '/', '\\', '|', '-', '+', '*', '#'];
const COLUMN_COUNT = 30;
const RAIN_COLOR = '#00ff41';
const GRID_COLOR = 'rgba(0, 255, 65, 0.06)';
const GRID_SPACING = 48;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function LoadingScreen() {
  const sceneReady = useGameStore((s) => s.sceneReady);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain canvas effect
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

    const drops = Array.from({ length: COLUMN_COUNT }, (_, i) => {
      const spacing = window.innerWidth / COLUMN_COUNT;
      return {
        x: i * spacing + spacing / 2,
        y: Math.random() * window.innerHeight,
        speed: rand(12, 25),
        alpha: rand(0.03, 0.10),
        char: RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
      };
    });

    function draw(time: number) {
      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.fillStyle = '#000000';
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

      // Rain
      ctx!.font = '14px "Courier New", monospace';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      for (const drop of drops) {
        drop.y += drop.speed * dt;
        if (drop.y > h + 14) {
          drop.y = -14;
          drop.char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
          drop.alpha = rand(0.03, 0.10);
          drop.speed = rand(12, 25);
        }
        ctx!.globalAlpha = drop.alpha;
        ctx!.fillStyle = RAIN_COLOR;
        ctx!.fillText(drop.char, drop.x, drop.y);
      }
      ctx!.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (!sceneReady) return;

    // Buffer so the scene is fully stable before we go semi-transparent
    const fadeTimer = setTimeout(() => setFading(true), 1200);

    // Remove from DOM after fade completes
    const removeTimer = setTimeout(() => setVisible(false), 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [sceneReady]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        fontFamily: 'var(--font-hud)',
        opacity: fading ? 0 : 1,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <img
          src="/jacobs-logo.png"
          alt=""
          className="w-24 mb-6"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="text-hud-accent text-2xl tracking-[0.4em] mb-4">
          J.A.C.O.B.S.
        </div>
        <div className="text-hud-dim text-xs tracking-[0.25em] mb-8">
          JUST ANOTHER CORPORATE OFFICE BEHAVIOR SYSTEM
        </div>
        <div className="text-hud-text text-sm tracking-wider animate-pulse">
          INITIALIZING...
        </div>
      </div>
    </div>
  );
}
