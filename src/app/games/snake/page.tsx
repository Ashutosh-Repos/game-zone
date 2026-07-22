import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Snake Arcade — GameZone',
  description: 'Play retro Snake arcade game online for free.',
};

export default function SnakePage() {
  return (
    <GameViewerModal
      title="Snake Arcade"
      gamePath="/games/snake/index.html"
      controlsInfo="Onscreen D-Pad or Arrow Keys (W/A/S/D)"
    />
  );
}
