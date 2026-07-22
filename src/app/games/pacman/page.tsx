import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Pac-Man HTML5 — GameZone',
  description: 'Play classic Pac-Man arcade game online for free.',
};

export default function PacmanPage() {
  const filePath = path.join(process.cwd(), 'public/games/pacman/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Pac-Man HTML5"
      gameHtml={gameHtml}
      gamePath="/games/pacman/index.html"
      controlsInfo="Onscreen D-Pad ▲ ◄ ► ▼ or Arrow Keys"
    />
  );
}
