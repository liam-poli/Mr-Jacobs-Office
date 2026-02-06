import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

const FALLBACK_ITEM_COLOR = '#888888';

/** Each option: null itemId = bare-hand, string = use item, 'cancel' = close */
type MenuOption = { type: 'interact'; itemId: null } | { type: 'item'; itemId: string } | { type: 'cancel' };

export function InteractionMenu() {
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const target = useGameStore((s) => s.interactionTarget);
  const inventory = useGameStore((s) => s.inventory);
  const closeMenu = useGameStore((s) => s.closeInteractionMenu);
  const setPendingInteraction = useGameStore((s) => s.setPendingInteraction);
  const pending = useGameStore((s) => s.interactionPending);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build options list: bare-hand + items + cancel
  const options: MenuOption[] = [];
  if (menuOpen && target?.type === 'object') {
    options.push({ type: 'interact', itemId: null });
    for (const item of inventory) {
      options.push({ type: 'item', itemId: item.id });
    }
    options.push({ type: 'cancel' });
  }

  // Reset selection when menu opens
  useEffect(() => {
    if (menuOpen) setSelectedIndex(0);
  }, [menuOpen]);

  const selectOption = useCallback((option: MenuOption) => {
    if (!target) return;
    soundService.playSfx('ui-click');
    if (option.type === 'cancel') {
      closeMenu();
    } else {
      setPendingInteraction({ targetId: target.id, itemId: option.itemId });
      closeMenu();
    }
  }, [target, closeMenu, setPendingInteraction]);

  // Keyboard navigation
  useEffect(() => {
    if (!menuOpen || options.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        soundService.playSfx('ui-click');
        closeMenu();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev <= 0 ? options.length - 1 : prev - 1;
          soundService.playSfx('ui-hover');
          return next;
        });
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev >= options.length - 1 ? 0 : prev + 1;
          soundService.playSfx('ui-hover');
          return next;
        });
        return;
      }
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        e.stopPropagation();
        selectOption(options[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [menuOpen, options.length, selectedIndex, closeMenu, selectOption]);

  // Close if target disappears (player walked away)
  useEffect(() => {
    if (menuOpen && (!target || target.type !== 'object')) {
      closeMenu();
    }
  }, [menuOpen, target, closeMenu]);

  if (pending || !menuOpen || !target || target.type !== 'object') return null;

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
        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          const isCancel = option.type === 'cancel';
          const item = option.type === 'item'
            ? inventory.find((inv) => inv.id === option.itemId)
            : null;

          return (
            <button
              key={isCancel ? 'cancel' : option.type === 'interact' ? 'interact' : option.itemId}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors cursor-pointer"
              style={{
                color: isCancel
                  ? 'var(--color-hud-danger)'
                  : option.type === 'interact'
                    ? 'var(--color-hud-accent)'
                    : 'var(--color-hud-text)',
                borderTop: i > 0 ? '1px solid var(--color-hud-border)' : undefined,
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : undefined,
              }}
              onMouseEnter={() => {
                if (selectedIndex !== i) {
                  setSelectedIndex(i);
                  soundService.playSfx('ui-hover');
                }
              }}
              onClick={() => selectOption(option)}
            >
              {/* Icon */}
              {isCancel ? (
                <span className="w-5 h-5 flex items-center justify-center text-[16px]">
                  &times;
                </span>
              ) : option.type === 'interact' ? (
                <span className="w-5 h-5 flex items-center justify-center text-[16px]">
                  &gt;
                </span>
              ) : item?.spriteUrl ? (
                <img
                  src={item.spriteUrl}
                  alt={item.name}
                  className="w-5 h-5 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span
                  className="w-5 h-5 inline-block"
                  style={{
                    backgroundColor: FALLBACK_ITEM_COLOR,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              )}

              {/* Label */}
              <span>
                {isCancel
                  ? 'Cancel'
                  : option.type === 'interact'
                    ? `Interact with ${target.name}`
                    : `Use ${item?.name}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
