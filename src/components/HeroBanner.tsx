'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, ChevronDown } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback de política de autoplay móvel
      });
    }
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#1A1918]">
      {/* Container do Banner de Vídeo: 100% da tela (100dvh) no Mobile para Imersão Total e 16/9 no Desktop */}
      <div className="relative w-full h-screen h-[100dvh] min-h-[100dvh] md:h-auto md:min-h-0 md:aspect-[16/9] md:max-h-[calc(100vh)] overflow-hidden">
        <video
          ref={videoRef}
          src="/video/header_video.mp4"
          poster="/video/header_poster.jpg"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover object-top"
        />

        {/* Gradiente Superior para Legibilidade do Menu Transparente */}
        <div className="absolute inset-x-0 top-0 h-32 sm:h-36 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none z-10" />

        {/* Gradiente Inferior para Transição Harmoniosa */}
        <div className="absolute inset-x-0 bottom-0 h-44 sm:h-36 md:h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10" />

        {/* Botão de Controle de Áudio Discreto */}
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

        {/* Chamada Sutil para Rolar até os Produtos (Posicionamento elevado conforme solicitado para Mobile e Desktop) */}
        <div className="absolute bottom-32 sm:bottom-32 md:bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <button
            onClick={onExploreClick}
            className="px-5 py-2 rounded-none bg-white/45 hover:bg-white/90 text-[#1A1918] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-sm backdrop-blur-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 border border-white/60 hover:border-[#C5A059]/70"
          >
            <span>Conhecer Coleção</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
