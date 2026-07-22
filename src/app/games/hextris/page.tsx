import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Hextris — GameZone',
  description: 'Play fast-paced hexagonal Hextris puzzle game online for free.',
};

export default function HextrisPage() {
  const filePath = path.join(process.cwd(), 'public/games/hextris/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Hextris"
      gameHtml={gameHtml}
      gamePath="/games/hextris/index.html"
      controlsInfo="Tap Left/Right Screen or Left/Right Arrow Keys"
    />
  );
}
