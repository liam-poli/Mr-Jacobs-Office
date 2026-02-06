/** Cardinal directions for player facing */
export type Direction = 'down' | 'up' | 'left' | 'right';

/** Portable resource with Tags. Consumed on use. */
export interface InventoryItem {
  id: string;
  name: string;
  tags: string[];
  textureKey: string;
  imageUrl?: string;
}

/** Mutable world object state. Tags are permanent, states are mutable. */
export interface ObjectState {
  tags: string[];
  states: string[];
}

/** An interactive object placed in a room */
export interface ObjectPlacement {
  id: string;
  name: string;
  tags: string[];
  states: string[];
  textureKey: string;
  tileX: number;
  tileY: number;
}

/** An item spawned on the floor in a room */
export interface ItemSpawn {
  id: string;
  name: string;
  tags: string[];
  textureKey: string;
  tileX: number;
  tileY: number;
  imageUrl?: string;
}

/** Full room definition — loaded from Supabase or fallback */
export interface RoomDef {
  name: string;
  width: number;
  height: number;
  tileMap: number[][];
  objectPlacements: ObjectPlacement[];
  itemSpawns: ItemSpawn[];
}

/** What the player is currently close enough to interact with */
export interface InteractionTarget {
  type: 'item' | 'object';
  id: string;
  name: string;
}

/** Complete game state interface for the Zustand store. */
export interface GameState {
  // Scene lifecycle
  sceneReady: string | null;
  setSceneReady: (scene: string) => void;

  // Player economy
  bucks: number;
  addBucks: (amount: number) => void;

  // Player states (e.g., [CAFFEINATED], [SUSPICIOUS])
  playerStates: string[];
  setPlayerStates: (states: string[]) => void;

  // Inventory (3-4 slots)
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;

  // World objects
  objectStates: Record<string, ObjectState>;
  updateObjectState: (objectId: string, states: string[]) => void;

  // Interaction
  interactionTarget: InteractionTarget | null;
  setInteractionTarget: (target: InteractionTarget | null) => void;

  // Interaction menu (opens when pressing E on an object)
  interactionMenuOpen: boolean;
  openInteractionMenu: () => void;
  closeInteractionMenu: () => void;
  pendingInteraction: { targetId: string; itemId: string | null } | null;
  setPendingInteraction: (interaction: { targetId: string; itemId: string | null } | null) => void;

  // Drop item back into world (React → Phaser bridge)
  pendingDrop: InventoryItem | null;
  dropItem: (index: number) => void;
  clearPendingDrop: () => void;
}
