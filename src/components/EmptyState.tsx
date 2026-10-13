import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#12141e]/50 border border-white/5 max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#1a1e2e] border border-white/10 flex items-center justify-center text-[#d4af37] mb-4 shadow-inner">
        {icon || <Sparkles className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-xs mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
