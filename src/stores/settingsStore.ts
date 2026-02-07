import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  menuOpen: boolean;
  helpOpen: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleMenu: () => void;
  setMenuOpen: (open: boolean) => void;
  toggleHelp: () => void;
  setHelpOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: true,
      menuOpen: false,
      helpOpen: false,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
      setMenuOpen: (open) => set({ menuOpen: open }),
      toggleHelp: () => set((s) => ({ helpOpen: !s.helpOpen })),
      setHelpOpen: (open) => set({ helpOpen: open }),
    }),
    {
      name: 'jacobs-settings',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
      }),
    },
  ),
);
