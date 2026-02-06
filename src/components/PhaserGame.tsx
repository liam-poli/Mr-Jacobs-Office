import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { OfficeScene } from '../scenes/OfficeScene';
import { useGameStore } from '../stores/gameStore';

export function PhaserGame() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneReady = useGameStore((s) => s.sceneReady);

  useEffect(() => {
    if (gameRef.current || !gameContainerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 960,
      height: 640,
      pixelArt: true,
      roundPixels: true,
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [BootScene, OfficeScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={gameContainerRef}
      className={`w-full h-full transition-opacity duration-300 ${sceneReady ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
