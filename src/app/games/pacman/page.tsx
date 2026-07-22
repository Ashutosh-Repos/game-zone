import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Pac-Man HTML5 — GameZone',
  description: 'Play classic Pac-Man arcade game online for free.',
};

export default function PacmanPage() {
  return (
    <GameViewerModal
      title="Pac-Man HTML5"
      gamePath="/games/pacman/index.html"
      controlsInfo="Onscreen D-Pad ▲ ◄ ► ▼ or Arrow Keys"
    />
  );
}
