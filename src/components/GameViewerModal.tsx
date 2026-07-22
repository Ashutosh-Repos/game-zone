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
      <div
        className="absolute z-30 flex items-center justify-between pointer-events-none"
        style={{ top: 16, left: 16, right: 16, gap: 8 }}
      >
        {/* Left: Back Button */}
        <button
          onClick={handleBack}
          className="pointer-events-auto group inline-flex items-center bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white rounded-xl transition-all duration-200 font-extrabold shadow-2xl cursor-pointer active:scale-95 shrink-0"
          style={{ padding: '10px 20px', gap: 8, fontSize: 13 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        {/* Center: Title Badge */}
        <div
          className="pointer-events-auto hidden xs:flex items-center bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl max-w-xs sm:max-w-md"
          style={{ padding: '8px 16px' }}
        >
          <h2 className="font-extrabold text-white tracking-wide truncate" style={{ fontSize: 13 }}>
            {title}
          </h2>
        </div>

        {/* Right: Floating Control Buttons */}
        <div className="pointer-events-auto flex items-center shrink-0" style={{ gap: 6 }}>
          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            title="Controls & Tips (Shortcut: C)"
            className="bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all duration-200 font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center"
            style={{ padding: 8, gap: 6, fontSize: 13 }}
          >
            <HelpCircle style={{ width: 16, height: 16 }} />
            <span className="hidden md:inline">Tips</span>
          </button>
          <button
            onClick={handleRefresh}
            title="Restart Game (Shortcut: R)"
            className="bg-[#161b22]/90 backdrop-blur-xl border border-zinc-700/80 hover:border-amber-500 text-amber-400 hover:text-amber-300 rounded-xl transition-all duration-200 font-semibold shadow-2xl cursor-pointer active:scale-95 flex items-center"
            style={{ padding: 8, gap: 6, fontSize: 13 }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            <span className="hidden md:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Glassmorphism Floating Tips Panel */}
      {showControlsDrawer && (
        <div
          className="fixed z-50 animate-tips-slide-in text-white overflow-y-auto font-sans"
          style={{ top: 56, left: 12, right: 12, maxHeight: '75vh' }}
        >
          <div
            style={{
              background: 'rgba(13,17,23,0.94)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              padding: '10px 14px 14px',
            }}
          >

            {/* Close button — floated top right */}
            <button
              onClick={() => setShowControlsDrawer(false)}
              className="hover:bg-white/10 active:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              style={{ float: 'right', padding: 4, borderRadius: 6, marginLeft: 8 }}
              title="Close"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>

            {/* Controls Section */}
            <div style={{ marginBottom: 14 }}>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                <Keyboard className="text-indigo-400 shrink-0" style={{ width: 14, height: 14 }} />
                <span className="font-bold uppercase tracking-widest text-zinc-400" style={{ fontSize: 10 }}>Controls</span>
              </div>
              <p className="text-zinc-200 leading-relaxed" style={{ fontSize: 13 }}>
                {controlsInfo || 'Use Onscreen Touch Controls or Keyboard Arrow Keys'}
              </p>
            </div>

            {/* Pro Tip Section */}
            {proTip && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, marginBottom: 14 }}>
                <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                  <Sparkles className="text-emerald-400 shrink-0" style={{ width: 14, height: 14 }} />
                  <span className="font-bold uppercase tracking-widest text-emerald-400" style={{ fontSize: 10 }}>Pro Tip</span>
                </div>
                <p className="text-zinc-200 leading-relaxed" style={{ fontSize: 13 }}>
                  {proTip}
                </p>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div
              className="flex items-center justify-between text-zinc-500 font-medium"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 12,
                fontSize: 11,
              }}
            >
              <span><kbd style={{ background: 'rgba(255,255,255,0.1)', color: '#d4d4d8', borderRadius: 4, padding: '2px 6px', marginRight: 5, fontFamily: 'monospace', fontSize: 10 }}>R</kbd> Restart</span>
              <span><kbd style={{ background: 'rgba(255,255,255,0.1)', color: '#d4d4d8', borderRadius: 4, padding: '2px 6px', marginRight: 5, fontFamily: 'monospace', fontSize: 10 }}>F</kbd> Fullscreen</span>
              <span><kbd style={{ background: 'rgba(255,255,255,0.1)', color: '#d4d4d8', borderRadius: 4, padding: '2px 6px', marginRight: 5, fontFamily: 'monospace', fontSize: 10 }}>C</kbd> Toggle</span>
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
