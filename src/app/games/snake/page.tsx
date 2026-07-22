import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Snake Arcade — GameZone',
  description: 'Play retro Snake arcade game online for free.',
};

export default function SnakePage() {
  const filePath = path.join(process.cwd(), 'public/games/snake/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Snake Arcade"
      gameHtml={gameHtml}
      gamePath="/games/snake/index.html"
      controlsInfo="Onscreen D-Pad or Arrow Keys (W/A/S/D)"
    />
  );
}
