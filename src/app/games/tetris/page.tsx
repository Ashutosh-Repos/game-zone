'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function TetrisPage() {
  return (
    <GameViewerModal
      title="Classic Tetris"
      gamePath="/games/tetris/index.html"
      controlsInfo="Touch Buttons ◄ 🔄 ⬇ ► or Arrow Keys (A/D/W/S)"
    />
  );
}
