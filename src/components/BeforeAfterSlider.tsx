import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SlidersHorizontal,
  Image as ImageIcon,
  Sparkles,
  Columns2,
  Layers,
  Maximize2,
  X,
} from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage?: string;
  afterImage: string;
  altText: string;
  aspectRatio?: string;
}

type ViewMode = 'slider' | 'side-by-side' | 'toggle';

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  altText,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeToggle, setActiveToggle] = useState<'before' | 'after'>('after');
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // If no original before image is provided, display single high-end view framed completely
  if (!beforeImage) {
    return (
      <div className="flex flex-col items-center gap-3 w-full select-none">
        <div className="relative w-fit max-w-full mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#07080d] group shadow-2xl flex items-center justify-center">
          <img
            src={afterImage}
            alt={altText}
            className="max-h-[460px] sm:max-h-[520px] w-auto h-auto max-w-full object-contain mx-auto select-none block"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-medium text-amber-200 flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            Resultado IA
          </div>
          <button
            type="button"
            onClick={() => setLightboxImage({ src: afterImage, title: `Resultado IA: ${altText}` })}
            className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/85 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Ver imagem completa ampliada"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Lightbox */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-5xl max-h-[92vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 text-white">
                <span className="text-sm font-semibold">{lightboxImage.title}</span>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl border border-white/10"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleStartDrag = (clientX: number) => {
    setIsDragging(true);
    handleMove(clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchend', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* Barra Superior do Quadro de Demonstração: Modos de Enquadramento */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Quadro de Demonstração</span>
        </div>

        {/* Seletor de Modo: Deslizar | Lado a Lado | Alternar */}
        <div className="flex items-center gap-1 bg-[#12141e] p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'slider'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Arrastar linha de comparação"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Deslizar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'side-by-side'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Ver ambas as fotos completas lado a lado"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Lado a Lado</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('toggle')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'toggle'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Alternar entre foto Antes e Depois com 1 clique"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Alternar</span>
          </button>
        </div>
      </div>

      {/* MODO 1: DESLIZADOR (SLIDER) COM ENQUADRAMENTO COMPLETO */}
      {viewMode === 'slider' && (
        <div className="flex flex-col items-center gap-3 w-full">
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
              e.preventDefault();
              handleStartDrag(e.clientX);
            }}
            onTouchStart={(e) => {
              handleStartDrag(e.touches[0].clientX);
            }}
            className="relative w-fit max-w-full mx-auto overflow-hidden rounded-2xl border border-white/10 bg-[#07080d] shadow-2xl cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-[#d4af37] flex items-center justify-center"
          >
            {/* Base Image: After (Resultado com IA) - sem corte, tamanho original proporcional */}
            <img
              src={afterImage}
              alt={`Resultado Editado: ${altText}`}
              className="max-h-[460px] sm:max-h-[520px] w-auto h-auto max-w-full object-contain block mx-auto select-none pointer-events-none"
              draggable={false}
            />

            {/* Overlay Image: Before (Foto Original) - enquadrada proporcionalmente sem cortes */}
            <img
              src={beforeImage}
              alt={`Foto Original: ${altText}`}
              className="absolute inset-0 w-full h-full object-contain block select-none pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
              draggable={false}
            />

            {/* Linha Divisória e Alça */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-0 bottom-0 -ml-[1px] w-[2px] bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.9)]" />

              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#131622] border-2 border-[#d4af37] shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center justify-center text-[#d4af37] pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
                  isDragging ? 'scale-110 shadow-[0_0_16px_rgba(212,175,55,0.7)]' : ''
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 rotate-90 text-[#d4af37]" />
              </div>
            </div>

            {/* Selos Antes e Depois */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-semibold tracking-wider text-gray-300 uppercase flex items-center gap-1.5 shadow-md">
              <ImageIcon className="w-3 h-3 text-gray-400" />
              Original (Antes)
            </div>
            <div className="absolute top-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-md bg-[#131622]/85 backdrop-blur-md border border-[#d4af37]/30 text-[11px] font-semibold tracking-wider text-amber-200 uppercase flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              Resultado IA
            </div>
          </div>

          {/* Atalhos Rápidos de Posição */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 px-1 gap-2 max-w-2xl mx-auto w-full">
            <span className="text-gray-400 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Arraste para comparar ou use os botões rápidos:</span>
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setSliderPos(0)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  sliderPos === 0
                    ? 'bg-[#d4af37] text-slate-950 font-bold border-[#d4af37] shadow-sm'
                    : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-300'
                }`}
              >
                Ver IA 100%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(50)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  sliderPos === 50
                    ? 'bg-[#d4af37] text-slate-950 font-bold border-[#d4af37] shadow-sm'
                    : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-300'
                }`}
              >
                50% / 50%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(100)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  sliderPos === 100
                    ? 'bg-[#d4af37] text-slate-950 font-bold border-[#d4af37] shadow-sm'
                    : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-300'
                }`}
              >
                Ver Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: LADO A LADO - AMBAS AS FOTOS 100% COMPLETAS SEM NENHUM CORTE */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
          {/* Quadro da Foto Original (Antes) */}
          <div className="flex flex-col items-center bg-[#07080d] border border-white/10 rounded-2xl p-3 shadow-xl relative group">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                Original (Antes)
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage({ src: beforeImage, title: `Foto Original: ${altText}` })}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1 rounded hover:bg-white/5"
                title="Ampliar foto original"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Ampliar</span>
              </button>
            </div>
            <div className="w-full flex items-center justify-center min-h-[300px]">
              <img
                src={beforeImage}
                alt={`Foto Original: ${altText}`}
                className="max-h-[420px] sm:max-h-[460px] w-auto h-auto max-w-full object-contain block rounded-lg select-none"
              />
            </div>
          </div>

          {/* Quadro da Foto Editada (Depois - IA) */}
          <div className="flex flex-col items-center bg-[#07080d] border border-[#d4af37]/30 rounded-2xl p-3 shadow-xl relative group">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                Resultado IA (Depois)
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage({ src: afterImage, title: `Resultado IA: ${altText}` })}
                className="text-xs text-[#d4af37] hover:text-amber-300 flex items-center gap-1 p-1 rounded hover:bg-white/5"
                title="Ampliar foto IA"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Ampliar</span>
              </button>
            </div>
            <div className="w-full flex items-center justify-center min-h-[300px]">
              <img
                src={afterImage}
                alt={`Resultado IA: ${altText}`}
                className="max-h-[420px] sm:max-h-[460px] w-auto h-auto max-w-full object-contain block rounded-lg select-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODO 3: ALTERNAR ENTRE ANTES E DEPOIS NO MESMO QUADRO */}
      {viewMode === 'toggle' && (
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Botões Grandes de Alternância */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveToggle('before')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                activeToggle === 'before'
                  ? 'bg-white/15 text-white border-white/30 shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Foto Original (Antes)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveToggle('after')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                activeToggle === 'after'
                  ? 'bg-[#d4af37] text-slate-950 font-bold border-[#d4af37] shadow-md shadow-[#d4af37]/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resultado IA (Depois)</span>
            </button>
          </div>

          {/* Quadro Único com Foto Selecionada 100% Completa */}
          <div className="relative w-fit max-w-full mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#07080d] shadow-2xl p-2 flex items-center justify-center">
            <img
              src={activeToggle === 'before' ? beforeImage : afterImage}
              alt={activeToggle === 'before' ? `Foto Original: ${altText}` : `Resultado IA: ${altText}`}
              className="max-h-[460px] sm:max-h-[520px] w-auto h-auto max-w-full object-contain block mx-auto rounded-xl select-none"
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-white">
              {activeToggle === 'before' ? 'Original (Antes)' : 'Resultado IA'}
            </div>
            <button
              type="button"
              onClick={() =>
                setLightboxImage({
                  src: activeToggle === 'before' ? beforeImage : afterImage,
                  title: activeToggle === 'before' ? `Foto Original: ${altText}` : `Resultado IA: ${altText}`,
                })
              }
              className="absolute bottom-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/85 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Ver em tamanho ampliado"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Lightbox de Foto Completa Ampliada */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center bg-[#0d0f17] border border-white/10 rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/10 mb-3">
              <span className="text-sm font-semibold">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
