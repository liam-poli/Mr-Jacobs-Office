import { Settings } from 'lucide-react';
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
      {/* Status bar — rounded, uniform green text */}
      <div
        className="px-5 py-3 text-[20px] text-hud-accent rounded-md border"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        BUCKS: {bucks}
        <span className="text-hud-border mx-3">|</span>
        TASK: FILE SORT 04
        <span className="text-hud-border mx-3">|</span>
        TIME: 09:42 AM
      </div>

      {/* Gear icon */}
      <button
        onClick={toggleMenu}
        className="border rounded-md px-3 py-3 text-hud-dim hover:text-hud-accent hover:border-hud-accent transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
        title="Settings"
      >
        <Settings size={24} />
      </button>
    </div>
  );
}
