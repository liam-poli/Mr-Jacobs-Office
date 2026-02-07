import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { useJobStore } from '../stores/jobStore';
import { soundService } from '../services/soundService';
import type { SessionEndType } from '../types/game';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

const END_CONFIG: Record<SessionEndType, { title: string; subtitle: string; won: boolean }> = {
  PROMOTED: { title: 'PROMOTED', subtitle: 'EMPLOYEE OF THE MONTH', won: true },
  ESCAPED: { title: 'SYSTEM BREACH', subtitle: 'SIMULATION COMPROMISED', won: true },
  FIRED: { title: 'TERMINATED', subtitle: 'EMPLOYMENT REVOKED', won: false },
  TIME_UP: { title: 'OFFICE CLOSED', subtitle: 'SHIFT COMPLETE — NO ESCAPE', won: false },
};

const GAME_START_TIME = 540; // 9:00 AM

export function EndScreen() {
  const sessionStatus = useGameStore((s) => s.sessionStatus);
  const sessionEndType = useGameStore((s) => s.sessionEndType);
  const sessionEndSpeech = useGameStore((s) => s.sessionEndSpeech);
  const bucks = useGameStore((s) => s.bucks);

  const mood = useJacobsStore((s) => s.mood);
  const faceUrl = useJacobsStore((s) => s.faceDataUrls[s.mood]);

  const phaseNumber = useJobStore((s) => s.phaseNumber);
  const gameTimeMinutes = useJobStore((s) => s.gameTimeMinutes);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'PLAYING') return;
    // Delay fade-in slightly so the final speech can register
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [sessionStatus]);

  if (sessionStatus === 'PLAYING' || !sessionEndType) return null;

  const config = END_CONFIG[sessionEndType];
  const accentColor = config.won ? 'var(--color-hud-accent)' : 'var(--color-hud-danger)';
  const timeSurvived = Math.round(gameTimeMinutes - GAME_START_TIME);

  return (
    <div
      className="absolute inset-0 z-[100] flex items-center justify-center transition-opacity duration-1000"
      style={{
        fontFamily: 'var(--font-hud)',
        backgroundColor: 'rgba(4, 8, 12, 0.92)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="flex flex-col items-center gap-6 p-10 max-w-lg w-full"
        style={panelStyle}
      >
        {/* Jacobs face */}
        {faceUrl && (
          <img
            src={faceUrl}
            alt="Mr. Jacobs"
            className="w-24 h-24 rounded-sm"
            style={{
              imageRendering: 'pixelated',
              borderColor: accentColor,
              borderWidth: 3,
              borderStyle: 'solid',
            }}
          />
        )}

        {/* Title */}
        <div className="text-center">
          <div
            className="text-3xl tracking-[0.3em] font-bold mb-2"
            style={{ color: accentColor }}
          >
            {config.title}
          </div>
          <div
            className="text-[11px] tracking-[0.2em]"
            style={{ color: accentColor, opacity: 0.7 }}
          >
            {config.subtitle}
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full"
          style={{ height: 1, backgroundColor: accentColor, opacity: 0.3 }}
        />

        {/* Jacobs' final speech */}
        {sessionEndSpeech && (
          <div
            className="text-[14px] text-center leading-relaxed px-4"
            style={{ color: 'var(--color-hud-text)' }}
          >
            <span style={{ color: accentColor }}>&gt; </span>
            {sessionEndSpeech}
          </div>
        )}

        {/* Divider */}
        <div
          className="w-full"
          style={{ height: 1, backgroundColor: accentColor, opacity: 0.3 }}
        />

        {/* Session stats */}
        <div className="flex gap-8 text-[12px] tracking-wider" style={{ color: 'var(--color-hud-dim)' }}>
          <div className="text-center">
            <div className="text-[18px] font-bold" style={{ color: accentColor }}>{bucks}</div>
            <div>BUCKS</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-bold" style={{ color: accentColor }}>{phaseNumber}</div>
            <div>REVIEWS</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-bold" style={{ color: accentColor }}>{timeSurvived}m</div>
            <div>SURVIVED</div>
          </div>
        </div>

        {/* Mood */}
        <div className="text-[10px] tracking-[0.15em]" style={{ color: 'var(--color-hud-dim)' }}>
          JACOBS MOOD: <span style={{ color: accentColor }}>{mood}</span>
        </div>

        {/* Play again */}
        <button
          onClick={() => { soundService.playSfx('ui-click'); window.location.reload(); }}
          className="mt-2 px-8 py-3 text-[14px] tracking-[0.2em] font-bold rounded cursor-pointer transition-colors"
          style={{
            color: config.won ? 'var(--color-hud-panel)' : 'var(--color-hud-text)',
            backgroundColor: accentColor,
            border: 'none',
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
