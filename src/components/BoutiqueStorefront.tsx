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
import { SecoesVitrineConfig, SecaoHomeItem, normalizarSecoesVitrine } from '@/lib/admin';
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

  const secoesConfig = useMemo(() => {
    return normalizarSecoesVitrine(
      currentTenant?.configuracoes_visuais?.secoes_vitrine as Partial<SecoesVitrineConfig> | undefined
    );
  }, [currentTenant?.configuracoes_visuais?.secoes_vitrine]);

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

  // Lista dinâmica de seções ativas com produtos disponíveis e estilos resolvidos
  const renderedSections = useMemo(() => {
    const isDark = theme === 'dark';
    const isIndependente = Boolean(secoesConfig.modoIndependente);
    const globalCfg = secoesConfig.global;

    const resolveSectionProducts = (sec: SecaoHomeItem): Product[] => {
      if (sec.tipo === 'nativa_lancamentos') return newReleasesProducts;
      if (sec.tipo === 'nativa_mais_vendidos') return bestSellerProducts;
      if (sec.tipo === 'nativa_outlet') return outletProducts;
      if (sec.tipo === 'nativa_ultimas_pecas') return lastPiecesProducts;
      if (sec.tipo === 'nativa_todas_pecas') return products;
      if (sec.tipo === 'categoria' && sec.categoriaNome) {
        const catNomeLower = sec.categoriaNome.toLowerCase();
        return products.filter(
          (p) =>
            (p.category && p.category.toLowerCase() === catNomeLower) ||
            (p.subcategory && p.subcategory.toLowerCase() === catNomeLower)
        );
      }
      if (sec.tipo === 'custom_curadoria' && sec.produtoIds && sec.produtoIds.length > 0) {
        const idSet = new Set(sec.produtoIds);
        return products.filter((p) => idSet.has(p.id));
      }
      return [];
    };

    const resolveCatalogHref = (sec: SecaoHomeItem): string => {
      if (sec.tipo === 'nativa_lancamentos') return '/catalogo?status=Lançamento';
      if (sec.tipo === 'nativa_mais_vendidos') return '/catalogo?categoria=Mais%20Vendidos';
      if (sec.tipo === 'nativa_outlet') return '/catalogo?categoria=OUTLET';
      if (sec.tipo === 'nativa_ultimas_pecas') return '/catalogo?categoria=Últimas%20Peças';
      if (sec.tipo === 'categoria' && sec.categoriaNome) {
        return `/catalogo?categoria=${encodeURIComponent(sec.categoriaNome)}`;
      }
      return '/catalogo';
    };

    const list: Array<{
      id: string;
      tipo: string;
      titulo: string;
      subtitulo?: string;
      products: Product[];
      catalogHref: string;
      style: {
        containerStyle?: React.CSSProperties;
        tituloStyle: React.CSSProperties;
        subtituloStyle: React.CSSProperties;
      };
    }> = [];

    const secoes = secoesConfig.secoesLista || [];
    for (const sec of secoes) {
      if (!sec.ativo) continue;
      const secProducts = resolveSectionProducts(sec);
      // Proteção anti-flash e anti-espaço-vazio: só renderiza se tiver produtos disponíveis
      if (!secProducts || secProducts.length === 0) continue;

      const bg = isDark
        ? (sec.customizado || isIndependente ? sec.bgDark : globalCfg.bgDark) || undefined
        : (sec.customizado || isIndependente ? sec.bgLight : globalCfg.bgLight) || undefined;

      const tituloCor = isDark
        ? (sec.customizado || isIndependente ? sec.tituloCorDark : globalCfg.tituloCorDark) || '#FFFFFF'
        : (sec.customizado || isIndependente ? sec.tituloCorLight : globalCfg.tituloCorLight) || '#FFFFFF';

      const tituloFont = (sec.customizado || isIndependente ? sec.tituloFont : globalCfg.tituloFont) || 'Playfair Display';

      const subtituloCor = isDark
        ? (sec.customizado || isIndependente ? sec.subtituloCorDark : globalCfg.subtituloCorDark) || 'rgba(255,255,255,0.85)'
        : (sec.customizado || isIndependente ? sec.subtituloCorLight : globalCfg.subtituloCorLight) || 'rgba(255,255,255,0.85)';

      list.push({
        id: sec.id,
        tipo: sec.tipo,
        titulo: sec.titulo,
        subtitulo: sec.subtitulo,
        products: secProducts,
        catalogHref: resolveCatalogHref(sec),
        style: {
          containerStyle: bg ? { backgroundColor: bg } : undefined,
          tituloStyle: { color: tituloCor, fontFamily: tituloFont },
          subtituloStyle: { color: subtituloCor }
        }
      });
    }

    return list;
  }, [
    secoesConfig,
    theme,
    newReleasesProducts,
    bestSellerProducts,
    outletProducts,
    lastPiecesProducts,
    products
  ]);

  // Primeira seção visível para rolar ao clicar em "Conhecer Coleção" no Banner Hero
  const firstVisibleSectionId = useMemo(() => {
    return renderedSections[0]?.id || 'catalogo';
  }, [renderedSections]);

  const handleCategorySelection = (category: string) => {
    setActiveCategory(category);
    if (category === 'Todos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Procura se existe uma seção na vitrine correspondente à categoria selecionada
    const targetSection = renderedSections.find(
      (s) =>
        s.titulo.toLowerCase() === category.toLowerCase() ||
        (s.tipo === 'nativa_mais_vendidos' && category === 'Mais Vendidos') ||
        (s.tipo === 'nativa_outlet' && category === 'OUTLET') ||
        (s.tipo === 'nativa_ultimas_pecas' && category === 'Últimas Peças') ||
        (s.tipo === 'categoria' && s.titulo.toLowerCase().includes(category.toLowerCase()))
    );

    if (targetSection) {
      scrollToSection(targetSection.id);
    } else {
      router.push(`/catalogo?categoria=${encodeURIComponent(category)}`);
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

        {/* RENDERIZAÇÃO DINÂMICA DAS SEÇÕES DA VITRINE CONFIGURADAS PELO LOJISTA */}
        {renderedSections.map((sec, idx) => {
          const nextSec = idx < renderedSections.length - 1 ? renderedSections[idx + 1] : null;
          const isLast = idx === renderedSections.length - 1;

          return (
            <section
              key={sec.id}
              id={sec.id}
              style={sec.style.containerStyle}
              className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
                <div>
                  <h2
                    style={sec.style.tituloStyle}
                    className="text-xl sm:text-3xl lg:text-4xl font-medium drop-shadow-sm"
                  >
                    {sec.titulo}
                  </h2>
                </div>
                {sec.subtitulo && (
                  <p
                    style={sec.style.subtituloStyle}
                    className="text-xs max-w-sm hidden sm:block"
                  >
                    {sec.subtitulo}
                  </p>
                )}
              </div>

              {/* Carrossel em looping automático com cards de produtos */}
              <ProductLoopCarousel
                products={sec.products}
                isNewReleasesSection={sec.tipo === 'nativa_lancamentos'}
                isBestSellerSection={sec.tipo === 'nativa_mais_vendidos'}
                isOutletSection={sec.tipo === 'nativa_outlet'}
                isLastPiecesSection={sec.tipo === 'nativa_ultimas_pecas'}
                onOpenDetails={openProduct}
                onQuickAdd={handleSafeQuickAdd}
                isWishlisted={(id) => wishlistIds.includes(id)}
                onToggleWishlist={toggleWishlist}
              />

              {/* Botões de Ação da Seção */}
              <div className="mt-3.5 sm:mt-10 lg:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-4 w-full px-0.5 sm:px-0">
                <Link
                  href={sec.catalogHref}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer truncate"
                  title={`Ver ${sec.titulo} no Catálogo`}
                >
                  <span className="hidden sm:inline">Ver no Catálogo</span>
                  <span className="sm:hidden">Catálogo</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                </Link>

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(nextSec.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
                    title={`Ir para ${nextSec.titulo}`}
                  >
                    <span className="hidden sm:inline">Próxima Seção: {nextSec.titulo}</span>
                    <span className="sm:hidden">{nextSec.titulo}</span>
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

                {isLast && (
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
        })}

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
