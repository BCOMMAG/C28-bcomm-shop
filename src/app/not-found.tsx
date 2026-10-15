'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function NotFound() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname.replace(/^\/|\/$/g, '');
    const knownStaticRoutes = ['admin', 'super-admin', 'catalogo', 'checkout', 'favoritos', 'minha-conta'];

    // Se o pathname não tiver ponto (não é arquivo .png, .js, .ico, etc) e não for uma rota estática do sistema
    if (pathname && !pathname.includes('.') && !knownStaticRoutes.includes(pathname.split('/')[0])) {
      setIsRedirecting(true);
      // Redireciona de forma suave para a loja correspondente na raiz
      window.location.replace(`/?loja=${encodeURIComponent(pathname)}`);
    }
  }, []);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#0C0E14] text-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-300">Carregando vitrine da loja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0E14] text-[#FAF8F5] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold font-serif-luxury text-[#C5A059] mb-4">404</h1>
        <h2 className="text-xl font-bold mb-2">Página não encontrada</h2>
        <p className="text-xs text-zinc-400 mb-6">
          A página ou loja que você está procurando não existe ou foi alterada.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
      </div>
    </div>
  );
}
