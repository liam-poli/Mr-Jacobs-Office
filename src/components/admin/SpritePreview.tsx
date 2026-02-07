import { useState } from 'react';

interface SpritePreviewProps {
  src: string;
  alt: string;
  directionalSprites?: Record<string, string>;
}

const DIRECTIONS = ['up', 'left', 'down', 'right'] as const;
const DIR_LABELS: Record<string, string> = { up: 'Up', down: 'Down', left: 'Left', right: 'Right' };

export function SpritePreview({ src, alt, directionalSprites }: SpritePreviewProps) {
  const [open, setOpen] = useState(false);

  const hasAnyDir = directionalSprites && DIRECTIONS.some((d) => directionalSprites[d]);

  return (
    <>
      <div className="mb-2 flex justify-center items-center bg-gray-50 rounded p-3 aspect-square cursor-pointer" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 shadow-xl max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {hasAnyDir ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {DIRECTIONS.map((dir) => {
                    const url = directionalSprites?.[dir];
                    return (
                      <div key={dir} className="flex flex-col items-center">
                        <div className="w-40 h-40 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                          {url ? (
                            <img src={url} alt={`${alt} ${dir}`} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                          ) : (
                            <span className="text-gray-300 text-sm">No sprite</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1.5 font-medium">{DIR_LABELS[dir]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">{alt}</p>
              </>
            ) : (
              <>
                <img src={src} alt={alt} className="w-64 h-64 object-contain mx-auto" style={{ imageRendering: 'pixelated' }} />
                <p className="text-center text-sm text-gray-600 mt-3">{alt}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
