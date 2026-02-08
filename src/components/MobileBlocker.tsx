import { useState, useEffect } from 'react';

const MIN_WIDTH = 1024;

export function MobileBlocker() {
  const [blocked, setBlocked] = useState(() => window.innerWidth < MIN_WIDTH);

  useEffect(() => {
    function check() {
      setBlocked(window.innerWidth < MIN_WIDTH);
    }
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: 'var(--color-hud-bg)' }}
    >
      <img
        src="/jacobs-logo.png"
        alt="J.A.C.O.B.S."
        className="w-24 mb-6"
        style={{ imageRendering: 'pixelated' }}
      />
      <h1
        className="text-hud-accent text-base tracking-widest mb-2 text-center"
        style={{ fontFamily: 'var(--font-hud)' }}
      >
        DESKTOP REQUIRED
      </h1>
      <p className="text-hud-dim text-xs font-mono text-center max-w-xs leading-relaxed">
        J.A.C.O.B.S. requires a larger screen to operate.
        Please access this terminal from a desktop device.
      </p>
    </div>
  );
}
