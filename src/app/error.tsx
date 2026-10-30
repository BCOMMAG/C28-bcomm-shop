'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, ShoppingBag, AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured by Next.js App Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121110] text-[#1A1918] dark:text-[#FAF8F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] block">
            Leidy Boutique
          </span>
          <h1 className="text-xl sm:text-2xl font-serif-luxury font-medium text-[#1A1918] dark:text-[#FAF8F5]">
            Instabilidade Temporária
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
            Identificamos uma oscilação momentânea ao carregar esta visualização. Seus itens e sacola permanecem preservados com segurança.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>

          <Link
            href="/leidy-boutique"
            className="w-full sm:w-auto px-5 py-2.5 bg-transparent border border-[#C5A059]/40 hover:border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#C5A059]/15">
          <Link
            href="/leidy-boutique/catalogo"
            className="text-[11px] text-[#C5A059] hover:underline font-medium inline-flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Explorar Coleção Completa no Catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

