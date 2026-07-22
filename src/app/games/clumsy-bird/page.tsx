import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Clumsy Bird — GameZone',
  description: 'Play Clumsy Bird runner game online for free.',
};

export default function ClumsyBirdPage() {
  return (
    <GameViewerModal
      title="Clumsy Bird"
      gamePath="/games/clumsy-bird/index.html"
      controlsInfo="Tap Screen or Spacebar to Flap"
    />
  );
}
