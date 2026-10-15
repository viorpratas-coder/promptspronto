import React, { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Prompt } from '../types';
import { CopyPromptButton } from './CopyPromptButton';
import { storageService } from '../services/storageService';

interface PromptCardProps {
  prompt: Prompt;
  isFavorite?: boolean;
  onSelect: (prompt: Prompt) => void;
  onFavoriteChange?: (isFav: boolean) => void;
  onCopiedToast?: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isFavorite: isFavoriteProp,
  onSelect,
  onFavoriteChange,
  onCopiedToast,
}) => {
  const [isFav, setIsFav] = useState<boolean>(() => {
    if (typeof isFavoriteProp === 'boolean') return isFavoriteProp;
    return storageService.isFavorite(prompt.id);
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Sync if isFavorite prop changes from parent
  useEffect(() => {
    if (typeof isFavoriteProp === 'boolean') {
      setIsFav(isFavoriteProp);
    }
  }, [isFavoriteProp]);

  // Listen to global favorites updates so multiple cards on screen stay 100% in sync
  useEffect(() => {
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

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Immediate optimistic toggle
    const nextState = !isFav;
    setIsFav(nextState);
    if (onFavoriteChange) onFavoriteChange(nextState);

    storageService.toggleFavorite(prompt.id).then((result) => {
      setIsFav(result);
    });
  };

  return (
    <div
      onClick={() => onSelect(prompt)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#12141e] border border-white/8 hover:border-[#d4af37]/40 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0c0e15]">
        <img
          src={prompt.cover_image}
          alt={prompt.image_alt || prompt.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 pointer-events-none">
          {/* Access status badge */}
          {prompt.is_premium ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Pro
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-black/60 text-gray-200 border border-white/10 backdrop-blur-md">
              Grátis
            </span>
          )}
        </div>

        {/* Favorite button (always clickable) */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
            isFav
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg'
              : 'bg-black/50 text-white/80 hover:text-white border border-white/10 hover:bg-black/70'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Gradient shadow for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#12141e] via-[#12141e]/70 to-transparent pointer-events-none" />

        {/* Quick action overlay on bottom of image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
          <span className="text-[11px] font-medium text-amber-200/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 truncate max-w-[130px]">
            {prompt.tool_name}
          </span>
          <CopyPromptButton
            promptText={prompt.prompt_text}
            promptId={prompt.id}
            variant="compact"
            onCopied={onCopiedToast}
          />
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
            <span className="text-[#d4af37] font-medium">{prompt.category_name}</span>
          </div>
          <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
            {prompt.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
            {prompt.description}
          </p>
        </div>

        {/* Tags footer */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 overflow-hidden">
          {prompt.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 2 && (
            <span className="text-[10px] text-gray-500 ml-auto">
              +{prompt.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
