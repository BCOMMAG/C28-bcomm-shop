'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Store,
  DollarSign,
  ShoppingBag,
  Users,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import {
  getSuperAdminStats,
  toggleStoreStatus,
  SuperAdminStats,
  StoreTenant
} from '@/lib/super-admin';

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getSuperAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar métricas globais:', err);
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

  const handleToggleStore = async (store: StoreTenant) => {
    const nextState = !store.ativo;
    const res = await toggleStoreStatus(store.id, nextState);
    if (res.success) {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              ultimasLojas: prev.ultimasLojas.map((l) =>
                l.id === store.id ? { ...l, ativo: nextState } : l
              ),
              lojasAtivas: nextState ? prev.lojasAtivas + 1 : prev.lojasAtivas - 1
            }
          : prev
      );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO SUPER ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Visão Global da Plataforma
            </h1>
            <span className="text-[10px] bg-sky-950 text-[#38BDF8] border border-sky-800 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              BCOMM SaaS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle centralizado de todas as lojas, tráfego de pedidos e faturamento consolidado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38BDF8]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/super-admin/nova-loja/"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Provisionar Loja (60s)</span>
          </Link>
        </div>
      </div>

      {/* MÉTRICAS GLOBAIS DA REDE (Cards Clicáveis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Global */}
        <Link
          href="/super-admin/lojas/"
          className="bg-[#11141E] border border-slate-800 p-5 rounded-xl relative overflow-hidden group hover:border-sky-500/50 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>GMV Global (Faturamento da Rede)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? 'Carregando...' : formatCurrency(stats?.faturamentoGlobal || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Ver detalhes das lojas</span>
          </div>
        </Link>

        {/* Card 2: Total de Lojas */}
        <Link
          href="/super-admin/lojas/"
          className="bg-[#11141E] border border-slate-800 p-5 rounded-xl relative overflow-hidden group hover:border-sky-500/50 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tenants Cadastrados</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-[#38BDF8] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : stats?.totalLojas || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{stats?.lojasAtivas || 0} operando online</span>
          </div>
        </Link>

        {/* Card 3: Pedidos Globais */}
        <Link
          href="/super-admin/lojas/"
          className="bg-[#11141E] border border-slate-800 p-5 rounded-xl relative overflow-hidden group hover:border-sky-500/50 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Volume Global de Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : stats?.totalPedidosGlobal || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Ver transações das lojas</span>
          </div>
        </Link>

        {/* Card 4: Base de Leads da Plataforma */}
        <Link
          href="/super-admin/nova-loja/"
          className="bg-[#11141E] border border-slate-800 p-5 rounded-xl relative overflow-hidden group hover:border-sky-500/50 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>+ Novo Lojista / Lead</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-[#38BDF8]">
              Criar Loja (60s)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-300 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Onboarding expresso para vendas</span>
          </div>
        </Link>
      </div>

      {/* STATUS DA INFRAESTRUTURA SAAS */}
      <div className="bg-gradient-to-r from-[#11141E] via-[#161B28] to-[#11141E] border border-slate-800 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
              <Server className="w-4 h-4" />
              <span>Infraestrutura em Operação (Fase 1: Custo R$ 0,00)</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Cloudflare Pages + Supabase PostgreSQL Multi-Tenant
            </h3>
            <p className="text-xs text-slate-400">
              Arquitetura de banco único particionado por Row-Level Security (`loja_id`) com resolução dinâmica de domínio por Middleware.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
              <span className="text-slate-400 block text-[10px]">Custo Mensal</span>
              <span className="font-bold text-emerald-400 font-mono">R$ 0,00</span>
            </div>
            <div className="px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
              <span className="text-slate-400 block text-[10px]">Segurança RLS</span>
              <span className="font-bold text-sky-400">Ativa & Isolada</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE TENANTS ATIVOS */}
      <div className="bg-[#11141E] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Lojas Cadastradas na Plataforma
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada loja possui seu catálogo, configurações e banco isolado logicamente.
            </p>
          </div>
          <Link
            href="/super-admin/lojas/"
            className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Gerenciar Todas as Lojas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Carregando lojas da rede...
          </div>
        ) : !stats?.ultimasLojas || stats.ultimasLojas.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Store className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
            <p className="text-xs text-slate-400">Nenhuma loja encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Loja / Marca</th>
                  <th className="py-3 px-4">Slug / Identificador</th>
                  <th className="py-3 px-4">WhatsApp Oficial</th>
                  <th className="py-3 px-4">Pedidos</th>
                  <th className="py-3 px-4">Faturamento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {stats.ultimasLojas.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{store.nome}</span>
                        {store.slug === 'leidy-boutique' && (
                          <span className="text-[9px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-1.5 py-0.5 rounded font-bold">
                            TENANT #1
                          </span>
                        )}
                        {store.slug === 'aura-privee' && (
                          <span className="text-[9px] bg-[#E0A99A]/20 text-[#E0A99A] border border-[#E0A99A]/40 px-1.5 py-0.5 rounded font-bold">
                            TENANT #2
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {store.dominio_proprio ? (
                        <span className="text-[#38BDF8]">{store.dominio_proprio}</span>
                      ) : (
                        <span>/{store.slug}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {store.whatsapp || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {store.total_pedidos || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(store.total_faturamento || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStore(store)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                          store.ativo
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {store.ativo ? '● Online' : '○ Pausada'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/admin/"
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800/50 rounded"
                        >
                          Painel
                        </Link>
                        <Link
                          href={store.dominio_proprio ? `https://${store.dominio_proprio}` : `/${store.slug}/`}
                          target="_blank"
                          className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1"
                        >
                          <span>Vitrine</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
