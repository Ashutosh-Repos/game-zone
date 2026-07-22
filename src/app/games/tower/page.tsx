import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Tower Building Stack — GameZone',
  description: 'Play Tower Building Stack precision drop game online for free.',
};

export default function TowerPage() {
  const filePath = path.join(process.cwd(), 'public/games/tower/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Tower Building Stack"
      gameHtml={gameHtml}
      gamePath="/games/tower/index.html"
      controlsInfo="Touch Controls: Tap Screen to Drop Block • Keyboard: Spacebar or Mouse Click"
      proTip="Wait for the swinging block to reach the exact center alignment before tapping — perfect center drops expand block size and grant combo multipliers!"
    />
  );
}
