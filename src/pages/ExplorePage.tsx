import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, Sparkles, Layers } from 'lucide-react';
import { Category, FilterOptions, Prompt } from '../types';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { PromptCard } from '../components/PromptCard';
import { EmptyState } from '../components/EmptyState';

interface ExplorePageProps {
  categories: Category[];
  prompts: Prompt[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onCopiedToast: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  categories,
  prompts,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectPrompt,
  onCopiedToast,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const activeFilterCount =
    (filters.category !== 'all' ? 1 : 0) +
    (filters.tool !== 'all' ? 1 : 0) +
    (filters.access !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'recent' ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            Explorar Catálogo
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Descubra mais de centenas de fórmulas prontas com parâmetros exatos
          </p>
        </div>

        {/* Search Bar + Filters button */}
        <div className="w-full md:w-96">
          <SearchBar
            value={filters.search}
            onChange={(val) => onFilterChange({ ...filters, search: val })}
            onOpenFilter={() => setIsFilterOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>

      {/* Seletor de Categorias Completo e Responsivo (sem cortes na tela) */}
      <div className="bg-[#0f111a]/90 border border-white/5 rounded-2xl p-3 sm:p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="font-semibold text-gray-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
            Categorias ({categories.length})
          </span>
          {filters.category !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, category: 'all' })}
              className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1 font-medium"
            >
              Ver todas as categorias
            </button>
          )}
        </div>

        {/* Categorias com quebra fluida (flex-wrap): Todas ficam 100% visíveis em qualquer tela */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, category: 'all' })}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              filters.category === 'all'
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.25)] ring-1 ring-[#d4af37]/40'
                : 'bg-[#151824] border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#1a1e2e]'
            }`}
          >
            <span>Todas</span>
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    category: isSelected ? 'all' : cat.id,
                  })
                }
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.25)] ring-1 ring-[#d4af37]/40'
                    : 'bg-[#151824] border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#1a1e2e]'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar: Active tags, count and sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-semibold text-white">{prompts.length}</span>
          <span>{prompts.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}</span>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar filtros ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Quick sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Ordenar:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
            className="bg-[#12141e] text-xs font-medium text-gray-300 border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais populares</option>
            <option value="alpha">Ordem alfabética (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Prompts Grid */}
      {prompts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSelect={onSelectPrompt}
              onCopiedToast={onCopiedToast}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum prompt encontrado"
          description="Tente ajustar os filtros ou digitar termos de pesquisa diferentes para encontrar mais resultados."
          actionLabel="Redefinir todos os filtros"
          onAction={onResetFilters}
        />
      )}

      {/* Filter modal drawer */}
      <FilterPanel
        categories={categories}
        filters={filters}
        onChange={onFilterChange}
        onReset={onResetFilters}
        totalResults={prompts.length}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
};
