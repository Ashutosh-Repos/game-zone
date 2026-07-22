'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Star, X } from 'lucide-react';
import { VALID_PASSCODES } from '@/lib/constants';
import GameViewerModal from './GameViewerModal';

// ── GameZone Catalogue ─────────────────────────────────────────────
type GameId = 'invaders' | 'asteroids' | 'sinuous' | '2048' | 'hextris' | 'clumsy' | 'tower' | 'pacman' | 'tetris' | 'breakout';
type Category = 'all' | 'arcade' | 'puzzle' | 'retro' | 'space';

interface GameEntry {
  id: GameId;
  title: string;
  desc: string;
  icon: string;
  category: Category;
  tag: string;
  rating: string;
  levels: string;
  controls: string;
  localPath: string;
}

const GAMES: GameEntry[] = [
  { id: 'invaders',  title: 'Space Invaders',      desc: 'Classic Space Invaders arcade game. Marching alien grids, laser audio & bunker shields!', icon: '👾', category: 'arcade',   tag: 'Arcade Legend', rating: '5.0', levels: 'Alien Waves', controls: 'Touch Buttons ◄ ► 💥 or Arrow Keys + Space', localPath: '/games/space-invaders/index.html' },
  { id: 'asteroids', title: 'Asteroids 2D',        desc: 'Vector Asteroids shooter. Newtonian thrust physics, laser cannons & particle explosions!', icon: '🚀', category: 'space',    tag: 'Space Vector', rating: '4.9', levels: 'Wave Progression', controls: 'Touch Buttons ↺ 🚀 ↻ 💥 or Arrow Keys', localPath: '/games/asteroids/index.html' },
  { id: 'sinuous',   title: 'Sinuous',             desc: 'Particle evasion arcade game. Dodge red dots & capture shield nodes!', icon: '🔴', category: 'arcade',   tag: 'Particle Evasion', rating: '4.9', levels: 'Endless Survival', controls: 'Drag Finger / Mouse to Dodge', localPath: '/games/sinuous/index.html' },
  { id: '2048',      title: '2048 Official',       desc: 'The official 2048 puzzle game. Join tiles, reach 2048!', icon: '🧩', category: 'puzzle',   tag: 'Official 2048', rating: '5.0', levels: 'High Score', controls: 'Swipe Screen or Arrow Keys', localPath: '/games/2048/index.html' },
  { id: 'hextris',   title: 'Hextris',             desc: 'Fast-paced hexagonal Tetris puzzle game. Rotate hex to match 3 blocks!', icon: '🔷', category: 'puzzle',   tag: 'Hexagonal Tetris', rating: '4.9', levels: 'Endless Combo', controls: 'Tap Left/Right Screen or Arrow Keys', localPath: '/games/hextris/index.html' },
  { id: 'clumsy',    title: 'Clumsy Bird',         desc: 'Flappy Bird canvas runner. Fly past pipes & set high scores!', icon: '🐤', category: 'arcade',   tag: 'Flappy Bird', rating: '4.8', levels: 'High Score', controls: 'Tap Screen or Spacebar to Flap', localPath: '/games/clumsy-bird/index.html' },
  { id: 'tower',     title: 'Tower Stack',         desc: 'Physics tower stacking game. Precise timing & color themes.', icon: '🏗️', category: 'arcade',   tag: 'Tower Physics', rating: '4.9', levels: 'Endless Stack', controls: 'Tap Screen or Spacebar to Drop', localPath: '/games/tower/index.html' },
  { id: 'pacman',    title: 'Pac-Man HTML5',       desc: 'Classic Pac-Man. Navigate mazes, eat dots & outsmart 4 ghost AIs!', icon: '👻', category: 'retro',    tag: 'Classic Arcade', rating: '5.0', levels: 'Arcade Stages', controls: 'D-Pad ▲ ◄ ► ▼ or Arrow Keys', localPath: '/games/pacman/index.html' },
  { id: 'tetris',    title: 'Classic Tetris',      desc: 'Popular HTML5 Tetris. Clear lines, preview next pieces, and level up!', icon: '🧱', category: 'puzzle',   tag: 'Classic Tetris', rating: '4.9', levels: 'Speed Levels', controls: 'Touch Buttons ◄ 🔄 ⬇ ► or Arrow Keys', localPath: '/games/tetris/index.html' },
  { id: 'breakout',  title: 'Breakout Deluxe',     desc: 'Classic Breakout brick breaker. Destroy bricks, catch power-ups!', icon: '⚡', category: 'retro',    tag: 'Breakout', rating: '4.7', levels: 'Brick Stages', controls: 'Drag Paddle / Mouse or Arrow Keys', localPath: '/games/breakout/index.html' },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',      label: '🔥 All Games' },
  { id: 'arcade',   label: '🕹️ Arcade Classics' },
  { id: 'space',    label: '🚀 Space & Action' },
  { id: 'puzzle',   label: '🧩 Puzzle & Brain' },
  { id: 'retro',    label: '👾 Retro Games' },
];

// ── Stealth Trigger Logic ──────────────────────────────────────────
interface StudyPulseFacadeProps {
  onSecretTriggered: (passcode: string) => void;
}

export default function StudyPulseFacade({ onSecretTriggered }: StudyPulseFacadeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  // Stealth trigger
  const logoClickCountRef = useRef(0);
  const [isVaultPrimed, setIsVaultPrimed] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try { const s = sessionStorage.getItem('sp_ui_prefs'); return s ? JSON.parse(s).fa || 0 : 0; } catch { return 0; }
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try { const s = sessionStorage.getItem('sp_ui_prefs'); return s ? JSON.parse(s).lu || 0 : 0; } catch { return 0; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('sp_ui_prefs', JSON.stringify({ fa: failedAttempts, lu: lockoutUntil })); } catch { /**/ }
  }, [failedAttempts, lockoutUntil]);

  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unprimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    logoClickCountRef.current += 1;
    if (logoClickCountRef.current >= 3) {
      setIsVaultPrimed(true);
      if (unprimeTimerRef.current) clearTimeout(unprimeTimerRef.current);
      unprimeTimerRef.current = setTimeout(() => setIsVaultPrimed(false), 30000);
      logoClickCountRef.current = 0;
    }
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => { logoClickCountRef.current = 0; }, 2000);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (failCheckTimerRef.current) clearTimeout(failCheckTimerRef.current);
    if (Date.now() < lockoutUntil) return;
    if (!isVaultPrimed) return;
    const matched = VALID_PASSCODES.find((code) => val.includes(code));
    if (matched) {
      setSearchQuery(''); setFailedAttempts(0); setIsVaultPrimed(false);
      onSecretTriggered(matched);
    } else if (val.length >= 4) {
      failCheckTimerRef.current = setTimeout(() => {
        if (!VALID_PASSCODES.some((c) => c.includes(val))) {
          setFailedAttempts((prev) => {
            const next = prev + 1;
            if (next >= 3) setLockoutUntil(Date.now() + 60000);
            return next;
          });
        }
      }, 500);
    }
  };

  // Filter games
  const filtered = GAMES.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q);
    const matchCat = activeCategory === 'all' || g.category === activeCategory;
    return matchSearch && matchCat;
  });

  const getCategoryCount = (catId: Category) => {
    if (catId === 'all') return GAMES.length;
    return GAMES.filter((g) => g.category === catId).length;
  };

  const selectedGameEntry = GAMES.find((g) => g.id === activeGame);

  // ── Active game viewer modal ──────────────────────
  if (activeGame && selectedGameEntry) {
    return (
      <GameViewerModal
        title={selectedGameEntry.title}
        gamePath={selectedGameEntry.localPath}
        controlsInfo={selectedGameEntry.controls}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  // ── Game Hub Portal ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-10 bg-[#0d1117] text-zinc-100 flex flex-col font-sans overflow-hidden select-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      {/* Navbar */}
      <header className="shrink-0 bg-[#161b22] border-b border-zinc-800 px-4 py-3 shadow-md z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Combined Brand Title + Description — Triple Tap Stealth Trigger */}
          <div onClick={handleLogoClick} className="cursor-pointer group shrink-0 select-none">
            <span className="font-extrabold tracking-tight text-white text-base block leading-snug group-hover:text-indigo-300 transition">GameZone</span>
            <p className="text-[10px] text-zinc-500 leading-tight">Arcade &amp; Casual Games</p>
          </div>

          {/* Search Bar with Interactive X Clear Button */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text" value={searchQuery} onChange={handleSearchChange}
              placeholder="Search games..."
              className="w-full bg-[#0d1117] border border-zinc-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-md transition"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
          {/* Featured banner — Space Invaders */}
          <div
            className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 border border-emerald-500/40 p-5 flex items-center justify-between cursor-pointer hover:from-emerald-500 hover:to-teal-600 transition group shadow-lg"
            onClick={() => setActiveGame('invaders')}
          >
            <div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mb-1 block">🔥 Featured Arcade Legend</span>
              <h2 className="text-lg font-black text-white">Space Invaders HTML5</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-xs">Defend Earth from marching alien grids! Laser sound synth, bunker shields & alien waves.</p>
              <button className="mt-3 flex items-center gap-1.5 bg-white text-teal-800 text-xs font-bold px-4 py-2 rounded-xl shadow-md group-hover:bg-teal-50 transition">
                <Play className="w-3.5 h-3.5 fill-current" /> Play Space Invaders Now
              </button>
            </div>
            <div className="text-7xl opacity-90 group-hover:scale-110 transition duration-300 select-none">👾</div>
          </div>

          {/* Category Tabs with Dynamic Count Badges */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat.id);
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-[#161b22] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-zinc-800'
                  }`}>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeCategory === cat.id ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((game) => (
              <div key={game.id}
                onClick={() => setActiveGame(game.id)}
                className="bg-[#161b22] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-[#1a2030] transition duration-200 flex flex-col justify-between group shadow-sm hover:shadow-lg cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200 select-none">
                      {game.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5 justify-end">
                        <Star className="w-3 h-3 fill-amber-400" /> {game.rating}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">{game.levels}</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1 group-hover:text-indigo-300 transition">{game.title}</h3>
                  <span className="inline-block text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 mb-2">{game.tag}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{game.desc}</p>
                </div>
                <div className="flex items-center justify-end pt-4 mt-3 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5 bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-current" /> Play
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <div className="text-3xl mb-2">🎮</div>
              <p className="text-sm">No games found for &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Clear search query
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-4 text-[11px] text-zinc-700 border-t border-zinc-900">
            GameZone — {GAMES.length} Arcade Classics • Free Web Games
          </div>
        </div>
      </div>
    </div>
  );
}
