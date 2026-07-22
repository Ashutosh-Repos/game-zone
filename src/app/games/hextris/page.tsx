'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function HextrisPage() {
  return (
    <GameViewerModal
      title="Hextris"
      gamePath="/games/hextris/index.html"
      controlsInfo="Tap Left/Right Screen or Left/Right Arrow Keys"
    />
  );
}
