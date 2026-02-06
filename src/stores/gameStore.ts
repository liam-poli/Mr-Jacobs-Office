import { create } from 'zustand';
import type { GameState } from '../types/game';

export const useGameStore = create<GameState>((set) => ({
  sceneReady: null,
  setSceneReady: (scene) => set({ sceneReady: scene }),

  bucks: 0,
  addBucks: (amount) => set((s) => ({ bucks: s.bucks + amount })),

  playerStates: [],
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
