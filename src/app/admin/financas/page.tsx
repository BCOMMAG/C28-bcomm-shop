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
  ArrowRight,
  ArrowUpRight,
  Download,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { getAdminFinanceMetrics, FinanceMetrics } from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { exportFinanceDREToCsv } from '@/lib/export';
import { useStore } from '@/context/StoreContext';

export default function AdminFinancasPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | 'mes' | 'tudo'>('tudo');

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const data = await getAdminFinanceMetrics(tenantId, periodo);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao buscar métricas financeiras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, [tenantId, periodo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  // Métricas 100% reais do banco de dados (sem suposição ou mock)
  const faturamento = metrics?.faturamentoBruto || 0;
  const cmv = metrics?.cmvTotal || 0;
  const despesas = metrics?.despesasOperacionais || 0;
  const lucroLiquido = metrics?.lucroLiquido || 0;
  const margemPercent = metrics?.margemLiquidaPercent || 0;
  const pedidosFaturados = metrics?.totalPedidosFaturados || 0;
  const pecasVendidas = metrics?.totalPecasVendidas || 0;
  const ticketMedio = metrics?.ticketMedio || 0;
  const topProdutosList = metrics?.topProdutos || [];

  const periodoLabel =
    periodo === 'hoje'
      ? 'Hoje'
      : periodo === '7dias'
      ? 'Últimos 7 Dias'
      : periodo === 'mes'
      ? 'Este Mês'
      : 'Histórico Completo';

  const handleExportCsv = () => {
    exportFinanceDREToCsv({
      periodoNome: periodoLabel,
      faturamentoBruto: faturamento,
      cmvTotal: cmv,
      lucroBruto: faturamento - cmv,
      despesasOperacionais: despesas,
      lucroLiquido: lucroLiquido,
      margemPercent: margemPercent,
      pedidosFaturados: pedidosFaturados,
      pecasVendidas: pecasVendidas,
      ticketMedio: ticketMedio,
      topProdutos: topProdutosList
    });
  };

  const handlePrintDRE = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO OFICIAL DE IMPRESSÃO (Visível apenas ao imprimir ou salvar em PDF) */}
      <div className="hidden print:block pb-6 mb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif-luxury text-slate-900">
              DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE GERENCIAL) &bull; {lojaNome.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Período de Apuração: <strong>{periodoLabel}</strong> &bull; Emissão: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">
            Documento Contábil Oficial
          </span>
        </div>
      </div>

      {/* CABEÇALHO NA TELA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Financeiro & Lucro Real (DRE)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              DRE Ao Vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Demonstrativo financeiro completo: Faturamento Bruto, Custo das Peças (CMV), Taxas de Cartão, Embalagens e o Lucro Líquido Real que sobra no caixa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs shadow-2xs">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 Dias' },
              { id: 'mes', label: 'Este Mês' },
              { id: 'tudo', label: 'Todo o Período' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  periodo === p.id
                    ? 'bg-slate-900 text-amber-400 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Baixar planilha DRE em formato CSV compatível com Excel"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {/* Botão Imprimir / Salvar PDF */}
          <button
            onClick={handlePrintDRE}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            title="Imprimir relatório DRE oficial ou salvar em PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir DRE</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            onClick={fetchFinance}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* CARDS DE KPI FINANCEIROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif-luxury block">
              {loading ? '...' : formatCurrency(faturamento)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {pedidosFaturados} pedidos faturados
          </span>
        </div>

        {/* Card 2: Custo das Mercadorias (CMV) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Custo das Peças (CMV)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif-luxury block">
              {loading ? '...' : formatCurrency(cmv)}
            </span>
          </div>
          <span className="text-[11px] text-rose-700 font-semibold mt-2 block">
            {pecasVendidas} peças saídas do estoque
          </span>
        </div>

        {/* Card 3: Despesas Operacionais */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Despesas Operacionais</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif-luxury block">
              {loading ? '...' : formatCurrency(despesas)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Taxas ({metrics?.taxaCartaoPadrao || 3.5}%) + Embalagens (R$ 8/cx)
          </span>
        </div>

        {/* Card 4: Lucro Líquido Real */}
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
            <span>Lucro Líquido Real</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-serif-luxury block">
              {loading ? '...' : formatCurrency(lucroLiquido)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-800 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Margem Líquida Real: {margemPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* DEMONSTRATIVO DO RESULTADO (DRE VISUAL E EXECUTIVO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif-luxury">
              Demonstrativo de Resultado do Exercício (DRE)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Entenda exatamente a composição de cada real recebido nas vendas da Leidy Boutique.
            </p>
          </div>
          <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-mono font-bold">
            Ticket Médio: {formatCurrency(ticketMedio)}
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Linha 1: Receita */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-600">(+)</span>
              <span className="text-slate-900 font-bold">Receita Operacional Bruta (Vendas)</span>
            </div>
            <span className="font-extrabold font-mono text-slate-900">
              {formatCurrency(faturamento)}
            </span>
          </div>

          {/* Linha 2: CMV */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-600">(-)</span>
              <span className="text-slate-700 font-medium">Custo das Mercadorias Vendidas (CMV das Peças)</span>
            </div>
            <span className="font-mono font-semibold text-rose-700">
              - {formatCurrency(cmv)}
            </span>
          </div>

          {/* Subtotal: Lucro Bruto */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 font-bold">
            <div className="flex items-center gap-2">
              <span className="text-amber-800">(=)</span>
              <span className="text-amber-900">Lucro Bruto Operacional</span>
            </div>
            <span className="font-mono text-amber-900">
              {formatCurrency(Math.max(0, faturamento - cmv))}
            </span>
          </div>

          {/* Linha 3: Taxas de Gateway */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-600">(-)</span>
              <span className="text-slate-700 font-medium">Taxas de Intermediação & Cartão ({metrics?.taxaCartaoPadrao || 3.5}%)</span>
            </div>
            <span className="font-mono font-semibold text-rose-700">
              - {formatCurrency((faturamento * (metrics?.taxaCartaoPadrao || 3.5)) / 100)}
            </span>
          </div>

          {/* Linha 4: Embalagens */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-600">(-)</span>
              <span className="text-slate-700 font-medium">Embalagens de Luxo, Sacolas & Mimos ({formatCurrency(metrics?.custoEmbalagemPadrao || 8)}/pedido)</span>
            </div>
            <span className="font-mono font-semibold text-rose-700">
              - {formatCurrency(pedidosFaturados * (metrics?.custoEmbalagemPadrao || 8))}
            </span>
          </div>

          {/* TOTAL FINAL: LUCRO LÍQUIDO */}
          <div className="flex items-center justify-between p-4 bg-emerald-100/70 border-2 border-emerald-500 rounded-xl font-extrabold text-sm sm:text-base text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700">(=)</span>
              <span>LUCRO LÍQUIDO REAL DO PERÍODO</span>
            </div>
            <div className="text-right">
              <span className="font-mono block text-emerald-900">
                {formatCurrency(lucroLiquido)}
              </span>
              <span className="text-xs text-emerald-700 font-sans block">
                Margem Líquida Real: {margemPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CURVA ABC: TOP PEÇAS MAIS LUCRATIVAS */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-serif-luxury">
            Curva de Lucratividade: Peças que Mais Geram Caixa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranking de produtos ordenados pelo lucro líquido gerado após dedução do custo da peça.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Peça de Luxo</th>
                <th className="py-3 px-4 text-center">Qtd Vendida</th>
                <th className="py-3 px-4 text-right">Faturamento</th>
                <th className="py-3 px-4 text-right">Lucro Estimado</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {topProdutosList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma venda registrada no período selecionado ({periodoLabel}).
                  </td>
                </tr>
              ) : (
                topProdutosList.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{prod.nome}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {prod.quantidadeVendida} un
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">
                      {formatCurrency(prod.faturamento)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                      {formatCurrency(prod.lucro)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Alta Margem
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
