import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { supabase } from '../services/supabase';
import { soundService } from '../services/soundService';

const SLOT_COUNT = 5;
const SLOT_COLUMNS = 5;

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

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

  // Poll for sprites that are still generating (new items without sprite_url)
  useEffect(() => {
    const pending = inventory.filter((item) => !item.spriteUrl && item.item_id !== 'output');
    if (pending.length === 0) return;

    const interval = setInterval(async () => {
      const ids = pending.map((i) => i.item_id);
      const { data } = await supabase
        .from('items')
        .select('id, sprite_url')
        .in('id', ids)
        .not('sprite_url', 'is', null);

      if (data && data.length > 0) {
        for (const row of data) {
          useGameStore.getState().updateItemSprite(row.id, row.sprite_url);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [inventory]);

  if (!sceneReady) return null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div className="px-5 pt-4 pb-4" style={panelStyle}>
        {/* Slots */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${SLOT_COLUMNS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const item = inventory[i];
            return (
              <div
                key={i}
                className={`relative w-12 h-12 flex flex-col items-center justify-center border transition-colors ${
                  item && !menuOpen ? 'cursor-pointer' : ''
                }`}
                style={{
                  borderColor: item
                    ? 'var(--color-hud-accent)'
                    : 'var(--color-hud-border)',
                  backgroundColor: 'rgba(4, 8, 12, 0.6)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)',
                  borderRadius: 4,
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
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] px-3 py-1 z-20"
                    style={{
                      ...panelStyle,
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
                    className="w-9 h-9 object-contain"
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
