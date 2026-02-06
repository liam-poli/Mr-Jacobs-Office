import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const CHAR_DELAY = 30;
const DISMISS_DELAY = 4000;

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
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 max-w-md"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div
        className="border rounded-md px-5 py-3 text-[13px]"
        style={{
          backgroundColor: 'var(--color-hud-bg)',
          borderColor: 'var(--color-hud-border)',
          color: 'var(--color-hud-text)',
        }}
      >
        {pending ? (
          <>
            <span style={{ color: 'var(--color-hud-accent)' }}>&gt; </span>
            <LoadingDots />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
