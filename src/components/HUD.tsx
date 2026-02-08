import { useState } from 'react';
import { Settings, HelpCircle, Trophy } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useJobStore } from '../stores/jobStore';
import { useSettingsStore } from '../stores/settingsStore';
import { soundService } from '../services/soundService';
import { LeaderboardPanel } from './LeaderboardPanel';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatGameClock(totalMinutes: number): string {
  const mins = Math.floor(totalMinutes) % (24 * 60);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function HUD() {
  const bucks = useGameStore((s) => s.bucks);
  const sceneReady = useGameStore((s) => s.sceneReady);

  const currentJob = useJobStore((s) => s.currentJob);
  const phaseTimeRemaining = useJobStore((s) => s.phaseTimeRemaining);
  const phaseStatus = useJobStore((s) => s.phaseStatus);
  const gameTimeMinutes = useJobStore((s) => s.gameTimeMinutes);

  const toggleMenu = useSettingsStore((s) => s.toggleMenu);
  const toggleHelp = useSettingsStore((s) => s.toggleHelp);

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  if (!sceneReady) return null;

  const taskDisplay = currentJob ? currentJob.title : 'STANDBY';
  const reviewDisplay =
    phaseStatus === 'REVIEWING'
      ? 'REVIEW'
      : phaseStatus === 'WORKING'
        ? `NEXT REVIEW: ${formatCountdown(phaseTimeRemaining)}`
        : 'STANDBY';

  return (
    <>
      {/* Status bar — top left */}
      <div
        className="absolute top-4 left-4 z-10"
        style={{ fontFamily: 'var(--font-hud)' }}
      >
        <div
          className="px-5 py-3 text-[16px] text-hud-accent tracking-[0.02em] flex items-center"
          style={panelStyle}
        >
          BUCKS: {bucks}
          <span className="text-hud-border mx-3">|</span>
          TASK: {taskDisplay}
          <span className="text-hud-border mx-3">|</span>
          {formatGameClock(gameTimeMinutes)}
          <span className="text-hud-border mx-3">|</span>
          {reviewDisplay}
        </div>
      </div>

      {/* Bottom-left buttons */}
      <div className="absolute bottom-6 left-4 z-10 flex gap-2" style={{ fontFamily: 'var(--font-hud)' }}>
        <button
          onClick={() => { soundService.playSfx('ui-click'); toggleHelp(); }}
          className="p-2.5 text-hud-accent hover:text-white transition-colors cursor-pointer"
          style={panelStyle}
          title="Help"
        >
          <HelpCircle size={20} />
        </button>
        <button
          onClick={() => { soundService.playSfx('ui-click'); setLeaderboardOpen(true); }}
          className="p-2.5 text-hud-accent hover:text-white transition-colors cursor-pointer"
          style={panelStyle}
          title="Leaderboard"
        >
          <Trophy size={20} />
        </button>
        <button
          onClick={() => { soundService.playSfx('ui-click'); toggleMenu(); }}
          className="p-2.5 text-hud-accent hover:text-white transition-colors cursor-pointer"
          style={panelStyle}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <LeaderboardPanel open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </>
  );
}
