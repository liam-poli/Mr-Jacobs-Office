import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { sendTerminalMessage, type ChatMessage } from '../services/terminalChatService';
import { soundService } from '../services/soundService';
import { playMumble } from '../services/mumbleService';
import { playTerminalOpen, playTerminalClose, playTerminalSend, playTerminalReceive } from '../services/terminalSounds';

const CHAR_DELAY = 30;
const CHAT_COST = 1;

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-hud-panel)',
  border: '2px solid var(--color-hud-panel-border)',
  boxShadow:
    '0 0 0 1px var(--color-hud-panel-shadow), inset 0 0 0 1px var(--color-hud-panel-inner)',
  borderRadius: 6,
};

function LoadingDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ color: 'var(--color-hud-accent)' }}>
      {dots}
      <span style={{ opacity: 0 }}>{'...'.slice(dots.length)}</span>
    </span>
  );
}

/** Typewriter display for a single Jacobs reply message */
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayText, setDisplayText] = useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    setDisplayText('');
    completedRef.current = false;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      // N64-style mumble for non-space/punctuation
      const ch = text[i - 1];
      if (ch && ch !== ' ' && ch !== '.' && ch !== ',') playMumble();
      if (i >= text.length) {
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    }, CHAR_DELAY);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <>{displayText}</>;
}

export function TerminalChat() {
  const isOpen = useGameStore((s) => s.terminalChatOpen);
  const closeChat = useGameStore((s) => s.closeTerminalChat);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const bucks = useGameStore((s) => s.bucks);
  const addBucks = useGameStore((s) => s.addBucks);
  const mood = useJacobsStore((s) => s.mood);
  const faceUrl = useJacobsStore((s) => s.faceDataUrls[s.mood]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Play CRT boot sound and focus input when terminal opens
  useEffect(() => {
    if (isOpen) {
      playTerminalOpen();
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Clear error after a delay
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    // Check bucks
    if (bucks < CHAT_COST) {
      setError('INSUFFICIENT BUCKS');
      soundService.playSfx('error');
      return;
    }

    // Deduct bucks
    addBucks(-CHAT_COST);
    playTerminalSend();

    // Add player message
    const playerMsg: ChatMessage = { role: 'player', text: trimmed };
    const updatedMessages = [...messages, playerMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setError(null);

    // Call edge function
    const currentMood = useJacobsStore.getState().mood;
    const response = await sendTerminalMessage(trimmed, updatedMessages, currentMood);

    // Add Jacobs reply
    playTerminalReceive();
    const jacobsMsg: ChatMessage = { role: 'jacobs', text: response.reply };
    const finalMessages = [...updatedMessages, jacobsMsg];
    setMessages(finalMessages);
    setTypingIndex(finalMessages.length - 1);
    setIsLoading(false);
  }, [inputText, isLoading, bucks, addBucks, messages]);

  // Capture Escape to close terminal (Phaser movement already gated by terminalChatOpen)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        playTerminalClose();
        closeChat();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, closeChat]);

  if (!isOpen || !sceneReady) return null;

  const moodColor =
    mood === 'UNHINGED' || mood === 'DISAPPOINTED'
      ? 'var(--color-hud-danger)'
      : 'var(--color-hud-accent)';

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ fontFamily: 'var(--font-hud)' }}
    >
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={() => {
          playTerminalClose();
          closeChat();
        }}
      />

      {/* Terminal window */}
      <div
        className="relative w-[500px] max-h-[440px] flex flex-col"
        style={panelStyle}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b-2"
          style={{ borderColor: 'var(--color-hud-panel-border)' }}
        >
          {faceUrl && (
            <img
              src={faceUrl}
              alt="Mr. Jacobs"
              className="w-7 h-7 rounded-sm"
              style={{
                imageRendering: 'pixelated',
                borderColor: moodColor,
                borderWidth: 1,
              }}
            />
          )}
          <span
            className="text-[11px] tracking-wider font-bold flex-1"
            style={{ color: moodColor }}
          >
            JACOBS TERMINAL
          </span>
          <span className="text-[9px]" style={{ color: 'var(--color-hud-dim)' }}>
            {mood}
          </span>
          <button
            className="text-[14px] font-bold px-1 cursor-pointer"
            style={{ color: 'var(--color-hud-dim)' }}
            onClick={() => {
              playTerminalClose();
              closeChat();
            }}
          >
            &times;
          </button>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-[12px]"
          style={{
            color: 'var(--color-hud-text)',
            minHeight: 200,
            maxHeight: 300,
          }}
        >
          {/* Welcome message */}
          {messages.length === 0 && !isLoading && (
            <div style={{ color: 'var(--color-hud-dim)' }}>
              <span style={{ color: moodColor }}>SYSTEM&gt; </span>
              TERMINAL CONNECTED. TYPE A MESSAGE TO MR. JACOBS.
              {CHAT_COST > 0 && ` EACH MESSAGE COSTS ${CHAT_COST} BUCK${CHAT_COST !== 1 ? 'S' : ''}.`}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'player' ? (
                <div>
                  <span style={{ color: 'var(--color-hud-dim)' }}>&gt; </span>
                  {msg.text}
                </div>
              ) : (
                <div>
                  <span style={{ color: moodColor }}>JACOBS&gt; </span>
                  {i === typingIndex ? (
                    <TypewriterText
                      text={msg.text}
                      onComplete={() => setTypingIndex(-1)}
                    />
                  ) : (
                    msg.text
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div>
              <span style={{ color: moodColor }}>JACOBS&gt; </span>
              <LoadingDots />
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-t-2"
          style={{ borderColor: 'var(--color-hud-panel-border)' }}
        >
          <span
            className="text-[12px]"
            style={{ color: 'var(--color-hud-accent)' }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={isLoading ? 'WAITING...' : 'TYPE A MESSAGE...'}
            disabled={isLoading}
            maxLength={200}
            className="flex-1 bg-transparent outline-none text-[12px] placeholder-opacity-40"
            style={{
              color: 'var(--color-hud-text)',
              fontFamily: 'var(--font-hud)',
              caretColor: 'var(--color-hud-accent)',
            }}
          />
          <span className="text-[9px]" style={{ color: 'var(--color-hud-dim)' }}>
            {bucks}$
          </span>
        </div>

        {/* Error bar */}
        {error && (
          <div
            className="px-4 py-1.5 text-[10px] tracking-wider text-center"
            style={{
              color: 'var(--color-hud-danger)',
              backgroundColor: 'rgba(233, 69, 96, 0.15)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
