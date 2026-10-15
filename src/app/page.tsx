'use client';

import React, { useState, useEffect } from 'react';
import { BoutiqueStorefront } from '@/components/BoutiqueStorefront';
import { PlatformPortal } from '@/components/PlatformPortal';

export default function RootHomePage() {
  const [isStoreMode, setIsStoreMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const lojaParam = searchParams.get('loja');

    // 1. Se foi passado o parâmetro ?loja=slug (ex: ?loja=leidy-boutique ou ?loja=aura-privee)
    if (lojaParam && lojaParam.trim() !== '') {
      setIsStoreMode(true);
      return;
    }

    // 2. Se o acesso vier por um domínio customizado de cliente (ex: www.leidyboutique.com.br)
    const isPlatformHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.pages.dev') ||
      hostname === 'bcomm.com.br' ||
      hostname === 'www.bcomm.com.br';

    if (!isPlatformHost) {
      // É um domínio próprio de loja!
      setIsStoreMode(true);
      return;
    }

    // 3. Caso contrário, na raiz bcomm-shop.pages.dev/ sem parâmetros, exibe o Portal BCOMM SaaS
    setIsStoreMode(false);
  }, []);

  // Enquanto determina o modo (evita flash visual durante o carregamento)
  if (isStoreMode === null) {
    return (
      <div className="min-h-screen bg-[#0C0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isStoreMode) {
    return <BoutiqueStorefront />;
  }

  return <PlatformPortal />;
}
