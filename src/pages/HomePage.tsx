import React from 'react';
import { ArrowRight, TrendingUp, Clock, Heart } from 'lucide-react';
import { Prompt } from '../types';
import { PromptCard } from '../components/PromptCard';

interface HomePageProps {
  popularPrompts: Prompt[];
  recentPrompts: Prompt[];
  favoriteIds: string[];
  onNavigate: (tab: string, param?: any) => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onCopiedToast: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  popularPrompts,
  recentPrompts,
  favoriteIds,
  onNavigate,
  onSelectPrompt,
  onCopiedToast,
}) => {
  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. Primeira Seção: Apenas o Título Principal Limpo */}
      <section className="relative pt-6 sm:pt-12 pb-2 px-4 max-w-7xl mx-auto text-center">
        {/* Glow de fundo sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[500px] h-[200px] sm:h-[300px] bg-[#d4af37]/8 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Edite suas fotos com <br />
            <span className="bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
              ChatGPT, Gemini e IA
            </span>
          </h1>
        </div>
      </section>

      {/* 2. Seção: Prompts Mais Populares (Apenas se houver prompts marcados como favoritos) */}
      {popularPrompts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#d4af37]" />
                Prompts mais populares
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Os prompts marcados como favoritos
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              className="text-xs font-semibold text-[#d4af37] hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {popularPrompts.slice(0, 8).map((prompt) => (
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

      {/* 3. Seção: Adicionados Recentemente (Os que adicionei por último) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#d4af37]" />
              Adicionados recentemente
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              As últimas novidades e criações adicionadas ao catálogo
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore', { sortBy: 'recent' })}
            className="text-xs font-semibold text-[#d4af37] hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {recentPrompts.slice(0, 8).map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isFavorite={favoriteIds.includes(prompt.id)}
              onSelect={onSelectPrompt}
              onCopiedToast={onCopiedToast}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
