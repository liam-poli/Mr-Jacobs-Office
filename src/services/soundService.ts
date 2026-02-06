import { Howl } from 'howler';
import { useSettingsStore } from '../stores/settingsStore';

// ─── Sound Registry ────────────────────────────────────────────────
// Add new sounds here — that's it. TypeScript enforces valid names.

type SfxName = 'pickup' | 'drop' | 'interact' | 'footstep' | 'ui-hover' | 'ui-click' | 'error';
type MusicName = 'ambient-office';

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

// ─── SoundService ──────────────────────────────────────────────────

class SoundService {
  private sfx = new Map<SfxName, Howl>();
  private sfxVariants = new Map<SfxName, Howl[]>();
  private music = new Map<MusicName, Howl>();
  private currentMusic: MusicName | null = null;
  private initialized = false;

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

  /** Stop all music. */
  stopMusic(): void {
    if (this.currentMusic) {
      this.music.get(this.currentMusic)?.stop();
      this.currentMusic = null;
    }
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
  }
}

export const soundService = new SoundService();
