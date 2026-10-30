'use client';

import React, { useEffect } from 'react';
import { RotateCw, Home, AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured by Next.js Global Error Boundary:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#FAF8F5] text-[#1A1918] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-[#C5A059]/30 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] block">
              Leidy Boutique
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-medium text-[#1A1918]">
              Instabilidade de Conexão
            </h1>
            <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
              Não se preocupe: suas informações estão salvas. Clique abaixo para restabelecer a visualização instantaneamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1A1918] text-white hover:bg-[#C5A059] transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>

            <a
              href="/leidy-boutique"
              className="w-full sm:w-auto px-5 py-2.5 bg-transparent border border-[#C5A059]/40 hover:border-[#C5A059] text-[#1A1918] transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Voltar ao Início</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

