import React from 'react';
import { ArrowLeft, Sparkles, Folder, CheckCircle } from 'lucide-react';
import { Collection, Prompt } from '../types';
import { PromptCard } from '../components/PromptCard';
import { EmptyState } from '../components/EmptyState';

interface CollectionDetailPageProps {
  collection: Collection;
  prompts: Prompt[];
  onBack: () => void;
  onSelectPrompt: (p: Prompt) => void;
  onCopiedToast: () => void;
}

export const CollectionDetailPage: React.FC<CollectionDetailPageProps> = ({
  collection,
  prompts,
  onBack,
  onSelectPrompt,
  onCopiedToast,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white border border-white/8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar às Coleções</span>
        </button>
      </div>

      {/* Hero Collection Header */}
      <div className="relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[280px] flex flex-col justify-end p-6 sm:p-10 border border-white/10 shadow-2xl">
        <img
          src={collection.cover_image}
          alt={collection.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            {collection.is_premium ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Coleção Pro
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/70 text-gray-200 border border-white/10 backdrop-blur-md">
                Acesso Gratuito
              </span>
            )}
            <span className="text-xs text-gray-300 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <Folder className="w-3 h-3 text-[#d4af37]" />
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
            {collection.name}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {collection.description}
          </p>
        </div>
      </div>

      {/* Prompts in this collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <h2 className="text-base font-bold text-white">
            Prompts da Coleção ({prompts.length})
          </h2>
          <span className="text-xs text-gray-400">
            Fórmulas coordenadas para o mesmo ensaio
          </span>
        </div>

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
            title="Nenhum prompt vinculado ainda"
            description="Esta coleção ainda está sendo abastecida pela nossa curadoria."
          />
        )}
      </div>
    </div>
  );
};
