import { useGameStore } from '../stores/gameStore';

export function InteractionPrompt() {
  const target = useGameStore((s) => s.interactionTarget);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const pending = useGameStore((s) => s.interactionPending);
  const result = useGameStore((s) => s.interactionResult);

  if (!sceneReady || !target || menuOpen || pending || result) return null;

  const actionText =
    target.type === 'item'
      ? `[E] Pick up ${target.name}`
      : `[E] Interact with ${target.name}`;

  return (
    <div
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 px-5 py-3 border rounded-md text-[14px]"
      style={{
        fontFamily: 'var(--font-hud)',
        backgroundColor: 'var(--color-hud-bg)',
        borderColor: 'var(--color-hud-border)',
        color: 'var(--color-hud-accent)',
      }}
    >
      {actionText}
    </div>
  );
}
