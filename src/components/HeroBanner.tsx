'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Volume2,
  VolumeX,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { AdminHeroBanner } from '@/lib/admin';

interface HeroBannerProps {
  onExploreClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick }) => {
  const router = useRouter();
  const { heroBanner, heroBanners } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Resolução da lista de banners (múltiplos ou unitário)
  const bannersList: AdminHeroBanner[] = React.useMemo(() => {
    if (heroBanners && heroBanners.length > 0) {
      return heroBanners;
    }
    if (heroBanner) {
      return [heroBanner];
    }
    return [
      {
        id: 'default-banner',
        titulo: 'Coleção Elegance & Alfaiataria',
        subtitulo: 'Curadoria Exclusiva em Moda Feminina',
        cta_texto: 'Conhecer Coleção',
        cta_link: '#lancamentos',
        tipo_midia: 'video',
        desktop_media_url: '/video/header_video.mp4',
        mobile_media_url: '/video/header_video.mp4',
        ativo: true
      }
    ];
  }, [heroBanners, heroBanner]);

  // Garante que o índice atual seja válido se a lista mudar
  useEffect(() => {
    if (currentIndex >= bannersList.length) {
      setCurrentIndex(0);
    }
  }, [bannersList.length, currentIndex]);

  const currentBanner = bannersList[currentIndex] || bannersList[0];
  const isVideo = (currentBanner?.tipo_midia || 'video') === 'video';
  const desktopUrl = currentBanner?.desktop_media_url || '/video/header_video.mp4';
  const mobileUrl = currentBanner?.mobile_media_url || desktopUrl;
  const titulo = currentBanner?.titulo;
  const subtitulo = currentBanner?.subtitulo;
  const ctaTexto = currentBanner?.cta_texto || 'Conhecer Coleção';
  const ctaLink = currentBanner?.cta_link || '#lancamentos';

  // Controle de Pausa na Interação do Usuário (Retomada automática após 5s)
  const isUserInteractingRef = useRef(false);
  const userResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registerUserInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    if (userResumeTimeoutRef.current) {
      clearTimeout(userResumeTimeoutRef.current);
    }
    // Após 5 segundos de inatividade, o carrossel retoma o looping normal
    userResumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 5000);
  }, []);

  // Autoplay em Looping a cada 6 segundos (pausa quando o usuário interage)
  useEffect(() => {
    if (bannersList.length <= 1) return;

    const interval = setInterval(() => {
      if (!isUserInteractingRef.current) {
        setCurrentIndex((prev) => (prev + 1) % bannersList.length);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [bannersList.length]);

  // Limpeza de timeouts
  useEffect(() => {
    return () => {
      if (userResumeTimeoutRef.current) {
        clearTimeout(userResumeTimeoutRef.current);
      }
    };
  }, []);

  // Autoplay do vídeo atual
  useEffect(() => {
    if (isVideo) {
      const vid = videoRefs.current.get(currentIndex);
      if (vid) {
        vid.play().catch(() => {});
      }
    }
  }, [currentIndex, isVideo]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRefs.current.get(currentIndex);
    if (vid) {
      vid.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    registerUserInteraction();
    setCurrentIndex((prev) => (prev === 0 ? bannersList.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    registerUserInteraction();
    setCurrentIndex((prev) => (prev + 1) % bannersList.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    registerUserInteraction();
    setCurrentIndex(index);
  };

  // Redirecionamento unificado (botão CTA ou clique no banner)
  const handleNavigateToLink = (e?: React.MouseEvent) => {
    if (e) {
      // Evita duplo disparo se o clique partiu de um botão filho específico
      const target = e.target as HTMLElement;
      if (target.closest('button[data-banner-ctrl="true"]')) {
        return;
      }
    }

    if (!ctaLink || ctaLink === '#' || ctaLink === '') {
      if (onExploreClick) onExploreClick();
      return;
    }

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
    } else if (ctaLink.startsWith('http://') || ctaLink.startsWith('https://')) {
      window.open(ctaLink, '_blank', 'noopener,noreferrer');
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  // Suporte a Swipe no celular
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      registerUserInteraction();
      if (diff > 0) {
        // Swipe para a esquerda (próximo)
        handleNext();
      } else {
        // Swipe para a direita (anterior)
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#1A1918] select-none">
      {/* Container Principal do Carrossel */}
      <div
        onClick={handleNavigateToLink}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-screen h-[100dvh] min-h-[100dvh] md:h-auto md:min-h-0 md:aspect-[16/9] md:max-h-[calc(100vh)] overflow-hidden ${
          ctaLink ? 'cursor-pointer' : ''
        }`}
      >
        {/* Renderização de todos os slides com crossfade suave */}
        {bannersList.map((banner, index) => {
          const isCurrent = index === currentIndex;
          const isBannerVideo = (banner.tipo_midia || 'video') === 'video';
          const deskMedia = banner.desktop_media_url || '/video/header_video.mp4';
          const mobMedia = banner.mobile_media_url || deskMedia;

          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {isBannerVideo ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                  }}
                  poster="/video/header_poster.jpg"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover object-top"
                >
                  <source src={deskMedia} media="(min-width: 768px)" type="video/mp4" />
                  <source src={mobMedia} type="video/mp4" />
                </video>
              ) : (
                <div className="relative w-full h-full">
                  {/* Desktop 16:9 */}
                  <div className="hidden md:block w-full h-full relative">
                    <Image
                      src={deskMedia}
                      alt={banner.titulo || 'Banner da Vitrine'}
                      fill
                      priority={index === 0}
                      className="object-cover object-center"
                    />
                  </div>
                  {/* Mobile 9:16 */}
                  <div className="block md:hidden w-full h-full relative">
                    <Image
                      src={mobMedia}
                      alt={banner.titulo || 'Banner da Vitrine Mobile'}
                      fill
                      priority={index === 0}
                      className="object-cover object-center"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Gradiente Superior para Legibilidade do Menu */}
        <div className="absolute inset-x-0 top-0 h-32 sm:h-36 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none z-15" />

        {/* Gradiente Inferior para Transição de Seção */}
        <div className="absolute inset-x-0 bottom-0 h-56 sm:h-44 md:h-36 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none z-15" />

        {/* SETAS DE NAVEGAÇÃO DESKTOP (Exibidas quando houver mais de 1 banner) */}
        {bannersList.length > 1 && (
          <>
            <button
              type="button"
              data-banner-ctrl="true"
              onClick={handlePrev}
              aria-label="Banner Anterior"
              className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-25 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2]" />
            </button>

            <button
              type="button"
              data-banner-ctrl="true"
              onClick={handleNext}
              aria-label="Próximo Banner"
              className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-25 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 stroke-[2]" />
            </button>
          </>
        )}

        {/* Botão de Controle de Áudio Discreto (apenas quando o slide atual for vídeo) */}
        {isVideo && (
          <button
            type="button"
            data-banner-ctrl="true"
            onClick={toggleSound}
            className="absolute bottom-6 md:bottom-5 right-4 sm:right-5 z-25 p-2.5 rounded-none bg-black/60 text-white hover:bg-black/85 backdrop-blur-md transition-all shadow-lg border border-white/20 cursor-pointer"
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

        {/* Textos da Chamada de Ação (CTA) */}
        <div className="absolute bottom-28 sm:bottom-28 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center px-4 w-full max-w-2xl pointer-events-auto">
          {titulo && (
            <h1 className="font-serif-luxury text-xl sm:text-3xl md:text-4xl text-white font-medium drop-shadow-md mb-1.5 tracking-tight animate-fade-in">
              {titulo}
            </h1>
          )}

          {subtitulo && (
            <p className="text-xs sm:text-sm text-white/85 max-w-lg mb-4 drop-shadow-sm line-clamp-2 animate-fade-in">
              {subtitulo}
            </p>
          )}

          <button
            type="button"
            data-banner-ctrl="true"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToLink();
            }}
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

        {/* INDICADORES DE PAGINAÇÃO (DOTS / BULLETS) */}
        {bannersList.length > 1 && (
          <div className="absolute bottom-6 md:bottom-5 left-1/2 -translate-x-1/2 z-25 flex items-center gap-2">
            {bannersList.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  data-banner-ctrl="true"
                  onClick={(e) => handleDotClick(idx, e)}
                  aria-label={`Ir para banner ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-7 h-2 bg-[#DFBE76] shadow-md'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
