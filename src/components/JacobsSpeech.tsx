import { useEffect, useState, useRef } from 'react';
import { useJacobsStore } from '../stores/jacobsStore';
import { useJobStore } from '../stores/jobStore';
import { playMumble } from '../services/mumbleService';

const CHAR_DELAY = 40;
const DISMISS_DELAY = 5000;
const REVIEW_DISMISS_DELAY = 8000;

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

export function JacobsSpeech() {
  const speech = useJacobsStore((s) => s.currentSpeech);
  const mood = useJacobsStore((s) => s.mood);
  const setSpeech = useJacobsStore((s) => s.setSpeech);
  const faceUrl = useJacobsStore((s) => s.faceDataUrls[s.mood]);
  const reviewInProgress = useJobStore((s) => s.reviewInProgress);

  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = speech ?? '';
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
      // N64-style mumble — skip spaces & punctuation
      const ch = fullText[i - 1];
      if (ch && ch !== ' ' && ch !== '.' && ch !== ',') playMumble();
      if (i >= fullText.length) clearInterval(interval);
    }, CHAR_DELAY);
    return () => clearInterval(interval);
  }, [fullText]);

  // Blinking cursor
  useEffect(() => {
    if (!speech) return;
    const interval = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(interval);
  }, [speech]);

  // Auto-dismiss after typing finishes
  useEffect(() => {
    if (!fullText || displayText.length < fullText.length) return;
    const delay = reviewInProgress ? REVIEW_DISMISS_DELAY : DISMISS_DELAY;
    timerRef.current = setTimeout(() => setSpeech(null), delay);
    return () => clearTimeout(timerRef.current);
  }, [displayText, fullText, setSpeech, reviewInProgress]);

  if (!speech) return null;

  const moodColor =
    mood === 'UNHINGED' || mood === 'DISAPPOINTED'
      ? 'var(--color-hud-danger)'
      : 'var(--color-hud-accent)';

  return (
    <div
      className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[420px]"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      <div
        className="px-5 py-3 text-[13px] flex items-start gap-3"
        style={{
          ...panelStyle,
          color: 'var(--color-hud-text)',
        }}
      >
        <div className="shrink-0 flex flex-col items-center gap-1">
          {faceUrl && (
            <img
              src={faceUrl}
              alt="Mr. Jacobs"
              className="w-8 h-8 rounded-sm"
              style={{ imageRendering: 'pixelated', borderColor: moodColor, borderWidth: 1 }}
            />
          )}
          <span className="text-[9px]" style={{ color: moodColor }}>
            JACOBS
          </span>
        </div>
        <div className="min-w-0 flex-1 relative">
          {/* Invisible full text to reserve the final box height */}
          <span className="invisible" aria-hidden="true">
            &gt; {fullText}_
          </span>
          {/* Visible typewriter text layered on top */}
          <div className="absolute inset-0">
            <span style={{ color: moodColor }}>&gt; </span>
            {displayText}
            <span style={{ opacity: showCursor ? 1 : 0, color: moodColor }}>
              _
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
