'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
  Copy,
  Edit3,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  updateAdminOrderStatusWithStock,
  updateAdminOrderTracking
} from '@/lib/admin';
import { CustomerOrder } from '@/lib/orders';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal de Alteração de Status
  const [statusModalOrder, setStatusModalOrder] = useState<CustomerOrder | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<CustomerOrder['status']>('pendente');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal de Código de Rastreio
  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  // Notificação Toast
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders(DEFAULT_TENANT_ID);
      setOrders(data);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entregue':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Entregue
          </span>
        );
      case 'enviado':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 w-fit">
            <Truck className="w-3.5 h-3.5" /> Enviado aos Correios
          </span>
        );
      case 'em_separacao':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-sky-950/70 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 w-fit">
            <Package className="w-3.5 h-3.5" /> Em Separação
          </span>
        );
      case 'pago':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pago
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-950/70 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" /> Aguardando WhatsApp
          </span>
        );
    }
  };

  // Filtragem dos pedidos
  const filteredOrders = orders.filter((o) => {
    // Filtro por status
    if (statusFilter !== 'todos') {
      if (statusFilter === 'pendente') {
        if (o.status !== 'pendente' && o.status !== 'aguardando_whatsapp') return false;
      } else if (o.status !== statusFilter) {
        return false;
      }
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNum = o.numero_pedido?.toLowerCase().includes(term);
      const matchName = o.cliente_nome?.toLowerCase().includes(term);
      const matchPhone = o.cliente_telefone?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      return matchNum || matchName || matchPhone;
    }

    return true;
  });

  // Salvar Status com Baixa/Devolução Inteligente de Estoque
  const handleSaveStatus = async () => {
    if (!statusModalOrder || !selectedNewStatus) return;
    setIsUpdatingStatus(true);

    const res = await updateAdminOrderStatusWithStock(statusModalOrder.id, selectedNewStatus, DEFAULT_TENANT_ID);
    if (res.success) {
      showToast(`Status do pedido ${statusModalOrder.numero_pedido} atualizado para "${selectedNewStatus}" com controle de estoque!`);
      // Atualiza estado local
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === statusModalOrder.id ? { ...ord, status: selectedNewStatus } : ord
        )
      );
      setStatusModalOrder(null);
    } else {
      showToast(res.error || 'Erro ao alterar status.', 'error');
    }
    setIsUpdatingStatus(false);
  };

  // Salvar Rastreio
  const handleSaveTracking = async () => {
    if (!trackingModalOrder) return;
    setIsUpdatingTracking(true);

    const code = trackingInput.trim().toUpperCase();
    const res = await updateAdminOrderTracking(trackingModalOrder.id, code);

    if (res.success) {
      showToast(`Código de rastreio ${code} registrado e pedido marcado como Enviado!`);
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === trackingModalOrder.id
            ? {
                ...ord,
                codigo_rastreio: code || undefined,
                status: code ? 'enviado' : 'em_separacao'
              }
            : ord
        )
      );
      setTrackingModalOrder(null);
    } else {
      showToast(res.error || 'Erro ao salvar código de rastreamento.', 'error');
    }
    setIsUpdatingTracking(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOAST FLUTUANTE */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl animate-fade-in ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Central de Pedidos
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            Gerencie o ciclo completo de vendas, despache mercadorias e atualize o rastreio dos Correios.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
          <span>Sincronizar Pedidos</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="space-y-4">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do pedido (#LB-2026-XXXX), nome do cliente ou WhatsApp..."
            className="w-full bg-[#1A1918] border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
          />
        </div>

        {/* Abas de Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos os Pedidos' },
            { id: 'pendente', label: 'Aguardando WhatsApp' },
            { id: 'pago', label: 'Pagos' },
            { id: 'em_separacao', label: 'Em Separação' },
            { id: 'enviado', label: 'Enviados (Correios)' },
            { id: 'entregue', label: 'Entregues' },
            { id: 'cancelado', label: 'Cancelados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black shadow-md'
                  : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DOS PEDIDOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#DFBE76] mx-auto mb-2" />
          <span>Consultando base de pedidos no Supabase...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5 space-y-2">
          <ShoppingBag className="w-8 h-8 text-[#78716C] mx-auto opacity-30" />
          <p className="text-sm font-semibold text-white">Nenhum pedido encontrado</p>
          <p className="text-[11px]">
            {searchTerm
              ? 'Tente remover o filtro de busca ou conferir o termo digitado.'
              : 'Novos pedidos feitos no checkout aparecerão aqui automaticamente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
            const items = order.itens_pedido || [];

            return (
              <div
                key={order.id}
                className="bg-[#1A1918] border border-white/10 overflow-hidden transition-all hover:border-[#C5A059]/40"
              >
                {/* Linha Resumo do Pedido */}
                <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div>
                      <span className="font-mono text-sm font-bold text-[#DFBE76] tracking-wider block">
                        {order.numero_pedido}
                      </span>
                      <span className="text-[10px] text-[#78716C] block mt-0.5">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {order.cliente_nome || 'Cliente'}
                      </span>
                      <span className="text-[11px] text-[#A8A29E] block">
                        {order.cliente_telefone || '-'}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#78716C] block">
                        Total
                      </span>
                      <span className="text-sm font-bold font-serif-luxury text-white">
                        {formatCurrency(Number(order.total || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Status & Botões de Ação */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div>{getStatusBadge(order.status)}</div>

                    {/* Botão Alterar Status */}
                    <button
                      onClick={() => {
                        setStatusModalOrder(order);
                        setSelectedNewStatus(order.status);
                      }}
                      className="px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#DFBE76]" />
                      <span>Alterar Status</span>
                    </button>

                    {/* Botão Rastreio */}
                    <button
                      onClick={() => {
                        setTrackingModalOrder(order);
                        setTrackingInput(order.codigo_rastreio || '');
                      }}
                      className="px-2.5 py-1.5 text-xs bg-[#DFBE76]/10 hover:bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>
                        {order.codigo_rastreio ? 'Ver/Alterar Rastreio' : '+ Adicionar Rastreio'}
                      </span>
                    </button>

                    {/* Botão WhatsApp */}
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                          `Olá ${order.cliente_nome}! Aqui é da Leidy Boutique referente ao seu pedido ${order.numero_pedido}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    {/* Botão Expandir Detalhes */}
                    <button
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      className="p-1.5 text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
                      aria-label="Expandir detalhes do pedido"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* PAINEL EXPANSÍVEL: ITENS + ENDEREÇO + RASTREIO */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-4 sm:p-6 space-y-6 animate-fade-in">
                    {/* Código de Rastreamento (se houver) */}
                    {order.codigo_rastreio && (
                      <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs text-indigo-200">
                            Código de Rastreio dos Correios:
                          </span>
                          <span className="font-mono font-bold text-white text-xs tracking-wider bg-black/40 px-2 py-0.5 border border-indigo-500/20">
                            {order.codigo_rastreio}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(order.codigo_rastreio!)}
                            className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 px-2 py-1 bg-white/5"
                          >
                            <Copy className="w-3 h-3" /> Copiar
                          </button>
                          <a
                            href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.codigo_rastreio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#DFBE76] hover:underline flex items-center gap-1"
                          >
                            <span>Rastrear nos Correios</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Itens do Pedido */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFBE76] mb-3 flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Peças do Pedido ({items.length})</span>
                        </h3>

                        {items.length === 0 ? (
                          <p className="text-xs text-[#78716C]">Nenhum item listado.</p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  {item.imagem_url ? (
                                    <div className="relative w-10 h-12 bg-black shrink-0 overflow-hidden">
                                      <Image
                                        src={item.imagem_url}
                                        alt={item.nome_produto}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-12 bg-white/10 flex items-center justify-center text-[10px] text-[#78716C]">
                                      Foto
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-white block">
                                      {item.nome_produto}
                                    </span>
                                    <span className="text-[11px] text-[#A8A29E]">
                                      Tam: <strong>{item.tamanho}</strong> • Cor: {item.cor} • Qtd: {item.quantidade}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-white block">
                                    {formatCurrency(Number(item.preco_unitario || 0) * item.quantidade)}
                                  </span>
                                  <span className="text-[10px] text-[#78716C]">
                                    {formatCurrency(Number(item.preco_unitario || 0))} un
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dados de Entrega e Financeiro */}
                      <div className="space-y-4">
                        {/* Endereço */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFBE76] mb-2 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Endereço de Entrega</span>
                          </h3>
                          <div className="p-3 bg-white/5 border border-white/5 text-xs text-[#FAF8F5] leading-relaxed">
                            <p>
                              {order.endereco_entrega?.logradouro || 'Rua não informada'}, {order.endereco_entrega?.numero || 'S/N'}{' '}
                              {order.endereco_entrega?.complemento ? `(${order.endereco_entrega.complemento})` : ''}
                            </p>
                            <p className="text-[#A8A29E]">
                              {order.endereco_entrega?.bairro || 'Bairro'} - {order.endereco_entrega?.cidade || 'Cidade'} /{' '}
                              {order.endereco_entrega?.uf || 'UF'}
                            </p>
                            <p className="text-[#DFBE76] font-mono mt-1">
                              CEP: {order.endereco_entrega?.cep || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Resumo Financeiro */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFBE76] mb-2 flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Resumo de Valores</span>
                          </h3>
                          <div className="p-3 bg-white/5 border border-white/5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-[#A8A29E]">
                              <span>Subtotal das Peças:</span>
                              <span className="text-white">
                                {formatCurrency(Number(order.subtotal || 0))}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#A8A29E]">
                              <span>Frete:</span>
                              <span className="text-white">
                                {Number(order.valor_frete || 0) > 0
                                  ? formatCurrency(Number(order.valor_frete))
                                  : 'Grátis'}
                              </span>
                            </div>
                            <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-white">
                              <span>Total do Pedido:</span>
                              <span className="text-[#DFBE76] font-serif-luxury text-sm">
                                {formatCurrency(Number(order.total || 0))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações de Comunicação Rápida via WhatsApp */}
                        <div className="pt-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DFBE76] mb-2 flex items-center gap-2">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Disparos de WhatsApp em 1 Clique</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {cleanPhone ? (
                              <>
                                <a
                                  href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                    `Olá ${order.cliente_nome}! Aqui é da Leidy Boutique. Confirmamos o pagamento do seu pedido ${order.numero_pedido}! Suas peças já estão sendo carinhosamente preparadas para envio!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirmar Pagamento</span>
                                </a>

                                <a
                                  href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                    order.codigo_rastreio
                                      ? `Olá ${order.cliente_nome}! Seu pedido ${order.numero_pedido} já foi postado! Segue seu código de rastreio: ${order.codigo_rastreio}. Acompanhe aqui: https://melhorrastreio.com.br/rastreio/${order.codigo_rastreio}`
                                      : `Olá ${order.cliente_nome}! Seu pedido ${order.numero_pedido} já foi postado nos Correios e em breve te enviamos o código de rastreamento!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Enviar Rastreio</span>
                                </a>

                                <a
                                  href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                    `Olá ${order.cliente_nome}! Tudo bem? Vimos que seu pedido ${order.numero_pedido} foi entregue! Suas peças serviram certinho? O que achou do caimento no corpo? Estamos à sua total disposição!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-[#DFBE76]/10 hover:bg-[#DFBE76]/20 border border-[#DFBE76]/30 text-[#DFBE76] text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Pós-Venda Carinhoso</span>
                                </a>
                              </>
                            ) : (
                              <p className="text-[11px] text-[#78716C] col-span-3">Telefone não informado neste pedido.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ALTERAR STATUS */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Atualizar Status do Pedido
                </h3>
                <span className="font-mono text-xs text-[#DFBE76]">
                  {statusModalOrder.numero_pedido}
                </span>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="text-[#78716C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold block">
                Selecione o novo status:
              </label>
              {[
                { val: 'aguardando_whatsapp' as const, label: 'Aguardando WhatsApp / Contato' },
                { val: 'pago' as const, label: 'Pago (Comprovante Confirmado)' },
                { val: 'em_separacao' as const, label: 'Em Separação no Estoque' },
                { val: 'enviado' as const, label: 'Enviado aos Correios (Em Trânsito)' },
                { val: 'entregue' as const, label: 'Entregue ao Cliente' },
                { val: 'cancelado' as const, label: 'Cancelado' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelectedNewStatus(opt.val)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors border ${
                    selectedNewStatus === opt.val
                      ? 'bg-[#DFBE76]/20 border-[#DFBE76] text-white font-bold'
                      : 'bg-white/5 border-white/5 text-[#A8A29E] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 text-xs text-[#A8A29E] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CÓDIGO DE RASTREIO */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#DFBE76]" />
                <div>
                  <h3 className="font-serif-luxury text-base font-bold text-white">
                    Código de Rastreamento
                  </h3>
                  <span className="font-mono text-xs text-[#DFBE76]">
                    {trackingModalOrder.numero_pedido} • {trackingModalOrder.cliente_nome}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-[#78716C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold block">
                Código dos Correios (ex: QB123456789BR)
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="QB123456789BR"
                className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#DFBE76] uppercase tracking-wider"
              />
              <p className="text-[11px] text-[#78716C]">
                Ao salvar, o status do pedido mudará automaticamente para <strong>Enviado</strong> e a cliente poderá rastrear pela área <em>Minha Conta</em>.
              </p>
            </div>

            {/* Ação rápida de envio de mensagem no WhatsApp com o código */}
            {trackingInput.trim() && trackingModalOrder.cliente_telefone && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <MessageCircle className="w-4 h-4" />
                  <span>Avisar Cliente no WhatsApp:</span>
                </div>
                <a
                  href={`https://wa.me/55${trackingModalOrder.cliente_telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${trackingModalOrder.cliente_nome}! Seu pedido ${trackingModalOrder.numero_pedido} na Leidy Boutique foi despachado! 🎉\n\nCódigo de Rastreio dos Correios: ${trackingInput.trim().toUpperCase()}\n\nAcompanhe o seu pacote em tempo real aqui: https://rastreamento.correios.com.br/app/index.php?codigo=${trackingInput.trim().toUpperCase()}\n\nQualquer dúvida estamos à disposição!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Rastreio pelo WhatsApp</span>
                </a>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 text-xs text-[#A8A29E] hover:text-white cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSaveTracking}
                disabled={isUpdatingTracking}
                className="px-4 py-2 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingTracking ? 'Salvando...' : 'Salvar Código'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
