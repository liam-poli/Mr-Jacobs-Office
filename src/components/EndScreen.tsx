import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { useJobStore } from '../stores/jobStore';
import { soundService } from '../services/soundService';
import { submitScore, fetchLeaderboard, type LeaderboardEntry } from '../services/leaderboardService';
import type { SessionEndType } from '../types/game';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

const END_CONFIG: Record<SessionEndType, { title: string; subtitle: string; won: boolean }> = {
  PROMOTED: { title: 'PROMOTED', subtitle: 'EMPLOYEE OF THE MONTH — YOU WIN', won: true },
  ESCAPED: { title: 'SYSTEM BREACH', subtitle: 'SIMULATION COMPROMISED — YOU ESCAPED', won: true },
  FIRED: { title: 'TERMINATED', subtitle: 'EMPLOYMENT REVOKED — YOU LOST', won: false },
  TIME_UP: { title: 'SHIFT OVER', subtitle: 'THE OFFICE IS CLOSED — YOU LOST', won: false },
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

  // Leaderboard state
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStatus === 'PLAYING') return;
    // Delay fade-in slightly so the final speech can register
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [sessionStatus]);

  // Fetch leaderboard when visible
  useEffect(() => {
    if (!visible || !sessionEndType) return;
    const config = END_CONFIG[sessionEndType];
    fetchLeaderboard().then(setLeaderboard);
    // Losers see leaderboard immediately
    if (!config.won) setShowLeaderboard(true);
  }, [visible, sessionEndType]);

  // Auto-focus name input
  useEffect(() => {
    if (visible && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [visible]);

  if (sessionStatus === 'PLAYING' || !sessionEndType) return null;

  const config = END_CONFIG[sessionEndType];
  const accentColor = config.won ? 'var(--color-hud-accent)' : 'var(--color-hud-danger)';
  const timeSurvived = Math.round(gameTimeMinutes - GAME_START_TIME);

  const handleSubmit = async () => {
    const trimmed = playerName.trim();
    if (!trimmed || submitting) return;
    soundService.playSfx('ui-click');
    setSubmitting(true);
    const result = await submitScore({
      player_name: trimmed,
      bucks,
      phases_survived: phaseNumber,
      time_survived_minutes: timeSurvived,
      end_type: sessionEndType,
      jacobs_mood: mood,
    });
    if (result) setSubmittedId(result.id);
    const updated = await fetchLeaderboard();
    setLeaderboard(updated);
    setSubmitted(true);
    setShowLeaderboard(true);
    setSubmitting(false);
  };

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
        className="flex flex-col items-center gap-6 p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
            className="text-[11px] tracking-[0.25em] mb-3"
            style={{ color: accentColor, opacity: 0.6 }}
          >
            {config.won ? '— SIMULATION COMPLETE —' : '— GAME OVER —'}
          </div>
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

        {/* Name entry (winners only, pre-submit) */}
        {config.won && !submitted && (
          <div className="w-full flex flex-col items-center gap-3">
            <div
              className="text-[10px] tracking-[0.2em]"
              style={{ color: 'var(--color-hud-dim)' }}
            >
              ENTER YOUR NAME FOR THE LEADERBOARD
            </div>
            <div className="flex items-center gap-2 w-full max-w-[280px]">
              <span className="text-[12px]" style={{ color: accentColor }}>&gt;</span>
              <input
                ref={nameInputRef}
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleSubmit(); }}
                placeholder="YOUR NAME"
                maxLength={16}
                className="flex-1 bg-transparent outline-none text-[14px] tracking-wider"
                style={{
                  color: 'var(--color-hud-text)',
                  fontFamily: 'var(--font-hud)',
                  caretColor: accentColor,
                  borderBottom: `1px solid ${accentColor}`,
                  paddingBottom: 4,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!playerName.trim() || submitting}
                className="px-4 py-1.5 text-[11px] tracking-wider font-bold rounded cursor-pointer"
                style={{
                  color: 'var(--color-hud-panel)',
                  backgroundColor: !playerName.trim() || submitting ? 'var(--color-hud-dim)' : accentColor,
                  border: 'none',
                }}
              >
                {submitting ? '...' : 'SUBMIT'}
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard && leaderboard.length > 0 && (
          <div className="w-full flex flex-col items-center gap-2">
            <div
              className="w-full"
              style={{ height: 1, backgroundColor: accentColor, opacity: 0.3 }}
            />
            <div
              className="text-[10px] tracking-[0.2em]"
              style={{ color: 'var(--color-hud-dim)' }}
            >
              LEADERBOARD
            </div>
            <div
              className="w-full max-h-[180px] overflow-y-auto text-[10px] tracking-wider"
              style={{ color: 'var(--color-hud-dim)' }}
            >
              {/* Header */}
              <div
                className="flex gap-2 px-2 pb-1 mb-1"
                style={{ borderBottom: '1px solid rgba(155,155,155,0.2)' }}
              >
                <span className="w-6 text-right">#</span>
                <span className="flex-1">NAME</span>
                <span className="w-14 text-right">TIME</span>
              </div>
              {/* Rows */}
              {leaderboard.map((entry, i) => {
                const isMe = submittedId === entry.id;
                const rowColor = isMe ? accentColor : 'var(--color-hud-dim)';
                return (
                  <div
                    key={entry.id}
                    className="flex gap-2 px-2 py-0.5"
                    style={{
                      color: rowColor,
                      backgroundColor: isMe ? 'rgba(159,218,115,0.08)' : 'transparent',
                    }}
                  >
                    <span className="w-6 text-right">{i + 1}</span>
                    <span className="flex-1 truncate">{entry.player_name}</span>
                    <span className="w-14 text-right">{entry.time_survived_minutes}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
