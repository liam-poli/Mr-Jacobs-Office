import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const ITEM_COLORS: Record<string, string> = {
  'item-coffee-mug': '#8b4513',
  'item-wrench': '#708090',
  'item-bucket': '#4169e1',
  'item-matches': '#ff4500',
};

export function InteractionMenu() {
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const target = useGameStore((s) => s.interactionTarget);
  const inventory = useGameStore((s) => s.inventory);
  const closeMenu = useGameStore((s) => s.closeInteractionMenu);
  const setPendingInteraction = useGameStore((s) => s.setPendingInteraction);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        soundService.playSfx('ui-click');
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [menuOpen, closeMenu]);

  // Close if target disappears (player walked away)
  useEffect(() => {
    if (menuOpen && (!target || target.type !== 'object')) {
      closeMenu();
    }
  }, [menuOpen, target, closeMenu]);

  if (!menuOpen || !target || target.type !== 'object') return null;

  const handleOption = (itemId: string | null) => {
    soundService.playSfx('ui-click');
    setPendingInteraction({ targetId: target.id, itemId });
    closeMenu();
  };

  return (
    <div
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div
        className="border rounded-md overflow-hidden"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        {/* Bare-hand option */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors hover:bg-white/10 cursor-pointer"
          style={{ color: 'var(--color-hud-accent)' }}
          onClick={() => handleOption(null)}
        >
          <span className="w-5 h-5 flex items-center justify-center text-[16px]">
            ✋
          </span>
          <span>Interact with {target.name}</span>
        </button>

        {/* One option per inventory item */}
        {inventory.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors hover:bg-white/10 cursor-pointer"
            style={{
              color: 'var(--color-hud-text)',
              borderTop: '1px solid var(--color-hud-border)',
            }}
            onClick={() => handleOption(item.id)}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-5 h-5 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span
                className="w-5 h-5 inline-block"
                style={{
                  backgroundColor: ITEM_COLORS[item.textureKey] ?? '#888',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            )}
            <span>Use {item.name}</span>
          </button>
        ))}

        {/* Exit option */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors hover:bg-white/10 cursor-pointer"
          style={{
            color: 'var(--color-hud-danger)',
            borderTop: '1px solid var(--color-hud-border)',
          }}
          onClick={() => {
            soundService.playSfx('ui-click');
            closeMenu();
          }}
        >
          <span className="w-5 h-5 flex items-center justify-center text-[16px]">
            &times;
          </span>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
