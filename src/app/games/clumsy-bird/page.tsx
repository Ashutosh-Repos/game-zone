import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Clumsy Bird — GameZone',
  description: 'Play Clumsy Bird arcade tap flapper online for free.',
};

export default function ClumsyBirdPage() {
  const filePath = path.join(process.cwd(), 'public/games/clumsy-bird/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Clumsy Bird"
      gameHtml={gameHtml}
      gamePath="/games/clumsy-bird/index.html"
      controlsInfo="Touch Controls: Tap Screen to Flap • Keyboard: Spacebar or Mouse Click"
      proTip="Maintain a steady rhythmic tap frequency rather than double-tapping wildly, aiming to clear pipe openings just above bottom rim level!"
    />
  );
}
