import { supabase } from './supabase';
import { useGameStore } from '../stores/gameStore';
import { soundService } from './soundService';
import type { InventoryItem } from '../types/game';

const VEND_COST = 5;
const MAX_INVENTORY = 5;

interface VendResult {
  success: boolean;
  description: string;
}

export async function vendRandomItem(): Promise<VendResult> {
  const store = useGameStore.getState();

  if (store.bucks < VEND_COST) {
    soundService.playSfx('error');
    return {
      success: false,
      description: `Not enough BUCKS. Need ${VEND_COST}, you have ${store.bucks}.`,
    };
  }

  if (store.inventory.length >= MAX_INVENTORY) {
    soundService.playSfx('error');
    return {
      success: false,
      description: 'Inventory full. Drop something first.',
    };
  }

  const { data, error } = await supabase
    .from('items')
    .select('id, name, tags, sprite_url');

  if (error || !data || data.length === 0) {
    soundService.playSfx('error');
    return {
      success: false,
      description: 'The machine whirs... but nothing comes out.',
    };
  }

  const randomRow = data[Math.floor(Math.random() * data.length)];

  store.addBucks(-VEND_COST);

  const newItem: InventoryItem = {
    id: crypto.randomUUID(),
    item_id: randomRow.id,
    name: randomRow.name,
    tags: randomRow.tags ?? [],
    spriteUrl: randomRow.sprite_url ?? undefined,
  };

  store.addItem(newItem);
  soundService.playSfx('pickup');

  return {
    success: true,
    description: `Ka-chunk! You got: ${randomRow.name}. (-${VEND_COST} BUCKS)`,
  };
}
