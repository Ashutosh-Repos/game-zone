'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function AsteroidsPage() {
  return (
    <GameViewerModal
      title="Asteroids 2D"
      gamePath="/games/asteroids/index.html"
      controlsInfo="Touch Buttons ↺ 🚀 ↻ 💥 or Arrow Keys"
    />
  );
}
