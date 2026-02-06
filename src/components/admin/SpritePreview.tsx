import { useState } from 'react';

interface SpritePreviewProps {
  src: string;
  alt: string;
}

export function SpritePreview({ src, alt }: SpritePreviewProps) {
  const [open, setOpen] = useState(false);

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
            className="bg-white rounded-lg p-6 shadow-xl max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={src} alt={alt} className="w-64 h-64 object-contain mx-auto" style={{ imageRendering: 'pixelated' }} />
            <p className="text-center text-sm text-gray-600 mt-3">{alt}</p>
          </div>
        </div>
      )}
    </>
  );
}
