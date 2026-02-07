import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase';
import { SpritePreview } from './SpritePreview';

async function uploadSprite(type: 'object' | 'item', id: string, file: File, direction?: string): Promise<string> {
  const dirSuffix = direction && direction !== 'down' ? `-${direction}` : '';
  const filePath = `${type}/${id}${dirSuffix}.png`;
  const { error } = await supabase.storage
    .from('sprites')
    .upload(filePath, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('sprites').getPublicUrl(filePath);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  if (type === 'object' && direction) {
    const { data: current } = await supabase
      .from('objects')
      .select('directional_sprites')
      .eq('id', id)
      .single();
    const existing = (current?.directional_sprites as Record<string, string>) ?? {};
    existing[direction] = url;
    const payload: Record<string, unknown> = { directional_sprites: existing };
    if (direction === 'down') payload.sprite_url = url;
    await supabase.from('objects').update(payload).eq('id', id);
  } else {
    const table = type === 'item' ? 'items' : 'objects';
    await supabase.from(table).update({ sprite_url: url }).eq('id', id);
  }

  return url;
}

async function generateSpriteForEntity(entity: GameObject, direction?: string) {
  const { data, error } = await supabase.functions.invoke('generate-sprite', {
    body: {
      type: 'object',
      id: entity.id,
      name: entity.name,
      tags: entity.tags,
      state: entity.state,
      direction: direction ?? 'down',
    },
  });
  if (error) throw error;
  return data.sprite_url as string;
}

interface GameObject {
  id: string;
  name: string;
  tags: string[];
  state: string;
  sprite_url: string | null;
  directional_sprites: Record<string, string>;
  scale: number;
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
  const [form, setForm] = useState({ name: '', tags: [] as string[], state: 'UNLOCKED', sprite_url: '', scale: 1.0 });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [spriteDirection, setSpriteDirection] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetId = useRef<string | null>(null);
  const uploadTargetDirection = useRef<string>('down');

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
    setForm({ name: '', tags: [], state: 'UNLOCKED', sprite_url: '', scale: 1.0 });
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
      scale: form.scale,
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
    setForm({ name: obj.name, tags: obj.tags, state: obj.state, sprite_url: obj.sprite_url ?? '', scale: obj.scale ?? 1.0 });
    setEditingId(obj.id);
    setShowForm(true);
  }

  async function handleGenerate(obj: GameObject, direction: string = 'down') {
    setGeneratingId(obj.id);
    try {
      await generateSpriteForEntity(obj, direction);
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
    uploadTargetDirection.current = spriteDirection[id] ?? 'down';
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadTargetId.current;
    const direction = uploadTargetDirection.current;
    if (!file || !id) return;
    e.target.value = '';
    setUploadingId(id);
    try {
      await uploadSprite('object', id, file, direction);
      fetchData();
    } catch (err) {
      console.error('Sprite upload failed:', err);
      alert('Sprite upload failed. Check console for details.');
    } finally {
      setUploadingId(null);
    }
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
            <div className="w-20">
              <label className="block text-xs font-medium text-gray-500 mb-1">Scale</label>
              <input
                type="number"
                value={form.scale}
                onChange={(e) => setForm({ ...form, scale: parseFloat(e.target.value) || 1.0 })}
                min={0.1}
                max={10}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {objects.map((obj) => (
          <div key={obj.id} className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col">
            {obj.sprite_url ? (
              <SpritePreview src={obj.sprite_url} alt={obj.name} directionalSprites={obj.directional_sprites} />
            ) : (
              <div className="mb-2 flex justify-center bg-gray-50 rounded p-2 aspect-square items-center">
                <span className="text-gray-300 text-xs">No sprite</span>
              </div>
            )}
            {/* Directional sprite previews */}
            {obj.sprite_url && (
              <div className="flex gap-1 mb-2 justify-center">
                {(['up', 'left', 'down', 'right'] as const).map((dir) => {
                  const dirUrl = obj.directional_sprites?.[dir];
                  return (
                    <div key={dir} className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        {dirUrl ? (
                          <img src={dirUrl} alt={`${obj.name} ${dir}`} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="text-gray-300 text-[8px]">--</span>
                        )}
                      </div>
                      <span className="text-[8px] text-gray-400 mt-0.5">{dir[0].toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight">{obj.name}</h3>
              <div className="flex gap-1 shrink-0 ml-1">
                {obj.scale !== 1.0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                    {obj.scale}x
                  </span>
                )}
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  obj.state === 'BROKEN' ? 'bg-red-100 text-red-700' :
                  obj.state === 'POWERED' ? 'bg-green-100 text-green-700' :
                  obj.state === 'LOCKED' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {obj.state}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {obj.tags.map((tag) => (
                <span key={tag} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {tag}
                </span>
              ))}
              {obj.tags.length === 0 && <span className="text-gray-400 text-[10px]">No tags</span>}
            </div>
            <div className="flex gap-2 text-xs mt-auto items-center">
              <button onClick={() => startEdit(obj)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(obj.id)} className="text-red-500 hover:underline">Delete</button>
              <select
                className="ml-auto text-[10px] border border-gray-200 rounded px-1 py-0.5"
                value={spriteDirection[obj.id] ?? 'down'}
                onChange={(e) => setSpriteDirection((prev) => ({ ...prev, [obj.id]: e.target.value }))}
              >
                <option value="down">Down</option>
                <option value="up">Up</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
              <button
                onClick={() => triggerUpload(obj.id)}
                disabled={uploadingId === obj.id}
                className="text-teal-600 hover:underline disabled:opacity-50 disabled:cursor-wait"
              >
                {uploadingId === obj.id ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => handleGenerate(obj, spriteDirection[obj.id] ?? 'down')}
                disabled={generatingId === obj.id}
                className="text-purple-600 hover:underline disabled:opacity-50 disabled:cursor-wait"
              >
                {generatingId === obj.id ? 'Generating...' : obj.sprite_url ? 'Regen' : 'Generate'}
              </button>
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
