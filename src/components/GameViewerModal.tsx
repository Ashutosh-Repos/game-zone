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
      {/* Top Glassmorphic Console Header */}
      <header className="shrink-0 bg-[#161b22]/90 backdrop-blur-xl border-b border-zinc-800/90 px-4 sm:px-8 py-3.5 z-20 shadow-xl shadow-black/40">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-6">
          {/* Back to Hub Button */}
          <button
            onClick={handleBack}
            className="group inline-flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-zinc-200 hover:text-white border border-zinc-700/60 px-4 py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Hub</span>
          </button>

          {/* Game Title with Gradient Typography */}
          <div className="text-center min-w-0 flex-1 flex flex-col items-center">
            <h2 className="font-extrabold text-sm sm:text-base bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent tracking-wide truncate max-w-48 sm:max-w-md">
              {title}
            </h2>
          </div>

          {/* Right Action Control Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              title="How to Play / Controls"
              className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-indigo-400 hover:text-indigo-300 border border-zinc-700/60 px-3.5 py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm cursor-pointer active:scale-95"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Controls</span>
            </button>
            <button
              onClick={handleRefresh}
              title="Restart Game"
              className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-amber-400 hover:text-amber-300 border border-zinc-700/60 px-3.5 py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Restart</span>
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#363c46] text-zinc-300 hover:text-white border border-zinc-700/60 px-3.5 py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm cursor-pointer active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Controls Guide Drawer */}
      {showControlsDrawer && (
        <div className="bg-[#161b22]/95 backdrop-blur-xl border-b border-indigo-500/30 px-4 sm:px-8 py-3.5 z-20 shadow-2xl animate-fade-in">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-200">
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
        </div>
      )}

      {/* Embedded Game Container */}
      <div className={`flex-1 min-h-0 overflow-hidden relative flex items-center justify-center bg-[#090d16] ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
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

      {/* Modern Console Footer */}
      {!isFullscreen && (
        <footer className="shrink-0 bg-[#161b22]/90 backdrop-blur-md border-t border-zinc-800/80 px-4 sm:px-8 py-3 z-20 shadow-inner">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">🕹️</span>
              <span className="font-bold text-zinc-200 tracking-wide">GameZone Arcade Engine</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 hidden sm:inline">HTML5 Canvas</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Live Engine</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

