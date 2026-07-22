import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Breakout Deluxe — GameZone',
  description: 'Play classic Breakout brick breaker game online for free.',
};

export default function BreakoutPage() {
  const filePath = path.join(process.cwd(), 'public/games/breakout/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Breakout Deluxe"
      gameHtml={gameHtml}
      gamePath="/games/breakout/index.html"
      controlsInfo="Drag Paddle / Mouse or Arrow Keys"
    />
  );
}
