import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Asteroids Vector — GameZone',
  description: 'Play classic Asteroids vector space shooter online for free.',
};

export default function AsteroidsPage() {
  const filePath = path.join(process.cwd(), 'public/games/asteroids/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Asteroids Vector"
      gameHtml={gameHtml}
      gamePath="/games/asteroids/index.html"
      controlsInfo="Touch Controls: ↺ / ↻ rotate, 🚀 thrust, 💥 fire • Keyboard: Left/Right to rotate, Up Arrow for thrust, Space to shoot"
      proTip="Avoid shooting every large asteroid at once; break them down one by one so you don't get swarmed by fast-moving small debris!"
    />
  );
}
