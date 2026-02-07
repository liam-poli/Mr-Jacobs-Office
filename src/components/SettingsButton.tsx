import { Settings } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

export function SettingsButton() {
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);
  const sceneReady = useGameStore((s) => s.sceneReady);

  if (!sceneReady) return null;

  return (
    <button
      onClick={() => { soundService.playSfx('ui-click'); toggleMenu(); }}
      className="absolute bottom-6 left-4 z-10 p-2.5 text-hud-accent hover:text-white transition-colors cursor-pointer"
      style={{ ...panelStyle, fontFamily: 'var(--font-hud)' }}
      title="Settings"
    >
      <Settings size={22} />
    </button>
  );
}
