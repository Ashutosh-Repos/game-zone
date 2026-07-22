'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function ClumsyBirdPage() {
  return (
    <GameViewerModal
      title="Clumsy Bird"
      gamePath="/games/clumsy-bird/index.html"
      controlsInfo="Tap Screen or Spacebar to Flap"
    />
  );
}
