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
        [objectId]: { ...{ tags: [] }, ...s.objectStates[objectId], states },
      },
    })),

  interactionTarget: null,
  setInteractionTarget: (target) => set({ interactionTarget: target }),

  interactionMenuOpen: false,
  openInteractionMenu: () => set({ interactionMenuOpen: true }),
  closeInteractionMenu: () => set({ interactionMenuOpen: false, pendingInteraction: null }),
  pendingInteraction: null,
  setPendingInteraction: (interaction) => set({ pendingInteraction: interaction }),

  pendingDrop: null,
  dropItem: (index) =>
    set((s) => {
      const item = s.inventory[index];
      if (!item) return s;
      return {
        inventory: s.inventory.filter((_, i) => i !== index),
        pendingDrop: item,
      };
    }),
  clearPendingDrop: () => set({ pendingDrop: null }),
}));
