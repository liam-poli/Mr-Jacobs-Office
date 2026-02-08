import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase';

/* ─── Interfaces ─────────────────────────────────────────── */

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
  is_active: boolean;
}

interface CatalogItem {
  id: string;
  name: string;
  tags: string[];
  sprite_url: string | null;
}

interface CatalogObject {
  id: string;
  name: string;
  tags: string[];
  state: string;
  sprite_url: string | null;
}

interface DoorTargetData {
  room_id: string;
  spawnX: number;
  spawnY: number;
}

interface ObjPlacement {
  object_id: string;
  tileX: number;
  tileY: number;
  direction?: string;
  door_target?: DoorTargetData;
}

interface ItemSpawnPlacement {
  item_id: string;
  tileX: number;
  tileY: number;
}

/* ─── Constants ──────────────────────────────────────────── */

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

type EditorMode = 'tiles' | 'objects' | 'items';

/* ─── Visual Room Editor ─────────────────────────────────── */

function RoomEditor({
  room,
  allRooms,
  onSave,
  onClose,
}: {
  room: Room;
  allRooms: Room[];
  onSave: (tileMap: number[][], objectPlacements: ObjPlacement[], itemSpawns: ItemSpawnPlacement[]) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tile state
  const [tiles, setTiles] = useState<number[][]>(() =>
    room.tile_map.map((row) => [...row]),
  );
  const [brush, setBrush] = useState(0);
  const painting = useRef(false);

  // Placement state
  const [objPlacements, setObjPlacements] = useState<ObjPlacement[]>(() =>
    (room.object_placements as unknown as ObjPlacement[]).map((p) => ({ ...p })),
  );
  const [itemSpawns, setItemSpawns] = useState<ItemSpawnPlacement[]>(() =>
    (room.item_spawns as unknown as ItemSpawnPlacement[]).map((p) => ({ ...p })),
  );

  // Mode & selection
  const [mode, setMode] = useState<EditorMode>('tiles');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Catalog data
  const [catalogObjects, setCatalogObjects] = useState<CatalogObject[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  // Fetch catalogs on mount
  useEffect(() => {
    (async () => {
      const [objRes, itemRes] = await Promise.all([
        supabase.from('objects').select('id, name, tags, state, sprite_url').order('name'),
        supabase.from('items').select('id, name, tags, sprite_url').order('name'),
      ]);
      setCatalogObjects((objRes.data ?? []) as CatalogObject[]);
      setCatalogItems((itemRes.data ?? []) as CatalogItem[]);
    })();
  }, []);

  // Build lookup maps for drawing labels
  const objMap = new Map(catalogObjects.map((o) => [o.id, o]));
  const itemMap = new Map(catalogItems.map((i) => [i.id, i]));

  /* ─── Canvas Drawing ─────────────────────────────────── */

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

    // Object placements (red circles with label + direction arrow)
    for (const o of objPlacements) {
      const cx = o.tileX * EDITOR_PX + EDITOR_PX / 2;
      const cy = o.tileY * EDITOR_PX + EDITOR_PX / 2;
      const r = EDITOR_PX / 3;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // White letter
      const entry = objMap.get(o.object_id);
      if (entry) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(EDITOR_PX * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entry.name[0], cx, cy + 1);
      }
      // Direction arrow (small yellow triangle)
      const dir = o.direction ?? 'down';
      const as = 3;
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      if (dir === 'down')  { ctx.moveTo(cx, cy + r + 2); ctx.lineTo(cx - as, cy + r - 1); ctx.lineTo(cx + as, cy + r - 1); }
      if (dir === 'up')    { ctx.moveTo(cx, cy - r - 2); ctx.lineTo(cx - as, cy - r + 1); ctx.lineTo(cx + as, cy - r + 1); }
      if (dir === 'left')  { ctx.moveTo(cx - r - 2, cy); ctx.lineTo(cx - r + 1, cy - as); ctx.lineTo(cx - r + 1, cy + as); }
      if (dir === 'right') { ctx.moveTo(cx + r + 2, cy); ctx.lineTo(cx + r - 1, cy - as); ctx.lineTo(cx + r - 1, cy + as); }
      ctx.fill();
    }

    // Item spawns (yellow circles with label)
    for (const i of itemSpawns) {
      const cx = i.tileX * EDITOR_PX + EDITOR_PX / 2;
      const cy = i.tileY * EDITOR_PX + EDITOR_PX / 2;
      const r = EDITOR_PX / 3;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // White letter
      const entry = itemMap.get(i.item_id);
      if (entry) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(EDITOR_PX * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entry.name[0], cx, cy + 1);
      }
    }
  }, [tiles, objPlacements, itemSpawns, room, objMap, itemMap]);

  useEffect(() => { draw(); }, [draw]);

  /* ─── Mouse Handling ─────────────────────────────────── */

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

  function paintTile(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = tileAt(e);
    if (!pos) return;
    setTiles((prev) => {
      if (prev[pos.row][pos.col] === brush) return prev;
      const next = prev.map((r) => [...r]);
      next[pos.row][pos.col] = brush;
      return next;
    });
  }

  function placeObject(col: number, row: number) {
    if (!selectedObjectId) return;
    setObjPlacements((prev) => {
      const filtered = prev.filter((p) => !(p.tileX === col && p.tileY === row));
      return [...filtered, {
        object_id: selectedObjectId,
        tileX: col,
        tileY: row,
        direction: 'down',
      }];
    });
  }

  function removeObject(col: number, row: number) {
    setObjPlacements((prev) => prev.filter((p) => !(p.tileX === col && p.tileY === row)));
  }

  function placeItem(col: number, row: number) {
    if (!selectedItemId) return;
    setItemSpawns((prev) => {
      const filtered = prev.filter((p) => !(p.tileX === col && p.tileY === row));
      return [...filtered, { item_id: selectedItemId, tileX: col, tileY: row }];
    });
  }

  function removeItem(col: number, row: number) {
    setItemSpawns((prev) => prev.filter((p) => !(p.tileX === col && p.tileY === row)));
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode === 'tiles') {
      painting.current = true;
      paintTile(e);
      return;
    }
    const pos = tileAt(e);
    if (!pos) return;
    if (e.button === 2 || e.altKey) {
      // Right-click or Option+click → remove
      if (mode === 'objects') removeObject(pos.col, pos.row);
      else removeItem(pos.col, pos.row);
    } else {
      // Left-click → place
      if (mode === 'objects') placeObject(pos.col, pos.row);
      else placeItem(pos.col, pos.row);
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode === 'tiles' && painting.current) paintTile(e);
  }

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-hud-panel rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border">
          <h3 className="text-hud-text text-sm font-mono">
            Room Editor — {room.name} ({room.width}x{room.height})
          </h3>
          <button onClick={onClose} className="text-hud-dim hover:text-hud-text text-lg">&times;</button>
        </div>

        {/* Mode selector + context toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-hud-border">
          {/* Mode tabs */}
          {(['tiles', 'objects', 'items'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-hud-accent text-hud-bg'
                  : 'text-hud-dim hover:bg-hud-bg'
              }`}
            >
              {m === 'tiles' ? 'Tiles' : m === 'objects' ? 'Objects' : 'Items'}
            </button>
          ))}

          <div className="w-px h-5 bg-hud-border mx-1" />

          {/* Tiles mode: brush palette */}
          {mode === 'tiles' && (
            <>
              <span className="text-xs text-hud-dim">Brush:</span>
              {Object.entries(TILE_COLORS).map(([type, color]) => {
                const t = Number(type);
                return (
                  <button
                    key={t}
                    onClick={() => setBrush(t)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors ${
                      brush === t
                        ? 'ring-2 ring-hud-accent bg-hud-bg text-hud-accent'
                        : 'text-hud-text hover:bg-hud-bg'
                    }`}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-sm border border-hud-border"
                      style={{ backgroundColor: color }}
                    />
                    {TILE_LABELS[t]}
                  </button>
                );
              })}
              <span className="ml-auto text-[10px] text-hud-dim">Click or drag to paint</span>
            </>
          )}

          {/* Objects/Items mode: hint */}
          {mode !== 'tiles' && (
            <span className="ml-auto text-[10px] text-hud-dim">
              Left-click to place &middot; Option+click or right-click to remove
            </span>
          )}
        </div>

        {/* Body: sidebar (objects/items) + canvas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Catalog sidebar */}
          {mode !== 'tiles' && (
            <div className="w-48 border-r border-hud-border bg-hud-bg overflow-y-auto p-2 shrink-0">
              <p className="text-[10px] text-hud-dim font-medium uppercase tracking-wide mb-1 px-1">
                {mode === 'objects' ? 'Objects' : 'Items'} catalog
              </p>
              {mode === 'objects' && catalogObjects.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObjectId(obj.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 transition-colors ${
                    selectedObjectId === obj.id
                      ? 'bg-red-900/30 text-red-300 ring-1 ring-red-500/50'
                      : 'text-hud-dim hover:bg-hud-panel'
                  }`}
                >
                  <span className="font-medium">{obj.name}</span>
                  <span className="block text-[10px] text-hud-dim mt-0.5">
                    {obj.tags.join(', ') || 'no tags'} &middot; {obj.state}
                  </span>
                </button>
              ))}
              {mode === 'items' && catalogItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 transition-colors ${
                    selectedItemId === item.id
                      ? 'bg-amber-900/30 text-amber-300 ring-1 ring-amber-500/50'
                      : 'text-hud-dim hover:bg-hud-panel'
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="block text-[10px] text-hud-dim mt-0.5">
                    {item.tags.join(', ') || 'no tags'}
                  </span>
                </button>
              ))}
              {mode === 'objects' && catalogObjects.length === 0 && (
                <p className="text-[10px] text-hud-dim px-1">No objects in DB. Add them in the Objects tab.</p>
              )}
              {mode === 'items' && catalogItems.length === 0 && (
                <p className="text-[10px] text-hud-dim px-1">No items in DB. Add them in the Items tab.</p>
              )}
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-4">
            <canvas
              ref={canvasRef}
              className="border border-hud-border rounded cursor-crosshair"
              style={{
                width: room.width * EDITOR_PX,
                height: room.height * EDITOR_PX,
                imageRendering: 'pixelated',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={() => { painting.current = false; }}
              onMouseLeave={() => { painting.current = false; }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        {/* Door Links (shown in objects mode when there are door objects) */}
        {mode === 'objects' && (() => {
          const doorPlacements = objPlacements.filter((p) => {
            const entry = objMap.get(p.object_id);
            return entry?.name.toLowerCase().includes('door');
          });
          if (doorPlacements.length === 0) return null;
          const otherRooms = allRooms.filter((r) => r.id !== room.id);
          return (
            <div className="border-t border-hud-border px-4 py-3">
              <p className="text-[10px] text-hud-dim font-medium uppercase tracking-wide mb-2">Door Links</p>
              <div className="flex flex-col gap-2">
                {doorPlacements.map((dp, idx) => {
                  const entry = objMap.get(dp.object_id);
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="text-hud-dim font-medium w-32 shrink-0">
                        {entry?.name ?? 'Door'} ({dp.tileX},{dp.tileY})
                      </span>
                      <select
                        className="admin-input bg-hud-bg border border-hud-border text-hud-dim rounded px-2 py-1 text-xs flex-1"
                        value={dp.door_target?.room_id ?? ''}
                        onChange={(e) => {
                          const roomId = e.target.value || undefined;
                          setObjPlacements((prev) =>
                            prev.map((p) =>
                              p === dp
                                ? { ...p, door_target: roomId ? { room_id: roomId, spawnX: dp.door_target?.spawnX ?? 5, spawnY: dp.door_target?.spawnY ?? 5 } : undefined }
                                : p
                            )
                          );
                        }}
                      >
                        <option value="">No link</option>
                        {otherRooms.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {dp.door_target && (
                        <>
                          <label className="text-hud-dim">X:</label>
                          <input
                            type="number"
                            className="admin-input w-14 bg-hud-bg border border-hud-border text-hud-dim rounded px-2 py-1 text-xs"
                            value={dp.door_target.spawnX}
                            min={0}
                            onChange={(e) => {
                              const val = +e.target.value;
                              setObjPlacements((prev) =>
                                prev.map((p) =>
                                  p === dp && p.door_target
                                    ? { ...p, door_target: { ...p.door_target!, spawnX: val } }
                                    : p
                                )
                              );
                            }}
                          />
                          <label className="text-hud-dim">Y:</label>
                          <input
                            type="number"
                            className="admin-input w-14 bg-hud-bg border border-hud-border text-hud-dim rounded px-2 py-1 text-xs"
                            value={dp.door_target.spawnY}
                            min={0}
                            onChange={(e) => {
                              const val = +e.target.value;
                              setObjPlacements((prev) =>
                                prev.map((p) =>
                                  p === dp && p.door_target
                                    ? { ...p, door_target: { ...p.door_target!, spawnY: val } }
                                    : p
                                )
                              );
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Object Directions (shown in objects mode when there are placements) */}
        {mode === 'objects' && objPlacements.length > 0 && (
          <div className="border-t border-hud-border px-4 py-3">
            <p className="text-[10px] text-hud-dim font-medium uppercase tracking-wide mb-2">Object Directions</p>
            <div className="flex flex-wrap gap-2">
              {objPlacements.map((op, idx) => {
                const entry = objMap.get(op.object_id);
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-xs bg-hud-bg rounded px-2 py-1">
                    <span className="text-hud-dim font-medium">
                      {entry?.name ?? '?'} ({op.tileX},{op.tileY})
                    </span>
                    <select
                      className="admin-input bg-hud-bg border border-hud-border text-hud-dim rounded px-1 py-0.5 text-[10px]"
                      value={op.direction ?? 'down'}
                      onChange={(e) => {
                        const dir = e.target.value;
                        setObjPlacements((prev) =>
                          prev.map((p, i) => i === idx ? { ...p, direction: dir } : p)
                        );
                      }}
                    >
                      <option value="down">Down</option>
                      <option value="up">Up</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-hud-border">
          <div className="flex gap-3 text-[10px] text-hud-dim">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              {objPlacements.length} objects
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              {itemSpawns.length} items
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-hud-dim hover:text-hud-text">Cancel</button>
            <button
              onClick={() => onSave(tiles, objPlacements, itemSpawns)}
              className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
              style={{ fontFamily: 'var(--font-hud)' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Room Preview ───────────────────────────────────────── */

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

    // Draw tile map
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
      className="border border-hud-border rounded shrink-0"
      style={{ width: room.width * PX * 2, height: room.height * PX * 2, imageRendering: 'pixelated' }}
    />
  );
}

/* ─── Rooms Tab ──────────────────────────────────────────── */

export function RoomsTab() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonField, setJsonField] = useState<'object_placements' | 'item_spawns' | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [editRoom, setEditRoom] = useState<Room | null>(null);
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

  async function setActiveRoom(id: string) {
    // Deactivate all, then activate the selected one
    await supabase.from('rooms').update({ is_active: false }).neq('id', id);
    await supabase.from('rooms').update({ is_active: true }).eq('id', id);
    fetchRooms();
  }

  async function handleDelete(id: string) {
    await supabase.from('rooms').delete().eq('id', id);
    fetchRooms();
  }

  async function renameRoom(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await supabase.from('rooms').update({ name: trimmed }).eq('id', id);
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

  async function saveRoom(tileMap: number[][], objectPlacements: ObjPlacement[], itemSpawns: ItemSpawnPlacement[]) {
    if (!editRoom) return;
    await supabase.from('rooms').update({
      tile_map: tileMap,
      object_placements: objectPlacements,
      item_spawns: itemSpawns,
    }).eq('id', editRoom.id);
    setEditRoom(null);
    fetchRooms();
  }

  if (loading) return <p className="text-hud-dim text-sm font-mono">LOADING...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-hud-accent text-sm tracking-widest" style={{ fontFamily: 'var(--font-hud)' }}>ROOMS ({rooms.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-hud)' }}
        >
          {showForm ? 'CANCEL' : '+ ADD ROOM'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddRoom} className="bg-hud-panel rounded-lg border border-hud-border p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Break Room"
              className="admin-input w-full px-3 py-2 rounded text-sm"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">Width</label>
            <input
              type="number"
              value={form.width}
              onChange={(e) => setForm({ ...form, width: +e.target.value })}
              className="admin-input w-full px-3 py-2 rounded text-sm"
              min={5} max={50}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-mono text-hud-dim mb-1 uppercase">Height</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: +e.target.value })}
              className="admin-input w-full px-3 py-2 rounded text-sm"
              min={5} max={50}
            />
          </div>
          <button
            type="submit"
            className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
            style={{ fontFamily: 'var(--font-hud)' }}
          >
            CREATE
          </button>
        </form>
      )}

      {/* Visual room editor */}
      {editRoom && (
        <RoomEditor
          room={editRoom}
          allRooms={rooms}
          onSave={saveRoom}
          onClose={() => setEditRoom(null)}
        />
      )}

      {/* JSON editor modal */}
      {editingId && jsonField && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-hud-panel rounded-lg shadow-xl w-[640px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border">
              <h3 className="text-hud-text text-sm font-mono">
                Edit {jsonField.replace(/_/g, ' ')}
              </h3>
              <button onClick={() => { setEditingId(null); setJsonField(null); }} className="text-hud-dim hover:text-hud-text text-lg">&times;</button>
            </div>
            <textarea
              value={jsonValue}
              onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }}
              className="flex-1 p-4 bg-hud-bg text-hud-accent font-mono text-xs border-none outline-none resize-none min-h-[300px]"
              spellCheck={false}
            />
            {jsonError && <p className="text-hud-danger text-xs px-4 pb-2">{jsonError}</p>}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-hud-border">
              <button onClick={() => { setEditingId(null); setJsonField(null); }} className="px-4 py-2 text-sm text-hud-dim hover:text-hud-text">Cancel</button>
              <button
                onClick={saveJson}
                className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all"
                style={{ fontFamily: 'var(--font-hud)' }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-hud-dim mb-3">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Objects</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Items</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rooms.map((room) => (
          <div key={room.id} className={`bg-hud-panel rounded border p-3 flex flex-col ${room.is_active ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-hud-border'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <input
                    className="text-hud-text text-sm bg-transparent border-b border-transparent hover:border-hud-border focus:border-hud-accent focus:outline-none font-mono"
                    defaultValue={room.name}
                    onBlur={(e) => { if (e.target.value !== room.name) renameRoom(room.id, e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                  {room.is_active && <span className="text-[9px] font-semibold text-green-400 bg-green-900/40 px-1.5 py-0.5 rounded font-mono">ACTIVE</span>}
                </div>
                <p className="text-[10px] text-hud-dim">{room.width} x {room.height} tiles</p>
              </div>
              <button onClick={() => handleDelete(room.id)} className="text-hud-danger text-[10px] font-mono hover:brightness-125">DELETE</button>
            </div>
            <div className="flex justify-center mb-2">
              <RoomPreview room={room} />
            </div>
            <div className="mt-auto flex flex-col gap-1.5 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditRoom(room)}
                  className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all cursor-pointer"
                  style={{ fontFamily: 'var(--font-hud)' }}
                >
                  EDIT ROOM
                </button>
                {!room.is_active && (
                  <button
                    onClick={() => setActiveRoom(room.id)}
                    className="bg-hud-accent text-hud-bg px-4 py-2 rounded-md tracking-wider font-bold text-xs uppercase hover:brightness-110 transition-all cursor-pointer"
                    style={{ fontFamily: 'var(--font-hud)' }}
                  >
                    SET ACTIVE
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-hud-dim">
                <span>{room.object_placements.length} objects &middot; {room.item_spawns.length} items</span>
                <span>&middot;</span>
                <button onClick={() => startEditJson(room, 'object_placements')} className="hover:text-hud-accent underline cursor-pointer">objects json</button>
                <button onClick={() => startEditJson(room, 'item_spawns')} className="hover:text-hud-accent underline cursor-pointer">items json</button>
              </div>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-hud-dim text-sm">No rooms yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
