'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function SpaceInvadersPage() {
  return (
    <GameViewerModal
      title="Space Invaders HTML5"
      gamePath="/games/space-invaders/index.html"
      controlsInfo="Touch Buttons ◄ ► 💥 or Arrow Keys + Space"
    />
  );
}
