'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCw, Home, ShoppingBag, AlertCircle, LogIn, ShieldAlert } from 'lucide-react';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname || '';
      return p.startsWith('/admin') || p.startsWith('/super-admin') || p.includes('/admin');
    }
    return false;
  });

  useEffect(() => {
    console.error('Captured by Next.js App Error Boundary:', error);
    if (typeof window !== 'undefined') {
      const p = window.location.pathname || '';
      if (p.startsWith('/admin') || p.startsWith('/super-admin') || p.includes('/admin')) {
        setIsAdminRoute(true);
      }
    }
  }, [error]);

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#07060A] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-[#100E17] border border-purple-500/20 p-8 shadow-2xl relative rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 block">
              BCOMM Stores • Console Administrativo
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Painel Administrativo
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Ocorreu uma oscilação na renderização. Clique abaixo para retornar ao login ou recarregar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (typeof reset === 'function') reset();
                else window.location.reload();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = window.location.pathname.startsWith('/super-admin') ? '/super-admin/login/' : '/admin/login/';
                window.location.href = target;
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-400" />
              <span>Ir para Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
