import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: any) => void;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  favoritesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#07080c]/90 backdrop-blur-md border-b border-white/8 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1c1f2e] to-[#0c0d14] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:border-[#d4af37] transition-all">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-wider text-white group-hover:text-amber-100 transition-colors">
                VIOOR PROMPTS
              </span>
            </div>
            <p className="text-[9px] text-[#d4af37]/90 tracking-wider uppercase font-semibold">
              Edições para ChatGPT & Gemini
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {[
            { id: 'home', label: 'Início' },
            { id: 'favorites', label: 'Favoritos', count: favoritesCount },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'text-[#d4af37] bg-[#d4af37]/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {Boolean(item.count) && item.count! > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#d4af37] text-black font-bold">
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Mobile favorites quick shortcut */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className="md:hidden relative p-2 rounded-xl text-gray-300 hover:text-white border border-white/5"
            aria-label="Ver favoritos"
          >
            <Heart className="w-4 h-4 text-rose-400" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 rounded-full text-[9px] bg-[#d4af37] text-black font-bold">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
