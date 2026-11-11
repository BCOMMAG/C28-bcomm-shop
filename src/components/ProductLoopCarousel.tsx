'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  isBestSellerSection?: boolean;
  isLastPiecesSection?: boolean;
  autoPlayInterval?: number; // Milissegundos entre cada avanço (padrão 3600ms)
}

export const ProductLoopCarousel: React.FC<ProductLoopCarouselProps> = ({
  products,
  onOpenDetails,
  onQuickAdd,
  isWishlisted,
  onToggleWishlist,
  isOutletSection = false,
  isNewReleasesSection = false,
  isBestSellerSection = false,
  isLastPiecesSection = false,
  autoPlayInterval = 3600
}) => {
  // Quantidade de itens visíveis por breakpoint (2 no mobile, 3 no tablet, 4 no desktop)
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const items = products.length > 0 ? products : [];
  const baseCount = items.length;

  // Criamos uma lista estendida para suportar looping infinito perfeito em qualquer seção (>= 2 peças)
  const { loopList, unitLength } = useMemo(() => {
    if (baseCount < 2) {
      return { loopList: items, unitLength: baseCount };
    }
    let unit: Product[] = [...items];
    while (unit.length < 6) {
      unit = [...unit, ...items];
    }
    // 3 buffers: [Buffer 1 (prev), Buffer 2 (active), Buffer 3 (next)]
    const fullLoop = [...unit, ...unit, ...unit];
    return { loopList: fullLoop, unitLength: unit.length };
  }, [items, baseCount]);

  const [currentIndex, setCurrentIndex] = useState<number>(unitLength);

  useEffect(() => {
    setCurrentIndex(unitLength);
  }, [unitLength]);

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
        setVisibleCount(2); // Exatamente 2 cards por tela no mobile
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
    if (unitLength < 2) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev >= unitLength * 2) {
        return unitLength + 1;
      }
      return prev + 1;
    });
  }, [unitLength]);

  const handlePrev = useCallback(() => {
    if (unitLength < 2) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev <= unitLength - 1) {
        return unitLength * 2 - 1;
      }
      return prev - 1;
    });
  }, [unitLength]);

  // Autoplay contínuo: avança a cada intervalo se não estiver pausado
  useEffect(() => {
    if (isPaused || unitLength < 2) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, unitLength, autoPlayInterval, handleNext]);

  // Ao terminar a transição CSS, normaliza o índice para o bloco central sem transição perceptível
  const handleTransitionEnd = (e?: React.TransitionEvent<HTMLDivElement>) => {
    if (unitLength < 2) return;
    // Ignorar eventos borbulhados de elementos filhos (como transição de cor de cards ao mudar de tema)
    if (e && (e.target !== e.currentTarget || e.propertyName !== 'transform')) return;

    if (currentIndex >= unitLength * 2) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - unitLength);
    } else if (currentIndex < unitLength) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + unitLength);
    }
  };

  // Trava de segurança 1: Fallback com timeout caso a transição CSS seja interrompida
  useEffect(() => {
    if (unitLength < 2) return;

    if (currentIndex >= unitLength * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex((prev) => (prev >= unitLength * 2 ? prev - unitLength : prev));
      }, 700);
      return () => clearTimeout(timer);
    } else if (currentIndex < unitLength) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex((prev) => (prev < unitLength ? prev + unitLength : prev));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, unitLength]);

  // Trava de segurança 2: Impede categoricamente que o índice escape do limite de dados
  useEffect(() => {
    if (unitLength < 2) return;
    if (currentIndex >= unitLength * 3 || currentIndex < 0) {
      setIsTransitioning(false);
      setCurrentIndex(unitLength);
    }
  }, [currentIndex, unitLength]);

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

  // Se houver apenas 1 produto, renderiza centralizado sem repetições
  if (baseCount === 1) {
    return (
      <div className="w-full flex justify-center py-2 animate-fadeIn">
        <div className="w-full max-w-xs sm:max-w-sm">
          <ProductCard
            product={items[0]}
            columnsCount={1}
            isOutletSection={isOutletSection}
            isNewReleasesSection={isNewReleasesSection}
            isBestSellerSection={isBestSellerSection}
            isLastPiecesSection={isLastPiecesSection}
            onOpenDetails={onOpenDetails}
            onQuickAdd={onQuickAdd}
            isWishlisted={isWishlisted(items[0].id)}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      </div>
    );
  }

  // MODO CARROSSEL INFINITO (Ativado para qualquer seção com 2 ou mais produtos)
  // Deslocamento em porcentagem de acordo com o número de itens visíveis (2 no mobile = 50% por card)
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
                isBestSellerSection={isBestSellerSection}
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

      {/* Botões de Navegação Lateral (SEMPRE APARENTES E VISÍVEIS no Mobile e Desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsPaused(true);
          handlePrev();
        }}
        className="absolute left-1 sm:-left-3 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-none bg-white/95 dark:bg-[#1A1918]/95 border border-[#C5A059]/50 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] flex items-center justify-center shadow-lg transition-all opacity-100 hover:scale-105 active:scale-90 cursor-pointer"
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
        className="absolute right-1 sm:-right-3 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-none bg-white/95 dark:bg-[#1A1918]/95 border border-[#C5A059]/50 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] flex items-center justify-center shadow-lg transition-all opacity-100 hover:scale-105 active:scale-90 cursor-pointer"
        aria-label="Avançar próxima peça"
        title="Avançar próxima peça"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059] hover:text-inherit" />
      </button>
    </div>
  );
};
