import { useGameStore } from '../stores/gameStore';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

export function InteractionPrompt() {
  const target = useGameStore((s) => s.interactionTarget);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const pending = useGameStore((s) => s.interactionPending);
  const result = useGameStore((s) => s.interactionResult);
  const terminalChatOpen = useGameStore((s) => s.terminalChatOpen);

  if (!sceneReady || !target || menuOpen || pending || result || terminalChatOpen) return null;

  const actionText =
    target.type === 'item'
      ? `[E] Pick up ${target.name}`
      : `[E] Interact with ${target.name}`;

  return (
    <div
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 px-5 py-3 text-[13px] tracking-wider"
      style={{
        fontFamily: 'var(--font-hud)',
        ...panelStyle,
        color: 'var(--color-hud-accent)',
      }}
    >
      <span className="mr-2">[E]</span>
      {actionText.replace('[E] ', '').toUpperCase()}
    </div>
  );
}
