import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

export function IntroBriefing() {
  const sceneReady = useGameStore((s) => s.sceneReady);
  const setPlayerFrozen = useGameStore((s) => s.setPlayerFrozen);
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!sceneReady) return;
    // Wait for LoadingScreen to finish fading (~2s)
    const timer = setTimeout(() => {
      setPlayerFrozen(true);
      setShow(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [sceneReady, setPlayerFrozen]);

  function handleBegin() {
    useGameStore.getState().setGameStarted(true);
    soundService.init();
    soundService.playSfx('ui-click');
    setFading(true);
    setTimeout(() => {
      setPlayerFrozen(false);
      setDismissed(true);
    }, 500);
  }

  if (dismissed || !show) return null;

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center transition-opacity duration-500"
      style={{
        backgroundColor: 'rgba(4, 8, 12, 0.85)',
        opacity: fading ? 0 : 1,
      }}
    >
      <div className="max-w-sm w-full mx-4 p-6" style={panelStyle}>
        <div className="flex flex-col items-center text-center">
          <img
            src="/jacobs-logo.png"
            alt=""
            className="w-16 mb-4"
            style={{ imageRendering: 'pixelated' }}
          />
          <h2
            className="text-hud-accent text-sm tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            EMPLOYEE ORIENTATION
          </h2>
          <div className="text-hud-text text-xs font-mono leading-relaxed space-y-2 mb-6">
            <p>You are trapped in a simulation run by <span className="text-hud-accent">J.A.C.O.B.S.</span> — an unhinged AI office manager.</p>
            <p>Complete his tasks. Earn bucks. Stay on his good side.</p>
            <p><span className="text-hud-accent">Jacobs is insane</span> — not every task will make sense.</p>
            <p><span className="text-hud-accent">Find a way out.</span></p>
          </div>
          <button
            onClick={handleBegin}
            className="w-full bg-hud-accent text-hud-bg py-2.5 rounded text-sm font-bold tracking-wider hover:brightness-110 transition-all"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            BEGIN SHIFT
          </button>
        </div>
      </div>
    </div>
  );
}
