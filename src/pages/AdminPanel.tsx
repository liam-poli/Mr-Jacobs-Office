import { useState } from 'react';
import { OverviewTab } from '../components/admin/OverviewTab';
import { TagsTab } from '../components/admin/TagsTab';
import { ObjectsTab } from '../components/admin/ObjectsTab';
import { ItemsTab } from '../components/admin/ItemsTab';
import { InteractionsTab } from '../components/admin/InteractionsTab';
import { RoomsTab } from '../components/admin/RoomsTab';
import { TilesTab } from '../components/admin/TilesTab';
import { EffectsTab } from '../components/admin/EffectsTab';
import { AdminMatrixBg } from '../components/admin/AdminMatrixBg';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'jacobs';

const TABS = ['Overview', 'Tags', 'Objects', 'Items', 'Interactions', 'Rooms', 'Tiles', 'Effects'] as const;
type Tab = (typeof TABS)[number];

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!authenticated) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-hud-bg flex items-center justify-center">
        <AdminMatrixBg />
        <div className="flex flex-col items-center z-10">
          <img
            src="/jacobs-logo.png"
            alt="J.A.C.O.B.S."
            className="w-32 mb-6"
            style={{ imageRendering: 'pixelated', animation: 'crt-glow 3s ease-in-out infinite' }}
          />
          <h1
            className="text-hud-accent text-lg tracking-widest mb-1"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            J.A.C.O.B.S.
          </h1>
          <p className="text-hud-dim text-xs font-mono mb-6 tracking-wide">SYSTEM ACCESS TERMINAL</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                setAuthenticated(true);
                setError('');
              } else {
                setError('ACCESS DENIED');
              }
            }}
            className="w-72"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER PASSWORD"
              className="admin-input w-full px-3 py-2.5 rounded text-sm tracking-wider text-center mb-2"
              autoFocus
            />
            {error && <p className="text-hud-danger text-xs mb-2 text-center font-mono">{error}</p>}
            <button
              type="submit"
              className="w-full bg-hud-accent text-hud-bg py-2.5 rounded text-sm font-bold tracking-wider hover:brightness-110 transition-all"
              style={{ fontFamily: 'var(--font-hud)' }}
            >
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-hud-bg">
      <AdminMatrixBg />
      <header className="bg-hud-panel/90 border-b border-hud-border px-6 py-4 relative z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/jacobs-logo.png"
              alt=""
              className="h-7"
              style={{ imageRendering: 'pixelated' }}
            />
            <h1
              className="text-hud-accent text-sm tracking-widest"
              style={{ fontFamily: 'var(--font-hud)' }}
            >
              J.A.C.O.B.S. ADMIN
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-3 py-1.5 text-xs font-mono text-hud-dim hover:text-hud-accent border border-hud-border rounded transition-colors"
            >
              REFRESH
            </button>
            <a href="/" className="text-xs font-mono text-hud-dim hover:text-hud-accent transition-colors">
              EXIT &gt;
            </a>
          </div>
        </div>
        <nav className="flex gap-1 mt-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-mono tracking-wide rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-hud-bg text-hud-accent border border-hud-border border-b-transparent'
                  : 'text-hud-dim hover:text-hud-text'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto relative z-10">
        {activeTab === 'Overview' && <OverviewTab key={refreshKey} />}
        {activeTab === 'Tags' && <TagsTab key={refreshKey} />}
        {activeTab === 'Objects' && <ObjectsTab key={refreshKey} />}
        {activeTab === 'Items' && <ItemsTab key={refreshKey} />}
        {activeTab === 'Interactions' && <InteractionsTab key={refreshKey} />}
        {activeTab === 'Rooms' && <RoomsTab key={refreshKey} />}
        {activeTab === 'Tiles' && <TilesTab key={refreshKey} />}
        {activeTab === 'Effects' && <EffectsTab key={refreshKey} />}
      </main>
    </div>
  );
}
