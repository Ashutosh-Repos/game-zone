import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Classic Tetris — GameZone',
  description: 'Play Classic Tetris online for free. Clear lines and set high scores.',
};

export default function TetrisPage() {
  return (
    <GameViewerModal
      title="Classic Tetris"
      gamePath="/games/tetris/index.html"
      controlsInfo="Touch Buttons ◄ 🔄 ⬇ ► or Arrow Keys (A/D/W/S)"
    />
  );
}
