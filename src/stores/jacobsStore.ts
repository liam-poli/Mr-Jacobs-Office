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
  speechTitle: null,
  setSpeech: (speech, title) => set({ currentSpeech: speech, speechTitle: title ?? null }),

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

  blinkFaceDataUrls: {},
  setBlinkFaceDataUrl: (mood, dataUrl) =>
    set((s) => ({
      blinkFaceDataUrls: { ...s.blinkFaceDataUrls, [mood]: dataUrl },
    })),
}));
