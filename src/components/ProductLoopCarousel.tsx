'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';

interface ProductLoopCarouselProps {
  products: Product[];
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  onToggleWishlist: (productId: string) => void;
  isOutletSection?: boolean;
  isNewReleasesSection?: boolean;
  isLastPiecesSection?: boolean;
  autoPlayInterval?: number; // Milissegundos entre cada avanço (padrão 3500ms)
}

export const ProductLoopCarousel: React.FC<ProductLoopCarouselProps> = ({
  products,
  onOpenDetails,
  onQuickAdd,
  isWishlisted,
  onToggleWishlist,
  isOutletSection = false,
  isNewReleasesSection = false,
  isLastPiecesSection = false,
  autoPlayInterval = 3600
}) => {
  // Quantidade de itens visíveis por breakpoint
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Se houver poucos produtos, duplicamos para garantir o looping contínuo suave
  const items = products.length > 0 ? products : [];
  const baseCount = items.length;

  // Criamos uma lista estendida para suportar looping infinito perfeito
  const loopList = [...items, ...items, ...items, ...items];
  const [currentIndex, setCurrentIndex] = useState<number>(baseCount);

  // Manipuladores de deslize por toque (Swipe no Mobile)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 35) {
      handleNext();
    } else if (diff < -35) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Detectar resolução para calcular itens visíveis na tela
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCount(2); // 2 cards no mobile
      } else if (width < 1024) {
        setVisibleCount(3); // 3 cards no tablet
      } else {
        setVisibleCount(4); // 4 cards no desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = useCallback(() => {
    if (baseCount === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev >= baseCount * 2) {
        return baseCount + 1;
      }
      return prev + 1;
    });
  }, [baseCount]);

  const handlePrev = useCallback(() => {
    if (baseCount === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev <= baseCount - 1) {
        return baseCount * 2 - 1;
      }
      return prev - 1;
    });
  }, [baseCount]);

  // Autoplay contínuo: avança a cada intervalo se não estiver pausado
  useEffect(() => {
    if (isPaused || baseCount === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, baseCount, autoPlayInterval, handleNext]);

  // Ao terminar a transição CSS, normaliza o índice para o bloco central sem transição perceptível
  const handleTransitionEnd = (e?: React.TransitionEvent<HTMLDivElement>) => {
    if (baseCount === 0) return;
    // Ignorar eventos borbulhados de elementos filhos (como transição de cor de cards ao mudar de tema)
    if (e && (e.target !== e.currentTarget || e.propertyName !== 'transform')) return;

    if (currentIndex >= baseCount * 2) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - baseCount);
    } else if (currentIndex < baseCount) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + baseCount);
    }
  };

  // Trava de segurança 1: Fallback com timeout caso a transição CSS seja interrompida
  // (por exemplo, cliques rápidos e repetidos no botão de tema claro/escuro no mobile)
  useEffect(() => {
    if (baseCount === 0) return;

    if (currentIndex >= baseCount * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex((prev) => (prev >= baseCount * 2 ? prev - baseCount : prev));
      }, 700);
      return () => clearTimeout(timer);
    } else if (currentIndex < baseCount) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex((prev) => (prev < baseCount ? prev + baseCount : prev));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, baseCount]);

  // Trava de segurança 2: Impede categoricamente que o índice escape do limite de dados
  useEffect(() => {
    if (baseCount === 0) return;
    if (currentIndex >= baseCount * 3 || currentIndex < 0) {
      setIsTransitioning(false);
      setCurrentIndex(baseCount);
    }
  }, [currentIndex, baseCount]);

  // Reativa a transição caso tenha sido desligada no snap
  useEffect(() => {
    if (!isTransitioning) {
      const timer = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isTransitioning]);

  if (items.length === 0) {
    return null;
  }

  // Deslocamento em porcentagem de acordo com o número de itens visíveis
  const stepPercentage = 100 / visibleCount;
  // Garantia matemática: o índice visual nunca pode ultrapassar o último produto da lista
  const maxSafeIndex = Math.max(0, loopList.length - visibleCount);
  const safeIndex = Math.min(Math.max(currentIndex, 0), maxSafeIndex);
  const translateX = -(safeIndex * stepPercentage);

  return (
    <div
      className="relative w-full group/carousel select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => setIsPaused(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container com máscara de corte */}
      <div className="overflow-hidden w-full -mx-1.5 sm:-mx-2.5 px-0 py-2">
        <div
          className="flex"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isTransitioning
              ? 'transform 650ms cubic-bezier(0.25, 1, 0.5, 1)'
              : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
          onTransitionCancel={handleTransitionEnd}
        >
          {loopList.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="shrink-0 px-1.5 sm:px-2.5"
              style={{ width: `${stepPercentage}%` }}
            >
              <ProductCard
                product={product}
                columnsCount={visibleCount === 4 ? 4 : 2}
                isOutletSection={isOutletSection}
                isNewReleasesSection={isNewReleasesSection}
                isLastPiecesSection={isLastPiecesSection}
                onOpenDetails={(p) => {
                  setIsPaused(true);
                  onOpenDetails(p);
                }}
                onQuickAdd={(p) => {
                  setIsPaused(true);
                  onQuickAdd(p);
                }}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Navegação Lateral (Sempre visíveis no Mobile, surgem no hover no Desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(true);
          handlePrev();
        }}
        className="absolute left-1 sm:left-0 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-none bg-white/95 dark:bg-[#1A1918]/95 border border-[#C5A059]/50 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] flex items-center justify-center shadow-lg transition-all opacity-100 sm:opacity-0 sm:group-hover/carousel:opacity-100 hover:scale-105 active:scale-90 cursor-pointer sm:-translate-x-4"
        aria-label="Voltar peça anterior"
        title="Voltar peça anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059] hover:text-inherit" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(true);
          handleNext();
        }}
        className="absolute right-1 sm:right-0 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-none bg-white/95 dark:bg-[#1A1918]/95 border border-[#C5A059]/50 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] flex items-center justify-center shadow-lg transition-all opacity-100 sm:opacity-0 sm:group-hover/carousel:opacity-100 hover:scale-105 active:scale-90 cursor-pointer sm:translate-x-4"
        aria-label="Avançar próxima peça"
        title="Avançar próxima peça"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059] hover:text-inherit" />
      </button>
    </div>
  );
};
