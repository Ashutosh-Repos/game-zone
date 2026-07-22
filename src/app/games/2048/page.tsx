import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: '2048 Official — GameZone',
  description: 'Play the official 2048 puzzle game online for free.',
};

export default function Game2048Page() {
  const filePath = path.join(process.cwd(), 'public/games/2048/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="2048 Official"
      gameHtml={gameHtml}
      gamePath="/games/2048/index.html"
      controlsInfo="Swipe Screen or Arrow Keys"
    />
  );
}
