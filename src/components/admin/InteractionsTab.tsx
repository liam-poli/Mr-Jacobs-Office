import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface Interaction {
  id: string;
  item_id: string | null;
  object_id: string;
  item_tags: string[];
  object_tags: string[];
  required_state: string | null;
  result_state: string | null;
  output_item: string | null;
  output_item_tags: string[];
  description: string;
  source: string;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  applies_to: string;
}

interface CatalogItem { id: string; name: string; tags: string[]; }
interface CatalogObject { id: string; name: string; tags: string[]; state: string; }

const OBJECT_STATES = ['LOCKED', 'UNLOCKED', 'POWERED', 'UNPOWERED', 'BROKEN', 'BURNING', 'FLOODED', 'JAMMED', 'HACKED', 'CONTAMINATED'];

export function InteractionsTab() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogObjects, setCatalogObjects] = useState<CatalogObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    item_id: '' as string,
    object_id: '' as string,
    item_tags: [] as string[],
    object_tags: [] as string[],
    required_state: '' as string,
    result_state: '' as string,
    output_item: '',
    output_item_tags: [] as string[],
    description: '',
  });

  // Build lookup maps for displaying names in the table
  const itemMap = new Map(catalogItems.map((i) => [i.id, i]));
  const objectMap = new Map(catalogObjects.map((o) => [o.id, o]));

  async function fetchData() {
    const [intRes, tagsRes, itemsRes, objectsRes] = await Promise.all([
      supabase.from('interactions').select('*').order('created_at', { ascending: false }),
      supabase.from('tags').select('*').order('name'),
      supabase.from('items').select('id, name, tags').order('name'),
      supabase.from('objects').select('id, name, tags, state').order('name'),
    ]);
    setInteractions(intRes.data ?? []);
    setItemTags((tagsRes.data ?? []).filter((t: Tag) => t.applies_to === 'item' || t.applies_to === 'both'));
    setCatalogItems(itemsRes.data ?? []);
    setCatalogObjects(objectsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function resetForm() {
    setForm({
      item_id: '',
      object_id: '',
      item_tags: [],
      object_tags: [],
      required_state: '',
      result_state: '',
      output_item: '',
      output_item_tags: [],
      description: '',
    });
    setShowForm(false);
    setEditingId(null);
  }

  function handleItemChange(id: string) {
    const entry = catalogItems.find((i) => i.id === id);
    setForm((f) => ({
      ...f,
      item_id: id,
      item_tags: entry ? [...entry.tags] : [],
    }));
  }

  function handleObjectChange(id: string) {
    const entry = catalogObjects.find((o) => o.id === id);
    setForm((f) => ({
      ...f,
      object_id: id,
      object_tags: entry ? [...entry.tags] : [],
      required_state: entry ? entry.state : f.required_state,
    }));
  }

  function toggleOutputTag(tag: string) {
    setForm((f) => ({
      ...f,
      output_item_tags: f.output_item_tags.includes(tag) ? f.output_item_tags.filter((t) => t !== tag) : [...f.output_item_tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reqState = form.required_state || null;
    const resState = form.result_state || null;

    const payload = {
      item_id: form.item_id || null,
      object_id: form.object_id,
      item_tags: [...form.item_tags].sort(),
      object_tags: [...form.object_tags].sort(),
      required_state: reqState,
      result_state: resState,
      output_item: form.output_item.trim() || null,
      output_item_tags: form.output_item.trim() ? [...form.output_item_tags].sort() : [],
      description: form.description.trim(),
      source: 'manual',
    };

    if (editingId) {
      await supabase.from('interactions').update(payload).eq('id', editingId);
    } else {
      await supabase.from('interactions').insert(payload);
    }
    resetForm();
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from('interactions').delete().eq('id', id);
    fetchData();
  }

  function startEdit(row: Interaction) {
    setForm({
      item_id: row.item_id ?? '',
      object_id: row.object_id,
      item_tags: row.item_tags,
      object_tags: row.object_tags,
      required_state: row.required_state ?? '',
      result_state: row.result_state ?? '',
      output_item: row.output_item ?? '',
      output_item_tags: row.output_item_tags ?? [],
      description: row.description,
    });
    setEditingId(row.id);
    setShowForm(true);
  }

  if (loading) return <p className="text-hud-dim text-sm font-mono">LOADING...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-hud-accent text-sm tracking-widest" style={{ fontFamily: 'var(--font-hud)' }}>INTERACTIONS ({interactions.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-hud)' }}
        >
          {showForm ? 'CANCEL' : '+ ADD INTERACTION'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-hud-panel rounded-lg border border-hud-border p-4 mb-4 space-y-3">
          {/* Item & Object Dropdowns (by ID) */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-mono text-hud-dim mb-1">ITEM</label>
              <select
                value={form.item_id}
                onChange={(e) => handleItemChange(e.target.value)}
                className="admin-input w-full px-3 py-2 rounded text-sm"
              >
                <option value="">(Bare hands)</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {form.item_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.item_tags.map((t) => (
                    <span key={t} className="bg-green-900/40 text-green-300 text-[10px] px-1.5 py-0.5 rounded font-mono">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono text-hud-dim mb-1">OBJECT</label>
              <select
                value={form.object_id}
                onChange={(e) => handleObjectChange(e.target.value)}
                className="admin-input w-full px-3 py-2 rounded text-sm"
                required
              >
                <option value="">Select object...</option>
                {catalogObjects.map((obj) => (
                  <option key={obj.id} value={obj.id}>{obj.name}</option>
                ))}
              </select>
              {form.object_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.object_tags.map((t) => (
                    <span key={t} className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* States + Output */}
          <div className="flex gap-3">
            <div className="w-44">
              <label className="block text-xs font-mono text-hud-dim mb-1">REQUIRED STATE</label>
              <select
                value={form.required_state}
                onChange={(e) => setForm({ ...form, required_state: e.target.value })}
                className="admin-input w-full px-3 py-2 rounded text-sm"
              >
                <option value="">Any state</option>
                {OBJECT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-mono text-hud-dim mb-1">RESULT STATE</label>
              <select
                value={form.result_state}
                onChange={(e) => setForm({ ...form, result_state: e.target.value })}
                className="admin-input w-full px-3 py-2 rounded text-sm"
              >
                <option value="">No change</option>
                {OBJECT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono text-hud-dim mb-1">OUTPUT ITEM (OPTIONAL)</label>
              <input
                value={form.output_item}
                onChange={(e) => setForm({ ...form, output_item: e.target.value })}
                placeholder="Filled Coffee Cup"
                className="admin-input w-full px-3 py-2 rounded text-sm"
              />
            </div>
          </div>

          {/* Output Item Tags (only if output item is set) */}
          {form.output_item.trim() && (
            <div>
              <label className="block text-xs font-mono text-hud-dim mb-1">OUTPUT ITEM TAGS</label>
              <div className="flex flex-wrap gap-2">
                {itemTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleOutputTag(tag.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.output_item_tags.includes(tag.name)
                        ? 'bg-purple-400 text-hud-bg border-purple-400'
                        : 'bg-transparent text-hud-dim border-hud-border hover:border-purple-400'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-hud-dim mb-1">DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="The coffee machine hisses and fills the cup with hot coffee."
              className="admin-input w-full px-3 py-2 rounded text-sm"
              rows={2}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            {editingId ? 'UPDATE' : 'ADD INTERACTION'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-hud-panel rounded-lg border border-hud-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hud-border text-left text-xs text-hud-dim uppercase font-mono tracking-wide">
              <th className="px-3 py-2">ITEM</th>
              <th className="px-3 py-2">OBJECT</th>
              <th className="px-3 py-2">REQ. STATE</th>
              <th className="px-3 py-2">RESULT</th>
              <th className="px-3 py-2">OUTPUT ITEM</th>
              <th className="px-3 py-2">DESCRIPTION</th>
              <th className="px-3 py-2">SOURCE</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((row) => {
              const itemEntry = row.item_id ? itemMap.get(row.item_id) : null;
              const objectEntry = objectMap.get(row.object_id);
              return (
                <tr key={row.id} className="border-b border-hud-border/30 hover:bg-hud-panel-inner/30">
                  <td className="px-3 py-2">
                    <div className="text-xs font-mono text-hud-text">{itemEntry?.name ?? '(Bare hands)'}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {row.item_tags.map((t) => (
                        <span key={t} className="bg-green-900/40 text-green-300 text-[10px] px-1 py-0 rounded font-mono">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-mono text-hud-text">{objectEntry?.name ?? row.object_id}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {row.object_tags.map((t) => (
                        <span key={t} className="bg-blue-900/40 text-blue-300 text-[10px] px-1 py-0 rounded font-mono">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {row.required_state ? (
                      <span className="bg-yellow-900/40 text-yellow-300 text-[10px] px-1.5 py-0.5 rounded font-mono">{row.required_state}</span>
                    ) : (
                      <span className="text-hud-dim text-[10px] font-mono">any</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.result_state ? (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        row.result_state === 'BROKEN' ? 'bg-red-900/40 text-red-400' :
                        row.result_state === 'POWERED' ? 'bg-green-900/40 text-green-400' :
                        row.result_state === 'BURNING' ? 'bg-orange-900/40 text-orange-400' :
                        row.result_state === 'UNLOCKED' ? 'bg-emerald-900/40 text-emerald-400' :
                        'bg-hud-bg text-hud-dim'
                      }`}>{row.result_state}</span>
                    ) : (
                      <span className="text-hud-dim text-[10px] font-mono">none</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.output_item ? (
                      <div>
                        <span className="text-xs text-hud-text font-mono">{row.output_item}</span>
                        {row.output_item_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {row.output_item_tags.map((t) => (
                              <span key={t} className="bg-purple-900/40 text-purple-300 text-[10px] px-1 py-0 rounded font-mono">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-hud-dim text-[10px] font-mono">none</span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <p className="text-xs text-hud-dim font-mono truncate" title={row.description}>{row.description}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      row.source === 'manual' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                    }`}>{row.source}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => startEdit(row)} className="text-hud-accent hover:text-hud-text font-mono">EDIT</button>
                      <button onClick={() => handleDelete(row.id)} className="text-hud-danger hover:brightness-125 font-mono">DEL</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {interactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-hud-dim text-sm font-mono">
                  No interactions yet. Add one to define what happens when items meet objects.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
