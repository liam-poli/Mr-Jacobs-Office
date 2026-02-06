import { supabase } from './supabase';
import type { RoomDef } from '../types/game';

/** Default room used when Supabase is unavailable */
const DEFAULT_ROOM: RoomDef = {
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
  objectPlacements: [
    { id: 'coffee-maker-1', name: 'Coffee Maker', tags: ['METALLIC', 'ELECTRONIC', 'CONDUCTIVE'], states: ['POWERED'], textureKey: 'obj-coffee-maker', tileX: 3, tileY: 2 },
    { id: 'filing-cabinet-1', name: 'Filing Cabinet', tags: ['METALLIC', 'HEAVY'], states: ['LOCKED'], textureKey: 'obj-filing-cabinet', tileX: 21, tileY: 2 },
    { id: 'door-1', name: 'Door', tags: ['METALLIC', 'ELECTRONIC'], states: ['LOCKED'], textureKey: 'obj-door', tileX: 12, tileY: 1 },
    { id: 'terminal-1', name: 'Terminal', tags: ['ELECTRONIC'], states: ['POWERED'], textureKey: 'obj-terminal', tileX: 10, tileY: 9 },
    { id: 'vending-machine-1', name: 'Vending Machine', tags: ['ELECTRONIC', 'HEAVY'], states: ['POWERED'], textureKey: 'obj-vending-machine', tileX: 23, tileY: 9 },
    { id: 'plant-1', name: 'Office Plant', tags: ['ORGANIC', 'FRAGILE'], states: ['UNLOCKED'], textureKey: 'obj-plant', tileX: 1, tileY: 1 },
    { id: 'plant-2', name: 'Office Plant', tags: ['ORGANIC', 'FRAGILE'], states: ['UNLOCKED'], textureKey: 'obj-plant', tileX: 23, tileY: 1 },
    { id: 'plant-3', name: 'Office Plant', tags: ['ORGANIC', 'FRAGILE'], states: ['UNLOCKED'], textureKey: 'obj-plant', tileX: 1, tileY: 16 },
    { id: 'plant-4', name: 'Office Plant', tags: ['ORGANIC', 'FRAGILE'], states: ['UNLOCKED'], textureKey: 'obj-plant', tileX: 23, tileY: 16 },
    { id: 'jacobs-screen-1', name: "Jacobs' Screen", tags: ['ELECTRONIC', 'CONDUCTIVE'], states: ['POWERED'], textureKey: 'obj-jacobs-screen', tileX: 19, tileY: 1 },
  ],
  itemSpawns: [
    { id: 'item-1', name: 'Coffee Mug', tags: ['WET', 'FRAGILE'], textureKey: 'item-coffee-mug', tileX: 5, tileY: 3 },
    { id: 'item-2', name: 'Wrench', tags: ['METALLIC', 'HEAVY'], textureKey: 'item-wrench', tileX: 8, tileY: 12 },
    { id: 'item-3', name: 'Bucket', tags: ['WET', 'HEAVY'], textureKey: 'item-bucket', tileX: 18, tileY: 8 },
    { id: 'item-4', name: 'Matches', tags: ['HOT'], textureKey: 'item-matches', tileX: 15, tileY: 14 },
  ],
};

/** Converts Supabase snake_case JSON to camelCase RoomDef */
function parseRoom(row: Record<string, unknown>): RoomDef {
  return {
    name: row.name as string,
    width: row.width as number,
    height: row.height as number,
    tileMap: row.tile_map as number[][],
    objectPlacements: (row.object_placements as Array<Record<string, unknown>>).map((o) => ({
      id: o.id as string,
      name: o.name as string,
      tags: o.tags as string[],
      states: o.states as string[],
      textureKey: (o.textureKey ?? o.texture_key) as string,
      tileX: (o.tileX ?? o.tile_x) as number,
      tileY: (o.tileY ?? o.tile_y) as number,
    })),
    itemSpawns: (row.item_spawns as Array<Record<string, unknown>>).map((i) => ({
      id: i.id as string,
      name: i.name as string,
      tags: i.tags as string[],
      textureKey: (i.textureKey ?? i.texture_key) as string,
      tileX: (i.tileX ?? i.tile_x) as number,
      tileY: (i.tileY ?? i.tile_y) as number,
      imageUrl: (i.imageUrl ?? i.image_url) as string | undefined,
    })),
  };
}

/** Fetch a room from Supabase by name. Falls back to DEFAULT_ROOM on failure. */
export async function fetchRoom(name: string): Promise<RoomDef> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('name', name)
      .single();

    if (error || !data) {
      console.warn(`Room "${name}" not found in Supabase, using default`);
      return DEFAULT_ROOM;
    }

    return parseRoom(data);
  } catch {
    console.warn('Supabase unavailable, using default room');
    return DEFAULT_ROOM;
  }
}
