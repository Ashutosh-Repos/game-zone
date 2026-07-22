'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Maximize2, Minimize2, RefreshCw, HelpCircle, X } from 'lucide-react';
import ShadowGameContainer from './ShadowGameContainer';

interface GameViewerModalProps {
  title: string;
  gamePath?: string; // e.g. /games/2048/index.html
  gameHtml?: string; // Server-ingested HTML string
  controlsInfo?: string;
  onBack?: () => void;
}

export default function GameViewerModal({ title, gamePath, gameHtml, controlsInfo, onBack }: GameViewerModalProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0d1117] text-white overflow-hidden select-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      {/* Floating Glassmorphic Top Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Back Button */}
        <button
          onClick={handleBack}
          className="pointer-events-auto group inline-flex items-center gap-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white px-3.5 py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm font-extrabold shadow-2xl cursor-pointer active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        {/* Center: Title Badge */}
        <div className="pointer-events-auto hidden xs:flex items-center bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 px-4 py-2 rounded-xl shadow-2xl max-w-xs sm:max-w-md">
          <h2 className="font-extrabold text-xs sm:text-sm text-white tracking-wide truncate">
            {title}
          </h2>
        </div>

        {/* Right: Floating Control Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            title="Controls / How to Play"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Controls</span>
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-amber-400 hover:text-amber-300 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Restart</span>
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Floating Controls Drawer */}
      {showControlsDrawer && (
        <div className="absolute top-16 left-3 right-3 sm:top-18 sm:left-4 sm:right-4 z-40 bg-[#161b22]/95 backdrop-blur-2xl border border-indigo-500/40 p-4 rounded-2xl shadow-2xl animate-fade-in max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-200">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">🎮 Controls:</span>
              <span className="text-zinc-300 font-medium">{controlsInfo || 'Use Onscreen Touch Buttons or Keyboard Arrow Keys'}</span>
            </div>
            <button
              onClick={() => setShowControlsDrawer(false)}
              className="p-1.5 hover:bg-[#30363d] rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Embedded Game Container — 100% Height */}
      <div className="w-full h-full relative flex items-center justify-center bg-[#090d16]">
        {gameHtml ? (
          <ShadowGameContainer key={key} htmlContent={gameHtml} isFullscreen={true} />
        ) : (
          <iframe
            key={key}
            src={gamePath}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay; keyboard"
          />
        )}
      </div>
    </div>
  );
}
