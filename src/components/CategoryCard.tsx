import React from 'react';
import {
  User,
  Film,
  Crown,
  Sparkles,
  Shirt,
  Compass,
  Glasses,
  Eye,
  Mountain,
  Camera,
  Clock,
  Zap,
  CameraOff,
  Layers,
} from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick: () => void;
  variant?: 'pill' | 'card';
}

const ICON_MAP: Record<string, React.ReactNode> = {
  User: <User className="w-4 h-4" />,
  Film: <Film className="w-4 h-4" />,
  Crown: <Crown className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Shirt: <Shirt className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  Glasses: <Glasses className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  Mountain: <Mountain className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  CameraOff: <CameraOff className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onClick,
  variant = 'pill',
}) => {
  const icon = ICON_MAP[category.icon] || <Sparkles className="w-4 h-4" />;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 active:scale-95 ${
          isSelected
            ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-200 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
            : 'bg-[#12141e] border-white/8 hover:border-white/20 text-gray-300 hover:text-white'
        }`}
      >
        <span className={isSelected ? 'text-[#d4af37]' : 'text-gray-400'}>{icon}</span>
        <span>{category.name}</span>
      </button>
    );
  }

  // Large visual card
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-end p-4 rounded-2xl overflow-hidden aspect-[4/3] bg-[#12141e] border border-white/8 hover:border-[#d4af37]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
    >
      {category.cover_image && (
        <>
          <img
            src={category.cover_image}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </>
      )}

      <div className="relative z-10">
        <div className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#d4af37] mb-2 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
          {category.name}
        </h3>
        <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">
          {category.description}
        </p>
      </div>
    </div>
  );
};
