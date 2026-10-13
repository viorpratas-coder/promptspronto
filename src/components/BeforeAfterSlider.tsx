import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SlidersHorizontal, Image as ImageIcon, Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage?: string;
  afterImage: string;
  altText: string;
  aspectRatio?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  altText,
  aspectRatio = '4:5',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // If no original before image is provided, display high-end single view
  if (!beforeImage) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0d0f17] group shadow-2xl">
        <img
          src={afterImage}
          alt={altText}
          className="w-full h-auto object-cover max-h-[75vh] mx-auto select-none"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-amber-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          Resultado IA
        </div>
      </div>
    );
  }

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      <div
        ref={containerRef}
        role="slider"
        aria-label="Controle deslizante de comparação Antes e Depois"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        onTouchMove={handleTouchMove}
        className="relative w-full max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f17] shadow-2xl cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
      >
        {/* After Image (Right/Full base) */}
        <img
          src={afterImage}
          alt={`Resultado Editado: ${altText}`}
          className="w-full h-auto object-cover max-h-[75vh] select-none block pointer-events-none"
          draggable={false}
        />

        {/* Before Image (Left clipped by sliderPos) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforeImage}
            alt={`Foto Original: ${altText}`}
            className="absolute top-0 left-0 h-full w-full object-cover max-w-none select-none pointer-events-none"
            style={{
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              height: '100%',
            }}
            draggable={false}
          />
        </div>

        {/* Divider Bar & Handle */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-0 bottom-0 -ml-[1px] w-[2px] bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
          
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#131622] border-2 border-[#d4af37] shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center justify-center text-[#d4af37] pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
            <SlidersHorizontal className="w-4 h-4 rotate-90" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold tracking-wider text-gray-300 uppercase flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3 text-gray-400" />
          Original
        </div>
        <div className="absolute top-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-md bg-[#131622]/85 backdrop-blur-md border border-[#d4af37]/30 text-[11px] font-semibold tracking-wider text-amber-200 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#d4af37]" />
          Editado com IA
        </div>
      </div>

      {/* Accessible Quick Controls & Help */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="hidden sm:inline">Arraste a linha ou use as setas do teclado</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setSliderPos(0)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              sliderPos === 0 ? 'bg-[#d4af37]/20 border-[#d4af37] text-white' : 'border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            Ver IA 100%
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(50)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              sliderPos === 50 ? 'bg-[#d4af37]/20 border-[#d4af37] text-white' : 'border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            50 / 50
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(100)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              sliderPos === 100 ? 'bg-[#d4af37]/20 border-[#d4af37] text-white' : 'border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            Ver Original
          </button>
        </div>
      </div>
    </div>
  );
};
