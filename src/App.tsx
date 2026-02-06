import { PhaserGame } from './components/PhaserGame';
import { HUD } from './components/HUD';

export function App() {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <PhaserGame />
      <HUD />
    </div>
  );
}
