'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BoutiqueStorefront } from '@/components/BoutiqueStorefront';
import { CustomerVIPDashboard } from '@/components/CustomerVIPDashboard';
import { WishlistManager } from '@/components/WishlistManager';

export default function NotFound() {
  const [spaMode, setSpaMode] = useState<'store' | 'cliente' | 'favoritos' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname.replace(/^\/|\/$/g, '');
    const knownStaticRoutes = ['admin', 'super-admin', 'catalogo', 'checkout'];

    // Se a rota for um subcaminho limpo de tenant (ex: /nova-loja, /nova-loja/cliente, /nova-loja/cliente/favoritos)
    if (pathname && !pathname.includes('.')) {
      const segments = pathname.split('/');
      const firstSegment = segments[0];

      if (!knownStaticRoutes.includes(firstSegment)) {
        if (segments.includes('favoritos')) {
          setSpaMode('favoritos');
        } else if (segments.includes('cliente')) {
          setSpaMode('cliente');
        } else {
          setSpaMode('store');
        }
      }
    }
  }, []);

  if (spaMode === 'favoritos') {
    return <WishlistManager />;
  }
  if (spaMode === 'cliente') {
    return <CustomerVIPDashboard />;
  }
  if (spaMode === 'store') {
    return <BoutiqueStorefront />;
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
      </div>
    </div>
  );
}
