import { useGameStore } from '../stores/gameStore';

const SLOT_COUNT = 4;

export function InventoryBar() {
  const inventory = useGameStore((s) => s.inventory);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const interactionTarget = useGameStore((s) => s.interactionTarget);
  const selectedIndex = useGameStore((s) => s.selectedInventoryIndex);
  const setSelectedIndex = useGameStore((s) => s.setSelectedInventoryIndex);

  if (!sceneReady) return null;

  const nearObject = interactionTarget?.type === 'object';

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      {/* Header */}
      <div className="text-center text-hud-dim text-[10px] tracking-[0.25em] mb-1.5">
        PLAYER INVENTORY
      </div>

      {/* Slots */}
      <div
        className="flex gap-1 p-1.5 border"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const item = inventory[i];
          const isSelected = selectedIndex === i && item != null;
          return (
            <div
              key={i}
              className={`w-12 h-12 flex items-center justify-center border transition-colors ${
                nearObject && item ? 'cursor-pointer' : ''
              }`}
              style={{
                borderColor: isSelected
                  ? 'var(--color-hud-danger)'
                  : item
                    ? 'var(--color-hud-accent)'
                    : 'var(--color-hud-border)',
                backgroundColor: isSelected
                  ? 'rgba(233, 69, 96, 0.15)'
                  : item
                    ? 'rgba(94, 230, 176, 0.05)'
                    : 'rgba(0, 0, 0, 0.4)',
              }}
              title={item?.name}
              onClick={() => {
                if (!item || !nearObject) return;
                setSelectedIndex(isSelected ? null : i);
              }}
            >
              {item && (
                <span className="text-hud-text text-[9px] text-center leading-tight truncate px-0.5">
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
