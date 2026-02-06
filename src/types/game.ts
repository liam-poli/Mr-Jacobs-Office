/** Portable resource with Tags. Consumed on use. */
export interface InventoryItem {
  id: string;
  name: string;
  tags: string[];
  textureKey: string;
}

/** Mutable world object state. Tags are permanent, states are mutable. */
export interface ObjectState {
  tags: string[];
  states: string[];
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
}
