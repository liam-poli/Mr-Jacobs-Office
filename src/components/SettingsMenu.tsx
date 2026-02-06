import { useSettingsStore } from '../stores/settingsStore';

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
    <div className="flex items-center justify-between py-2">
      <span className="text-hud-text text-sm tracking-wider">{label}</span>
      <button
        onClick={onToggle}
        className="min-w-16 px-3 py-1 border text-xs tracking-widest transition-colors cursor-pointer"
        style={{
          borderColor: enabled
            ? 'var(--color-hud-accent)'
            : 'var(--color-hud-dim)',
          color: enabled
            ? 'var(--color-hud-accent)'
            : 'var(--color-hud-dim)',
          backgroundColor: enabled
            ? 'rgba(94, 230, 176, 0.1)'
            : 'transparent',
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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={() => setMenuOpen(false)}
    >
      <div
        className="relative w-72 border p-6"
        style={{
          fontFamily: 'var(--font-hud)',
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-2 right-3 text-hud-dim hover:text-hud-accent text-sm cursor-pointer transition-colors"
        >
          [X]
        </button>

        {/* Header */}
        <div className="mb-4 pb-2" style={{ borderBottom: '1px solid var(--color-hud-border)' }}>
          <h2 className="text-hud-accent text-base tracking-[0.3em] uppercase">
            SETTINGS
          </h2>
        </div>

        {/* Toggles */}
        <ToggleRow label="SOUND" enabled={soundEnabled} onToggle={toggleSound} />
        <ToggleRow label="MUSIC" enabled={musicEnabled} onToggle={toggleMusic} />

        {/* Divider */}
        <div className="my-3" style={{ borderTop: '1px solid var(--color-hud-border)' }} />

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="w-full py-2 border text-xs tracking-widest text-hud-text hover:text-hud-accent hover:border-hud-accent transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--color-hud-border)',
            backgroundColor: 'transparent',
          }}
        >
          FULLSCREEN
        </button>

        {/* Version */}
        <div className="mt-4 text-center text-hud-dim text-[10px] tracking-wider">
          J.A.C.O.B.S. v0.1
        </div>
      </div>
    </div>
  );
}
