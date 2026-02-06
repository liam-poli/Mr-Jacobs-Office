import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export function OverviewTab() {
  const [counts, setCounts] = useState({ tags: 0, objects: 0, items: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [tagsRes, objectsRes, itemsRes] = await Promise.all([
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('objects').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
      ]);
      setCounts({
        tags: tagsRes.count ?? 0,
        objects: objectsRes.count ?? 0,
        items: itemsRes.count ?? 0,
      });
      setLoading(false);
    }
    fetchCounts();
  }, []);

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  const stats = [
    { label: 'Tags', count: counts.tags, color: 'bg-purple-50 text-purple-700' },
    { label: 'Objects', count: counts.objects, color: 'bg-blue-50 text-blue-700' },
    { label: 'Items', count: counts.items, color: 'bg-green-50 text-green-700' },
    { label: 'Interactions', count: 0, color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-lg p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.count}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
