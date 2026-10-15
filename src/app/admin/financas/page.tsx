'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { getAdminFinanceMetrics, FinanceMetrics } from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminFinancasPage() {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | 'mes' | 'tudo'>('tudo');

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const data = await getAdminFinanceMetrics(DEFAULT_TENANT_ID, periodo);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao buscar métricas financeiras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, [periodo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Financeiro & Lucro Real (DRE)
            </h1>
            <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-bold uppercase tracking-wider">
              Ao Vivo
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Demonstrativo financeiro completo: Faturamento Bruto, Custo de Aquisição (CMV), Taxas, Embalagens e o Lucro Líquido Real que sobra no caixa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Período */}
          <div className="flex items-center bg-[#1A1918] border border-white/10 p-1 text-xs">
            <button
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                periodo === 'hoje'
                  ? 'bg-[#DFBE76] text-black'
                  : 'text-[#A8A29E] hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodo('7dias')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                periodo === '7dias'
                  ? 'bg-[#DFBE76] text-black'
                  : 'text-[#A8A29E] hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                periodo === 'mes'
                  ? 'bg-[#DFBE76] text-black'
                  : 'text-[#A8A29E] hover:text-white'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriodo('tudo')}
              className={`px-3 py-1 font-semibold transition-colors cursor-pointer ${
                periodo === 'tudo'
                  ? 'bg-[#DFBE76] text-black'
                  : 'text-[#A8A29E] hover:text-white'
              }`}
            >
              Todo o Período
            </button>
          </div>

          <button
            onClick={fetchFinance}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* CARDS DE KPI FINANCEIROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-[#1A1918] border border-[#C5A059]/30 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Faturamento Bruto</span>
            <div className="w-8 h-8 bg-[#DFBE76]/10 text-[#DFBE76] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : formatCurrency(metrics?.faturamentoBruto || 0)}
            </span>
          </div>
          <span className="text-[11px] text-[#A8A29E] mt-2 block">
            {metrics?.totalPedidosFaturados || 0} pedidos confirmados
          </span>
        </div>

        {/* Card 2: Custo das Mercadorias (CMV) */}
        <div className="bg-[#1A1918] border border-white/10 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Custo das Peças (CMV)</span>
            <div className="w-8 h-8 bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : formatCurrency(metrics?.cmvTotal || 0)}
            </span>
          </div>
          <span className="text-[11px] text-rose-300 mt-2 block">
            {metrics?.totalPecasVendidas || 0} peças saídas do estoque
          </span>
        </div>

        {/* Card 3: Despesas Operacionais */}
        <div className="bg-[#1A1918] border border-white/10 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#A8A29E] text-xs">
            <span>Despesas Operacionais</span>
            <div className="w-8 h-8 bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-white">
              {loading ? '...' : formatCurrency(metrics?.despesasOperacionais || 0)}
            </span>
          </div>
          <span className="text-[11px] text-[#A8A29E] mt-2 block">
            Taxas ({metrics?.taxaCartaoPadrao || 3.5}%) + Embalagens ({formatCurrency(metrics?.custoEmbalagemPadrao || 8)}/cx)
          </span>
        </div>

        {/* Card 4: Lucro Líquido Real */}
        <div className="bg-gradient-to-br from-[#1A1918] to-[#121110] border-2 border-[#DFBE76] p-5 relative overflow-hidden shadow-lg shadow-[#DFBE76]/10">
          <div className="flex items-center justify-between text-[#DFBE76] text-xs font-bold uppercase tracking-wider">
            <span>Lucro Líquido Real</span>
            <div className="w-8 h-8 bg-[#DFBE76] text-black font-bold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif-luxury text-emerald-400">
              {loading ? '...' : formatCurrency(metrics?.lucroLiquido || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#DFBE76] flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Margem Líquida: {metrics?.margemLiquidaPercent.toFixed(1) || 0}%</span>
          </div>
        </div>
      </div>

      {/* DEMONSTRATIVO DO RESULTADO (DRE VISUAL E EXECUTIVO) */}
      <div className="bg-[#1A1918] border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-white tracking-wide">
              Demonstrativo de Resultado do Exercício (DRE)
            </h2>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              Entenda exatamente a composição de cada real recebido nas vendas.
            </p>
          </div>
          <span className="text-xs text-[#DFBE76] font-mono font-semibold">
            Ticket Médio: {formatCurrency(metrics?.ticketMedio || 0)}
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Linha 1 */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">(+)</span>
              <span className="text-white font-medium">Receita Operacional Bruta (Vendas)</span>
            </div>
            <span className="font-bold font-mono text-white">
              {formatCurrency(metrics?.faturamentoBruto || 0)}
            </span>
          </div>

          {/* Linha 2 */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-400">(-)</span>
              <span className="text-slate-300">Custo das Mercadorias Vendidas (CMV de Peças)</span>
            </div>
            <span className="font-mono text-rose-300">
              - {formatCurrency(metrics?.cmvTotal || 0)}
            </span>
          </div>

          {/* Subtotal: Lucro Bruto */}
          <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-[#DFBE76]">(=)</span>
              <span className="text-white">Lucro Bruto Operacional</span>
            </div>
            <span className="font-mono text-[#DFBE76]">
              {formatCurrency(Math.max(0, (metrics?.faturamentoBruto || 0) - (metrics?.cmvTotal || 0)))}
            </span>
          </div>

          {/* Linha 3 */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">(-)</span>
              <span className="text-slate-300">Taxas de Meio de Pagamento (Cartão/PIX ~{metrics?.taxaCartaoPadrao}%)</span>
            </div>
            <span className="font-mono text-amber-300">
              - {formatCurrency(((metrics?.faturamentoBruto || 0) * (metrics?.taxaCartaoPadrao || 3.5)) / 100)}
            </span>
          </div>

          {/* Linha 4 */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">(-)</span>
              <span className="text-slate-300">Embalagens Personalizadas de Luxo ({formatCurrency(metrics?.custoEmbalagemPadrao || 8)} por caixa)</span>
            </div>
            <span className="font-mono text-amber-300">
              - {formatCurrency((metrics?.totalPedidosFaturados || 0) * (metrics?.custoEmbalagemPadrao || 8))}
            </span>
          </div>

          {/* Resultado Final */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950/60 to-black border border-emerald-500/40 text-sm sm:text-base font-bold">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>(=) LUCRO LÍQUIDO REAL NO CAIXA</span>
            </div>
            <span className="font-mono text-emerald-300 font-serif-luxury text-lg">
              {formatCurrency(metrics?.lucroLiquido || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* CURVA ABC / PEÇAS MAIS LUCRATIVAS */}
      <div className="bg-[#1A1918] border border-white/10 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="font-serif-luxury text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#DFBE76]" />
            <span>Peças Mais Lucrativas (Curva ABC da Boutique)</span>
          </h2>
          <span className="text-xs text-[#A8A29E]">Ranking por lucro líquido gerado</span>
        </div>

        {!metrics?.topProdutos || metrics.topProdutos.length === 0 ? (
          <p className="text-xs text-[#78716C] py-6 text-center">
            Aguardando primeiras vendas faturadas para gerar a curva ABC de lucratividade.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {metrics.topProdutos.map((prod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-[#DFBE76]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#DFBE76]/20 text-[#DFBE76] font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-white block">{prod.nome}</span>
                    <span className="text-[11px] text-[#A8A29E]">
                      {prod.quantidadeVendida} unidades vendidas
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400 font-mono block">
                    + {formatCurrency(prod.lucro)} lucro
                  </span>
                  <span className="text-[10px] text-[#78716C]">
                    Faturamento: {formatCurrency(prod.faturamento)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
