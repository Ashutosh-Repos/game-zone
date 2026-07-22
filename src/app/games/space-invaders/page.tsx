import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Space Invaders HTML5 — GameZone',
  description: 'Play classic Space Invaders arcade game online for free.',
};

export default function SpaceInvadersPage() {
  const filePath = path.join(process.cwd(), 'public/games/space-invaders/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Space Invaders HTML5"
      gameHtml={gameHtml}
      gamePath="/games/space-invaders/index.html"
      controlsInfo="Touch Controls: ◄ / ► move, 💥 fire laser • Keyboard: Left/Right Arrow Keys + Space to Shoot"
      proTip="Hide behind green bunker shields for cover, and prioritize sniping high-value red mystery UFOs across the top for 300 bonus points!"
    />
  );
}
