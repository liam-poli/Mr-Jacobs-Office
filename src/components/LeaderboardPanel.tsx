import { useState, useEffect } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '../services/leaderboardService';
import { soundService } from '../services/soundService';

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow: '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LeaderboardPanel({ open, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  const accent = 'var(--color-hud-accent)';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4, 8, 12, 0.7)' }}
      onClick={() => { soundService.playSfx('ui-click'); onClose(); }}
    >
      <div
        className="relative w-96 p-8"
        style={{ fontFamily: 'var(--font-hud)', ...panelStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => { soundService.playSfx('ui-click'); onClose(); }}
          className="absolute top-3 right-4 text-hud-dim hover:text-hud-accent text-[16px] cursor-pointer transition-colors"
        >
          [X]
        </button>

        {/* Header */}
        <div className="mb-5 pb-3" style={{ borderBottom: '1px solid var(--color-hud-panel-border)' }}>
          <h2 className="text-hud-accent text-[20px] tracking-[0.3em]">
            LEADERBOARD
          </h2>
        </div>

        {loading && (
          <div className="text-hud-dim text-[12px] tracking-wider text-center py-4">
            LOADING...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-hud-dim text-[12px] tracking-wider text-center py-4">
            NO WINNERS YET. BE THE FIRST.
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="max-h-[320px] overflow-y-auto text-[11px] tracking-wider" style={{ color: 'var(--color-hud-dim)' }}>
            {/* Header row */}
            <div
              className="flex gap-2 px-2 pb-1.5 mb-1"
              style={{ borderBottom: '1px solid rgba(155,155,155,0.2)' }}
            >
              <span className="w-6 text-right">#</span>
              <span className="flex-1">NAME</span>
              <span className="w-14 text-right">TIME</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex gap-2 px-2 py-0.5"
                style={{ color: i === 0 ? accent : 'var(--color-hud-dim)' }}
              >
                <span className="w-6 text-right">{i + 1}</span>
                <span className="flex-1 truncate">{entry.player_name}</span>
                <span className="w-14 text-right">{entry.time_survived_minutes}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
