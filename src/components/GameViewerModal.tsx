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
    <div className="flex flex-col w-full h-full bg-[#0d1117] text-white overflow-hidden select-none pb-[env(safe-area-inset-bottom)]">
      {/* Top Controls Header — 44px Touch Targets for Mobile Fingers */}
      <header className="shrink-0 bg-[#161b22] border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 pt-[calc(env(safe-area-inset-top)+0.5rem)] z-10 shadow-md">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Back Button — 44px Min Touch Target Height */}
          <button
            onClick={handleBack}
            className="h-11 px-3.5 sm:px-4 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-zinc-100 border border-zinc-700/80 rounded-2xl transition text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Title */}
          <div className="text-center px-1 min-w-0 flex-1">
            <h2 className="font-bold text-xs sm:text-base text-white tracking-wide truncate max-w-36 sm:max-w-md mx-auto">{title}</h2>
          </div>

          {/* Right Action Controls — 44px Touch Target Height */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              title="How to Play / Controls"
              className="h-11 px-3 sm:px-3.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-indigo-400 hover:text-indigo-300 border border-zinc-700/80 rounded-2xl transition text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden md:inline">Controls</span>
            </button>
            <button
              onClick={handleRefresh}
              title="Restart Game"
              className="h-11 px-3 sm:px-3.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-amber-400 hover:text-amber-300 border border-zinc-700/80 rounded-2xl transition text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden md:inline">Restart</span>
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="h-11 px-3 sm:px-3.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-zinc-300 hover:text-white border border-zinc-700/80 rounded-2xl transition text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Controls Guide Drawer */}
      {showControlsDrawer && (
        <div className="bg-[#161b22] border-b border-indigo-500/40 px-4 sm:px-6 py-3.5 z-20 shadow-xl">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-200">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">🎮 Game Controls:</span>
              <span className="text-zinc-300 font-medium">{controlsInfo || 'Use Onscreen Touch Buttons or Keyboard Arrow Keys'}</span>
            </div>
            <button
              onClick={() => setShowControlsDrawer(false)}
              className="p-2 hover:bg-[#30363d] rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

      {/* Clean Bottom Footer — Touch Ergonomic Safe Margin */}
      {!isFullscreen && (
        <footer className="shrink-0 bg-[#161b22] border-t border-zinc-800/80 px-4 sm:px-6 py-2.5 min-h-[40px] flex items-center z-10">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">🕹️</span>
              <span className="font-bold text-zinc-200">GameZone Arcade</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 hidden sm:inline">HTML5 Canvas Engine</span>
            </div>
            <div className="text-zinc-500 text-xs">
              100% Server Rendered
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

