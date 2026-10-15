import React, { useState } from 'react';
import { Heart, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { Prompt } from '../types';
import { PromptCard } from '../components/PromptCard';
import { EmptyState } from '../components/EmptyState';
import { storageService } from '../services/storageService';

interface FavoritesPageProps {
  favoritePrompts: Prompt[];
  onSelectPrompt: (p: Prompt) => void;
  onNavigate: (tab: string) => void;
  onRefreshFavorites: () => void;
  onCopiedToast: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favoritePrompts,
  onSelectPrompt,
  onNavigate,
  onRefreshFavorites,
  onCopiedToast,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleClearAll = () => {
    storageService.clearFavorites();
    onRefreshFavorites();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            Prompts Salvos
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Sua biblioteca pessoal de referências para acesso rápido
          </p>
        </div>

        {favoritePrompts.length > 0 && (
          <div>
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Favoritos</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300">Confirmar limpeza?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Sim, limpar
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid of Favorites */}
      {favoritePrompts.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            {favoritePrompts.length} {favoritePrompts.length === 1 ? 'prompt salvo' : 'prompts salvos'} no seu dispositivo
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {favoritePrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isFavorite={true}
                onSelect={onSelectPrompt}
                onFavoriteChange={onRefreshFavorites}
                onCopiedToast={onCopiedToast}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <EmptyState
            icon={<Heart className="w-7 h-7 text-rose-400" />}
            title="Nenhum prompt salvo ainda"
            description="Toque no ícone de coração em qualquer card ou página de detalhe para guardar suas referências favoritas."
            actionLabel="Ver Galeria de Prompts"
            onAction={() => onNavigate('home')}
          />

          {/* Quick guide on how to favorite */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#12141e] border border-white/8 text-center space-y-2">
            <Sparkles className="w-5 h-5 text-[#d4af37] mx-auto" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Como funciona o salvamento?
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Seus favoritos ficam salvos automaticamente na memória do seu navegador (localStorage). Quando você fizer login com o Supabase, eles são sincronizados com a nuvem.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
