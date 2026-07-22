import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: '2048 Puzzle — GameZone',
  description: 'Play 2048 geometric tile puzzle game online for free.',
};

export default function Game2048Page() {
  const filePath = path.join(process.cwd(), 'public/games/2048/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="2048 Tile Puzzle"
      gameHtml={gameHtml}
      gamePath="/games/2048/index.html"
      controlsInfo="Touch Controls: Swipe Screen Up / Down / Left / Right • Keyboard: Arrow Keys"
      proTip="Pick one corner (e.g. bottom-right) and never swipe up unless forced! Keep your largest numbers locked into that corner in descending order."
    />
  );
}
