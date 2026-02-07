import { Settings } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

export function HUD() {
  const bucks = useGameStore((s) => s.bucks);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);

  if (!sceneReady) return null;

  return (
    <div
      className="absolute top-4 left-4 z-10 flex items-center gap-3"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      {/* Status bar */}
      <div
        className="px-5 py-3 text-[16px] text-hud-accent tracking-[0.02em]"
        style={panelStyle}
      >
        BUCKS: {bucks}
        <span className="text-hud-border mx-3">|</span>
        TASK: FILE SORT 04
        <span className="text-hud-border mx-3">|</span>
        TIME: 09:42 AM
      </div>

      {/* Gear icon */}
      <button
        onClick={() => { soundService.playSfx('ui-click'); toggleMenu(); }}
        className="px-2.5 py-2 text-hud-dim hover:text-hud-accent transition-colors cursor-pointer"
        style={panelStyle}
        title="Settings"
      >
        <Settings size={20} />
      </button>
    </div>
  );
}
