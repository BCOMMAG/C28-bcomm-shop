'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { Footer } from '@/components/Footer';
import { PRODUCTS, STORE_INFO } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { Heart, ShoppingBag, MessageCircle, ArrowLeft } from 'lucide-react';

export default function FavoritosPage() {
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
    products
  } = useStore();

  const favoriteProducts = products.filter((p) => wishlistIds.includes(p.id));

  const generateWhatsAppWishlistLink = () => {
    let msg = `Olá Leidy! Separei as minhas peças favoritas no site da *Leidy Boutique* e gostaria de consultar a disponibilidade:\n\n`;
    favoriteProducts.forEach((p, idx) => {
      msg += `❤️ *${idx + 1}. ${p.name}* (${p.formattedPrice})\n`;
    });
    msg += `\nPoderia me passar os detalhes de pronta entrega?`;
    return `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative z-10 text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header com estilo de subpágina */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        onOpenWishlist={() => {}}
        onSelectCategory={() => {}}
        activeCategory="Favoritos"
        isSubpage={true}
      />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Navegação / Breadcrumb */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-white hover:text-[#DFBE76] font-semibold transition-colors drop-shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Inicial</span>
            </Link>

            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-wider text-[#DFBE76] hover:text-white font-semibold transition-colors drop-shadow-xs"
            >
              Ver Todo o Catálogo →
            </Link>
          </div>

          {/* Cabeçalho da Página de Favoritos */}
          <div className="border-b border-[#C5A059]/20 pb-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#DFBE76] font-bold block mb-1.5 drop-shadow-xs">
                Sua Seleção Pessoal
              </span>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-white font-medium drop-shadow-sm">
                Peças Favoritas
              </h1>
            </div>

            {favoriteProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/90 bg-white/10 dark:bg-[#1C1A18]/80 px-3 py-1.5 rounded-none border border-[#C5A059]/40 font-medium backdrop-blur-xs">
                  {favoriteProducts.length} {favoriteProducts.length === 1 ? 'peça salva' : 'peças salvas'}
                </span>

                <a
                  href={generateWhatsAppWishlistLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#25D366] dark:hover:bg-[#25D366] text-xs uppercase tracking-wider font-semibold rounded-none transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] group-hover:text-white" />
                  <span>Consultar Lista no WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* Conteúdo: Grade de Produtos ou Estado Vazio */}
          {favoriteProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {favoriteProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={openProduct}
                  onQuickAdd={(p) => {
                    addToCart({
                      product: p,
                      size: p.sizes[0],
                      color: p.colors[0].name,
                      quantity: 1
                    });
                  }}
                  isWishlisted={true}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1918] rounded-none p-12 text-center border border-[#C5A059]/20 max-w-lg mx-auto space-y-5 my-12 shadow-xs">
              <div className="w-16 h-16 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 flex items-center justify-center mx-auto text-[#C5A059]">
                <Heart className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#1A1918] dark:text-[#FAF8F5] font-medium">
                  Você ainda não favoritou nenhuma peça
                </h3>
                <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mt-2 leading-relaxed">
                  Toque no ícone de coração em qualquer peça para guardá-la nesta lista e consultar disponibilidade com a consultora.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] rounded-none text-xs uppercase tracking-widest font-semibold transition-all shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explorar Coleção da Leidy</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

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

      {/* Sacola Lateral */}
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
