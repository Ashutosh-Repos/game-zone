import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Tower Stack — GameZone',
  description: 'Play physics Tower Stack game online for free.',
};

export default function TowerPage() {
  const filePath = path.join(process.cwd(), 'public/games/tower/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Tower Stack"
      gameHtml={gameHtml}
      gamePath="/games/tower/index.html"
      controlsInfo="Tap Screen or Spacebar to Drop Block"
    />
  );
}
