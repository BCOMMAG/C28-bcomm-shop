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
  ChevronUp,
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
import {
  fetchAddressByCep,
  calculateShippingOptions,
  formatCep,
  ShippingOption,
  ViaCepResponse
} from '@/utils/shipping';

export type CheckoutStep = 'sacola' | 'endereco' | 'dados' | 'pagamento';

const CHECKOUT_STEPS: {
  id: CheckoutStep;
  number: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'sacola', number: 1, label: 'Sacola & Frete', shortLabel: 'Sacola', icon: ShoppingBag },
  { id: 'endereco', number: 2, label: 'Endereço de Entrega', shortLabel: 'Endereço', icon: MapPin },
  { id: 'dados', number: 3, label: 'Dados Pessoais', shortLabel: 'Identificação', icon: User },
  { id: 'pagamento', number: 4, label: 'Pagamento & Envio', shortLabel: 'Pagamento', icon: CreditCard },
];

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

  // Etapa ativa na trilha de finalização
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('sacola');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

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
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('sedex');
  const [filledByCep, setFilledByCep] = useState<{ [key: string]: boolean }>({});

  // 3. Pagamento e Cupom
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'whatsapp'>('pix');
  const [cardInstallments, setCardInstallments] = useState<number>(1);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // 4. Estados de Finalização e Validação
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPendingModal, setShowPendingModal] = useState(false);

  const PIX_KEY = '5549999999999';

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

  // Carrega dados salvos do cliente
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
  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = rawSubtotal >= STORE_INFO.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, STORE_INFO.freeShippingThreshold - rawSubtotal);
  const progressToFreeShipping = Math.min(100, (rawSubtotal / STORE_INFO.freeShippingThreshold) * 100);

  // Atualiza opções de frete quando o estado ou subtotal mudam
  useEffect(() => {
    if (uf) {
      const opts = calculateShippingOptions(uf, rawSubtotal);
      setShippingOptions(opts);
      if (opts.length > 0 && !opts.find((o) => o.id === selectedShippingId)) {
        setSelectedShippingId(opts[0].id);
      }
    }
  }, [uf, rawSubtotal]);

  const chosenShippingOption = shippingOptions.find((o) => o.id === selectedShippingId);
  const shippingPrice = isFreeShipping
    ? 0
    : chosenShippingOption
    ? chosenShippingOption.price
    : 0;

  const couponDiscount = appliedCoupon ? (rawSubtotal * appliedCoupon.percent) / 100 : 0;
  const subtotalAfterCoupon = Math.max(0, rawSubtotal - couponDiscount);
  const pixDiscount = paymentMethod === 'pix' ? (subtotalAfterCoupon * 0.05) : 0;
  const totalAmount = Math.max(0, subtotalAfterCoupon + shippingPrice - pixDiscount);

  // Captura de Leads Local
  const captureLead = (phoneToSave: string, clientName: string, status: 'iniciado' | 'finalizado' = 'iniciado') => {
    if (typeof window === 'undefined') return;
    try {
      const cleanPhone = (phoneToSave || customerPhone).replace(/\D/g, '');
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

  // Busca CEP via ViaCEP
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

  // Navegação suave entre as etapas
  const stepOrder: CheckoutStep[] = ['sacola', 'endereco', 'dados', 'pagamento'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const goToStep = (step: CheckoutStep) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 80, behavior: 'smooth' });
    }
  };

  const isStepCompleted = (step: CheckoutStep) => {
    if (step === 'sacola') return cartCount > 0;
    if (step === 'endereco') return isEnderecoDone;
    if (step === 'dados') return isDadosDone;
    if (step === 'pagamento') return isPagamentoDone;
    return false;
  };

  const handleNextFromSacola = () => {
    if (cepInput && (!street || !city)) {
      handleSearchCep();
    }
    goToStep('endereco');
  };

  const handleNextFromEndereco = () => {
    if (!number.trim()) {
      setFormErrors((prev) => ({ ...prev, number: 'Por favor, informe o número da residência.' }));
    }
    goToStep('dados');
  };

  const handleNextFromDados = () => {
    if (!customerName.trim()) {
      setFormErrors((prev) => ({ ...prev, name: 'Informe seu nome completo.' }));
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormErrors((prev) => ({ ...prev, phone: 'Informe seu WhatsApp com DDD.' }));
    }
    captureLead(customerPhone, customerName, 'iniciado');
    goToStep('pagamento');
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
    if (!isEnderecoDone) {
      goToStep('endereco');
    } else if (!isDadosDone) {
      goToStep('dados');
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

  // Copia chave PIX
  const handleCopyPixKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(PIX_KEY);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

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
      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        
        {/* CASO A SACOLA ESTEJA VAZIA */}
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
              className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] transition-colors text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer"
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

          /* 4. TELA PRINCIPAL: CHECKOUT EM ETAPAS (FASEADA E INTUITIVA) */
          <div className="space-y-6">
            
            {/* ========================================================================= */}
            {/* TRILHA DE FINALIZAÇÃO (PROGRESS TRACK / STEPPER LUXUOSO)                  */}
            {/* ========================================================================= */}
            <div className="bg-white dark:bg-[#1A1918] border border-[#C5A059]/35 shadow-xs p-3.5 sm:p-5">
              
              {/* VISÃO DESKTOP DA TRILHA (Horizontal com Linhas e Títulos) */}
              <div className="hidden sm:flex items-center justify-between relative">
                {/* Linha Conectora de Fundo */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-[#E7E5E4] dark:bg-[#292524] z-0" />
                
                {/* Linha Conectora de Progresso Concluído */}
                <div
                  className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#C5A059] to-[#DFBE76] z-0 transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (CHECKOUT_STEPS.length - 1)) * 100}%`
                  }}
                />

                {CHECKOUT_STEPS.map((step, idx) => {
                  const isActive = step.id === currentStep;
                  const isDone = idx < currentStepIndex || isStepCompleted(step.id);
                  const canClick = idx <= currentStepIndex || isStepCompleted(step.id);
                  const Icon = step.icon;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => canClick && goToStep(step.id)}
                      disabled={!canClick}
                      className={`relative z-10 flex flex-col items-center gap-1.5 transition-all text-center group ${
                        canClick ? 'cursor-pointer' : 'cursor-default opacity-60'
                      }`}
                    >
                      {/* Círculo do Ícone / Número */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                          isActive
                            ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white border-[#C5A059] shadow-md scale-110'
                            : isDone
                            ? 'bg-[#22C55E] text-white border-[#22C55E]'
                            : 'bg-white dark:bg-[#201D1B] text-[#78716C] dark:text-[#A8A29E] border-[#C5A059]/30'
                        }`}
                      >
                        {isDone && !isActive ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      {/* Rótulo da Etapa */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-xs uppercase tracking-wider font-bold transition-colors ${
                            isActive
                              ? 'text-[#C5A059] dark:text-[#DFBE76]'
                              : isDone
                              ? 'text-[#1A1918] dark:text-[#FAF8F5]'
                              : 'text-[#78716C] dark:text-[#A8A29E]'
                          }`}
                        >
                          {step.number}. {step.label}
                        </span>
                        <span className="text-[10px] text-[#A8A29E] dark:text-[#78716C]">
                          {isActive ? 'Em Edição' : isDone ? 'Concluído' : 'Aguardando'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* VISÃO MOBILE DA TRILHA (Compacta com Barra e Indicador de Passo) */}
              <div className="sm:hidden space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1A1918] dark:bg-[#C5A059] text-white text-[11px] font-bold flex items-center justify-center">
                      {currentStepIndex + 1}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block">
                        Passo {currentStepIndex + 1} de 4
                      </span>
                      <h3 className="font-serif-luxury text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] leading-tight">
                        {CHECKOUT_STEPS[currentStepIndex].label}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#C5A059]">
                    {Math.round(((currentStepIndex + 1) / CHECKOUT_STEPS.length) * 100)}%
                  </span>
                </div>

                {/* Barra de Progresso Fina */}
                <div className="w-full bg-[#E7E5E4] dark:bg-[#292524] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C5A059] via-[#DFBE76] to-[#C5A059] transition-all duration-300"
                    style={{
                      width: `${((currentStepIndex + 1) / CHECKOUT_STEPS.length) * 100}%`
                    }}
                  />
                </div>

                {/* Pílulas de Navegação Rápida no Mobile */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {CHECKOUT_STEPS.map((s, idx) => {
                    const isCur = s.id === currentStep;
                    const isFin = idx < currentStepIndex || isStepCompleted(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => (idx <= currentStepIndex || isFin) && goToStep(s.id)}
                        disabled={idx > currentStepIndex && !isFin}
                        className={`flex-1 py-1 px-1 text-[10px] uppercase font-bold tracking-wider text-center border transition-all ${
                          isCur
                            ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white border-transparent'
                            : isFin
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-transparent text-[#78716C] dark:text-[#A8A29E] border-transparent opacity-50'
                        }`}
                      >
                        {s.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* MINI-RESUMO RETRÁTIL NO MOBILE (Permite espiar o total a qualquer momento) */}
            <div className="lg:hidden bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 shadow-xs p-3">
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                    Resumo do Pedido ({cartCount} {cartCount === 1 ? 'peça' : 'peças'})
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                      mobileSummaryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-[#78716C]">Total:</span>
                  <span className="text-sm font-bold text-[#C5A059] dark:text-[#DFBE76]">
                    R$ {totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </button>

              {mobileSummaryOpen && (
                <div className="pt-3 mt-3 border-t border-[#C5A059]/20 space-y-2 text-xs animate-fadeIn">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 py-1 border-b border-black/5 dark:border-white/5 last:border-0">
                        <span className="text-[11px] text-[#1A1918] dark:text-[#FAF8F5] truncate max-w-[180px]">
                          {item.quantity}x {item.name} ({item.color} - {item.size})
                        </span>
                        <span className="text-[11px] font-bold text-[#C5A059]">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-dashed border-[#C5A059]/20 space-y-1 text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {rawSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envio:</span>
                      <span>{isFreeShipping ? 'Grátis (VIP)' : `R$ ${shippingPrice.toFixed(2).replace('.', ',')}`}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Cupom ({appliedCoupon?.code}):</span>
                        <span>-R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    {pixDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Desconto PIX (5%):</span>
                        <span>-R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* GRID PRINCIPAL: ETAPA ATIVA (ESQUERDA) + RESUMO FIXO (DIREITA)            */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* ============================================================ */}
              {/* COLUNA ESQUERDA: CONTEÚDO DA ETAPA ATUAL (7 Colunas no Desk) */}
              {/* ============================================================ */}
              <div className="lg:col-span-7 space-y-6">

                {/* ------------------------------------------------------------ */}
                {/* ETAPA 1: SACOLA & CÁLCULO DE FRETE                           */}
                {/* ------------------------------------------------------------ */}
                {currentStep === 'sacola' && (
                  <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/35 shadow-xs space-y-6 animate-fadeIn">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] block mb-0.5">
                          Etapa 1 de 4
                        </span>
                        <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          Confira Suas Peças & Simule o Frete
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1">
                        {cartCount} {cartCount === 1 ? 'peça' : 'peças'}
                      </span>
                    </div>

                    {/* Barra de Progresso de Frete Cortesia VIP */}
                    <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        {remainingForFreeShipping > 0 ? (
                          <span className="text-[11px] text-[#57534E] dark:text-[#D6D3D1]">
                            Faltam <strong>R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</strong> na sacola para ganhar <strong>Frete Cortesia VIP</strong>!
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#25D366] font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#DFBE76]" />
                            Parabéns! Sua sacola atingiu Frete Cortesia VIP Grátis!
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#C5A059] dark:text-[#DFBE76]">
                          {Math.round(progressToFreeShipping)}%
                        </span>
                      </div>
                      <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-none overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C5A059] via-[#DFBE76] to-[#C5A059] transition-all duration-500"
                          style={{ width: `${progressToFreeShipping}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista das Peças da Sacola */}
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3.5 sm:gap-4 p-3 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/20"
                        >
                          <div className="relative w-14 h-18 sm:w-16 sm:h-20 bg-white dark:bg-black/20 shrink-0 border border-[#C5A059]/20 overflow-hidden">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover object-top" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif-luxury font-bold text-xs sm:text-sm text-[#1A1918] dark:text-[#FAF8F5] truncate mb-0.5">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mb-2">
                              Cor: <strong>{item.color}</strong> | Tam: <strong>{item.size}</strong>
                            </p>
                            <span className="text-xs sm:text-sm font-bold text-[#C5A059] dark:text-[#DFBE76]">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          {/* Ajuste de Quantidade e Excluir */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <div className="flex items-center border border-[#C5A059]/40 bg-white dark:bg-[#1A1918]">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="px-2 py-1 text-xs font-bold hover:bg-[#C5A059] hover:text-white transition-colors"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 text-xs font-bold min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="px-2 py-1 text-xs font-bold hover:bg-[#C5A059] hover:text-white transition-colors"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                              title="Remover peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cálculo do Frete na Etapa 1 */}
                    <div className="p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                        <Truck className="w-4 h-4" />
                        <span>Calcular Frete com Seu CEP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cepInput}
                          onChange={(e) => setCepInput(formatCep(e.target.value))}
                          placeholder="00000-000"
                          maxLength={9}
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchCep()}
                          disabled={isCepLoading}
                          className="px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isCepLoading ? 'Buscando...' : 'Calcular'}
                        </button>
                      </div>
                      {cepError && (
                        <p className="text-[11px] text-rose-500 font-medium">{cepError}</p>
                      )}
                      {city && uf && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Destino localizado: {city}/{uf}
                        </p>
                      )}
                    </div>

                    {/* Cupom de Desconto */}
                    <div className="p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                        <Tag className="w-4 h-4" />
                        <span>Possui Cupom de Desconto?</span>
                      </div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {appliedCoupon.code} ({appliedCoupon.percent}% OFF aplicado)
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Ex: VIP10, LEIDY15"
                            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] uppercase focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Aplicar
                          </button>
                        </form>
                      )}
                      {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
                      {couponSuccess && <p className="text-[11px] text-emerald-600">{couponSuccess}</p>}
                    </div>

                    {/* Botão de Avanço para a Etapa 2 */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleNextFromSacola}
                        className="w-full py-4 px-6 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] font-bold text-xs sm:text-sm uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>CONTINUAR PARA ENDEREÇO DE ENTREGA</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* ETAPA 2: ENDEREÇO DE ENTREGA                                 */}
                {/* ------------------------------------------------------------ */}
                {currentStep === 'endereco' && (
                  <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/35 shadow-xs space-y-6 animate-fadeIn">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] block mb-0.5">
                          Etapa 2 de 4
                        </span>
                        <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          Onde Vamos Entregar Seu Pedido?
                        </h2>
                      </div>
                      <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                        Envio Seguro Brasil
                      </span>
                    </div>

                    {/* Busca Rápida de CEP */}
                    <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                          CEP para Entrega *
                        </label>
                        <a
                          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#C5A059] hover:underline"
                        >
                          Não sei meu CEP
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cepInput}
                          onChange={(e) => setCepInput(formatCep(e.target.value))}
                          placeholder="00000-000"
                          maxLength={9}
                          className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-[#141312] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchCep()}
                          disabled={isCepLoading}
                          className="px-4 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isCepLoading ? 'Buscando...' : 'Buscar CEP'}
                        </button>
                      </div>
                      {cepError && <p className="text-[11px] text-rose-500 font-medium">{cepError}</p>}
                    </div>

                    {/* Formulário de Endereço */}
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Rua / Logradouro *
                          </label>
                          {!street.trim() && <span className="text-[10px] text-rose-500">* Obrigatório</span>}
                        </div>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Ex: Av. Paulista ou Rua das Flores"
                          className={getFieldClass(Boolean(filledByCep.street), true, street, Boolean(formErrors.street))}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                              Número *
                            </label>
                            {!number.trim() && <span className="text-[10px] text-rose-500">* Obrigatório</span>}
                          </div>
                          <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Ex: 1250"
                            className={getFieldClass(false, true, number, Boolean(formErrors.number))}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                            Complemento (Opcional)
                          </label>
                          <input
                            type="text"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            placeholder="Apto 42, Bloco B, Casa"
                            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#201D1B] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                            Bairro *
                          </label>
                          <input
                            type="text"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            placeholder="Ex: Jardins"
                            className={getFieldClass(Boolean(filledByCep.neighborhood), true, neighborhood)}
                          />
                        </div>

                        <div>
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ex: São Paulo"
                            className={getFieldClass(Boolean(filledByCep.city), true, city, Boolean(formErrors.city))}
                          />
                        </div>

                        <div>
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                            Estado (UF) *
                          </label>
                          <input
                            type="text"
                            value={uf}
                            onChange={(e) => setUf(e.target.value.toUpperCase())}
                            maxLength={2}
                            placeholder="SP"
                            className={getFieldClass(Boolean(filledByCep.uf), true, uf, Boolean(formErrors.uf))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seleção da Modalidade de Frete */}
                    {shippingOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                          Modalidade de Entrega:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {shippingOptions.map((opt) => (
                            <label
                              key={opt.id}
                              className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${
                                selectedShippingId === opt.id
                                  ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xs'
                                  : 'bg-white dark:bg-[#201D1B] border-[#C5A059]/25 hover:border-[#C5A059]/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="shippingOption"
                                  checked={selectedShippingId === opt.id}
                                  onChange={() => setSelectedShippingId(opt.id)}
                                  className="accent-[#C5A059]"
                                />
                                <div>
                                  <span className="text-xs font-bold block text-[#1A1918] dark:text-[#FAF8F5]">
                                    {opt.name}
                                  </span>
                                  <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">
                                    {opt.deliveryDays}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#C5A059] dark:text-[#DFBE76]">
                                {isFreeShipping ? 'Grátis' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botões de Navegação */}
                    <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => goToStep('sacola')}
                        className="w-full sm:w-auto py-3.5 px-6 border border-[#C5A059]/40 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-[#1A1918] dark:text-[#FAF8F5]"
                      >
                        ← Voltar para Sacola
                      </button>
                      <button
                        type="button"
                        onClick={handleNextFromEndereco}
                        className="w-full sm:flex-1 py-4 px-6 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>CONTINUAR PARA SEUS DADOS</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* ETAPA 3: SEUS DADOS PESSOAIS (IDENTIFICAÇÃO)                 */}
                {/* ------------------------------------------------------------ */}
                {currentStep === 'dados' && (
                  <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/35 shadow-xs space-y-6 animate-fadeIn">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] block mb-0.5">
                          Etapa 3 de 4
                        </span>
                        <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          Identificação VIP Para Atendimento
                        </h2>
                      </div>
                      <span className="text-xs text-[#22C55E] font-bold bg-[#22C55E]/10 px-2 py-0.5">
                        Atendimento VIP
                      </span>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs text-[#57534E] dark:text-[#D6D3D1] leading-relaxed flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                      <span>
                        Seus dados são usados com total privacidade para a Leidy confirmar a reserva imediata das peças e enviar o código de rastreio da encomenda.
                      </span>
                    </div>

                    {/* Formulário de Identificação */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1]">
                            Nome Completo *
                          </label>
                          {!customerName.trim() && <span className="text-[10px] text-rose-500">* Obrigatório</span>}
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
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(formatPhone(e.target.value));
                            if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: '' }));
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
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

                        <div>
                          <label className="font-semibold mb-1 block text-[#57534E] dark:text-[#D6D3D1]">
                            CPF (Opcional - Nota Fiscal)
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

                    {/* Botões de Navegação */}
                    <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => goToStep('endereco')}
                        className="w-full sm:w-auto py-3.5 px-6 border border-[#C5A059]/40 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-[#1A1918] dark:text-[#FAF8F5]"
                      >
                        ← Voltar para Endereço
                      </button>
                      <button
                        type="button"
                        onClick={handleNextFromDados}
                        className="w-full sm:flex-1 py-4 px-6 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>CONTINUAR PARA PAGAMENTO</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* ETAPA 4: PAGAMENTO & FINALIZAÇÃO                             */}
                {/* ------------------------------------------------------------ */}
                {currentStep === 'pagamento' && (
                  <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-7 border border-[#C5A059]/35 shadow-xs space-y-6 animate-fadeIn">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A059] block mb-0.5">
                          Etapa 4 de 4
                        </span>
                        <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          Forma de Pagamento & Conclusão
                        </h2>
                      </div>
                      <span className="text-xs text-[#22C55E] font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> 100% Protegido
                      </span>
                    </div>

                    {/* Seleção do Método de Pagamento */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                        Escolha como deseja pagar:
                      </span>

                      {/* Opção PIX (Com 5% OFF) */}
                      <label
                        className={`p-4 border flex items-start gap-3.5 cursor-pointer transition-all ${
                          paymentMethod === 'pix'
                            ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xs'
                            : 'bg-white dark:bg-[#201D1B] border-[#C5A059]/25 hover:border-[#C5A059]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pix"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className="accent-[#C5A059] mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs sm:text-sm text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-1.5">
                              <QrCode className="w-4 h-4 text-[#22C55E]" />
                              PIX Instantâneo
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5">
                              5% DE DESCONTO
                            </span>
                          </div>
                          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                            Aprovação imediata. O código QR e a chave serão gerados logo após a confirmação.
                          </p>
                        </div>
                      </label>

                      {/* Opção Cartão de Crédito */}
                      <label
                        className={`p-4 border flex items-start gap-3.5 cursor-pointer transition-all ${
                          paymentMethod === 'credit_card'
                            ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xs'
                            : 'bg-white dark:bg-[#201D1B] border-[#C5A059]/25 hover:border-[#C5A059]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit_card"
                          checked={paymentMethod === 'credit_card'}
                          onChange={() => setPaymentMethod('credit_card')}
                          className="accent-[#C5A059] mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs sm:text-sm text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-[#C5A059]" />
                              Cartão de Crédito
                            </span>
                            <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5">
                              ATÉ 6X SEM JUROS
                            </span>
                          </div>
                          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed mb-3">
                            A Leidy enviará o link de pagamento blindado para parcelamento no cartão.
                          </p>

                          {/* Seletor de Parcelas */}
                          {paymentMethod === 'credit_card' && (
                            <div className="pt-2 border-t border-[#C5A059]/20">
                              <label className="text-[11px] font-semibold block mb-1 text-[#57534E] dark:text-[#D6D3D1]">
                                Escolha o número de parcelas:
                              </label>
                              <select
                                value={cardInstallments}
                                onChange={(e) => setCardInstallments(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                              >
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                  <option key={n} value={n}>
                                    {n}x de R$ {(totalAmount / n).toFixed(2).replace('.', ',')} sem juros
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Opção WhatsApp Direto */}
                      <label
                        className={`p-4 border flex items-start gap-3.5 cursor-pointer transition-all ${
                          paymentMethod === 'whatsapp'
                            ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xs'
                            : 'bg-white dark:bg-[#201D1B] border-[#C5A059]/25 hover:border-[#C5A059]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="whatsapp"
                          checked={paymentMethod === 'whatsapp'}
                          onChange={() => setPaymentMethod('whatsapp')}
                          className="accent-[#C5A059] mt-1"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-xs sm:text-sm text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-1.5 mb-1">
                            <MessageCircle className="w-4 h-4 text-[#25D366]" />
                            Combinar Pagamento no WhatsApp
                          </span>
                          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                            A consultora Leidy te orienta sobre a melhor forma na conversa.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Observações do Pedido */}
                    <div className="p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 space-y-1.5 text-xs">
                      <label className="font-semibold text-[#57534E] dark:text-[#D6D3D1] block">
                        Observações Especiais (Opcional):
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Ex: Embalar para presente, ponto de referência..."
                        rows={2}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1918] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                      />
                    </div>

                    {/* Revisão Consolidada Antes do Envio */}
                    <div className="p-4 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/40 space-y-2 text-xs">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#C5A059] block">
                        Resumo da Finalização:
                      </span>
                      <div className="space-y-1 text-[#57534E] dark:text-[#D6D3D1]">
                        <p>👤 <strong>Cliente:</strong> {customerName || 'A confirmar'} ({customerPhone || 'A confirmar'})</p>
                        <p>📍 <strong>Entrega:</strong> {street ? `${street}, nº ${number || 'S/N'} (${city}/${uf})` : 'A combinar no WhatsApp'}</p>
                        <p>💳 <strong>Pagamento:</strong> {paymentMethod === 'pix' ? 'PIX com 5% de desconto' : paymentMethod === 'credit_card' ? `Cartão em ${cardInstallments}x` : 'WhatsApp'}</p>
                      </div>
                    </div>

                    {/* Botão Principal de Conversão */}
                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        onClick={() => handleFinalizeOrder()}
                        className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm uppercase tracking-[0.18em] shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                        <span>FINALIZAR COMPRA NO WHATSAPP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => goToStep('dados')}
                        className="w-full py-2.5 text-center block text-xs text-[#78716C] dark:text-[#A8A29E] hover:text-[#C5A059] font-medium transition-colors"
                      >
                        ← Voltar e Revisar Meus Dados
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* ============================================================ */}
              {/* COLUNA DIREITA: RESUMO DINÂMICO FIXO (5 Colunas no Desktop)  */}
              {/* ============================================================ */}
              <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-4">
                <div className="bg-white dark:bg-[#1A1918] p-5 sm:p-6 border border-[#C5A059]/35 shadow-xs space-y-5">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[#C5A059]/20">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                      <h3 className="font-serif-luxury text-base font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                        Resumo da Sacola
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[#C5A059]">
                      {cartCount} {cartCount === 1 ? 'peça' : 'peças'}
                    </span>
                  </div>

                  {/* Lista de Peças em Miniatura */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-[#C5A059]/10 last:border-0">
                        <div className="relative w-11 h-14 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/20 shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#C5A059]">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">
                            {item.quantity}x • {item.color} • {item.size}
                          </p>
                          <p className="text-xs font-bold text-[#C5A059]">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Linhas de Valores Financeiros */}
                  <div className="pt-3 border-t border-[#C5A059]/15 space-y-2 text-xs">
                    <div className="flex justify-between text-[#78716C] dark:text-[#A8A29E]">
                      <span>Subtotal das peças:</span>
                      <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        R$ {rawSubtotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#78716C] dark:text-[#A8A29E]">
                      <span>Envio:</span>
                      <span className="font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                        {isFreeShipping ? (
                          <span className="text-[#25D366] font-bold">Grátis (VIP)</span>
                        ) : shippingPrice > 0 ? (
                          `R$ ${shippingPrice.toFixed(2).replace('.', ',')}`
                        ) : (
                          'A calcular pelo CEP'
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Cupom ({appliedCoupon.code}):</span>
                        <span>-R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    {pixDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Desconto PIX (5%):</span>
                        <span>-R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-[#C5A059]/30 text-base font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                      <span>Total Previsto:</span>
                      <span className="text-lg text-[#C5A059] dark:text-[#DFBE76]">
                        R$ {totalAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Ação Rápida no Resumo */}
                  {currentStep !== 'pagamento' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 'sacola') handleNextFromSacola();
                        else if (currentStep === 'endereco') handleNextFromEndereco();
                        else if (currentStep === 'dados') handleNextFromDados();
                      }}
                      className="w-full py-3.5 px-4 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs uppercase tracking-widest font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Avançar Etapa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFinalizeOrder()}
                      className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white stroke-[#25D366]" />
                      <span>Finalizar no WhatsApp</span>
                    </button>
                  )}

                  {/* Selos de Confiança */}
                  <div className="pt-3 border-t border-[#C5A059]/15 grid grid-cols-2 gap-2 text-[10px] text-[#78716C] dark:text-[#A8A29E]">
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

            </div>

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
