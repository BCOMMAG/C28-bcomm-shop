'use client';

import React, { useState, useEffect } from 'react';
import { BoutiqueStorefront } from '@/components/BoutiqueStorefront';
import { PlatformPortal } from '@/components/PlatformPortal';
import { isPlatformHostname } from '@/lib/routes';

export default function RootHomePage() {
  const [isStoreMode, setIsStoreMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const hostname = window.location.hostname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const lojaParam = searchParams.get('loja');
    if (lojaParam && lojaParam.trim() !== '') return true;
    return !isPlatformHostname(hostname);
  });

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

    // 2. Se o acesso vier por um domínio customizado de cliente (ex: www.boutiqueleidy.com.br)
    const isPlatform = isPlatformHostname(hostname);

    if (!isPlatform) {
      // É um domínio próprio de loja!
      setIsStoreMode(true);
      return;
    }

    // 3. Caso contrário, na raiz bcomm-ag.space/ ou bcomm-shop.pages.dev/ sem parâmetros, exibe o Portal BCOMM SaaS
    setIsStoreMode(false);
  }, []);

  if (isStoreMode) {
    return <BoutiqueStorefront />;
  }

  return <PlatformPortal />;
}
