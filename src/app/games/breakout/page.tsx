import type { Metadata } from 'next';
import GameViewerModal from '@/components/GameViewerModal';

export const metadata: Metadata = {
  title: 'Breakout Deluxe — GameZone',
  description: 'Play classic Breakout brick breaker game online for free.',
};

export default function BreakoutPage() {
  return (
    <GameViewerModal
      title="Breakout Deluxe"
      gamePath="/games/breakout/index.html"
      controlsInfo="Drag Paddle / Mouse or Arrow Keys"
    />
  );
}
