'use client';

import GameViewerModal from '@/components/GameViewerModal';

export default function SinuousPage() {
  return (
    <GameViewerModal
      title="Sinuous"
      gamePath="/games/sinuous/index.html"
      controlsInfo="Drag Finger / Mouse to Dodge Red Particles"
    />
  );
}
