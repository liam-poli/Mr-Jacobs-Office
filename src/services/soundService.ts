import { Howl } from 'howler';
import { useSettingsStore } from '../stores/settingsStore';

// ─── Sound Registry ────────────────────────────────────────────────
// Add new sounds here — that's it. TypeScript enforces valid names.

type SfxName = 'pickup' | 'drop' | 'interact' | 'footstep' | 'ui-hover' | 'ui-click' | 'error';
type MusicName = 'ambient-office';
export type MusicLevel = 1 | 2 | 3 | 4;

interface SoundDef {
  src: string[];
  volume?: number;
  loop?: boolean;
  /** Multiple variants — one is picked at random each play. */
  variants?: string[];
}

const SFX_DEFS: Record<SfxName, SoundDef> = {
  pickup: { src: ['/audio/sfx/pickup.mp3'], volume: 0.6 },
  drop: { src: ['/audio/sfx/drop.mp3'], volume: 0.5 },
  interact: { src: ['/audio/sfx/interact.mp3'], volume: 0.7 },
  footstep: {
    src: ['/audio/sfx/footstep-1.mp3'],
    volume: 0.3,
    variants: [
      '/audio/sfx/footstep-1.mp3',
      '/audio/sfx/footstep-2.mp3',
      '/audio/sfx/footstep-3.mp3',
    ],
  },
  'ui-hover': { src: ['/audio/sfx/ui-hover.mp3'], volume: 0.2 },
  'ui-click': { src: ['/audio/sfx/ui-click.mp3'], volume: 0.4 },
  error: { src: ['/audio/sfx/error.mp3'], volume: 0.5 },
};

const MUSIC_DEFS: Record<MusicName, SoundDef> = {
  'ambient-office': { src: ['/audio/music/ambient-office.mp3'], volume: 0.17, loop: true },
};

// ─── Music Level Tracks ───────────────────────────────────────────
// 4 intensity tiers — drop mp3 files at these paths when ready.

const MUSIC_LEVEL_DEFS: Record<MusicLevel, SoundDef> = {
  1: { src: ['/audio/music/level-1.mp3'], volume: 0.17, loop: true },
  2: { src: ['/audio/music/level-2.mp3'], volume: 0.20, loop: true },
  3: { src: ['/audio/music/level-3.mp3'], volume: 0.23, loop: true },
  4: { src: ['/audio/music/level-4.mp3'], volume: 0.25, loop: true },
};

const CROSSFADE_MS = 1500;

// ─── SoundService ──────────────────────────────────────────────────

class SoundService {
  private sfx = new Map<SfxName, Howl>();
  private sfxVariants = new Map<SfxName, Howl[]>();
  private music = new Map<MusicName, Howl>();
  private currentMusic: MusicName | null = null;
  private initialized = false;

  // Music level system
  private levelTracks = new Map<MusicLevel, Howl>();
  private currentLevel: MusicLevel | null = null;
  private crossfading = false;

  constructor() {
    this.subscribeToSettings();
  }

  /** Preload all sounds. Call once after first user interaction. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const [name, def] of Object.entries(SFX_DEFS) as [SfxName, SoundDef][]) {
      if (def.variants) {
        const howls = def.variants.map(
          (v) => new Howl({ src: [v], volume: def.volume ?? 0.5, preload: true }),
        );
        this.sfxVariants.set(name, howls);
      } else {
        this.sfx.set(
          name,
          new Howl({ src: def.src, volume: def.volume ?? 0.5, preload: true }),
        );
      }
    }

    for (const [name, def] of Object.entries(MUSIC_DEFS) as [MusicName, SoundDef][]) {
      this.music.set(
        name,
        new Howl({
          src: def.src,
          volume: def.volume ?? 0.3,
          loop: def.loop ?? false,
          preload: true,
        }),
      );
    }

    // Preload level-based music tracks
    for (const [level, def] of Object.entries(MUSIC_LEVEL_DEFS) as [string, SoundDef][]) {
      this.levelTracks.set(
        Number(level) as MusicLevel,
        new Howl({
          src: def.src,
          volume: def.volume ?? 0.2,
          loop: def.loop ?? false,
          preload: true,
        }),
      );
    }

    const { soundEnabled, musicEnabled } = useSettingsStore.getState();
    this.applyMuteState(soundEnabled, musicEnabled);
  }

  /** Play a sound effect by name. Picks a random variant if available. */
  playSfx(name: SfxName): void {
    if (!this.initialized) return;
    const variants = this.sfxVariants.get(name);
    if (variants) {
      variants[Math.floor(Math.random() * variants.length)].play();
    } else {
      this.sfx.get(name)?.play();
    }
  }

  /** Start music only if it isn't already playing (no-op for same track). */
  ensureMusic(name: MusicName): void {
    if (!this.initialized) return;
    if (this.currentMusic === name) return;
    this.playMusic(name);
  }

  /** Start background music. Stops current track if different. */
  playMusic(name: MusicName): void {
    if (!this.initialized) return;
    if (this.currentMusic === name) return;

    if (this.currentMusic) {
      this.music.get(this.currentMusic)?.stop();
    }

    this.music.get(name)?.play();
    this.currentMusic = name;
  }

  /** Stop all music (both named tracks and level tracks). */
  stopMusic(): void {
    if (this.currentMusic) {
      this.music.get(this.currentMusic)?.stop();
      this.currentMusic = null;
    }

    // Also stop any active level track
    if (this.currentLevel) {
      this.levelTracks.get(this.currentLevel)?.stop();
      this.currentLevel = null;
      this.crossfading = false;
    }
  }

  /** Crossfade to a music intensity level (1–4). */
  setMusicLevel(level: MusicLevel): void {
    if (!this.initialized) return;
    if (this.currentLevel === level) return;
    if (this.crossfading) return;

    // Stop any named music track first
    if (this.currentMusic) {
      this.music.get(this.currentMusic)?.stop();
      this.currentMusic = null;
    }

    const newTrack = this.levelTracks.get(level);
    if (!newTrack) return;

    const oldLevel = this.currentLevel;
    const oldTrack = oldLevel ? this.levelTracks.get(oldLevel) : null;
    const targetVol = MUSIC_LEVEL_DEFS[level].volume ?? 0.2;

    this.currentLevel = level;

    if (oldTrack) {
      // Crossfade: fade out old, fade in new
      this.crossfading = true;
      const oldVol = MUSIC_LEVEL_DEFS[oldLevel!].volume ?? 0.2;

      newTrack.volume(0);
      newTrack.play();
      newTrack.fade(0, targetVol, CROSSFADE_MS);

      oldTrack.fade(oldVol, 0, CROSSFADE_MS);
      oldTrack.once('fade', () => {
        oldTrack.stop();
        this.crossfading = false;
      });
    } else {
      // No current track — just start playing
      newTrack.volume(targetVol);
      newTrack.play();
    }
  }

  /** Get the current music level (null if not using level system). */
  getMusicLevel(): MusicLevel | null {
    return this.currentLevel;
  }

  private subscribeToSettings(): void {
    useSettingsStore.subscribe((state) => {
      this.applyMuteState(state.soundEnabled, state.musicEnabled);
    });
  }

  private applyMuteState(soundEnabled: boolean, musicEnabled: boolean): void {
    for (const howl of this.sfx.values()) {
      howl.mute(!soundEnabled);
    }
    for (const howls of this.sfxVariants.values()) {
      for (const howl of howls) howl.mute(!soundEnabled);
    }
    for (const howl of this.music.values()) {
      howl.mute(!musicEnabled);
    }
    for (const howl of this.levelTracks.values()) {
      howl.mute(!musicEnabled);
    }
  }
}

export const soundService = new SoundService();
