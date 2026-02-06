import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';

export function HUD() {
  const bucks = useGameStore((s) => s.bucks);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);

  if (!sceneReady) return null;

  return (
    <div
      className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      {/* Status bar */}
      <div
        className="flex items-center gap-0 text-sm tracking-wider border"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        <span className="px-3 py-1.5 text-hud-accent">
          BUCKS: {bucks}
        </span>
        <span
          className="px-3 py-1.5 text-hud-text"
          style={{ borderLeft: '1px solid var(--color-hud-border)' }}
        >
          TASK: FILE SORT 04
        </span>
        <span
          className="px-3 py-1.5 text-hud-dim"
          style={{ borderLeft: '1px solid var(--color-hud-border)' }}
        >
          TIME: 09:42 AM
        </span>
      </div>

      {/* Gear icon */}
      <button
        onClick={toggleMenu}
        className="border px-2.5 py-1.5 text-sm text-hud-dim hover:text-hud-accent hover:border-hud-accent transition-colors cursor-pointer"
        style={{
          fontFamily: 'var(--font-hud)',
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
        title="Settings"
      >
        [=]
      </button>
    </div>
  );
}
