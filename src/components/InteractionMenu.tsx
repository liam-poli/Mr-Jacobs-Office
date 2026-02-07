import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';
import { playTerminalOpen } from '../services/terminalSounds';

const FALLBACK_ITEM_COLOR = '#888888';

/** Each option: null itemId = bare-hand, string = use item, 'talk' = terminal chat, 'cancel' = close */
type MenuOption = { type: 'talk' } | { type: 'interact'; itemId: null } | { type: 'item'; itemId: string } | { type: 'cancel' };

export function InteractionMenu() {
  const menuOpen = useGameStore((s) => s.interactionMenuOpen);
  const target = useGameStore((s) => s.interactionTarget);
  const inventory = useGameStore((s) => s.inventory);
  const closeMenu = useGameStore((s) => s.closeInteractionMenu);
  const setPendingInteraction = useGameStore((s) => s.setPendingInteraction);
  const pending = useGameStore((s) => s.interactionPending);

  const openTerminalChat = useGameStore((s) => s.openTerminalChat);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isTerminal = target?.name === 'Computer Terminal';

  // Build options list: talk (terminal only) + bare-hand + items + cancel
  const options: MenuOption[] = [];
  if (menuOpen && target?.type === 'object') {
    if (isTerminal) {
      options.push({ type: 'talk' });
    }
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
    } else if (option.type === 'talk') {
      closeMenu();
      playTerminalOpen();
      openTerminalChat();
    } else {
      setPendingInteraction({ targetId: target.id, itemId: option.itemId });
      closeMenu();
    }
  }, [target, closeMenu, setPendingInteraction, openTerminalChat]);

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
        className="w-[320px] border-2 rounded-sm overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-1.5 text-[10px] uppercase tracking-wider border-b-2 font-bold"
          style={{ 
            backgroundColor: 'var(--color-hud-border)',
            color: 'var(--color-hud-bg)',
            borderColor: 'var(--color-hud-border)'
          }}
        >
          Select Action
        </div>

        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          const isCancel = option.type === 'cancel';
          const item = option.type === 'item'
            ? inventory.find((inv) => inv.id === option.itemId)
            : null;

          const isTalk = option.type === 'talk';

          return (
            <button
              key={isCancel ? 'cancel' : isTalk ? 'talk' : option.type === 'interact' ? 'interact' : option.itemId}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-all cursor-pointer group"
              style={{
                color: isSelected
                  ? 'var(--color-hud-bg)'
                  : isCancel
                    ? 'var(--color-hud-danger)'
                    : (isTalk || option.type === 'interact')
                      ? 'var(--color-hud-accent)'
                      : 'var(--color-hud-text)',
                backgroundColor: isSelected ? 'var(--color-hud-accent)' : 'transparent',
                borderTop: i > 0 && !isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
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
              <div className={`w-6 h-6 flex items-center justify-center border ${isSelected ? 'border-current' : 'border-white/20'} rounded-sm bg-black/20`}>
                {isCancel ? (
                  <span className="text-[16px] font-bold">&times;</span>
                ) : isTalk ? (
                  <span className="text-[14px] font-bold">&gt;</span>
                ) : option.type === 'interact' ? (
                  <span className="text-[14px] font-bold">!</span>
                ) : item?.spriteUrl ? (
                  <img
                    src={item.spriteUrl}
                    alt={item.name}
                    className="w-5 h-5 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: FALLBACK_ITEM_COLOR }}
                  />
                )}
              </div>

              {/* Label */}
              <span className="font-medium tracking-tight">
                {isCancel
                  ? 'ABORT'
                  : isTalk
                    ? 'TALK TO JACOBS'
                    : option.type === 'interact'
                      ? `INTERACT: ${target.name}`
                      : `USE: ${item?.name}`}
              </span>

              <span className="ml-auto" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
