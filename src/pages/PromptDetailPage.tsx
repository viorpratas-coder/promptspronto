import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Prompt } from '../types';
import { CopyPromptButton } from '../components/CopyPromptButton';
import { PromptCard } from '../components/PromptCard';
import { storageService } from '../services/storageService';
import { promptService } from '../services/promptService';

interface PromptDetailPageProps {
  prompt: Prompt;
  relatedPrompts: Prompt[];
  onBack: () => void;
  onSelectPrompt: (p: Prompt) => void;
  onCopiedToast: () => void;
}

export const PromptDetailPage: React.FC<PromptDetailPageProps> = ({
  prompt,
  relatedPrompts,
  onBack,
  onSelectPrompt,
  onCopiedToast,
}) => {
  const [isFav, setIsFav] = useState<boolean>(() => storageService.isFavorite(prompt.id));
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);

  useEffect(() => {
    // Record view in service
    promptService.recordView(prompt.id);
    setIsFav(storageService.isFavorite(prompt.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleFavUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ promptId?: string; isFavorite?: boolean }>;
      if (customEvent?.detail?.promptId) {
        if (customEvent.detail.promptId === prompt.id) {
          setIsFav(Boolean(customEvent.detail.isFavorite));
        }
      } else {
        setIsFav(storageService.isFavorite(prompt.id));
      }
    };

    window.addEventListener('favorites-updated', handleFavUpdated);
    return () => {
      window.removeEventListener('favorites-updated', handleFavUpdated);
    };
  }, [prompt.id]);

  const handleToggleFavorite = () => {
    const nextState = !isFav;
    setIsFav(nextState);
    storageService.toggleFavorite(prompt.id).then((val) => {
      setIsFav(val);
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt.title,
          text: `Confira este prompt de edição: ${prompt.title}`,
          url,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    // Fallback: copy current URL
    navigator.clipboard.writeText(url).then(() => {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-24">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Compartilhar Prompt"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isShareCopied ? 'Link Copiado!' : 'Compartilhar'}
            </span>
          </button>

          {/* Favorite button */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isFav
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-md'
                : 'bg-white/5 text-gray-300 hover:text-white border-white/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFav ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {prompt.title}
        </h1>
      </div>

      {/* Foto Editada em Proporção Maior */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#090b12] border border-white/10 shadow-2xl p-2 sm:p-4 flex items-center justify-center overflow-hidden">
        <img
          src={prompt.cover_image}
          alt={prompt.title}
          className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-xl sm:rounded-2xl shadow-lg select-none"
          loading="eager"
        />
      </div>

      {/* Caixa do Prompt a Ser Copiado */}
      <div className="rounded-2xl bg-[#12141e] border border-white/10 shadow-xl overflow-hidden">
        {/* Header da Caixa */}
        <div className="px-5 py-3.5 bg-[#171a27] border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Prompt para Copiar
            </span>
          </div>

          <CopyPromptButton
            promptText={prompt.prompt_text}
            promptId={prompt.id}
            variant="compact"
            onCopied={onCopiedToast}
          />
        </div>

        {/* Texto do Prompt */}
        <div className="p-5 sm:p-6 bg-[#0a0b10] space-y-4">
          <div className="p-4 sm:p-5 rounded-xl bg-[#131622] border border-white/10 select-text">
            <p className="text-sm sm:text-base text-gray-100 font-mono leading-relaxed break-words select-all whitespace-pre-wrap">
              {prompt.prompt_text}
            </p>
          </div>

          {/* Botão de Cópia Principal */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clique no botão para copiar o comando e colar no chat</span>
            </div>

            <CopyPromptButton
              promptText={prompt.prompt_text}
              promptId={prompt.id}
              className="w-full sm:w-auto"
              onCopied={onCopiedToast}
            />
          </div>
        </div>
      </div>

      {/* Outros Prompts Recomendados */}
      {relatedPrompts.length > 0 && (
        <div className="pt-8 border-t border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            Outros Prompts Recomendados
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedPrompts.slice(0, 4).map((rel) => (
              <PromptCard
                key={rel.id}
                prompt={rel}
                onSelect={onSelectPrompt}
                onCopiedToast={onCopiedToast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
