/** Session lifecycle */
export type SessionStatus = 'PLAYING' | 'WON' | 'LOST';
export type SessionEndType = 'PROMOTED' | 'ESCAPED' | 'FIRED' | 'TIME_UP';

/** Cardinal directions for player facing */
export type Direction = 'down' | 'up' | 'left' | 'right';

/** Optional per-direction sprite URL overrides from the objects catalog */
export interface DirectionalSprites {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}

/** Portable resource with Tags. Consumed on use. */
export interface InventoryItem {
  id: string;
  item_id: string;
  name: string;
  tags: string[];
  spriteUrl?: string;
}

/** Mutable world object state. Tags are permanent, states are mutable. */
export interface ObjectState {
  tags: string[];
  states: string[];
}

/** Slim spawn reference stored in room JSON — just an ID + position */
export interface ItemSpawn {
  item_id: string;
  tileX: number;
  tileY: number;
}

/** Door destination metadata attached to a door object placement */
export interface DoorTarget {
  room_id: string;
  spawnX: number;
  spawnY: number;
}

/** Slim placement reference stored in room JSON — just an ID + position */
export interface ObjectPlacement {
  object_id: string;
  tileX: number;
  tileY: number;
  direction?: Direction;
  door_target?: DoorTarget;
}

/** Item spawn merged with catalog data from the items table */
export interface ResolvedItem {
  id: string;
  item_id: string;
  name: string;
  tags: string[];
  spriteUrl?: string;
  tileX: number;
  tileY: number;
}

/** Object placement merged with catalog data from the objects table */
export interface ResolvedObject {
  id: string;
  object_id: string;
  name: string;
  tags: string[];
  states: string[];
  spriteUrl?: string;
  directionalSprites?: DirectionalSprites;
  direction: Direction;
  scale: number;
  tileX: number;
  tileY: number;
  door_target?: DoorTarget;
}

/** Full room definition — loaded from Supabase or fallback */
export interface RoomDef {
  id: string;
  name: string;
  width: number;
  height: number;
  tileMap: number[][];
  objectPlacements: ResolvedObject[];
  itemSpawns: ResolvedItem[];
}

/** What the player is currently close enough to interact with */
export interface InteractionTarget {
  type: 'item' | 'object';
  id: string;
  name: string;
}

/** Result returned by the interact edge function */
export interface InteractionResult {
  result_state: string | null;
  output_item: string | null;
  output_item_id: string | null;
  output_item_sprite_url: string | null;
  output_item_tags: string[] | null;
  consumes_item: boolean;
  description: string;
  cached: boolean;
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

  // Room tracking
  currentRoomId: string | null;
  setCurrentRoomId: (id: string) => void;

  // World objects
  objectStates: Record<string, ObjectState>;
  updateObjectState: (objectId: string, states: string[]) => void;
  clearObjectStates: () => void;

  // Room state cache (persists object states across room transitions)
  roomStateCache: Record<string, Record<string, ObjectState>>;
  saveRoomStates: (roomId: string) => void;
  restoreRoomStates: (roomId: string) => void;

  // Interaction
  interactionTarget: InteractionTarget | null;
  setInteractionTarget: (target: InteractionTarget | null) => void;

  // Interaction menu (opens when pressing E on an object)
  interactionMenuOpen: boolean;
  openInteractionMenu: () => void;
  closeInteractionMenu: () => void;
  pendingInteraction: { targetId: string; itemId: string | null } | null;
  setPendingInteraction: (interaction: { targetId: string; itemId: string | null } | null) => void;

  // Interaction resolution (edge function call in progress)
  interactionPending: boolean;
  setInteractionPending: (pending: boolean) => void;
  interactionResult: { description: string } | null;
  setInteractionResult: (result: { description: string } | null) => void;

  // Drop item back into world (React → Phaser bridge)
  pendingDrop: InventoryItem | null;
  dropItem: (index: number) => void;
  clearPendingDrop: () => void;

  // Collected item spawns (persists across room changes so items don't respawn)
  collectedSpawns: Set<string>;
  collectSpawn: (key: string) => void;

  // Terminal chat
  terminalChatOpen: boolean;
  openTerminalChat: () => void;
  closeTerminalChat: () => void;

  // Inventory sprite updates (for async-generated sprites)
  updateItemSprite: (itemId: string, spriteUrl: string) => void;

  // Phase transition freeze (title card playing)
  playerFrozen: boolean;
  setPlayerFrozen: (frozen: boolean) => void;

  // Game start gate (waits for IntroBriefing dismiss)
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;

  // Session end
  sessionStatus: SessionStatus;
  sessionEndType: SessionEndType | null;
  sessionEndSpeech: string | null;
  endSession: (type: SessionEndType, speech: string) => void;
}
