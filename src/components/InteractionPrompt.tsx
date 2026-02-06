import { useGameStore } from '../stores/gameStore';

export function InteractionPrompt() {
  const target = useGameStore((s) => s.interactionTarget);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const selectedIndex = useGameStore((s) => s.selectedInventoryIndex);
  const inventory = useGameStore((s) => s.inventory);

  if (!sceneReady || !target) return null;

  let actionText: string;
  if (target.type === 'item') {
    actionText = `[E] Pick up ${target.name}`;
  } else if (selectedIndex !== null && inventory[selectedIndex]) {
    actionText = `[E] Use ${inventory[selectedIndex].name} on ${target.name}`;
  } else {
    actionText = `[E] Interact with ${target.name}`;
  }

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 border text-sm"
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
