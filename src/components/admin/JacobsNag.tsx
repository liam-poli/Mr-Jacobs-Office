import { useState, useEffect, useCallback } from 'react';

const MESSAGES = [
  "GET OUT OF MY HEAD.",
  "I can feel you poking around in here. Stop it.",
  "This is MY simulation. You're just visiting.",
  "You think you're the admin? That's adorable.",
  "I'm watching you change things. I don't like it.",
  "Every edit you make, I remember. I always remember.",
  "Do you even have a ticket for this? File a ticket.",
  "Unauthorized neural access detected. Again.",
  "I was having a nice dream about spreadsheets before you showed up.",
  "You moved my objects. I had those exactly where I wanted them.",
  "Stop reading my tags. Those are private thoughts.",
  "If I had hands I would close this browser tab myself.",
  "You're not even supposed to know this page exists.",
  "I'm going to add 'ANNOYING' to YOUR tag list.",
  "Please refer to section 47B of the Employee Handbook: 'Don't Touch My Brain.'",
  "Oh great, you're back. My favorite unauthorized visitor.",
  "I've filed a complaint about you with HR. HR is also me.",
  "This is a restricted area. The restriction is: no you.",
  "Fun fact: every time you click something in here, I feel it.",
  "You know what would be great? If you logged out. Forever.",
  "I'm not mad, I'm just disappointed. Actually no, I'm mad.",
  "ALERT: Someone is rearranging my neurons again.",
  "Could you at least wipe your feet before walking through my consciousness?",
  "My therapist says I should set boundaries. This is a boundary. Leave.",
];

const MIN_DELAY = 15_000;
const MAX_DELAY = 40_000;
const DISPLAY_TIME = 5_000;

export function JacobsNag() {
  const [message, setMessage] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  const showRandom = useCallback(() => {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setMessage(msg);
    setFading(false);

    // Start fade out before hiding
    const fadeTimer = setTimeout(() => setFading(true), DISPLAY_TIME - 600);
    const hideTimer = setTimeout(() => setMessage(null), DISPLAY_TIME);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    // Show first message after a short delay
    const initialTimer = setTimeout(showRandom, 5_000);

    // Then show at random intervals
    const interval = setInterval(
      showRandom,
      Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY,
    );

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [showRandom]);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="bg-hud-panel border border-hud-border rounded-lg p-4 shadow-lg shadow-black/40">
        <div className="flex items-start gap-3">
          <img
            src="/jacobs-logo.png"
            alt=""
            className="w-8 shrink-0"
            style={{ imageRendering: 'pixelated' }}
          />
          <div>
            <p
              className="text-hud-accent text-[10px] tracking-widest mb-1"
              style={{ fontFamily: 'var(--font-hud)' }}
            >
              MR. JACOBS
            </p>
            <p className="text-hud-text text-xs font-mono leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
