import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function LoadingScreen() {
  const sceneReady = useGameStore((s) => s.sceneReady);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!sceneReady) return;

    // Start fade-out
    setFading(true);

    // Remove from DOM after transition
    const timer = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(timer);
  }, [sceneReady]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500"
      style={{
        fontFamily: 'var(--font-hud)',
        opacity: fading ? 0 : 1,
      }}
    >
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
  );
}
