'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { getAdminDashboardStats, DashboardStats } from '@/lib/admin';
import { CustomerOrder } from '@/lib/orders';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entregue':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Entregue
          </span>
        );
      case 'enviado':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" /> Enviado (Rastreio)
          </span>
        );
      case 'em_separacao':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/30 flex items-center gap-1 w-fit">
            <Package className="w-3 h-3" /> Em Separação
          </span>
        );
      case 'pago':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Pago
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Aguardando WhatsApp
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO BOAS-VINDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Visão Geral do E-commerce
            </h1>
            <span className="text-[10px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-2 py-0.5 font-bold uppercase tracking-wider">
              Ao Vivo
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Métricas em tempo real sincronizadas diretamente com o banco de dados Supabase da Leidy Boutique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/admin/pedidos"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ver Pedidos</span>
          </Link>
        </div>
      </div>

      {/* CARDS DE KPI (MÉTRICAS PRINCIPAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Total */}
        <div className="bg-[#1A1918] border border-[#C5A059]/25 p-5 relative overflow-hidden group hover:border-[#DFBE76]/50 transition-colors">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-none bg-[#DFBE76]/10 text-[#DFBE76] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? 'Carregando...' : formatCurrency(stats?.faturamentoTotal || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Base de pedidos da loja oficial</span>
          </div>
        </div>

        {/* Card 2: Total de Pedidos */}
        <div className="bg-[#1A1918] border border-[#C5A059]/25 p-5 relative overflow-hidden group hover:border-[#DFBE76]/50 transition-colors">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Volume de Pedidos</span>
            <div className="w-8 h-8 rounded-none bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : stats?.totalPedidos || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#A8A29E] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{stats?.pedidosPendentes || 0} pendentes / aguardando</span>
          </div>
        </div>

        {/* Card 3: Leads & Clientes */}
        <div className="bg-[#1A1918] border border-[#C5A059]/25 p-5 relative overflow-hidden group hover:border-[#DFBE76]/50 transition-colors">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Leads & Compradores</span>
            <div className="w-8 h-8 rounded-none bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : stats?.totalLeads || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Capturados via WhatsApp Checkout</span>
          </div>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="bg-[#1A1918] border border-[#C5A059]/25 p-5 relative overflow-hidden group hover:border-[#DFBE76]/50 transition-colors">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Ticket Médio por Venda</span>
            <div className="w-8 h-8 rounded-none bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : formatCurrency(stats?.ticketMedio || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#A8A29E]">
            Média por transação confirmada
          </div>
        </div>
      </div>

      {/* GRID INTERMEDIÁRIO: FUNIL DE STATUS + ATALHOS SAAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status dos Pedidos (Funil) */}
        <div className="lg:col-span-2 bg-[#1A1918] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#DFBE76]" />
              <span>Status Operacional das Entregas</span>
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs text-[#DFBE76] hover:underline flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 bg-black/30 border border-amber-500/20">
              <span className="text-[11px] text-amber-300 uppercase tracking-wider block font-semibold">
                Aguardando WhatsApp
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {stats?.pedidosPendentes || 0}
              </span>
              <span className="text-[10px] text-[#78716C]">Aguardando comprovante</span>
            </div>

            <div className="p-4 bg-black/30 border border-indigo-500/20">
              <span className="text-[11px] text-indigo-300 uppercase tracking-wider block font-semibold">
                Em Rota (Enviados)
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {stats?.pedidosEnviados || 0}
              </span>
              <span className="text-[10px] text-[#78716C]">Com código de rastreio</span>
            </div>

            <div className="p-4 bg-black/30 border border-emerald-500/20 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-emerald-300 uppercase tracking-wider block font-semibold">
                Entregues
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                {stats?.pedidosEntregues || 0}
              </span>
              <span className="text-[10px] text-[#78716C]">Ciclo finalizado</span>
            </div>
          </div>
        </div>

        {/* Card SaaS & Módulos */}
        <div className="bg-[#1A1918] border border-[#C5A059]/25 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#DFBE76] font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Plataforma White-Label</span>
            </div>
            <h3 className="font-serif-luxury text-lg text-white font-bold mt-1">
              Recursos & Módulos
            </h3>
            <p className="text-xs text-[#A8A29E] mt-2 leading-relaxed">
              Ative ou desative ferramentas de logística dos Correios, disparos automáticos via WhatsApp e recuperação de carrinho na Loja de Módulos.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/modulos"
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-[#DFBE76]/20 border border-[#DFBE76]/40 text-[#DFBE76] font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Configurar Módulos da Loja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* TABELA DE PEDIDOS RECENTES */}
      <div className="bg-[#1A1918] border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-serif-luxury text-base font-bold text-white tracking-wide">
              Últimos Pedidos Recebidos
            </h2>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              Pedidos realizados no checkout e salvos em tempo real na nuvem.
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs text-[#DFBE76] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Ver Todos os Pedidos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#A8A29E]">
            Carregando pedidos recentes...
          </div>
        ) : !stats?.pedidosRecentes || stats.pedidosRecentes.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <ShoppingBag className="w-8 h-8 text-[#78716C] mx-auto opacity-40" />
            <p className="text-xs text-[#A8A29E]">Nenhum pedido registrado até o momento.</p>
            <Link
              href="/"
              target="_blank"
              className="inline-block text-xs text-[#DFBE76] underline"
            >
              Realizar um pedido de teste na loja
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-white/5 text-[#A8A29E] uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
                {stats.pedidosRecentes.map((order) => {
                  const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
                  const formattedDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#DFBE76]">
                        {order.numero_pedido}
                        <span className="block text-[10px] text-[#78716C] font-sans">
                          {formattedDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {order.cliente_nome || 'Cliente Anônimo'}
                      </td>
                      <td className="py-3.5 px-4 text-[#A8A29E]">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá ${order.cliente_nome}! Aqui é da Leidy Boutique referente ao seu pedido ${order.numero_pedido}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{order.cliente_telefone}</span>
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {formatCurrency(Number(order.total || 0))}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/admin/pedidos"
                          className="inline-flex items-center gap-1 text-[11px] text-[#DFBE76] hover:text-white transition-colors font-semibold"
                        >
                          <span>Gerenciar</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
