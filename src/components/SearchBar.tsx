import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onOpenFilter?: () => void;
  activeFilterCount?: number;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onOpenFilter,
  activeFilterCount = 0,
  placeholder = 'Busque estilos, categorias ou palavras-chave...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center gap-2 w-full ${className}`}>
      <div className="relative flex-1 flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-[#131622] border border-white/10 hover:border-white/20 focus:border-[#d4af37] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {onOpenFilter && (
        <button
          type="button"
          onClick={onOpenFilter}
          aria-label="Abrir filtros"
          className={`relative shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-3 rounded-xl border text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? 'bg-[#d4af37]/15 border-[#d4af37] text-amber-200 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
              : 'bg-[#131622] border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#d4af37] text-black font-bold text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
