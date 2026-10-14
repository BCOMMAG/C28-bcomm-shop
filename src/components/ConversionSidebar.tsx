'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Flame,
  Clock,
  Sparkles,
  MessageCircle,
  Truck,
  Video,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Product } from '@/types';
import { PRODUCTS, STORE_INFO } from '@/data/products';
import { useStore } from '@/context/StoreContext';

interface ConversionSidebarProps {
  onOpenProduct: (product: Product) => void;
}

export const ConversionSidebar: React.FC<ConversionSidebarProps> = ({ onOpenProduct }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const { products } = useStore();
  const sourceProducts = products && products.length > 0 ? products : PRODUCTS;

  // Produtos para os slides de alta conversão
  const outletDeals = sourceProducts.filter((p) => p.isOutlet);
  const lastPieces = sourceProducts.filter((p) => p.badge?.includes('Restam') || p.isLastPieces);
  const topSets = sourceProducts.filter((p) => p.category.includes('Conjuntos') || p.category.includes('Alfaiataria'));

  const slides = [
    {
      title: 'Melhores Ofertas',
      tag: 'OUTLET',
      tagColor: 'bg-[#C5A059] text-white',
      icon: Flame,
      product: outletDeals[activeSlide % outletDeals.length] || PRODUCTS[1]
    },
    {
      title: 'Últimas Peças',
      tag: 'RESTAM 5 PEÇAS',
      tagColor: 'bg-[#8B5A2B] text-white',
      icon: Clock,
      product: lastPieces[activeSlide % (lastPieces.length || 1)] || PRODUCTS[4]
    },
    {
      title: 'Conjuntos Chic',
      tag: 'DESTAQUE',
      tagColor: 'bg-[#1A1918] dark:bg-black text-[#DFBE76]',
      icon: Sparkles,
      product: topSets[activeSlide % (topSets.length || 1)] || PRODUCTS[3]
    }
  ];

  const currentSlide = slides[activeSlide % slides.length];

  // Alternância automática a cada 4.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <aside className="space-y-3.5 sticky top-24">
      
      {/* 1. VITRINE COMPACTA DE OPORTUNIDADES (Tamanho Reduzido) */}
      <div className="bg-white dark:bg-[#1A1918] p-3 rounded-none border border-[#C5A059]/30 shadow-xs relative overflow-hidden">
        
        {/* Header Compacto com Navegação */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#C5A059]/15">
          <div className="flex items-center gap-1.5">
            <currentSlide.icon className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1918] dark:text-[#FAF8F5]">
              {currentSlide.title}
            </span>
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="p-1 rounded-none text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
              className="p-1 rounded-none text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors cursor-pointer"
              title="Próximo"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card Reduzido do Produto */}
        {currentSlide.product && (
          <div
            onClick={() => onOpenProduct(currentSlide.product)}
            className="group cursor-pointer"
          >
            {/* Foto Compacta com Altura Contida */}
            <div className="relative h-32 sm:h-36 w-full rounded-none overflow-hidden bg-[#F4F2EE] dark:bg-[#252220] mb-2">
              <Image
                src={currentSlide.product.thumbnail}
                alt={currentSlide.product.name}
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <span className={`absolute top-2 left-2 text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-none shadow-xs ${currentSlide.tagColor}`}>
                {currentSlide.tag}
              </span>
            </div>

            {/* Informações Resumidas */}
            <h4 className="font-serif-luxury text-xs font-medium text-[#1A1918] dark:text-[#FAF8F5] group-hover:text-[#C5A059] transition-colors truncate leading-tight">
              {currentSlide.product.name}
            </h4>

            <div className="mt-1 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                  {currentSlide.product.formattedPrice}
                </span>
                {currentSlide.product.formattedOriginalPrice && (
                  <span className="text-[10px] text-[#A8A29E] line-through font-normal">
                    {currentSlide.product.formattedOriginalPrice}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#C5A059] font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Ver Vídeo <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        )}

        {/* Indicadores Sutis */}
        <div className="flex items-center justify-center gap-1 mt-2.5 pt-2 border-t border-[#C5A059]/15">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1 rounded-none transition-all cursor-pointer ${
                activeSlide === idx ? 'w-4 bg-[#C5A059]' : 'w-1 bg-[#C5A059]/25 hover:bg-[#C5A059]/50'
              }`}
            />
          ))}
        </div>

      </div>

      {/* 2. BOTÃO DIRETO DE CTA DO WHATSAPP (Apenas o Botão Limpo) */}
      <a
        href={`https://wa.me/${STORE_INFO.whatsapp}?text=Ol%C3%A1%20Leidy!%20Estou%20vendo%20as%20pe%C3%A7as%20no%20cat%C3%A1logo%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida.`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 px-4 rounded-none bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
      >
        <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
        <span>Falar no WhatsApp</span>
      </a>

      {/* 3. BENEFÍCIOS & GARANTIAS DA BOUTIQUE */}
      <div className="bg-white dark:bg-[#1A1918] p-3 rounded-none border border-[#C5A059]/25 shadow-2xs space-y-2 text-[11px] text-[#57534E] dark:text-[#D6D3D1]">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
          <span>
            <strong>Frete Cortesia</strong> acima de R$ 350
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
          <span>
            <strong>Provador em Vídeo</strong> em cada peça
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
          <span>
            <strong>Atendimento VIP</strong> e peças selecionadas
          </span>
        </div>
      </div>

    </aside>
  );
};
