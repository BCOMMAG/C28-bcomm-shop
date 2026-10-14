'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, MessageCircle, ShieldCheck, Truck, MapPin, Lock, ArrowRight } from 'lucide-react';
import { CartItem } from '@/types';
import { STORE_INFO, PRODUCTS } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { fetchAddressByCep, calculateShippingOptions, formatCep } from '@/utils/shipping';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onQuickAddItem?: (product: (typeof PRODUCTS)[0]) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onQuickAddItem
}) => {
  const router = useRouter();
  const { setSearchQuery, savedCep, savedAddress, setSavedAddressInfo, closeCartSilently, products } = useStore();
  const [cepInput, setCepInput] = useState(savedCep ? formatCep(savedCep) : '');
  const [isCepOpen, setIsCepOpen] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  // Trava a rolagem da página quando a sacola está aberta
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Fecha com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExploreCatalog = () => {
    setSearchQuery('');
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leidy:reset-catalog-filters'));
      if (window.location.pathname === '/catalogo' && !window.location.search) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push('/catalogo');
      }
    } else {
      router.push('/catalogo');
    }
  };

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingGoal = STORE_INFO.freeShippingThreshold;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingGoal) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingGoal - subtotal);

  // Sugestão de Upsell (peça que ainda não está no carrinho)
  const sourceProducts = products && products.length > 0 ? products : PRODUCTS;
  const upsellProduct = sourceProducts.find((p) => !items.some((i) => i.productId === p.id));

  // Sincroniza o input com o CEP salvo no contexto
  useEffect(() => {
    if (savedCep) {
      setCepInput(formatCep(savedCep));
    }
  }, [savedCep]);

  const handleCalculateDrawerCep = async () => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepError('Digite os 8 dígitos do CEP');
      return;
    }
    setIsCepLoading(true);
    setCepError('');
    try {
      const addr = await fetchAddressByCep(clean);
      if (addr) {
        setSavedAddressInfo(clean, addr);
        setIsCepOpen(false);
      } else {
        setCepError('CEP não localizado');
      }
    } catch {
      setCepError('Erro ao consultar CEP');
    } finally {
      setIsCepLoading(false);
    }
  };

  const drawerShippingOptions = savedAddress ? calculateShippingOptions(savedAddress.uf, subtotal) : [];
  const lowestShipping = drawerShippingOptions.length > 0 ? drawerShippingOptions[0] : null;
  const shippingCost = subtotal >= freeShippingGoal ? 0 : (lowestShipping ? lowestShipping.price : 0);
  const finalTotal = subtotal + shippingCost;

  const generateWhatsAppOrderLink = () => {
    let message = `Olá Leidy! Gostaria de finalizar meu pedido pelo site da *Leidy Boutique*:\n\n`;
    items.forEach((item, index) => {
      message += `🛍️ *${index + 1}. ${item.name}*\n`;
      message += `   - Cor: ${item.color}\n`;
      message += `   - Tamanho: ${item.size}\n`;
      message += `   - Qtd: ${item.quantity}x (R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')})\n\n`;
    });
    if (savedAddress) {
      message += `📍 *Endereço de Entrega:* ${savedAddress.bairro ? savedAddress.bairro + ', ' : ''}${savedAddress.localidade} - ${savedAddress.uf} (CEP: ${savedAddress.cep})\n`;
      if (subtotal >= freeShippingGoal) {
        message += `🚚 *Frete:* Cortesia VIP (Grátis)\n\n`;
      } else if (lowestShipping) {
        message += `🚚 *Opção de Frete:* ${lowestShipping.name} (${lowestShipping.formattedPrice} - ${lowestShipping.deliveryDays})\n\n`;
      } else {
        message += `\n`;
      }
    }
    message += `💰 *Subtotal das Peças:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    if (savedAddress && shippingCost > 0) {
      message += `💰 *Total Previsto com Frete:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n\n`;
    } else {
      message += `\n`;
    }
    message += `Poderia me confirmar a disponibilidade e passar as opções de pagamento?`;

    return `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop com desfoque */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container da gaveta: 100% de largura no mobile e lateral elegante no desktop */}
      <div className="fixed inset-y-0 right-0 left-0 sm:left-auto max-w-full flex sm:pl-10 pointer-events-none">
        <div className="w-full sm:w-[440px] max-w-full pointer-events-auto bg-[#FAF8F5] dark:bg-[#141312] text-[#1A1918] dark:text-[#FAF8F5] shadow-2xl flex flex-col sm:border-l border-[#C5A059]/30 h-full">
          
          {/* Header da Sacola */}
          <div className="p-4 sm:p-5 border-b border-[#C5A059]/20 flex items-center justify-between bg-white dark:bg-[#1A1918] shrink-0">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
              <h3 className="font-serif-luxury text-base sm:text-lg font-medium text-[#1A1918] dark:text-[#FAF8F5]">
                Sua Sacola ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 text-[#57534E] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white rounded-none hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors cursor-pointer"
              aria-label="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Progresso de Frete Cortesia */}
          <div className="px-4 sm:px-5 py-3 bg-[#F4EFE6] dark:bg-[#1E1B19] border-b border-[#C5A059]/15 shrink-0">
            <div className="flex justify-between items-center text-xs mb-1.5 gap-2">
              {remainingForFreeShipping > 0 ? (
                <span className="text-[#57534E] dark:text-[#D6D3D1] truncate">
                  Faltam <strong className="text-[#1A1918] dark:text-[#FAF8F5]">R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</strong> para Frete Cortesia!
                </span>
              ) : (
                <span className="text-[#25D366] font-semibold flex items-center gap-1">
                  Parabéns! Você ganhou Frete Cortesia!
                </span>
              )}
              <span className="text-[11px] font-bold text-[#C5A059] dark:text-[#DFBE76] shrink-0">
                {Math.round(progressToFreeShipping)}%
              </span>
            </div>
            <div className="w-full bg-white dark:bg-[#2A2624] h-2 rounded-none overflow-hidden border border-[#C5A059]/20">
              <div
                className="h-full bg-gradient-to-r from-[#C5A059] to-[#DFBE76] transition-all duration-500 rounded-none"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 min-h-0">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-none bg-white dark:bg-[#1E1B19] border border-[#C5A059]/30 flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-7 h-7 text-[#C5A059]" />
                </div>
                <div>
                  <h4 className="font-serif-luxury text-lg font-medium text-[#1A1918] dark:text-[#FAF8F5]">
                    Sua sacola está vazia
                  </h4>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1 max-w-xs">
                    Escolha as suas peças favoritas no catálogo para ver aqui.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExploreCatalog}
                  className="px-6 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white rounded-none text-xs uppercase tracking-widest font-semibold hover:bg-[#C5A059] transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-white dark:bg-[#1C1A18] rounded-none border border-[#C5A059]/20 shadow-xs relative"
                  >
                    {/* Imagem do Produto */}
                    <div className="relative w-16 sm:w-18 h-22 sm:h-24 rounded-none overflow-hidden bg-[#F4F2EE] dark:bg-[#252220] shrink-0 border border-black/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
                      <div>
                        <h4 className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] leading-tight line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-1 space-y-0.5">
                          <p>Cor: <span className="text-[#1A1918] dark:text-[#FAF8F5] font-medium">{item.color}</span></p>
                          <p>Tam: <span className="text-[#1A1918] dark:text-[#FAF8F5] font-medium">{item.size.split(' ')[0]}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        {/* Seletor de Quantidade */}
                        <div className="flex items-center border border-[#C5A059]/30 rounded-none bg-[#FAF8F5] dark:bg-[#252220] px-2 py-0.5 shrink-0">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] px-1 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] px-2">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] px-1 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Preço */}
                        <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] whitespace-nowrap">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Botão Remover */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-[#A8A29E] hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title="Remover peça"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Sugestão de Upsell Rápida na Sacola */}
                {upsellProduct && onQuickAddItem && (
                  <div className="p-3 sm:p-3.5 rounded-none bg-[#F7F3EB] dark:bg-[#1E1B19] border border-[#C5A059]/30 mt-3 sm:mt-4">
                    <span className="text-[10px] uppercase tracking-widest text-[#C5A059] dark:text-[#DFBE76] font-bold block mb-1.5">
                      Você também pode gostar:
                    </span>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="relative w-12 h-14 rounded-none overflow-hidden shrink-0 bg-white dark:bg-[#252220]">
                        <Image
                          src={upsellProduct.thumbnail}
                          alt={upsellProduct.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1A1918] dark:text-[#FAF8F5] truncate">
                          {upsellProduct.name}
                        </p>
                        <p className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          {upsellProduct.formattedPrice}
                        </p>
                      </div>
                      <button
                        onClick={() => onQuickAddItem(upsellProduct)}
                        className="px-3 py-1.5 bg-white dark:bg-[#252220] border border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white rounded-none text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rodapé da Sacola com Total e Finalização WhatsApp */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#C5A059]/20 bg-white dark:bg-[#1A1918] space-y-2.5 sm:space-y-3 shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-5">
              {/* Consulta Real de Frete via CEP na Sacola */}
              {savedAddress ? (
                <div className="p-2 sm:p-2.5 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span className="truncate text-[#1A1918] dark:text-[#FAF8F5] font-medium text-[11px] sm:text-xs">
                        {savedAddress.bairro ? `${savedAddress.bairro}, ` : ''}{savedAddress.localidade} - {savedAddress.uf}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCepOpen(!isCepOpen)}
                      className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase tracking-wider ml-2 shrink-0 cursor-pointer"
                    >
                      {isCepOpen ? 'Fechar' : 'Alterar'}
                    </button>
                  </div>
                  {isCepOpen && (
                    <div className="pt-2 mt-2 border-t border-[#C5A059]/15 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cepInput}
                          onChange={(e) => setCepInput(formatCep(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCalculateDrawerCep();
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="button"
                          onClick={handleCalculateDrawerCep}
                          disabled={isCepLoading}
                          className="px-3 py-1.5 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isCepLoading ? '...' : 'OK'}
                        </button>
                      </div>
                      {cepError && (
                        <p className="text-[10px] text-red-500 font-medium">{cepError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 sm:p-2.5 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                      Calcular Frete & Prazo:
                    </span>
                    <span className="text-[10px] text-[#A8A29E]">via Correios</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cepInput}
                      onChange={(e) => setCepInput(formatCep(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCalculateDrawerCep();
                        }
                      }}
                      placeholder="Digite seu CEP (00000-000)"
                      maxLength={9}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                    />
                    <button
                      type="button"
                      onClick={handleCalculateDrawerCep}
                      disabled={isCepLoading}
                      className="px-3 py-1.5 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isCepLoading ? '...' : 'Calcular'}
                    </button>
                  </div>
                  {cepError && (
                    <p className="text-[10px] text-red-500 font-medium">{cepError}</p>
                  )}
                </div>
              )}

              {/* Resumo do Pedido */}
              <div className="space-y-1.5 text-xs text-[#57534E] dark:text-[#D6D3D1]">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Envio / Entrega:</span>
                  <span className="text-[#C5A059] dark:text-[#DFBE76] font-medium">
                    {subtotal >= freeShippingGoal ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Grátis (VIP)</span>
                    ) : lowestShipping ? (
                      `${lowestShipping.name} (${lowestShipping.formattedPrice})`
                    ) : (
                      'A consultar'
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base font-bold text-[#1A1918] dark:text-[#FAF8F5] pt-2 border-t border-dashed border-[#C5A059]/20">
                  <span>Total Previsto:</span>
                  <span className="text-[#C5A059] dark:text-[#DFBE76]">
                    R$ {finalTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Banner de Transparência do Processo */}
              <div className="p-2.5 sm:p-3 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 text-[11px] text-[#57534E] dark:text-[#D6D3D1] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <span>
                  <strong>Atendimento VIP:</strong> Suas peças serão reservadas e a Leidy entrará em contato para confirmar detalhes e pagamento.
                </span>
              </div>

              {/* Botão Principal: FINALIZAR COMPRA (Leva com segurança para /checkout/) */}
              <button
                type="button"
                onClick={() => {
                  closeCartSilently();
                  router.push('/checkout/');
                }}
                className="w-full py-3.5 sm:py-4 px-6 rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>FINALIZAR COMPRA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Botão Secundário: Dúvidas / Falar no WhatsApp sem quebrar tela */}
              <button
                type="button"
                onClick={() => {
                  const url = generateWhatsAppOrderLink();
                  if (typeof window !== 'undefined') {
                    try {
                      window.open(url, '_blank');
                    } catch {
                      // Fallback seguro
                    }
                  }
                }}
                className="w-full py-2.5 sm:py-3 px-6 rounded-none text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/5 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-2xs active:scale-95 group cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white transition-colors" />
                <span>Tirar Dúvidas no WhatsApp</span>
              </button>

              {/* Botão Continuar Comprando */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-6 rounded-none text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 border border-[#C5A059]/30 bg-[#FAF8F5] dark:bg-[#252220] text-[#57534E] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white transition-colors cursor-pointer"
              >
                <span>Continuar Comprando</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
