import React, { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { promptService } from '../services/promptService';

interface CopyPromptButtonProps {
  promptText: string;
  promptId?: string;
  className?: string;
  variant?: 'primary' | 'compact' | 'ghost';
  onCopied?: () => void;
}

export const CopyPromptButton: React.FC<CopyPromptButtonProps> = ({
  promptText,
  promptId,
  className = '',
  variant = 'primary',
  onCopied,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!promptText || promptText.trim().length === 0) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(promptText);
      } else {
        // Fallback for non-https or restricted iframes
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      setError(false);

      if (promptId) {
        promptService.recordCopy(promptId);
      }

      if (onCopied) {
        onCopied();
      }

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Prompt copiado!' : 'Copiar prompt integral'}
        className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-95 ${
          copied
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : 'bg-white/5 hover:bg-[#d4af37]/20 text-gray-300 hover:text-amber-200 border border-white/10 hover:border-[#d4af37]/40'
        } ${className}`}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
          copied
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-gray-400 hover:text-[#d4af37] hover:bg-white/5'
        } ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </>
        )}
      </button>
    );
  }

  // Primary variant: prominent luxury button
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`relative group flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 active:scale-[0.98] ${
        copied
          ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-400/50'
          : error
          ? 'bg-rose-700 text-white border border-rose-500'
          : 'bg-gradient-to-r from-[#d4af37] via-[#e5c35b] to-[#c79e26] text-slate-950 hover:brightness-110 shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] border border-[#fae8a4]/60'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-white animate-bounce" />
          <span>PROMPT COPIADO COM SUCESSO!</span>
        </>
      ) : error ? (
        <span>ERRO AO COPIAR — TENTE MANUALMENTE</span>
      ) : (
        <>
          <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>COPIAR PROMPT COMPLETO</span>
          <Sparkles className="w-4 h-4 ml-0.5 opacity-80" />
        </>
      )}
    </button>
  );
};
