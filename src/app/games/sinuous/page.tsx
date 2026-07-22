import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Sinuous — GameZone',
  description: 'Play particle evasion Sinuous arcade game online for free.',
};

export default function SinuousPage() {
  const filePath = path.join(process.cwd(), 'public/games/sinuous/index.html');
  const gameHtml = fs.readFileSync(filePath, 'utf8');

  return (
    <GameViewerModal
      title="Sinuous"
      gameHtml={gameHtml}
      gamePath="/games/sinuous/index.html"
      controlsInfo="Drag Finger / Mouse to Dodge Red Particles"
    />
  );
}
