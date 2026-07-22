import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Asteroids 2D — GameZone',
  description: 'Play classic vector Asteroids shooter game online for free.',
};

export default function AsteroidsPage() {
  return (
    <GameViewerModal
      title="Asteroids 2D"
      gamePath="/games/asteroids/index.html"
      controlsInfo="Touch Buttons ↺ 🚀 ↻ 💥 or Arrow Keys"
    />
  );
}
