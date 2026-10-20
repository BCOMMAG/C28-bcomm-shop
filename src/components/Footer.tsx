'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, ShieldCheck, Play, Lock } from 'lucide-react';
import { STORE_INFO } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { getStoreCatalogUrl } from '@/lib/routes';

export const Footer: React.FC = () => {
  const { currentTenant } = useStore();
  const storeName = currentTenant?.nome || 'Leidy Boutique';
  const storeWhatsapp = currentTenant?.whatsapp || STORE_INFO.whatsapp;
  const catalogUrl = getStoreCatalogUrl(currentTenant?.slug);
  return (
    <footer className="bg-[#1A1918]/90 backdrop-blur-md text-[#FAF8F5] border-t border-[#C5A059]/30 pt-16 pb-24 sm:pb-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Coluna 1: Marca & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="relative h-12 w-20 sm:w-24 shrink-0 overflow-hidden flex items-center justify-start"
                style={{ height: '48px', maxWidth: '100%' }}
              >
                <Image
                  src="/images/Logo sem fundo.png"
                  alt="Leidy Boutique"
                  width={2752}
                  height={1536}
                  style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <span className="font-serif-luxury text-lg tracking-wider block font-bold text-[#FAF8F5]">
                  {storeName}
                </span>
                <span className="text-[10px] tracking-widest text-[#DFBE76] uppercase">
                  {currentTenant?.configuracoes_visuais?.tagline || 'Moda Feminina de Luxo'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Curadoria refinada de peças femininas que unem caimento impecável, tecidos nobres e atendimento exclusivo para você.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none bg-white/10 hover:bg-[#C5A059] flex items-center justify-center transition-colors text-white"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/${storeWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-colors text-white"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Coleções & Navegação */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#DFBE76] mb-4">
              Coleções Exclusivas
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8A29E]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Casacos & Tricots Biamar</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Conjuntos em Cetim Seda</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Alfaiataria Feminina Sob Medida</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Blusas Caneladas & Tops</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Lançamentos da Temporada</span></li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento & Segurança */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#DFBE76] mb-4">
              Experiência de Compra
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8A29E]">
              <li className="flex items-center gap-2">
                <Play className="w-3 h-3 text-[#DFBE76] fill-[#DFBE76]" />
                <span>Vídeos reais no provador</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DFBE76]" />
                <span>Pagamento seguro direto no WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-[#DFBE76]" />
                <span>Atendimento humanizado pela Leidy</span>
              </li>
              <li className="text-[11px] text-[#A8A29E] pt-2">
                Horário de Atendimento VIP: <br />
                Segunda a Sexta das 09h às 19h | Sábado das 09h às 13h
              </li>
            </ul>
          </div>

          {/* Coluna 4: Como Funciona o Pedido */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#DFBE76] mb-2">
              Transparência na Compra
            </h4>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Você escolhe suas peças aqui no catálogo, clica em finalizar e a lista detalhada é enviada diretamente para a Leidy no WhatsApp.
            </p>
            <div className="p-3 rounded-none bg-white/5 border border-white/10 text-[11px] text-[#DFBE76]">
              ✓ Estoque conferido na hora <br />
              ✓ Sem taxas ou intermediários
            </div>
          </div>

        </div>

        {/* Rodapé Inferior com Copyright, Área do Lojista e Crédito BCOMM */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-4">
          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
            <span className="hidden sm:inline text-white/10">•</span>
            <Link
              href="/admin"
              className="hover:text-[#DFBE76] transition-colors flex items-center gap-1 text-[11px]"
            >
              <Lock className="w-3 h-3 text-[#DFBE76]" />
              <span>Painel do Lojista</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span>Desenvolvido com excelência por</span>
            <span className="text-[#DFBE76] font-semibold tracking-wider">
              BCOMM Agência Digital
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

