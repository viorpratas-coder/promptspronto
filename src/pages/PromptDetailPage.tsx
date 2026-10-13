import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Info,
  CheckCircle,
  Cpu,
  Lock,
} from 'lucide-react';
import { Prompt } from '../types';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
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
          text: `Confira este prompt de edição com IA: ${prompt.title}`,
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8 pb-24">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/8 transition-colors flex items-center gap-1.5 text-xs"
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
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              isFav
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-md'
                : 'bg-white/5 text-gray-300 hover:text-white border-white/8'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFav ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Comparison: Before / After Slider */}
      <div className="space-y-2">
        <BeforeAfterSlider
          beforeImage={prompt.original_image}
          afterImage={prompt.cover_image}
          altText={prompt.title}
          aspectRatio={prompt.aspect_ratio || '4:5'}
        />
      </div>

      {/* Title, Category & Meta Badges */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {prompt.is_premium ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Edição Exclusiva Pro
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Acesso Gratuito
            </span>
          )}

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
            {prompt.category_name}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#d4af37]" />
            {prompt.tool_name}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          {prompt.title}
        </h1>

        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
          {prompt.description}
        </p>
      </div>

      {/* Premium Exclusive Notice if applicable */}
      {prompt.is_premium && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-200">
            <p className="font-semibold text-white">Fórmula de Edição Profissional</p>
            <p className="text-gray-300 mt-0.5">
              Este prompt contém refinamentos fotográficos avançados para iluminação e micro-detalhes. O texto completo está liberado para testes em nosso catálogo.
            </p>
          </div>
        </div>
      )}

      {/* Complete Prompt Box (The Core Deliverable) */}
      <div className="rounded-2xl bg-[#12141e] border border-white/10 shadow-xl overflow-hidden space-y-0">
        <div className="px-4 sm:px-6 py-3.5 bg-[#171a27] border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Prompt de Comando Completo
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {prompt.tool_name}
          </span>
        </div>

        {/* Prompt Text Container */}
        <div className="p-4 sm:p-6 bg-[#0a0b10]">
          <div className="relative p-4 rounded-xl bg-[#131622] border border-white/8 select-text">
            <p className="text-sm sm:text-base text-gray-100 font-mono leading-relaxed break-words select-all whitespace-pre-wrap">
              {prompt.prompt_text}
            </p>
          </div>

          {/* Action Row with prominent Copy Button */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Texto integral pronto para colar</span>
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

      {/* Instructions & Technical Parameters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Step-by-step instructions */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/8 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-[#d4af37]" />
            Como Usar no ChatGPT & Gemini
          </h3>
          <div className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p>Abra o <strong>ChatGPT</strong>, <strong>Google Gemini</strong> ou qualquer chat de IA no celular ou computador.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p>Clique no botão de anexo (+) e faça upload da sua foto original.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              <p>Cole o prompt copiado e envie. O chat gerará a versão editada preservando seu rosto e aplicando o estilo!</p>
            </div>
          </div>
          {prompt.instructions && (
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-amber-200/90 whitespace-pre-line">
              {prompt.instructions}
            </div>
          )}
        </div>

        {/* Technical Camera & Model Specs */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#12141e] border border-white/8 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#d4af37]" />
            Especificações & Parâmetros
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Ferramenta recomendada:</span>
              <span className="font-semibold text-white">{prompt.tool_name}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Proporção (Aspect Ratio):</span>
              <span className="font-semibold text-amber-200">{prompt.aspect_ratio || '4:5 (Feed IG)'}</span>
            </div>
            {prompt.parameters &&
              Object.entries(prompt.parameters).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">{key}:</span>
                  <span className="font-semibold text-gray-200">{val}</span>
                </div>
              ))}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Tags associadas:</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                {prompt.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Prompts Recommendations */}
      {relatedPrompts.length > 0 && (
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              Edições Semelhantes Recomendadas
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Outros estilos na categoria {prompt.category_name}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedPrompts.map((rel) => (
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
