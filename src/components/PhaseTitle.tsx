import { useState, useEffect, useRef } from 'react';
import { useJobStore } from '../stores/jobStore';
import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';

const CHAR_DELAY = 50; // ms per character
const HOLD_DURATION = 1500; // ms to hold after typing
const FADE_DURATION = 500; // ms for fade out

type CardType = 'assignment' | 'review';

interface CardData {
  type: CardType;
  title: string;
  subtitle: string;
}

export function PhaseTitle() {
  const phaseStatus = useJobStore((s) => s.phaseStatus);
  const currentJob = useJobStore((s) => s.currentJob);
  const phaseNumber = useJobStore((s) => s.phaseNumber);

  const [card, setCard] = useState<CardData | null>(null);
  const [charIndex, setCharIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const prevStatusRef = useRef(phaseStatus);

  // Detect phase transitions
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = phaseStatus;

    if (phaseStatus === 'WORKING' && prev !== 'WORKING' && currentJob) {
      setCard({
        type: 'assignment',
        title: 'NEW TASK INCOMING',
        subtitle: `PHASE ${phaseNumber}`,
      });
      setCharIndex(0);
      setFading(false);
    } else if (phaseStatus === 'REVIEWING' && prev !== 'REVIEWING') {
      setCard({
        type: 'review',
        title: 'PERFORMANCE REVIEW',
        subtitle: `PHASE ${phaseNumber}`,
      });
      setCharIndex(0);
      setFading(false);
    }
  }, [phaseStatus, currentJob, phaseNumber]);

  // Typewriter effect
  useEffect(() => {
    if (!card) return;
    if (charIndex >= card.title.length) return;

    const timer = setTimeout(() => {
      setCharIndex((i) => i + 1);
    }, CHAR_DELAY);
    return () => clearTimeout(timer);
  }, [card, charIndex]);

  // Hold then fade out
  useEffect(() => {
    if (!card) return;
    if (charIndex < card.title.length) return;

    const holdTimer = setTimeout(() => {
      setFading(true);
    }, HOLD_DURATION);
    return () => clearTimeout(holdTimer);
  }, [card, charIndex]);

  // After fade completes, dismiss and unfreeze
  useEffect(() => {
    if (!fading) return;

    const dismissedCard = card;
    const fadeTimer = setTimeout(() => {
      // Trigger Jacobs speech after assignment title card
      if (dismissedCard?.type === 'assignment') {
        const job = useJobStore.getState().currentJob;
        if (job) {
          useJacobsStore.getState().setSpeech(job.description, 'NEW ASSIGNMENT');
        }
      }
      setCard(null);
      setCharIndex(0);
      setFading(false);
      useGameStore.getState().setPlayerFrozen(false);
    }, FADE_DURATION);
    return () => clearTimeout(fadeTimer);
  }, [fading]);

  if (!card) return null;

  const accentColor = 'var(--color-hud-accent)';

  return (
    <div
      className="absolute inset-0 z-[80] flex flex-col items-center justify-center"
      style={{
        fontFamily: 'var(--font-hud)',
        backgroundColor: 'rgba(4, 8, 12, 0.85)',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
        pointerEvents: 'auto',
      }}
    >
      {/* Subtitle */}
      <div
        className="text-[11px] tracking-[0.3em] mb-4"
        style={{ color: accentColor, opacity: 0.6 }}
      >
        — {card.subtitle} —
      </div>

      {/* Title with typewriter + cursor */}
      <div
        className="text-3xl tracking-[0.25em] font-bold text-center px-8"
        style={{ color: accentColor }}
      >
        {card.title.slice(0, charIndex)}
        {charIndex < card.title.length && (
          <span
            className="inline-block w-[3px] h-[1em] ml-1 align-middle"
            style={{
              backgroundColor: accentColor,
              animation: 'blink 0.6s step-end infinite',
            }}
          />
        )}
      </div>

      {/* Blink keyframe (inline) */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
