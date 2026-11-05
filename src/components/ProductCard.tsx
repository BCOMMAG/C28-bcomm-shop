'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Eye, ShoppingBag, Plus, Check, Clock } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { isVideoUrl } from '@/lib/products';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  isOutletSection?: boolean;
  isNewReleasesSection?: boolean;
  isBestSellerSection?: boolean;
  isLastPiecesSection?: boolean;
  columnsCount?: 1 | 2 | 3 | 4 | 5;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onQuickAdd,
  isWishlisted,
  onToggleWishlist,
  isOutletSection = false,
  isNewReleasesSection = false,
  isBestSellerSection = false,
  isLastPiecesSection = false,
  columnsCount = 4
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverColorImage, setHoverColorImage] = useState<string | null>(null);
  const [hoverColorName, setHoverColorName] = useState<string | null>(null);
  const [isSecondImageLoaded, setIsSecondImageLoaded] = useState(false);

  // Imagem exibida (permite troca dinâmica instantânea ao passar o mouse nas cores, garantindo que nunca seja vídeo)
  const safeThumbnail = !isVideoUrl(product.thumbnail) ? product.thumbnail : '/placeholder-product.jpg';
  const currentThumbnail = (hoverColorImage && !isVideoUrl(hoverColorImage)) ? hoverColorImage : safeThumbnail;

  // Foto secundária para o efeito suave de hover (padrão de moda internacional)
  const secondaryImage = useMemo(() => {
    if (!product.media || product.media.length < 2) return null;
    const realImages = product.media.filter(
      (m) => m.type === 'image' && !isVideoUrl(m.src) && m.src !== currentThumbnail
    );
    return realImages[0]?.src || null;
  }, [product.media, currentThumbnail]);

  // Resolução Inteligente e Fiel dos Preços Vigentes (compatibilidade integral entre Card, Modal e Variações)
  const priceDisplay = useMemo(() => {
    // 1. Se o cliente estiver com o mouse sobre uma cor específica
    if (hoverColorName && product.variations && product.variations.length > 0) {
      const colorVars = product.variations.filter(
        (v) => v.color.toLowerCase() === hoverColorName.toLowerCase()
      );
      if (colorVars.length > 0) {
        // Variação representativa (prioriza a que tem estoque)
        const targetVar = colorVars.find((v) => v.stock > 0) || colorVars[0];
        const vBase = targetVar.price && targetVar.price > 0 ? targetVar.price : (product.originalPrice || product.price);
        const vPromo = targetVar.promoPrice && targetVar.promoPrice > 0 ? targetVar.promoPrice : null;
        const hasDesc = vPromo !== null && vPromo < vBase;
        const finalPrice = hasDesc ? vPromo! : vBase;
        const savings = hasDesc ? vBase - finalPrice : 0;
        const pct = hasDesc && vBase > 0 ? Math.round((savings / vBase) * 100) : 0;

        return {
          currentPrice: finalPrice,
          originalPrice: hasDesc ? vBase : null,
          hasRealDiscount: hasDesc,
          savingsAmount: savings,
          discountPercent: pct,
          isDivergent: false,
          label: hasDesc ? undefined : 'Valor da Peça'
        };
      }
    }

    // 2. Se houver variações cadastradas na peça
    if (product.variations && product.variations.length > 0) {
      const activeVars = product.variations.filter((v) => v.stock > 0);
      const targetVars = activeVars.length > 0 ? activeVars : product.variations;

      const mappedVars = targetVars
        .map((v) => {
          const vBase = v.price && v.price > 0 ? v.price : (product.originalPrice || product.price);
          const vPromo = v.promoPrice && v.promoPrice > 0 ? v.promoPrice : null;
          const hasDesc = vPromo !== null && vPromo < vBase;
          const finalPrice = hasDesc ? vPromo! : vBase;
          return {
            basePrice: vBase,
            promoPrice: vPromo,
            finalPrice,
            hasDiscount: hasDesc,
            savings: hasDesc ? vBase - finalPrice : 0,
            pct: hasDesc && vBase > 0 ? Math.round(((vBase - finalPrice) / vBase) * 100) : 0
          };
        })
        .filter((item) => item.finalPrice > 0);

      if (mappedVars.length > 0) {
        const minItem = mappedVars.reduce(
          (min, cur) => (cur.finalPrice < min.finalPrice ? cur : min),
          mappedVars[0]
        );
        const maxItem = mappedVars.reduce(
          (max, cur) => (cur.finalPrice > max.finalPrice ? cur : max),
          mappedVars[0]
        );
        const isDivergent = minItem.finalPrice !== maxItem.finalPrice;

        const anyDiscount = mappedVars.some((v) => v.hasDiscount) || Boolean(product.originalPrice && product.originalPrice > minItem.finalPrice);
        if (anyDiscount) {
          const origPrice = minItem.basePrice > minItem.finalPrice ? minItem.basePrice : (product.originalPrice || minItem.basePrice);
          const savings = origPrice - minItem.finalPrice;
          const pct = origPrice > 0 ? Math.round((savings / origPrice) * 100) : 0;
          return {
            currentPrice: minItem.finalPrice,
            originalPrice: origPrice,
            hasRealDiscount: true,
            savingsAmount: savings,
            discountPercent: pct,
            isDivergent,
            label: isDivergent ? 'A partir de' : undefined
          };
        }

        return {
          currentPrice: minItem.finalPrice,
          originalPrice: null,
          hasRealDiscount: false,
          savingsAmount: 0,
          discountPercent: 0,
          isDivergent,
          label: isDivergent ? 'A partir de' : 'Valor da Peça'
        };
      }
    }

    // 3. Fallback: precificação base do produto
    const hasDiscount = Boolean(
      product.originalPrice &&
      product.price &&
      product.originalPrice > product.price
    );
    const savings = hasDiscount && product.originalPrice ? product.originalPrice - product.price : 0;
    const pct = product.discountPercent || (hasDiscount && product.originalPrice ? Math.round((savings / product.originalPrice) * 100) : 0);

    return {
      currentPrice: product.price,
      originalPrice: hasDiscount ? product.originalPrice : null,
      hasRealDiscount: hasDiscount,
      savingsAmount: savings,
      discountPercent: pct,
      isDivergent: false,
      label: 'Valor da Peça'
    };
  }, [product, hoverColorName]);

  // Variações de estilo baseadas na densidade de colunas
  const isCompact = columnsCount === 5;
  const isMedium = columnsCount === 4;
  const isSpacious = columnsCount === 1 || columnsCount === 2 || columnsCount === 3;

  const [isJustAdded, setIsJustAdded] = useState(false);
  const router = useRouter();
  const { cartCount, addToCart, getItemStock, activeReservations, currentTenant } = useStore();
  const showStockQty = currentTenant?.configuracoes_visuais?.exibir_quantidade_estoque_consumidor ?? true;

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
      onMouseEnter={() => {
        setIsHovered(true);
        if (secondaryImage && !isSecondImageLoaded && typeof window !== 'undefined') {
          const preImg = new window.Image();
          preImg.src = secondaryImage;
          preImg.onload = () => setIsSecondImageLoaded(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(product)}
    >
      {/* Moldura da Imagem / Vídeo com proporção de alta moda (3:4) e altura máxima proporcional */}
      <div
        className="relative aspect-[3/4] catalog-card-image w-full bg-[#F4F2EE] dark:bg-[#22201E] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        {/* Imagem Principal do Produto (Fixa na base z-0: nunca desaparece nem cria buraco cinza) */}
        <Image
          key={currentThumbnail}
          src={currentThumbnail}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Segunda Imagem no Hover (Sobreposta z-10: fade-in suave somente após carregada pelo browser) */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} - Detalhe`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onLoad={() => setIsSecondImageLoaded(true)}
            className={`object-cover object-top transition-all duration-500 pointer-events-none absolute inset-0 z-10 ${
              isHovered && isSecondImageLoaded ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          />
        )}

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15" />

        {/* Badge de Destaque com Regras Estritas de Exibição (Só aparece se o lojista configurar expressamente) */}
        {(() => {
          const visuais = (currentTenant as any)?.configuracoes_visuais || {};
          // Se o lojista NÃO ativou expressamente para aparecer na vitrine, a foto permanece 100% limpa (Minimal Luxury)
          const exibirBadgesVitrine = visuais.exibir_badges_na_vitrine === true;
          const exibirSeloEscassezFoto = visuais.exibir_selo_escassez_foto === true;

          // Sinalizadores dinâmicos configurados no tenant
          const tenantSinalizadores: any[] = visuais.atributos_pecas?.sinalizadores || [];
          const getBadgeConfig = (idOrName: string) => {
            const found = tenantSinalizadores.find(
              (s) => s.id === idOrName || (s.nome && s.nome.toLowerCase() === idOrName.toLowerCase()) || (s.label && s.label.toLowerCase() === idOrName.toLowerCase())
            );
            // Se o sinalizador existir e estiver desativado pelo lojista, não exibe
            if (found && (found.ativo === false || found.exibir_na_foto === false)) return null;
            return found;
          };

          // 0. Produto Esgotado no Estoque Físico (aviso operacional crítico)
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

          // Se o lojista NÃO configurou para exibir selos sobre as fotos na vitrine, mantém a fotografia limpa
          if (!exibirBadgesVitrine) {
            return null;
          }

          // 1. Regra para Seção de Lançamentos Exclusivos: omite selo idêntico
          if (isNewReleasesSection) {
            return null;
          }

          // 2. Seção OUTLET ou produtos com desconto ativo (só exibe fora da seção outlet)
          const isOutletItem = !isOutletSection && (product.isOutlet || (product.discountBadge && product.discountBadge.includes('OUTLET')));
          if (isOutletItem || (product.discountBadge && !isOutletSection)) {
            const outletCfg = getBadgeConfig('outlet');
            if (outletCfg !== null) {
              const outletBg = outletCfg?.cor || outletCfg?.color || '#C5A059';
              const badgeText = product.discountBadge || (isOutletItem ? 'OUTLET' : null);

              if (badgeText) {
                return (
                  <div
                    className={`absolute top-2.5 left-2.5 uppercase tracking-wider font-bold rounded-none backdrop-blur-sm shadow-xs flex items-center gap-1 ${
                      isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                    }`}
                    style={{ backgroundColor: outletBg, color: outletCfg?.textColor || '#ffffff' }}
                  >
                    {outletCfg?.icone && <span className="text-[11px] leading-none">{outletCfg.icone}</span>}
                    <span>{badgeText}</span>
                  </div>
                );
              }
            }
          }

          // 3. Seção "Últimas Peças" / Estoque Crítico (somente se lojista autorizou explicitamente selo de escassez na foto)
          const isRealCriticalStock = (product.totalStock ?? 0) > 0 && (product.totalStock ?? 0) <= 5;
          const ultimasPecasCfg = getBadgeConfig('ultimas_pecas');
          if (exibirSeloEscassezFoto && isRealCriticalStock && !isLastPiecesSection && product.isLastPieces && ultimasPecasCfg !== null) {
            const count = product.remainingPieces || product.totalStock || 5;
            let label = 'Últimas peças';
            if (showStockQty) {
              label = count === 1 ? 'Última peça' : `Restam ${count} peças`;
            } else {
              label = count === 1 ? 'Última peça' : 'Últimas peças';
            }

            const badgeBg = ultimasPecasCfg?.cor || ultimasPecasCfg?.color || '#8B5A2B';
            const badgeIcon = ultimasPecasCfg?.icone || ultimasPecasCfg?.icon;

            return (
              <div
                className={`absolute top-2.5 left-2.5 uppercase tracking-wider font-semibold rounded-none backdrop-blur-sm border border-white/20 shadow-xs flex items-center gap-1 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
                style={{ backgroundColor: badgeBg, color: ultimasPecasCfg?.textColor || '#FAF8F5' }}
              >
                {badgeIcon && <span className="text-[11px] leading-none">{badgeIcon}</span>}
                <span>{label}</span>
              </div>
            );
          }

          // 4. Sinalizadores Customizados Ativos na Peça
          if (Array.isArray(product.customBadges) && product.customBadges.length > 0) {
            const firstBadgeName = product.customBadges[0];
            const foundCfg = getBadgeConfig(firstBadgeName);
            if (foundCfg !== null && foundCfg !== undefined) {
              const badgeBg = foundCfg?.cor || foundCfg?.color || '#C5A059';
              const badgeIcon = foundCfg?.icone || foundCfg?.icon || '✨';
              return (
                <div
                  className={`absolute top-2.5 left-2.5 uppercase tracking-wider font-bold rounded-none backdrop-blur-sm shadow-xs flex items-center gap-1 ${
                    isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                  }`}
                  style={{ backgroundColor: badgeBg, color: foundCfg?.textColor || '#ffffff' }}
                >
                  <span className="text-[11px] leading-none">{badgeIcon}</span>
                  <span>{foundCfg?.nome || firstBadgeName}</span>
                </div>
              );
            }
          }

          // 5. Mais Vendido (NUNCA exibe na seção de Mais Vendidos por redundância visual)
          if (product.isBestSeller && !isBestSellerSection) {
            const mvCfg = getBadgeConfig('mais_vendido');
            if (mvCfg !== null) {
              const mvBg = mvCfg?.cor || mvCfg?.color || '#9333EA';
              return (
                <div
                  className={`absolute top-2.5 left-2.5 uppercase tracking-wider font-bold rounded-none backdrop-blur-sm shadow-xs flex items-center gap-1 ${
                    isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                  }`}
                  style={{ backgroundColor: mvBg, color: mvCfg?.textColor || '#ffffff' }}
                >
                  <span className="text-[11px] leading-none">{mvCfg?.icone || '🔥'}</span>
                  <span>{mvCfg?.nome || 'Mais Vendido'}</span>
                </div>
              );
            }
          }

          // 6. Lançamento (NUNCA exibe na seção de Lançamentos por redundância visual)
          if (product.isNewArrival && !isNewReleasesSection) {
            const destCfg = getBadgeConfig('destaque');
            if (destCfg !== null) {
              const destBg = destCfg?.cor || destCfg?.color || '#C5A059';
              return (
                <div
                  className={`absolute top-2.5 left-2.5 uppercase tracking-wider font-bold rounded-none backdrop-blur-sm shadow-xs flex items-center gap-1 ${
                    isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                  }`}
                  style={{ backgroundColor: destBg, color: destCfg?.textColor || '#ffffff' }}
                >
                  <span className="text-[11px] leading-none">{destCfg?.icone || '🌟'}</span>
                  <span>{destCfg?.nome || 'Lançamento'}</span>
                </div>
              );
            }
          }

          // 7. Badges de escassez padrão para outros cards (somente se autorizado)
          if (
            exibirSeloEscassezFoto &&
            isRealCriticalStock &&
            !isLastPiecesSection &&
            (product.badge?.includes('Restam') ||
              product.badge?.includes('peça') ||
              product.badge?.includes('Faltam'))
          ) {
            const label = showStockQty ? product.badge : 'Últimas peças';
            return (
              <div
                className={`absolute top-2.5 left-2.5 bg-[#8B5A2B]/90 dark:bg-black/90 text-[#FAF8F5] uppercase tracking-wider font-semibold rounded-none backdrop-blur-sm border border-[#C5A059]/40 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
                }`}
              >
                {label}
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
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      if (color.imageSrc) setHoverColorImage(color.imageSrc);
                      setHoverColorName(color.name);
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      setHoverColorImage(null);
                      setHoverColorName(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (color.imageSrc) setHoverColorImage(color.imageSrc);
                      setHoverColorName(color.name);
                    }}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-none border border-black/20 dark:border-white/20 shadow-2xs block shrink-0 transition-transform hover:scale-125 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name}${color.imageSrc ? ' (Passe o mouse para ver a foto)' : ''}`}
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
          <div className="w-full flex items-start justify-between gap-2 min-w-0 min-h-[58px]">
            <div className="min-w-0 flex-1 flex flex-col justify-end">
              {priceDisplay.hasRealDiscount ? (
                <>
                  {/* Linha 1: Preço Original Riscado + Tag de Promoção/Outlet */}
                  <div className="flex items-center gap-1.5 leading-none mb-1">
                    <span className="text-[10px] sm:text-[11px] text-[#A8A29E] line-through font-normal leading-none">
                      R$ {priceDisplay.originalPrice?.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#C5A059] font-bold leading-none">
                      {product.isOutlet || isOutletSection ? 'OUTLET' : 'PROMOÇÃO'}
                    </span>
                  </div>
                  {/* Linha 2: Preço Promocional em Destaque */}
                  <div className="flex items-baseline gap-1">
                    <span className={`font-bold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight leading-none ${
                      isCompact ? 'text-sm sm:text-base' : isMedium ? 'text-sm sm:text-base lg:text-lg' : 'text-base sm:text-lg lg:text-xl'
                    }`}>
                      {priceDisplay.label ? `${priceDisplay.label} ` : ''}R$ {priceDisplay.currentPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {/* Linha 3: Economia em Verde de Alta Conversão */}
                  <div className="text-[#16A34A] dark:text-[#22C55E] text-[10px] sm:text-[11px] font-bold uppercase tracking-tight mt-1 flex items-center gap-1">
                    <span>Economia de R$ {priceDisplay.savingsAmount.toFixed(2).replace('.', ',')}!</span>
                    {priceDisplay.discountPercent > 0 && (
                      <span className="text-[9px] bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] px-1 py-0.2 rounded-none font-black">
                        ({priceDisplay.discountPercent}% OFF)
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[9px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] block truncate leading-none mb-1">
                    {priceDisplay.label || 'Valor da Peça'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-bold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight leading-none ${
                      isCompact ? 'text-sm sm:text-base' : isMedium ? 'text-sm sm:text-base lg:text-lg' : 'text-base sm:text-lg lg:text-xl'
                    }`}>
                      R$ {priceDisplay.currentPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Indicador sutil de estoque baixo (somente se habilitado pelo lojista ou na seção de últimas peças) */}
            {(product.isLastPieces || isLastPiecesSection) &&
              product.totalStock && product.totalStock > 0 && product.totalStock <= 5 && !isOutOfStock && !isAllReserved && (
              <span className="text-[9px] font-semibold text-[#8B5A2B] dark:text-[#DFBE76] bg-[#8B5A2B]/10 dark:bg-[#DFBE76]/10 px-1.5 py-0.5 rounded-none whitespace-nowrap shrink-0 mt-0.5">
                Restam {product.remainingPieces || product.totalStock}
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
