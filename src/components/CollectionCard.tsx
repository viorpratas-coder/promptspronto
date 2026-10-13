import React from 'react';
import { ArrowUpRight, Sparkles, Folder } from 'lucide-react';
import { Collection } from '../types';

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  variant?: 'featured' | 'standard';
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onClick,
  variant = 'standard',
}) => {
  if (variant === 'featured') {
    return (
      <div
        onClick={onClick}
        className="group relative flex flex-col justify-end p-5 sm:p-6 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[300px] bg-[#12141e] border border-white/10 hover:border-[#d4af37]/50 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
      >
        <img
          src={collection.cover_image}
          alt={collection.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {collection.is_premium ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                <Sparkles className="w-2.5 h-2.5" />
                Coleção Pro
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-black/60 text-gray-200 border border-white/10 backdrop-blur-md">
                Coleção Gratuita
              </span>
            )}
            <span className="text-[11px] text-gray-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">
              {collection.prompt_count || 8} prompts
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-200 transition-colors">
            {collection.name}
          </h3>
          <p className="text-xs text-gray-300 line-clamp-2 max-w-md">
            {collection.description}
          </p>

          <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] group-hover:translate-x-1 transition-transform">
            <span>Explorar Coleção</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Standard card
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12141e] border border-white/8 hover:border-[#d4af37]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0c0e15]">
        <img
          src={collection.cover_image}
          alt={collection.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12141e] via-transparent to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {collection.is_premium ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Pro
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-gray-200 border border-white/10 backdrop-blur-md">
              Grátis
            </span>
          )}
        </div>

        <span className="absolute bottom-2.5 right-2.5 text-[10px] text-gray-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
          <Folder className="w-3 h-3 text-[#d4af37]" />
          {collection.prompt_count || 6} prompts
        </span>
      </div>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
            {collection.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1">
            {collection.description}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#d4af37]">
          <span>Ver todos os prompts</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
