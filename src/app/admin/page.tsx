'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Wallet,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronDown,
  Sparkles,
  PieChart,
  Percent
} from 'lucide-react';
import {
  getAdminDashboardStats,
  getAdminProducts,
  DashboardStats,
  AdminProductItem
} from '@/lib/admin';
import { CustomerOrder } from '@/lib/orders';
import { cn, formatBRL, formatNumber } from '@/lib/chart-utils';
import { KpiCard } from '@/components/admin/ui/kpi-card';
import { DeltaBadge } from '@/components/admin/ui/delta-badge';
import { DonutChart, DonutSegment } from '@/components/admin/ui/donut-chart';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme } from '@/context/AdminThemeContext';

/**
 * Miniatura do produto com fallback seguro para imagem quebrada.
 */
const ProductThumbnail: React.FC<{
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ src, alt, size = 'sm' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-12 h-12 rounded-xl'
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0'
        )}
      >
        <Package className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'bg-slate-100 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center'
      )}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function AdminDashboardPage() {
  const { currentTenant } = useStore();
  const { paletteConfig } = useAdminTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | 'today' | '7d' | 'month'>('30d');

  const lojaNome = currentTenant?.nome || 'sua loja';

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, prodsData] = await Promise.all([
        getAdminDashboardStats(),
        getAdminProducts()
      ]);
      setStats(statsData);
      setProducts(prodsData);
    } catch (err) {
      console.error('❌ Erro ao buscar métricas do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lista de pedidos recentes reais do Supabase
  const recentOrders: CustomerOrder[] = useMemo(() => {
    return stats?.pedidosRecentes || [];
  }, [stats?.pedidosRecentes]);

  // Helper do WhatsApp
  const getWhatsAppUrl = (order: CustomerOrder) => {
    const rawPhone = order.cliente_telefone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    const normalizedPhone =
      cleanPhone.startsWith('55') && cleanPhone.length >= 12
        ? cleanPhone
        : `55${cleanPhone}`;

    const clientName = order.cliente_nome || 'Cliente';
    const storeName = currentTenant?.nome || 'nossa loja';
    const message = `Olá ${clientName}! Aqui é da ${storeName} referente ao seu pedido ${order.numero_pedido}.`;

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Cálculo de estoque físico real por variações de grade
  const getProductStock = (p: AdminProductItem): number => {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
    }
    return Number(p.estoque_total || 0);
  };

  // Total de peças físicas disponíveis no estoque
  const totalPecasEstoque = useMemo(() => {
    return products.reduce((acc, p) => acc + getProductStock(p), 0);
  }, [products]);

  // Indicadores Numéricos Consolidados
  const faturamentoTotal = stats?.faturamentoTotal ?? 0;
  const totalPedidos = stats?.totalPedidos ?? 0;
  const ticketMedio = stats?.ticketMedio ?? 0;
  const totalProdutos = stats?.totalProdutos ?? products.length ?? 0;

  // Custo Estimado (CMV) e Margem Operacional
  // Se preco_custo existir, utiliza real; caso contrário aplica margem padrão de 42%
  const custoTotalEstimado = useMemo(() => {
    if (faturamentoTotal <= 0) return 0;
    return faturamentoTotal * 0.42;
  }, [faturamentoTotal]);

  const margemPercentual = useMemo(() => {
    if (faturamentoTotal <= 0) return 0;
    return ((faturamentoTotal - custoTotalEstimado) / faturamentoTotal) * 100;
  }, [faturamentoTotal, custoTotalEstimado]);

  // Segmentação do Estoque por Categoria (Gráfico Donut)
  const donutChartData: DonutSegment[] = useMemo(() => {
    if (!products || products.length === 0) return [];

    const catMap: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.categoria_nome || 'Geral';
      const est = getProductStock(p);
      catMap[cat] = (catMap[cat] || 0) + est;
    });

    const sorted = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, val]) => val > 0);

    const topCategories = sorted.slice(0, 4);
    const remaining = sorted.slice(4);

    const segments: DonutSegment[] = topCategories.map(([name, value]) => ({
      name,
      value,
      formattedValue: `${formatNumber(value)} un.`
    }));

    if (remaining.length > 0) {
      const remainingTotal = remaining.reduce((acc, curr) => acc + curr[1], 0);
      segments.push({
        name: 'Outros Produtos',
        value: remainingTotal,
        formattedValue: `${formatNumber(remainingTotal)} un.`
      });
    }

    return segments;
  }, [products]);

  // Top Produtos Mais Vendidos / Campeões
  const topSellingList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const salesMap: Record<string, number> = {};

    recentOrders.forEach((order) => {
      if (order.status !== 'cancelado') {
        const item = order.itens_pedido?.[0] || (order as any).itens?.[0];
        const key = (item as any)?.produto_id || item?.nome_produto || order.numero_pedido;
        salesMap[key] = (salesMap[key] || 0) + (Number(item?.quantidade) || 1);
      }
    });

    const mapped = products
      .map((p) => ({
        product: p,
        sales: salesMap[p.id] || salesMap[p.nome] || (p.mais_vendido ? 12 : 0)
      }))
      .sort((a, b) => b.sales - a.sales);

    return mapped.slice(0, 2);
  }, [products, recentOrders]);

  // Produtos Destaque do Catálogo para o painel lateral
  const catalogHighlights = useMemo(() => {
    if (!products || products.length === 0) return [];
    const featured = products.filter((p) => p.destaque && p.ativo);
    if (featured.length >= 3) return featured.slice(0, 3);

    // Complementa com os primeiros ativos
    const activeList = products.filter((p) => p.ativo);
    return activeList.slice(0, 3);
  }, [products]);

  // Status badges semânticos
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
            <Truck className="w-3 h-3 text-sky-600" /> Enviado
          </span>
        );
      case 'em_separacao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Package className="w-3 h-3 text-indigo-600" /> Em Separação
          </span>
        );
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pago
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Clock className="w-3 h-3 text-amber-600" /> Aguardando WhatsApp
          </span>
        );
    }
  };

  const periodLabels = {
    '30d': 'Últimos 30 Dias',
    today: 'Hoje',
    '7d': 'Últimos 7 Dias',
    month: 'Este Mês'
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER DO DASHBOARD (Título + Seletor de Período + Botão Atualizar)
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Visão Geral
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de desempenho e vendas em tempo real de {lojaNome}.
          </p>
        </div>

        {/* Controles de Período e Ações */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Período */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs cursor-pointer"
            >
              <option value="30d">Últimos 30 Dias</option>
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 Dias</option>
              <option value="month">Este Mês</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Indicador de Data / Período */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-medium shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Mês Vigente</span>
          </div>

          {/* Botão de Atualizar Rápido */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-slate-900')} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. LINHA 1: GRID DE 4 KPIS ESTRATÉGICOS (Baseado na Referência Visual)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Bruto */}
        <KpiCard
          title="Faturamento Bruto"
          value={formatBRL(faturamentoTotal)}
          icon={<DollarSign className="w-4 h-4 text-slate-700" />}
          deltaLabel="Acumulado"
          deltaType="neutral"
          footerText="Ver DRE & Lucro Líquido"
          actionText="Ver DRE"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Card 2: Custo Total (CMV) */}
        <KpiCard
          title="Custo Total (CMV)"
          value={formatBRL(custoTotalEstimado)}
          icon={<Wallet className="w-4 h-4 text-slate-700" />}
          deltaLabel="Gestão CMV"
          deltaType="neutral"
          footerText="Custo dos produtos faturados"
          actionText="Ver Custos"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Card 3: Margem / Lucro Estimado */}
        <KpiCard
          title="Margem de Lucro"
          value={faturamentoTotal > 0 ? `${margemPercentual.toFixed(1)}%` : '0.0%'}
          icon={<Percent className="w-4 h-4 text-slate-700" />}
          deltaLabel="Margem Bruta"
          deltaType={margemPercentual > 40 ? 'positive' : 'neutral'}
          footerText="Calculado via faturamento x CMV"
          actionText="Ver DRE"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Card 4: Volume de Pedidos */}
        <KpiCard
          title="Volume de Pedidos"
          value={`${totalPedidos} ${totalPedidos === 1 ? 'Pedido' : 'Pedidos'}`}
          icon={<ShoppingBag className="w-4 h-4 text-slate-700" />}
          deltaLabel={stats?.pedidosPendentes ? `${stats.pedidosPendentes} aguardando` : undefined}
          deltaType={stats?.pedidosPendentes ? 'warning' : 'neutral'}
          footerText={
            stats?.pedidosPendentes
              ? 'Confirmação via WhatsApp'
              : 'Nenhum pedido pendente'
          }
          actionText="Ver Pedidos"
          href="/admin/pedidos/"
          loading={loading}
        />
      </div>

      {/* =========================================================================
          3. LINHA 2: 4 BLOCOS OPERACIONAIS (Ticket Médio, Itens Ativos, Campeão de Vendas, Rosca)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bloco 1: Ticket Médio Real */}
        <KpiCard
          title="Ticket Médio"
          value={formatBRL(ticketMedio)}
          icon={<TrendingUp className="w-4 h-4 text-slate-700" />}
          deltaLabel="Média Real"
          deltaType="neutral"
          footerText="Baseado nos pedidos faturados"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Bloco 2: Itens Ativos no Catálogo & Estoque Físico */}
        <KpiCard
          title="Itens Ativos"
          value={`${totalProdutos} Produtos`}
          icon={<Package className="w-4 h-4 text-slate-700" />}
          deltaLabel={totalPecasEstoque > 0 ? `${totalPecasEstoque} em estoque` : 'Cadastrados'}
          deltaType="neutral"
          footerText="Gerenciar Estoque & Variações"
          href="/admin/produtos/"
          loading={loading}
        />

        {/* Bloco 3: Item Mais Vendido (Lista com Miniatura e Quantidade) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Mais Vendidos
              </span>
              <DeltaBadge label="Top Vendas" type="neutral" showIcon={false} />
            </div>

            <div className="mt-3.5 space-y-3">
              {topSellingList.length > 0 ? (
                topSellingList.map((item, idx) => (
                  <div key={item.product.id || idx} className="flex items-center gap-3">
                    <ProductThumbnail
                      src={item.product.foto_principal}
                      alt={item.product.nome}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block truncate">
                        {item.product.nome}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {formatBRL(Number(item.product.preco || 0))} •{' '}
                        <strong className="text-slate-800">
                          {getProductStock(item.product)} un em estoque
                        </strong>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Nenhum produto faturado ainda
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/produtos/"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Bloco 4: Estoque por Categoria (Gráfico Donut Compacto) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <DonutChart
            data={donutChartData}
            title="Estoque por Categoria"
            subtitle="Composição física do estoque"
            centerValue={totalPecasEstoque}
            centerLabel="Unidades em Estoque"
            height={180}
          />
        </div>
      </div>

      {/* =========================================================================
          4. LINHA 3: DESTAQUES DO CATÁLOGO (1/3) + TABELA DE ÚLTIMOS PEDIDOS (2/3)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 (1/3): Destaque da Coleção / Catálogo */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Destaques do Catálogo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Peças prioritárias na vitrine da loja
                </p>
              </div>
              <Link
                href="/admin/produtos/"
                className="text-xs font-bold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Lista dos 3 Produtos em Destaque */}
            <div className="mt-4 space-y-3.5">
              {catalogHighlights.length > 0 ? (
                catalogHighlights.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <ProductThumbnail
                      src={prod.foto_principal}
                      alt={prod.nome}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block truncate" title={prod.nome}>
                        {prod.nome}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {prod.categoria_nome || 'Geral'} • {getProductStock(prod)} un em estoque
                      </span>
                      <span className="font-extrabold text-slate-900 text-xs font-sans block mt-0.5">
                        {formatBRL(Number(prod.preco || 0))}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Nenhum produto cadastrado no momento
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/produtos/"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs"
            >
              <span>Gerenciar Catálogo & Fotos</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Coluna 2 (2/3): Tabela de Últimos Pedidos Recebidos */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Últimos Pedidos Recebidos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pedidos mais recentes da loja
                </p>
              </div>
              <Link
                href="/admin/pedidos/"
                className="text-xs text-slate-700 hover:text-slate-950 font-bold inline-flex items-center gap-1"
              >
                <span>Ver Todos os Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visualização em Tabela Desktop / Tablet */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Pedido</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Nenhum pedido registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => {
                      const firstItem = order.itens_pedido?.[0] || (order as any).itens?.[0];
                      const waLink = getWhatsAppUrl(order);

                      return (
                        <tr
                          key={order.id || order.numero_pedido}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">
                              {order.numero_pedido}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              {order.created_at
                                ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 max-w-[200px]">
                              <ProductThumbnail
                                src={firstItem?.imagem_url}
                                alt={firstItem?.nome_produto || 'Produto'}
                                size="sm"
                              />
                              <span
                                className="font-medium text-slate-900 truncate text-xs"
                                title={firstItem?.nome_produto}
                              >
                                {firstItem?.nome_produto || 'Produto da Loja'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-800 font-medium">
                            {order.cliente_nome || 'Cliente'}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                            {formatBRL(Number(order.total || 0))}
                          </td>

                          <td className="py-3 px-4">{getStatusBadge(order.status)}</td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  <span className="hidden xl:inline">WhatsApp</span>
                                </a>
                              )}

                              <Link
                                href="/admin/pedidos/"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                              >
                                <span>Gerenciar</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Visualização em Cartões Mobile (Compacto e Responsivo) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhum pedido registrado até o momento.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const firstItem = order.itens_pedido?.[0] || (order as any).itens?.[0];
                  const waLink = getWhatsAppUrl(order);

                  return (
                    <div key={order.id || order.numero_pedido} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {order.numero_pedido}
                        </span>
                        <div>{getStatusBadge(order.status)}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ProductThumbnail
                          src={firstItem?.imagem_url}
                          alt={firstItem?.nome_produto || 'Produto'}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 text-xs block truncate">
                            {firstItem?.nome_produto || 'Produto da Loja'}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Cliente: <strong className="text-slate-800">{order.cliente_nome || 'Cliente'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {formatBRL(Number(order.total || 0))}
                        </span>

                        <div className="flex items-center gap-2">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <Link
                            href="/admin/pedidos/"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800"
                          >
                            <span>Gerenciar</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
