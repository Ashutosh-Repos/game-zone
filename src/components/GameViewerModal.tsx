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
      {/* Top Glassmorphic Controls Header */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#161b22]/90 backdrop-blur-md border-b border-zinc-800/80 z-10 shadow-xl">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 px-3.5 py-1.5 rounded-xl transition text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </button>

        <div className="text-center px-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
          <div>
            <h2 className="font-black text-xs sm:text-sm text-white tracking-wide truncate max-w-36 sm:max-w-xs">{title}</h2>
          </div>
          <span className="hidden md:inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
            HTML5 Arcade
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            title="How to Play / Controls"
            className="flex items-center gap-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-indigo-400 hover:text-indigo-300 border border-zinc-700/60 px-2.5 sm:px-3 py-1.5 rounded-xl transition text-xs font-semibold shadow-sm active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Controls</span>
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game"
            className="flex items-center gap-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-400 hover:text-amber-300 border border-zinc-700/60 px-2.5 sm:px-3 py-1.5 rounded-xl transition text-xs font-semibold shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restart</span>
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="flex items-center gap-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 px-2.5 sm:px-3 py-1.5 rounded-xl transition text-xs font-semibold shadow-sm active:scale-95 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Controls Guide Drawer */}
      {showControlsDrawer && (
        <div className="bg-[#161b22] border-b border-indigo-500/40 px-4 py-3 text-xs text-zinc-200 flex items-center justify-between z-20 animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">🎮 Game Controls:</span>
            <span className="text-zinc-300 font-medium">{controlsInfo || 'Use Onscreen Touch Buttons or Keyboard Arrow Keys'}</span>
          </div>
          <button
            onClick={() => setShowControlsDrawer(false)}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
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

      {/* Premium Bottom Footer */}
      {!isFullscreen && (
        <footer className="shrink-0 py-2 px-4 bg-[#161b22]/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-medium z-10 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-sm select-none">🕹️</span>
            <span className="font-bold text-zinc-200 tracking-tight">GameZone Arcade Engine</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-emerald-400 font-semibold hidden sm:inline">Server-Rendered HTML5</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero Latency • Live</span>
          </div>
        </footer>
      )}
    </div>
  );
}

