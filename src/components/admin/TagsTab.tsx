import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface Tag {
  id: string;
  name: string;
  applies_to: string;
  description: string | null;
}

export function TagsTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', applies_to: 'both', description: '' });

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('name');
    setTags(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTags(); }, []);

  function resetForm() {
    setForm({ name: '', applies_to: 'both', description: '' });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.toUpperCase().trim(),
      applies_to: form.applies_to,
      description: form.description || null,
    };

    if (editingId) {
      await supabase.from('tags').update(payload).eq('id', editingId);
    } else {
      await supabase.from('tags').insert(payload);
    }
    resetForm();
    fetchTags();
  }

  async function handleDelete(id: string) {
    await supabase.from('tags').delete().eq('id', id);
    fetchTags();
  }

  function startEdit(tag: Tag) {
    setForm({ name: tag.name, applies_to: tag.applies_to, description: tag.description ?? '' });
    setEditingId(tag.id);
    setShowForm(true);
  }

  if (loading) return <p className="text-hud-dim text-sm font-mono">LOADING...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-hud-accent text-sm tracking-widest"
          style={{ fontFamily: 'var(--font-hud)' }}
        >
          TAGS ({tags.length})
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-hud-accent text-hud-bg px-4 py-2 rounded text-xs font-bold tracking-wider hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-hud)' }}
        >
          {showForm ? 'CANCEL' : '+ ADD TAG'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-hud-panel rounded border border-hud-border p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-mono text-hud-dim mb-1">NAME</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="TAG_NAME"
              className="admin-input w-full px-3 py-2 rounded text-sm"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-mono text-hud-dim mb-1">APPLIES TO</label>
            <select
              value={form.applies_to}
              onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
              className="admin-input w-full px-3 py-2 rounded text-sm"
            >
              <option value="both">Both</option>
              <option value="object">Object</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-mono text-hud-dim mb-1">DESCRIPTION</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this tag means..."
              className="admin-input w-full px-3 py-2 rounded text-sm"
            />
          </div>
          <button type="submit" className="bg-hud-accent text-hud-bg px-4 py-2 rounded text-xs font-bold tracking-wider hover:brightness-110 transition-all">
            {editingId ? 'UPDATE' : 'ADD'}
          </button>
        </form>
      )}

      <div className="bg-hud-panel rounded border border-hud-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-hud-border">
            <tr>
              <th className="text-left px-4 py-3 font-mono text-xs text-hud-dim tracking-wide">NAME</th>
              <th className="text-left px-4 py-3 font-mono text-xs text-hud-dim tracking-wide">APPLIES TO</th>
              <th className="text-left px-4 py-3 font-mono text-xs text-hud-dim tracking-wide">DESCRIPTION</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-hud-dim tracking-wide">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-hud-border/30 hover:bg-hud-panel-inner/30">
                <td className="px-4 py-3 font-mono font-semibold text-hud-accent">{tag.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                    tag.applies_to === 'both' ? 'bg-purple-900/40 text-purple-300' :
                    tag.applies_to === 'object' ? 'bg-blue-900/40 text-blue-300' :
                    'bg-green-900/40 text-green-300'
                  }`}>
                    {tag.applies_to}
                  </span>
                </td>
                <td className="px-4 py-3 text-hud-dim font-mono text-xs">{tag.description}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(tag)} className="text-hud-accent hover:text-hud-text text-xs font-mono mr-3">EDIT</button>
                  <button onClick={() => handleDelete(tag.id)} className="text-hud-danger hover:brightness-125 text-xs font-mono">DEL</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
