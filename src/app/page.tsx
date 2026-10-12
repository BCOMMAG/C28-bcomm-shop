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
import { PRODUCTS, CATEGORIES, STORE_INFO } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';

export default function HomePage() {
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
    isCartOpen
  } = useStore();

  // Produtos organizados para cada vitrine temática da Home (estáveis com useMemo)
  const newReleasesProducts = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          p.status?.includes('Lançamento') ||
          p.status?.includes('Novidade') ||
          p.id === '04-conjunto-alfaiataria-bege' ||
          p.id === '03-conjunto-alfaiataria-terracota' ||
          p.id === '07-t-shirt-algodao-egipcio' ||
          p.id === '01-casaco-tricot'
      ),
    []
  );
  const bestSellerProducts = useMemo(() => PRODUCTS.filter((p) => p.isBestSeller), []);
  const outletProducts = useMemo(() => PRODUCTS.filter((p) => p.isOutlet), []);
  const lastPiecesProducts = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          p.isLastPieces ||
          (p.remainingPieces !== undefined && p.remainingPieces <= 5) ||
          p.badge?.includes('peça')
      ),
    []
  );

  const handleCategorySelection = (category: string) => {
    setActiveCategory(category);
    if (category === 'Lançamentos') {
      document.getElementById('lancamentos')?.scrollIntoView({ behavior: 'smooth' });
    } else if (category === 'Mais Vendidos') {
      document.getElementById('mais-vendidos')?.scrollIntoView({ behavior: 'smooth' });
    } else if (category === 'OUTLET') {
      document.getElementById('outlet')?.scrollIntoView({ behavior: 'smooth' });
    } else if (category === 'Últimas Peças') {
      document.getElementById('ultimas-pecas')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('lancamentos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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

      <main className="flex-1">
        {/* Banner Hero com Vídeo Oficial */}
        <HeroBanner
          onExploreClick={() => {
            const el = document.getElementById('lancamentos');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 1. SEÇÃO: LANÇAMENTOS */}
        <section id="lancamentos" className="py-16 sm:py-20 lg:pt-10 lg:pb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 lg:mb-6 gap-3">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFBE76] font-semibold block mb-1.5 drop-shadow-xs lg:hidden">
                Novidades da Temporada
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-4xl text-white font-medium drop-shadow-sm">
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
          <div className="mt-8 sm:mt-10 lg:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/catalogo?status=Lançamento"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Ver Todos os Lançamentos no Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('mais-vendidos')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group"
            >
              <span>Ir para Mais Vendidos</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* 2. SEÇÃO: MAIS VENDIDOS */}
        <section id="mais-vendidos" className="py-16 sm:py-20 lg:pt-10 lg:pb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 lg:mb-6 gap-3">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFBE76] font-semibold block mb-1.5 drop-shadow-xs lg:hidden">
                Os Favoritos da Boutique
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-4xl text-white font-medium drop-shadow-sm">
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
          <div className="mt-8 sm:mt-10 lg:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/catalogo?categoria=Mais%20Vendidos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Ver Mais Produtos Mais Vendidos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('outlet')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group"
            >
              <span>Próxima Seção: OUTLET</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* 3. SEÇÃO: OUTLET */}
        <section id="outlet" className="py-16 sm:py-20 lg:pt-10 lg:pb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 lg:mb-6 gap-3">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFBE76] font-semibold block mb-1.5 drop-shadow-xs lg:hidden">
                Oportunidades Especiais
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-4xl text-white font-medium drop-shadow-sm">
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
          <div className="mt-8 sm:mt-10 lg:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/catalogo?categoria=OUTLET"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Ver Mais Peças do OUTLET</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('ultimas-pecas')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group"
            >
              <span>Próxima Seção: Últimas Peças</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* 4. SEÇÃO: ÚLTIMAS PEÇAS */}
        <section id="ultimas-pecas" className="py-16 sm:py-20 lg:pt-10 lg:pb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 lg:mb-6 gap-3">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFBE76] font-semibold block mb-1.5 drop-shadow-xs lg:hidden">
                Estoque Limitado &bull; Restam Poucas Unidades
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-4xl text-white font-medium drop-shadow-sm">
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
          <div className="mt-8 sm:mt-10 lg:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/catalogo?status=Últimas%20Peças"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white dark:bg-[#1C1A18] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer"
            >
              <span>Explorar Todas as Peças Restantes no Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-none border border-[#C5A059] bg-white/95 dark:bg-[#201D1B] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-xs cursor-pointer group"
            >
              <span>Voltar ao Topo da Página</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current group-hover:-translate-y-0.5 transition-transform" />
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

      {/* Modal de Detalhes do Produto (Com Vídeo em 1º Lugar) */}
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
      />

      </div>
  );
}
