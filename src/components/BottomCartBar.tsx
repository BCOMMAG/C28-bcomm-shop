'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, ArrowRight, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export const BottomCartBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, cartCount, isCartOpen, openCart, isSideDrawerOpen, clearCart } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Regra: A barra inferior não pode aparecer no checkout, quando a sacola estiver vazia,
  // quando o drawer da sacola estiver aberto, ou quando o menu lateral esquerdo estiver aberto
  const isCheckoutPage = pathname?.startsWith('/checkout');
  if (cartCount === 0 || isCartOpen || isCheckoutPage || isSideDrawerOpen) {
    return null;
  }

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const formattedTotal = totalAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const isFreeShipping = totalAmount >= 350;

  return (
    <>
      {/* 1. VERSÃO MINIMIZADA NO DESKTOP (Pílula compacta e elegante no canto inferior direito) */}
      {isMinimized && (
        <aside
          aria-label="Sacola de compras minimizada"
          className="fixed bottom-5 right-5 z-40 hidden lg:flex items-center gap-3 bg-white/98 dark:bg-[#1A1918]/98 backdrop-blur-md border border-[#C5A059]/40 shadow-2xl px-4 py-2.5 animate-fadeIn"
        >
          {/* Clicar abre a sacola */}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76] transition-colors cursor-pointer group"
            title="Ver sacola de compras"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#C5A059] text-white text-[8px] font-bold w-3 h-3 flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span className="text-[#78716C] dark:text-[#A8A29E]">Sacola:</span>
            <span className="font-bold text-[#1A1918] dark:text-[#FAF8F5]">{formattedTotal}</span>
          </button>

          <span className="h-4 w-px bg-[#C5A059]/30" />

          {/* Botão Esvaziar Sacola (abre modal de confirmação) */}
          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="p-1 text-[#78716C] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Esvaziar sacola"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <span className="h-4 w-px bg-[#C5A059]/30" />

          {/* Botão Expandir Barra Completa */}
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-[#C5A059] hover:text-[#1A1918] dark:hover:text-white transition-colors cursor-pointer"
            title="Expandir barra de finalização"
          >
            <span>Expandir</span>
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Botão Rápido Finalizar */}
          <button
            type="button"
            onClick={() => router.push('/checkout/')}
            className="ml-1 px-3 py-1.5 bg-[#1A1918] dark:bg-[#C5A059] text-white text-[11px] uppercase tracking-wider font-bold hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            title="Ir para o checkout"
          >
            <span>Finalizar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* 2. BARRA FLUTUANTE DA SACOLA (RESPONSIVA) */}
      <aside
        aria-label="Barra de finalização de compras"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-[#1A1918]/98 backdrop-blur-md border-t border-[#C5A059]/35 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))] sm:pb-3 ${
          isMinimized ? 'lg:hidden' : 'block'
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto">
          
          {/* ========================================================================= */}
          {/* A. LAYOUT MOBILE (< lg): ESTRUTURA ELEGANTE E ESPAÇOSA EM 2 NÍVEIS        */}
          {/* Resolve o problema de texto truncado e ícone da lixeira espremido          */}
          {/* ========================================================================= */}
          <div className="lg:hidden flex flex-col">
            
            {/* Nível Superior: Contador de peças, Frete e Botão Esvaziar Sacola */}
            <div className="flex items-center justify-between px-3.5 pt-1.5 pb-1 border-b border-[#C5A059]/15 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                  {cartCount} {cartCount === 1 ? 'peça na sacola' : 'peças na sacola'}
                </span>
                {isFreeShipping && (
                  <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.2">
                    Frete Grátis
                  </span>
                )}
              </div>

              {/* Botão Esvaziar Sacola Mobile (perfeito para toque, sem espremer o botão preto) */}
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-[#78716C] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 active:text-rose-600 transition-colors py-0.5 px-1.5 cursor-pointer group"
                title="Esvaziar todas as peças da sacola"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-rose-500 transition-colors" />
                <span className="underline decoration-[#A8A29E]/50 group-hover:decoration-rose-500">Esvaziar sacola</span>
              </button>
            </div>

            {/* Nível Inferior: Miniatura, Valor Total e Botão de Finalizar */}
            <div className="px-3.5 pt-2 pb-1.5 flex items-center justify-between gap-3">
              
              {/* Miniatura da Peça e Subtotal */}
              <div
                onClick={openCart}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Ver detalhes da sacola"
              >
                <div className="relative w-9 h-11 shrink-0 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 overflow-hidden shadow-2xs group-hover:border-[#C5A059] transition-colors">
                  {cartItems[0]?.image ? (
                    <Image
                      src={cartItems[0].image}
                      alt={cartItems[0].name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  )}
                  {cartCount > 1 && (
                    <span className="absolute bottom-0 right-0 bg-[#1A1918] dark:bg-[#C5A059] text-white text-[9px] font-bold px-1 leading-tight">
                      +{cartCount - 1}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] leading-tight">
                    Total:
                  </span>
                  <span className="text-base font-bold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight leading-tight">
                    {formattedTotal}
                  </span>
                </div>
              </div>

              {/* Botão Finalizar Compras */}
              <button
                onClick={() => router.push('/checkout/')}
                className="flex-1 max-w-[195px] py-2.5 px-3 rounded-none bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Finalizar Compras</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* B. LAYOUT DESKTOP (>= lg): LINHA ÚNICA COM ESPAÇAMENTO NOBRE E MINIMIZAR  */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex items-center justify-between px-6 lg:px-8 xl:px-10 py-3 gap-4">
            
            {/* Lado Esquerdo: Miniatura da Peça e Subtotal */}
            <div
              onClick={openCart}
              className="flex items-center gap-3.5 min-w-0 cursor-pointer group"
              title="Ver sacola de compras"
            >
              <div className="relative w-11 h-13 shrink-0 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 overflow-hidden shadow-2xs group-hover:border-[#C5A059] transition-colors">
                {cartItems[0]?.image ? (
                  <Image
                    src={cartItems[0].image}
                    alt={cartItems[0].name}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                )}
                {cartCount > 1 && (
                  <span className="absolute bottom-0 right-0 bg-[#1A1918] dark:bg-[#C5A059] text-white text-[9px] font-bold px-1 leading-tight">
                    +{cartCount - 1}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 leading-tight mb-0.5">
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium group-hover:text-[#C5A059] transition-colors">
                    {cartCount} {cartCount === 1 ? 'peça na sacola' : 'peças na sacola'}
                  </span>
                  {isFreeShipping && (
                    <span className="text-[10px] font-semibold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded-none inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Frete Cortesia VIP
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 leading-tight">
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">Total da Compra:</span>
                  <span className="text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5] tracking-tight">
                    {formattedTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Ações (Esvaziar, Minimizar e Finalizar Compras) */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Botão Esvaziar Sacola */}
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#78716C] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-400/30 transition-colors cursor-pointer group"
                title="Esvaziar todas as peças da sacola"
              >
                <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>Esvaziar sacola</span>
              </button>

              {/* Botão Minimizar Barra */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#78716C] dark:text-[#A8A29E] hover:text-[#C5A059] dark:hover:text-[#DFBE76] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[#C5A059]/30 transition-colors cursor-pointer"
                title="Minimizar barra da sacola"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Minimizar</span>
              </button>

              {/* Botão de Finalizar Compras */}
              <button
                onClick={() => router.push('/checkout/')}
                className="px-7 py-3 rounded-none bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all font-semibold text-sm uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Finalizar Compras</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

            </div>

          </div>

        </div>
      </aside>

      {/* 3. POP-UP MODAL DE CONFIRMAÇÃO: Realmente deseja esvaziar a sacola? */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 p-6 shadow-2xl animate-scale text-center relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-cart-title"
          >
            <div className="w-12 h-12 mx-auto mb-3.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-6 h-6 stroke-[1.8]" />
            </div>

            <h3 id="clear-cart-title" className="font-serif-luxury text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5] mb-2">
              Esvaziar Sacola
            </h3>

            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed mb-6">
              Realmente deseja esvaziar a sacola? Todas as peças selecionadas serão removidas.
            </p>

            <div className="flex items-center gap-3">
              {/* Opção Não */}
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-[#FAF8F5] dark:bg-[#201D1B] text-[#57534E] dark:text-[#D6D3D1] hover:bg-black/5 dark:hover:bg-white/5 border border-[#C5A059]/30 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Não, Manter
              </button>

              {/* Opção Sim */}
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Sim, Esvaziar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
