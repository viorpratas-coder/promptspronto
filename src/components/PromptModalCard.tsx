import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Heart,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import { Prompt } from '../types';
import { storageService } from '../services/storageService';
import { promptService } from '../services/promptService';

interface PromptModalCardProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
  promptsList?: Prompt[];
  onSelectPrompt?: (prompt: Prompt) => void;
  onCopiedToast?: () => void;
}

export const PromptModalCard: React.FC<PromptModalCardProps> = ({
  prompt,
  isOpen,
  onClose,
  promptsList = [],
  onSelectPrompt,
  onCopiedToast,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sync favorite state
  useEffect(() => {
    if (prompt) {
      promptService.recordView(prompt.id);
      setIsFav(storageService.isFavorite(prompt.id));
      setCopied(false);
      setIsExpanded(false);
    }
  }, [prompt]);

  // Synchronize global favorites
  useEffect(() => {
    if (!prompt) return;

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
  }, [prompt]);

  // Find previous and next prompt for quick gallery browsing
  const currentIndex = prompt && promptsList.length > 0
    ? promptsList.findIndex((p) => p.id === prompt.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < promptsList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectPrompt) {
      onSelectPrompt(promptsList[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, promptsList, onSelectPrompt]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectPrompt) {
      onSelectPrompt(promptsList[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, promptsList, onSelectPrompt]);

  // Keyboard navigation (ESC to close, ArrowLeft / ArrowRight to navigate)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !prompt) return null;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isFav;
    setIsFav(nextState);
    storageService.toggleFavorite(prompt.id).then((res) => {
      setIsFav(res);
    });
  };

  const handleCopyPrompt = async () => {
    if (!prompt.prompt_text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt.prompt_text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = prompt.prompt_text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      promptService.recordCopy(prompt.id);

      if (onCopiedToast) {
        onCopiedToast();
      }

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Erro ao copiar prompt:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/prompt/${prompt.slug || prompt.id}`;
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

    navigator.clipboard.writeText(url).then(() => {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    });
  };

  const isLongPrompt = prompt.prompt_text.length > 200;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      {/* Container wrapper for navigation arrows + card */}
      <div
        className="relative w-full max-w-4xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation arrow Left (Previous) */}
        {hasPrev && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Prompt anterior"
            className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-[#d4af37]/20 text-white hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/50 backdrop-blur-md transition-all shadow-xl active:scale-90"
            title="Prompt anterior (Seta esquerda)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation arrow Right (Next) */}
        {hasNext && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo prompt"
            className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-[#d4af37]/20 text-white hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/50 backdrop-blur-md transition-all shadow-xl active:scale-90"
            title="Próximo prompt (Seta direita)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Main Card Modal */}
        <div className="relative w-full bg-[#10121a] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]">
          {/* Close button (top right of card) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          {/* LEFT SIDE: A imagem no tamanho original/bem visível */}
          <div className="w-full md:w-[48%] bg-[#08090f] flex items-center justify-center p-3 sm:p-5 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10 shrink-0">
            {/* Subtle glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/5 via-transparent to-amber-500/5 pointer-events-none" />

            <div className="relative w-full flex items-center justify-center">
              <img
                src={prompt.cover_image}
                alt={prompt.image_alt || prompt.title}
                className="max-h-[42vh] md:max-h-[70vh] w-auto h-auto max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-transform duration-300"
              />

              {/* Badges on image */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                {prompt.category_name && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 text-amber-300 border border-white/10 backdrop-blur-md">
                    {prompt.category_name}
                  </span>
                )}
                {prompt.is_premium ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Pro
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-gray-300 border border-white/10 backdrop-blur-md">
                    Grátis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: O título e abaixo o prompt com o botão de copiar */}
          <div className="w-full md:w-[52%] flex flex-col justify-between p-4 sm:p-6 md:p-7 overflow-y-auto bg-[#10121a]">
            {/* Top Info Section */}
            <div className="space-y-3">
              {/* Header tags and actions */}
              <div className="flex items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-200/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    <Bot className="w-3 h-3 text-[#d4af37]" />
                    {prompt.tool_name || 'ChatGPT e Gemini'}
                  </span>
                </div>

                {/* Favorite & Share buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`p-2 rounded-xl backdrop-blur-md transition-all active:scale-90 ${
                      isFav
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10'
                    }`}
                    title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Compartilhar"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all active:scale-90"
                    title={isShareCopied ? 'Link copiado!' : 'Compartilhar prompt'}
                  >
                    {isShareCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Título do Prompt */}
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                  {prompt.title}
                </h2>
                {prompt.description && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* PROMPT BOX: Encaixado na mesma proporção da imagem */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    Prompt de Comando:
                  </span>
                  {isLongPrompt && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[11px] text-[#d4af37] hover:text-amber-300 transition-colors font-medium"
                    >
                      {isExpanded ? 'Ver menos' : 'Mostrar texto completo'}
                    </button>
                  )}
                </div>

                {/* Container do Prompt com altura contida para alinhar com a imagem */}
                <div className="relative bg-[#07080d] border border-white/10 hover:border-[#d4af37]/30 rounded-xl p-3.5 sm:p-4 transition-colors">
                  <div
                    className={`font-mono text-xs sm:text-sm text-gray-200 leading-relaxed overflow-y-auto pr-1 select-all transition-all duration-200 ${
                      isExpanded
                        ? 'max-h-[300px]'
                        : 'max-h-36 sm:max-h-44 md:max-h-48'
                    }`}
                  >
                    {prompt.prompt_text}
                  </div>

                  {/* Gradient fade indicator if long and not expanded */}
                  {isLongPrompt && !isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07080d] to-transparent pointer-events-none rounded-b-xl" />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Section */}
            <div className="pt-4 space-y-3 mt-3 border-t border-white/10">
              {/* Main Copy Prompt Button */}
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-amber-400 via-[#d4af37] to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Prompt Copiado com Sucesso! ✨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Prompt Completo</span>
                  </>
                )}
              </button>

              {/* Direct AI Launcher shortcuts (Ideia para deixar ainda mais bonito e funcional) */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  title="Abrir ChatGPT para colar o prompt com sua foto"
                >
                  <span>Abrir ChatGPT</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  title="Abrir Google Gemini para colar o prompt com sua foto"
                >
                  <span>Abrir Gemini</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
              </div>

              {/* Helper footnote */}
              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-[#d4af37]" />
                Basta colar o prompt no chat de IA junto com a sua foto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
