'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'arcadezone_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
      setThemeState(saved);
    } else {
      setThemeState('dark'); // Default to sleek dark mode
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let activeTheme: 'dark' | 'light' = 'dark';
      if (theme === 'system') {
        activeTheme = systemQuery.matches ? 'dark' : 'light';
      } else {
        activeTheme = theme;
      }

      setResolvedTheme(activeTheme);

      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    systemQuery.addEventListener('change', handleSystemChange);
    return () => systemQuery.removeEventListener('change', handleSystemChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeToggle({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      style={{ padding: 8, ...style }}
      className={`rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
        resolvedTheme === 'dark'
          ? 'bg-[#161b22]/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-700/80 shadow-md'
          : 'bg-white hover:bg-slate-100 text-indigo-600 border border-slate-300 shadow-xs'
      } ${className}`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
