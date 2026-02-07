import { useSettingsStore } from '../stores/settingsStore';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-hud-dim">{label}</span>
      <span className="text-hud-accent">{value}</span>
    </div>
  );
}

export function HelpPanel() {
  const helpOpen = useSettingsStore((s) => s.helpOpen);
  const setHelpOpen = useSettingsStore((s) => s.setHelpOpen);

  if (!helpOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4, 8, 12, 0.7)' }}
      onClick={() => { soundService.playSfx('ui-click'); setHelpOpen(false); }}
    >
      <div
        className="relative w-96 p-8"
        style={{ fontFamily: 'var(--font-hud)', ...panelStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => { soundService.playSfx('ui-click'); setHelpOpen(false); }}
          className="absolute top-3 right-4 text-hud-dim hover:text-hud-accent text-[16px] cursor-pointer transition-colors"
        >
          [X]
        </button>

        {/* Header */}
        <div className="mb-5 pb-3" style={{ borderBottom: '1px solid var(--color-hud-panel-border)' }}>
          <h2 className="text-hud-accent text-[20px] tracking-[0.3em]">
            HOW TO PLAY
          </h2>
        </div>

        {/* Controls */}
        <div className="mb-4">
          <div className="text-hud-accent text-[14px] tracking-[0.2em] mb-2">CONTROLS</div>
          <Row label="MOVE" value="WASD / Arrows" />
          <Row label="INTERACT" value="E (near objects)" />
          <Row label="PICK UP" value="Walk near items" />
          <Row label="USE ITEM" value="E on object → select" />
          <Row label="DROP ITEM" value="Click in inventory" />
          <Row label="SETTINGS" value="ESC" />
        </div>

        {/* Divider */}
        <div className="my-4" style={{ borderTop: '1px solid var(--color-hud-panel-border)' }} />

        {/* Goal */}
        <div className="mb-4">
          <div className="text-hud-accent text-[14px] tracking-[0.2em] mb-2">GOAL</div>
          <p className="text-hud-dim text-[13px] leading-relaxed">
            Complete tasks assigned by Mr. Jacobs. Earn BUCKS.
            Explore the office. Find a way out before time runs out.
          </p>
        </div>

        {/* Divider */}
        <div className="my-4" style={{ borderTop: '1px solid var(--color-hud-panel-border)' }} />

        {/* Tips */}
        <div>
          <div className="text-hud-accent text-[14px] tracking-[0.2em] mb-2">TIPS</div>
          <ul className="text-hud-dim text-[13px] leading-relaxed space-y-1">
            <li>Spend BUCKS at Terminals to talk to the boss</li>
            <li>Use items on objects to change their state</li>
            <li>Some doors are locked — find ways to open them</li>
            <li>Mr. Jacobs is watching... through cameras</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
