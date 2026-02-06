import { useState } from 'react';
import { OverviewTab } from '../components/admin/OverviewTab';
import { TagsTab } from '../components/admin/TagsTab';
import { ObjectsTab } from '../components/admin/ObjectsTab';
import { ItemsTab } from '../components/admin/ItemsTab';
import { InteractionsTab } from '../components/admin/InteractionsTab';
import { RoomsTab } from '../components/admin/RoomsTab';
import { TilesTab } from '../components/admin/TilesTab';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'jacobs';

const TABS = ['Overview', 'Tags', 'Objects', 'Items', 'Interactions', 'Rooms', 'Tiles'] as const;
type Tab = (typeof TABS)[number];

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  if (!authenticated) {
    return (
      <div className="fixed inset-0 overflow-auto bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-80">
          <h1 className="text-xl font-semibold text-gray-800 mb-1">J.A.C.O.B.S. Admin</h1>
          <p className="text-sm text-gray-500 mb-4">Enter password to continue</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                setAuthenticated(true);
                setError('');
              } else {
                setError('Wrong password');
              }
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">J.A.C.O.B.S. Admin</h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Back to Game
          </a>
        </div>
        <nav className="flex gap-1 mt-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Tags' && <TagsTab />}
        {activeTab === 'Objects' && <ObjectsTab />}
        {activeTab === 'Items' && <ItemsTab />}
        {activeTab === 'Interactions' && <InteractionsTab />}
        {activeTab === 'Rooms' && <RoomsTab />}
        {activeTab === 'Tiles' && <TilesTab />}
      </main>
    </div>
  );
}
