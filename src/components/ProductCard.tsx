'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Eye, ShoppingBag, Plus, Check, Clock } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  isOutletSection?: boolean;
  isNewReleasesSection?: boolean;
  isLastPiecesSection?: boolean;
  columnsCount?: 2 | 3 | 4 | 5;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onQuickAdd,
  isWishlisted,
  onToggleWishlist,
  isOutletSection = false,
  isNewReleasesSection = false,
  isLastPiecesSection = false,
  columnsCount = 4
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = product.media.find((m) => m.type === 'video')?.src;

  // Variações de estilo baseadas na densidade de colunas
  const isCompact = columnsCount === 5;
  const isMedium = columnsCount === 4;
  const isSpacious = columnsCount === 2 || columnsCount === 3;

  const [isJustAdded, setIsJustAdded] = useState(false);
  const router = useRouter();
  const { cartCount, addToCart, getItemStock, activeReservations } = useStore();

  const isOutOfStock = product.totalStock === 0;

  // Verifica se todas as unidades físicas do produto estão atualmente retidas por reservas temporárias
  const isAllReserved = useMemo(() => {
    if (isOutOfStock) return false;
    if (product.variations && product.variations.length > 0) {
      const anyPhysical = product.variations.some((v) => v.stock > 0);
      if (!anyPhysical) return false;
      const anyLiquid = product.variations.some((v) => getItemStock(product.id, v.size, v.color) > 0);
      return !anyLiquid;
    }
    const liquid = getItemStock(product.id, 'Tamanho Único', 'Padrão');
    return liquid <= 0 && (product.totalStock ?? 0) > 0;
  }, [product, getItemStock, isOutOfStock, activeReservations]);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAllReserved) {
      onOpenDetails(product);
      return;
    }

    // Procura o primeiro tamanho e cor com estoque líquido disponível
    let targetSize = product.sizes?.[0] || 'Tamanho Único';
    let targetColor = product.colors?.[0]?.name || 'Padrão';

    if (product.variations && product.variations.length > 0) {
      const availableVar = product.variations.find(
        (v) => getItemStock(product.id, v.size, v.color) > 0
      );
      if (availableVar) {
        targetSize = availableVar.size;
        targetColor = availableVar.color;
      }
    }

    // Se mesmo assim não houver estoque líquido disponível, abre o modal
    if (getItemStock(product.id, targetSize, targetColor) <= 0) {
      onOpenDetails(product);
      return;
    }

    // Adiciona diretamente à sacola com feedback visual instantâneo, sem abrir modal de detalhes
    addToCart({
      product,
      size: targetSize,
      color: targetColor,
      quantity: 1,
      openDrawer: false
    });
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1600);
  };

  return (
    <div
      className="group relative flex flex-col h-full bg-white dark:bg-[#1A1918] rounded-none overflow-hidden border border-[#C5A059]/20 dark:border-[#C5A059]/30 transition-all duration-300 hover:border-[#C5A059]/60 hover:shadow-xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(product)}
    >
      {/* Moldura da Imagem / Vídeo com proporção de alta moda (3:4) e altura máxima proporcional */}
      <div
        className="relative aspect-[3/4] max-h-[250px] sm:max-h-[265px] lg:max-h-[280px] xl:max-h-[340px] 2xl:max-h-[400px] w-full bg-[#F4F2EE] dark:bg-[#22201E] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        {/* Imagem do Produto */}
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={`object-cover object-top transition-all duration-700 ${
            isHovered && videoSrc ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
          }`}
        />

        {/* Vídeo do Provador (Injetado exclusivamente no hover do desktop para performance máxima) */}
        {isHovered && videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge de Destaque com Regras de Exibição */}
        {(() => {
          // 0. Produto Esgotado no Estoque Físico
          if (isOutOfStock) {
            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-neutral-900/95 dark:bg-neutral-950/95 text-neutral-300 uppercase tracking-wider font-bold rounded-none backdrop-blur-sm border border-neutral-700/60 shadow-xs ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                Esgotado
              </div>
            );
          }

          // 0.5. Produto com unidades físicas, mas 100% em Reserva Temporária no WhatsApp
          if (isAllReserved) {
            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-rose-600/95 dark:bg-rose-900/95 text-white uppercase tracking-wider font-bold rounded-none backdrop-blur-sm border border-rose-400/40 shadow-xs flex items-center gap-1 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                <Clock className="w-2.5 h-2.5 animate-pulse" />
                <span>Em Reserva</span>
              </div>
            );
          }

          // 1. Regra para Seção de Lançamentos Exclusivos:
          // O usuário pediu explicitamente: DEIXAR SEM CARDS EM CIMA DOS PRODUTOS!
          if (isNewReleasesSection) {
            return null;
          }

          // 2. Seção "Últimas Peças" (somente entram quando restam 5 peças ou menos)
          if (isLastPiecesSection || product.isLastPieces || (product.remainingPieces && product.remainingPieces <= 5)) {
            const count = product.remainingPieces || 5;
            const label =
              product.badge && product.badge.includes('peça')
                ? product.badge
                : count === 1
                ? 'Última peça'
                : `Restam ${count} peças`;

            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-[#8B5A2B]/95 dark:bg-black/95 text-[#FAF8F5] uppercase tracking-wider font-semibold rounded-none backdrop-blur-sm border border-[#C5A059]/40 shadow-xs ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                {label}
              </div>
            );
          }

          // 3. Seção OUTLET ou produtos com desconto fora de lançamentos
          if (product.discountBadge) {
            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-[#C5A059] text-white uppercase tracking-wider font-bold rounded-none backdrop-blur-sm shadow-xs ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                {product.discountBadge}
              </div>
            );
          }

          // 4. Badges de escassez padrão para outros cards
          if (
            product.badge?.includes('Restam') ||
            product.badge?.includes('peça') ||
            product.badge?.includes('Faltam')
          ) {
            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-[#8B5A2B]/90 dark:bg-black/90 text-[#FAF8F5] uppercase tracking-wider font-semibold rounded-none backdrop-blur-sm border border-[#C5A059]/40 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                {product.badge}
              </div>
            );
          }

          return null;
        })()}

        {/* Botão de Favoritar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-none transition-all duration-300 shadow-md cursor-pointer ${
            isWishlisted
              ? 'bg-[#C5A059] text-white'
              : 'bg-white/90 dark:bg-[#1A1918]/90 text-[#1A1918] dark:text-white hover:bg-white hover:text-[#C5A059]'
          }`}
          aria-label="Adicionar aos favoritos"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Botão Overlay Flutuante ao Hover (Desktop) */}
        <div className="absolute bottom-2.5 left-2.5 right-12 hidden md:block opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="w-full py-2 bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider rounded-none shadow-md hover:bg-[#1A1918] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span className="truncate">{isCompact ? 'Detalhes' : 'Ver Detalhes'}</span>
          </button>
        </div>
      </div>

      {/* Detalhes do Produto com Slots de Altura Garantida */}
      <div className={`flex flex-col flex-1 justify-between bg-white dark:bg-[#1A1918] ${
        isCompact ? 'p-2.5 sm:p-3' : isMedium ? 'p-2.5 sm:p-3.5' : 'p-3.5 sm:p-5'
      }`}>
        <div className="flex flex-col">
          {/* SLOT 1: Categoria (Altura fixa garantida para nunca empurrar o título) */}
          <div className="h-4 sm:h-5 flex items-center">
            <span className={`uppercase tracking-widest text-[#C5A059] dark:text-[#DFBE76] font-medium truncate block ${
              isCompact ? 'text-[9px] sm:text-[10px]' : 'text-[9px] sm:text-[10px]'
            }`}>
              {product.category}
            </span>
          </div>

          {/* SLOT 2: Nome da Peça (Altura fixa reservada com line-clamp-2) */}
          <div className={`flex items-start ${
            isCompact ? 'h-8 sm:h-9' : isMedium ? 'h-8 sm:h-9' : 'h-10 sm:h-11'
          }`}>
            <h3
              onClick={() => onOpenDetails(product)}
              className={`font-serif-luxury font-medium text-[#1A1918] dark:text-[#FAF8F5] leading-snug hover:text-[#C5A059] dark:hover:text-[#DFBE76] transition-colors cursor-pointer line-clamp-2 ${
                isCompact
                  ? 'text-xs sm:text-[13px]'
                  : isMedium
                  ? 'text-xs sm:text-sm'
                  : 'text-sm sm:text-base'
              }`}
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* SLOT 3: Paleta de Cores e Tamanhos (Altura fixa perfeitamente nivelada) */}
          <div className="mt-1 sm:mt-1.5 h-6 flex items-center justify-between gap-1">
            {/* Cores */}
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                {product.colors.slice(0, 3).map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-none border border-black/20 dark:border-white/20 shadow-2xs block shrink-0"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <span
                className={`text-[#78716C] dark:text-[#A8A29E] truncate ${
                  isCompact ? 'text-[9px]' : 'text-[9px] sm:text-[10px]'
                }`}
                title={product.colors.length > 1 ? `${product.colors.length} cores: ${product.colors.map((c) => c.name).join(', ')}` : product.colors[0]?.name}
              >
                {product.colors.length > 1
                  ? `${product.colors.length} cores`
                  : product.colors[0]?.name}
              </span>
            </div>

            {/* Tamanho (Exibe 'Único' quando for 'Tamanho Único') */}
            <span className={`text-[#78716C] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#252220] rounded-none border border-[#C5A059]/20 font-medium shrink-0 ${
              isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5'
            }`}>
              {product.sizes[0] === 'Tamanho Único' ? 'Único' : product.sizes[0]?.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* SLOT 4: Preço e Botão de Ação (Empilhado verticalmente no mobile para nunca sobrepor) */}
        <div className="mt-2 sm:mt-2.5 pt-2 border-t border-[#C5A059]/15 flex flex-col gap-2">
          <div className="w-full flex items-baseline justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              {/* Rótulo de preço ou preço original de OUTLET */}
              {isOutletSection && product.formattedOriginalPrice ? (
                <div className="flex items-center gap-1.5 leading-none mb-1">
                  <span className="text-[10px] sm:text-[11px] text-[#A8A29E] line-through font-normal leading-none">
                    {product.formattedOriginalPrice}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#C5A059] font-bold leading-none">
                    OUTLET
                  </span>
                </div>
              ) : (
                <span className="text-[9px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] block truncate leading-none mb-1">
                  Valor da Peça
                </span>
              )}
              {/* Valor numérico */}
              <div className="flex items-baseline gap-1">
                <span className={`font-bold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight leading-none ${
                  isCompact ? 'text-sm sm:text-base' : isMedium ? 'text-sm sm:text-base lg:text-lg' : 'text-base sm:text-lg lg:text-xl'
                }`}>
                  {product.formattedPrice}
                </span>
              </div>
            </div>

            {/* Indicador sutil de estoque baixo */}
            {product.remainingPieces && product.remainingPieces > 0 && product.remainingPieces <= 3 && !isOutOfStock && !isAllReserved && (
              <span className="text-[9px] font-semibold text-[#8B5A2B] dark:text-[#DFBE76] bg-[#8B5A2B]/10 dark:bg-[#DFBE76]/10 px-1.5 py-0.5 rounded-none whitespace-nowrap shrink-0">
                Restam {product.remainingPieces}
              </span>
            )}
          </div>

          {/* Botão de Compra Inteligente (Largura total no mobile para toque confortável e sem colisão) */}
          {isOutOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="w-full py-2 px-2.5 rounded-none bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              title="Peça esgotada no estoque"
              aria-label="Esgotado"
            >
              <span>Esgotado</span>
            </button>
          ) : isAllReserved ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="w-full py-2 px-2.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              title="Peça em reserva temporária no provador de outra cliente - Clique para lista VIP"
              aria-label="Em Reserva"
            >
              <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span className="truncate">Em Reserva (Lista VIP)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              className={`w-full py-2 px-2.5 rounded-none transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.99] ${
                isJustAdded
                  ? 'bg-[#25D366] text-white border border-[#25D366]'
                  : 'bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918]'
              }`}
              title="Adicionar à Sacola"
              aria-label="Adicionar à Sacola"
            >
              {isJustAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Adicionado</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isCompact ? 'Adicionar' : 'Adicionar à Sacola'}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
