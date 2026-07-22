import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Clumsy Bird — GameZone',
  description: 'Play Clumsy Bird runner game online for free.',
};

export default function ClumsyBirdPage() {
  const filePath = path.join(process.cwd(), 'public/games/clumsy-bird/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Clumsy Bird"
      gameHtml={gameHtml}
      gamePath="/games/clumsy-bird/index.html"
      controlsInfo="Tap Screen or Spacebar to Flap"
    />
  );
}
