'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  AlertCircle
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
import { BarChart, BarChartDataPoint } from '@/components/admin/ui/bar-chart';
import { DonutChart, DonutSegment } from '@/components/admin/ui/donut-chart';
import { useStore } from '@/context/StoreContext';

/**
 * Componente isolado para miniatura do produto na tabela com fallback seguro.
 * Previne renderizações infinitas e oculta o ícone nativo de imagem quebrada do navegador.
 */
const TableProductThumbnail: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
        <Package className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredImageError, setFeaturedImageError] = useState(false);

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
      console.error('❌ Erro ao buscar dados consolidados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lista de pedidos recentes (utiliza estritamente a população real do banco)
  const recentOrders: CustomerOrder[] = useMemo(() => {
    return stats?.pedidosRecentes || [];
  }, [stats?.pedidosRecentes]);

  // Helper unificado para montagem consistente do link do WhatsApp (compartilhado entre desktop e mobile)
  const getWhatsAppUrl = (order: CustomerOrder) => {
    const rawPhone = order.cliente_telefone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    const normalizedPhone = cleanPhone.startsWith('55') && cleanPhone.length >= 12
      ? cleanPhone
      : `55${cleanPhone}`;

    const clientName = order.cliente_nome || 'Cliente';
    const storeName = currentTenant?.nome || 'nossa loja';
    const message = `Olá ${clientName}! Aqui é da ${storeName} referente ao seu pedido ${order.numero_pedido}.`;

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Indicadores Numéricos Consolidados (Fórmulas Oficiais)
  const faturamentoTotal = stats?.faturamentoTotal ?? 0;
  const totalPedidos = stats?.totalPedidos ?? 0;
  const ticketMedio = stats?.ticketMedio ?? 0;
  const totalProdutos = stats?.totalProdutos ?? products.length ?? 0;

  // Regra unificada de cálculo de estoque físico por produto:
  // Se o produto possui variações detalhadas (tamanhos/cores), utiliza a soma real da grade;
  // Caso contrário, utiliza o estoque_total simples cadastrado no produto.
  const getProductStock = (p: AdminProductItem): number => {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
    }
    return Number(p.estoque_total || 0);
  };

  // Total de peças físicas disponíveis no estoque (somando a grade oficial)
  const totalPecasEstoque = useMemo(() => {
    return products.reduce((acc, p) => acc + getProductStock(p), 0);
  }, [products]);

  // Gráfico de Barras: Consome a série oficial consolidada pelo backend a partir de todos os pedidos válidos
  const barChartData: BarChartDataPoint[] = useMemo(() => {
    return stats?.receitaPorDia || [];
  }, [stats?.receitaPorDia]);

  // Gráfico de Rosca: Composição Real do Estoque por Categoria (Utiliza mesma regra de variações)
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

    const topCategories = sorted.slice(0, 5);
    const remaining = sorted.slice(5);

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

  // Seleção e classificação do produto em destaque
  // Se houver pedidos confirmados com itens comprovados, calcula o Mais Vendido real;
  // Caso contrário, seleciona o destaque do catálogo com o rótulo preciso "Destaque do Catálogo".
  const { featuredProduct, featuredBadgeLabel, featuredSubtitle } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        featuredProduct: null,
        featuredBadgeLabel: 'Destaque do Catálogo',
        featuredSubtitle: ''
      };
    }

    // Status de pedidos confirmados
    const CONFIRMED_STATUSES = ['pago', 'em_separacao', 'enviado', 'entregue'];
    const confirmedOrders = (stats?.pedidosRecentes || []).filter((o) =>
      CONFIRMED_STATUSES.includes(o.status)
    );

    const salesMap: Record<string, number> = {};
    confirmedOrders.forEach((o) => {
      (o.itens_pedido || []).forEach((item) => {
        const key = (item as any).produto_id || item.nome_produto;
        if (key) {
          salesMap[key] = (salesMap[key] || 0) + Number(item.quantidade || 1);
        }
      });
    });

    const sortedSales = Object.entries(salesMap).sort((a, b) => b[1] - a[1]);

    // Verifica se há vendas confirmadas E se há um vencedor único (sem empate no topo)
    const hasConfirmedSales = sortedSales.length > 0 && sortedSales[0][1] > 0;
    const isTie = sortedSales.length > 1 && sortedSales[0][1] === sortedSales[1][1];

    if (hasConfirmedSales && !isTie) {
      const topKey = sortedSales[0][0];
      const matched = products.find(
        (p) => p.id === topKey || p.nome.toLowerCase() === topKey.toLowerCase()
      );
      if (matched) {
        return {
          featuredProduct: matched,
          featuredBadgeLabel: 'Mais Vendido',
          featuredSubtitle: `${sortedSales[0][1]} un vendidas`
        };
      }
    }

    // Sem vendas confirmadas ou em caso de empate: mantém seleção manual e rótulo "Destaque da coleção"
    const catalogFeatured =
      products.find((p) => p.destaque && p.ativo) ||
      products.find((p) => p.mais_vendido && p.ativo) ||
      products[0];

    return {
      featuredProduct: catalogFeatured || null,
      featuredBadgeLabel: 'Destaque do Catálogo',
      featuredSubtitle: catalogFeatured
        ? `${getProductStock(catalogFeatured)} un em estoque`
        : ''
    };
  }, [products, stats?.pedidosRecentes]);

  // Status badges inspirados na estética Ecomora
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

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. CABEÇALHO DO DASHBOARD (Bento Header)
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Visão Geral
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de desempenho e vendas em tempo real de {currentTenant?.nome || 'sua loja'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-slate-900')} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/admin/produtos/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
          >
            <Package className="w-3.5 h-3.5 text-slate-300" />
            <span>Gerenciar Produtos</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. CARDS DE KPI (Bento Grid: 4 Indicadores Estratégicos)
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

        {/* Card 2: Volume de Pedidos */}
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
          href="/admin/pedidos/"
          loading={loading}
        />

        {/* Card 3: Ticket Médio Real (Baseado exclusivamente em pedidos válidos faturados) */}
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

        {/* Card 4: Catálogo de Produtos (Estoque físico oficial por variações) */}
        <KpiCard
          title="Catálogo de Produtos"
          value={`${totalProdutos} Ativos`}
          icon={<Package className="w-4 h-4 text-slate-700" />}
          deltaLabel={totalPecasEstoque > 0 ? `${totalPecasEstoque} em estoque` : 'Cadastrados'}
          deltaType="neutral"
          footerText="Gerenciar Estoque & Fotos"
          href="/admin/produtos/"
          loading={loading}
        />
      </div>

      {/* =========================================================================
          3. BENTO GRID ANALÍTICO (Gráfico de Barras 2x + Gráfico Donut 1x)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras: Faturamento por Período (Ordenação cronológica ascendente) */}
        <div className="lg:col-span-2">
          <BarChart
            data={barChartData}
            title="Receita por Período"
            subtitle="Total por dia"
            primaryLabel="Receita Operacional"
            primaryColor="#0F172A"
            height={260}
          />
        </div>

        {/* Gráfico de Rosca: Composição Real do Estoque por Categoria */}
        <div className="lg:col-span-1">
          <DonutChart
            data={donutChartData}
            title="Estoque por Categoria"
            subtitle="Mix de produtos ativos no catálogo da loja"
            centerValue={totalPecasEstoque}
            centerLabel="Unidades em Estoque"
            height={220}
          />
        </div>
      </div>

      {/* =========================================================================
          4. SEÇÃO INTERMEDIÁRIA (Produto Destaque + Status Operacional)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Produto em Destaque no Catálogo */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Destaque do Catálogo
              </span>
              <DeltaBadge
                label={featuredBadgeLabel}
                type={featuredBadgeLabel === 'Mais Vendido' ? 'positive' : 'neutral'}
                showIcon={featuredBadgeLabel === 'Mais Vendido'}
              />
            </div>

            {featuredProduct ? (
              <div className="mt-4 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center">
                  {featuredProduct.foto_principal && !featuredImageError ? (
                    <img
                      src={featuredProduct.foto_principal}
                      alt={featuredProduct.nome}
                      className="w-full h-full object-cover"
                      onError={() => setFeaturedImageError(true)}
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate" title={featuredProduct.nome}>
                    {featuredProduct.nome}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {featuredProduct.categoria_nome || 'Geral'} &bull; {featuredSubtitle}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                    {formatBRL(featuredProduct.preco)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">Nenhum produto cadastrado no catálogo.</p>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-end">
            <Link
              href="/admin/produtos/"
              className="text-xs font-bold text-slate-800 hover:text-slate-950 inline-flex items-center gap-1"
            >
              <span>Ver no Catálogo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Funil de Status Operacional dos Pedidos (2 colunas) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Status Operacional das Vendas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fluxo de processamento e logística dos pedidos recebidos
              </p>
            </div>
            <Link
              href="/admin/pedidos/"
              className="text-xs text-slate-700 hover:text-slate-950 font-bold inline-flex items-center gap-1"
            >
              <span>Central de Pedidos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            {/* 1. Aguardando WhatsApp */}
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider block">
                  Aguardando WhatsApp
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-sans">
                {stats?.pedidosPendentes ?? 1}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Aguardando confirmação
              </span>
            </div>

            {/* 2. Em Separação / Envio */}
            <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-sky-800 font-bold uppercase tracking-wider block">
                  Em Separação / Envio
                </span>
                <Truck className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-sans">
                {stats?.pedidosEnviados ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Prontos para envio
              </span>
            </div>

            {/* 3. Entregues com Sucesso */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Entregues com Sucesso
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-sans">
                {stats?.pedidosEntregues ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Finalizados e confirmados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. TABELA DE PEDIDOS RECENTES (Estilo Ecomora: Limpa & Elegante)
      ========================================================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
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

        {/* Visualização em Tabela para Desktop e Tablet (sm em diante) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum pedido recente registrado.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
                  const formattedDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  const firstItem = order.itens_pedido?.[0];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Pedido & Data */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.numero_pedido}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                          {formattedDate}
                        </span>
                      </td>

                      {/* Produto / Thumbnail com Fallback */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <TableProductThumbnail
                            src={firstItem?.imagem_url}
                            alt={firstItem?.nome_produto || 'Produto da Loja'}
                          />
                          <div className="min-w-0 max-w-[180px]">
                            <span className="font-semibold text-slate-900 block truncate" title={firstItem?.nome_produto}>
                              {firstItem?.nome_produto || 'Produto da Loja'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {firstItem ? `${firstItem.quantidade}x ${firstItem.tamanho || ''}` : '1 item'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {order.cliente_nome || 'Cliente'}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4">
                        {getWhatsAppUrl(order) ? (
                          <a
                            href={getWhatsAppUrl(order)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{order.cliente_telefone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                        {formatBRL(Number(order.total || 0))}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/admin/pedidos/"
                          className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-950 font-semibold"
                        >
                          <span>Gerenciar</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Visualização em Cards Verticais para Telas Estreitas (Abaixo de sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhum pedido recente registrado.
            </div>
          ) : (
            recentOrders.map((order) => {
              const formattedDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '-';

              const firstItem = order.itens_pedido?.[0];
              const waLink = getWhatsAppUrl(order);

              return (
                <div key={`mob-${order.id}`} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  {/* Linha 1: Pedido, Data e Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        {order.numero_pedido}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Linha 2: Miniatura, Produto e Cliente */}
                  <div className="flex items-center gap-3">
                    <TableProductThumbnail
                      src={firstItem?.imagem_url}
                      alt={firstItem?.nome_produto || 'Produto da Loja'}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 text-xs block truncate" title={firstItem?.nome_produto}>
                        {firstItem?.nome_produto || 'Produto da Loja'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        Cliente: <strong className="text-slate-800">{order.cliente_nome || 'Cliente'}</strong>
                        {firstItem ? ` • ${firstItem.quantidade}x ${firstItem.tamanho || ''}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Linha 3: Total, WhatsApp e Ação Gerenciar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Valor Total</span>
                      <span className="font-extrabold text-slate-900 font-mono text-sm block">
                        {formatBRL(Number(order.total || 0))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                          title="Conversar no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <Link
                        href="/admin/pedidos/"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                      >
                        <span>Gerenciar</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
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
  );
}
