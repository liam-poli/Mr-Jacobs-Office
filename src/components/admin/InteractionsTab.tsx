import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface Interaction {
  id: string;
  input_hash: string;
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

const OBJECT_STATES = ['LOCKED', 'UNLOCKED', 'POWERED', 'UNPOWERED', 'BROKEN', 'BURNING', 'FLOODED', 'JAMMED', 'HACKED', 'CONTAMINATED'];

function buildInputHash(itemTags: string[], objectTags: string[], state: string | null): string {
  const sortedItem = [...itemTags].sort();
  const sortedObject = [...objectTags].sort();
  return `${sortedItem.join('+')}|${sortedObject.join('+')}|${state ?? 'ANY'}`;
}

export function InteractionsTab() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [objectTags, setObjectTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    item_tags: [] as string[],
    object_tags: [] as string[],
    required_state: '' as string,
    result_state: '' as string,
    output_item: '',
    output_item_tags: [] as string[],
    description: '',
  });

  async function fetchData() {
    const [intRes, tagsRes] = await Promise.all([
      supabase.from('interactions').select('*').order('created_at', { ascending: false }),
      supabase.from('tags').select('*').order('name'),
    ]);
    setInteractions(intRes.data ?? []);
    setItemTags((tagsRes.data ?? []).filter((t: Tag) => t.applies_to === 'item' || t.applies_to === 'both'));
    setObjectTags((tagsRes.data ?? []).filter((t: Tag) => t.applies_to === 'object' || t.applies_to === 'both'));
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function resetForm() {
    setForm({
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

  function toggleItemTag(tag: string) {
    setForm((f) => ({
      ...f,
      item_tags: f.item_tags.includes(tag) ? f.item_tags.filter((t) => t !== tag) : [...f.item_tags, tag],
    }));
  }

  function toggleObjectTag(tag: string) {
    setForm((f) => ({
      ...f,
      object_tags: f.object_tags.includes(tag) ? f.object_tags.filter((t) => t !== tag) : [...f.object_tags, tag],
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
    const inputHash = buildInputHash(form.item_tags, form.object_tags, reqState);

    const payload = {
      input_hash: inputHash,
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

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Interactions ({interactions.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Interaction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          {/* Item Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Item Tags (input)</label>
            <div className="flex flex-wrap gap-2">
              {itemTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleItemTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.item_tags.includes(tag.name)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Object Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Object Tags (input)</label>
            <div className="flex flex-wrap gap-2">
              {objectTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleObjectTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.object_tags.includes(tag.name)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* States + Output */}
          <div className="flex gap-3">
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1">Required State</label>
              <select
                value={form.required_state}
                onChange={(e) => setForm({ ...form, required_state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any state</option>
                {OBJECT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1">Result State</label>
              <select
                value={form.result_state}
                onChange={(e) => setForm({ ...form, result_state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">No change</option>
                {OBJECT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Output Item (optional)</label>
              <input
                value={form.output_item}
                onChange={(e) => setForm({ ...form, output_item: e.target.value })}
                placeholder="Coffee Grounds"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Output Item Tags (only if output item is set) */}
          {form.output_item.trim() && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Output Item Tags</label>
              <div className="flex flex-wrap gap-2">
                {itemTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleOutputTag(tag.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.output_item_tags.includes(tag.name)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="The water shorts out the electronics — sparks fly."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              required
            />
          </div>

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
            {editingId ? 'Update' : 'Add Interaction'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="px-3 py-2">Item Tags</th>
              <th className="px-3 py-2">Object Tags</th>
              <th className="px-3 py-2">Req. State</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Output Item</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.item_tags.map((t) => (
                      <span key={t} className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.object_tags.map((t) => (
                      <span key={t} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-mono">{t}</span>
                    ))}
                    {row.object_tags.length === 0 && <span className="text-gray-400 text-[10px]">any</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {row.required_state ? (
                    <span className="bg-yellow-50 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-mono">{row.required_state}</span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">any</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {row.result_state ? (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      row.result_state === 'BROKEN' ? 'bg-red-100 text-red-700' :
                      row.result_state === 'POWERED' ? 'bg-green-100 text-green-700' :
                      row.result_state === 'BURNING' ? 'bg-orange-100 text-orange-700' :
                      row.result_state === 'UNLOCKED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{row.result_state}</span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">none</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {row.output_item ? (
                    <div>
                      <span className="text-xs text-gray-800">{row.output_item}</span>
                      {row.output_item_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {row.output_item_tags.map((t) => (
                            <span key={t} className="bg-purple-50 text-purple-700 text-[10px] px-1 py-0 rounded font-mono">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-[10px]">none</span>
                  )}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  <p className="text-xs text-gray-600 truncate" title={row.description}>{row.description}</p>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    row.source === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>{row.source}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => startEdit(row)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {interactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-400 text-sm">
                  No interactions yet. Add one or run the migration to seed defaults.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
