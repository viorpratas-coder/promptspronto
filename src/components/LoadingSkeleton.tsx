import React from 'react';

export const LoadingSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-[#12141e] border border-white/5 animate-pulse"
        >
          <div className="aspect-[4/5] bg-white/5" />
          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="h-3 w-1/3 bg-white/10 rounded" />
            <div className="h-4 w-4/5 bg-white/10 rounded" />
            <div className="h-2.5 w-full bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
