import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase';

interface Placement {
  tileX: number;
  tileY: number;
  [key: string]: unknown;
}

interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  tile_map: number[][];
  object_placements: Placement[];
  item_spawns: Placement[];
}

const TILE_COLORS: Record<number, string> = {
  0: '#B8D4C8', // floor
  1: '#D4CAB8', // wall
  2: '#5C6B7A', // carpet
  3: '#6B5040', // desk
};

const TILE_LABELS: Record<number, string> = {
  0: 'Floor',
  1: 'Wall',
  2: 'Carpet',
  3: 'Desk',
};

const EDITOR_PX = 24; // pixels per tile in editor
const GRID_COLOR = '#00000020';

/* ─── Visual Tile Map Editor ──────────────────────────────── */

function TileMapEditor({
  room,
  onSave,
  onClose,
}: {
  room: Room;
  onSave: (tileMap: number[][]) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiles, setTiles] = useState<number[][]>(() =>
    room.tile_map.map((row) => [...row]),
  );
  const [brush, setBrush] = useState(0);
  const painting = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = room.width * EDITOR_PX;
    const h = room.height * EDITOR_PX;
    canvas.width = w;
    canvas.height = h;

    // Tiles
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        ctx.fillStyle = TILE_COLORS[tiles[row][col]] ?? TILE_COLORS[0];
        ctx.fillRect(col * EDITOR_PX, row * EDITOR_PX, EDITOR_PX, EDITOR_PX);
      }
    }

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let col = 0; col <= room.width; col++) {
      ctx.beginPath();
      ctx.moveTo(col * EDITOR_PX + 0.5, 0);
      ctx.lineTo(col * EDITOR_PX + 0.5, h);
      ctx.stroke();
    }
    for (let row = 0; row <= room.height; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * EDITOR_PX + 0.5);
      ctx.lineTo(w, row * EDITOR_PX + 0.5);
      ctx.stroke();
    }

    // Objects (red dots)
    for (const o of room.object_placements) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        o.tileX * EDITOR_PX + EDITOR_PX / 2,
        o.tileY * EDITOR_PX + EDITOR_PX / 2,
        EDITOR_PX / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Items (yellow dots)
    for (const i of room.item_spawns) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(
        i.tileX * EDITOR_PX + EDITOR_PX / 2,
        i.tileY * EDITOR_PX + EDITOR_PX / 2,
        EDITOR_PX / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }, [tiles, room]);

  useEffect(() => { draw(); }, [draw]);

  function tileAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / EDITOR_PX);
    const row = Math.floor((e.clientY - rect.top) * scaleY / EDITOR_PX);
    if (row < 0 || row >= room.height || col < 0 || col >= room.width) return null;
    return { row, col };
  }

  function paint(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = tileAt(e);
    if (!pos) return;
    setTiles((prev) => {
      if (prev[pos.row][pos.col] === brush) return prev;
      const next = prev.map((r) => [...r]);
      next[pos.row][pos.col] = brush;
      return next;
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">
            Tile Map — {room.name} ({room.width}x{room.height})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        {/* Palette */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
          <span className="text-xs text-gray-500 mr-1">Brush:</span>
          {Object.entries(TILE_COLORS).map(([type, color]) => {
            const t = Number(type);
            return (
              <button
                key={t}
                onClick={() => setBrush(t)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  brush === t
                    ? 'ring-2 ring-blue-500 bg-blue-50 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span
                  className="inline-block w-4 h-4 rounded-sm border border-gray-300"
                  style={{ backgroundColor: color }}
                />
                {TILE_LABELS[t]}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-gray-400">Click or drag to paint</span>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded cursor-crosshair"
            style={{
              width: room.width * EDITOR_PX,
              height: room.height * EDITOR_PX,
              imageRendering: 'pixelated',
            }}
            onMouseDown={(e) => { painting.current = true; paint(e); }}
            onMouseMove={(e) => { if (painting.current) paint(e); }}
            onMouseUp={() => { painting.current = false; }}
            onMouseLeave={() => { painting.current = false; }}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button
            onClick={() => onSave(tiles)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const PX = 4; // pixels per tile in preview

function RoomPreview({ room }: { room: Room }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = room.width * PX;
    const h = room.height * PX;
    canvas.width = w;
    canvas.height = h;

    // Draw tile map (includes desks as tile type 3)
    for (let row = 0; row < room.tile_map.length; row++) {
      for (let col = 0; col < room.tile_map[row].length; col++) {
        ctx.fillStyle = TILE_COLORS[room.tile_map[row][col]] ?? TILE_COLORS[0];
        ctx.fillRect(col * PX, row * PX, PX, PX);
      }
    }

    // Draw objects (red dots)
    for (const o of room.object_placements) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(o.tileX * PX + PX / 2, o.tileY * PX + PX / 2, PX / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw items (yellow dots)
    for (const i of room.item_spawns) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(i.tileX * PX + PX / 2, i.tileY * PX + PX / 2, PX / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [room]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 rounded shrink-0"
      style={{ width: room.width * PX * 2, height: room.height * PX * 2, imageRendering: 'pixelated' }}
    />
  );
}

export function RoomsTab() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonField, setJsonField] = useState<'object_placements' | 'item_spawns' | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [tileEditRoom, setTileEditRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', width: 25, height: 18 });

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').order('name');
    setRooms(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchRooms(); }, []);

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    const tileMap: number[][] = [];
    for (let r = 0; r < form.height; r++) {
      const row: number[] = [];
      for (let c = 0; c < form.width; c++) {
        row.push(r === 0 || r === form.height - 1 || c === 0 || c === form.width - 1 ? 1 : 0);
      }
      tileMap.push(row);
    }

    await supabase.from('rooms').insert({
      name: form.name.trim(),
      width: form.width,
      height: form.height,
      tile_map: tileMap,
      object_placements: [],
      item_spawns: [],
    });
    setForm({ name: '', width: 25, height: 18 });
    setShowForm(false);
    fetchRooms();
  }

  async function handleDelete(id: string) {
    await supabase.from('rooms').delete().eq('id', id);
    fetchRooms();
  }

  function startEditJson(room: Room, field: typeof jsonField) {
    if (!field) return;
    setEditingId(room.id);
    setJsonField(field);
    setJsonValue(JSON.stringify(room[field], null, 2));
    setJsonError('');
  }

  async function saveJson() {
    if (!editingId || !jsonField) return;
    try {
      const parsed = JSON.parse(jsonValue);
      await supabase.from('rooms').update({ [jsonField]: parsed }).eq('id', editingId);
      setEditingId(null);
      setJsonField(null);
      fetchRooms();
    } catch {
      setJsonError('Invalid JSON');
    }
  }

  async function saveTileMap(tileMap: number[][]) {
    if (!tileEditRoom) return;
    await supabase.from('rooms').update({ tile_map: tileMap }).eq('id', tileEditRoom.id);
    setTileEditRoom(null);
    fetchRooms();
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Rooms ({rooms.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Room'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddRoom} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Break Room"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
            <input
              type="number"
              value={form.width}
              onChange={(e) => setForm({ ...form, width: +e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={5} max={50}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: +e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={5} max={50}
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
            Create
          </button>
        </form>
      )}

      {/* Visual tile map editor */}
      {tileEditRoom && (
        <TileMapEditor
          room={tileEditRoom}
          onSave={saveTileMap}
          onClose={() => setTileEditRoom(null)}
        />
      )}

      {/* JSON editor modal */}
      {editingId && jsonField && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[640px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 text-sm">
                Edit {jsonField.replace(/_/g, ' ')}
              </h3>
              <button onClick={() => { setEditingId(null); setJsonField(null); }} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <textarea
              value={jsonValue}
              onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }}
              className="flex-1 p-4 font-mono text-xs border-none outline-none resize-none min-h-[300px]"
              spellCheck={false}
            />
            {jsonError && <p className="text-red-500 text-xs px-4 pb-2">{jsonError}</p>}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button onClick={() => { setEditingId(null); setJsonField(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveJson} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-gray-500 mb-3">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Objects</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Items</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: '#6B5040' }} /> Desks (tile 3)</span>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex gap-4 mb-3">
              <RoomPreview room={room} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <p className="text-xs text-gray-500">{room.width} x {room.height} tiles</p>
                  </div>
                  <button onClick={() => handleDelete(room.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-blue-600">{room.object_placements.length} objects</span>
                  <span className="text-green-600">{room.item_spawns.length} items</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTileEditRoom(room)}
                className="text-left px-3 py-2 rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <span className="block text-xs font-medium text-gray-500">tile map</span>
                <span className="block text-sm text-gray-800">{room.tile_map.length} rows</span>
              </button>
              {(['object_placements', 'item_spawns'] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => startEditJson(room, field)}
                  className="text-left px-3 py-2 rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className="block text-xs font-medium text-gray-500">{field.replace(/_/g, ' ')}</span>
                  <span className="block text-sm text-gray-800">{(room[field] as unknown[]).length} items</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-gray-400 text-sm">No rooms yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
