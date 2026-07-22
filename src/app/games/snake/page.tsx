import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Snake Retro — GameZone',
  description: 'Play classic Snake retro arcade game online for free.',
};

export default function SnakePage() {
  const filePath = path.join(process.cwd(), 'public/games/snake/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Snake Retro"
      gameHtml={gameHtml}
      gamePath="/games/snake/index.html"
      controlsInfo="Touch Controls: Onscreen Directional D-Pad • Keyboard: Arrow Keys or W/A/S/D"
      proTip="Snake along the grid boundaries in s-curves so you don't trap yourself inside your own tail as your length grows!"
    />
  );
}
