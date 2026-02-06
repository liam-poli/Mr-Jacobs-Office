import { create } from 'zustand';
import type { JacobsState, JacobsEvent } from '../types/jacobs';

export const useJacobsStore = create<JacobsState>((set) => ({
  mood: 'NEUTRAL',
  setMood: (mood) => set({ mood }),

  eventLog: [],
  logEvent: (event: JacobsEvent) =>
    set((s) => ({ eventLog: [...s.eventLog, event] })),
  clearEventLog: () => set({ eventLog: [] }),

  currentSpeech: null,
  setSpeech: (speech) => set({ currentSpeech: speech }),

  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),

  objectNameMap: {},
  registerObject: (id, name) =>
    set((s) => ({
      objectNameMap: { ...s.objectNameMap, [name.toLowerCase()]: id },
    })),

  faceDataUrls: {},
  setFaceDataUrl: (mood, dataUrl) =>
    set((s) => ({
      faceDataUrls: { ...s.faceDataUrls, [mood]: dataUrl },
    })),
}));
