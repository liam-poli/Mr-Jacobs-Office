import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface GameObject {
  id: string;
  name: string;
  tags: string[];
  state: string;
  sprite_url: string | null;
  metadata: Record<string, unknown>;
}

interface Tag {
  id: string;
  name: string;
  applies_to: string;
}

const OBJECT_STATES = ['LOCKED', 'UNLOCKED', 'POWERED', 'UNPOWERED', 'BROKEN', 'BURNING', 'FLOODED', 'JAMMED', 'HACKED', 'CONTAMINATED'];

export function ObjectsTab() {
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tags: [] as string[], state: 'UNLOCKED', sprite_url: '' });

  async function fetchData() {
    const [objectsRes, tagsRes] = await Promise.all([
      supabase.from('objects').select('*').order('name'),
      supabase.from('tags').select('*').or('applies_to.eq.object,applies_to.eq.both').order('name'),
    ]);
    setObjects(objectsRes.data ?? []);
    setAvailableTags(tagsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function resetForm() {
    setForm({ name: '', tags: [], state: 'UNLOCKED', sprite_url: '' });
    setShowForm(false);
    setEditingId(null);
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      tags: form.tags,
      state: form.state,
      sprite_url: form.sprite_url || null,
    };

    if (editingId) {
      await supabase.from('objects').update(payload).eq('id', editingId);
    } else {
      await supabase.from('objects').insert(payload);
    }
    resetForm();
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from('objects').delete().eq('id', id);
    fetchData();
  }

  function startEdit(obj: GameObject) {
    setForm({ name: obj.name, tags: obj.tags, state: obj.state, sprite_url: obj.sprite_url ?? '' });
    setEditingId(obj.id);
    setShowForm(true);
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Objects ({objects.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Object'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Coffee Maker"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Default State</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {OBJECT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sprite URL</label>
              <input
                value={form.sprite_url}
                onChange={(e) => setForm({ ...form, sprite_url: e.target.value })}
                placeholder="/assets/sprites/coffee_maker.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.tags.includes(tag.name)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
            {editingId ? 'Update' : 'Add Object'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {objects.map((obj) => (
          <div key={obj.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{obj.name}</h3>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                obj.state === 'BROKEN' ? 'bg-red-100 text-red-700' :
                obj.state === 'POWERED' ? 'bg-green-100 text-green-700' :
                obj.state === 'LOCKED' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {obj.state}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {obj.tags.map((tag) => (
                <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">
                  {tag}
                </span>
              ))}
              {obj.tags.length === 0 && <span className="text-gray-400 text-xs">No tags</span>}
            </div>
            {obj.sprite_url && (
              <p className="text-xs text-gray-400 truncate mb-2">{obj.sprite_url}</p>
            )}
            <div className="flex gap-2 text-xs">
              <button onClick={() => startEdit(obj)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(obj.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {objects.length === 0 && (
          <p className="text-gray-400 text-sm col-span-full">No objects yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
