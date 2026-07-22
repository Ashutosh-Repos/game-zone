import React from 'react';

export const metadata = {
  title: 'Game Zone — Arcade HTML5 Games',
  description: 'Play free online HTML5 arcade games cleanly in full-screen.',
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-dvh bg-[#0d1117] text-white overflow-hidden flex flex-col select-none">
      {children}
    </div>
  );
}
