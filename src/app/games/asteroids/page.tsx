import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Asteroids 2D — GameZone',
  description: 'Play classic vector Asteroids shooter game online for free.',
};

export default function AsteroidsPage() {
  const filePath = path.join(process.cwd(), 'public/games/asteroids/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Asteroids 2D"
      gameHtml={gameHtml}
      gamePath="/games/asteroids/index.html"
      controlsInfo="Touch Buttons ↺ 🚀 ↻ 💥 or Arrow Keys"
    />
  );
}
