import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Space Invaders HTML5 — GameZone',
  description: 'Play classic Space Invaders arcade game online for free.',
};

export default function SpaceInvadersPage() {
  return (
    <GameViewerModal
      title="Space Invaders HTML5"
      gamePath="/games/space-invaders/index.html"
      controlsInfo="Touch Buttons ◄ ► 💥 or Arrow Keys + Space"
    />
  );
}
