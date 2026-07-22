import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Hextris Hexagonal Puzzle — GameZone',
  description: 'Play fast-paced Hextris hexagonal puzzle game online for free.',
};

export default function HextrisPage() {
  const filePath = path.join(process.cwd(), 'public/games/hextris/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Hextris Hexagonal"
      gameHtml={gameHtml}
      gamePath="/games/hextris/index.html"
      controlsInfo="Touch Controls: Tap Left / Right side of screen • Keyboard: Left / Right Arrow Keys"
      proTip="Rotate the center hexagon early to group matching colored bars together before incoming blocks pile up outside the grey outer ring!"
    />
  );
}
