'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { PlanoFundoSiteConfig } from '@/lib/admin';

export const BackgroundVideo: React.FC = () => {
  const pathname = usePathname();
  const { currentTenant, theme } = useStore();

  // Em rotas administrativas (/admin e /super-admin), não exibe o plano de fundo da loja
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/super-admin');
  if (isAdminRoute) {
    return null;
  }

  const vis = currentTenant?.configuracoes_visuais as any;
  const siteBg: PlanoFundoSiteConfig | undefined = vis?.plano_fundo_site;
  const tipo = siteBg?.tipo || 'imagem';
  const overlayOpacity = Math.max(0, Math.min(100, siteBg?.overlay_opacidade ?? 65)) / 100;

  // 1. TIPO SÓLIDO / GRADIENTE
  if (tipo === 'solido') {
    const bgColor = theme === 'dark'
      ? (siteBg?.bg_dark || '#121110')
      : (siteBg?.bg_light || '#FAF8F5');

    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300"
        style={{ backgroundColor: bgColor }}
      />
    );
  }

  // 2. TIPO VÍDEO ATMOSFÉRICO
  if (tipo === 'video' && siteBg?.video_url) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#121110]"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source src={siteBg.video_url} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-black backdrop-blur-[0.5px]"
          style={{ opacity: overlayOpacity }}
        />
      </div>
    );
  }

  // 3. TIPO IMAGEM / TEXTURA PERSONALIZADA OU PADRÃO
  const bgImageSrc = siteBg?.imagem_url || '/images/plano-de-fundo.webp';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#121110]"
    >
      <img
        src={bgImageSrc}
        alt=""
        role="presentation"
        className="w-full h-full object-cover object-center"
        loading="eager"
        fetchPriority="high"
      />
      {/* Camada de Filtro Atmosférico e Contraste Nobre */}
      <div
        className="absolute inset-0 bg-black backdrop-blur-[0.5px]"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
