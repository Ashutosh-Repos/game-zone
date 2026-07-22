'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function TowerPage() {
  return (
    <GameViewerModal
      title="Tower Stack"
      gamePath="/games/tower/index.html"
      controlsInfo="Tap Screen or Spacebar to Drop Block"
    />
  );
}
