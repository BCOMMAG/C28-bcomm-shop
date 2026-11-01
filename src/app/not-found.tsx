'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BoutiqueStorefront } from '@/components/BoutiqueStorefront';
import { CustomerVIPDashboard } from '@/components/CustomerVIPDashboard';
import { WishlistManager } from '@/components/WishlistManager';
import CatalogoPage from '@/app/catalogo/page';
import CheckoutPage from '@/app/checkout/page';

export default function NotFound() {
  const [spaMode, setSpaMode] = useState<'store' | 'catalogo' | 'checkout' | 'cliente' | 'favoritos' | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsResolving(false);
      return;
    }

    const pathname = window.location.pathname.replace(/^\/|\/$/g, '');
    const knownStaticRoutes = ['admin', 'super-admin'];

    // Se a rota for um subcaminho limpo de tenant (ex: /nova-loja, /nova-loja/catalogo, /nova-loja/checkout)
    if (pathname && !pathname.includes('.')) {
      const segments = pathname.split('/');
      const firstSegment = segments[0];

      if (!knownStaticRoutes.includes(firstSegment)) {
        if (segments.includes('favoritos')) {
          setSpaMode('favoritos');
        } else if (segments.includes('cliente')) {
          setSpaMode('cliente');
        } else if (segments.includes('catalogo')) {
          setSpaMode('catalogo');
        } else if (segments.includes('checkout')) {
          setSpaMode('checkout');
        } else {
          setSpaMode('store');
        }
      }
    }
    setIsResolving(false);
  }, []);

  if (isResolving) {
    return (
      <div className="min-h-screen bg-[#0C0E14] text-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mb-3" />
        <p className="text-xs text-zinc-400 font-sans tracking-widest uppercase">Carregando boutique...</p>
      </div>
    );
  }

  if (spaMode === 'favoritos') {
    return <WishlistManager />;
  }
  if (spaMode === 'cliente') {
    return <CustomerVIPDashboard />;
  }
  if (spaMode === 'catalogo') {
    return <CatalogoPage />;
  }
  if (spaMode === 'checkout') {
    return <CheckoutPage />;
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
