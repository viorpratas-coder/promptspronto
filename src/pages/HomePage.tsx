import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Search,
  X,
  Layers,
  Image as ImageIcon,
  ChevronDown,
  Filter,
  Check,
} from 'lucide-react';
import { Prompt, Category } from '../types';
import { PromptCard } from '../components/PromptCard';

interface HomePageProps {
  popularPrompts: Prompt[];
  recentPrompts: Prompt[];
  categories?: Category[];
  favoriteIds: string[];
  onNavigate: (tab: string, param?: any) => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onCopiedToast: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  popularPrompts,
  recentPrompts,
  categories = [],
  favoriteIds,
  onNavigate,
  onSelectPrompt,
  onCopiedToast,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  // Filter prompts smoothly in real-time
  const filteredPrompts = useMemo(() => {
    let list = recentPrompts;

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.prompt_text && p.prompt_text.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [recentPrompts, selectedCategory, searchTerm]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const isFiltering = searchTerm.trim().length > 0 || selectedCategory !== 'all';

  return (
    <div className="space-y-8 sm:space-y-12 pb-24">
      {/* 1. Hero Section: 100% Limpo e Minimalista em Uma Linha */}
      <section className="relative pt-8 sm:pt-14 pb-2 px-4 max-w-7xl mx-auto text-center select-none">
        {/* Glow dourado suave no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] h-[160px] sm:h-[240px] bg-[#d4af37]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Pack de{' '}
            <span className="bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
              Prompts
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            Clique na foto para abrir o card e copiar o comando com 1 clique
          </p>
        </div>
      </section>

      {/* 2. Prompts Mais Populares (exibido apenas se houver favoritos salvos e não estiver em busca) */}
      {!isFiltering && popularPrompts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                Prompts mais populares
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              className="text-xs font-semibold text-[#d4af37] hover:text-amber-300 transition-colors"
            >
              Ver salvos ({popularPrompts.length})
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {popularPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isFavorite={true}
                onSelect={onSelectPrompt}
                onCopiedToast={onCopiedToast}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Galeria de Prompts com Barra de Ferramentas Discreta e Elegante */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Cabeçalho da Galeria com Controles Integrados */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-3 border-b border-white/5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#d4af37]" />
              Galeria de Prompts
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt disponível' : 'prompts disponíveis'}
              {activeCategoryObj && ` em "${activeCategoryObj.name}"`}
            </p>
          </div>

          {/* Controles: Busca Compacta + Dropdown de Categorias */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Campo de Busca Compacto e Discreto */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prompt..."
                className="pl-8 pr-7 py-2 w-36 sm:w-48 focus:w-48 sm:focus:w-56 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#d4af37]/60 focus:bg-black/40 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Elegante de Categorias */}
            {categories.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedCategory !== 'all'
                      ? 'bg-[#d4af37]/15 border-[#d4af37]/50 text-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="max-w-[110px] sm:max-w-[140px] truncate">
                    {selectedCategory === 'all'
                      ? 'Todas as Categorias'
                      : activeCategoryObj?.name || 'Categoria'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      isCategoryOpen ? 'rotate-180 text-[#d4af37]' : ''
                    }`}
                  />
                </button>

                {/* Menu Suspenso Flutuante com Glassmorphism */}
                {isCategoryOpen && (
                  <div className="absolute right-0 mt-2 w-56 py-1.5 rounded-2xl bg-[#0c0e17]/95 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.8)] backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        Filtrar por Categoria
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-[#d4af37]/15 text-[#d4af37] font-semibold'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>Todas as Categorias</span>
                      {selectedCategory === 'all' && (
                        <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                      )}
                    </button>

                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                            isSelected
                              ? 'bg-[#d4af37]/15 text-[#d4af37] font-semibold'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tag para limpar filtro ativo */}
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="p-2 text-xs text-gray-400 hover:text-[#d4af37] hover:bg-white/5 rounded-xl border border-white/5 transition-colors"
                title="Limpar filtros"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grade de Prompts */}
        {filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isFavorite={favoriteIds.includes(prompt.id)}
                onSelect={onSelectPrompt}
                onCopiedToast={onCopiedToast}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-[#0f111a]/50 border border-white/5 space-y-3">
            <ImageIcon className="w-9 h-9 text-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-white">Nenhum prompt encontrado</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Não encontramos resultados para esta seleção. Tente mudar o termo de busca ou categoria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchTerm('');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] text-xs font-semibold transition-colors"
            >
              <span>Mostrar todos os prompts</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
