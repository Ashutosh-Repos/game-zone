import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: '2048 Official — GameZone',
  description: 'Play the official 2048 puzzle game online for free.',
};

export default function Game2048Page() {
  return (
    <GameViewerModal
      title="2048 Official"
      gamePath="/games/2048/index.html"
      controlsInfo="Swipe Screen or Arrow Keys"
    />
  );
}
