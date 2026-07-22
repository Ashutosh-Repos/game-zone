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
    <div className="flex flex-col w-full h-full bg-[#0d1117] text-white overflow-hidden select-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      {/* Top Controls Header */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#161b22] border-b border-zinc-800 z-10 shadow-md">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-zinc-200 hover:text-white border border-zinc-700/60 px-3.5 sm:px-4 py-2 rounded-xl transition text-xs sm:text-sm font-semibold cursor-pointer active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center px-2">
          <h2 className="font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-44 sm:max-w-md">{title}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            title="How to Play / Controls"
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-indigo-400 hover:text-indigo-300 border border-zinc-700/60 px-3 py-2 rounded-xl transition text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Controls</span>
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game"
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-amber-400 hover:text-amber-300 border border-zinc-700/60 px-3 py-2 rounded-xl transition text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Restart</span>
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-zinc-300 hover:text-white border border-zinc-700/60 px-3 py-2 rounded-xl transition text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Controls Guide Drawer */}
      {showControlsDrawer && (
        <div className="bg-[#161b22] border-b border-indigo-500/40 px-5 py-3.5 text-xs sm:text-sm text-zinc-200 flex items-center justify-between z-20 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">🎮 Game Controls:</span>
            <span className="text-zinc-300 font-medium">{controlsInfo || 'Use Onscreen Touch Buttons or Keyboard Arrow Keys'}</span>
          </div>
          <button
            onClick={() => setShowControlsDrawer(false)}
            className="p-1.5 hover:bg-[#30363d] rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Embedded Game Container */}
      <div className={`flex-1 min-h-0 overflow-hidden relative flex items-center justify-center bg-[#090d16] ${isFullscreen ? 'p-0' : 'p-1 sm:p-3'}`}>
        {gameHtml ? (
          <ShadowGameContainer key={key} htmlContent={gameHtml} isFullscreen={isFullscreen} />
        ) : (
          <iframe
            key={key}
            src={gamePath}
            title={title}
            className={`w-full h-full border-0 transition-all duration-200 ${
              isFullscreen ? 'rounded-none' : 'rounded-xl shadow-2xl'
            }`}
            allow="autoplay; keyboard"
          />
        )}
      </div>

      {/* Clean Bottom Footer */}
      {!isFullscreen && (
        <footer className="shrink-0 py-2.5 px-4 bg-[#161b22] border-t border-zinc-800 text-center text-xs text-zinc-400 font-medium z-10">
          🎮 GameZone HTML5 • Server-Rendered Arcade Engine
        </footer>
      )}
    </div>
  );
}

