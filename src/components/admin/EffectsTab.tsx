import { useEffect, useRef } from 'react';

const PREVIEW_SIZE = 40;

/* ─── State Definitions ─────────────────────────────────── */

interface StateDef {
  name: string;
  tint: string | null;
  indicatorColor: string | null;
  description: string;
  drawIndicator: ((ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => void) | null;
}

// Helper: draw dark circle backing for indicator preview (matches in-game BootScene)
function drawBacking(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s * 0.44;
  ctx.fillStyle = 'rgba(12,15,22,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,34,34,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

const STATES: StateDef[] = [
  {
    name: 'POWERED',
    tint: null,
    indicatorColor: null,
    description: 'Object has electrical power. Default appearance, no visual treatment.',
    drawIndicator: null,
  },
  {
    name: 'UNPOWERED',
    tint: 'rgba(102,102,102,0.45)',
    indicatorColor: '#888888',
    description: 'Object has no power. Dark gray tint + circle-slash indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.7);
      ctx.lineTo(x + s * 0.7, y + s * 0.3);
      ctx.stroke();
    },
  },
  {
    name: 'BROKEN',
    tint: 'rgba(255,102,102,0.35)',
    indicatorColor: '#ff4444',
    description: 'Object is destroyed. Red tint + red X indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, y + s * 0.25);
      ctx.lineTo(x + s * 0.75, y + s * 0.75);
      ctx.moveTo(x + s * 0.75, y + s * 0.25);
      ctx.lineTo(x + s * 0.25, y + s * 0.75);
      ctx.stroke();
    },
  },
  {
    name: 'LOCKED',
    tint: null,
    indicatorColor: '#ffd700',
    description: 'Object is locked. No tint, yellow padlock indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x + s * 0.2, y + s * 0.5, s * 0.6, s * 0.35);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.2, Math.PI, 0);
      ctx.stroke();
    },
  },
  {
    name: 'UNLOCKED',
    tint: null,
    indicatorColor: null,
    description: 'Object is unlocked. Default state, no visual treatment.',
    drawIndicator: null,
  },
  {
    name: 'BURNING',
    tint: 'rgba(255,136,68,0.35)',
    indicatorColor: '#ff8844',
    description: 'Object is on fire. Orange tint + flame indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.fillStyle = '#ff8844';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.15);
      ctx.lineTo(x + s * 0.15, y + s * 0.8);
      ctx.lineTo(x + s * 0.85, y + s * 0.8);
      ctx.fill();
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.35);
      ctx.lineTo(x + s * 0.3, y + s * 0.8);
      ctx.lineTo(x + s * 0.7, y + s * 0.8);
      ctx.fill();
    },
  },
  {
    name: 'FLOODED',
    tint: 'rgba(102,136,204,0.35)',
    indicatorColor: '#6688cc',
    description: 'Object is waterlogged. Blue tint + droplet indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.fillStyle = '#6688cc';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.15);
      ctx.lineTo(x + s * 0.15, y + s * 0.6);
      ctx.lineTo(x + s * 0.85, y + s * 0.6);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.62, s * 0.35, 0, Math.PI);
      ctx.fill();
    },
  },
  {
    name: 'JAMMED',
    tint: 'rgba(204,170,68,0.35)',
    indicatorColor: '#ccaa44',
    description: 'Object is stuck/gummed. Amber tint + gear indicator.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.fillStyle = '#ccaa44';
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s * 0.38, y + s * 0.12, s * 0.24, s * 0.2);
      ctx.fillRect(x + s * 0.38, y + s * 0.68, s * 0.24, s * 0.2);
      ctx.fillRect(x + s * 0.12, y + s * 0.38, s * 0.2, s * 0.24);
      ctx.fillRect(x + s * 0.68, y + s * 0.38, s * 0.2, s * 0.24);
      ctx.fillStyle = '#8a7430';
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: 'HACKED',
    tint: 'rgba(68,255,136,0.35)',
    indicatorColor: '#44ff88',
    description: 'Object has been hacked. Green tint + terminal brackets.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.strokeStyle = '#44ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.4, y + s * 0.2);
      ctx.lineTo(x + s * 0.2, y + s * 0.2);
      ctx.lineTo(x + s * 0.2, y + s * 0.8);
      ctx.lineTo(x + s * 0.4, y + s * 0.8);
      ctx.moveTo(x + s * 0.6, y + s * 0.2);
      ctx.lineTo(x + s * 0.8, y + s * 0.2);
      ctx.lineTo(x + s * 0.8, y + s * 0.8);
      ctx.lineTo(x + s * 0.6, y + s * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(x + s * 0.38, y + s * 0.45, s * 0.24, s * 0.1);
    },
  },
  {
    name: 'CONTAMINATED',
    tint: 'rgba(170,68,204,0.35)',
    indicatorColor: '#aa44cc',
    description: 'Object is chemically contaminated. Purple tint + hazard triangle.',
    drawIndicator(ctx, x, y, s) {
      drawBacking(ctx, x, y, s);
      ctx.fillStyle = '#aa44cc';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.15);
      ctx.lineTo(x + s * 0.15, y + s * 0.85);
      ctx.lineTo(x + s * 0.85, y + s * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#220033';
      ctx.fillRect(x + s * 0.44, y + s * 0.42, s * 0.12, s * 0.2);
      ctx.fillRect(x + s * 0.44, y + s * 0.68, s * 0.12, s * 0.08);
    },
  },
];

/* ─── Canvas Preview ─────────────────────────────────────── */

function StatePreview({ state }: { state: StateDef }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    const objSize = PREVIEW_SIZE * 0.7;
    const objX = (PREVIEW_SIZE - objSize) / 2;
    const objY = (PREVIEW_SIZE - objSize) / 2;

    // Base object (gray square like obj-default)
    ctx.fillStyle = '#666666';
    ctx.fillRect(objX, objY, objSize, objSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(objX, objY, objSize, objSize);

    // Tint overlay
    if (state.tint) {
      ctx.fillStyle = state.tint;
      ctx.fillRect(objX, objY, objSize, objSize);
    }

    // Indicator in top-right corner
    if (state.drawIndicator) {
      const indS = PREVIEW_SIZE * 0.3;
      const indX = PREVIEW_SIZE - indS - 1;
      const indY = 1;
      state.drawIndicator(ctx, indX, indY, indS);
    }
  }, [state]);

  return (
    <canvas
      ref={ref}
      className="border border-hud-border rounded shrink-0"
      style={{
        width: PREVIEW_SIZE * 2.5,
        height: PREVIEW_SIZE * 2.5,
        imageRendering: 'pixelated',
      }}
    />
  );
}

/* ─── Tab Component ──────────────────────────────────────── */

export function EffectsTab() {
  return (
    <div>
      <h2
        className="text-hud-accent text-sm tracking-widest mb-1"
        style={{ fontFamily: 'var(--font-hud)' }}
      >
        STATE EFFECTS
      </h2>
      <p className="text-sm text-hud-dim font-mono mb-4">
        Visual treatment applied to objects based on their current state. Each state can have a tint overlay and/or an indicator icon.
      </p>
      <div className="grid grid-cols-5 gap-3">
        {STATES.map((state) => {
          const hasTint = !!state.tint;
          const hasIndicator = !!state.drawIndicator;
          const hasVisuals = hasTint || hasIndicator;

          return (
            <div
              key={state.name}
              className="bg-hud-panel rounded border border-hud-border p-3 flex flex-col items-center"
            >
              <StatePreview state={state} />
              <span className="mt-2 text-sm font-mono text-hud-text">{state.name}</span>
              <div className="flex gap-1.5 mt-1">
                {hasTint && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-hud-bg text-hud-dim font-mono flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: state.indicatorColor ?? state.tint ?? undefined }}
                    />
                    tint
                  </span>
                )}
                {hasIndicator && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-hud-bg text-hud-dim font-mono flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: state.indicatorColor ?? undefined }}
                    />
                    indicator
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded mt-1 font-mono ${
                  hasVisuals
                    ? 'bg-green-900/40 text-green-400'
                    : 'bg-hud-bg text-hud-dim'
                }`}
              >
                {hasVisuals
                  ? hasTint && hasIndicator
                    ? 'full visuals'
                    : 'partial'
                  : 'no visuals'}
              </span>
              <p className="text-[10px] text-hud-dim mt-1 text-center leading-tight font-mono">{state.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
