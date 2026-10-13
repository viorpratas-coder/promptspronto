import React from 'react';
import { X, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Category, FilterOptions } from '../types';

interface FilterPanelProps {
  categories: Category[];
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onReset: () => void;
  totalResults: number;
  isOpen: boolean;
  onClose: () => void;
}

const TOOLS_LIST = [
  'Midjourney v6',
  'Flux.1 Schnell / Dev',
  'Stable Diffusion XL',
  'DALL-E 3',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  filters,
  onChange,
  onReset,
  totalResults,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.tool !== 'all' ||
    filters.access !== 'all' ||
    filters.sortBy !== 'recent';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0d0f17] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Filtros de Busca</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalResults} {totalResults === 1 ? 'edição encontrada' : 'edições encontradas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Acesso (Grátis / Premium) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-2.5">
              Tipo de Acesso
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'free', label: 'Gratuitos' },
                { id: 'premium', label: 'Pro / Exclusivo' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...filters, access: opt.id as any })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    filters.access === opt.id
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-2.5">
              Ordenar Por
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'recent', label: 'Recentes' },
                { id: 'popular', label: 'Populares' },
                { id: 'alpha', label: 'A-Z' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...filters, sortBy: opt.id as any })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    filters.sortBy === opt.id
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ferramenta de IA */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-2.5">
              Ferramenta Recomendada
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filters, tool: 'all' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.tool === 'all'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200'
                    : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                }`}
              >
                Todas Ferramentas
              </button>
              {TOOLS_LIST.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => onChange({ ...filters, tool: filters.tool === tool ? 'all' : tool })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filters.tool.toLowerCase() === tool.toLowerCase()
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200'
                      : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-2.5">
              Categorias
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filters, category: 'all' })}
                className={`p-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                  filters.category === 'all'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200'
                    : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                }`}
              >
                <span>Todas</span>
                {filters.category === 'all' && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange({ ...filters, category: filters.category === cat.id ? 'all' : cat.id })}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                    filters.category === cat.id
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200'
                      : 'bg-[#131622] border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {filters.category === cat.id && <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0c0e15] flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e5c35b] text-slate-950 font-semibold text-xs tracking-wide text-center hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(212,175,55,0.25)]"
          >
            VER RESULTADOS ({totalResults})
          </button>
        </div>
      </div>
    </div>
  );
};
