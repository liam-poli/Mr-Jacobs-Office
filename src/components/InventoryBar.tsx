import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

const SLOT_COUNT = 5;

// Match the Phaser-generated item texture colors
const ITEM_COLORS: Record<string, string> = {
  'item-coffee-mug': '#8b4513',
  'item-wrench': '#708090',
  'item-bucket': '#4169e1',
  'item-matches': '#ff4500',
};

export function InventoryBar() {
  const inventory = useGameStore((s) => s.inventory);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const interactionTarget = useGameStore((s) => s.interactionTarget);
  const selectedIndex = useGameStore((s) => s.selectedInventoryIndex);
  const setSelectedIndex = useGameStore((s) => s.setSelectedInventoryIndex);
  const dropItem = useGameStore((s) => s.dropItem);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!sceneReady) return null;

  const nearObject = interactionTarget?.type === 'object';
  const hoveredItem = hoveredIndex !== null ? inventory[hoveredIndex] : null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      {/* Panel — rounded, matching HUD style */}
      <div
        className="border rounded-md px-5 pt-3 pb-4"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        {/* Slots */}
        <div className="flex gap-2">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const item = inventory[i];
            const isSelected = selectedIndex === i && item != null;
            return (
              <div
                key={i}
                className={`relative w-16 h-16 flex flex-col items-center justify-center border rounded transition-colors ${
                  item ? 'cursor-pointer' : ''
                }`}
                style={{
                  borderColor: isSelected
                    ? 'var(--color-hud-danger)'
                    : item
                      ? 'var(--color-hud-accent)'
                      : 'var(--color-hud-border)',
                  backgroundColor: isSelected
                    ? 'rgba(233, 69, 96, 0.15)'
                    : 'rgba(0, 0, 0, 0.4)',
                }}
                onMouseEnter={() => item && setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (!item) return;
                  if (nearObject) {
                    setSelectedIndex(isSelected ? null : i);
                  } else {
                    dropItem(i);
                  }
                }}
              >
                {hoveredIndex === i && item && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] px-3 py-1 border rounded-md z-20"
                    style={{
                      backgroundColor: 'var(--color-hud-bg)',
                      borderColor: 'var(--color-hud-border)',
                      color: 'var(--color-hud-accent)',
                    }}
                  >
                    {item.name}
                  </div>
                )}
                {item && (
                  item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8"
                      style={{
                        backgroundColor: ITEM_COLORS[item.textureKey] ?? '#888',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
