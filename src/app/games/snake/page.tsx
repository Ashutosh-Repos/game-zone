'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function SnakePage() {
  return (
    <GameViewerModal
      title="Snake Arcade"
      gamePath="/games/snake/index.html"
      controlsInfo="Onscreen D-Pad or Arrow Keys (W/A/S/D)"
    />
  );
}
