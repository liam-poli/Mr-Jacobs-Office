import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const SLOT_COUNT = 5;

// Fallback color when no sprite URL is available
const FALLBACK_ITEM_COLOR = '#888888';

export function InventoryBar() {
  const inventory = useGameStore((s) => s.inventory);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const dropItem = useGameStore((s) => s.dropItem);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!sceneReady) return null;

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
            return (
              <div
                key={i}
                className={`relative w-16 h-16 flex flex-col items-center justify-center border rounded transition-colors ${
                  item && !menuOpen ? 'cursor-pointer' : ''
                }`}
                style={{
                  borderColor: item
                    ? 'var(--color-hud-accent)'
                    : 'var(--color-hud-border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                }}
                onMouseEnter={() => { if (item) { setHoveredIndex(i); soundService.playSfx('ui-hover'); } }}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (!item || menuOpen) return;
                  soundService.playSfx('ui-click');
                  dropItem(i);
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
                  item.spriteUrl ? (
                    <img
                      src={item.spriteUrl}
                      alt={item.name}
                      className="w-12 h-12 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8"
                      style={{
                        backgroundColor: FALLBACK_ITEM_COLOR,
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
