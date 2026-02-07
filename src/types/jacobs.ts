// ─── Mood ────────────────────────────────────────────────────────────
export type JacobsMood =
  | 'PLEASED'
  | 'NEUTRAL'
  | 'SUSPICIOUS'
  | 'DISAPPOINTED'
  | 'UNHINGED';

// ─── Event Log ───────────────────────────────────────────────────────
export type JacobsEventType =
  | 'INTERACTION'
  | 'PICKUP'
  | 'DROP'
  | 'STATE_CHANGE'
  | 'ROOM_CHANGE'
  | 'TERMINAL_CHAT';

export interface JacobsEvent {
  type: JacobsEventType;
  timestamp: number;
  player: string;
  details: Record<string, string | string[] | null>;
}

// ─── AI Response ─────────────────────────────────────────────────────
export interface JacobsEffect {
  type: 'CHANGE_STATE';
  targetName: string;
  newState: string;
}

export interface JacobsReaction {
  speech: string;
  mood: JacobsMood;
  effects: JacobsEffect[];
}

// ─── Store State ─────────────────────────────────────────────────────
export interface JacobsState {
  mood: JacobsMood;
  setMood: (mood: JacobsMood) => void;

  eventLog: JacobsEvent[];
  logEvent: (event: JacobsEvent) => void;
  clearEventLog: () => void;

  currentSpeech: string | null;
  speechTitle: string | null;
  setSpeech: (speech: string | null, title?: string | null) => void;

  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;

  objectNameMap: Record<string, string>;
  registerObject: (id: string, name: string) => void;

  faceDataUrls: Partial<Record<JacobsMood, string>>;
  setFaceDataUrl: (mood: JacobsMood, dataUrl: string) => void;

  blinkFaceDataUrls: Partial<Record<JacobsMood, string>>;
  setBlinkFaceDataUrl: (mood: JacobsMood, dataUrl: string) => void;
}
