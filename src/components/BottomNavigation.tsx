import React from 'react';
import { Home, Heart } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  favoritesCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onNavigate,
  favoritesCount,
}) => {
  const tabs = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'favorites', label: 'Salvos', icon: Heart, count: favoritesCount },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090e]/95 backdrop-blur-xl border-t border-white/8 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-2 h-16 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isFav = tab.id === 'favorites';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className="relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? isFav
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-[#d4af37]'
                      : 'text-gray-400'
                  }`}
                />
                {Boolean(tab.count) && tab.count! > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] bg-[#d4af37] text-black font-extrabold shadow-sm min-w-[14px] text-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-[#d4af37] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
