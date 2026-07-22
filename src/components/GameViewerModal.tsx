'use client';

import React, { useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, RefreshCw, HelpCircle, X } from 'lucide-react';

interface GameViewerModalProps {
  title: string;
  gamePath: string; // e.g. /games/2048/index.html
  controlsInfo?: string;
  onBack: () => void;
}

export default function GameViewerModal({ title, gamePath, controlsInfo, onBack }: GameViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-screen h-dvh bg-[#0d1117] text-white overflow-hidden select-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      {/* Top Controls Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-zinc-800 z-10 shadow-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-300 active:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition border border-zinc-700/50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </button>

        <div className="text-center px-2">
          <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide truncate max-w-40 sm:max-w-xs">{title}</h2>
          <p className="text-[9px] text-emerald-400 font-medium">HTML5 Web Game</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            title="How to Play / Controls"
            className="p-2 bg-zinc-800 active:bg-zinc-700 rounded-xl transition text-indigo-400 active:text-indigo-200 border border-zinc-700/50 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game"
            className="p-2 bg-zinc-800 active:bg-zinc-700 rounded-xl transition text-zinc-400 active:text-white border border-zinc-700/50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 bg-zinc-800 active:bg-zinc-700 rounded-xl transition text-zinc-400 active:text-white border border-zinc-700/50 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Controls Guide Drawer */}
      {showControlsDrawer && (
        <div className="bg-[#161b22] border-b border-indigo-500/30 px-4 py-3 text-xs text-zinc-200 flex items-center justify-between z-20 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">🎮 Controls:</span>
            <span className="text-zinc-300 font-medium">{controlsInfo || 'Use Onscreen Touch Buttons or Arrow Keys'}</span>
          </div>
          <button
            onClick={() => setShowControlsDrawer(false)}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Embedded Game Viewer */}
      <div className={`flex-1 min-h-0 overflow-hidden relative flex items-center justify-center bg-[#090d16] ${isFullscreen ? 'p-0' : 'p-1 sm:p-3'}`}>
        <iframe
          key={key}
          src={gamePath}
          title={title}
          className={`w-full h-full border-0 transition-all duration-200 ${
            isFullscreen ? 'rounded-none' : 'rounded-xl shadow-2xl'
          }`}
          allow="autoplay; keyboard"
        />
      </div>
    </div>
  );
}
