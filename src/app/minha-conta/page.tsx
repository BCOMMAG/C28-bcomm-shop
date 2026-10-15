'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Copy,
  ChevronRight,
  User,
  Phone,
  Search,
  ArrowRight,
  LogOut,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductModal } from '@/components/ProductModal';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { useStore } from '@/context/StoreContext';
import { STORE_INFO } from '@/data/products';
import { getCustomerOrders, getOrderByNumber, CustomerOrder } from '@/lib/orders';

export default function MinhaContaPage() {
  const {
    cartCount,
    wishlistCount,
    wishlistIds,
    toggleWishlist,
    addToCart,
    openCart,
    isCartOpen,
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
    currentTenant
  } = useStore();

  const [phoneInput, setPhoneInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchOrderCode, setSearchOrderCode] = useState('');
  const [searchedSingleOrder, setSearchedSingleOrder] = useState<CustomerOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'todos' | 'andamento' | 'entregues'>('todos');

  // Formatação de telefone brasileira
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  // Carrega telefone salvo automaticamente do checkout na inicialização para o tenant atual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tenantKey = currentTenant.slug || 'default';
      const savedPhone = localStorage.getItem(`bcomm_customer_${tenantKey}_phone`);
      const savedName = localStorage.getItem(`bcomm_customer_${tenantKey}_name`);
      if (savedPhone && savedPhone.length >= 10) {
        setPhoneInput(formatPhone(savedPhone));
        setCustomerPhone(savedPhone);
        if (savedName) setCustomerName(savedName);
        handleFetchOrders(savedPhone);
      }
    }
  }, [currentTenant.id, currentTenant.slug]);

  // Busca os pedidos da cliente no Supabase escopado para esta loja
  const handleFetchOrders = async (phoneToQuery: string) => {
    const clean = phoneToQuery.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Por favor, informe seu WhatsApp completo com DDD.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await getCustomerOrders(clean, currentTenant.id);
      if (res.success) {
        setIsLoggedIn(true);
        setCustomerPhone(clean);
        if (res.cliente?.nome) {
          setCustomerName(res.cliente.nome);
        }
        setCustomerOrders(res.pedidos);
        if (typeof window !== 'undefined') {
          const tenantKey = currentTenant.slug || 'default';
          localStorage.setItem(`bcomm_customer_${tenantKey}_phone`, clean);
          if (res.cliente?.nome) {
            localStorage.setItem(`bcomm_customer_${tenantKey}_name`, res.cliente.nome);
          }
        }
      } else {
        setErrorMessage(res.error || 'Nenhum pedido encontrado.');
      }
    } catch {
      setErrorMessage('Ocorreu uma falha ao conectar com o sistema. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Busca de pedido avulso por código (ex: #LB-2026-1042)
  const handleSearchSingleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderCode.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSearchedSingleOrder(null);

    try {
      const res = await getOrderByNumber(searchOrderCode);
      if (res.success && res.pedido) {
        setSearchedSingleOrder(res.pedido);
      } else {
        setErrorMessage('Nenhum pedido encontrado com este código.');
      }
    } catch {
      setErrorMessage('Falha ao localizar o pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomerOrders([]);
    setCustomerPhone('');
    setCustomerName('');
    setPhoneInput('');
    setSearchedSingleOrder(null);
    if (typeof window !== 'undefined') {
      const tenantKey = currentTenant.slug || 'default';
      localStorage.removeItem(`bcomm_customer_${tenantKey}_phone`);
      localStorage.removeItem(`bcomm_customer_${tenantKey}_name`);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Formatação de data em PT-BR
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Status humanizado e cores refinadas
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return {
          label: 'Pagamento Confirmado',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          step: 2
        };
      case 'em_separacao':
        return {
          label: 'Em Separação / Embalagem de Luxo',
          bg: 'bg-[#C5A059]/15 text-[#C5A059] dark:text-[#DFBE76] border-[#C5A059]/30',
          step: 3
        };
      case 'enviado':
        return {
          label: 'Enviado / A Caminho',
          bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
          step: 4
        };
      case 'entregue':
        return {
          label: 'Entregue com Sucesso',
          bg: 'bg-emerald-700/15 text-emerald-800 dark:text-emerald-300 border-emerald-700/40',
          step: 5
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
          step: 0
        };
      case 'aguardando_whatsapp':
      case 'pendente':
      default:
        return {
          label: 'Aguardando no WhatsApp',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          step: 1
        };
    }
  };

  // Filtros de abas
  const filteredOrders = useMemo(() => {
    if (activeTab === 'andamento') {
      return customerOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
    }
    if (activeTab === 'entregues') {
      return customerOrders.filter((o) => o.status === 'entregue');
    }
    return customerOrders;
  }, [customerOrders, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#121110] text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header Fixo / Subpágina */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        activeCategory="Minha Conta"
        isSubpage={true}
      />

      <main className="flex-1 pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Cabeçalho da Página */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A059]/25 pb-6">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold text-[#C5A059] block mb-1">
              Espaço VIP da Cliente
            </span>
            <h1 className="font-serif-luxury text-2xl sm:text-4xl font-bold tracking-tight text-[#1A1918] dark:text-[#FAF8F5]">
              {isLoggedIn ? `Bem-vinda, ${customerName || 'Cliente VIP'}!` : 'Meus Pedidos & Rastreamento'}
            </h1>
            <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mt-1">
              {isLoggedIn
                ? `Acompanhe o status e rastreio de entrega de suas compras na Leidy Boutique.`
                : 'Acesse instantaneamente todos os seus pedidos informando seu WhatsApp.'}
            </p>
          </div>

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-[#C5A059]/30 hover:border-rose-400 text-xs text-[#78716C] hover:text-rose-500 transition-colors cursor-pointer self-center sm:self-auto"
              title="Desconectar este WhatsApp"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Trocar WhatsApp</span>
            </button>
          )}
        </div>

        {/* 1. TELA DE LOGIN PASSWORDLESS (POR CELULAR/WHATSAPP) */}
        {!isLoggedIn ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Bloco 1: Formulário de Acesso Rápido */}
            <div className="md:col-span-7 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#C5A059]/15 pb-4">
                <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center rounded-none">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-lg font-bold">Acesso VIP Sem Senha</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    Basta digitar seu WhatsApp com DDD para ver seus pedidos.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFetchOrders(phoneInput);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1.5">
                    WhatsApp com DDD *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                      placeholder="(41) 99999-9999"
                      maxLength={15}
                      className="w-full px-3.5 py-3 text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none text-[#1A1918] dark:text-[#FAF8F5]"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Consultando...</span>
                  ) : (
                    <>
                      <span>Acessar Meus Pedidos</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-[11px] text-[#A8A29E] text-center leading-relaxed">
                🔒 Seus dados são confidenciais e protegidos pela política de privacidade da Leidy Boutique.
              </div>
            </div>

            {/* Bloco 2: Consulta Rápida por Código Avulso */}
            <div className="md:col-span-5 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 border-b border-[#C5A059]/15 pb-4">
                <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center rounded-none">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-lg font-bold">Rastreio por Código</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    Já tem o código do pedido? Consulte diretamente.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearchSingleOrder} className="space-y-3">
                <input
                  type="text"
                  value={searchOrderCode}
                  onChange={(e) => setSearchOrderCode(e.target.value)}
                  placeholder="Ex: #LB-2026-1042"
                  className="w-full px-3.5 py-3 text-sm font-mono bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none text-[#1A1918] dark:text-[#FAF8F5]"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 border border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#C5A059] hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Localizar Pedido
                </button>
              </form>

              {/* Resultado do Pedido Avulso se consultado */}
              {searchedSingleOrder && (
                <div className="mt-4 p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1A1918] dark:text-white">
                      #{searchedSingleOrder.numero_pedido}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                        getStatusBadge(searchedSingleOrder.status).bg
                      }`}
                    >
                      {getStatusBadge(searchedSingleOrder.status).label}
                    </span>
                  </div>
                  <div className="text-xs text-[#78716C]">
                    Total: <strong className="text-[#1A1918] dark:text-white">R$ {searchedSingleOrder.total.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setCustomerOrders([searchedSingleOrder]);
                      setIsLoggedIn(true);
                    }}
                    className="w-full py-1.5 text-center bg-[#1A1918] text-white text-[11px] uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Ver Detalhes do Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 2. ÁREA LOGADA DA CLIENTE: LISTAGEM DE PEDIDOS */
          <div className="space-y-6">
            {/* Abas de Navegação de Pedidos */}
            <div className="flex items-center justify-between border-b border-[#C5A059]/20">
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={() => setActiveTab('todos')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                    activeTab === 'todos'
                      ? 'border-[#C5A059] text-[#C5A059]'
                      : 'border-transparent text-[#78716C] hover:text-[#1A1918] dark:hover:text-white'
                  }`}
                >
                  Todos ({customerOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('andamento')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                    activeTab === 'andamento'
                      ? 'border-[#C5A059] text-[#C5A059]'
                      : 'border-transparent text-[#78716C] hover:text-[#1A1918] dark:hover:text-white'
                  }`}
                >
                  Em Andamento ({customerOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado').length})
                </button>
                <button
                  onClick={() => setActiveTab('entregues')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                    activeTab === 'entregues'
                      ? 'border-[#C5A059] text-[#C5A059]'
                      : 'border-transparent text-[#78716C] hover:text-[#1A1918] dark:hover:text-white'
                  }`}
                >
                  Entregues ({customerOrders.filter((o) => o.status === 'entregue').length})
                </button>
              </div>

              <Link
                href="/catalogo"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-[#C5A059] hover:underline font-semibold"
              >
                <span>Fazer Novo Pedido</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Lista de Pedidos */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 p-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif-luxury text-xl font-bold">Nenhum pedido encontrado</h3>
                <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] max-w-md mx-auto">
                  Você ainda não possui pedidos registrados nesta categoria para o WhatsApp {formatPhone(customerPhone)}.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs uppercase tracking-widest font-semibold shadow-md hover:bg-[#C5A059] transition-all cursor-pointer"
                >
                  <span>Conhecer Catálogo Exclusivo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((pedido) => {
                  const badge = getStatusBadge(pedido.status);
                  const itemsCount = pedido.itens_pedido?.reduce((acc, i) => acc + i.quantidade, 0) || 0;

                  return (
                    <div
                      key={pedido.id}
                      className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md overflow-hidden animate-fadeIn"
                    >
                      {/* Topo do Card de Pedido */}
                      <div className="p-4 sm:p-6 bg-[#FAF8F5] dark:bg-[#201D1B] border-b border-[#C5A059]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-bold text-[#1A1918] dark:text-white">
                              #{pedido.numero_pedido}
                            </span>
                            <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#78716C] dark:text-[#A8A29E]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                              {formatDate(pedido.created_at)}
                            </span>
                            <span>•</span>
                            <span>{itemsCount} {itemsCount === 1 ? 'peça' : 'peças'}</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#A8A29E] block">Valor Total</span>
                          <span className="text-base sm:text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                            R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* Linha do Tempo Visual do Pedido (Stepper) */}
                      {pedido.status !== 'cancelado' && (
                        <div className="p-4 sm:p-6 border-b border-[#C5A059]/15 bg-white dark:bg-[#171615]">
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5A059] block mb-4">
                            Progresso da Compra
                          </span>

                          <div className="grid grid-cols-5 gap-1 sm:gap-2 relative">
                            {[
                              { step: 1, label: 'Pedido' },
                              { step: 2, label: 'Pago' },
                              { step: 3, label: 'Embalado' },
                              { step: 4, label: 'Enviado' },
                              { step: 5, label: 'Entregue' }
                            ].map((s) => {
                              const isCompleted = badge.step >= s.step;
                              const isCurrent = badge.step === s.step;

                              return (
                                <div key={s.step} className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-none border flex items-center justify-center text-xs font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-[#C5A059] border-[#C5A059] text-white'
                                        : 'bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 text-[#A8A29E]'
                                    } ${isCurrent ? 'ring-2 ring-[#C5A059]/50 animate-pulse' : ''}`}
                                  >
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : s.step}
                                  </div>
                                  <span
                                    className={`text-[9px] sm:text-[11px] mt-1.5 font-medium ${
                                      isCompleted ? 'text-[#1A1918] dark:text-[#FAF8F5] font-semibold' : 'text-[#A8A29E]'
                                    }`}
                                  >
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Código de Rastreio dos Correios (Se existir) */}
                      {pedido.codigo_rastreio && (
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/20 border-b border-indigo-200 dark:border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
                                Código de Rastreamento
                              </span>
                              <span className="font-mono text-sm font-bold text-indigo-950 dark:text-indigo-200">
                                {pedido.codigo_rastreio}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(pedido.codigo_rastreio!)}
                              className="px-3 py-1.5 bg-white dark:bg-[#1A1918] border border-indigo-300 dark:border-indigo-700 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Copiar código"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedCode === pedido.codigo_rastreio ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                            <a
                              href={`https://rastreamento.correios.com.br/app/index.php?codigo=${pedido.codigo_rastreio}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Rastrear nos Correios</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Itens do Pedido */}
                      <div className="p-4 sm:p-6 space-y-3">
                        <span className="text-[10px] uppercase tracking-wider text-[#A8A29E] font-bold block">
                          Peças Escolhidas
                        </span>
                        <div className="divide-y divide-[#C5A059]/10">
                          {pedido.itens_pedido?.map((item) => (
                            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {item.imagem_url ? (
                                  <div className="w-12 h-14 relative bg-[#FAF8F5] shrink-0 border border-[#C5A059]/20 overflow-hidden">
                                    <Image
                                      src={item.imagem_url}
                                      alt={item.nome_produto}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-14 bg-[#FAF8F5] dark:bg-[#201D1B] shrink-0 border border-[#C5A059]/20 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-[#C5A059]" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs sm:text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                                    {item.nome_produto}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                                    <span>Cor: <strong>{item.cor}</strong></span>
                                    <span>•</span>
                                    <span>Tam: <strong>{item.tamanho}</strong></span>
                                    <span>•</span>
                                    <span>Qtd: <strong>{item.quantidade}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                                  R$ {(Number(item.preco_unitario) * item.quantidade).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rodapé do Card com Endereço e Botão de Atendimento */}
                      <div className="p-4 sm:p-6 bg-[#FAF8F5]/60 dark:bg-[#161514] border-t border-[#C5A059]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-[#78716C] dark:text-[#A8A29E] space-y-0.5">
                          {pedido.endereco_entrega?.logradouro ? (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                              <span>
                                Entrega: {pedido.endereco_entrega.logradouro}, nº {pedido.endereco_entrega.numero || 'S/N'}
                                {pedido.endereco_entrega.cidade ? ` - ${pedido.endereco_entrega.cidade}/${pedido.endereco_entrega.uf}` : ''}
                              </span>
                            </p>
                          ) : (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                              <span>Endereço: Combinado diretamente no WhatsApp</span>
                            </p>
                          )}
                          <p className="text-[11px] text-[#A8A29E]">
                            Método: <span className="uppercase font-semibold">{pedido.metodo_pagamento}</span>
                          </p>
                        </div>

                        {/* Botão de 1 Clique para falar com a Leidy */}
                        <a
                          href={`https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(
                            `Olá Leidy! Gostaria de falar sobre o meu pedido #${pedido.numero_pedido} no site.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                        >
                          <MessageCircle className="w-4 h-4 fill-white stroke-[#25D366]" />
                          <span>Falar sobre este Pedido</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sacola Lateral e Modais Globais */}
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

      <Footer />
    </div>
  );
}
