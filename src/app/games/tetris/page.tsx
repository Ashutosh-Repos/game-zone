import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Tetris Classic — GameZone',
  description: 'Play classic Tetris block puzzle game online for free.',
};

export default function TetrisPage() {
  const filePath = path.join(process.cwd(), 'public/games/tetris/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Tetris Classic"
      gameHtml={gameHtml}
      gamePath="/games/tetris/index.html"
      controlsInfo="Touch Controls: ◄ / ► move, 🔄 rotate, ⬇ drop • Keyboard: A/D or Left/Right (move), W or Up (rotate), S or Down (drop)"
      proTip="Keep a single 1-wide column open on the right edge and wait for long I-bars to trigger 4-line Tetris clears for massive multiplier bonuses!"
    />
  );
}
