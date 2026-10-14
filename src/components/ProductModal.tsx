'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Ruler,
  Truck,
  Heart,
  ShoppingBag,
  MessageCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  LayoutGrid,
  ArrowRight,
  Share2,
  Copy,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { Product } from '@/types';
import { PRODUCTS, STORE_INFO } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import {
  fetchAddressByCep,
  calculateShippingOptions,
  formatCep,
  ViaCepResponse,
  ShippingOption
} from '@/utils/shipping';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    product: Product;
    size: string;
    color: string;
    quantity: number;
  }) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenSizeGuide: () => void;
  onSelectPairedProduct: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onOpenSizeGuide,
  onSelectPairedProduct
}) => {
  const pathname = usePathname();
  const isAlreadyInCatalog = Boolean(pathname?.startsWith('/catalogo'));
  const router = useRouter();
  const {
    recentlyViewedProducts,
    savedCep,
    savedAddress,
    setSavedAddressInfo,
    closeProductSilently,
    products
  } = useStore();

  const sourceProducts = products && products.length > 0 ? products : PRODUCTS;

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [cepInput, setCepInput] = useState<string>('');
  const [shippingResult, setShippingResult] = useState<boolean>(false);
  const [shippingLoading, setShippingLoading] = useState<boolean>(false);
  const [shippingAddress, setShippingAddress] = useState<ViaCepResponse | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingError, setShippingError] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(true);
  const [pairedAddedId, setPairedAddedId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Produtos que combinam para "Compre o Look"
  const matchingProducts = useMemo(() => {
    if (!product) return [];
    const matches: Product[] = [];

    // 1. Sugestão emparelhada direta da peça
    if (product.pairedWithId) {
      const directPair = sourceProducts.find((p) => p.id === product.pairedWithId && p.id !== product.id);
      if (directPair) matches.push(directPair);
    }

    // 2. Se houver menos de 2 sugestões, complementar com produtos de categorias distintas
    const others = sourceProducts.filter(
      (p) => p.id !== product.id && !matches.some((m) => m.id === p.id)
    );

    const complementary = others.filter((p) => p.category !== product.category);
    const candidates = complementary.length > 0 ? complementary : others;

    for (const cand of candidates) {
      if (matches.length >= 2) break;
      matches.push(cand);
    }

    return matches;
  }, [product, sourceProducts]);

  const handleAddPaired = (item: Product) => {
    onAddToCart({
      product: item,
      size: item.sizes[0] || 'Tamanho Único',
      color: item.colors[0]?.name || 'Padrão',
      quantity: 1
    });
    setPairedAddedId(item.id);
    setTimeout(() => setPairedAddedId(null), 1800);
  };

  useEffect(() => {
    if (product) {
      setActiveMediaIndex(0); // O VÍDEO É SEMPRE O PRIMEIRO SLIDE
      setSelectedColor(product.colors[0]?.name || '');
      setSelectedSize(product.sizes[0] || '');
      setQuantity(1);
      setIsPlaying(true);
      setIsMuted(true);
      setIsVideoBuffering(true);
      setShippingError('');

      // Recupera CEP e endereço já consultados pelo usuário anteriormente
      if (savedCep && savedAddress) {
        setCepInput(formatCep(savedCep));
        setShippingAddress(savedAddress);
        setShippingOptions(calculateShippingOptions(savedAddress.uf, product.price));
        setShippingResult(true);
      } else {
        setShippingResult(false);
        setShippingAddress(null);
        setCepInput('');
      }
    }
  }, [product, savedCep, savedAddress]);

  // Controle de reprodução do vídeo
  useEffect(() => {
    if (videoRef.current && product?.media[activeMediaIndex]?.type === 'video') {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeMediaIndex, product]);

  if (!isOpen || !product) return null;

  const currentMedia = product.media[activeMediaIndex];
  const pairedProduct = sourceProducts.find((p) => p.id === product.pairedWithId);

  // Cálculo de desconto e economia (conforme o print do usuário)
  const rawOriginalPrice = product.originalPrice ?? (product.formattedOriginalPrice ? parseFloat(product.formattedOriginalPrice.replace(/[^\d,]/g, '').replace(',', '.')) : null);
  const rawCurrentPrice = product.price ?? parseFloat(product.formattedPrice.replace(/[^\d,]/g, '').replace(',', '.'));

  const hasDiscount = Boolean(rawOriginalPrice && rawOriginalPrice > rawCurrentPrice);
  const savingsAmount = hasDiscount && rawOriginalPrice ? rawOriginalPrice - rawCurrentPrice : 0;
  const discountPercent = hasDiscount && rawOriginalPrice ? Math.round((savingsAmount / rawOriginalPrice) * 100) : 0;

  const goToPrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : product.media.length - 1));
    setIsPlaying(true);
  };

  const goToNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMediaIndex((prev) => (prev < product.media.length - 1 ? prev + 1 : 0));
    setIsPlaying(true);
  };

  // Suporte a deslizar (Swipe) para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      goToNextMedia();
    } else if (diff < -45) {
      goToPrevMedia();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAdd = () => {
    onAddToCart({
      product,
      size: selectedSize,
      color: selectedColor,
      quantity
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    onAddToCart({
      product,
      size: selectedSize || product.sizes[0] || 'Tamanho Único',
      color: selectedColor || product.colors[0]?.name || 'Padrão',
      quantity
    });
    closeProductSilently();
    router.push('/checkout/');
  };

  // Consulta Real de Endereço via ViaCEP
  const handleCalculateShipping = async () => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setShippingError('Digite um CEP válido com 8 números.');
      setShippingResult(false);
      return;
    }

    setShippingLoading(true);
    setShippingError('');

    try {
      const address = await fetchAddressByCep(cleanCep);
      if (address) {
        setShippingAddress(address);
        setSavedAddressInfo(cleanCep, address);
        setShippingOptions(calculateShippingOptions(address.uf, product.price));
        setShippingResult(true);
      } else {
        setShippingError('CEP não encontrado. Por favor, confira os números digitados.');
        setShippingResult(false);
      }
    } catch {
      setShippingError('Não foi possível consultar o CEP no momento.');
      setShippingResult(false);
    } finally {
      setShippingLoading(false);
    }
  };

  // Compartilhar Look (Web Share API nativa + Copiar link fallback)
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `${product.name} | Leidy Boutique`,
      text: `Olha que look deslumbrante da Leidy Boutique: *${product.name}* (${product.formattedPrice})! ✨`,
      url: shareUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback para cópia se cancelado
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const shareOnWhatsApp = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const msg = `Meninas, olhem que look perfeito da Leidy Boutique: *${product.name}* (${product.formattedPrice})! ✨\n\nDá uma olhadinha aqui: ${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const generateWhatsAppDirectLink = () => {
    let text = `Olá Leidy! Tenho interesse no *${product.name}*.\n- Cor: *${selectedColor}*\n- Tamanho: *${selectedSize}*\n- Quantidade: *${quantity}*\n- Valor da peça: *${product.formattedPrice}*`;
    if (shippingAddress) {
      text += `\n- Entrega em: *${shippingAddress.localidade}/${shippingAddress.uf}* (CEP: ${shippingAddress.cep})`;
    }
    text += `\n\nPoderia me confirmar a disponibilidade?`;
    return `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 lg:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container Principal do Modal Centralizado */}
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] dark:bg-[#1A1918] rounded-none shadow-2xl overflow-hidden border border-[#C5A059]/40 text-[#1A1918] dark:text-[#FAF8F5] my-auto flex flex-col h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[92vh]">
        
        {/* Barra Superior Fina Fixa: Voltar e Adicionar à Sacola (Nunca some durante o scroll) */}
        <div className="w-full bg-[#FAF8F5] dark:bg-[#1A1918] border-b border-[#C5A059]/25 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 shrink-0 shadow-2xs">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] transition-colors cursor-pointer select-none py-1"
          >
            <span>&lt;&lt; Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="bg-[#1A1918] dark:bg-white text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3.5 sm:px-5 py-2 transition-all duration-300 shadow-sm cursor-pointer"
            >
              {addedAnimation ? 'ADICIONADO!' : 'ADICIONAR À SACOLA'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white transition-colors cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Conteúdo Rolável (min-h-0 permite ao flex encolher e rolar corretamente) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
            
            {/* COLUNA ESQUERDA: GALERIA E VÍDEO (Miniaturas coladas logo abaixo do visualizador) */}
            <div className="lg:col-span-5 p-2.5 sm:p-5 lg:p-6 bg-[#F4EFE6]/60 dark:bg-[#141312]/60 flex flex-col items-center justify-start lg:sticky lg:top-0 self-start border-b lg:border-b-0 lg:border-r border-[#C5A059]/20">
            
            {/* Visualizador Principal com Navegação por Setas e Swipe */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[380px] lg:h-[500px] rounded-none overflow-hidden bg-black shadow-lg mx-auto select-none touch-pan-y"
            >
              {currentMedia.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={currentMedia.src}
                    poster={product.thumbnail}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onPlaying={() => setIsVideoBuffering(false)}
                    onWaiting={() => setIsVideoBuffering(true)}
                    onCanPlay={() => setIsVideoBuffering(false)}
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Indicador Suave de Carregamento Inicial do Vídeo */}
                  {isVideoBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none transition-opacity duration-300">
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-black/75 text-white text-[11px] border border-[#C5A059]/40 shadow-xl backdrop-blur-xs">
                        <span className="w-2.5 h-2.5 rounded-none border-2 border-[#C5A059] border-t-transparent animate-spin" />
                        <span>Carregando vídeo...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Badge de Provador em Vídeo */}
                  <div className="absolute top-3 left-3 bg-[#1A1918]/85 text-white text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-none flex items-center gap-1.5 backdrop-blur-sm border border-[#C5A059]/40 z-10">
                    <span>Provador da Leidy</span>
                  </div>

                  {/* Controles de Som e Play */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-none bg-black/60 text-white hover:bg-black/90 backdrop-blur-sm transition-all cursor-pointer"
                      title={isMuted ? 'Ativar Som' : 'Silenciar'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#DFBE76]" />}
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1.5 rounded-none bg-black/60 text-white hover:bg-black/90 backdrop-blur-sm transition-all cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={currentMedia.src}
                    alt={product.name}
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
              )}

              {/* Botão de Navegação: Anterior (<) */}
              {product.media.length > 1 && (
                <button
                  onClick={goToPrevMedia}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-none bg-black/55 text-white hover:bg-black/85 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Botão de Navegação: Próximo (>) */}
              {product.media.length > 1 && (
                <button
                  onClick={goToNextMedia}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-none bg-black/55 text-white hover:bg-black/85 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Indicador de Slide */}
              {product.media.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-none">
                  {product.media.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-none transition-all ${
                        activeMediaIndex === idx ? 'w-4 bg-[#DFBE76]' : 'w-1.5 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Carrossel de Miniaturas */}
            <div className="w-full mt-3 flex items-center justify-center gap-2.5 overflow-x-auto py-1">
              {product.media.map((item, index) => {
                const isSelected = activeMediaIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveMediaIndex(index);
                      if (item.type === 'video') setIsPlaying(true);
                    }}
                    className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-none overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/40 scale-105'
                        : 'border-white/80 dark:border-white/20 opacity-70 hover:opacity-100 hover:border-[#C5A059]/50'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-[#1A1918] flex flex-col items-center justify-center text-white p-1">
                        <div className="w-6 h-6 rounded-none bg-[#C5A059] flex items-center justify-center mb-0.5">
                          <Play className="w-3 h-3 fill-white ml-0.5" />
                        </div>
                        <span className="text-[8px] uppercase font-bold tracking-tight text-[#DFBE76]">
                          Vídeo
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={item.src}
                        alt={item.label}
                        fill
                        className="object-cover object-top"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] text-center mt-1 flex items-center justify-center gap-1.5">
              <span>Deslize para o lado para ver fotos e detalhes da peça.</span>
            </p>

          </div>

          {/* COLUNA DIREITA: INFORMAÇÕES & PEDIDO */}
          <div className="lg:col-span-7 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Header de Categoria e Atalho */}
              <div className="flex items-center justify-between pr-4 sm:pr-8">
                <span className="text-xs uppercase tracking-widest text-[#C5A059] dark:text-[#DFBE76] font-bold">
                  {product.category}
                </span>

                {!isAlreadyInCatalog && (
                  <Link
                    href="/catalogo"
                    onClick={onClose}
                    className="text-[11px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] hover:text-[#C5A059] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Catálogo</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Título do Produto */}
              <h2 className="font-serif-luxury text-xl sm:text-3xl font-medium text-[#1A1918] dark:text-[#FAF8F5] mt-1.5">
                {product.name}
              </h2>

              {/* Valor do Produto & Desconto & Salvo (Fiel ao print do usuário) */}
              <div className="mt-3.5 pt-3 pb-3 border-y border-[#C5A059]/20 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#57534E] dark:text-[#A8A29E] block mb-1 font-bold">
                    VALOR DA PEÇA
                  </span>

                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    {/* Valor Original em Cinza com Risco à Esquerda (quando houver desconto) */}
                    {hasDiscount && (
                      <span className="text-base sm:text-lg text-[#78716C] dark:text-[#A8A29E] line-through font-normal">
                        {product.formattedOriginalPrice || `R$ ${rawOriginalPrice?.toFixed(2).replace('.', ',')}`}
                      </span>
                    )}
                    {/* Valor Atual em Negrito de Destaque */}
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight">
                      {product.formattedPrice}
                    </span>
                  </div>

                  {/* Mensagem em Verde de Economia quando houver desconto */}
                  {hasDiscount && (
                    <div className="text-[#16A34A] dark:text-[#22C55E] text-xs font-bold uppercase tracking-wide mt-1">
                      ECONOMIA DE R$ {savingsAmount.toFixed(2).replace('.', ',')}! ({discountPercent}% OFF)
                    </div>
                  )}

                  {!hasDiscount && (
                    <span className="text-[11px] text-[#C5A059] dark:text-[#DFBE76] font-medium block mt-0.5">
                      Peça Exclusiva &bull; Em até 3x sem juros
                    </span>
                  )}
                </div>

                {/* Botão Dourado de Salvar nos Favoritos com Ícone de Coração */}
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-none bg-[#C5A059] hover:bg-[#A9833E] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 shadow-xs"
                  title={isWishlisted ? 'Peça salva nos favoritos' : 'Salvar nos favoritos'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-white' : 'fill-white text-white'}`} />
                  <span>{isWishlisted ? 'SALVO' : 'SALVAR'}</span>
                </button>
              </div>

              {/* Seletor de Cores */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1918] dark:text-[#FAF8F5]">
                    COR ESCOLHIDA: <span className="text-[#C5A059] dark:text-[#DFBE76]">{selectedColor.toUpperCase()}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {product.colors.map((color, idx) => {
                    const isColorSelected = selectedColor === color.name;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(color.name);
                          if (color.imageSrc) {
                            const mediaIdx = product.media.findIndex((m) => m.src === color.imageSrc);
                            if (mediaIdx !== -1) setActiveMediaIndex(mediaIdx);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-none border text-xs transition-all cursor-pointer ${
                          isColorSelected
                            ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold text-[#1A1918] dark:text-white ring-1 ring-[#C5A059]'
                            : 'border-black/20 dark:border-white/20 bg-white dark:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1] hover:border-[#C5A059]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-none border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Frase de Estoque Limitado (Conforme o print) */}
                <p className="text-[11px] font-bold text-[#1A1918] dark:text-[#FAF8F5] mt-2 mb-2">
                  {product.remainingPieces && product.remainingPieces <= 5
                    ? `Últimas ${product.remainingPieces} unidades em estoque com este preço!`
                    : (product.isOutlet || hasDiscount)
                    ? 'Últimas 3 unidades em estoque com este preço!'
                    : 'Peça exclusiva com poucas unidades no estoque!'}
                </p>
              </div>

              {/* Seletor de Tamanhos com Guia de Medidas */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1918] dark:text-[#FAF8F5]">
                    TAMANHO: <span className="text-[#C5A059] dark:text-[#DFBE76]">{selectedSize.toUpperCase()}</span>
                  </span>

                  <button
                    onClick={onOpenSizeGuide}
                    className="text-xs text-[#C5A059] dark:text-[#DFBE76] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Guia de Medidas</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size, idx) => {
                    const isSizeSelected = selectedSize === size;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all border cursor-pointer ${
                          isSizeSelected
                            ? 'bg-[#1A1918] dark:bg-white text-white dark:text-[#1A1918] border-[#1A1918] dark:border-white shadow-xs'
                            : 'bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] border-[#C5A059]/30 hover:border-[#C5A059]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Quantidade & Ações Principais */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {/* Contador de Quantidade */}
                  <div className="flex items-center border border-black/25 dark:border-white/25 rounded-none bg-white dark:bg-[#252220] px-2.5 py-2.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] px-2 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] px-2 min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] px-2 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Botão Principal: COMPRAR AGORA (Leva direto ao checkout) */}
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-3 px-5 rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all duration-300 shadow-md active:scale-95 cursor-pointer"
                    title="Comprar esta peça agora e ir para o Checkout"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>COMPRAR AGORA</span>
                  </button>
                </div>

                {/* Botão Secundário: Adicionar à Sacola */}
                <button
                  onClick={handleAdd}
                  className={`w-full py-2.5 px-5 rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-[#C5A059]/60 shadow-xs cursor-pointer ${
                    addedAnimation
                      ? 'bg-[#25D366] text-white border-[#25D366]'
                      : 'bg-transparent hover:bg-[#C5A059]/10 text-[#1A1918] dark:text-[#FAF8F5]'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ADICIONADO À SACOLA!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                      <span>ADICIONAR À SACOLA</span>
                    </>
                  )}
                </button>

                {/* Botão Direto de WhatsApp */}
                <a
                  href={generateWhatsAppDirectLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-5 rounded-none text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2.5 border border-[#C5A059]/30 bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2E2A27] transition-all duration-300 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>PEDIR ESTA PEÇA NO WHATSAPP DA LEIDY</span>
                </a>

                {/* Botões de Compartilhar Look (Social Share) */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 py-2.5 px-3 rounded-none border border-[#C5A059]/40 bg-white dark:bg-[#252220] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] text-[11px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group"
                    title="Compartilhar este look com amigas"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#25D366]" />
                        <span className="text-[#25D366] font-bold">LINK COPIADO! ✨</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-current transition-colors" />
                        <span>COMPARTILHAR LOOK</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={shareOnWhatsApp}
                    className="py-2.5 px-3 rounded-none border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366] text-[#1A1918] dark:text-[#FAF8F5] hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Enviar este look para amigas no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366] hover:text-white" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Simulador de Envio e Frete com Consulta Real de Endereço via ViaCEP */}
              <div className="mt-4 pt-3.5 border-t border-[#C5A059]/20">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#1A1918] dark:text-[#FAF8F5] mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#C5A059]" />
                    <span>CALCULAR PRAZO DE ENTREGA</span>
                  </div>
                  <span className="text-[10px] text-[#C5A059] font-normal lowercase">via correios</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite seu CEP (Ex: 01310-100)"
                    value={cepInput}
                    onChange={(e) => setCepInput(formatCep(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCalculateShipping();
                      }
                    }}
                    maxLength={9}
                    className="flex-1 px-3.5 py-2 text-xs rounded-none border border-[#C5A059]/30 bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    onClick={handleCalculateShipping}
                    disabled={shippingLoading}
                    className="px-4 py-2 bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white rounded-none text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {shippingLoading ? 'Consultando...' : 'Calcular'}
                  </button>
                </div>

                {/* Feedback de erro */}
                {shippingError && (
                  <p className="mt-2 text-[11px] text-red-500 font-medium">
                    {shippingError}
                  </p>
                )}

                {/* Resultado Real do Endereço e Opções */}
                {shippingResult && shippingAddress && (
                  <div className="mt-3 p-3.5 rounded-none bg-white dark:bg-[#252220] border border-[#C5A059]/30 space-y-2.5 text-xs animate-fadeIn">
                    {/* Endereço Identificado via ViaCEP */}
                    <div className="flex items-start gap-2 pb-2 border-b border-[#C5A059]/15">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                          Entrega para: {shippingAddress.bairro ? `${shippingAddress.bairro}, ` : ''}{shippingAddress.localidade} - {shippingAddress.uf}
                        </p>
                        {shippingAddress.logradouro && (
                          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                            {shippingAddress.logradouro} (CEP: {shippingAddress.cep})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lista de Opções de Envio */}
                    <div className="space-y-2 pt-0.5">
                      {shippingOptions.map((opt) => (
                        <div key={opt.id} className="flex justify-between items-center text-[#1A1918] dark:text-[#FAF8F5]">
                          <div className="flex items-center gap-2">
                            <span>{opt.iconType === 'sedex' ? '📦' : opt.iconType === 'pac' ? '🚚' : '✨'}</span>
                            <div>
                              <strong className="block">{opt.name}</strong>
                              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">{opt.description}</span>
                            </div>
                          </div>
                          <span className={`font-bold ${opt.price === 0 ? 'text-[#25D366]' : 'text-[#C5A059]'}`}>
                            {opt.formattedPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição & Destaques de Tecido (Agora posicionado após o Frete) */}
              <div className="mt-5 pt-4 border-t border-[#C5A059]/20 space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Sobre a Peça & Detalhes</span>
                </h4>

                <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#D6D3D1] leading-relaxed">
                  {product.description}
                </p>

                {product.details && product.details.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78716C] dark:text-[#A8A29E] block mb-2">
                      Composição & Cuidados:
                    </span>
                    <ul className="text-xs text-[#57534E] dark:text-[#D6D3D1] space-y-1.5">
                      {product.details.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-none bg-[#C5A059] mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Compre o Look - Peças que combinam com adição rápida ao carrinho */}
              {matchingProducts.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#C5A059]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A059] dark:text-[#DFBE76] font-bold block">
                        Sugestão de Estilo
                      </span>
                      <h4 className="font-serif-luxury text-base font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        Compre o Look
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">
                      Combine e monte seu visual
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {matchingProducts.map((item) => {
                      const isItemAdded = pairedAddedId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-none bg-white dark:bg-[#252220] border border-[#C5A059]/30 hover:border-[#C5A059] transition-all group shadow-xs"
                        >
                          <div
                            onClick={() => onSelectPairedProduct(item)}
                            className="relative w-14 h-16 sm:w-16 sm:h-20 rounded-none overflow-hidden bg-[#F4F2EE] shrink-0 cursor-pointer"
                          >
                            <Image
                              src={item.thumbnail}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div
                            onClick={() => onSelectPairedProduct(item)}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] dark:text-[#DFBE76] font-semibold block truncate">
                              {item.category}
                            </span>
                            <h5 className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] group-hover:text-[#C5A059] truncate transition-colors">
                              {item.name}
                            </h5>
                            <p className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] mt-0.5">
                              {item.formattedPrice}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddPaired(item)}
                              className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none cursor-pointer ${
                                isItemAdded
                                  ? 'bg-[#25D366] text-white'
                                  : 'bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76]'
                              }`}
                              title="Adicionar esta peça combinada à sacola"
                            >
                              {isItemAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Adicionado</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>+ Look</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 10. VISTOS RECENTEMENTE (Outras peças que a cliente já visualizou) */}
              {recentlyViewedProducts.filter((p) => p.id !== product.id).length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#C5A059]/25">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      <h4 className="text-xs uppercase tracking-widest font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                        Vistos Recentemente por Você
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#A8A29E] uppercase tracking-wider">Histórico</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {recentlyViewedProducts
                      .filter((p) => p.id !== product.id)
                      .slice(0, 4)
                      .map((recentItem) => (
                        <div
                          key={recentItem.id}
                          onClick={() => onSelectPairedProduct(recentItem)}
                          className="group cursor-pointer p-2 rounded-none bg-white dark:bg-[#252220] border border-[#C5A059]/20 hover:border-[#C5A059] transition-all shadow-xs"
                        >
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F2EE] mb-1.5">
                            <Image
                              src={recentItem.thumbnail}
                              alt={recentItem.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-[11px] font-medium text-[#1A1918] dark:text-[#FAF8F5] truncate group-hover:text-[#C5A059] transition-colors">
                            {recentItem.name}
                          </p>
                          <p className="text-xs font-bold text-[#C5A059] dark:text-[#DFBE76] mt-0.5">
                            {recentItem.formattedPrice}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Opção elegante quando visualizado fora do catálogo: Ver catálogo completo */}
              {!isAlreadyInCatalog && (
                <div className="mt-6 pt-4 border-t border-[#C5A059]/20">
                  <Link
                    href="/catalogo"
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-none bg-[#F4EFE6]/70 dark:bg-[#252220] border border-[#C5A059]/30 hover:border-[#C5A059] hover:bg-[#1A1918] hover:text-white dark:hover:bg-[#C5A059] dark:hover:text-[#1A1918] transition-all flex items-center justify-between text-xs uppercase tracking-widest font-semibold text-[#1A1918] dark:text-[#FAF8F5] group shadow-xs cursor-pointer"
                  >
                    <span className="font-serif font-bold">Ver outras opções no Catálogo Completo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#C5A059] group-hover:text-current" />
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
        </div>

      </div>
    </div>
  );
};
