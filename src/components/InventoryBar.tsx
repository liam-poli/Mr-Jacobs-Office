import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const SLOT_COUNT = 5;

// Glitchy "?" fallback rendered as a tiny inline SVG matching the Phaser item-default texture
const FALLBACK_QUESTION_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges">` +
  `<rect width="16" height="16" fill="#1a1a2e"/>` +
  // Red glitch offset
  `<rect x="4" y="3" width="1" height="1" fill="#ff0044" opacity="0.3"/>` +
  `<rect x="5" y="2" width="3" height="1" fill="#ff0044" opacity="0.3"/>` +
  `<rect x="8" y="3" width="1" height="2" fill="#ff0044" opacity="0.3"/>` +
  `<rect x="7" y="5" width="2" height="1" fill="#ff0044" opacity="0.3"/>` +
  `<rect x="6" y="6" width="1" height="2" fill="#ff0044" opacity="0.3"/>` +
  `<rect x="6" y="10" width="1" height="2" fill="#ff0044" opacity="0.3"/>` +
  // Cyan question mark
  `<rect x="5" y="2" width="4" height="1" fill="#5ee6b0"/>` +
  `<rect x="4" y="3" width="2" height="1" fill="#5ee6b0"/>` +
  `<rect x="9" y="3" width="2" height="1" fill="#5ee6b0"/>` +
  `<rect x="9" y="4" width="2" height="1" fill="#5ee6b0"/>` +
  `<rect x="8" y="5" width="2" height="1" fill="#5ee6b0"/>` +
  `<rect x="7" y="6" width="2" height="2" fill="#5ee6b0"/>` +
  `<rect x="7" y="10" width="2" height="2" fill="#5ee6b0"/>` +
  // Scanlines
  `<rect x="0" y="5" width="16" height="1" fill="#5ee6b0" opacity="0.15"/>` +
  `<rect x="0" y="11" width="16" height="1" fill="#5ee6b0" opacity="0.15"/>` +
  // Border
  `<rect x="0" y="0" width="16" height="1" fill="#5ee6b0" opacity="0.2"/>` +
  `<rect x="0" y="15" width="16" height="1" fill="#5ee6b0" opacity="0.2"/>` +
  `<rect x="0" y="0" width="1" height="16" fill="#5ee6b0" opacity="0.2"/>` +
  `<rect x="15" y="0" width="1" height="16" fill="#5ee6b0" opacity="0.2"/>` +
  `</svg>`,
)}`;

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
                  <img
                    src={item.spriteUrl || FALLBACK_QUESTION_SVG}
                    alt={item.name}
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
