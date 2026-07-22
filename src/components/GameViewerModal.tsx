'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Maximize2, Minimize2, RefreshCw, HelpCircle, X, Sparkles, Keyboard } from 'lucide-react';
import ShadowGameContainer from './ShadowGameContainer';

interface GameViewerModalProps {
  title: string;
  gamePath?: string; // e.g. /games/2048/index.html
  gameHtml?: string; // Server-ingested HTML string
  controlsInfo?: string;
  proTip?: string;
  onBack?: () => void;
}

export default function GameViewerModal({ title, gamePath, gameHtml, controlsInfo, proTip, onBack }: GameViewerModalProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
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

  // Keyboard shortcut listeners (R = Restart, F = Fullscreen, C = Controls toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'r' || e.key === 'R') {
        handleRefresh();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        setShowControlsDrawer((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            title="Controls & Tips (Shortcut: C)"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Tips</span>
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game (Shortcut: R)"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-amber-500 text-amber-400 hover:text-amber-300 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Restart</span>
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (Shortcut: F)"
            className="p-2 sm:px-3.5 sm:py-2 bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Glassmorphism Floating Tips Panel */}
      {showControlsDrawer && (
        <div className="fixed top-[72px] left-3 right-3 sm:top-[80px] sm:left-auto sm:right-5 sm:w-[400px] z-50 animate-tips-slide-in text-white max-h-[70vh] overflow-y-auto font-sans">
          <div className="bg-[#0d1117]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">{title} — Tips</h3>
              <button
                onClick={() => setShowControlsDrawer(false)}
                className="ml-3 p-2 hover:bg-white/10 active:bg-white/20 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">

              {/* Controls Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 sm:px-5 sm:py-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400">Controls</span>
                </div>
                <p className="text-zinc-200 text-[13px] sm:text-sm leading-relaxed">
                  {controlsInfo || 'Use Onscreen Touch Controls or Keyboard Arrow Keys'}
                </p>
              </div>

              {/* Pro Tip Card */}
              {proTip && (
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-4 sm:px-5 sm:py-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-bold text-[11px] uppercase tracking-widest text-emerald-400">Pro Tip</span>
                  </div>
                  <p className="text-zinc-200 text-[13px] sm:text-sm leading-relaxed">
                    {proTip}
                  </p>
                </div>
              )}

            </div>

            {/* Footer — Keyboard Shortcuts */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 font-medium">
              <span><kbd className="inline-block min-w-[20px] text-center bg-white/10 text-zinc-300 rounded px-1.5 py-0.5 mr-1 font-mono text-[10px]">R</kbd> Restart</span>
              <span><kbd className="inline-block min-w-[20px] text-center bg-white/10 text-zinc-300 rounded px-1.5 py-0.5 mr-1 font-mono text-[10px]">F</kbd> Fullscreen</span>
              <span><kbd className="inline-block min-w-[20px] text-center bg-white/10 text-zinc-300 rounded px-1.5 py-0.5 mr-1 font-mono text-[10px]">C</kbd> Toggle</span>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Embedded Game Container — Padded below floating buttons */}
      <div className="w-full h-full relative flex items-center justify-center bg-[#090d16] pt-16 sm:pt-20 pb-4 px-2 sm:px-4">
        {gameHtml ? (
          <ShadowGameContainer key={key} htmlContent={gameHtml} isFullscreen={true} />
        ) : (
          <iframe
            key={key}
            src={gamePath}
            title={title}
            className="w-full h-full border-0 rounded-xl"
            allow="autoplay; keyboard"
          />
        )}
      </div>
    </div>
  );
}
