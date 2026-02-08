import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { PhaserGame } from './components/PhaserGame';
import { HUD } from './components/HUD';
import { InventoryBar } from './components/InventoryBar';
import { SettingsMenu } from './components/SettingsMenu';
import { HelpPanel } from './components/HelpPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { EndScreen } from './components/EndScreen';
import { InteractionPrompt } from './components/InteractionPrompt';
import { InteractionMenu } from './components/InteractionMenu';
import { InteractionToast } from './components/InteractionToast';
import { JacobsSpeech } from './components/JacobsSpeech';
import { JacobsFace } from './components/JacobsFace';
import { TerminalChat } from './components/TerminalChat';
import { PhaseTitle } from './components/PhaseTitle';
import { useSettingsStore } from './stores/settingsStore';
import { useGameStore } from './stores/gameStore';
import { AdminPanel } from './pages/AdminPanel';
import { MobileBlocker } from './components/MobileBlocker';

function Game() {
  const menuOpen = useSettingsStore((s) => s.menuOpen);
  const toggleMenu = useSettingsStore((s) => s.toggleMenu);

  const interactionMenuOpen = useGameStore((s) => s.interactionMenuOpen);
  const terminalChatOpen = useGameStore((s) => s.terminalChatOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !interactionMenuOpen && !terminalChatOpen) {
        toggleMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMenu, interactionMenuOpen, terminalChatOpen]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className={`absolute inset-0 ${menuOpen ? 'pointer-events-none' : ''}`}>
        <PhaserGame />
      </div>
      <HUD />
      <JacobsFace />
      <InteractionPrompt />
      <InteractionMenu />
      <InteractionToast />
      <JacobsSpeech />
      <TerminalChat />
      <InventoryBar />
      <HelpPanel />
      <SettingsMenu />
      <PhaseTitle />
      <EndScreen />
      <LoadingScreen />
    </div>
  );
}

export function App() {
  return (
    <>
      <MobileBlocker />
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
