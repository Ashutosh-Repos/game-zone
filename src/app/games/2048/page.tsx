'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function Game2048Page() {
  return (
    <GameViewerModal
      title="2048 Official"
      gamePath="/games/2048/index.html"
      controlsInfo="Swipe Screen or Arrow Keys"
    />
  );
}
