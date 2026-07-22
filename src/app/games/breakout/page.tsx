'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function BreakoutPage() {
  return (
    <GameViewerModal
      title="Breakout Deluxe"
      gamePath="/games/breakout/index.html"
      controlsInfo="Drag Paddle / Mouse or Arrow Keys"
    />
  );
}
