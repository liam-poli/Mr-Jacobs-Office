import { useSettingsStore } from '../stores/settingsStore';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-hud-accent text-[16px]">{label}</span>
      <button
        onClick={() => { soundService.playSfx('ui-click'); onToggle(); }}
        className="min-w-20 px-4 py-2 border rounded text-[14px] transition-colors cursor-pointer"
        style={{
          borderColor: enabled
            ? 'var(--color-hud-accent)'
            : 'var(--color-hud-dim)',
          color: enabled
            ? 'var(--color-hud-accent)'
            : 'var(--color-hud-dim)',
          backgroundColor: enabled
            ? 'rgba(159, 218, 115, 0.12)'
            : 'transparent',
          boxShadow: enabled
            ? 'inset 0 0 0 1px rgba(0, 0, 0, 0.2)'
            : 'none',
        }}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export function SettingsMenu() {
  const menuOpen = useSettingsStore((s) => s.menuOpen);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const setMenuOpen = useSettingsStore((s) => s.setMenuOpen);

  if (!menuOpen) return null;

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4, 8, 12, 0.7)' }}
      onClick={() => { soundService.playSfx('ui-click'); setMenuOpen(false); }}
    >
      <div
        className="relative w-80 p-8"
        style={{
          fontFamily: 'var(--font-hud)',
          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => { soundService.playSfx('ui-click'); setMenuOpen(false); }}
          className="absolute top-3 right-4 text-hud-dim hover:text-hud-accent text-[16px] cursor-pointer transition-colors"
        >
          [X]
        </button>

        {/* Header */}
        <div className="mb-5 pb-3" style={{ borderBottom: '1px solid var(--color-hud-panel-border)' }}>
          <h2 className="text-hud-accent text-[20px] tracking-[0.3em]">
            SETTINGS
          </h2>
        </div>

        {/* Toggles */}
        <ToggleRow label="SOUND" enabled={soundEnabled} onToggle={toggleSound} />
        <ToggleRow label="MUSIC" enabled={musicEnabled} onToggle={toggleMusic} />

        {/* Divider */}
        <div className="my-4" style={{ borderTop: '1px solid var(--color-hud-panel-border)' }} />

        {/* Fullscreen */}
        <button
          onClick={() => { soundService.playSfx('ui-click'); handleFullscreen(); }}
          className="w-full py-3 border rounded text-[14px] text-hud-accent hover:text-hud-accent hover:border-hud-accent transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--color-hud-panel-border)',
            backgroundColor: 'rgba(12, 17, 25, 0.4)',
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.35)',
          }}
        >
          FULLSCREEN
        </button>

        {/* Version */}
        <div className="mt-5 text-center text-hud-dim text-[12px]">
          J.A.C.O.B.S. v0.1
        </div>
      </div>
    </div>
  );
}
