/**
 * Zustand store template for bridging Phaser <-> React state.
 *
 * Phaser scenes: useGameStore.getState() and useGameStore.subscribe()
 * React components: useGameStore((s) => s.value)
 *
 * Never import React hooks into Phaser code.
 */

import { create } from 'zustand';

interface GameState {
  // Scene status
  sceneReady: string | null;
  setSceneReady: (scene: string) => void;

  // Player
  bucks: number;
  playerStates: string[];
  addBucks: (amount: number) => void;
  setPlayerStates: (states: string[]) => void;

  // Inventory
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;

  // World state
  objectStates: Record<string, ObjectState>;
  updateObjectState: (objectId: string, states: string[]) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  tags: string[];
  textureKey: string;
}

interface ObjectState {
  tags: string[];
  states: string[];
}

export const useGameStore = create<GameState>((set) => ({
  sceneReady: null,
  setSceneReady: (scene) => set({ sceneReady: scene }),

  bucks: 0,
  playerStates: [],
  addBucks: (amount) => set((s) => ({ bucks: s.bucks + amount })),
  setPlayerStates: (states) => set({ playerStates: states }),

  inventory: [],
  addItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),
  removeItem: (itemId) =>
    set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),

  objectStates: {},
  updateObjectState: (objectId, states) =>
    set((s) => ({
      objectStates: {
        ...s.objectStates,
        [objectId]: { ...s.objectStates[objectId], states },
      },
    })),
}));
