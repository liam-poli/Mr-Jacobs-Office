import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { PhaserGame } from './components/PhaserGame';
import { HUD } from './components/HUD';
import { InventoryBar } from './components/InventoryBar';
import { SettingsMenu } from './components/SettingsMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { InteractionPrompt } from './components/InteractionPrompt';
import { InteractionMenu } from './components/InteractionMenu';
import { useSettingsStore } from './stores/settingsStore';
import { useGameStore } from './stores/gameStore';
import { AdminPanel } from './pages/AdminPanel';

function Game() {
  const menuOpen = useSettingsStore((s) => s.menuOpen);
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);

  const interactionMenuOpen = useGameStore((s) => s.interactionMenuOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !interactionMenuOpen) {
        toggleMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMenu, interactionMenuOpen]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className={menuOpen ? 'pointer-events-none' : ''}>
        <PhaserGame />
      </div>
      <HUD />
      <InteractionPrompt />
      <InteractionMenu />
      <InventoryBar />
      <SettingsMenu />
      <LoadingScreen />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Game />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}
