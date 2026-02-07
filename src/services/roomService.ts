import { supabase } from './supabase';
import type { RoomDef, ItemSpawn, ObjectPlacement, ResolvedItem, ResolvedObject, DoorTarget, Direction, DirectionalSprites } from '../types/game';

/** Default room used when Supabase is unavailable (no items/objects without DB) */
const DEFAULT_ROOM: RoomDef = {
  id: 'default',
  name: 'Main Office',
  width: 25,
  height: 18,
  // 0=floor, 1=wall, 2=carpet, 3=desk (collision)
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  objectPlacements: [],
  itemSpawns: [],
};

/** Parse slim item_spawns from room JSON */
function parseItemSpawns(raw: unknown[]): ItemSpawn[] {
  return raw.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      item_id: o.item_id as string,
      tileX: (o.tileX ?? o.tile_x) as number,
      tileY: (o.tileY ?? o.tile_y) as number,
    };
  });
}

/** Parse slim object_placements from room JSON */
function parseObjectPlacements(raw: unknown[]): ObjectPlacement[] {
  return raw.map((r) => {
    const o = r as Record<string, unknown>;
    const placement: ObjectPlacement = {
      object_id: o.object_id as string,
      tileX: (o.tileX ?? o.tile_x) as number,
      tileY: (o.tileY ?? o.tile_y) as number,
    };
    if (o.direction) {
      placement.direction = o.direction as Direction;
    }
    if (o.door_target) {
      placement.door_target = o.door_target as DoorTarget;
    }
    return placement;
  });
}

/** Fetch items from the catalog and merge with spawn positions */
async function resolveItems(spawns: ItemSpawn[]): Promise<ResolvedItem[]> {
  if (spawns.length === 0) return [];

  const ids = [...new Set(spawns.map((s) => s.item_id))];
  const { data, error } = await supabase
    .from('items')
    .select('id, name, tags, sprite_url')
    .in('id', ids);

  if (error || !data) {
    console.warn('Failed to resolve items from catalog:', error);
    return [];
  }

  const catalog = new Map(data.map((row) => [row.id, row]));

  const resolved: ResolvedItem[] = [];
  for (const spawn of spawns) {
    const entry = catalog.get(spawn.item_id);
    if (!entry) {
      console.warn(`Item ${spawn.item_id} not found in catalog, skipping`);
      continue;
    }
    resolved.push({
      id: crypto.randomUUID(),
      item_id: spawn.item_id,
      name: entry.name as string,
      tags: entry.tags as string[],
      spriteUrl: (entry.sprite_url as string) || undefined,
      tileX: spawn.tileX,
      tileY: spawn.tileY,
    });
  }
  return resolved;
}

/** Fetch objects from the catalog and merge with placement positions + instance states */
async function resolveObjects(placements: ObjectPlacement[]): Promise<ResolvedObject[]> {
  if (placements.length === 0) return [];

  const ids = [...new Set(placements.map((p) => p.object_id))];
  const { data, error } = await supabase
    .from('objects')
    .select('id, name, tags, state, sprite_url, scale, directional_sprites')
    .in('id', ids);

  if (error || !data) {
    console.warn('Failed to resolve objects from catalog:', error);
    return [];
  }

  const catalog = new Map(data.map((row) => [row.id, row]));

  const resolved: ResolvedObject[] = [];
  for (const placement of placements) {
    const entry = catalog.get(placement.object_id);
    if (!entry) {
      console.warn(`Object ${placement.object_id} not found in catalog, skipping`);
      continue;
    }
    const direction: Direction = placement.direction ?? 'down';
    const dirSprites = (entry.directional_sprites as DirectionalSprites) ?? {};
    const effectiveSpriteUrl = dirSprites[direction] || (entry.sprite_url as string) || undefined;

    resolved.push({
      id: crypto.randomUUID(),
      object_id: placement.object_id,
      name: entry.name as string,
      tags: entry.tags as string[],
      states: [entry.state as string],
      spriteUrl: effectiveSpriteUrl,
      directionalSprites: dirSprites,
      direction,
      scale: (entry.scale as number) ?? 1.0,
      tileX: placement.tileX,
      tileY: placement.tileY,
      door_target: placement.door_target,
    });
  }
  return resolved;
}

/** Fetch a room from Supabase by ID, name, or the active room. Falls back to DEFAULT_ROOM on failure. */
export async function fetchRoom(opts?: { id?: string; name?: string }): Promise<RoomDef> {
  try {
    let query = supabase.from('rooms').select('*');

    if (opts?.id) {
      query = query.eq('id', opts.id);
    } else if (opts?.name) {
      query = query.eq('name', opts.name);
    } else {
      // No filter: prefer the active room, fall back to first available
      query = query.order('is_active', { ascending: false });
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      console.warn(`Room not found in Supabase (${JSON.stringify(opts)}), using default`);
      return DEFAULT_ROOM;
    }

    const rawItems = (data.item_spawns ?? []) as unknown[];
    const rawObjects = (data.object_placements ?? []) as unknown[];
    console.log(`Room "${data.name}": ${rawItems.length} item spawns, ${rawObjects.length} object placements`);

    const itemSpawns = parseItemSpawns(rawItems);
    const objectPlacements = parseObjectPlacements(rawObjects);

    const [resolvedItems, resolvedObjects] = await Promise.all([
      resolveItems(itemSpawns),
      resolveObjects(objectPlacements),
    ]);

    return {
      id: data.id as string,
      name: data.name as string,
      width: data.width as number,
      height: data.height as number,
      tileMap: data.tile_map as number[][],
      objectPlacements: resolvedObjects,
      itemSpawns: resolvedItems,
    };
  } catch (err) {
    console.error('Room loading failed, using default:', err);
    return DEFAULT_ROOM;
  }
}
