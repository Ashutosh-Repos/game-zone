import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Sinuous — GameZone',
  description: 'Play particle evasion Sinuous arcade game online for free.',
};

export default function SinuousPage() {
  return (
    <GameViewerModal
      title="Sinuous"
      gamePath="/games/sinuous/index.html"
      controlsInfo="Drag Finger / Mouse to Dodge Red Particles"
    />
  );
}
