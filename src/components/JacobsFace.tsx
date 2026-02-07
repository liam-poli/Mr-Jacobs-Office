import { useEffect, useState, useRef, useCallback } from 'react';
import { useJacobsStore } from '../stores/jacobsStore';
import { useGameStore } from '../stores/gameStore';
import type { JacobsMood } from '../types/jacobs';
import { getMoodColor, MOOD_SEVERITY } from '../utils/moodUtils';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

// Glitch interval per mood (ms) — matches Phaser OfficeScene
const GLITCH_INTERVAL: Record<JacobsMood, number> = {
  PLEASED: 15000, PROUD: 14000, AMUSED: 13000, IMPRESSED: 14000, GENEROUS: 15000,
  NEUTRAL: 8000, BORED: 9000,
  SUSPICIOUS: 4000, SMUG: 5000,
  DISAPPOINTED: 1500, SAD: 2000, PARANOID: 1200, FURIOUS: 1000,
  UNHINGED: 500, MANIC: 400, GLITCHING: 300,
};

// Static overlay base alpha per mood
const STATIC_ALPHA: Record<JacobsMood, number> = {
  PLEASED: 0.01, PROUD: 0.02, AMUSED: 0.02, IMPRESSED: 0.02, GENEROUS: 0.01,
  NEUTRAL: 0.05, BORED: 0.06,
  SUSPICIOUS: 0.12, SMUG: 0.10,
  DISAPPOINTED: 0.25, SAD: 0.22, PARANOID: 0.28, FURIOUS: 0.30,
  UNHINGED: 0.45, MANIC: 0.40, GLITCHING: 0.50,
};

// Flicker config per mood — severity 4-5 moods only
const FLICKER_CONFIG: Partial<Record<JacobsMood, { speed: number; steps: number; pause: number }>> = {
  DISAPPOINTED: { speed: 150, steps: 3, pause: 5000 },
  SAD: { speed: 200, steps: 2, pause: 6000 },
  PARANOID: { speed: 120, steps: 4, pause: 3000 },
  FURIOUS: { speed: 100, steps: 5, pause: 2500 },
  UNHINGED: { speed: 80, steps: 6, pause: 2000 },
  MANIC: { speed: 60, steps: 8, pause: 1500 },
  GLITCHING: { speed: 40, steps: 10, pause: 1000 },
};

// Generate a small static noise data URL once
function generateStaticNoise(): string {
  const canvas = document.createElement('canvas');
  const S = 64;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      const a = Math.random() * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  return canvas.toDataURL();
}

let staticNoiseUrl: string | null = null;
function getStaticNoise(): string {
  if (!staticNoiseUrl) staticNoiseUrl = generateStaticNoise();
  return staticNoiseUrl;
}

export function JacobsFace() {
  const mood = useJacobsStore((s) => s.mood);
  const faceUrl = useJacobsStore((s) => s.faceDataUrls[s.mood]);
  const blinkUrl = useJacobsStore((s) => s.blinkFaceDataUrls[s.mood]);
  const sceneReady = useGameStore((s) => s.sceneReady);

  const [isBlinking, setIsBlinking] = useState(false);
  const [glitchX, setGlitchX] = useState(0);
  const [tintColor, setTintColor] = useState<string | null>(null);
  const [staticBurst, setStaticBurst] = useState(false);
  const [flickerAlpha, setFlickerAlpha] = useState(1);

  const blinkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const glitchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flickerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // --- Blink loop ---
  const scheduleBlink = useCallback(() => {
    if (MOOD_SEVERITY[mood] >= 5) return;
    const delay = 3000 + Math.random() * 4000;
    blinkTimer.current = setTimeout(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        scheduleBlink();
      }, 120);
    }, delay);
  }, [mood]);

  useEffect(() => {
    scheduleBlink();
    return () => clearTimeout(blinkTimer.current);
  }, [scheduleBlink]);

  // --- Glitch loop ---
  useEffect(() => {
    const interval = GLITCH_INTERVAL[mood];

    const triggerGlitch = () => {
      const type = Math.floor(Math.random() * 3);

      if (type === 0) {
        // X-jitter: ±1-2px for 80ms
        const offset = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
        setGlitchX(offset);
        setTimeout(() => setGlitchX(0), 80);
      } else if (type === 1) {
        // Tint flash: red (#ff4444) or green (#44ff88) overlay for 60ms
        setTintColor(Math.random() > 0.5 ? '#ff4444' : '#44ff88');
        setTimeout(() => setTintColor(null), 60);
      } else {
        // Static burst: spike overlay to 0.5 for 100ms
        setStaticBurst(true);
        setTimeout(() => setStaticBurst(false), 100);
      }

      glitchTimer.current = setTimeout(triggerGlitch, interval * (0.7 + Math.random() * 0.6));
    };

    glitchTimer.current = setTimeout(triggerGlitch, interval);
    return () => clearTimeout(glitchTimer.current);
  }, [mood]);

  // --- Flicker for DISAPPOINTED / UNHINGED ---
  useEffect(() => {
    const config = FLICKER_CONFIG[mood];
    if (!config) {
      setFlickerAlpha(1);
      return;
    }

    let cancelled = false;

    const runFlickerSequence = () => {
      let step = 0;
      const tick = () => {
        if (cancelled) return;
        if (step >= config.steps) {
          setFlickerAlpha(1);
          flickerTimer.current = setTimeout(() => {
            if (!cancelled) runFlickerSequence();
          }, config.pause);
          return;
        }
        setFlickerAlpha(step % 2 === 0 ? 0.6 : 1);
        step++;
        flickerTimer.current = setTimeout(tick, config.speed);
      };
      tick();
    };

    runFlickerSequence();

    return () => {
      cancelled = true;
      clearTimeout(flickerTimer.current);
      setFlickerAlpha(1);
    };
  }, [mood]);

  if (!sceneReady) return null;

  const moodColor = getMoodColor(mood);

  const currentFaceUrl = isBlinking && blinkUrl ? blinkUrl : faceUrl;
  const baseStaticAlpha = STATIC_ALPHA[mood];
  const currentStaticAlpha = staticBurst ? 0.5 : baseStaticAlpha;

  return (
    <div
      className="absolute top-4 right-4 z-10"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div
        className="flex flex-col items-center gap-1 px-3 py-2"
        style={panelStyle}
      >
        {/* Outer: idle bob animation (CSS keyframe owns transform) */}
        <div
          className="rounded-sm"
          style={{
            animation: 'jacobs-bob 3s ease-in-out infinite',
            borderColor: moodColor,
            borderWidth: 2,
            borderStyle: 'solid',
          }}
        >
          {/* Inner: glitch jitter + flicker (inline transform + opacity) */}
          <div
            className="relative overflow-hidden"
            style={{
              width: 112,
              height: 112,
              transform: `translateX(${glitchX}px)`,
              opacity: flickerAlpha,
            }}
          >
            {/* Face image */}
            {currentFaceUrl && (
              <img
                src={currentFaceUrl}
                alt="Mr. Jacobs"
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            )}

            {/* Tint flash overlay — colored div with multiply blend */}
            {tintColor && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: tintColor,
                  mixBlendMode: 'multiply',
                  opacity: 0.6,
                }}
              />
            )}

            {/* CRT scanlines overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)',
                backgroundSize: '100% 2px',
              }}
            />

            {/* Static noise overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${getStaticNoise()})`,
                backgroundSize: '64px 64px',
                imageRendering: 'pixelated',
                opacity: currentStaticAlpha,
                mixBlendMode: 'screen',
              }}
            />
          </div>
        </div>

        <span className="text-[11px] tracking-[0.12em] font-bold" style={{ color: moodColor }}>
          JACOBS
        </span>
        <span className="text-[9px] opacity-70" style={{ color: moodColor }}>
          {mood}
        </span>
      </div>

    </div>
  );
}
