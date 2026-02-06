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

interface ObjectDef {
  name: string;
  textureKey: string;
  color: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

interface ItemDef {
  name: string;
  textureKey: string;
  color: string;
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
      ctx.fillStyle = '#B8D4C8';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(160,191,176,0.5)';
      ctx.lineWidth = 1;
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

function drawObjRect(ctx: CanvasRenderingContext2D, hex: string) {
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
}

const OBJECTS: ObjectDef[] = [
  {
    name: 'Coffee Maker',
    textureKey: 'obj-coffee-maker',
    color: '#2f4f4f',
    draw(ctx) { drawObjRect(ctx, '#2f4f4f'); },
  },
  {
    name: 'Filing Cabinet',
    textureKey: 'obj-filing-cabinet',
    color: '#696969',
    draw(ctx) { drawObjRect(ctx, '#696969'); },
  },
  {
    name: 'Desk (object)',
    textureKey: 'obj-desk',
    color: '#8b7355',
    draw(ctx) { drawObjRect(ctx, '#8b7355'); },
  },
  {
    name: 'Door',
    textureKey: 'obj-door',
    color: '#8b6914',
    draw(ctx) { drawObjRect(ctx, '#8b6914'); },
  },
  {
    name: 'Terminal',
    textureKey: 'obj-terminal',
    color: '#1a3a2a',
    draw(ctx) { drawObjRect(ctx, '#1a3a2a'); },
  },
  {
    name: 'Vending Machine',
    textureKey: 'obj-vending-machine',
    color: '#3a1a5a',
    draw(ctx) { drawObjRect(ctx, '#3a1a5a'); },
  },
  {
    name: "Jacobs' Screen",
    textureKey: 'obj-jacobs-screen',
    color: '#0a0a14',
    draw(ctx) { drawObjRect(ctx, '#0a0a14'); },
  },
  {
    name: 'Office Plant',
    textureKey: 'obj-plant',
    color: '#2d5a27',
    draw(ctx) {
      // Replicate BootScene plant drawing
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a7a30';
      ctx.beginPath();
      ctx.arc(14, 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#4a9a40';
      ctx.beginPath();
      ctx.arc(12, 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(10, 22, 12, 8);
    },
  },
];

function drawItemRect(ctx: CanvasRenderingContext2D, hex: string) {
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 16, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 15, 15);
}

const ITEMS: ItemDef[] = [
  { name: 'Coffee Mug', textureKey: 'item-coffee-mug', color: '#8b4513', draw(ctx) { drawItemRect(ctx, '#8b4513'); } },
  { name: 'Wrench', textureKey: 'item-wrench', color: '#708090', draw(ctx) { drawItemRect(ctx, '#708090'); } },
  { name: 'Bucket', textureKey: 'item-bucket', color: '#4169e1', draw(ctx) { drawItemRect(ctx, '#4169e1'); } },
  { name: 'Matches', textureKey: 'item-matches', color: '#ff4500', draw(ctx) { drawItemRect(ctx, '#ff4500'); } },
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
      className="border border-gray-300 rounded shrink-0"
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
      {/* Tile Types */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Tile Types</h2>
      <div className="grid grid-cols-4 gap-3 mb-8">
        {TILES.map((tile) => (
          <div
            key={tile.code}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center"
          >
            <Preview size={TILE_SIZE} scale={3} draw={tile.draw} />
            <span className="mt-2 text-sm font-medium text-gray-800">{tile.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">{tile.textureKey}</span>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                code {tile.code}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  tile.collision
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {tile.collision ? 'collision' : 'walkable'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">{tile.note}</p>
          </div>
        ))}
      </div>

      {/* Object Textures */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Object Textures</h2>
      <div className="grid grid-cols-4 gap-3 mb-8">
        {OBJECTS.map((obj) => (
          <div
            key={obj.textureKey}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center"
          >
            <Preview size={TILE_SIZE} scale={3} draw={obj.draw} />
            <span className="mt-2 text-sm font-medium text-gray-800">{obj.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">{obj.textureKey}</span>
          </div>
        ))}
      </div>

      {/* Item Textures */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Item Textures</h2>
      <div className="grid grid-cols-4 gap-3">
        {ITEMS.map((item) => (
          <div
            key={item.textureKey}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center"
          >
            <Preview size={16} scale={6} draw={item.draw} />
            <span className="mt-2 text-sm font-medium text-gray-800">{item.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">{item.textureKey}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
