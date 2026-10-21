'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, ChevronDown, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface HeroBannerProps {
  onExploreClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick }) => {
  const router = useRouter();
  const { heroBanner } = useStore();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const desktopUrl = heroBanner?.desktop_media_url || '/video/header_video.mp4';
  const mobileUrl = heroBanner?.mobile_media_url || desktopUrl;
  const isVideo = (heroBanner?.tipo_midia || 'video') === 'video';
  const titulo = heroBanner?.titulo;
  const subtitulo = heroBanner?.subtitulo;
  const ctaTexto = heroBanner?.cta_texto || 'Conhecer Coleção';
  const ctaLink = heroBanner?.cta_link || '#lancamentos';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback de política de autoplay do navegador
      });
    }
  }, [isVideo, desktopUrl, mobileUrl]);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleCtaClick = () => {
    if (ctaLink.startsWith('#')) {
      const targetId = ctaLink.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const headerOffset = isMobile ? 104 : 90;
        const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementTop - headerOffset,
          behavior: 'smooth'
        });
        return;
      }
      if (onExploreClick) {
        onExploreClick();
        return;
      }
    }

    if (ctaLink.startsWith('/')) {
      router.push(ctaLink);
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#1A1918]">
      {/* Container do Banner: 100% da tela (100dvh) no Mobile para Imersão Total e 16/9 no Desktop */}
      <div className="relative w-full h-screen h-[100dvh] min-h-[100dvh] md:h-auto md:min-h-0 md:aspect-[16/9] md:max-h-[calc(100vh)] overflow-hidden">
        
        {isVideo ? (
          <video
            ref={videoRef}
            key={`${desktopUrl}-${mobileUrl}`}
            poster="/video/header_poster.jpg"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover object-top"
          >
            <source src={desktopUrl} media="(min-width: 768px)" type="video/mp4" />
            <source src={mobileUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="relative w-full h-full">
            {/* Imagem Desktop */}
            <div className="hidden md:block w-full h-full relative">
              <Image
                src={desktopUrl}
                alt={titulo || 'Banner Vitrine'}
                fill
                priority
                className="object-cover object-center"
              />
            </div>
            {/* Imagem Mobile */}
            <div className="block md:hidden w-full h-full relative">
              <Image
                src={mobileUrl}
                alt={titulo || 'Banner Vitrine Mobile'}
                fill
                priority
                className="object-cover object-center"
              />
            </div>
          </div>
        )}

        {/* Gradiente Superior para Legibilidade do Menu Transparente */}
        <div className="absolute inset-x-0 top-0 h-32 sm:h-36 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-10" />

        {/* Gradiente Inferior para Transição Harmoniosa */}
        <div className="absolute inset-x-0 bottom-0 h-56 sm:h-44 md:h-36 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-10" />

        {/* Botão de Controle de Áudio Discreto (apenas quando for vídeo) */}
        {isVideo && (
          <button
            onClick={toggleSound}
            className="absolute bottom-6 md:bottom-5 right-4 sm:right-5 z-20 p-2.5 rounded-none bg-black/60 text-white hover:bg-black/85 backdrop-blur-md transition-all shadow-lg border border-white/20 cursor-pointer"
            title={isMuted ? 'Ativar Áudio' : 'Silenciar'}
            aria-label={isMuted ? 'Ativar Áudio' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white/90" />
            ) : (
              <Volume2 className="w-5 h-5 text-[#DFBE76]" />
            )}
          </button>
        )}

        {/* Textos Opcionais do Banner e Chamada de Ação (CTA) */}
        <div className="absolute bottom-28 sm:bottom-28 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center px-4 w-full max-w-2xl">
          {titulo && (
            <h1 className="font-serif-luxury text-xl sm:text-3xl md:text-4xl text-white font-medium drop-shadow-md mb-1.5 tracking-tight">
              {titulo}
            </h1>
          )}

          {subtitulo && (
            <p className="text-xs sm:text-sm text-white/85 max-w-lg mb-4 drop-shadow-sm line-clamp-2">
              {subtitulo}
            </p>
          )}

          <button
            onClick={handleCtaClick}
            className="px-6 py-2.5 rounded-none bg-white/50 hover:bg-white/95 text-[#1A1918] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-md backdrop-blur-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 border border-white/60 hover:border-[#C5A059]/70"
          >
            <span>{ctaTexto}</span>
            {ctaLink.startsWith('#') ? (
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
