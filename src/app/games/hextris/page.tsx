import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Hextris — GameZone',
  description: 'Play fast-paced hexagonal Hextris puzzle game online for free.',
};

export default function HextrisPage() {
  return (
    <GameViewerModal
      title="Hextris"
      gamePath="/games/hextris/index.html"
      controlsInfo="Tap Left/Right Screen or Left/Right Arrow Keys"
    />
  );
}
