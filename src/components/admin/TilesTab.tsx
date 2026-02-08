import { useEffect, useRef } from 'react';

/* ─── Data ───────────────────────────────────────────────── */

const TILE_SIZE = 32;

interface TileDef {
  code: number;
  name: string;
  textureKey: string;
  collision: boolean;
  note: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
}


const TILES: TileDef[] = [
  {
    code: 0,
    name: 'Floor',
    textureKey: 'floor-tile',
    collision: false,
    note: 'Basic walkable tile',
    draw(ctx) {
      ctx.fillStyle = '#becdd4';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      // Inner highlight (top + left)
      ctx.strokeStyle = 'rgba(214,226,232,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(1, 1); ctx.lineTo(TILE_SIZE - 1, 1);
      ctx.moveTo(1, 1); ctx.lineTo(1, TILE_SIZE - 1);
      ctx.stroke();
      // Inner shadow (bottom + right)
      ctx.strokeStyle = 'rgba(154,172,180,0.5)';
      ctx.beginPath();
      ctx.moveTo(1, TILE_SIZE - 1); ctx.lineTo(TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.moveTo(TILE_SIZE - 1, 1); ctx.lineTo(TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.stroke();
      // Grid gap border
      ctx.strokeStyle = 'rgba(138,156,166,0.7)';
      ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    },
  },
  {
    code: 1,
    name: 'Wall',
    textureKey: 'wall-tile',
    collision: true,
    note: 'Room boundary, blocks movement',
    draw(ctx) {
      ctx.fillStyle = '#D4CAB8';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(158,150,128,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.strokeStyle = 'rgba(232,221,208,0.6)';
      ctx.beginPath();
      ctx.moveTo(1, 1.5);
      ctx.lineTo(TILE_SIZE - 1, 1.5);
      ctx.stroke();
    },
  },
  {
    code: 2,
    name: 'Carpet',
    textureKey: 'carpet-tile',
    collision: false,
    note: 'Decorative, striped pattern',
    draw(ctx) {
      ctx.fillStyle = '#5c6b7a';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(82,97,112,0.3)';
      for (let i = 0; i < TILE_SIZE; i += 4) {
        ctx.fillRect(i, 0, 2, TILE_SIZE);
      }
      ctx.strokeStyle = 'rgba(74,90,104,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    },
  },
  {
    code: 3,
    name: 'Desk',
    textureKey: 'desk-tile',
    collision: true,
    note: 'Floor underneath, depth-sorted sprite',
    draw(ctx) {
      ctx.fillStyle = '#6b5040';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#7d6050';
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeStyle = 'rgba(74,56,40,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    },
  },
];

/* ─── Canvas Preview ─────────────────────────────────────── */

function Preview({
  size,
  scale,
  draw,
}: {
  size: number;
  scale: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    draw(ctx);
  }, [size, draw]);

  return (
    <canvas
      ref={ref}
      className="border border-hud-border rounded shrink-0"
      style={{
        width: size * scale,
        height: size * scale,
        imageRendering: 'pixelated',
      }}
    />
  );
}

/* ─── Tab Component ──────────────────────────────────────── */

export function TilesTab() {
  return (
    <div>
      <h2
        className="text-hud-accent text-sm tracking-widest mb-3"
        style={{ fontFamily: 'var(--font-hud)' }}
      >
        TILE TYPES
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {TILES.map((tile) => (
          <div
            key={tile.code}
            className="bg-hud-panel rounded border border-hud-border p-4 flex flex-col items-center"
          >
            <Preview size={TILE_SIZE} scale={3} draw={tile.draw} />
            <span className="mt-2 text-sm font-mono text-hud-text">{tile.name}</span>
            <span className="text-[10px] text-hud-dim font-mono">{tile.textureKey}</span>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-hud-bg text-hud-dim font-mono">
                code {tile.code}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  tile.collision
                    ? 'bg-red-900/40 text-red-400'
                    : 'bg-green-900/40 text-green-400'
                }`}
              >
                {tile.collision ? 'collision' : 'walkable'}
              </span>
            </div>
            <p className="text-[10px] text-hud-dim mt-1 text-center font-mono">{tile.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
