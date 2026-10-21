'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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

export function BoutiqueStorefront() {
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
    currentTenant
  } = useStore();

  // Produtos organizados para cada vitrine temática da Home (reativos aos produtos dinâmicos do Supabase)
  const newReleasesProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.status?.includes('Lançamento') ||
          p.status?.includes('Novidade') ||
          p.isNewArrival ||
          p.id === '04-conjunto-alfaiataria-bege' ||
          p.id === '03-conjunto-alfaiataria-terracota' ||
          p.id === '07-t-shirt-algodao-egipcio' ||
          p.id === '01-casaco-tricot'
      ),
    [products]
  );
  const bestSellerProducts = useMemo(() => products.filter((p) => p.isBestSeller), [products]);
  const outletProducts = useMemo(() => products.filter((p) => p.isOutlet), [products]);
  const lastPiecesProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isLastPieces ||
          (p.remainingPieces !== undefined && p.remainingPieces <= 5) ||
          p.badge?.includes('peça')
      ),
    [products]
  );

  const handleCategorySelection = (category: string) => {
    setActiveCategory(category);
    if (category === 'Todos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (category === 'Mais Vendidos') {
      scrollToSection('mais-vendidos');
    } else if (category === 'OUTLET') {
      scrollToSection('outlet');
    } else if (category === 'Últimas Peças') {
      scrollToSection('ultimas-pecas');
    } else {
      scrollToSection('lancamentos');
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
            scrollToSection('lancamentos');
          }}
        />

        {/* 1. SEÇÃO: LANÇAMENTOS */}
        <section id="lancamentos" className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-3xl lg:text-4xl text-white font-medium drop-shadow-sm">
                Lançamentos Exclusivos
              </h2>
            </div>
            <p className="text-xs text-white/85 max-w-sm hidden sm:block">
              As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.
            </p>
          </div>

          {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
          <ProductLoopCarousel
            products={newReleasesProducts}
            isNewReleasesSection={true}
            onOpenDetails={openProduct}
            onQuickAdd={(p) => {
              addToCart({
                product: p,
                size: p.sizes[0],
                color: p.colors[0].name,
                quantity: 1
              });
            }}
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

            <button
              type="button"
              onClick={() => scrollToSection('mais-vendidos')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
              title="Ir para Mais Vendidos"
            >
              <span className="hidden sm:inline">Ir para Mais Vendidos</span>
              <span className="sm:hidden">Mais Vendidos</span>
              <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </section>

        {/* 2. SEÇÃO: MAIS VENDIDOS */}
        <section id="mais-vendidos" className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-3xl lg:text-4xl text-white font-medium drop-shadow-sm">
                Mais Vendidos
              </h2>
            </div>
            <p className="text-xs text-white/85 max-w-sm hidden sm:block">
              As peças com maior procura na nossa boutique, reconhecidas pelo caimento impecável e acabamento nobre.
            </p>
          </div>

          {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
          <ProductLoopCarousel
            products={bestSellerProducts}
            onOpenDetails={openProduct}
            onQuickAdd={(p) => {
              addToCart({
                product: p,
                size: p.sizes[0],
                color: p.colors[0].name,
                quantity: 1
              });
            }}
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

            <button
              type="button"
              onClick={() => scrollToSection('outlet')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
              title="Ir para OUTLET"
            >
              <span className="hidden sm:inline">Próxima Seção: OUTLET</span>
              <span className="sm:hidden">Ir para OUTLET</span>
              <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </section>

        {/* 3. SEÇÃO: OUTLET */}
        <section id="outlet" className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-3xl lg:text-4xl text-white font-medium drop-shadow-sm">
                OUTLET & Peças Selecionadas
              </h2>
            </div>
            <p className="text-xs text-white/85 max-w-sm hidden sm:block">
              Peças exclusivas com valores promocionais e últimas unidades disponíveis na boutique.
            </p>
          </div>

          {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
          <ProductLoopCarousel
            products={outletProducts}
            isOutletSection={true}
            onOpenDetails={openProduct}
            onQuickAdd={(p) => {
              addToCart({
                product: p,
                size: p.sizes[0],
                color: p.colors[0].name,
                quantity: 1
              });
            }}
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

            <button
              type="button"
              onClick={() => scrollToSection('ultimas-pecas')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
              title="Ir para Últimas Peças"
            >
              <span className="hidden sm:inline">Próxima Seção: Últimas Peças</span>
              <span className="sm:hidden">Últimas Peças</span>
              <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </section>

        {/* 4. SEÇÃO: ÚLTIMAS PEÇAS */}
        <section id="ultimas-pecas" className="pt-6 pb-14 sm:pt-10 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-[96px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2.5 sm:mb-8 lg:mb-6 gap-2 sm:gap-3">
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-3xl lg:text-4xl text-white font-medium drop-shadow-sm">
                Últimas Peças
              </h2>
            </div>
            <p className="text-xs text-white/85 max-w-sm hidden sm:block">
              Modelos exclusivos prestes a esgotar definitivamente na boutique. Peças com apenas 5 unidades ou menos restantes no estoque.
            </p>
          </div>

          {/* Carrossel em looping automático com 4 cards (pausa no hover/clique) */}
          <ProductLoopCarousel
            products={lastPiecesProducts}
            isLastPiecesSection={true}
            onOpenDetails={openProduct}
            onQuickAdd={(p) => {
              addToCart({
                product: p,
                size: p.sizes[0],
                color: p.colors[0].name,
                quantity: 1
              });
            }}
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

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-2.5 sm:py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group truncate"
              title="Voltar ao Topo da Página"
            >
              <span className="hidden sm:inline">Voltar ao Topo da Página</span>
              <span className="sm:hidden">Voltar ao Topo</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </section>

        {/* 5. SEÇÃO: VISTOS RECENTEMENTE (Histórico Pessoal do Cliente) */}
        <RecentlyViewedSection
          onOpenDetails={openProduct}
          onQuickAdd={(p) => {
            addToCart({
              product: p,
              size: p.sizes[0],
              color: p.colors[0].name,
              quantity: 1
            });
          }}
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
