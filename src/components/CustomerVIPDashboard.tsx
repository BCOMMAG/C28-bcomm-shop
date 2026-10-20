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
  AlertCircle,
  Sparkles,
  Gift,
  Tag,
  RefreshCw,
  Heart,
  Save,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductModal } from '@/components/ProductModal';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { useStore } from '@/context/StoreContext';
import { STORE_INFO } from '@/data/products';
import { getCustomerOrders, getOrderByNumber, CustomerOrder, saveCustomerLead } from '@/lib/orders';
import { fetchAddressByCep, formatCep } from '@/utils/shipping';
import {
  getStoreHomeUrl,
  getStoreWishlistUrl,
  getStoreCatalogUrl,
  normalizeTenantSlug
} from '@/lib/routes';

export function CustomerVIPDashboard() {
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
    currentTenant,
    products
  } = useStore();

  const tenantSlug = normalizeTenantSlug(currentTenant?.slug);
  const storeName = currentTenant?.nome || 'Leidy Boutique';
  const storeWhatsapp = currentTenant?.whatsapp || STORE_INFO.whatsapp;
  const storeVisuals = currentTenant?.configuracoes_visuais as any;
  const freeShippingGoal = Number(storeVisuals?.frete_gratis_valor || 350.0);

  // Estados de Sessão / Identificação
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerBirthday, setCustomerBirthday] = useState('');
  const [customerSize, setCustomerSize] = useState('M');
  const [customerShoeSize, setCustomerShoeSize] = useState('37');

  // Estados de Endereço de Entrega
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  // Estados de Pedidos
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchOrderCode, setSearchOrderCode] = useState('');
  const [searchedSingleOrder, setSearchedSingleOrder] = useState<CustomerOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [ordersTab, setOrdersTab] = useState<'todos' | 'andamento' | 'entregues'>('todos');
  const [mainTab, setMainTab] = useState<'pedidos' | 'dados' | 'endereco' | 'cupons' | 'atendimento'>('pedidos');

  // Formatação de telefone brasileira
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  // Carrega dados locais da cliente salvos no navegador para a loja atual
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPhone =
        localStorage.getItem(`bcomm_customer_${tenantSlug}_phone`) ||
        localStorage.getItem('leidy_customer_phone');
      const savedName =
        localStorage.getItem(`bcomm_customer_${tenantSlug}_name`) ||
        localStorage.getItem('leidy_customer_name');
      const savedEmail = localStorage.getItem(`bcomm_customer_${tenantSlug}_email`);
      const savedBirthday = localStorage.getItem(`bcomm_customer_${tenantSlug}_birthday`);
      const savedSize = localStorage.getItem(`bcomm_customer_${tenantSlug}_size`);
      const savedShoe = localStorage.getItem(`bcomm_customer_${tenantSlug}_shoesize`);

      if (savedName) setCustomerName(savedName);
      if (savedEmail) setCustomerEmail(savedEmail);
      if (savedBirthday) setCustomerBirthday(savedBirthday);
      if (savedSize) setCustomerSize(savedSize);
      if (savedShoe) setCustomerShoeSize(savedShoe);

      // Carrega Endereço Salvo
      const savedAddrRaw = localStorage.getItem(`bcomm_customer_${tenantSlug}_address`);
      if (savedAddrRaw) {
        const addr = JSON.parse(savedAddrRaw);
        if (addr.cep) setCep(formatCep(addr.cep));
        if (addr.logradouro) setLogradouro(addr.logradouro);
        if (addr.numero) setNumero(addr.numero);
        if (addr.complemento) setComplemento(addr.complemento);
        if (addr.bairro) setBairro(addr.bairro);
        if (addr.cidade) setCidade(addr.cidade);
        if (addr.uf) setUf(addr.uf);
      }

      if (savedPhone && savedPhone.length >= 10) {
        setPhoneInput(formatPhone(savedPhone));
        setCustomerPhone(savedPhone);
        handleFetchOrders(savedPhone);
      }
    } catch (e) {
      console.warn('Erro ao restaurar dados do cliente:', e);
    }
  }, [tenantSlug]);

  // Consulta pedidos no Supabase para a loja
  const handleFetchOrders = async (phoneToQuery: string) => {
    const clean = phoneToQuery.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Por favor, informe seu WhatsApp completo com DDD.');
      return;
    }

    setIsLoadingOrders(true);
    setErrorMessage('');

    try {
      const res = await getCustomerOrders(clean, currentTenant.id);
      setIsLoggedIn(true);
      setCustomerPhone(clean);

      if (res.cliente?.nome && !customerName) {
        setCustomerName(res.cliente.nome);
      }
      if (res.cliente?.email && !customerEmail) {
        setCustomerEmail(res.cliente.email);
      }
      setCustomerOrders(res.pedidos || []);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`bcomm_customer_${tenantSlug}_phone`, clean);
        localStorage.setItem('leidy_customer_phone', clean);
        if (res.cliente?.nome) {
          localStorage.setItem(`bcomm_customer_${tenantSlug}_name`, res.cliente.nome);
          localStorage.setItem('leidy_customer_name', res.cliente.nome);
        }
      }
    } catch {
      setErrorMessage('Ocorreu uma falha ao conectar com o sistema. Tente novamente.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Desconectar / Trocar de WhatsApp
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomerOrders([]);
    setCustomerPhone('');
    setPhoneInput('');
    try {
      localStorage.removeItem(`bcomm_customer_${tenantSlug}_phone`);
      localStorage.removeItem('leidy_customer_phone');
    } catch (e) {
      console.warn(e);
    }
  };

  // Busca CEP automático via ViaCEP
  const handleCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      const res = await fetchAddressByCep(clean);
      setIsLoadingCep(false);
      if (res && !res.erro) {
        setLogradouro(res.logradouro || '');
        setBairro(res.bairro || '');
        setCidade(res.localidade || '');
        setUf(res.uf || '');
      }
    }
  };

  // Salvar Endereço de Entrega (Sincroniza com Checkout)
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const addressData = {
      cep: cep.replace(/\D/g, ''),
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf
    };
    try {
      localStorage.setItem(`bcomm_customer_${tenantSlug}_address`, JSON.stringify(addressData));
      // Salva também para o checkout
      localStorage.setItem(`bcomm_saved_cep_${tenantSlug}`, addressData.cep);
      localStorage.setItem(
        `bcomm_saved_address_${tenantSlug}`,
        JSON.stringify({
          cep: addressData.cep,
          logradouro,
          bairro,
          localidade: cidade,
          uf
        })
      );
      setAddressSavedSuccess(true);
      setTimeout(() => setAddressSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Erro ao salvar endereço:', err);
    }
  };

  // Salvar Dados Pessoais / Aniversário
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(`bcomm_customer_${tenantSlug}_name`, customerName);
      localStorage.setItem(`bcomm_customer_${tenantSlug}_email`, customerEmail);
      localStorage.setItem(`bcomm_customer_${tenantSlug}_birthday`, customerBirthday);
      localStorage.setItem(`bcomm_customer_${tenantSlug}_size`, customerSize);
      localStorage.setItem(`bcomm_customer_${tenantSlug}_shoesize`, customerShoeSize);
      localStorage.setItem('leidy_customer_name', customerName);

      // Envia lead enriquecido ao Supabase
      if (customerPhone) {
        await saveCustomerLead({
          lojaId: currentTenant.id,
          nome: customerName,
          telefone: customerPhone,
          email: customerEmail,
          origem: 'central_vip_cliente'
        });
      }

      setProfileSavedSuccess(true);
      setTimeout(() => setProfileSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Erro ao salvar perfil:', err);
    }
  };

  // Copiar código de rastreio ou cupom
  const handleCopy = (text: string, type: 'code' | 'coupon') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    } else {
      setCopiedCoupon(text);
      setTimeout(() => setCopiedCoupon(null), 2500);
    }
  };

  // Ação "Comprar Novamente" (Repetir Pedido)
  const handleReorder = (pedido: CustomerOrder) => {
    if (!pedido.itens_pedido || pedido.itens_pedido.length === 0) return;
    pedido.itens_pedido.forEach((item) => {
      // Localiza o produto no catálogo da loja
      const matchedProd = products.find((p) => p.id === item.produto_id || p.name === item.nome_produto);
      if (matchedProd) {
        addToCart({
          product: matchedProd,
          size: item.tamanho || matchedProd.sizes[0] || 'Tamanho Único',
          color: item.cor || matchedProd.colors[0]?.name || 'Padrão',
          quantity: item.quantidade || 1
        });
      }
    });
    openCart();
  };

  // Consulta pedido avulso por código
  const handleSearchSingleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderCode.trim()) return;

    setIsLoadingOrders(true);
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
      setIsLoadingOrders(false);
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

  // Badges de Status do Pedido
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

  // Filtro de pedidos
  const filteredOrders = useMemo(() => {
    if (ordersTab === 'andamento') {
      return customerOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
    }
    if (ordersTab === 'entregues') {
      return customerOrders.filter((o) => o.status === 'entregue');
    }
    return customerOrders;
  }, [customerOrders, ordersTab]);

  const initials = useMemo(() => {
    if (!customerName) return 'VIP';
    const parts = customerName.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [customerName]);

  return (
    <div className="min-h-screen flex flex-col relative z-10 bg-[#FAF8F5] dark:bg-[#121110] text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header Fixo / Subpágina */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        activeCategory="Minha Conta"
        isSubpage={true}
      />

      <main className="flex-1 pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* BANNER VIP DE BOAS-VINDAS */}
        <div className="mb-8 p-6 sm:p-8 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-[#C5A059] text-white font-serif-luxury text-xl sm:text-2xl font-bold flex items-center justify-center rounded-none shadow-md shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059]">
                  Espaço VIP da Cliente
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                  {storeName}
                </span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1918] dark:text-[#FAF8F5]">
                {isLoggedIn ? `Olá, ${customerName || 'Cliente VIP'}!` : 'Central de Autoatendimento'}
              </h1>
              <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mt-1 max-w-lg">
                {isLoggedIn
                  ? `Gerencie seus pedidos, dados cadastrais, endereço e aproveite benefícios exclusivos.`
                  : `Acesse seu histórico de compras e acompanhe o rastreio das suas peças em tempo real.`}
              </p>
            </div>
          </div>

          {/* Atalho de Sessão */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[#C5A059]/35 hover:border-rose-400 text-xs text-[#78716C] hover:text-rose-500 transition-colors cursor-pointer shrink-0"
              title="Trocar WhatsApp"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair / Trocar WhatsApp</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#C5A059] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Acesso 100% Seguro</span>
            </div>
          )}
        </div>

        {/* 4 CARDS DE INDICADORES RÁPIDOS */}
        {isLoggedIn && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {/* Card 1: Pedidos */}
            <div
              onClick={() => setMainTab('pedidos')}
              className={`p-4 bg-white dark:bg-[#1A1918] border transition-all cursor-pointer ${
                mainTab === 'pedidos' ? 'border-[#C5A059] shadow-sm' : 'border-[#C5A059]/25 hover:border-[#C5A059]/50'
              }`}
            >
              <div className="flex items-center justify-between text-[#C5A059] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Compras</span>
                <Package className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-serif-luxury">{customerOrders.length}</p>
              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">pedidos registrados</span>
            </div>

            {/* Card 2: Favoritos */}
            <Link
              href={getStoreWishlistUrl(tenantSlug)}
              className="p-4 bg-white dark:bg-[#1A1918] border border-[#C5A059]/25 hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-center justify-between text-[#C5A059] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Desejos</span>
                <Heart className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-serif-luxury">{wishlistCount}</p>
              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">peças salvas</span>
            </Link>

            {/* Card 3: Cupons */}
            <div
              onClick={() => setMainTab('cupons')}
              className={`p-4 bg-white dark:bg-[#1A1918] border transition-all cursor-pointer ${
                mainTab === 'cupons' ? 'border-[#C5A059] shadow-sm' : 'border-[#C5A059]/25 hover:border-[#C5A059]/50'
              }`}
            >
              <div className="flex items-center justify-between text-[#C5A059] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Vantagens</span>
                <Tag className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-serif-luxury text-[#25D366]">10% OFF</p>
              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">cupom BEMVINDA10</span>
            </div>

            {/* Card 4: Frete Grátis */}
            <div className="p-4 bg-white dark:bg-[#1A1918] border border-[#C5A059]/25">
              <div className="flex items-center justify-between text-[#C5A059] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Frete Cortesia</span>
                <Truck className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold font-serif-luxury text-[#C5A059]">R$ {freeShippingGoal.toFixed(0)}</p>
              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">grátis para todo Brasil</span>
            </div>
          </div>
        )}

        {/* TELA DE IDENTIFICAÇÃO SE NÃO ESTIVER LOGADA */}
        {!isLoggedIn ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Bloco 1: Acesso por Celular / WhatsApp */}
            <div className="md:col-span-7 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#C5A059]/15 pb-4">
                <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center rounded-none">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-lg font-bold">Acesso Rápido Sem Senha</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    Basta informar seu WhatsApp para ver seus pedidos e dados.
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

                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingOrders}
                  className="w-full py-3.5 px-6 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOrders ? (
                    <span>Consultando...</span>
                  ) : (
                    <>
                      <span>Acessar Meu Espaço VIP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-[11px] text-[#A8A29E] text-center leading-relaxed">
                🔒 Seus dados são confidenciais e protegidos pela política de privacidade da {storeName}.
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
                    Já tem o código do pedido? Localize direto.
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
                  disabled={isLoadingOrders}
                  className="w-full py-2.5 px-4 border border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#C5A059] hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Localizar Pedido
                </button>
              </form>

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
          /* SE ESTIVER LOGADA: PAINEL COMPLETO COM 5 ABAS */
          <div className="space-y-6">
            {/* BARRA DE ABAS PRINCIPAIS */}
            <div className="flex items-center gap-1 sm:gap-2 border-b border-[#C5A059]/25 overflow-x-auto pb-px">
              {[
                { id: 'pedidos', label: 'Meus Pedidos', icon: Package, count: customerOrders.length },
                { id: 'dados', label: 'Meus Dados & Mimos', icon: User },
                { id: 'endereco', label: 'Endereço de Entrega', icon: MapPin },
                { id: 'cupons', label: 'Cupons & Vantagens', icon: Tag },
                { id: 'atendimento', label: 'Concierge VIP', icon: MessageCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = mainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMainTab(tab.id as any)}
                    className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5'
                        : 'border-transparent text-[#78716C] hover:text-[#1A1918] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#C5A059]/15 rounded-none font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CONTEÚDO DA ABA 1: PEDIDOS & RASTREAMENTO */}
            {mainTab === 'pedidos' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Sub-abas de filtro de pedidos e botão atualizar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1A1918] p-3 sm:p-4 border border-[#C5A059]/25">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrdersTab('todos')}
                      className={`px-3 py-1 text-xs font-semibold rounded-none cursor-pointer ${
                        ordersTab === 'todos' ? 'bg-[#C5A059] text-white' : 'bg-transparent text-[#78716C]'
                      }`}
                    >
                      Todos ({customerOrders.length})
                    </button>
                    <button
                      onClick={() => setOrdersTab('andamento')}
                      className={`px-3 py-1 text-xs font-semibold rounded-none cursor-pointer ${
                        ordersTab === 'andamento' ? 'bg-[#C5A059] text-white' : 'bg-transparent text-[#78716C]'
                      }`}
                    >
                      Em Andamento ({customerOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado').length})
                    </button>
                    <button
                      onClick={() => setOrdersTab('entregues')}
                      className={`px-3 py-1 text-xs font-semibold rounded-none cursor-pointer ${
                        ordersTab === 'entregues' ? 'bg-[#C5A059] text-white' : 'bg-transparent text-[#78716C]'
                      }`}
                    >
                      Entregues ({customerOrders.filter((o) => o.status === 'entregue').length})
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleFetchOrders(customerPhone)}
                      disabled={isLoadingOrders}
                      className="inline-flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#C5A059] cursor-pointer disabled:opacity-50"
                      title="Atualizar pedidos em tempo real"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                      <span>Atualizar Status</span>
                    </button>

                    <Link
                      href={getStoreCatalogUrl(tenantSlug)}
                      className="hidden sm:inline-flex items-center gap-1 text-xs text-[#C5A059] hover:underline font-semibold"
                    >
                      <span>Explorar Catálogo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Lista de Pedidos */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 p-8 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif-luxury text-xl font-bold">Nenhum pedido nesta categoria</h3>
                    <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] max-w-md mx-auto">
                      Você ainda não possui pedidos com este status no WhatsApp {formatPhone(customerPhone)}.
                    </p>
                    <Link
                      href={getStoreCatalogUrl(tenantSlug)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs uppercase tracking-widest font-semibold shadow-md hover:bg-[#C5A059] transition-all cursor-pointer"
                    >
                      <span>Conhecer Novas Peças</span>
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
                          {/* Topo do Pedido */}
                          <div className="p-4 sm:p-6 bg-[#FAF8F5] dark:bg-[#201D1B] border-b border-[#C5A059]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm sm:text-base font-bold text-[#1A1918] dark:text-white">
                                  #{pedido.numero_pedido}
                                </span>
                                <span
                                  className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 border ${badge.bg}`}
                                >
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

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] uppercase tracking-wider text-[#A8A29E] block">
                                  Valor Total
                                </span>
                                <span className="text-base sm:text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                                  R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              {/* Botão Comprar Novamente */}
                              <button
                                onClick={() => handleReorder(pedido)}
                                className="px-3 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059] text-[#C5A059] hover:text-white border border-[#C5A059]/40 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                title="Adicionar as peças de volta à sacola"
                              >
                                Repetir Pedido
                              </button>
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

                          {/* Código de Rastreio dos Correios */}
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
                                  onClick={() => handleCopy(pedido.codigo_rastreio!, 'code')}
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

                          {/* Peças do Pedido */}
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

                          {/* Rodapé com Falar no WhatsApp */}
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

                            <a
                              href={`https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(
                                `Olá! Gostaria de falar sobre o meu pedido #${pedido.numero_pedido} na ${storeName}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                            >
                              <MessageCircle className="w-4 h-4 fill-white stroke-[#25D366]" />
                              <span>Falar no WhatsApp sobre este Pedido</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: MEUS DADOS CADASTRAIS & ANIVERSÁRIO */}
            {mainTab === 'dados' && (
              <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="border-b border-[#C5A059]/15 pb-4">
                  <h2 className="font-serif-luxury text-lg font-bold">Dados Cadastrais & Perfil VIP</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    Mantenha suas informações atualizadas para compras ágeis e atendimento personalizado.
                  </p>
                </div>

                {/* Banner de Mimos de Aniversário */}
                <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-start gap-3">
                  <Gift className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] uppercase tracking-wider">
                      Mimo Exclusivo de Aniversário 🎁
                    </h3>
                    <p className="text-xs text-[#78716C] dark:text-[#D6D3D1] mt-0.5 leading-relaxed">
                      Clientes que cadastram sua data de aniversário recebem presentes especiais, mimos e cupons com desconto VIP na semana do seu aniversário!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Fernanda Lima"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone ? formatPhone(customerPhone) : phoneInput}
                        disabled
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#78716C] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        E-mail para Confirmações
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Data de Aniversário 🎂
                      </label>
                      <input
                        type="date"
                        value={customerBirthday}
                        onChange={(e) => setCustomerBirthday(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Tamanho Preferido de Roupa
                      </label>
                      <select
                        value={customerSize}
                        onChange={(e) => setCustomerSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                      >
                        <option value="PP (36)">PP (36)</option>
                        <option value="P (38)">P (38)</option>
                        <option value="M (40)">M (40)</option>
                        <option value="G (42)">G (42)</option>
                        <option value="GG (44)">GG (44)</option>
                        <option value="Tamanho Único">Tamanho Único</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Calçado Usual
                      </label>
                      <select
                        value={customerShoeSize}
                        onChange={(e) => setCustomerShoeSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                      >
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="37">37</option>
                        <option value="38">38</option>
                        <option value="39">39</option>
                        <option value="40">40</option>
                      </select>
                    </div>
                  </div>

                  {profileSavedSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Dados salvos com sucesso! Suas preferências foram atualizadas.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="py-3 px-6 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados do Perfil</span>
                  </button>
                </form>
              </div>
            )}

            {/* CONTEÚDO DA ABA 3: ENDEREÇO DE ENTREGA */}
            {mainTab === 'endereco' && (
              <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="border-b border-[#C5A059]/15 pb-4">
                  <h2 className="font-serif-luxury text-lg font-bold">Endereço de Entrega Cadastrado</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    O endereço salvo aqui é sincronizado e preenchido automaticamente ao finalizar compras no checkout.
                  </p>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        CEP * {isLoadingCep && <span className="text-[#C5A059] animate-pulse">(Buscando...)</span>}
                      </label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="80000-000"
                        maxLength={9}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Logradouro (Rua, Avenida) *
                      </label>
                      <input
                        type="text"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        placeholder="Rua das Flores"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        placeholder="Apto 42 / Bloco B"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Centro"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#201D1B] border border-[#C5A059]/35 focus:border-[#C5A059] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] mb-1">
                        Cidade / UF *
                      </label>
                      <input
                        type="text"
                        value={cidade && uf ? `${cidade} / ${uf}` : ''}
                        readOnly
                        placeholder="Curitiba / PR"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#78716C] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {addressSavedSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Endereço salvo com sucesso! O checkout já está sincronizado.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="py-3 px-6 bg-[#1A1918] dark:bg-[#C5A059] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Endereço de Entrega</span>
                  </button>
                </form>
              </div>
            )}

            {/* CONTEÚDO DA ABA 4: CUPONS & VANTAGENS */}
            {mainTab === 'cupons' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-6 bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md">
                  <h2 className="font-serif-luxury text-lg font-bold mb-1">Seus Cupons & Vantagens Exclusivas</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mb-6">
                    Copie e aplique na sacola de compras para garantir seus benefícios na {storeName}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cupom 1: BEMVINDA10 */}
                    <div className="p-4 border-2 border-dashed border-[#C5A059]/60 bg-[#FAF8F5] dark:bg-[#201D1B] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                          Boas-Vindas
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          10% OFF
                        </span>
                      </div>
                      <p className="font-mono text-base font-bold tracking-wider text-[#1A1918] dark:text-white">
                        BEMVINDA10
                      </p>
                      <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                        Válido para a sua primeira compra em qualquer peça do catálogo.
                      </p>
                      <button
                        onClick={() => handleCopy('BEMVINDA10', 'coupon')}
                        className="w-full py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCoupon === 'BEMVINDA10' ? 'Cupom Copiado!' : 'Copiar Cupom'}</span>
                      </button>
                    </div>

                    {/* Vantagem 2: Frete Cortesia */}
                    <div className="p-4 border-2 border-dashed border-[#C5A059]/60 bg-[#FAF8F5] dark:bg-[#201D1B] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                          Benefício Automático
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          FRETE CORTESIA
                        </span>
                      </div>
                      <p className="font-mono text-base font-bold tracking-wider text-[#1A1918] dark:text-white">
                        ACIMA DE R$ {freeShippingGoal.toFixed(0)}
                      </p>
                      <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                        Aplicado automaticamente no carrinho para qualquer cidade do Brasil.
                      </p>
                      <Link
                        href={getStoreCatalogUrl(tenantSlug)}
                        className="w-full py-2 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Aproveitar na Coleção</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 5: CONCIERGE & ATENDIMENTO VIP */}
            {mainTab === 'atendimento' && (
              <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="border-b border-[#C5A059]/15 pb-4">
                  <h2 className="font-serif-luxury text-lg font-bold">Atendimento VIP & Concierge</h2>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    Fale diretamente com nossa consultora para tirar dúvidas sobre caimento, medidas e pronta entrega.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4 text-xs text-[#57534E] dark:text-[#D6D3D1]">
                    <div className="p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/25 space-y-2">
                      <p className="font-bold text-[#1A1918] dark:text-white text-sm">
                        ✨ Benefícios do Atendimento VIP:
                      </p>
                      <ul className="space-y-1.5 list-disc list-inside text-[#78716C] dark:text-[#A8A29E]">
                        <li>Envio de vídeos reais de provador sob demanda.</li>
                        <li>Assessoria de medidas precisas de busto, cintura e quadril.</li>
                        <li>Reserva de peças exclusivas antes do lançamento geral.</li>
                        <li>Acompanhamento humanizado de envio e entrega.</li>
                      </ul>
                    </div>

                    <div className="text-[11px] text-[#A8A29E]">
                      ⏰ <strong>Horário de Atendimento:</strong> Segunda a Sexta das 09h às 19h | Sábado das 09h às 13h
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 text-center space-y-4">
                    <div className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-serif-luxury text-base font-bold text-[#1A1918] dark:text-white">
                        WhatsApp Direto da {storeName}
                      </h3>
                      <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-1">
                        Clique abaixo para iniciar seu atendimento prioritário.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(
                        `Olá! Sou cliente VIP da ${storeName} e gostaria de um atendimento personalizado.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white stroke-[#25D366]" />
                      <span>Iniciar Atendimento VIP</span>
                    </a>
                  </div>
                </div>
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
