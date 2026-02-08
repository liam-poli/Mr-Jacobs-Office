import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase';
import { SpritePreview } from './SpritePreview';

async function uploadSprite(type: 'object' | 'item', id: string, file: File): Promise<string> {
  const filePath = `${type}/${id}.png`;
  const { error } = await supabase.storage
    .from('sprites')
    .upload(filePath, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('sprites').getPublicUrl(filePath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetId = useRef<string | null>(null);

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

  function triggerUpload(id: string) {
    uploadTargetId.current = id;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadTargetId.current;
    if (!file || !id) return;
    e.target.value = '';
    setUploadingId(id);
    try {
      const url = await uploadSprite('item', id, file);
      await supabase.from('items').update({ sprite_url: url }).eq('id', id);
      fetchData();
    } catch (err) {
      console.error('Sprite upload failed:', err);
      alert('Sprite upload failed. Check console for details.');
    } finally {
      setUploadingId(null);
    }
  }

  if (loading) return <p className="text-hud-dim text-sm font-mono">LOADING...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-hud-accent text-sm tracking-widest font-mono" style={{ fontFamily: 'var(--font-hud)' }}>ITEMS ({items.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md uppercase tracking-wider font-bold text-xs hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-hud)' }}
        >
          {showForm ? 'CANCEL' : '+ ADD ITEM'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-hud-panel rounded-lg border border-hud-border p-4 mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">NAME</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bucket of Water"
                className="admin-input w-full px-3 py-2 rounded text-sm"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">SPRITE URL</label>
              <input
                value={form.sprite_url}
                onChange={(e) => setForm({ ...form, sprite_url: e.target.value })}
                placeholder="/assets/sprites/bucket.png"
                className="admin-input w-full px-3 py-2 rounded text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">TAGS</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.tags.includes(tag.name)
                      ? 'bg-hud-accent text-hud-bg border-hud-accent'
                      : 'bg-transparent text-hud-dim border-hud-border hover:border-hud-accent'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md uppercase tracking-wider font-bold text-xs hover:brightness-110 transition-all"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            {editingId ? 'UPDATE' : 'ADD ITEM'}
          </button>
        </form>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-hud-panel rounded-lg border border-hud-border p-3 flex flex-col">
            {item.sprite_url ? (
              <SpritePreview src={item.sprite_url} alt={item.name} />
            ) : (
              <div className="mb-2 flex justify-center bg-hud-bg rounded p-2 aspect-square items-center">
                <span className="text-hud-dim text-xs font-mono">NO SPRITE</span>
              </div>
            )}
            <h3 className="font-semibold text-hud-text text-sm leading-tight font-mono mb-1">{item.name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.map((tag) => (
                <span key={tag} className="bg-green-900/40 text-green-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {tag}
                </span>
              ))}
              {item.tags.length === 0 && <span className="text-hud-dim text-[10px] font-mono">No tags</span>}
            </div>
            <div className="flex gap-2 text-xs mt-auto font-mono">
              <button onClick={() => startEdit(item)} className="text-hud-accent hover:text-hud-text">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-hud-danger hover:brightness-125">Delete</button>
              <button
                onClick={() => triggerUpload(item.id)}
                disabled={uploadingId === item.id}
                className="ml-auto text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-wait"
              >
                {uploadingId === item.id ? '...' : 'UP'}
              </button>
              <button
                onClick={() => handleGenerate(item)}
                disabled={generatingId === item.id}
                className="text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait"
              >
                {generatingId === item.id ? '...' : item.sprite_url ? 'REGEN' : 'GEN'}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-hud-dim text-sm font-mono col-span-full">No items yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
