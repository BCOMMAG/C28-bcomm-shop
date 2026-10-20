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
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronDown,
  BarChart3,
  HelpCircle,
  X
} from 'lucide-react';
import {
  getAdminOrders,
  getAdminProducts,
  AdminProductItem
} from '@/lib/admin';
import { CustomerOrder } from '@/lib/orders';
import { cn, formatBRL } from '@/lib/chart-utils';
import { KpiCard } from '@/components/admin/ui/kpi-card';
import { DeltaBadge } from '@/components/admin/ui/delta-badge';
import { BarChart } from '@/components/admin/ui/bar-chart';
import { useStore } from '@/context/StoreContext';

export type FilterPeriodKey = 'hoje' | 'ontem' | '7d' | '30d' | 'mes_atual' | '90d';

/**
 * Miniatura do produto com fallback seguro para imagem ausente ou corrompida.
 */
const ProductThumbnail: React.FC<{
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md';
}> = ({ src, alt, size = 'sm' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-lg',
    md: 'w-11 h-11 rounded-xl'
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
  const [allOrders, setAllOrders] = useState<CustomerOrder[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriodKey>('30d');
  const [showZeroVendasModal, setShowZeroVendasModal] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<CustomerOrder | null>(null);

  const lojaNome = currentTenant?.nome || 'sua loja';
  const lojaId = currentTenant?.id;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersData, prodsData] = await Promise.all([
        getAdminOrders(lojaId),
        getAdminProducts(lojaId)
      ]);
      setAllOrders(ordersData || []);
      setProducts(prodsData || []);
    } catch (err) {
      console.error('❌ Erro ao buscar dados da Visão Geral:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [lojaId]);

  // Rótulo textual oficial do período ativo na tela
  const periodLabelMap: Record<FilterPeriodKey, string> = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    mes_atual: 'Mês atual',
    '90d': 'Últimos 90 dias'
  };

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

  // Badges de status para a tabela de pedidos
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

  // =========================================================================
  // 1. FILTRO DE PERÍODO UNIFICADO
  // =========================================================================
  const pedidosDoPeriodo = useMemo(() => {
    const now = new Date();

    return allOrders.filter((order) => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) return false;

      switch (selectedPeriod) {
        case 'hoje': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          return orderDate >= start;
        }
        case 'ontem': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
          return orderDate >= start && orderDate <= end;
        }
        case '7d': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
          return orderDate >= start;
        }
        case '30d': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
          return orderDate >= start;
        }
        case 'mes_atual': {
          const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          return orderDate >= start;
        }
        case '90d': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90, 0, 0, 0, 0);
          return orderDate >= start;
        }
        default:
          return true;
      }
    });
  }, [allOrders, selectedPeriod]);

  // "Pedido cancelado não entra em faturamento, custo, lucro, pedidos nem ticket médio."
  const pedidosValidos = useMemo(() => {
    return pedidosDoPeriodo.filter((o) => o.status !== 'cancelado');
  }, [pedidosDoPeriodo]);

  // =========================================================================
  // 2. CÁLCULOS DA PRIMEIRA LINHA (5 CARDS)
  // =========================================================================

  // Card 1: Faturamento Bruto (soma dos pedidos válidos do período)
  const faturamentoBruto = useMemo(() => {
    return pedidosValidos.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [pedidosValidos]);

  // Card 2: Custo Total (quantidade vendida * preço de custo cadastrado)
  // "Se algum item não tiver custo, mostre “custo incompleto” e informe quantos itens estão sem custo. Não trate custo ausente como zero."
  const { custoTotalCalculado, itensSemCustoCount, isCustoCompleto, totalItensVendidos } = useMemo(() => {
    let custo = 0;
    let semCusto = 0;
    let totalItens = 0;

    pedidosValidos.forEach((order) => {
      const itens = order.itens_pedido || (order as any).itens || [];
      itens.forEach((item: any) => {
        const qtd = Number(item.quantidade) || 1;
        totalItens += qtd;

        const prod = products.find(
          (p) => p.id === item.produto_id || p.nome?.toLowerCase() === item.nome_produto?.toLowerCase()
        );

        const precoCusto = prod?.preco_custo;
        if (precoCusto !== null && precoCusto !== undefined && !isNaN(Number(precoCusto))) {
          custo += qtd * Number(precoCusto);
        } else {
          semCusto += qtd;
        }
      });
    });

    return {
      custoTotalCalculado: custo,
      itensSemCustoCount: semCusto,
      isCustoCompleto: totalItens > 0 ? semCusto === 0 : true,
      totalItensVendidos: totalItens
    };
  }, [pedidosValidos, products]);

  // Card 3: Lucro Estimado & Margem
  // "faturamento menos custo, somente quando o custo estiver completo. Margem é lucro dividido pelo faturamento, com proteção contra divisão por zero. Não chame de lucro líquido: taxa, frete e imposto não estão sendo descontados."
  const lucroEstimado = isCustoCompleto ? faturamentoBruto - custoTotalCalculado : null;
  const margemPercentual =
    isCustoCompleto && faturamentoBruto > 0
      ? (lucroEstimado! / faturamentoBruto) * 100
      : 0;

  // Card 4: Pedidos (quantidade de pedidos válidos do período)
  const quantidadePedidosValidos = pedidosValidos.length;
  const pedidosPendentesPeriodo = pedidosValidos.filter(
    (o) => o.status === 'pendente' || o.status === 'aguardando_whatsapp'
  ).length;

  // Card 5: Ticket Médio (faturamento dividido pelos pedidos válidos, com proteção contra divisão por zero)
  const ticketMedio =
    quantidadePedidosValidos > 0 ? faturamentoBruto / quantidadePedidosValidos : 0;

  // =========================================================================
  // 3. CÁLCULOS DA SEGUNDA LINHA (3 BLOCOS)
  // =========================================================================

  // Bloco 1: Histórico de Vendas
  // "receita por dia, dentro do período, em ordem crescente. A soma das barras deve ser igual ao faturamento bruto. Com um único dia, não desenhe uma série falsa; mostre o valor e a data."
  const vendasPorDia = useMemo(() => {
    const dayMap: Record<string, { label: string; dateStr: string; total: number }> = {};

    pedidosValidos.forEach((o) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoKey = `${year}-${month}-${day}`;
      const label = `${day}/${month}`;
      const dateStr = d.toLocaleDateString('pt-BR');

      if (!dayMap[isoKey]) {
        dayMap[isoKey] = { label, dateStr, total: 0 };
      }
      dayMap[isoKey].total += Number(o.total || 0);
    });

    const sortedKeys = Object.keys(dayMap).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      label: dayMap[key].label,
      dateStr: dayMap[key].dateStr,
      primaryValue: dayMap[key].total
    }));
  }, [pedidosValidos]);

  // Bloco 2 & 3: Itens Mais Vendidos e Menos Vendidos no período
  // "Itens mais vendidos: ranking por unidades vendidas no período, com nome, quantidade e valor. Sem venda, mostre estado vazio."
  // "Itens menos vendidos: menor quantidade entre os itens que venderam no período. Se só um item vendeu, não repita o mesmo item nas duas listas; avise que não há comparação."
  const itensAgrupadosNoPeriodo = useMemo(() => {
    const map: Record<
      string,
      {
        produtoId?: string;
        nome: string;
        quantidade: number;
        valorTotal: number;
        imagemUrl?: string | null;
      }
    > = {};

    pedidosValidos.forEach((order) => {
      const itens = order.itens_pedido || (order as any).itens || [];
      itens.forEach((item: any) => {
        const prod = products.find(
          (p) => p.id === item.produto_id || p.nome?.toLowerCase() === item.nome_produto?.toLowerCase()
        );
        const key = item.produto_id || item.nome_produto || 'item-avulso';
        const qtd = Number(item.quantidade) || 1;
        const valorItem = Number(item.preco_unitario || prod?.preco || 0) * qtd;

        if (!map[key]) {
          map[key] = {
            produtoId: item.produto_id,
            nome: item.nome_produto || prod?.nome || 'Produto',
            quantidade: 0,
            valorTotal: 0,
            imagemUrl: prod?.foto_principal || item.imagem_url
          };
        }
        map[key].quantidade += qtd;
        map[key].valorTotal += valorItem;
      });
    });

    return Object.values(map);
  }, [pedidosValidos, products]);

  // Ranking ordenado do mais vendido para o menos vendido
  const itensMaisVendidos = useMemo(() => {
    return [...itensAgrupadosNoPeriodo].sort((a, b) => b.quantidade - a.quantidade);
  }, [itensAgrupadosNoPeriodo]);

  // Ranking ordenado do menos vendido para o mais vendido (apenas itens com pelo menos 1 venda)
  const itensMenosVendidos = useMemo(() => {
    return [...itensAgrupadosNoPeriodo].sort((a, b) => a.quantidade - b.quantidade);
  }, [itensAgrupadosNoPeriodo]);

  // Produtos ativos do catálogo geral
  const produtosAtivos = useMemo(() => {
    return products.filter((p) => p.ativo !== false);
  }, [products]);

  // Conjunto de identificadores de produtos que tiveram vendas no período
  const produtosComVendasIds = useMemo(() => {
    const set = new Set<string>();
    itensAgrupadosNoPeriodo.forEach((item) => {
      if (item.produtoId) set.add(item.produtoId);
      if (item.nome) set.add(item.nome.toLowerCase().trim());
    });
    return set;
  }, [itensAgrupadosNoPeriodo]);

  // Produtos do catálogo com ZERO vendas no período selecionado
  const produtosZeroVendas = useMemo(() => {
    return produtosAtivos.filter((p) => {
      const idMatch = p.id && produtosComVendasIds.has(p.id);
      const nameMatch = p.nome && produtosComVendasIds.has(p.nome.toLowerCase().trim());
      return !idMatch && !nameMatch;
    });
  }, [produtosAtivos, produtosComVendasIds]);

  const temMaisDeUmItemDistinto = itensAgrupadosNoPeriodo.length > 1;
  const temExatamenteUmItemDistinto = itensAgrupadosNoPeriodo.length === 1;

  return (
    <div className="space-y-6 pb-6">
      {/* =========================================================================
          CABEÇALHO DA VISÃO GERAL (Título + Seletor de Período + Atualizar)
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Visão Geral
          </h1>
        </div>

        {/* Seletor de Período e Botão Atualizar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative inline-flex items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as FilterPeriodKey)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs cursor-pointer"
            >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="mes_atual">Mês atual</option>
              <option value="90d">90 dias</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-slate-900')} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRIMEIRA LINHA: 5 CARDS NO DESKTOP COM ALTURA E LARGURA PADRONIZADAS
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
        {/* Card 1: Faturamento */}
        <KpiCard
          title="Faturamento"
          value={formatBRL(faturamentoBruto)}
          icon={<DollarSign className="w-4 h-4 text-slate-700" />}
          deltaLabel={quantidadePedidosValidos > 0 ? `${quantidadePedidosValidos} pedidos` : undefined}
          deltaType="neutral"
          footerText="Ver faturamento detalhado"
          actionText="Ver finanças"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Card 2: Custo Total */}
        <KpiCard
          title="Custo Total"
          value={
            !isCustoCompleto
              ? 'Custo incompleto'
              : formatBRL(custoTotalCalculado)
          }
          icon={<Wallet className="w-4 h-4 text-slate-700" />}
          deltaLabel={
            !isCustoCompleto
              ? `${itensSemCustoCount} un sem custo`
              : 'Custo completo'
          }
          deltaType={!isCustoCompleto ? 'warning' : 'neutral'}
          footerText={
            !isCustoCompleto
              ? `${itensSemCustoCount} ${itensSemCustoCount === 1 ? 'item sem preço de custo' : 'itens sem preço de custo'}`
              : 'Qtd × preço de custo'
          }
          actionText="Ver catálogo"
          href="/admin/produtos/"
          loading={loading}
        />

        {/* Card 3: Lucro Estimado e Margem */}
        <KpiCard
          title="Lucro Estimado"
          value={
            isCustoCompleto
              ? formatBRL(lucroEstimado || 0)
              : '—'
          }
          icon={<TrendingUp className="w-4 h-4 text-slate-700" />}
          deltaLabel={
            isCustoCompleto
              ? `${margemPercentual.toFixed(1)}% margem`
              : 'Aguardando custo'
          }
          deltaType={
            isCustoCompleto && margemPercentual > 0 ? 'positive' : 'neutral'
          }
          footerText={
            isCustoCompleto
              ? 'Faturamento menos custos'
              : 'Aguardando custo dos itens'
          }
          actionText="Ver finanças"
          href="/admin/financas/"
          loading={loading}
        />

        {/* Card 4: Pedidos */}
        <KpiCard
          title="Pedidos"
          value={`${quantidadePedidosValidos} ${quantidadePedidosValidos === 1 ? 'Pedido' : 'Pedidos'}`}
          icon={<ShoppingBag className="w-4 h-4 text-slate-700" />}
          deltaLabel={
            pedidosPendentesPeriodo > 0
              ? `${pedidosPendentesPeriodo} aguardando`
              : 'Válidos'
          }
          deltaType={pedidosPendentesPeriodo > 0 ? 'warning' : 'neutral'}
          footerText={
            pedidosPendentesPeriodo > 0
              ? `${pedidosPendentesPeriodo} aguardando confirmação`
              : 'Pedidos válidos do período'
          }
          actionText="Ver pedidos"
          href="/admin/pedidos/"
          loading={loading}
        />

        {/* Card 5: Ticket Médio */}
        <KpiCard
          title="Ticket Médio"
          value={formatBRL(ticketMedio)}
          icon={<BarChart3 className="w-4 h-4 text-slate-700" />}
          deltaLabel="Média Real"
          deltaType="neutral"
          footerText="Média por pedido válido"
          actionText="Ver finanças"
          href="/admin/financas/"
          loading={loading}
        />
      </div>

      {/* =========================================================================
          SEGUNDA LINHA: 3 BLOCOS COM ALTURA PERFEITAMENTE NIVELADA (min-h-[420px])
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Bloco 1: Histórico de Vendas */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Histórico de Vendas
              </h3>
              <span className="text-xs font-bold text-slate-700 font-sans">
                {formatBRL(faturamentoBruto)}
              </span>
            </div>

            <div className="mt-4">
              {vendasPorDia.length === 0 ? (
                /* Estado Vazio */
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhuma venda registrada no período selecionado.
                </div>
              ) : vendasPorDia.length === 1 ? (
                /* Com um único dia, não desenhe uma série falsa; mostre o valor e a data */
                <div className="py-6 px-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Data da Venda: {vendasPorDia[0].dateStr}
                  </span>
                  <span className="text-3xl font-extrabold text-slate-900 font-sans block">
                    {formatBRL(vendasPorDia[0].primaryValue)}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span>Receita registrada em 1 única data</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto pt-1">
                    O gráfico comparativo em barras é exibido automaticamente a partir de 2 datas com vendas.
                  </p>
                </div>
              ) : (
                /* Gráfico de barras direto sem bordas internas redundantes */
                <BarChart
                  data={vendasPorDia}
                  primaryLabel="Receita Diária"
                  primaryColor="#0F172A"
                  height={220}
                  embedded={true}
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Soma: {formatBRL(faturamentoBruto)}</span>
            <span className="font-semibold">{vendasPorDia.length} {vendasPorDia.length === 1 ? 'dia com vendas' : 'dias com vendas'}</span>
          </div>
        </div>

        {/* Bloco 2: Itens Mais Vendidos */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Itens Mais Vendidos
              </h3>
              <DeltaBadge label="Top Saída" type="neutral" showIcon={false} />
            </div>

            <div className="mt-4">
              {itensMaisVendidos.length === 0 ? (
                /* Sem venda, mostre estado vazio */
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum item vendido no período selecionado.
                </div>
              ) : (
                <div className="space-y-3">
                  {itensMaisVendidos.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.produtoId || idx}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <ProductThumbnail src={item.imagemUrl} alt={item.nome} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={item.nome}>
                          {item.nome}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {item.quantidade} {item.quantidade === 1 ? 'unidade vendida' : 'unidades vendidas'}
                          </span>
                          <span className="font-extrabold text-slate-900 font-sans">
                            {formatBRL(item.valorTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/produtos/"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span>{itensMaisVendidos.length} {itensMaisVendidos.length === 1 ? 'produto com vendas' : 'produtos com vendas'}</span>
          </div>
        </div>

        {/* Bloco 3: Itens Menos Vendidos (com Destaque para Produtos Zero Vendas) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Itens Menos Vendidos
              </h3>
              <DeltaBadge label="Menor Saída" type="neutral" showIcon={false} />
            </div>

            <div className="mt-4 space-y-3">
              {/* Linha de Destaque para Produtos com Zero Vendas no período */}
              {produtosZeroVendas.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-amber-950 block truncate">
                        Zero Vendas ({produtosZeroVendas.length} {produtosZeroVendas.length === 1 ? 'item sem saída' : 'itens sem saída'})
                      </span>
                      <span className="text-[10px] text-amber-700 block truncate">
                        Peças no estoque sem movimentação no período
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowZeroVendasModal(true)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer"
                    title="Ver lista completa de produtos sem vendas"
                  >
                    Ver todos ({produtosZeroVendas.length})
                  </button>
                </div>
              )}

              {/* Se há produtos com zero vendas, exibe eles na lista para o lojista ver o que está sem saída! */}
              {produtosZeroVendas.length > 0 ? (
                <div className="space-y-2.5">
                  {produtosZeroVendas.slice(0, 3).map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <ProductThumbnail src={prod.foto_principal} alt={prod.nome} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={prod.nome}>
                          {prod.nome}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-rose-600">
                            0 unidades vendidas
                          </span>
                          <span className="font-medium text-slate-500 text-[10px]">
                            Estoque: {prod.estoque_total ?? 0} un &bull; {formatBRL(prod.preco || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : itensMenosVendidos.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum item registrado no período selecionado.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {itensMenosVendidos.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.produtoId || idx}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <ProductThumbnail src={item.imagemUrl} alt={item.nome} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={item.nome}>
                          {item.nome}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {item.quantidade} {item.quantidade === 1 ? 'unidade vendida' : 'unidades vendidas'}
                          </span>
                          <span className="font-extrabold text-slate-900 font-sans">
                            {formatBRL(item.valorTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/produtos/"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <span>Gerenciar Estoque</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span>
              {produtosZeroVendas.length > 0
                ? `${produtosZeroVendas.length} sem saída`
                : `${itensMenosVendidos.length} com vendas`}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LISTAGEM DE PEDIDOS DO PERÍODO
      ========================================================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pedidos Recentes
            </h3>
          </div>
          <Link
            href="/admin/pedidos/"
            className="text-xs text-slate-700 hover:text-slate-950 font-bold inline-flex items-center gap-1"
          >
            <span>Central de Pedidos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Visualização em Tabela para Desktop / Tablet */}
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
              {pedidosDoPeriodo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum pedido registrado no período ({periodLabelMap[selectedPeriod]}).
                  </td>
                </tr>
              ) : (
                pedidosDoPeriodo.map((order) => {
                  const firstItem = order.itens_pedido?.[0] || (order as any).itens?.[0];
                  const waLink = getWhatsAppUrl(order);

                  return (
                    <tr
                      key={order.id || order.numero_pedido}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedOrderForDetails(order)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block group-hover:text-amber-800 transition-colors">
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
                        <div className="flex items-center gap-2.5 max-w-[220px]">
                          <ProductThumbnail
                            src={firstItem?.imagem_url}
                            alt={firstItem?.nome_produto || 'Produto'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <span
                              className="font-medium text-slate-900 truncate text-xs block"
                              title={firstItem?.nome_produto}
                            >
                              {firstItem?.nome_produto || 'Produto da Loja'}
                            </span>
                            {order.itens_pedido && order.itens_pedido.length > 1 && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 inline-block mt-0.5">
                                +{order.itens_pedido.length - 1} outro(s) item(ns)
                              </span>
                            )}
                          </div>
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
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                          >
                            <span>Detalhes</span>
                          </button>
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
          {pedidosDoPeriodo.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Nenhum pedido registrado no período ({periodLabelMap[selectedPeriod]}).
            </div>
          ) : (
            pedidosDoPeriodo.map((order) => {
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
                      {order.itens_pedido && order.itens_pedido.length > 1 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 inline-block mt-0.5">
                          +{order.itens_pedido.length - 1} outro(s) item(ns)
                        </span>
                      )}
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
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                      >
                        <span>Detalhes</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: PRODUTOS COM ZERO VENDAS NO PERÍODO
      ========================================================================= */}
      {showZeroVendasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Produtos com Zero Vendas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {produtosZeroVendas.length} {produtosZeroVendas.length === 1 ? 'produto sem nenhuma venda' : 'produtos sem nenhuma venda'} no período ({periodLabelMap[selectedPeriod]})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowZeroVendasModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {produtosZeroVendas.map((p) => (
                <div key={p.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductThumbnail src={p.foto_principal} alt={p.nome} size="sm" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate" title={p.nome}>
                        {p.nome}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Estoque: {p.estoque_total ?? 0} un &bull; Preço: {formatBRL(p.preco || 0)}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    0 vendas
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <Link
                href="/admin/produtos/"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5"
                onClick={() => setShowZeroVendasModal(false)}
              >
                <span>Ir para Cadastro de Produtos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowZeroVendasModal(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETALHES DO PEDIDO INLINE NA VISÃO GERAL
      ========================================================================= */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    {selectedOrderForDetails.numero_pedido}
                  </h3>
                  {getStatusBadge(selectedOrderForDetails.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Realizado em {selectedOrderForDetails.created_at ? new Date(selectedOrderForDetails.created_at).toLocaleString('pt-BR') : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
              {/* Cliente & Contato */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cliente & Contato
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedOrderForDetails.cliente_nome || 'Cliente'}
                    </p>
                    <p className="text-xs text-slate-600 font-mono">
                      {selectedOrderForDetails.cliente_telefone || 'Sem telefone'}
                      {selectedOrderForDetails.clientes_loja?.email && ` • ${selectedOrderForDetails.clientes_loja.email}`}
                    </p>
                  </div>
                  {getWhatsAppUrl(selectedOrderForDetails) && (
                    <a
                      href={getWhatsAppUrl(selectedOrderForDetails)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shrink-0"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="pt-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Endereço de Entrega
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedOrderForDetails.endereco_entrega ? (
                    <>
                      {selectedOrderForDetails.endereco_entrega.logradouro}, {selectedOrderForDetails.endereco_entrega.numero}
                      {selectedOrderForDetails.endereco_entrega.complemento && ` (${selectedOrderForDetails.endereco_entrega.complemento})`}
                      <br />
                      {selectedOrderForDetails.endereco_entrega.bairro} &bull; {selectedOrderForDetails.endereco_entrega.cidade} - {selectedOrderForDetails.endereco_entrega.uf || 'BR'}
                      <br />
                      CEP: {selectedOrderForDetails.endereco_entrega.cep}
                    </>
                  ) : (
                    'Endereço não informado'
                  )}
                </p>
              </div>

              {/* Itens do Pedido */}
              <div className="pt-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Itens do Pedido ({selectedOrderForDetails.itens_pedido?.length || 0})
                </span>
                <div className="space-y-2">
                  {(selectedOrderForDetails.itens_pedido || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProductThumbnail src={item.imagem_url} alt={item.nome_produto} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate" title={item.nome_produto}>
                            {item.nome_produto}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Tamanho: {item.tamanho || 'U'} &bull; Cor: {item.cor || 'Padrão'} &bull; Qtd: {item.quantidade || 1}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-slate-900 font-mono shrink-0">
                        {formatBRL(Number(item.preco_unitario || 0) * Number(item.quantidade || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatBRL(Number(selectedOrderForDetails.subtotal || selectedOrderForDetails.total || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span className="font-mono">{Number(selectedOrderForDetails.valor_frete || 0) > 0 ? formatBRL(Number(selectedOrderForDetails.valor_frete)) : 'Grátis'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                  <span>Total do Pedido:</span>
                  <span className="font-mono text-base">{formatBRL(Number(selectedOrderForDetails.total || 0))}</span>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <Link
                href="/admin/pedidos/"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5"
                onClick={() => setSelectedOrderForDetails(null)}
              >
                <span>Central de Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
