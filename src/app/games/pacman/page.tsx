'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function PacmanPage() {
  return (
    <GameViewerModal
      title="Pac-Man HTML5"
      gamePath="/games/pacman/index.html"
      controlsInfo="Onscreen D-Pad ▲ ◄ ► ▼ or Arrow Keys"
    />
  );
}
