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

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Tags ({tags.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Tag'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="TAG_NAME"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Applies To</label>
            <select
              value={form.applies_to}
              onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="both">Both</option>
              <option value="object">Object</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this tag means..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Applies To</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-gray-800">{tag.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    tag.applies_to === 'both' ? 'bg-purple-100 text-purple-700' :
                    tag.applies_to === 'object' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {tag.applies_to}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{tag.description}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(tag)} className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(tag.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
