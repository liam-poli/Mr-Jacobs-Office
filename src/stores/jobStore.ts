import { create } from 'zustand';
import type { JobState, Job } from '../types/job';
import type { JacobsEvent } from '../types/jacobs';

export const PHASE_DURATION = 120; // 2 minutes in seconds
const GAME_START_TIME = 540; // 9:00 AM in minutes since midnight
const GAME_MINUTES_PER_TICK = 1 / 60; // 1 real second = 1 game second (real-time clock)

export const useJobStore = create<JobState>((set) => ({
  phaseNumber: 0,
  phaseStatus: 'IDLE',
  phaseTimeRemaining: PHASE_DURATION,
  gameTimeMinutes: GAME_START_TIME,

  currentJob: null,

  phaseEvents: [],
  logPhaseEvent: (event: JacobsEvent) =>
    set((s) => ({ phaseEvents: [...s.phaseEvents, event] })),
  clearPhaseEvents: () => set({ phaseEvents: [] }),

  reviewInProgress: false,
  setReviewInProgress: (inProgress) => set({ reviewInProgress: inProgress }),

  startPhase: (job: Job) =>
    set((s) => ({
      phaseNumber: s.phaseNumber + 1,
      phaseStatus: 'WORKING',
      phaseTimeRemaining: PHASE_DURATION,
      currentJob: job,
      phaseEvents: [],
      reviewInProgress: false,
    })),

  tickTimer: () =>
    set((s) => ({
      phaseTimeRemaining: Math.max(0, s.phaseTimeRemaining - 1),
      gameTimeMinutes: s.gameTimeMinutes + GAME_MINUTES_PER_TICK,
    })),

  endPhase: () => set({ phaseStatus: 'REVIEWING' }),

  setPhaseStatus: (status) => set({ phaseStatus: status }),
}));
