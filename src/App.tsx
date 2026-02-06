import { useEffect } from 'react';
import { PhaserGame } from './components/PhaserGame';
import { HUD } from './components/HUD';
import { InventoryBar } from './components/InventoryBar';
import { SettingsMenu } from './components/SettingsMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { useSettingsStore } from './stores/settingsStore';

export function App() {
  const menuOpen = useSettingsStore((s) => s.menuOpen);
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMenu]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className={menuOpen ? 'pointer-events-none' : ''}>
        <PhaserGame />
      </div>
      <HUD />
      <InventoryBar />
      <SettingsMenu />
      <LoadingScreen />
    </div>
  );
}
