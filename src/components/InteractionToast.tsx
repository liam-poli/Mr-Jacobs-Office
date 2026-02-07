import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const CHAR_DELAY = 30;
const DISMISS_DELAY = 4000;

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

function LoadingDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ color: 'var(--color-hud-accent)' }}>
      {dots}
      <span style={{ opacity: 0 }}>{'...'.slice(dots.length)}</span>
    </span>
  );
}

export function InteractionToast() {
  const pending = useGameStore((s) => s.interactionPending);
  const result = useGameStore((s) => s.interactionResult);
  const setResult = useGameStore((s) => s.setInteractionResult);

  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = result?.description ?? '';
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Typewriter effect
  useEffect(() => {
    if (!fullText) {
      setDisplayText('');
      return;
    }

    setDisplayText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, CHAR_DELAY);

    return () => clearInterval(interval);
  }, [fullText]);

  // Blinking cursor
  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(interval);
  }, [result]);

  // Auto-dismiss after full text is revealed + delay
  useEffect(() => {
    if (!fullText || displayText.length < fullText.length) return;

    timerRef.current = setTimeout(() => {
      setResult(null);
    }, DISMISS_DELAY);

    return () => clearTimeout(timerRef.current);
  }, [displayText, fullText, setResult]);

  if (!pending && !result) return null;

  return (
    <div
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 w-[420px]"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div
        className="px-5 py-3 text-[13px]"
        style={{
          ...panelStyle,
          color: 'var(--color-hud-text)',
        }}
      >
        {pending ? (
          <>
            <span style={{ color: 'var(--color-hud-accent)' }}>&gt; </span>
            <LoadingDots />
          </>
        ) : (
          <div className="relative">
            {/* Invisible full text to reserve the final box height */}
            <span className="invisible" aria-hidden="true">
              &gt; {fullText}_
            </span>
            {/* Visible typewriter text layered on top */}
            <div className="absolute inset-0">
              <span style={{ color: 'var(--color-hud-accent)' }}>&gt; </span>
              {displayText}
              <span
                style={{
                  opacity: showCursor ? 1 : 0,
                  color: 'var(--color-hud-accent)',
                }}
              >
                _
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
