import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export function OverviewTab() {
  const [counts, setCounts] = useState({ tags: 0, objects: 0, items: 0, rooms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [tagsRes, objectsRes, itemsRes, roomsRes] = await Promise.all([
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('objects').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
      ]);
      setCounts({
        tags: tagsRes.count ?? 0,
        objects: objectsRes.count ?? 0,
        items: itemsRes.count ?? 0,
        rooms: roomsRes.count ?? 0,
      });
      setLoading(false);
    }
    fetchCounts();
  }, []);

  if (loading) return <p className="text-hud-dim text-sm font-mono">LOADING...</p>;

  const stats = [
    { label: 'TAGS', count: counts.tags, accent: '#aa44cc' },
    { label: 'OBJECTS', count: counts.objects, accent: '#4488cc' },
    { label: 'ITEMS', count: counts.items, accent: '#44cc88' },
    { label: 'ROOMS', count: counts.rooms, accent: '#44cccc' },
    { label: 'INTERACTIONS', count: 0, accent: '#cc8844' },
  ];

  return (
    <div>
      <h2
        className="text-hud-accent text-sm tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-hud)' }}
      >
        SYSTEM OVERVIEW
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-hud-panel rounded border border-hud-border p-5"
            style={{ borderLeftWidth: 3, borderLeftColor: s.accent }}
          >
            <p className="text-3xl font-bold text-hud-accent font-mono">{s.count}</p>
            <p className="text-xs font-mono text-hud-dim mt-1 tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
