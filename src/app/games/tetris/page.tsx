import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Classic Tetris — GameZone',
  description: 'Play Classic Tetris online for free. Clear lines and set high scores.',
};

export default function TetrisPage() {
  const filePath = path.join(process.cwd(), 'public/games/tetris/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Classic Tetris"
      gameHtml={gameHtml}
      gamePath="/games/tetris/index.html"
      controlsInfo="Touch Buttons ◄ 🔄 ⬇ ► or Arrow Keys (A/D/W/S)"
    />
  );
}
