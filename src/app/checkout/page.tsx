'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Check,
  Truck,
  CreditCard,
  QrCode,
  MessageCircle,
  Copy,
  ChevronRight,
  ChevronDown,
  Lock,
  Sparkles,
  Trash2,
  Tag,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { STORE_INFO, PRODUCTS } from '@/data/products';
import { fetchAddressByCep, calculateShippingOptions, formatCep, ShippingOption } from '@/utils/shipping';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    cartCount,
    savedCep,
    savedAddress,
    setSavedAddressInfo,
    updateCartQuantity,
    removeFromCart,
    addToCart
  } = useStore();

  // 1. Dados do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  // 2. Endereço de Entrega
  const [cepInput, setCepInput] = useState(savedCep ? formatCep(savedCep) : '');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [street, setStreet] = useState(savedAddress?.logradouro || '');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState(savedAddress?.complemento || '');
  const [neighborhood, setNeighborhood] = useState(savedAddress?.bairro || '');
  const [city, setCity] = useState(savedAddress?.localidade || '');
  const [uf, setUf] = useState(savedAddress?.uf || '');

  // Rastreia campos que foram preenchidos pelo ViaCEP
  const [filledByCep, setFilledByCep] = useState<{
    street?: boolean;
    neighborhood?: boolean;
    city?: boolean;
    uf?: boolean;
  }>({
    street: Boolean(savedAddress?.logradouro),
    neighborhood: Boolean(savedAddress?.bairro),
    city: Boolean(savedAddress?.localidade),
    uf: Boolean(savedAddress?.uf),
  });

  // 3. Frete, Pagamento e Cupom
  const [selectedShipping, setSelectedShipping] = useState<string>('sedex');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'whatsapp'>('pix');
  const [cardInstallments, setCardInstallments] = useState<number>(1);
  const [orderNotes, setOrderNotes] = useState('');

  // Cupom de Desconto
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // 4. Estados de Validação e Conclusão
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  // 5. Controle de Seções Sanfona / Touchscreen no Mobile
  // O resumo da sacola fica ABERTO logo de cara.
  // Os dados pessoais, endereço e pagamento vêm fechados para não escancarar a tela.
  const [mobileSections, setMobileSections] = useState({
    dados: false,
    endereco: false,
    pagamento: false,
    observacoes: false
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  const toggleMobileSection = (section: keyof typeof mobileSections) => {
    setMobileSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Formatação de telefone brasileiro
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Formatação de CPF
  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // Carrega dados salvos e captura inicial de lead
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPhone = localStorage.getItem('leidy_customer_phone');
        const savedName = localStorage.getItem('leidy_customer_name');
        if (savedPhone && !customerPhone) setCustomerPhone(formatPhone(savedPhone));
        if (savedName && !customerName) setCustomerName(savedName);
      } catch (e) {
        console.warn('Erro ao carregar dados salvos do cliente:', e);
      }
    }
  }, []);

  // Sincroniza dados salvos de CEP/Endereço caso venham do StoreContext
  useEffect(() => {
    if (savedAddress) {
      if (savedAddress.logradouro) setStreet(savedAddress.logradouro);
      if (savedAddress.bairro) setNeighborhood(savedAddress.bairro);
      if (savedAddress.localidade) setCity(savedAddress.localidade);
      if (savedAddress.uf) setUf(savedAddress.uf);
      setFilledByCep({
        street: Boolean(savedAddress.logradouro),
        neighborhood: Boolean(savedAddress.bairro),
        city: Boolean(savedAddress.localidade),
        uf: Boolean(savedAddress.uf),
      });
    }
  }, [savedAddress]);

  // Cálculos de Valores
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = STORE_INFO.freeShippingThreshold;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const shippingOptions: ShippingOption[] = uf ? calculateShippingOptions(uf, subtotal) : [];
  const chosenShippingOption = shippingOptions.find((opt) => opt.id === selectedShipping) || shippingOptions[0];

  const shippingPrice = isFreeShipping
    ? 0
    : chosenShippingOption
    ? chosenShippingOption.price
    : 0;

  // Desconto de Cupom
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.percent) / 100 : 0;

  // Desconto de 5% no PIX
  const baseForPix = Math.max(0, subtotal - couponDiscount);
  const pixDiscount = paymentMethod === 'pix' ? baseForPix * 0.05 : 0;

  // Total Final
  const totalAmount = Math.max(0, subtotal - couponDiscount + shippingPrice - pixDiscount);

  // Sugestão de Upsell (Peça que não está no carrinho)
  const upsellProduct = PRODUCTS.find((p) => !cartItems.some((i) => i.productId === p.id));

  // Chave PIX Oficial da Boutique
  const PIX_KEY = 'contato@leidyboutique.com.br';

  // Captura do Lead (WhatsApp e Nome do Cliente em tempo real para controle da loja)
  const captureLead = (phoneToSave?: string, nameToSave?: string, status: 'iniciado' | 'finalizado' = 'iniciado') => {
    if (typeof window === 'undefined') return;
    try {
      const cleanPhone = (phoneToSave || customerPhone).replace(/\D/g, '');
      const clientName = nameToSave !== undefined ? nameToSave : customerName;

      if (cleanPhone) localStorage.setItem('leidy_customer_phone', cleanPhone);
      if (clientName) localStorage.setItem('leidy_customer_name', clientName);

      if (cleanPhone.length >= 10) {
        const existingRaw = localStorage.getItem('leidy_checkout_leads');
        const leads: Array<any> = existingRaw ? JSON.parse(existingRaw) : [];

        const now = new Date().toISOString();
        const leadIndex = leads.findIndex((l) => (l.phone || '').replace(/\D/g, '') === cleanPhone);

        const leadData = {
          id: leadIndex >= 0 ? leads[leadIndex].id : `lead_${Date.now()}`,
          phone: phoneToSave || customerPhone,
          name: clientName,
          cep: cepInput,
          city,
          uf,
          total: totalAmount,
          itemCount: cartCount,
          items: cartItems.map((i) => ({
            name: i.name,
            color: i.color,
            size: i.size,
            qty: i.quantity,
            price: i.price
          })),
          updatedAt: now,
          status
        };

        if (leadIndex >= 0) {
          leads[leadIndex] = { ...leads[leadIndex], ...leadData };
        } else {
          leads.unshift(leadData);
        }

        localStorage.setItem('leidy_checkout_leads', JSON.stringify(leads.slice(0, 50)));
      }
    } catch (e) {
      console.warn('Erro ao registrar captura de lead local:', e);
    }
  };

  // Busca CEP via ViaCEP (sincronizada com o resumo e o formulário de entrega)
  const handleSearchCep = async (targetCep?: string) => {
    const clean = (targetCep || cepInput).replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepError('Digite os 8 dígitos do CEP.');
      return;
    }
    setIsCepLoading(true);
    setCepError('');
    try {
      const data = await fetchAddressByCep(clean);
      if (data) {
        setSavedAddressInfo(clean, data);
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setUf(data.uf || '');
        setFilledByCep({
          street: Boolean(data.logradouro),
          neighborhood: Boolean(data.bairro),
          city: Boolean(data.localidade),
          uf: Boolean(data.uf),
        });
        // Se o número ainda não foi digitado, abre o acordeão de endereço no mobile
        if (!number) {
          setMobileSections((prev) => ({ ...prev, endereco: true }));
        }
      } else {
        setCepError('CEP não encontrado. Preencha o endereço manualmente.');
        setFilledByCep({});
      }
    } catch {
      setCepError('Erro ao consultar CEP. Tente novamente.');
    } finally {
      setIsCepLoading(false);
    }
  };

  // Aplicação de Cupom
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'LEIDY10' || code === 'VIP10' || code === 'PRIMEIRACOMPRA' || code === 'BEMVINDA') {
      setAppliedCoupon({ code, percent: 10 });
      setCouponSuccess(`Cupom ${code} aplicado: 10% de desconto!`);
      setCouponError('');
    } else if (code === 'LEIDY15') {
      setAppliedCoupon({ code, percent: 15 });
      setCouponSuccess(`Cupom ${code} aplicado: 15% de desconto especial!`);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
      setCouponSuccess('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Verificações de conclusão de cada etapa
  const isDadosDone = Boolean(customerName.trim() && customerPhone.replace(/\D/g, '').length >= 10);
  const isEnderecoDone = Boolean(street.trim() && number.trim() && city.trim() && uf.trim());
  const isPagamentoDone = Boolean(paymentMethod);

  // Lista dinâmica do que falta
  const pendingSteps: string[] = [];
  if (!isDadosDone) pendingSteps.push('Seus Dados (Nome & WhatsApp)');
  if (!isEnderecoDone) pendingSteps.push('Endereço (com Número)');

  // Validação do Formulário
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) {
      errors.name = 'Por favor, informe seu nome completo.';
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.phone = 'Informe seu WhatsApp com DDD para envio da confirmação.';
    }
    if (!street.trim()) {
      errors.street = 'Informe a rua ou busque pelo CEP.';
    }
    if (!number.trim()) {
      errors.number = 'Informe o número da residência/prédio.';
    }
    if (!city.trim()) {
      errors.city = 'Informe a cidade.';
    }
    if (!uf.trim()) {
      errors.uf = 'Informe o estado (UF).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Finalizar Compra com Direcionamento ao WhatsApp
  const handleFinalizeOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Se houver pendências (nome/WhatsApp ou endereço com número), abre o pop-up informativo e persuasivo
    if (!isDadosDone || !isEnderecoDone) {
      setShowPendingModal(true);
      return;
    }

    // Se já estiver tudo preenchido, vai direto para o WhatsApp
    proceedToWhatsApp(false);
  };

  // Envio efetivo do pedido para o WhatsApp (seja preenchido ou direto)
  const proceedToWhatsApp = (isDirectWithoutFilling = false) => {
    if (customerPhone) {
      captureLead(customerPhone, customerName || 'Cliente WhatsApp', 'finalizado');
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newOrderId = `LB-2026-${randomCode}`;
    setOrderId(newOrderId);
    setOrderSubmitted(true);
    setShowPendingModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Dispara a abertura do WhatsApp com a mensagem pronta
    const text = buildOrderSummaryText(newOrderId, isDirectWithoutFilling);
    const url = `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      try {
        window.open(url, '_blank');
      } catch (err) {
        console.warn('Pop-up bloqueado pelo navegador:', err);
      }
    }
  };

  // Opção recomendada do pop-up: preencher agora no site (Mais Rápido)
  const handleCompleteOnSite = () => {
    setShowPendingModal(false);

    if (!isDadosDone) {
      setMobileSections((prev) => ({ ...prev, dados: true }));
      setTimeout(() => {
        const target = document.getElementById('section-dados-mobile') || document.getElementById('section-dados-desktop');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else if (!isEnderecoDone) {
      setMobileSections((prev) => ({ ...prev, endereco: true }));
      setTimeout(() => {
        const target = document.getElementById('section-endereco-mobile') || document.getElementById('section-endereco-desktop');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  // Monta a mensagem completa formatada e inviolável do pedido
  const buildOrderSummaryText = (customOrderId?: string, isDirectWithoutFilling?: boolean) => {
    const finalId = customOrderId || orderId || 'LB-2026';
    let msg = `✨ *PEDIDO CONFIRMADO NO SITE LEIDY BOUTIQUE* ✨\n`;
    msg += `🔖 *Pedido:* #${finalId}\n\n`;
    msg += `👤 *Cliente:* ${customerName || 'Cliente Leidy Boutique'}\n`;
    msg += `📱 *WhatsApp:* ${customerPhone || 'A confirmar diretamente no chat'}\n`;
    if (customerEmail) msg += `✉️ *E-mail:* ${customerEmail}\n`;
    if (customerCpf) msg += `📄 *CPF:* ${customerCpf}\n`;

    if (street) {
      msg += `\n📍 *Endereço de Entrega:*\n`;
      msg += `${street}, nº ${number || 'S/N'}${complement ? ` (${complement})` : ''}\n`;
      msg += `${neighborhood} - ${city}/${uf}\n`;
      msg += `CEP: ${cepInput}\n`;
    } else if (cepInput) {
      msg += `\n📍 *Endereço de Entrega:* CEP ${cepInput} (Rua/Número a combinar no WhatsApp)\n`;
    } else {
      msg += `\n📍 *Endereço de Entrega:* A combinar diretamente aqui no WhatsApp\n`;
    }

    msg += `\n🛍️ *Peças Escolhidas:*\n`;
    cartItems.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}*\n`;
      msg += `   • Cor: ${item.color} | Tam: ${item.size}\n`;
      msg += `   • Qtd: ${item.quantity}x (R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')})\n`;
    });

    msg += `\n💳 *Forma de Pagamento:* ${
      paymentMethod === 'pix'
        ? 'PIX (com 5% de desconto à vista)'
        : paymentMethod === 'credit_card'
        ? `Cartão de Crédito (${cardInstallments}x de R$ ${(totalAmount / cardInstallments).toFixed(2).replace('.', ',')} sem juros)`
        : 'Atendimento VIP no WhatsApp'
    }\n`;

    msg += `🚚 *Envio:* ${isFreeShipping ? 'Frete VIP Cortesia (Grátis)' : `${chosenShippingOption?.name || 'Correios'} (R$ ${shippingPrice.toFixed(2).replace('.', ',')})`}\n`;

    if (appliedCoupon) {
      msg += `🏷️ *Cupom Aplicado:* ${appliedCoupon.code} (-R$ ${couponDiscount.toFixed(2).replace('.', ',')})\n`;
    }

    if (pixDiscount > 0) {
      msg += `🏷️ *Desconto PIX (5%):* -R$ ${pixDiscount.toFixed(2).replace('.', ',')}\n`;
    }

    msg += `💰 *VALOR TOTAL:* R$ ${totalAmount.toFixed(2).replace('.', ',')}\n`;
    if (orderNotes) {
      msg += `\n📝 *Observações:* ${orderNotes}\n`;
    }

    if (isDirectWithoutFilling && pendingSteps.length > 0) {
      msg += `\nOlá Leidy! Preferi adiantar meu pedido pelo site e combinar meus dados de *${pendingSteps.join(' e ')}* aqui com você no WhatsApp! Poderia me atender? ✨`;
    } else {
      msg += `\nOlá Leidy! Acabei de registrar meu pedido com meus dados preenchidos no site e gostaria de confirmar a reserva e os dados de envio! ✨`;
    }

    return msg;
  };

  // Abre WhatsApp diretamente com o texto do pedido
  const handleOpenWhatsApp = () => {
    const text = buildOrderSummaryText();
    const url = `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      try {
        window.open(url, '_blank');
      } catch {
        handleCopyOrderText();
      }
    }
  };

  // Copia o resumo completo do pedido
  const handleCopyOrderText = () => {
    const text = buildOrderSummaryText();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 3000);
    }
  };

  // Copia a Chave PIX
  const handleCopyPixKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(PIX_KEY);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  // Helper de estilização inteligente de campos
  // Verde suave: preenchido pelo CEP
  // Vermelho suave: obrigatório pendente
  // Neutro: preenchido ou opcional
  const getFieldClass = (isFilledCep: boolean, isRequired: boolean, value: string, hasError?: boolean) => {
    const base = "w-full px-3.5 py-2.5 text-sm sm:text-xs focus:outline-none transition-colors border ";
    if (isFilledCep) {
      return base + "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-600/50 text-[#1A1918] dark:text-[#FAF8F5]";
    }
    if (hasError || (isRequired && !value.trim())) {
      return base + "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 text-[#1A1918] dark:text-[#FAF8F5]";
    }
    return base + "bg-white dark:bg-[#201D1B] border-[#C5A059]/30 focus:border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5]";
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#121110] text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      
      {/* 1. HEADER DO CHECKOUT COM NAVEGAÇÃO E RETORNO CLARO */}
      <header className="sticky top-0 z-30 bg-white/98 dark:bg-[#1A1918]/98 backdrop-blur-md border-b border-[#C5A059]/30 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Botão Voltar para a Loja */}
          <Link
            href="/catalogo"
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#57534E] dark:text-[#A8A29E] hover:text-[#C5A059] dark:hover:text-[#DFBE76] transition-colors group cursor-pointer"
            title="Voltar ao Catálogo"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Continuar Comprando</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          {/* Logo Centralizada */}
          <Link href="/" className="flex items-center justify-center" title="Leidy Boutique">
            <div className="relative w-32 sm:w-44 h-10 sm:h-12 flex items-center justify-center">
              <Image
                src="/images/Logo sem fundo.png"
                alt="Leidy Boutique"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Indicador de Segurança SSL */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#22C55E] font-bold bg-[#22C55E]/10 px-2.5 py-1 rounded-none border border-[#22C55E]/20">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Checkout Seguro 256-bit</span>
            <span className="sm:hidden">Seguro</span>
          </div>

        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-9 flex-1 w-full">
        
        {/* Caso a Sacola esteja vazia e nenhum pedido tenha sido enviado */}
        {cartCount === 0 && !orderSubmitted ? (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#FAF8F5] dark:bg-[#201D1B] rounded-none border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold mb-2 text-[#1A1918] dark:text-[#FAF8F5]">
              Sua sacola está vazia
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mb-6 leading-relaxed">
              Explore o catálogo da Leidy Boutique e escolha suas peças favoritas para finalizar o pedido.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] transition-all text-xs uppercase tracking-widest font-semibold rounded-none shadow-md cursor-pointer"
            >
              <span>Explorar Catálogo</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : orderSubmitted ? (
          
          /* 3. TELA DE SUCESSO: PEDIDO REGISTRADO COM SUCESSO */
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 shadow-xl p-6 sm:p-10 animate-fadeIn">
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center rounded-none shadow-sm">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#C5A059] dark:text-[#DFBE76] block mb-1">
                Reserva Realizada com Sucesso!
              </span>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1A1918] dark:text-[#FAF8F5] mb-2">
                Obrigada, {customerName}!
              </h1>
              <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E]">
                Número do Pedido: <strong className="text-[#1A1918] dark:text-white font-mono">{orderId}</strong>
              </p>
            </div>

            {/* Informações de Pagamento Conforme a Escolha */}
            {paymentMethod === 'pix' && (
              <div className="mb-6 p-4 sm:p-5 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#C5A059] flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Chave PIX da Boutique (5% OFF Aplicado)
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={PIX_KEY}
                    className="flex-1 bg-white dark:bg-[#141312] border border-[#C5A059]/30 px-3 py-2 text-xs font-mono text-[#1A1918] dark:text-[#FAF8F5] select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPixKey}
                    className="px-3.5 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] transition-colors text-xs font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                  Envie o comprovante do PIX para a consultora Leidy no WhatsApp para liberação imediata do envio.
                </p>
              </div>
            )}

            {paymentMethod === 'credit_card' && (
              <div className="mb-6 p-4 sm:p-5 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#C5A059]">
                  <CreditCard className="w-4 h-4" /> Cartão de Crédito em {cardInstallments}x Sem Juros
                </div>
                <p className="text-xs text-[#57534E] dark:text-[#D6D3D1] leading-relaxed">
                  A Leidy enviará o link de pagamento 100% seguro diretamente no seu WhatsApp para parcelamento em {cardInstallments}x de R$ {(totalAmount / cardInstallments).toFixed(2).replace('.', ',')} sem juros.
                </p>
              </div>
            )}

            {/* Botões Principais de Ação */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                <span>Enviar Pedido para a Leidy no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyOrderText}
                className="w-full py-3 px-6 bg-[#FAF8F5] dark:bg-[#201D1B] hover:bg-black/5 dark:hover:bg-white/5 text-[#1A1918] dark:text-[#FAF8F5] border border-[#C5A059]/40 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#C5A059]" />
                <span>{copiedOrder ? '✓ Resumo do Pedido Copiado!' : 'Copiar Detalhes do Pedido'}</span>
              </button>

              <Link
                href="/catalogo"
                className="w-full py-3 text-center block text-xs text-[#78716C] dark:text-[#A8A29E] hover:text-[#C5A059] font-medium transition-colors"
              >
                Voltar para a Página Inicial da Loja
              </Link>
            </div>

          </div>
        ) : (

          /* 4. TELA PRINCIPAL DO CHECKOUT */
          <div>
            
            {/* PAINEL DE CONTROLE DE FINALIZAÇÃO E PROGRESSO DINÂMICO */}
            <div id="checkout-progress-panel" className="mb-6 p-4 sm:p-5 bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] block mb-0.5">
                    Controle de Finalização
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                    {pendingSteps.length === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        ✨ Tudo pronto! Clique no botão abaixo para enviar seu pedido para o WhatsApp.
                      </span>
                    ) : (
                      <span className="text-[#57534E] dark:text-[#D6D3D1]">
                        Você está quase terminando sua compra! Falta apenas preencher: <strong className="text-rose-600 dark:text-rose-400">{pendingSteps.join(' e ')}</strong>.
                      </span>
                    )}
                  </p>
                </div>

                {/* Legenda sutil dos fundos */}
                <div className="flex items-center gap-3 text-[10px] text-[#78716C] dark:text-[#A8A29E] shrink-0 pt-1 sm:pt-0">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    Preenchido via CEP
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                    Obrigatório pendente
                  </span>
                </div>
              </div>

              {/* Barra de Progresso de Frete Cortesia VIP */}
              <div className="pt-2 border-t border-[#C5A059]/15">
                <div className="flex justify-between items-center text-xs mb-1.5 gap-2">
                  {remainingForFreeShipping > 0 ? (
                    <span className="text-[11px] text-[#57534E] dark:text-[#D6D3D1]">
                      Faltam <strong className="text-[#1A1918] dark:text-[#FAF8F5]">R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</strong> na sacola para ganhar <strong>Frete Cortesia VIP</strong>!
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#25D366] font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#DFBE76]" />
                      Sua compra atingiu Frete Cortesia VIP Grátis!
                    </span>
                  )}
                  <span className="text-xs font-bold text-[#C5A059] dark:text-[#DFBE76] shrink-0">
                    {Math.round(progressToFreeShipping)}%
                  </span>
                </div>
                <div className="w-full bg-[#FAF8F5] dark:bg-[#201D1B] h-2 rounded-none overflow-hidden border border-[#C5A059]/20">
                  <div
                    className="h-full bg-gradient-to-r from-[#C5A059] via-[#DFBE76] to-[#C5A059] transition-all duration-500 rounded-none"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* FLUXO MOBILE (lg:hidden)                                      */}
            {/* 1. Resumo da Sacola ABERTO logo de cara                       */}
            {/* 2. Seções dos dados em sanfonas touch (fechadas para não poluir) */}
            {/* ============================================================ */}
            <div className="lg:hidden space-y-4 mb-6">
              
              {/* 1. RESUMO DA SACOLA NO MOBILE (ABERTO E TOTALMENTE VISÍVEL) */}
              <div className="bg-white dark:bg-[#1A1918] p-4 border border-[#C5A059]/30 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                    <h2 className="font-serif-luxury text-base font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                      Resumo da Sacola
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#C5A059]">
                    {cartCount} {cartCount === 1 ? 'peça' : 'peças'}
                  </span>
                </div>

                {/* Peças da Sacola */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center py-2 border-b border-[#C5A059]/10 last:border-0 relative">
                      <div className="relative w-12 h-16 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/20 shrink-0 overflow-hidden">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                          Cor: <strong className="text-[#1A1918] dark:text-[#FAF8F5]">{item.color}</strong> • Tam: <strong className="text-[#1A1918] dark:text-[#FAF8F5]">{item.size}</strong>
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center border border-[#C5A059]/30 bg-[#FAF8F5] dark:bg-[#201D1B] px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="text-xs font-bold px-1.5 text-[#57534E] dark:text-[#A8A29E] hover:text-[#C5A059] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold px-1.5 text-[#1A1918] dark:text-[#FAF8F5]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="text-xs font-bold px-1.5 text-[#57534E] dark:text-[#A8A29E] hover:text-[#C5A059] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold text-[#C5A059]">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-1 right-1 p-1 text-[#A8A29E] hover:text-red-500 cursor-pointer"
                        title="Remover peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Cálculo de Frete Integrado no Resumo da Sacola */}
                <div className="pt-3 border-t border-[#C5A059]/15">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Calcular Frete & Prazo</span>
                    </label>
                    {isFreeShipping && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5">
                        VIP Grátis
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cepInput}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value);
                        setCepInput(formatted);
                        if (formatted.replace(/\D/g, '').length === 8) {
                          handleSearchCep(formatted);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                      className={getFieldClass(false, true, cepInput, Boolean(cepError))}
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchCep()}
                      disabled={isCepLoading}
                      className="px-3.5 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isCepLoading ? 'Buscando...' : 'Calcular'}
                    </button>
                  </div>
                  {cepError && <p className="text-[11px] text-rose-500 mt-1">{cepError}</p>}
                  {city && uf && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Destino: {city}/{uf} {street ? `• ${street}` : ''}</span>
                    </p>
                  )}
                </div>

                {/* Cupom de Desconto Integrado no Resumo da Sacola */}
                <div className="pt-3 border-t border-[#C5A059]/15">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                      Cupom de Desconto
                    </span>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/30 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Cupom {appliedCoupon.code} ({appliedCoupon.percent}% OFF) Ativo!</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Ex: LEIDY10"
                          className="flex-1 px-3 py-2 bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs uppercase text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3.5 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors cursor-pointer shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-rose-500 mt-1">{couponError}</p>}
                      {couponSuccess && <p className="text-[11px] text-emerald-600 mt-1">{couponSuccess}</p>}
                    </div>
                  )}
                </div>

                {/* Discriminativo Financeiro no Mobile */}
                <div className="pt-3 border-t border-[#C5A059]/15 space-y-1.5 text-xs text-[#57534E] dark:text-[#D6D3D1]">
                  <div className="flex justify-between">
                    <span>Subtotal das Peças:</span>
                    <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      R$ {subtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envio / Frete:</span>
                    <span className="font-semibold text-[#C5A059]">
                      {isFreeShipping ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Grátis (VIP)</span>
                      ) : shippingPrice > 0 ? (
                        `R$ ${shippingPrice.toFixed(2).replace('.', ',')}`
                      ) : (
                        'A calcular pelo CEP'
                      )}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Cupom ({appliedCoupon.code}):</span>
                      <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {pixDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Desconto Especial PIX (5%):</span>
                      <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base font-bold text-[#1A1918] dark:text-[#FAF8F5] pt-2 border-t border-dashed border-[#C5A059]/30">
                    <span>Total Final:</span>
                    <span className="text-[#C5A059] dark:text-[#DFBE76]">
                      R$ {totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. ACORDEÃO TOUCH: SEUS DADOS PESSOAIS */}
              <div id="section-dados-mobile" className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs overflow-hidden scroll-mt-24">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('dados')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="font-serif-luxury text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Seus Dados Pessoais
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDadosDone ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Concluído
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20">
                        Pendente
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 ${
                        mobileSections.dados ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {mobileSections.dados && (
                  <div className="p-4 pt-1 border-t border-[#C5A059]/15 space-y-3.5 text-xs animate-fadeIn">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          Nome Completo *
                        </label>
                        {!customerName.trim() && (
                          <span className="text-[10px] text-rose-500">* Obrigatório</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }));
                        }}
                        onBlur={() => captureLead(customerPhone, customerName)}
                        placeholder="Ex: Maria Carolina da Silva"
                        className={getFieldClass(false, true, customerName, Boolean(formErrors.name))}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          WhatsApp com DDD *
                        </label>
                        {customerPhone.replace(/\D/g, '').length < 10 && (
                          <span className="text-[10px] text-rose-500">* Obrigatório</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => {
                          const val = formatPhone(e.target.value);
                          setCustomerPhone(val);
                          if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: '' }));
                          if (val.replace(/\D/g, '').length >= 10) {
                            captureLead(val, customerName);
                          }
                        }}
                        onBlur={() => captureLead(customerPhone, customerName)}
                        placeholder="(49) 99999-9999"
                        maxLength={15}
                        className={getFieldClass(false, true, customerPhone, Boolean(formErrors.phone))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                          E-mail (Opcional)
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-3.5 py-2.5 text-sm sm:text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                          CPF (Opcional)
                        </label>
                        <input
                          type="text"
                          value={customerCpf}
                          onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className="w-full px-3.5 py-2.5 text-sm sm:text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. ACORDEÃO TOUCH: ENDEREÇO DE ENTREGA */}
              <div id="section-endereco-mobile" className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs overflow-hidden scroll-mt-24">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('endereco')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="font-serif-luxury text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Endereço de Entrega
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEnderecoDone ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Concluído
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20">
                        Pendente
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 ${
                        mobileSections.endereco ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {mobileSections.endereco && (
                  <div className="p-4 pt-1 border-t border-[#C5A059]/15 space-y-3.5 text-xs animate-fadeIn">
                    {/* CEP */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          CEP *
                        </label>
                        {!cepInput.trim() && (
                          <span className="text-[10px] text-rose-500">* Obrigatório</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cepInput}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);
                            setCepInput(formatted);
                            if (formatted.replace(/\D/g, '').length === 8) {
                              handleSearchCep(formatted);
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className={getFieldClass(false, true, cepInput, Boolean(cepError))}
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchCep()}
                          disabled={isCepLoading}
                          className="px-4 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white font-semibold uppercase tracking-wider text-xs hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isCepLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                      {cepError && <span className="text-[11px] text-rose-500 mt-1 block">{cepError}</span>}
                    </div>

                    {/* Rua e Número */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-8">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Rua / Avenida *
                          </label>
                          {filledByCep.street && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value);
                            setFilledByCep((p) => ({ ...p, street: false }));
                          }}
                          placeholder="Ex: Av. Brasil"
                          className={getFieldClass(Boolean(filledByCep.street), true, street, Boolean(formErrors.street))}
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Número *
                          </label>
                          {!number.trim() && (
                            <span className="text-[10px] text-rose-500">*</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={number}
                          onChange={(e) => {
                            setNumber(e.target.value);
                            if (formErrors.number) setFormErrors((p) => ({ ...p, number: '' }));
                          }}
                          placeholder="1250"
                          className={getFieldClass(false, true, number, Boolean(formErrors.number))}
                        />
                      </div>
                    </div>

                    {/* Complemento e Bairro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                          Complemento (Opcional)
                        </label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Ex: Apto 402"
                          className="w-full px-3.5 py-2.5 text-sm sm:text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Bairro *
                          </label>
                          {filledByCep.neighborhood && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => {
                            setNeighborhood(e.target.value);
                            setFilledByCep((p) => ({ ...p, neighborhood: false }));
                          }}
                          placeholder="Ex: Centro"
                          className={getFieldClass(Boolean(filledByCep.neighborhood), true, neighborhood)}
                        />
                      </div>
                    </div>

                    {/* Cidade e UF */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-9">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Cidade *
                          </label>
                          {filledByCep.city && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setFilledByCep((p) => ({ ...p, city: false }));
                          }}
                          placeholder="Ex: Chapecó"
                          className={getFieldClass(Boolean(filledByCep.city), true, city, Boolean(formErrors.city))}
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            UF *
                          </label>
                        </div>
                        <input
                          type="text"
                          value={uf}
                          onChange={(e) => {
                            setUf(e.target.value.toUpperCase());
                            setFilledByCep((p) => ({ ...p, uf: false }));
                          }}
                          placeholder="SC"
                          maxLength={2}
                          className={getFieldClass(Boolean(filledByCep.uf), true, uf, Boolean(formErrors.uf))}
                        />
                      </div>
                    </div>

                    {/* Opções de Envio */}
                    {uf && (
                      <div className="pt-2 border-t border-[#C5A059]/15">
                        <label className="block font-semibold mb-2 text-[#57534E] dark:text-[#D6D3D1]">
                          Opção de Envio (Correios):
                        </label>
                        <div className="space-y-2">
                          {isFreeShipping ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-xs">
                                    Frete VIP Cortesia (Grátis)
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    Envio priorizado com rastreamento completo
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ 0,00</span>
                            </div>
                          ) : (
                            shippingOptions.map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${
                                  selectedShipping === opt.id
                                    ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold'
                                    : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name="shipping_mobile"
                                    checked={selectedShipping === opt.id}
                                    onChange={() => setSelectedShipping(opt.id)}
                                    className="accent-[#C5A059]"
                                  />
                                  <div>
                                    <span className="block text-xs text-[#1A1918] dark:text-[#FAF8F5]">{opt.name}</span>
                                    <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{opt.deliveryDays}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-[#C5A059] font-bold">{opt.formattedPrice}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. ACORDEÃO TOUCH: FORMA DE PAGAMENTO */}
              <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('pagamento')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="font-serif-luxury text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Forma de Pagamento
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                      {paymentMethod === 'pix' ? 'PIX (5% OFF)' : paymentMethod === 'credit_card' ? `Cartão em ${cardInstallments}x` : 'WhatsApp'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 ${
                        mobileSections.pagamento ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {mobileSections.pagamento && (
                  <div className="p-4 pt-1 border-t border-[#C5A059]/15 space-y-3 text-xs animate-fadeIn">
                    {/* PIX */}
                    <label
                      className={`flex items-start justify-between p-3 border cursor-pointer transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="payment_mobile"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className="accent-[#C5A059] mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                              PIX À Vista (5% de Desconto Especial)
                            </span>
                            <span className="px-1 py-0.2 bg-[#22C55E] text-white text-[8px] font-bold uppercase">
                              5% OFF
                            </span>
                          </div>
                          <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                            Aprovação imediata e separação prioritária das suas peças na boutique.
                          </p>
                        </div>
                      </div>
                      <QrCode className="w-4 h-4 text-[#C5A059] shrink-0" />
                    </label>

                    {/* Cartão de Crédito */}
                    <div
                      className={`p-3 border transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <label className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="payment_mobile"
                            checked={paymentMethod === 'credit_card'}
                            onChange={() => setPaymentMethod('credit_card')}
                            className="accent-[#C5A059] mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] block">
                              Cartão de Crédito (Até 6x Sem Juros)
                            </span>
                            <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                              Link de pagamento 100% seguro emitido pela consultora no fechamento.
                            </p>
                          </div>
                        </div>
                        <CreditCard className="w-4 h-4 text-[#C5A059] shrink-0" />
                      </label>

                      {paymentMethod === 'credit_card' && (
                        <div className="mt-2.5 pt-2 border-t border-[#C5A059]/20">
                          <label className="block text-[10px] font-semibold mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                            Selecione o parcelamento:
                          </label>
                          <select
                            value={cardInstallments}
                            onChange={(e) => setCardInstallments(Number(e.target.value))}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 text-xs text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none font-medium cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                {num}x de R$ {(totalAmount / num).toFixed(2).replace('.', ',')} sem juros
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Combinar no WhatsApp */}
                    <label
                      className={`flex items-start justify-between p-3 border cursor-pointer transition-all ${
                        paymentMethod === 'whatsapp'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="payment_mobile"
                          checked={paymentMethod === 'whatsapp'}
                          onChange={() => setPaymentMethod('whatsapp')}
                          className="accent-[#C5A059] mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] block">
                            Combinar Pagamento no WhatsApp VIP
                          </span>
                          <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                            Fale diretamente com a Leidy e escolha as condições especiais.
                          </p>
                        </div>
                      </div>
                      <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                    </label>
                  </div>
                )}
              </div>

              {/* 5. ACORDEÃO TOUCH: OBSERVAÇÕES */}
              <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('observacoes')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <span className="font-serif-luxury text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Observações para a Leidy (Opcional)
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 ${
                      mobileSections.observacoes ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileSections.observacoes && (
                  <div className="p-4 pt-1 border-t border-[#C5A059]/15 text-xs animate-fadeIn">
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Embalar para presente, ponto de referência..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* BOTÃO PRINCIPAL DE FINALIZAÇÃO NO MOBILE */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleFinalizeOrder()}
                  className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-[0.18em] shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                  <span>FINALIZAR COMPRA NO WHATSAPP</span>
                </button>
                <p className="text-[10px] text-center text-[#78716C] dark:text-[#A8A29E] mt-2">
                  🔒 Seus dados serão enviados de forma segura para atendimento direto com a Leidy.
                </p>
              </div>

            </div>

            {/* ============================================================ */}
            {/* FLUXO DESKTOP (hidden lg:grid)                                */}
            {/* Duas Colunas: Formulário à Esquerda e Resumo Fixo à Direita   */}
            {/* ============================================================ */}
            <form onSubmit={handleFinalizeOrder} className="hidden lg:grid grid-cols-12 gap-8 items-start">
              
              {/* COLUNA ESQUERDA: DADOS, ENDEREÇO E PAGAMENTO (7 colunas) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* ETAPA 1: SEUS DADOS PESSOAIS */}
                <div id="section-dados-desktop" className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/30 shadow-xs scroll-mt-24">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C5A059]/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h2 className="font-serif-luxury text-base sm:text-lg font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        Seus Dados Pessoais
                      </h2>
                    </div>
                    {isDadosDone ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Concluído
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20">
                        Pendente
                      </span>
                    )}
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          Nome Completo *
                        </label>
                        {!customerName.trim() && (
                          <span className="text-[10px] text-rose-500">* Obrigatório</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }));
                        }}
                        onBlur={() => captureLead(customerPhone, customerName)}
                        placeholder="Ex: Maria Carolina da Silva"
                        className={getFieldClass(false, true, customerName, Boolean(formErrors.name))}
                      />
                      {formErrors.name && (
                        <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.name}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            WhatsApp com DDD *
                          </label>
                          {customerPhone.replace(/\D/g, '').length < 10 && (
                            <span className="text-[10px] text-rose-500">* Obrigatório</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => {
                            const val = formatPhone(e.target.value);
                            setCustomerPhone(val);
                            if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: '' }));
                            if (val.replace(/\D/g, '').length >= 10) {
                              captureLead(val, customerName);
                            }
                          }}
                          onBlur={() => captureLead(customerPhone, customerName)}
                          placeholder="(49) 99999-9999"
                          maxLength={15}
                          className={getFieldClass(false, true, customerPhone, Boolean(formErrors.phone))}
                        />
                        {formErrors.phone && (
                          <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.phone}</span>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                          E-mail (Opcional)
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                        CPF (Opcional - para Nota Fiscal)
                      </label>
                      <input
                        type="text"
                        value={customerCpf}
                        onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ETAPA 2: ENDEREÇO DE ENTREGA COM VIACEP */}
                <div id="section-endereco-desktop" className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/30 shadow-xs scroll-mt-24">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C5A059]/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h2 className="font-serif-luxury text-base sm:text-lg font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        Endereço de Entrega
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEnderecoDone ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Concluído
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20">
                          Pendente
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold flex items-center gap-1 ml-2">
                        <MapPin className="w-3.5 h-3.5" /> ViaCEP Oficial
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Campo de CEP com Busca */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          CEP *
                        </label>
                        {!cepInput.trim() && (
                          <span className="text-[10px] text-rose-500">* Obrigatório</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cepInput}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);
                            setCepInput(formatted);
                            if (formatted.replace(/\D/g, '').length === 8) {
                              handleSearchCep(formatted);
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className={getFieldClass(false, true, cepInput, Boolean(cepError))}
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchCep()}
                          disabled={isCepLoading}
                          className="px-4 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white font-semibold uppercase tracking-wider text-xs hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isCepLoading ? 'Buscando...' : 'Buscar CEP'}
                        </button>
                      </div>
                      {cepError && (
                        <span className="text-[11px] text-rose-500 mt-1 block">{cepError}</span>
                      )}
                    </div>

                    {/* Rua e Número */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-8">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Rua / Avenida *
                          </label>
                          {filledByCep.street && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Preenchido via CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value);
                            setFilledByCep((p) => ({ ...p, street: false }));
                          }}
                          placeholder="Ex: Av. Brasil"
                          className={getFieldClass(Boolean(filledByCep.street), true, street, Boolean(formErrors.street))}
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Número *
                          </label>
                          {!number.trim() && (
                            <span className="text-[10px] text-rose-500">* Obrigatório</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={number}
                          onChange={(e) => {
                            setNumber(e.target.value);
                            if (formErrors.number) setFormErrors((p) => ({ ...p, number: '' }));
                          }}
                          placeholder="Ex: 1250"
                          className={getFieldClass(false, true, number, Boolean(formErrors.number))}
                        />
                      </div>
                    </div>

                    {/* Complemento e Bairro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                          Complemento (Apto, Bloco...)
                        </label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Ex: Apto 402"
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Bairro *
                          </label>
                          {filledByCep.neighborhood && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Preenchido via CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => {
                            setNeighborhood(e.target.value);
                            setFilledByCep((p) => ({ ...p, neighborhood: false }));
                          }}
                          placeholder="Ex: Centro"
                          className={getFieldClass(Boolean(filledByCep.neighborhood), true, neighborhood)}
                        />
                      </div>
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-9">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Cidade *
                          </label>
                          {filledByCep.city && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Preenchido via CEP</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setFilledByCep((p) => ({ ...p, city: false }));
                          }}
                          placeholder="Ex: Chapecó"
                          className={getFieldClass(Boolean(filledByCep.city), true, city, Boolean(formErrors.city))}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            UF *
                          </label>
                        </div>
                        <input
                          type="text"
                          value={uf}
                          onChange={(e) => {
                            setUf(e.target.value.toUpperCase());
                            setFilledByCep((p) => ({ ...p, uf: false }));
                          }}
                          placeholder="SC"
                          maxLength={2}
                          className={getFieldClass(Boolean(filledByCep.uf), true, uf, Boolean(formErrors.uf))}
                        />
                      </div>
                    </div>

                    {/* Opções Reais de Frete */}
                    {uf && (
                      <div className="pt-3 border-t border-[#C5A059]/15">
                        <label className="block font-semibold mb-2 text-[#57534E] dark:text-[#D6D3D1]">
                          Opção de Envio (Correios):
                        </label>
                        <div className="space-y-2">
                          {isFreeShipping ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-xs">
                                    Frete VIP Cortesia (Grátis)
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    Envio priorizado com rastreamento completo
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ 0,00</span>
                            </div>
                          ) : (
                            shippingOptions.map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${
                                  selectedShipping === opt.id
                                    ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold'
                                    : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name="shipping_desktop"
                                    checked={selectedShipping === opt.id}
                                    onChange={() => setSelectedShipping(opt.id)}
                                    className="accent-[#C5A059]"
                                  />
                                  <div>
                                    <span className="block text-xs text-[#1A1918] dark:text-[#FAF8F5]">{opt.name}</span>
                                    <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{opt.deliveryDays}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-[#C5A059] font-bold">{opt.formattedPrice}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ETAPA 3: FORMA DE PAGAMENTO */}
                <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/30 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#C5A059]/20">
                    <span className="w-6 h-6 rounded-none bg-[#C5A059] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-serif-luxury text-base sm:text-lg font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Forma de Pagamento
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {/* Opção 1: PIX */}
                    <label
                      className={`flex items-start justify-between p-3.5 sm:p-4 border cursor-pointer transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_desktop"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className="accent-[#C5A059] mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                              PIX (À Vista com 5% de Desconto Especial)
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#22C55E] text-white text-[9px] font-bold uppercase">
                              5% OFF
                            </span>
                          </div>
                          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                            Aprovação imediata e separação prioritária das suas peças na boutique.
                          </p>
                        </div>
                      </div>
                      <QrCode className="w-5 h-5 text-[#C5A059] shrink-0" />
                    </label>

                    {/* Opção 2: Cartão de Crédito */}
                    <div
                      className={`p-3.5 sm:p-4 border transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <label className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payment_desktop"
                            checked={paymentMethod === 'credit_card'}
                            onChange={() => setPaymentMethod('credit_card')}
                            className="accent-[#C5A059] mt-0.5"
                          />
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] block">
                              Cartão de Crédito (Até 6x Sem Juros)
                            </span>
                            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                              Link de pagamento 100% seguro emitido pela consultora no fechamento.
                            </p>
                          </div>
                        </div>
                        <CreditCard className="w-5 h-5 text-[#C5A059] shrink-0" />
                      </label>

                      {paymentMethod === 'credit_card' && (
                        <div className="mt-3 pt-3 border-t border-[#C5A059]/20">
                          <label className="block text-[11px] font-semibold mb-1.5 text-[#57534E] dark:text-[#D6D3D1]">
                            Escolha o número de parcelas:
                          </label>
                          <select
                            value={cardInstallments}
                            onChange={(e) => setCardInstallments(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 text-xs text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none font-medium cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                {num}x de R$ {(totalAmount / num).toFixed(2).replace('.', ',')} sem juros
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Opção 3: Atendimento WhatsApp */}
                    <label
                      className={`flex items-start justify-between p-3.5 sm:p-4 border cursor-pointer transition-all ${
                        paymentMethod === 'whatsapp'
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-xs'
                          : 'border-black/10 dark:border-white/10 hover:border-[#C5A059]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_desktop"
                          checked={paymentMethod === 'whatsapp'}
                          onChange={() => setPaymentMethod('whatsapp')}
                          className="accent-[#C5A059] mt-0.5"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] block">
                            Combinar Pagamento no WhatsApp VIP
                          </span>
                          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                            Fale diretamente com a Leidy e tire qualquer dúvida com atendimento humanizado.
                          </p>
                        </div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" />
                    </label>
                  </div>
                </div>

                {/* ETAPA 4: OBSERVAÇÕES DO PEDIDO */}
                <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/30 shadow-xs">
                  <label className="block text-xs font-semibold mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                    Observações para a Leidy (Opcional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: Embalar para presente, ponto de referência..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

              </div>

              {/* COLUNA DIREITA: RESUMO INTERATIVO DO PEDIDO (5 colunas - sticky) */}
              <div className="lg:col-span-5 sticky top-28 space-y-6">
                
                <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/30 shadow-md">
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#C5A059]/20">
                    <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                      Resumo da Sacola
                    </h3>
                    <span className="text-xs text-[#C5A059] font-bold">
                      {cartCount} {cartCount === 1 ? 'peça' : 'peças'}
                    </span>
                  </div>

                  {/* Lista de Peças */}
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-[#C5A059]/10 last:border-0 relative">
                        <div className="relative w-14 sm:w-16 h-20 sm:h-22 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/25 shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] truncate leading-tight">
                            {item.name}
                          </h4>
                          <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 space-y-0.5">
                            <p>Cor: <strong className="text-[#1A1918] dark:text-[#FAF8F5]">{item.color}</strong> • Tam: <strong className="text-[#1A1918] dark:text-[#FAF8F5]">{item.size}</strong></p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-[#C5A059]/30 bg-[#FAF8F5] dark:bg-[#201D1B] px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="text-xs font-bold px-1 text-[#57534E] dark:text-[#A8A29E] hover:text-[#C5A059] cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold px-1.5 text-[#1A1918] dark:text-[#FAF8F5]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="text-xs font-bold px-1 text-[#57534E] dark:text-[#A8A29E] hover:text-[#C5A059] cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-xs font-bold text-[#C5A059]">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="absolute top-0 right-0 p-1 text-[#A8A29E] hover:text-red-500 transition-colors cursor-pointer"
                          title="Remover peça da sacola"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sugestão de Upsell */}
                  {upsellProduct && (
                    <div className="p-3 bg-[#F7F3EB] dark:bg-[#1E1B19] border border-[#C5A059]/30 mb-4">
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A059] dark:text-[#DFBE76] font-bold block mb-1.5">
                        Complete seu look:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-11 h-13 shrink-0 overflow-hidden border border-black/10 bg-white">
                          <Image src={upsellProduct.thumbnail} alt={upsellProduct.name} fill className="object-cover" />
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
                          type="button"
                          onClick={() =>
                            addToCart({
                              product: upsellProduct,
                              size: upsellProduct.sizes[0],
                              color: upsellProduct.colors[0].name,
                              quantity: 1,
                              openDrawer: false
                            })
                          }
                          className="px-2.5 py-1.5 bg-white dark:bg-[#252220] border border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#1A1918] hover:text-white rounded-none text-[11px] font-bold transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CÁLCULO DE FRETE NO RESUMO DA SACOLA (Sincronizado com o Endereço) */}
                  <div className="pt-3 pb-3 border-t border-[#C5A059]/15">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Calcular Frete & Prazo</span>
                      </label>
                      {isFreeShipping && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5">
                          VIP Grátis
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cepInput}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value);
                          setCepInput(formatted);
                          if (formatted.replace(/\D/g, '').length === 8) {
                            handleSearchCep(formatted);
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className={getFieldClass(false, true, cepInput, Boolean(cepError))}
                      />
                      <button
                        type="button"
                        onClick={() => handleSearchCep()}
                        disabled={isCepLoading}
                        className="px-3.5 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {isCepLoading ? 'Buscando...' : 'Calcular'}
                      </button>
                    </div>
                    {cepError && <p className="text-[11px] text-rose-500 mt-1">{cepError}</p>}
                    {city && uf && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Destino: {city}/{uf} {street ? `• ${street}` : ''}</span>
                      </p>
                    )}
                  </div>

                  {/* CUPOM DE DESCONTO NO RESUMO DA SACOLA */}
                  <div className="pt-3 pb-3 border-t border-[#C5A059]/15">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="text-xs font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                        Cupom de Desconto
                      </span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Cupom {appliedCoupon.code} ({appliedCoupon.percent}% OFF) Ativo!</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Ex: LEIDY10"
                            className="flex-1 px-3 py-2 bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs uppercase text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-3.5 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors cursor-pointer shrink-0"
                          >
                            Aplicar
                          </button>
                        </div>
                        {couponError && <p className="text-[11px] text-rose-500 mt-1">{couponError}</p>}
                        {couponSuccess && <p className="text-[11px] text-emerald-600 mt-1">{couponSuccess}</p>}
                      </div>
                    )}
                  </div>

                  {/* Discriminativo Financeiro Detalhado */}
                  <div className="space-y-2 text-xs pt-3 border-t border-[#C5A059]/20 text-[#57534E] dark:text-[#D6D3D1]">
                    <div className="flex justify-between items-center">
                      <span>Subtotal das Peças:</span>
                      <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        R$ {subtotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Envio / Frete:</span>
                      <span className="font-semibold text-[#C5A059]">
                        {isFreeShipping ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Grátis (VIP)</span>
                        ) : shippingPrice > 0 ? (
                          `R$ ${shippingPrice.toFixed(2).replace('.', ',')}`
                        ) : (
                          'A calcular pelo CEP'
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Cupom ({appliedCoupon.code}):</span>
                        <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    {pixDiscount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Desconto Especial PIX (5%):</span>
                        <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-base sm:text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5] pt-3 border-t border-dashed border-[#C5A059]/30">
                      <span>Total Final:</span>
                      <span className="text-[#C5A059] dark:text-[#DFBE76]">
                        R$ {totalAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Banner de Atendimento VIP */}
                  <div className="mt-5 p-3 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 text-[11px] text-[#57534E] dark:text-[#D6D3D1] leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                    <span>
                      <strong>Atendimento VIP:</strong> Suas peças serão reservadas e a Leidy entrará em contato para confirmar detalhes de envio e pagamento.
                    </span>
                  </div>

                  {/* Botão de Finalização Principal no Desktop */}
                  <div className="pt-5 space-y-2.5">
                    <button
                      type="submit"
                      className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-[0.18em] shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                      <span>FINALIZAR COMPRA NO WHATSAPP</span>
                    </button>
                  </div>

                  {/* Selos de Confiança */}
                  <div className="mt-5 pt-4 border-t border-[#C5A059]/15 grid grid-cols-2 gap-2 text-[10px] text-[#78716C] dark:text-[#A8A29E]">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Peças 100% Originais</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Envio Seguro Brasil</span>
                    </div>
                  </div>

                </div>

              </div>

            </form>
          </div>
        )}

      </main>

      {/* 5. MODAL POP-UP DE INFORMAÇÕES PENDENTES & PERSUASÃO VIP */}
      {showPendingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPendingModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#C5A059]/50 shadow-2xl overflow-hidden p-5 sm:p-7 text-[#1A1918] dark:text-[#FAF8F5]">
            {/* Linha Dourada de Topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5A059] via-[#DFBE76] to-[#C5A059]" />

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setShowPendingModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#78716C] hover:text-[#1A1918] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
              title="Fechar aviso"
              aria-label="Fechar aviso"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Pop-up */}
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="w-11 h-11 rounded-none bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5A059] block mb-0.5">
                  Atendimento VIP Leidy Boutique
                </span>
                <h3 className="font-serif-luxury text-lg sm:text-xl font-bold leading-tight text-[#1A1918] dark:text-[#FAF8F5]">
                  Falta pouco para garantir suas peças!
                </h3>
              </div>
            </div>

            {/* Card com Itens Pendentes (exatamente o que está no controle de finalização) */}
            <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-none mb-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Falta apenas preencher no site:</span>
              </div>
              <ul className="text-xs space-y-1.5 text-[#57534E] dark:text-[#D6D3D1]">
                {!isDadosDone && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Seus Dados:</strong> Nome e WhatsApp para contato</span>
                  </li>
                )}
                {!isEnderecoDone && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Endereço de Entrega:</strong> Rua, número ou CEP para envio</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Mensagem Persuasiva de Rapidez */}
            <div className="space-y-2.5 text-xs text-[#57534E] dark:text-[#D6D3D1] leading-relaxed mb-6">
              <p>
                As compras são finalizadas com <strong>muito mais agilidade</strong> e <strong>reserva imediata</strong> quando os dados já vão preenchidos pelo site:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 bg-white dark:bg-[#201D1B] border border-[#C5A059]/20 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <span><strong>3x Mais Rápido:</strong> A Leidy já recebe sua ficha completa sem você precisar digitar endereço no chat.</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-[#201D1B] border border-[#C5A059]/20 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span><strong>Cálculo Exato:</strong> Frete e descontos (PIX/Cupom) chegam 100% calculados e garantidos.</span>
                </div>
              </div>
              <p className="text-[11px] italic text-[#78716C] dark:text-[#A8A29E] pt-1">
                Deseja preencher rapidinho agora ou prefere ir para o WhatsApp sem finalizar aqui no site e passar essas informações manualmente na conversa com a Leidy?
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2.5 pt-1 border-t border-[#C5A059]/20">
              {/* Botão 1: Preencher no site (Recomendado & Persuasivo) */}
              <button
                type="button"
                onClick={handleCompleteOnSite}
                className="w-full py-3.5 px-5 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#DFBE76] dark:text-white" />
                <span>PREENCHER AGORA NO SITE (MUITO MAIS RÁPIDO)</span>
              </button>

              {/* Botão 2: Continuar no WhatsApp mesmo assim (Não impede o cliente!) */}
              <button
                type="button"
                onClick={() => proceedToWhatsApp(true)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-[#FAF8F5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer underline underline-offset-4"
              >
                <span>Continuar para o WhatsApp mesmo assim e passar os dados lá</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
