import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Tower Stack — GameZone',
  description: 'Play physics Tower Stack game online for free.',
};

export default function TowerPage() {
  return (
    <GameViewerModal
      title="Tower Stack"
      gamePath="/games/tower/index.html"
      controlsInfo="Tap Screen or Spacebar to Drop Block"
    />
  );
}
