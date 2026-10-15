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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  getAdminOrders,
  updateAdminOrderStatusWithStock,
  updateAdminOrderTracking
} from '@/lib/admin';
import { CustomerOrder } from '@/lib/orders';
import { DEMO_ADMIN_ORDERS } from '@/lib/mock-admin-data';
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
      // Mescla pedidos reais com os pedidos de exemplo para demonstração rica
      if (data && data.length > 2) {
        setOrders(data);
      } else {
        // Se houver pedido no Supabase, coloca no topo e completa com a simulação
        const combined = [...(data || []), ...DEMO_ADMIN_ORDERS];
        // Remove duplicatas por numero_pedido
        const unique = combined.filter((v, i, a) => a.findIndex((t) => t.numero_pedido === v.numero_pedido) === i);
        setOrders(unique);
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setOrders(DEMO_ADMIN_ORDERS);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
            <Truck className="w-3 h-3 text-indigo-600" /> Enviado
          </span>
        );
      case 'em_separacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
            <Package className="w-3 h-3 text-sky-600" /> Em Separação
          </span>
        );
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pago
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> Aguardando WhatsApp
          </span>
        );
    }
  };

  // Filtro
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'todos' && o.status !== statusFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNum = o.numero_pedido?.toLowerCase().includes(term);
      const matchName = o.cliente_nome?.toLowerCase().includes(term);
      const matchPhone = o.cliente_telefone?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      return matchNum || matchName || matchPhone;
    }

    return true;
  });

  // Salvar Status com Baixa de Estoque
  const handleSaveStatus = async () => {
    if (!statusModalOrder || !selectedNewStatus) return;
    setIsUpdatingStatus(true);

    const res = await updateAdminOrderStatusWithStock(statusModalOrder.id, selectedNewStatus, DEFAULT_TENANT_ID);
    if (res.success) {
      showToast(`Status do pedido ${statusModalOrder.numero_pedido} atualizado para "${selectedNewStatus}"!`);
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
    <div className="space-y-6">
      {/* TOAST */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-500'
              : 'bg-rose-900 text-rose-100 border border-rose-500'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Central de Pedidos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {filteredOrders.length} Encontrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie o ciclo completo de vendas, despache mercadorias, envie rastreios dos Correios e contate clientes no WhatsApp com 1 clique.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Atualizar Pedidos</span>
        </button>
      </div>

      {/* BARRA DE PESQUISA E FILTROS DE STATUS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do pedido (#LB-2026-XXXX), nome da cliente ou telefone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Abas de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos os Pedidos' },
            { id: 'pago', label: 'Pagos' },
            { id: 'em_separacao', label: 'Em Separação' },
            { id: 'enviado', label: 'Enviados (Correios)' },
            { id: 'entregue', label: 'Entregues' },
            { id: 'pendente', label: 'Aguardando WhatsApp' },
            { id: 'cancelado', label: 'Cancelados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-amber-400 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DOS PEDIDOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Consultando base de pedidos no Supabase...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Nenhum pedido encontrado</p>
          <p className="text-xs">Tente remover o filtro de busca ou conferir o status selecionado.</p>
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
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-amber-400 transition-all"
              >
                {/* Linha Resumo do Pedido */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div>
                      <span className="font-mono text-sm font-extrabold text-amber-800 tracking-wide block">
                        #{order.numero_pedido}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {order.cliente_nome || 'Cliente'}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {order.cliente_telefone || '-'}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatCurrency(Number(order.total || 0))}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {order.metodo_pagamento === 'pix' ? 'PIX Instantâneo' : 'Cartão de Crédito'}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-slate-200" />

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-2">
                    {/* Botão de WhatsApp Rápido */}
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                          `Olá ${order.cliente_nome}! Aqui é da Leidy Boutique referente ao seu pedido #${order.numero_pedido}. Como podemos te ajudar?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
                        title="Abrir WhatsApp com mensagem rápida"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    {/* Botão Alterar Status */}
                    <button
                      onClick={() => {
                        setStatusModalOrder(order);
                        setSelectedNewStatus(order.status);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Status</span>
                    </button>

                    {/* Botão Expandir Detalhes */}
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                      title={isExpanded ? 'Recolher detalhes' : 'Ver itens e entrega'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Área Expandida (Detalhes dos Itens, Entrega e Rastreio) */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Coluna 1: Peças Compradas */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Peças no Pedido ({items.length})
                        </span>
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200"
                            >
                              <div className="relative w-12 h-14 bg-slate-100 rounded overflow-hidden shrink-0">
                                {item.imagem_url ? (
                                  <Image
                                    src={item.imagem_url}
                                    alt={item.nome_produto}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                    Peça
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-900 block truncate">
                                  {item.nome_produto}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Tam: <strong className="text-slate-700">{item.tamanho}</strong> &bull; Cor: <strong className="text-slate-700">{item.cor}</strong> &bull; Qtd: <strong className="text-slate-700">{item.quantidade}x</strong>
                                </span>
                              </div>
                              <span className="text-xs font-extrabold text-slate-900">
                                {formatCurrency(item.preco_unitario * item.quantidade)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coluna 2: Dados de Entrega e Rastreio */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Endereço de Envio & Logística
                        </span>

                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-800">
                                {order.endereco_entrega?.logradouro}, {order.endereco_entrega?.numero}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {order.endereco_entrega?.bairro} &bull; {order.endereco_entrega?.cidade} - {order.endereco_entrega?.uf || 'BR'}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500">
                                CEP: {order.endereco_entrega?.cep}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Rastreamento Correios */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Código de Rastreio (Correios / Melhor Envio)
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {order.codigo_rastreio || 'Ainda não informado'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setTrackingModalOrder(order);
                              setTrackingInput(order.codigo_rastreio || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            {order.codigo_rastreio ? 'Alterar Código' : '+ Adicionar Rastreio'}
                          </button>
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

      {/* MODAL ALTERAR STATUS */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Atualizar Pedido #{statusModalOrder.numero_pedido}
              </h3>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o novo status da venda. Se você marcar como <strong>&ldquo;Pago&rdquo;</strong>, o sistema dará baixa automática nas peças no estoque.
            </p>

            <div className="space-y-2">
              {[
                { id: 'pendente', label: 'Aguardando WhatsApp' },
                { id: 'pago', label: 'Pago (Confirmação Automática de Estoque)' },
                { id: 'em_separacao', label: 'Em Separação no Provador/Estoque' },
                { id: 'enviado', label: 'Enviado aos Correios / Transportadora' },
                { id: 'entregue', label: 'Entregue com Sucesso' },
                { id: 'cancelado', label: 'Cancelado (Estorno de Estoque Automático)' }
              ].map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedNewStatus === s.id
                      ? 'border-amber-500 bg-amber-50/50 font-bold text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={selectedNewStatus === s.id}
                    onChange={() => setSelectedNewStatus(s.id as CustomerOrder['status'])}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {isUpdatingStatus ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CÓDIGO DE RASTREIO */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Rastreamento Correios #{trackingModalOrder.numero_pedido}
              </h3>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Código de Rastreamento (ex: QD123456789BR)
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Insira o código dos Correios..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTracking}
                disabled={isUpdatingTracking}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                {isUpdatingTracking ? 'Salvando...' : 'Salvar Código & Marcar Enviado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
