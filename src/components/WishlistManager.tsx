'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Share2,
  Trash2,
  Check,
  Copy,
  Sparkles,
  Gift,
  ArrowRight,
  Filter,
  Bell
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { AviseMeModal } from '@/components/AviseMeModal';
import { useStore } from '@/context/StoreContext';
import { Product } from '@/types';
import { STORE_INFO } from '@/data/products';
import {
  getStoreHomeUrl,
  getStoreCatalogUrl,
  getStoreWishlistUrl,
  normalizeTenantSlug
} from '@/lib/routes';

export function WishlistManager() {
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

  const tenantSlug = normalizeTenantSlug(currentTenant?.slug);
  const storeName = currentTenant?.nome || 'Leidy Boutique';
  const storeWhatsapp = currentTenant?.whatsapp || STORE_INFO.whatsapp;

  // Estado para link compartilhado via query params (?itens=id1,id2)
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todas');

  // Seleções inline de tamanho e cor por produto: { [productId]: { size: string, color: string } }
  const [inlineSelections, setInlineSelections] = useState<Record<string, { size: string; color: string }>>({});

  // Modal Avise-Me para produtos esgotados
  const [isAviseMeOpen, setIsAviseMeOpen] = useState(false);
  const [aviseMeProduct, setAviseMeProduct] = useState<Product | null>(null);

  // Lê parâmetros de compartilhamento na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const itemsParam = urlParams.get('itens');
      if (itemsParam) {
        const ids = itemsParam.split(',').map((id) => id.trim()).filter(Boolean);
        if (ids.length > 0) {
          setSharedIds(ids);
          setIsSharedView(true);
        }
      }
    }
  }, []);

  // Produtos exibidos: ou os compartilhados ou os favoritados pela cliente
  const activeIds = isSharedView && sharedIds.length > 0 ? sharedIds : wishlistIds;
  const favoriteProducts = useMemo(() => {
    return products.filter((p) => activeIds.includes(p.id));
  }, [products, activeIds]);

  // Inicializa seleções inline padrão para cada produto
  useEffect(() => {
    const initial: Record<string, { size: string; color: string }> = {};
    favoriteProducts.forEach((prod) => {
      if (!inlineSelections[prod.id]) {
        initial[prod.id] = {
          size: prod.sizes[0] || 'Tamanho Único',
          color: prod.colors[0]?.name || 'Padrão'
        };
      }
    });
    if (Object.keys(initial).length > 0) {
      setInlineSelections((prev) => ({ ...prev, ...initial }));
    }
  }, [favoriteProducts]);

  // Categorias disponíveis entre os favoritos para filtro rápido
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    favoriteProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [favoriteProducts]);

  // Produtos filtrados por categoria
  const filteredProducts = useMemo(() => {
    if (selectedCategoryFilter === 'todas') return favoriteProducts;
    return favoriteProducts.filter((p) => p.category === selectedCategoryFilter);
  }, [favoriteProducts, selectedCategoryFilter]);

  // Cálculos de subtotal e economia
  const { subtotal, originalTotal, savings } = useMemo(() => {
    let sub = 0;
    let orig = 0;
    favoriteProducts.forEach((p) => {
      sub += Number(p.price || 0);
      orig += Number(p.originalPrice || p.price || 0);
    });
    return {
      subtotal: sub,
      originalTotal: orig,
      savings: Math.max(0, orig - sub)
    };
  }, [favoriteProducts]);

  // Produtos recomendados para o estado vazio (Mais Vendidos e Lançamentos)
  const recommendedProducts = useMemo(() => {
    return products.filter((p) => p.isBestSeller || p.status?.includes('Lançamento')).slice(0, 4);
  }, [products]);

  // Mover todas as peças disponíveis para a sacola
  const handleAddAllToCart = () => {
    favoriteProducts.forEach((prod) => {
      const selection = inlineSelections[prod.id] || {
        size: prod.sizes[0] || 'Tamanho Único',
        color: prod.colors[0]?.name || 'Padrão'
      };
      addToCart({
        product: prod,
        size: selection.size,
        color: selection.color,
        quantity: 1
      });
    });
    openCart();
  };

  // Adicionar uma peça com seleção inline à sacola
  const handleAddSingleToCart = (prod: Product) => {
    const selection = inlineSelections[prod.id] || {
      size: prod.sizes[0] || 'Tamanho Único',
      color: prod.colors[0]?.name || 'Padrão'
    };
    addToCart({
      product: prod,
      size: selection.size,
      color: selection.color,
      quantity: 1,
      openDrawer: true
    });
  };

  // Gerar link formatado para WhatsApp
  const generateWhatsAppWishlistLink = () => {
    let msg = `Olá! Separei as minhas peças favoritas no site da *${storeName}*:\n\n`;
    favoriteProducts.forEach((p, idx) => {
      const sel = inlineSelections[p.id];
      const opt = sel ? ` (Cor: ${sel.color}, Tam: ${sel.size})` : '';
      msg += `❤️ *${idx + 1}. ${p.name}*${opt} - ${p.formattedPrice}\n`;
    });
    msg += `\n💰 *Total Estimado:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    msg += `Poderia me confirmar a disponibilidade de pronta entrega?`;
    return `https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(msg)}`;
  };

  // Copiar link compartilhável da lista de presentes
  const handleCopyShareLink = () => {
    if (typeof window === 'undefined') return;
    const base = window.location.origin;
    const path = getStoreWishlistUrl(tenantSlug);
    const shareUrl = `${base}${path}?itens=${wishlistIds.join(',')}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  // Salvar itens compartilhados nos meus próprios favoritos
  const handleSaveSharedToMyWishlist = () => {
    sharedIds.forEach((id) => {
      if (!wishlistIds.includes(id)) {
        toggleWishlist(id);
      }
    });
    setIsSharedView(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#121110] text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header Fixo / Subpágina */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        activeCategory="Favoritos"
        isSubpage={true}
      />

      <main className="flex-1 pt-24 sm:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Navegação / Breadcrumb */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={getStoreHomeUrl(tenantSlug)}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] hover:text-[#C5A059] font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Vitrine</span>
            </Link>

            <Link
              href={getStoreCatalogUrl(tenantSlug)}
              className="text-xs uppercase tracking-wider text-[#C5A059] hover:underline font-semibold transition-colors"
            >
              Explorar Coleção Completa →
            </Link>
          </div>

          {/* BANNER DE LISTA COMPARTILHADA (SE FOR LINK DE PRESENTES) */}
          {isSharedView && (
            <div className="mb-8 p-4 bg-indigo-50/90 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Você está visualizando uma Lista de Desejos compartilhada 🎁
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Essas são as peças escolhidas por uma cliente especial na {storeName}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSharedToMyWishlist}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Salvar nos Meus Favoritos
                </button>
                <button
                  onClick={() => setIsSharedView(false)}
                  className="px-3 py-1.5 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300 text-xs font-semibold cursor-pointer"
                >
                  Ver Meus Desejos
                </button>
              </div>
            </div>
          )}

          {/* CABEÇALHO DA PÁGINA */}
          <div className="border-b border-[#C5A059]/20 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A059] font-bold block mb-1">
                Sua Seleção Exclusiva
              </span>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">
                Peças Favoritas
              </h1>
            </div>

            {favoriteProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Botão Copiar Link de Presente */}
                <button
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#C5A059]/40 hover:border-[#C5A059] text-xs uppercase tracking-wider font-semibold text-[#1A1918] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                  title="Compartilhar lista de desejos para presentes"
                >
                  {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />}
                  <span>{copiedShareLink ? 'Link Copiado!' : 'Compartilhar Lista'}</span>
                </button>

                {/* Botão Consultar no WhatsApp */}
                <a
                  href={generateWhatsAppWishlistLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs uppercase tracking-wider font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Consultar no WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* BARRA DE RESUMO & GESTÃO DA SELEÇÃO */}
          {favoriteProducts.length > 0 && (
            <div className="mb-8 p-4 sm:p-6 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#C5A059]">
                    Resumo dos Seus Desejos
                  </span>
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    ({favoriteProducts.length} {favoriteProducts.length === 1 ? 'peça salva' : 'peças salvas'})
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#1A1918] dark:text-white">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    em até 6x de R$ {(subtotal / 6).toFixed(2).replace('.', ',')} sem juros
                  </span>
                </div>

                {savings > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    🎉 Economia total de R$ {savings.toFixed(2).replace('.', ',')} nesta seleção!
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddAllToCart}
                  className="w-full md:w-auto px-6 py-3.5 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Mover Todas para a Sacola</span>
                </button>
              </div>
            </div>
          )}

          {/* FILTRO RÁPIDO DE CATEGORIAS */}
          {favoriteProducts.length > 2 && availableCategories.length > 1 && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <button
                onClick={() => setSelectedCategoryFilter('todas')}
                className={`px-3 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategoryFilter === 'todas'
                    ? 'bg-[#C5A059] text-white'
                    : 'bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 text-[#78716C]'
                }`}
              >
                Todas ({favoriteProducts.length})
              </button>
              {availableCategories.map((cat) => {
                const count = favoriteProducts.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-[#C5A059] text-white'
                        : 'bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 text-[#78716C]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* GRADE DE FAVORITOS */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                const selection = inlineSelections[product.id] || {
                  size: product.sizes[0] || 'Tamanho Único',
                  color: product.colors[0]?.name || 'Padrão'
                };
                const isOutOfStock = product.status?.includes('Esgotado');

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-md flex flex-col justify-between overflow-hidden group hover:border-[#C5A059] transition-all"
                  >
                    {/* Imagem do Produto com Botão de Remover */}
                    <div className="relative aspect-[3/4] bg-[#FAF8F5] overflow-hidden cursor-pointer">
                      <Image
                        src={product.thumbnail || product.media[0]?.src || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => openProduct(product)}
                      />

                      {/* Badge de Lançamento / Outlet */}
                      {product.discountBadge && (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
                          {product.discountBadge}
                        </div>
                      )}

                      {/* Botão Remover Favorito */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-[#1A1918]/90 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                        title="Remover dos favoritos"
                        aria-label="Remover dos favoritos"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {/* Tag de Pronta Entrega */}
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 uppercase tracking-wider font-semibold">
                        {product.status?.[0] || 'Pronta Entrega'}
                      </div>
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] text-[#C5A059] uppercase tracking-wider font-bold block mb-1">
                          {product.category || 'Curadoria VIP'}
                        </span>
                        <h3
                          onClick={() => openProduct(product)}
                          className="font-serif-luxury text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] line-clamp-2 hover:text-[#C5A059] transition-colors cursor-pointer"
                        >
                          {product.name}
                        </h3>

                        {/* Preço */}
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-base font-bold text-[#1A1918] dark:text-white font-serif-luxury">
                            {product.formattedPrice}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-[#A8A29E] line-through">
                              {product.formattedOriginalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SELETOR INLINE DE TAMANHO & COR */}
                      <div className="pt-2 border-t border-[#C5A059]/15 space-y-2">
                        {/* Seletor de Tamanho */}
                        {product.sizes && product.sizes.length > 1 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#A8A29E] block mb-1">
                              Tamanho:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {product.sizes.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    setInlineSelections((prev) => ({
                                      ...prev,
                                      [product.id]: { ...selection, size: s }
                                    }))
                                  }
                                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                                    selection.size === s
                                      ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white border-transparent'
                                      : 'bg-transparent text-[#78716C] border-[#C5A059]/30 hover:border-[#C5A059]'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Seletor de Cor */}
                        {product.colors && product.colors.length > 1 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#A8A29E] block mb-1">
                              Cor: <strong className="text-[#1A1918] dark:text-white">{selection.color}</strong>
                            </span>
                            <div className="flex items-center gap-1.5">
                              {product.colors.map((c) => (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={() =>
                                    setInlineSelections((prev) => ({
                                      ...prev,
                                      [product.id]: { ...selection, color: c.name }
                                    }))
                                  }
                                  title={c.name}
                                  className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                                    selection.color === c.name
                                      ? 'ring-2 ring-[#C5A059] ring-offset-1 scale-110'
                                      : 'opacity-70 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botão de Ação Rápida */}
                      <div className="pt-2">
                        {isOutOfStock ? (
                          <button
                            onClick={() => {
                              setAviseMeProduct(product);
                              setIsAviseMeOpen(true);
                            }}
                            className="w-full py-2.5 px-3 border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Avise-me quando chegar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddSingleToCart(product)}
                            className="w-full py-2.5 px-3 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Adicionar à Sacola</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ESTADO VAZIO RICO COM VITRINE DE DESCOBERTA */
            <div className="space-y-12">
              <div className="bg-white dark:bg-[#1A1918] rounded-none p-10 sm:p-14 text-center border border-[#C5A059]/35 max-w-xl mx-auto space-y-5 shadow-md">
                <div className="w-16 h-16 bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#C5A059]">
                  <Heart className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-serif-luxury text-2xl text-[#1A1918] dark:text-[#FAF8F5] font-bold">
                    Sua lista de desejos está vazia
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mt-2 leading-relaxed">
                    Explore a curadoria da {storeName} e toque no ícone de coração para guardar suas peças preferidas, consultar no WhatsApp ou compartilhar uma lista de presentes!
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={getStoreCatalogUrl(tenantSlug)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] text-xs uppercase tracking-widest font-semibold transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explorar Coleção da {storeName}</span>
                  </Link>
                </div>
              </div>

              {/* VITRINE DE RECOMENDAÇÕES / LANÇAMENTOS */}
              {recommendedProducts.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-[#C5A059]/20">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-bold block mb-1">
                      Inspiração para Você
                    </span>
                    <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold">
                      Peças Mais Amadas da Coleção
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    {recommendedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/25 hover:border-[#C5A059] transition-all flex flex-col justify-between group overflow-hidden"
                      >
                        <div
                          className="relative aspect-[3/4] bg-[#FAF8F5] overflow-hidden cursor-pointer"
                          onClick={() => openProduct(p)}
                        >
                          <Image
                            src={p.thumbnail || p.media[0]?.src || '/images/placeholder.jpg'}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(p.id);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-[#1A1918]/90 text-[#78716C] hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Favoritar esta peça"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-3">
                          <h4
                            onClick={() => openProduct(p)}
                            className="text-xs font-semibold line-clamp-1 hover:text-[#C5A059] cursor-pointer"
                          >
                            {p.name}
                          </h4>
                          <p className="text-xs font-bold text-[#1A1918] dark:text-white mt-1">
                            {p.formattedPrice}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* MODAL DE PRODUTO, SACOLA E AVISE-ME */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />

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

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeSizeGuide} />

      <AviseMeModal
        isOpen={isAviseMeOpen}
        onClose={() => setIsAviseMeOpen(false)}
        product={aviseMeProduct}
        selectedSize={aviseMeProduct ? (inlineSelections[aviseMeProduct.id]?.size || aviseMeProduct.sizes[0] || 'Tamanho Único') : 'Tamanho Único'}
        selectedColor={aviseMeProduct ? (inlineSelections[aviseMeProduct.id]?.color || aviseMeProduct.colors[0]?.name || 'Padrão') : 'Padrão'}
        lojaId={currentTenant?.id}
      />

      <Footer />
    </div>
  );
}
