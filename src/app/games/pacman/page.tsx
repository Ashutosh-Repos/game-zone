import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Pac-Man Arcade — GameZone',
  description: 'Play classic Pac-Man arcade maze runner online for free.',
};

export default function PacmanPage() {
  const filePath = path.join(process.cwd(), 'public/games/pacman/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Pac-Man Arcade"
      gameHtml={gameHtml}
      gamePath="/games/pacman/index.html"
      controlsInfo="Touch Controls: Onscreen D-Pad ▲ ◄ ► ▼ • Keyboard: Arrow Keys or W/A/S/D"
      proTip="Lure all 4 ghosts near a corner before swallowing a glowing Power Pellet — eating ghosts in rapid succession yields 200, 400, 800, and 1600 bonus points!"
    />
  );
}
