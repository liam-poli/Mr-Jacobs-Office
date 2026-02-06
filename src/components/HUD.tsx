import { useGameStore } from '../stores/gameStore';

export function HUD() {
  const bucks = useGameStore((s) => s.bucks);
  const sceneReady = useGameStore((s) => s.sceneReady);

  if (!sceneReady) return null;

  return (
    <div className="absolute top-4 left-4 z-10 font-mono">
      <div className="bg-black/80 border border-green-500 text-green-400 px-4 py-2 text-lg tracking-wider">
        <div>BUCKS: {bucks}</div>
      </div>
    </div>
  );
}
