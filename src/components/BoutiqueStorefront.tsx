'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { ProductCard } from '@/components/ProductCard';
import { ProductLoopCarousel } from '@/components/ProductLoopCarousel';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { Footer } from '@/components/Footer';
import { useStore } from '@/context/StoreContext';
import { ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import { SecoesVitrineConfig } from '@/lib/admin';
import { Product } from '@/types';

export function BoutiqueStorefront() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('Todos os Modelos');

  const {
    wishlistIds,
    toggleWishlist,
    addToCart,
    cartCount,
    wishlistCount,
    openCart,
    closeCart,
    cartItems,
    updateCartQuantity,
    removeFromCart,
    selectedProduct,
    isProductModalOpen,
    openProduct,
    closeProduct,
    isSizeGuideOpen,
    openSizeGuide,
    closeSizeGuide,
    isCartOpen,
    products,
    isLoadingProducts,
    currentTenant,
    theme
  } = useStore();

  const handleSafeQuickAdd = (p: Product) => {
    let targetSize = p.sizes?.[0] || 'Tamanho Único';
    let targetColor = p.colors?.[0]?.name || 'Padrão';

    if (p.variations && p.variations.length > 0) {
      const availableVar = p.variations.find((v: any) => v.stock > 0);
      if (availableVar) {
        targetSize = availableVar.size;
        targetColor = availableVar.color;
      }
    }

    addToCart({
      product: p,
      size: targetSize,
      color: targetColor,
      quantity: 1
    });
  };

  const secoesConfig = currentTenant?.configuracoes_visuais?.secoes_vitrine as SecoesVitrineConfig | undefined;

  const getSectionStyle = (sectionKey: 'lancamentos' | 'maisVendidos' | 'outlet' | 'ultimasPecas' | 'todasAsPecas') => {
    const isDark = theme === 'dark';
    const isIndependente = Boolean(secoesConfig?.modoIndependente);
    const sec = isIndependente ? secoesConfig?.[sectionKey] : secoesConfig?.global;

    const bg = isDark
      ? (sec?.bgDark || undefined)
      : (sec?.bgLight || undefined);

    const tituloCor = isDark
      ? (sec?.tituloCorDark || '#FFFFFF')
      : (sec?.tituloCorLight || '#FFFFFF');

    const tituloFont = sec?.tituloFont || 'Playfair Display';

    const subtituloCor = isDark
      ? (sec?.subtituloCorDark || 'rgba(255,255,255,0.85)')
      : (sec?.subtituloCorLight || 'rgba(255,255,255,0.85)');

    return {
      containerStyle: bg ? { backgroundColor: bg } : undefined,
      tituloStyle: { color: tituloCor, fontFamily: tituloFont },
      subtituloStyle: { color: subtituloCor }
    };
  };

  const lancamentosStyle = getSectionStyle('lancamentos');
  const maisVendidosStyle = getSectionStyle('maisVendidos');
  const outletStyle = getSectionStyle('outlet');
  const ultimasPecasStyle = getSectionStyle('ultimasPecas');
  const todasAsPecasStyle = getSectionStyle('todasAsPecas');

  // Produtos organizados para cada vitrine temática da Home (reativos aos produtos dinâmicos do Supabase)
  const newReleasesProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isNewArrival ||
          p.status?.includes('Lançamento') ||
          p.status?.includes('Novidade') ||
          p.customBadges?.includes('Lançamento') ||
          p.customBadges?.includes('Novidade')
      ),
    [products]
  );
  const bestSellerProducts = useMemo(() => products.filter((p) => p.isBestSeller), [products]);
  const outletProducts = useMemo(() => products.filter((p) => p.isOutlet), [products]);
  const lastPiecesProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.totalStock ?? 0) > 0 &&
          (p.totalStock ?? 0) <= 5 &&
          (p.isLastPieces || (p.remainingPieces !== undefined && p.remainingPieces <= 5))
      ),
    [products]
  );

  // Controle inteligente de exibição: ATIVO nas configurações da loja E com PRODUTOS disponíveis!
  const showLancamentos = secoesConfig?.lancamentos?.ativo !== false && newReleasesProducts.length > 0;
  const showMaisVendidos = secoesConfig?.maisVendidos?.ativo !== false && bestSellerProducts.length > 0;
  const showOutlet = secoesConfig?.outlet?.ativo !== false && outletProducts.length > 0;
  const showUltimasPecas = secoesConfig?.ultimasPecas?.ativo !== false && lastPiecesProducts.length > 0;
  const showTodasAsPecas = secoesConfig?.todasAsPecas?.ativo !== false && products.length > 0;

  // Lista ordenada das seções ativas e visíveis na tela
  const activeSectionsList = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    if (showLancamentos) list.push({ id: 'lancamentos', label: secoesConfig?.lancamentos?.titulo || 'Lançamentos' });
    if (showMaisVendidos) list.push({ id: 'mais-vendidos', label: secoesConfig?.maisVendidos?.titulo || 'Mais Vendidos' });
    if (showOutlet) list.push({ id: 'outlet', label: secoesConfig?.outlet?.titulo || 'OUTLET' });
    if (showUltimasPecas) list.push({ id: 'ultimas-pecas', label: secoesConfig?.ultimasPecas?.titulo || 'Últimas Peças' });
    if (showTodasAsPecas) list.push({ id: 'todas-as-pecas', label: secoesConfig?.todasAsPecas?.titulo || 'Todas as Peças' });
    return list;
  }, [showLancamentos, showMaisVendidos, showOutlet, showUltimasPecas, showTodasAsPecas, secoesConfig]);

  // Primeira seção visível para rolar ao clicar em "Conhecer Coleção" no Banner Hero
  const firstVisibleSectionId = useMemo(() => {
    return activeSectionsList[0]?.id || 'todas-as-pecas';
  }, [activeSectionsList]);

  // Função para pegar a próxima seção após um determinado ID
  const getNextSectionAfter = useCallback(
    (currentId: string) => {
      const idx = activeSectionsList.findIndex((s) => s.id === currentId);
      if (idx !== -1 && idx < activeSectionsList.length - 1) {
        return activeSectionsList[idx + 1];
      }
      return null;
    },
    [activeSectionsList]
  );

  const handleCategorySelection = (category: string) => {
    setActiveCategory(category);
    if (category === 'Todos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (category === 'Mais Vendidos') {
      if (showMaisVendidos) {
        scrollToSection('mais-vendidos');
      } else {
        router.push('/catalogo?categoria=Mais%20Vendidos');
      }
    } else if (category === 'OUTLET') {
      if (showOutlet) {
        scrollToSection('outlet');
      } else {
        router.push('/catalogo?categoria=OUTLET');
      }
    } else if (category === 'Últimas Peças') {
      if (showUltimasPecas) {
        scrollToSection('ultimas-pecas');
      } else {
        router.push('/catalogo?categoria=Últimas%20Peças');
      }
    } else {
      if (showLancamentos) {
        scrollToSection('lancamentos');
      } else if (showTodasAsPecas) {
        scrollToSection('todas-as-pecas');
      } else {
        router.push('/catalogo?status=Lançamento');
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Header fixo no mobile mede ~94px com anúncio ativo; Desktop mede ~86px
    const headerOffset = isMobile ? 104 : 90;
    const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementTop - headerOffset,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative z-10 text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header Fixo / Transparente */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        onSelectCategory={handleCategorySelection}
        activeCategory={activeCategory}
      />

      <main className={`flex-1 ${cartCount > 0 ? 'pb-24 sm:pb-16' : 'pb-10'}`}>
        {/* Banner Hero com Vídeo Oficial */}
        <HeroBanner
          onExploreClick={() => {
            scrollToSection(firstVisibleSectionId);
          }}
        />

        {/* Skeleton de Carregamento Elegante (exibido apenas no primeiro acesso sem cache) */}
        {isLoadingProducts && products.length === 0 && (
          <section className="pt-8 pb-14 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-[3/4] bg-slate-100 dark:bg-slate-800/60 rounded-none animate-pulse border border-[#C5A059]/10" />
              ))}
            </div>
          </section>
        )}

        {/* 1. SEÇÃO: LANÇAMENTOS */}
        {showLancamentos && (() => {
          const nextSec = getNextSectionAfter('lancamentos');
          return (
            <section
              id="lancamentos"
              style={lancamentosStyle.containerStyle}
              className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
                <div>
                  <h2
                    style={lancamentosStyle.tituloStyle}
                    className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                  >
                    {secoesConfig?.lancamentos?.titulo || 'Lançamentos Exclusivos'}
                  </h2>
                </div>
                <p
                  style={lancamentosStyle.subtituloStyle}
                  className="text-xs max-w-sm hidden sm:block"
                >
                  {secoesConfig?.lancamentos?.subtitulo || 'As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.'}
                </p>
              </div>

              {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
              <ProductLoopCarousel
                products={newReleasesProducts}
                isNewReleasesSection={true}
                onOpenDetails={openProduct}
                onQuickAdd={handleSafeQuickAdd}
                isWishlisted={(id) => wishlistIds.includes(id)}
                onToggleWishlist={toggleWishlist}
              />

              {/* Botões de Ação da Seção Lançamentos */}
              <div className="mt-3.5 sm:mt-10 lg:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
                <Link
                  href="/catalogo?status=Lançamento"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                  title="Ver Lançamentos no Catálogo"
                >
                  <span className="hidden sm:inline">Ver Todos os Lançamentos no Catálogo</span>
                  <span className="sm:hidden">Ver no Catálogo</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                </Link>

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(nextSec.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title={`Ir para ${nextSec.label}`}
                  >
                    <span className="hidden sm:inline">Ir para {nextSec.label}</span>
                    <span className="sm:hidden">{nextSec.label}</span>
                    <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </button>
                ) : (
                  <Link
                    href="/catalogo"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title="Explorar Todo o Catálogo"
                  >
                    <span className="hidden sm:inline">Explorar Catálogo Completo</span>
                    <span className="sm:hidden">Catálogo</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
              </div>
            </section>
          );
        })()}

        {/* 2. SEÇÃO: MAIS VENDIDOS */}
        {showMaisVendidos && (() => {
          const nextSec = getNextSectionAfter('mais-vendidos');
          return (
            <section
              id="mais-vendidos"
              style={maisVendidosStyle.containerStyle}
              className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
                <div>
                  <h2
                    style={maisVendidosStyle.tituloStyle}
                    className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                  >
                    {secoesConfig?.maisVendidos?.titulo || 'Mais Vendidos'}
                  </h2>
                </div>
                <p
                  style={maisVendidosStyle.subtituloStyle}
                  className="text-xs max-w-sm hidden sm:block"
                >
                  {secoesConfig?.maisVendidos?.subtitulo || 'As peças com maior procura na nossa boutique, reconhecidas pelo caimento impecável e acabamento nobre.'}
                </p>
              </div>

              {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
              <ProductLoopCarousel
                products={bestSellerProducts}
                isBestSellerSection={true}
                onOpenDetails={openProduct}
                onQuickAdd={handleSafeQuickAdd}
                isWishlisted={(id) => wishlistIds.includes(id)}
                onToggleWishlist={toggleWishlist}
              />

              {/* Botões de Ação da Seção Mais Vendidos */}
              <div className="mt-3.5 sm:mt-10 lg:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
                <Link
                  href="/catalogo?categoria=Mais%20Vendidos"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                  title="Ver Mais Vendidos no Catálogo"
                >
                  <span className="hidden sm:inline">Ver Mais Produtos Mais Vendidos</span>
                  <span className="sm:hidden">Ver no Catálogo</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                </Link>

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(nextSec.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title={`Ir para ${nextSec.label}`}
                  >
                    <span className="hidden sm:inline">Próxima Seção: {nextSec.label}</span>
                    <span className="sm:hidden">{nextSec.label}</span>
                    <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </button>
                ) : (
                  <Link
                    href="/catalogo"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title="Explorar Todo o Catálogo"
                  >
                    <span className="hidden sm:inline">Explorar Catálogo Completo</span>
                    <span className="sm:hidden">Catálogo</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
              </div>
            </section>
          );
        })()}

        {/* 3. SEÇÃO: OUTLET */}
        {showOutlet && (() => {
          const nextSec = getNextSectionAfter('outlet');
          return (
            <section
              id="outlet"
              style={outletStyle.containerStyle}
              className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
                <div>
                  <h2
                    style={outletStyle.tituloStyle}
                    className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                  >
                    {secoesConfig?.outlet?.titulo || 'OUTLET & Peças Selecionadas'}
                  </h2>
                </div>
                <p
                  style={outletStyle.subtituloStyle}
                  className="text-xs max-w-sm hidden sm:block"
                >
                  {secoesConfig?.outlet?.subtitulo || 'Peças exclusivas com valores promocionais e últimas unidades disponíveis na boutique.'}
                </p>
              </div>

              {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
              <ProductLoopCarousel
                products={outletProducts}
                isOutletSection={true}
                onOpenDetails={openProduct}
                onQuickAdd={handleSafeQuickAdd}
                isWishlisted={(id) => wishlistIds.includes(id)}
                onToggleWishlist={toggleWishlist}
              />

              {/* Botões de Ação da Seção OUTLET */}
              <div className="mt-3.5 sm:mt-10 lg:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
                <Link
                  href="/catalogo?categoria=OUTLET"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                  title="Ver Peças do OUTLET no Catálogo"
                >
                  <span className="hidden sm:inline">Ver Mais Peças do OUTLET</span>
                  <span className="sm:hidden">Ver no Catálogo</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                </Link>

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(nextSec.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title={`Ir para ${nextSec.label}`}
                  >
                    <span className="hidden sm:inline">Próxima Seção: {nextSec.label}</span>
                    <span className="sm:hidden">{nextSec.label}</span>
                    <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </button>
                ) : (
                  <Link
                    href="/catalogo"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title="Explorar Todo o Catálogo"
                  >
                    <span className="hidden sm:inline">Explorar Catálogo Completo</span>
                    <span className="sm:hidden">Catálogo</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
              </div>
            </section>
          );
        })()}

        {/* 4. SEÇÃO: ÚLTIMAS PEÇAS */}
        {showUltimasPecas && (() => {
          const nextSec = getNextSectionAfter('ultimas-pecas');
          return (
            <section
              id="ultimas-pecas"
              style={ultimasPecasStyle.containerStyle}
              className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
                <div>
                  <h2
                    style={ultimasPecasStyle.tituloStyle}
                    className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                  >
                    {secoesConfig?.ultimasPecas?.titulo || 'Últimas Peças'}
                  </h2>
                </div>
                <p
                  style={ultimasPecasStyle.subtituloStyle}
                  className="text-xs max-w-sm hidden sm:block"
                >
                  {secoesConfig?.ultimasPecas?.subtitulo || 'Modelos exclusivos prestes a esgotar definitivamente na boutique. Peças com apenas 5 unidades ou menos restantes no estoque.'}
                </p>
              </div>

              {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
              <ProductLoopCarousel
                products={lastPiecesProducts}
                isLastPiecesSection={true}
                onOpenDetails={openProduct}
                onQuickAdd={handleSafeQuickAdd}
                isWishlisted={(id) => wishlistIds.includes(id)}
                onToggleWishlist={toggleWishlist}
              />

              {/* Botões de Ação da Seção Últimas Peças */}
              <div className="mt-3.5 sm:mt-10 lg:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
                <Link
                  href="/catalogo?status=Últimas%20Peças"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                  title="Explorar Peças Restantes no Catálogo"
                >
                  <span className="hidden sm:inline">Explorar Todas as Peças Restantes no Catálogo</span>
                  <span className="sm:hidden">Ver no Catálogo</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                </Link>

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(nextSec.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title={`Ir para ${nextSec.label}`}
                  >
                    <span className="hidden sm:inline">Próxima Seção: {nextSec.label}</span>
                    <span className="sm:hidden">{nextSec.label}</span>
                    <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title="Voltar ao Topo da Página"
                  >
                    <span className="hidden sm:inline">Voltar ao Topo</span>
                    <span className="sm:hidden">Voltar ao Topo</span>
                    <ArrowUp className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* 5. SEÇÃO: TODAS AS PEÇAS (CATÁLOGO GERAL DA VITRINE) */}
        {showTodasAsPecas && (
          <section
            id="todas-as-pecas"
            style={todasAsPecasStyle.containerStyle}
            className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
              <div>
                <h2
                  style={todasAsPecasStyle.tituloStyle}
                  className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                >
                  {secoesConfig?.todasAsPecas?.titulo || 'Todas as Peças'}
                </h2>
              </div>
              <p
                style={todasAsPecasStyle.subtituloStyle}
                className="text-xs max-w-sm hidden sm:block"
              >
                {secoesConfig?.todasAsPecas?.subtitulo || 'Conheça todas as criações e modelos exclusivos disponíveis na boutique.'}
              </p>
            </div>

            {/* Carrossel em looping contínuo com 1 linha de 4 cards (pausa no hover/clique) */}
            <ProductLoopCarousel
              products={products}
              onOpenDetails={openProduct}
              onQuickAdd={handleSafeQuickAdd}
              isWishlisted={(id) => wishlistIds.includes(id)}
              onToggleWishlist={toggleWishlist}
            />

            {/* Botões de Ação da Seção Todas as Peças */}
            <div className="mt-6 sm:mt-12 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
              <Link
                href="/catalogo"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                title="Ver Catálogo Completo com Filtros"
              >
                <span className="hidden sm:inline">Explorar Catálogo com Filtros</span>
                <span className="sm:hidden">Ver Catálogo</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              </Link>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                title="Voltar ao Topo da Página"
              >
                <span className="hidden sm:inline">Voltar ao Topo</span>
                <span className="sm:hidden">Voltar ao Topo</span>
                <ArrowUp className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </section>
        )}

        {/* 5. SEÇÃO: VISTOS RECENTEMENTE (Histórico Pessoal do Cliente) */}
        <RecentlyViewedSection
          onOpenDetails={openProduct}
          onQuickAdd={handleSafeQuickAdd}
          isWishlisted={(id) => wishlistIds.includes(id)}
          onToggleWishlist={toggleWishlist}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal de Detalhes do Produto */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={closeProduct}
        onAddToCart={addToCart}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
        onOpenSizeGuide={openSizeGuide}
        onSelectPairedProduct={openProduct}
      />

      {/* Sacola Lateral (Cart Drawer) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onQuickAddItem={openProduct}
      />

      {/* Modal Guia de Medidas */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={closeSizeGuide}
        product={selectedProduct}
      />
    </div>
  );
}
