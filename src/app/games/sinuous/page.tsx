import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Sinuous Particle Dodge — GameZone',
  description: 'Play Sinuous particle dodge survival game online for free.',
};

export default function SinuousPage() {
  const filePath = path.join(process.cwd(), 'public/games/sinuous/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Sinuous Particle Dodge"
      gameHtml={gameHtml}
      gamePath="/games/sinuous/index.html"
      controlsInfo="Touch Controls: Drag Finger / Mouse Pointer across canvas"
      proTip="Collect glowing blue & green orbs for invincibility shields and slow-motion powers while making smooth circular movements to dodge red particle swarms!"
    />
  );
}
