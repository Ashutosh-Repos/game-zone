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

      {/* Enhanced Floating Glassmorphic Controls & Pro Tips Drawer */}
      {showControlsDrawer && (
        <div className="fixed top-16 left-4 right-4 sm:top-20 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#161b22]/75 backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl shadow-2xl shadow-black/90 animate-fade-in text-zinc-100 max-h-[80vh] overflow-y-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-white truncate font-display">{title}</h3>
                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Arcade Guide &amp; Tips</p>
              </div>
            </div>
            <button
              onClick={() => setShowControlsDrawer(false)}
              className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            {/* Controls Input Card */}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
              <Keyboard className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">Controls &amp; Inputs</div>
                <p className="text-zinc-200 font-medium leading-relaxed text-xs">
                  {controlsInfo || 'Use Onscreen Touch Controls or Arrow Keys (W/A/S/D)'}
                </p>
              </div>
            </div>

            {/* Pro Strategy Tip Card */}
            {proTip && (
              <div className="bg-emerald-950/30 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Pro Strategy Tip</div>
                  <p className="text-emerald-100 font-medium leading-relaxed text-xs">
                    {proTip}
                  </p>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Footer */}
            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-200 border border-white/10 font-bold">R</kbd>
                <span>Restart</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-200 border border-white/10 font-bold">F</kbd>
                <span>Fullscreen</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-200 border border-white/10 font-bold">C</kbd>
                <span>Toggle</span>
              </div>
            </div>
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
