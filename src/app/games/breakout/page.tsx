import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Breakout Brick Breaker — GameZone',
  description: 'Play classic Breakout brick breaker game online for free.',
};

export default function BreakoutPage() {
  const filePath = path.join(process.cwd(), 'public/games/breakout/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Breakout Brick Breaker"
      gameHtml={gameHtml}
      gamePath="/games/breakout/index.html"
      controlsInfo="Touch Controls: Drag Paddle / Mouse • Keyboard: Left / Right Arrow Keys"
      proTip="Angling the ball off the edges of your paddle lets you target top corner gaps and trap the ball above the brick wall for automatic destruction!"
    />
  );
}
