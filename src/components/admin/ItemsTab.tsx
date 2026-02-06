import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { SpritePreview } from './SpritePreview';

async function generateSpriteForItem(item: Item) {
  const { data, error } = await supabase.functions.invoke('generate-sprite', {
    body: { type: 'item', id: item.id, name: item.name, tags: item.tags },
  });
  if (error) throw error;
  return data.sprite_url as string;
}

interface Item {
  id: string;
  name: string;
  tags: string[];
  sprite_url: string | null;
}

interface Tag {
  id: string;
  name: string;
  applies_to: string;
}

export function ItemsTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tags: [] as string[], sprite_url: '' });
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function fetchData() {
    const [itemsRes, tagsRes] = await Promise.all([
      supabase.from('items').select('*').order('name'),
      supabase.from('tags').select('*').or('applies_to.eq.item,applies_to.eq.both').order('name'),
    ]);
    setItems(itemsRes.data ?? []);
    setAvailableTags(tagsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function resetForm() {
    setForm({ name: '', tags: [], sprite_url: '' });
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
      sprite_url: form.sprite_url || null,
    };

    if (editingId) {
      await supabase.from('items').update(payload).eq('id', editingId);
    } else {
      await supabase.from('items').insert(payload);
    }
    resetForm();
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from('items').delete().eq('id', id);
    fetchData();
  }

  function startEdit(item: Item) {
    setForm({ name: item.name, tags: item.tags, sprite_url: item.sprite_url ?? '' });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleGenerate(item: Item) {
    setGeneratingId(item.id);
    try {
      await generateSpriteForItem(item);
      fetchData();
    } catch (err) {
      console.error('Sprite generation failed:', err);
      alert('Sprite generation failed. Check console for details.');
    } finally {
      setGeneratingId(null);
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Items ({items.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Item'}
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
                placeholder="Bucket of Water"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sprite URL</label>
              <input
                value={form.sprite_url}
                onChange={(e) => setForm({ ...form, sprite_url: e.target.value })}
                placeholder="/assets/sprites/bucket.png"
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
            {editingId ? 'Update' : 'Add Item'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col">
            {item.sprite_url ? (
              <SpritePreview src={item.sprite_url} alt={item.name} />
            ) : (
              <div className="mb-2 flex justify-center bg-gray-50 rounded p-2 aspect-square items-center">
                <span className="text-gray-300 text-xs">No sprite</span>
              </div>
            )}
            <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{item.name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.map((tag) => (
                <span key={tag} className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {tag}
                </span>
              ))}
              {item.tags.length === 0 && <span className="text-gray-400 text-[10px]">No tags</span>}
            </div>
            <div className="flex gap-2 text-xs mt-auto">
              <button onClick={() => startEdit(item)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">Delete</button>
              <button
                onClick={() => handleGenerate(item)}
                disabled={generatingId === item.id}
                className="ml-auto text-purple-600 hover:underline disabled:opacity-50 disabled:cursor-wait"
              >
                {generatingId === item.id ? 'Generating...' : item.sprite_url ? 'Regen' : 'Generate'}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm col-span-full">No items yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
