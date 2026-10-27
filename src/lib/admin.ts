import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { CustomerOrder } from '@/lib/orders';
import { BarraAvisoEstilo } from '@/types/database';
import { clearTenantCache } from '@/lib/tenant';

export interface DashboardStats {
  faturamentoTotal: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosEnviados: number;
  pedidosEntregues: number;
  ticketMedio: number;
  totalLeads: number;
  totalProdutos: number;
  pedidosRecentes: CustomerOrder[];
  receitaPorDia: Array<{ label: string; primaryValue: number }>;
}

export interface AdminProductItem {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  preco: number;
  preco_promocional: number | null;
  preco_custo?: number | null;
  tecido?: string | null;
  modelagem?: string | null;
  linha?: string | null;
  destaque?: boolean;
  mais_vendido?: boolean;
  outlet?: boolean;
  ultimas_pecas?: boolean;
  estoque_total: number;
  ativo: boolean;
  foto_principal?: string | null;
  categoria_id?: string | null;
  categoria_nome?: string;
  subcategoria?: string | null;
  midias?: Array<{
    id: string;
    url: string;
    tipo: 'image' | 'video';
    display_order: number;
    label?: string | null;
  }>;
  paired_with_slug?: string | null;
  detalhes?: string[] | null;
  variacoes: Array<{
    id: string;
    cor_nome: string;
    cor_hex: string;
    tamanho: string;
    estoque: number;
    sku?: string | null;
  }>;
}

export interface UpdateProductInput {
  id: string;
  loja_id?: string;
  nome?: string;
  slug?: string;
  categoria_id?: string | null;
  subcategoria?: string | null;
  descricao?: string | null;
  preco?: number;
  preco_promocional?: number | null;
  preco_custo?: number | null;
  tecido?: string | null;
  modelagem?: string | null;
  linha?: string | null;
  destaque?: boolean;
  mais_vendido?: boolean;
  outlet?: boolean;
  ultimas_pecas?: boolean;
  estoque_total?: number;
  foto_principal?: string | null;
  paired_with_slug?: string | null;
  detalhes?: string[] | null;
  fotos?: Array<{
    id?: string;
    url: string;
    tipo?: 'image' | 'video';
    label?: string | null;
    display_order?: number;
  }>;
  video_provador_url?: string | null;
  variacoes?: Array<{
    id?: string;
    cor_nome: string;
    cor_hex: string;
    tamanho: string;
    estoque: number;
    sku?: string | null;
  }>;
}

export interface CreateProductInput {
  loja_id?: string;
  nome: string;
  slug?: string;
  categoria_id?: string | null;
  subcategoria?: string | null;
  nova_categoria_nome?: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number | null;
  preco_custo?: number | null;
  tecido?: string;
  modelagem?: string;
  linha?: string;
  destaque?: boolean;
  mais_vendido?: boolean;
  outlet?: boolean;
  ultimas_pecas?: boolean;
  estoque_total: number;
  foto_principal?: string;
  fotos?: string[];
  video_provador_url?: string;
  tem_grade: boolean;
  variacoes?: Array<{
    cor_nome: string;
    cor_hex: string;
    tamanho: string;
    estoque: number;
    sku?: string;
  }>;
}

export interface StoreModuleConfig {
  key: string;
  title: string;
  description: string;
  mensalidade: string;
  categoria: 'Logística' | 'Automação' | 'Conversão' | 'Pagamentos';
  active: boolean;
  badge?: string;
}

export interface FinanceMetrics {
  faturamentoBruto: number;
  cmvTotal: number;
  despesasOperacionais: number;
  lucroLiquido: number;
  margemLiquidaPercent: number;
  ticketMedio: number;
  totalPecasVendidas: number;
  totalPedidosFaturados: number;
  taxaCartaoPadrao: number;
  custoEmbalagemPadrao: number;
  topProdutos: Array<{
    nome: string;
    quantidadeVendida: number;
    faturamento: number;
    lucro: number;
  }>;
}

export interface AdminClientItem {
  id?: string;
  nome: string;
  telefone: string;
  email?: string | null;
  cpf?: string | null;
  cidade?: string | null;
  estado?: string | null;
  totalPedidos: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaCompra?: string | null;
  primeiroPedido?: string | null;
  ultimoPedido?: string | null;
  isVIP?: boolean;
  tag?: 'vip' | 'recorrente' | 'compradora' | 'lead';
  notasInternas?: string | null;
  tamanhoHabitual?: string | null;
  pedidos?: Array<{
    id: string;
    numeroPedido: string;
    total: number;
    status: string;
    createdAt: string;
    itens: Array<{
      nome: string;
      cor?: string;
      tamanho?: string;
      quantidade: number;
      preco: number;
    }>;
  }>;
}

export interface AdminHeroBanner {
  id: string;
  titulo?: string | null;
  subtitulo?: string | null;
  cta_texto?: string | null;
  cta_link?: string | null;
  tipo_midia: 'video' | 'image';
  desktop_media_url: string;
  mobile_media_url: string;
  display_order?: number;
  ativo: boolean;
}

/**
 * Coleta métricas consolidadas em tempo real da loja no Supabase.
 */
export async function getAdminDashboardStats(lojaId: string = DEFAULT_TENANT_ID): Promise<DashboardStats> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Consulta de Pedidos
    const { data: pedidos, error: pedidosErr } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes_loja (nome, telefone, email),
        itens_pedido (*)
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (pedidosErr) throw pedidosErr;

    const ordersList: CustomerOrder[] = (pedidos || []).map((p: any) => ({
      ...p,
      cliente_nome: p.clientes_loja?.nome || p.endereco_entrega?.destinatario || 'Cliente VIP',
      cliente_telefone: p.clientes_loja?.telefone || p.endereco_entrega?.telefone || '',
      subtotal: Number(p.subtotal || 0),
      valor_frete: Number(p.valor_frete || 0),
      valor_desconto: Number(p.valor_desconto || 0),
      total: Number(p.total || 0)
    }));

    const pedidosValidos = ordersList.filter((o) => o.status !== 'cancelado');
    const faturamentoTotal = pedidosValidos.reduce((acc, o) => acc + Number(o.total || 0), 0);

    const totalPedidos = ordersList.length;
    const pedidosPendentes = ordersList.filter(
      (o) => o.status === 'pendente' || o.status === 'aguardando_whatsapp'
    ).length;
    const pedidosEnviados = ordersList.filter((o) => o.status === 'enviado').length;
    const pedidosEntregues = ordersList.filter((o) => o.status === 'entregue').length;
    const ticketMedio = pedidosValidos.length > 0 ? faturamentoTotal / pedidosValidos.length : 0;


    // 2. Consulta de Leads / Clientes
    const { count: leadsCount } = await supabase
      .from('clientes_loja')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaId);

    // 3. Consulta de Produtos
    const { count: produtosCount } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaId);

    // Agrupamento diário da receita a partir dos mesmos pedidosValidos do faturamento
    const dayMap: Record<string, { label: string; total: number }> = {};
    pedidosValidos.forEach((o) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoKey = `${year}-${month}-${day}`;
      const label = `${day}/${month}`;

      if (!dayMap[isoKey]) {
        dayMap[isoKey] = { label, total: 0 };
      }
      dayMap[isoKey].total += Number(o.total || 0);
    });

    const receitaPorDia = Object.keys(dayMap)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({
        label: dayMap[key].label,
        primaryValue: dayMap[key].total
      }));

    return {
      faturamentoTotal,
      totalPedidos,
      pedidosPendentes,
      pedidosEnviados,
      pedidosEntregues,
      ticketMedio,
      totalLeads: leadsCount || 0,
      totalProdutos: produtosCount || 0,
      pedidosRecentes: ordersList.slice(0, 6),
      receitaPorDia
    };
  } catch (err) {
    console.error('❌ [Supabase] Erro ao carregar métricas do dashboard:', err);
    return {
      faturamentoTotal: 0,
      totalPedidos: 0,
      pedidosPendentes: 0,
      pedidosEnviados: 0,
      pedidosEntregues: 0,
      ticketMedio: 0,
      totalLeads: 0,
      totalProdutos: 0,
      pedidosRecentes: [],
      receitaPorDia: []
    };
  }
}

/**
 * Lista todos os pedidos da loja com suporte a filtro por status.
 */
export async function getAdminOrders(
  lojaId: string = DEFAULT_TENANT_ID,
  statusFilter?: string
): Promise<CustomerOrder[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        clientes_loja (nome, telefone, email),
        itens_pedido (*)
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'todos') {
      if (statusFilter === 'pendente' || statusFilter === 'aguardando_whatsapp') {
        query = query.in('status', ['pendente', 'aguardando_whatsapp']);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((p: any) => ({
      ...p,
      cliente_nome: p.clientes_loja?.nome || p.endereco_entrega?.destinatario || 'Cliente VIP',
      cliente_telefone: p.clientes_loja?.telefone || p.endereco_entrega?.telefone || '',
      subtotal: Number(p.subtotal || 0),
      valor_frete: Number(p.valor_frete || 0),
      valor_desconto: Number(p.valor_desconto || 0),
      total: Number(p.total || 0)
    }));
  } catch (err) {
    console.error('❌ [Supabase] Erro ao listar pedidos no admin:', err);
    return [];
  }
}

function getCustomerPhoneVariants(order: any): string[] {
  const rawPhone =
    order?.clientes_loja?.telefone ||
    order?.endereco_entrega?.telefone ||
    order?.cliente_telefone ||
    '';

  if (!rawPhone) return [];

  const str = String(rawPhone).trim();
  const clean = str.replace(/\D/g, '');
  const variants = new Set<string>([str, clean]);

  if (clean.length === 11) {
    variants.add(`(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`);
  } else if (clean.length === 10) {
    variants.add(`(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`);
  }

  return Array.from(variants).filter(Boolean);
}

/**
 * Atualiza o status de um pedido na nuvem com controle inteligente de estoque:
 * - Se marcar como PAGO -> Baixa estoque da grade no banco
 * - Se marcar como CANCELADO -> Devolve estoque
 */
export async function updateAdminOrderStatusWithStock(
  orderId: string,
  newStatus: string,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Busca status atual e itens do pedido
    const { data: order, error: orderErr } = await supabase
      .from('pedidos')
      .select(`
        status,
        numero_pedido,
        cliente_id,
        endereco_entrega,
        clientes_loja (telefone),
        itens_pedido (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) throw orderErr || new Error('Pedido não encontrado');

    const previousStatus = order.status;
    const itens = (order as any).itens_pedido || [];
    const phoneVariants = getCustomerPhoneVariants(order);

    // Se mudou para PAGO (e antes não era pago nem enviado) -> Baixa estoque!
    const isNowPaid = newStatus === 'pago' || newStatus === 'em_separacao';
    const wasPending = previousStatus === 'pendente' || previousStatus === 'aguardando_whatsapp';

    if (isNowPaid && wasPending) {
      console.log('📉 [Estoque] Baixando estoque para pedido confirmado:', orderId);
      // Converte reservas provisórias ativas ou pausadas da cliente em venda
      try {
        if (order.numero_pedido) {
          const cleanNum = String(order.numero_pedido).replace(/^#+/, '').trim();
          const searchTerms = Array.from(new Set([cleanNum, String(order.numero_pedido).trim()].filter(Boolean)));
          const orCondition = searchTerms.map((t) => `motivo.ilike.%${t}%`).join(',');

          await supabase
            .from('reservas_estoque')
            .update({ status: 'convertida_venda' })
            .eq('loja_id', lojaId)
            .in('status', ['ativa', 'pausada'])
            .or(orCondition);
        }
        if (phoneVariants.length > 0) {
          await supabase
            .from('reservas_estoque')
            .update({ status: 'convertida_venda' })
            .eq('loja_id', lojaId)
            .in('cliente_telefone', phoneVariants)
            .in('status', ['ativa', 'pausada']);
        }
      } catch {}
      for (const item of itens) {
        let prodId = item.produto_id;
        if (!prodId && item.nome_produto) {
          const { data: foundProd } = await supabase
            .from('produtos')
            .select('id')
            .eq('loja_id', lojaId)
            .ilike('nome', item.nome_produto)
            .limit(1)
            .maybeSingle();

          if (foundProd) {
            prodId = foundProd.id;
            await supabase.from('itens_pedido').update({ produto_id: prodId }).eq('id', item.id);
          }
        }

        if (prodId) {
          const { data: prod } = await supabase
            .from('produtos')
            .select('estoque_total')
            .eq('id', prodId)
            .single();

          if (prod) {
            const novoEstoque = Math.max(0, (prod.estoque_total || 0) - (item.quantidade || 1));
            await supabase
              .from('produtos')
              .update({ estoque_total: novoEstoque })
              .eq('id', prodId);
          }

          if (item.cor && item.tamanho) {
            const { data: vars } = await supabase
              .from('variacoes_produto')
              .select('id, estoque')
              .eq('produto_id', prodId)
              .ilike('cor_nome', item.cor.trim())
              .ilike('tamanho', item.tamanho.trim());

            if (vars && vars.length > 0) {
              const v = vars[0];
              const novoEstoqueVar = Math.max(0, (v.estoque || 0) - (item.quantidade || 1));
              await supabase
                .from('variacoes_produto')
                .update({ estoque: novoEstoqueVar })
                .eq('id', v.id);
            }
          }
        }
      }
    }

    // Se mudou para CANCELADO (e antes era pago ou em separação) -> Devolve estoque!
    const isNowCanceled = newStatus === 'cancelado';
    const wasPaidOrProcessing = previousStatus === 'pago' || previousStatus === 'em_separacao' || previousStatus === 'enviado';

    if (isNowCanceled) {
      // Libera reservas provisórias associadas à cliente
      try {
        if (order.numero_pedido) {
          const cleanNum = String(order.numero_pedido).replace(/^#+/, '').trim();
          const searchTerms = Array.from(new Set([cleanNum, String(order.numero_pedido).trim()].filter(Boolean)));
          const orCondition = searchTerms.map((t) => `motivo.ilike.%${t}%`).join(',');

          await supabase
            .from('reservas_estoque')
            .update({ status: 'liberada' })
            .eq('loja_id', lojaId)
            .in('status', ['ativa', 'pausada'])
            .or(orCondition);
        }
        if (phoneVariants.length > 0) {
          await supabase
            .from('reservas_estoque')
            .update({ status: 'liberada' })
            .eq('loja_id', lojaId)
            .in('cliente_telefone', phoneVariants)
            .in('status', ['ativa', 'pausada']);
        }
      } catch {}
    }

    if (isNowCanceled && wasPaidOrProcessing) {
      console.log('📈 [Estoque] Devolvendo estoque para pedido cancelado:', orderId);
      for (const item of itens) {
        let prodId = item.produto_id;
        if (!prodId && item.nome_produto) {
          const { data: foundProd } = await supabase
            .from('produtos')
            .select('id')
            .eq('loja_id', lojaId)
            .ilike('nome', item.nome_produto)
            .limit(1)
            .maybeSingle();

          if (foundProd) {
            prodId = foundProd.id;
            await supabase.from('itens_pedido').update({ produto_id: prodId }).eq('id', item.id);
          }
        }

        if (prodId) {
          const { data: prod } = await supabase
            .from('produtos')
            .select('estoque_total')
            .eq('id', prodId)
            .single();

          if (prod) {
            await supabase
              .from('produtos')
              .update({ estoque_total: (prod.estoque_total || 0) + (item.quantidade || 1) })
              .eq('id', prodId);
          }

          if (item.cor && item.tamanho) {
            const { data: vars } = await supabase
              .from('variacoes_produto')
              .select('id, estoque')
              .eq('produto_id', prodId)
              .ilike('cor_nome', item.cor.trim())
              .ilike('tamanho', item.tamanho.trim());

            if (vars && vars.length > 0) {
              const v = vars[0];
              await supabase
                .from('variacoes_produto')
                .update({ estoque: (v.estoque || 0) + (item.quantidade || 1) })
                .eq('id', v.id);
            }
          }
        }
      }
    }

    // 2. Atualiza status do pedido
    const { error } = await supabase
      .from('pedidos')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Falha ao atualizar status do pedido com estoque:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Libera manualmente a reserva provisória de um pedido (ex: cliente desistiu no WhatsApp).
 */
export async function releaseOrderReservation(
  orderId: string,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data: order, error: orderErr } = await supabase
      .from('pedidos')
      .select(`
        numero_pedido,
        cliente_id,
        endereco_entrega,
        clientes_loja (telefone)
      `)
      .eq('id', orderId)
      .single();

    if (orderErr) throw orderErr;

    const phoneVariants = getCustomerPhoneVariants(order);

    if (order?.numero_pedido) {
      await supabase
        .from('reservas_estoque')
        .update({ status: 'liberada' })
        .eq('loja_id', lojaId)
        .in('status', ['ativa', 'pausada'])
        .ilike('motivo', `%${order.numero_pedido}%`);
    }

    if (phoneVariants.length > 0) {
      await supabase
        .from('reservas_estoque')
        .update({ status: 'liberada' })
        .eq('loja_id', lojaId)
        .in('cliente_telefone', phoneVariants)
        .in('status', ['ativa', 'pausada']);
    }
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Falha ao liberar reserva do pedido:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Atualiza o status simples de um pedido na nuvem (retrocompatibilidade).
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  return updateAdminOrderStatusWithStock(orderId, newStatus);
}

/**
 * Cadastra ou altera o código de rastreio dos Correios de um pedido.
 */
export async function updateAdminOrderTracking(
  orderId: string,
  codigoRastreio: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const cleanCode = codigoRastreio.trim().toUpperCase();
    const { error } = await supabase
      .from('pedidos')
      .update({
        codigo_rastreio: cleanCode || null,
        status: cleanCode ? 'enviado' : 'em_separacao',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Falha ao atualizar rastreamento do pedido:', err);
    return { success: false, error: err?.message };
  }
}

export interface AdminCategoryFull {
  id: string;
  loja_id: string;
  nome: string;
  slug: string;
  display_order: number;
  subcategorias: string[];
  total_produtos: number;
}

export interface NavMenuSubOption {
  id: string;
  label: string;
  type: 'status' | 'category' | 'subcategory' | 'link' | 'fabric';
  value: string;
  extraCategory?: string;
  extraFabric?: string;
  customUrl?: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  type: 'status' | 'category' | 'subcategory' | 'link' | 'fabric';
  value: string;
  extraCategory?: string;
  extraFabric?: string;
  customUrl?: string;
  isSpecial?: boolean;
  badge?: {
    text: string;
    colorBg?: string;
    colorText?: string;
  };
  subOptions?: NavMenuSubOption[];
}

export interface StoreNavMenuConfig {
  linha_1: NavMenuItem[];
  linha_2: NavMenuItem[];
  gaveta_mobile: NavMenuItem[];
}

/**
 * Consulta a lista completa de categorias da loja.
 */
export async function getAdminCategories(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<Array<{ id: string; nome: string; slug: string }>> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, slug')
      .eq('loja_id', lojaId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Consulta categorias com subcategorias e contagem de produtos vinculados.
 */
export async function getAdminCategoriesFull(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<AdminCategoryFull[]> {
  const supabase = getSupabaseBrowserClient();
  try {
    const [catsRes, prodsRes, lojaRes] = await Promise.all([
      supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', lojaId)
        .order('display_order', { ascending: true }),
      supabase
        .from('produtos')
        .select('categoria_id, subcategoria')
        .eq('loja_id', lojaId),
      supabase
        .from('lojas')
        .select('configuracoes_visuais')
        .eq('id', lojaId)
        .single()
    ]);

    const rawCats = catsRes.data || [];
    const prods = prodsRes.data || [];
    const visuais = (lojaRes.data as any)?.configuracoes_visuais || {};
    const subcatsMap: Record<string, string[]> = visuais.subcategorias_por_categoria || {};

    const prodsCountByCat: Record<string, number> = {};
    prods.forEach((p) => {
      if (p.categoria_id) {
        prodsCountByCat[p.categoria_id] = (prodsCountByCat[p.categoria_id] || 0) + 1;
      }
    });

    return rawCats.map((c) => ({
      id: c.id,
      loja_id: c.loja_id,
      nome: c.nome,
      slug: c.slug,
      display_order: Number(c.display_order ?? 0),
      subcategorias: Array.isArray(subcatsMap[c.id]) ? subcatsMap[c.id] : [],
      total_produtos: prodsCountByCat[c.id] || 0
    }));
  } catch (err) {
    console.error('❌ [Admin] Falha ao carregar categorias completas:', err);
    return [];
  }
}

/**
 * Cria ou atualiza uma categoria e suas subcategorias vinculadas.
 */
export async function saveAdminCategory(
  lojaId: string = DEFAULT_TENANT_ID,
  payload: {
    id?: string;
    nome: string;
    slug?: string;
    display_order?: number;
    subcategorias?: string[];
  }
): Promise<{ success: boolean; data?: AdminCategoryFull; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const nomeLimpo = payload.nome.trim();
    if (!nomeLimpo) {
      return { success: false, error: 'O nome da categoria é obrigatório.' };
    }

    const slug = (
      payload.slug?.trim() ||
      nomeLimpo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );

    let savedId = payload.id;

    if (savedId) {
      const { error: upErr } = await supabase
        .from('categorias')
        .update({
          nome: nomeLimpo,
          slug,
          ...(payload.display_order !== undefined ? { display_order: payload.display_order } : {})
        })
        .eq('id', savedId)
        .eq('loja_id', lojaId);

      if (upErr) throw upErr;
    } else {
      let order = payload.display_order;
      if (order === undefined) {
        const { data: lastCats } = await supabase
          .from('categorias')
          .select('display_order')
          .eq('loja_id', lojaId)
          .order('display_order', { ascending: false })
          .limit(1);
        order = ((lastCats?.[0]?.display_order ?? 0) as number) + 10;
      }

      const { data: insData, error: insErr } = await supabase
        .from('categorias')
        .insert({
          loja_id: lojaId,
          nome: nomeLimpo,
          slug,
          display_order: order
        })
        .select()
        .single();

      if (insErr) throw insErr;
      savedId = insData.id;
    }

    // Atualiza o mapa de subcategorias no JSONB da loja
    if (savedId && payload.subcategorias !== undefined) {
      const { data: loja } = await supabase
        .from('lojas')
        .select('configuracoes_visuais')
        .eq('id', lojaId)
        .single();

      const visuais = (loja as any)?.configuracoes_visuais || {};
      const currentSubMap = { ...(visuais.subcategorias_por_categoria || {}) };
      currentSubMap[savedId] = Array.from(new Set(payload.subcategorias.map((s) => s.trim()).filter(Boolean)));

      await supabase
        .from('lojas')
        .update({
          configuracoes_visuais: {
            ...visuais,
            subcategorias_por_categoria: currentSubMap
          }
        })
        .eq('id', lojaId);
    }

    clearTenantCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:categories_updated'));
      window.dispatchEvent(new CustomEvent('bcomm:tenant_updated', { detail: { lojaId } }));
    }

    return {
      success: true,
      data: {
        id: savedId!,
        loja_id: lojaId,
        nome: nomeLimpo,
        slug,
        display_order: payload.display_order ?? 0,
        subcategorias: payload.subcategorias || [],
        total_produtos: 0
      }
    };
  } catch (err: any) {
    console.error('❌ [Admin] Falha ao salvar categoria:', err);
    return { success: false, error: err?.message || 'Falha ao salvar categoria.' };
  }
}

/**
 * Remove uma categoria da loja e limpa suas subcategorias.
 */
export async function deleteAdminCategory(
  catId: string,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { error: delErr } = await supabase
      .from('categorias')
      .delete()
      .eq('id', catId)
      .eq('loja_id', lojaId);

    if (delErr) throw delErr;

    // Remove do JSONB de subcategorias
    const { data: loja } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    const visuais = (loja as any)?.configuracoes_visuais || {};
    if (visuais.subcategorias_por_categoria && visuais.subcategorias_por_categoria[catId]) {
      const updatedMap = { ...visuais.subcategorias_por_categoria };
      delete updatedMap[catId];
      await supabase
        .from('lojas')
        .update({
          configuracoes_visuais: {
            ...visuais,
            subcategorias_por_categoria: updatedMap
          }
        })
        .eq('id', lojaId);
    }

    clearTenantCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:categories_updated'));
      window.dispatchEvent(new CustomEvent('bcomm:tenant_updated', { detail: { lojaId } }));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Admin] Falha ao excluir categoria:', err);
    return { success: false, error: err?.message || 'Falha ao excluir categoria.' };
  }
}

/**
 * Reordena categorias no banco de dados.
 */
export async function reorderAdminCategories(
  lojaId: string = DEFAULT_TENANT_ID,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('categorias')
          .update({ display_order: (index + 1) * 10 })
          .eq('id', id)
          .eq('loja_id', lojaId)
      )
    );

    clearTenantCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:categories_updated'));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Admin] Falha ao reordenar categorias:', err);
    return { success: false, error: err?.message || 'Falha ao reordenar categorias.' };
  }
}

/**
 * Estrutura padrão de fábrica dos Menus da Boutique.
 */
export function getDefaultStoreNavMenuConfig(): StoreNavMenuConfig {
  return {
    linha_1: [
      {
        id: 'nav-l1-1',
        label: 'Lançamento 2026',
        type: 'status',
        value: 'Lançamento',
        badge: { text: 'NOVO', colorBg: 'bg-[#C5A059]', colorText: 'text-white' },
        subOptions: [
          { id: 'sub-l1-1-1', label: 'Ver Todos os Lançamentos', type: 'status', value: 'Lançamento' },
          { id: 'sub-l1-1-2', label: 'Calças', type: 'status', value: 'Lançamento', extraCategory: 'Calças' },
          { id: 'sub-l1-1-3', label: 'Vestidos & Macacões', type: 'status', value: 'Lançamento', extraCategory: 'Vestidos & Macacões' },
          { id: 'sub-l1-1-4', label: 'Casacos & Jaquetas', type: 'status', value: 'Lançamento', extraCategory: 'Casacos & Jaquetas' },
          { id: 'sub-l1-1-5', label: 'Blazers & Alfaiataria', type: 'status', value: 'Lançamento', extraCategory: 'Blazers & Alfaiataria' },
          { id: 'sub-l1-1-6', label: 'Conjuntos Exclusivos', type: 'status', value: 'Lançamento', extraCategory: 'Conjuntos Exclusivos' }
        ]
      },
      {
        id: 'nav-l1-2',
        label: 'Acessórios',
        type: 'category',
        value: 'Acessórios',
        subOptions: [
          { id: 'sub-l1-2-1', label: 'Ver Todos os Acessórios', type: 'category', value: 'Acessórios' },
          { id: 'sub-l1-2-2', label: 'Bolsas & Carteiras', type: 'category', value: 'Bolsas & Carteiras' },
          { id: 'sub-l1-2-3', label: 'Cintos', type: 'category', value: 'Cintos' },
          { id: 'sub-l1-2-4', label: 'Colares & Joias', type: 'category', value: 'Colares & Joias' },
          { id: 'sub-l1-2-5', label: 'Lenços', type: 'category', value: 'Lenços' },
          { id: 'sub-l1-2-6', label: 'Óculos de Sol', type: 'category', value: 'Óculos de Sol' }
        ]
      },
      {
        id: 'nav-l1-3',
        label: 'Tricots',
        type: 'category',
        value: 'Tricots',
        subOptions: [
          { id: 'sub-l1-3-1', label: 'Ver Todos os Tricots', type: 'category', value: 'Tricots' },
          { id: 'sub-l1-3-2', label: 'Casacos em Tricot Biamar', type: 'category', value: 'Casacos & Jaquetas', extraFabric: 'Tricot Biamar' },
          { id: 'sub-l1-3-3', label: 'Blusas em Tricot Especial', type: 'category', value: 'Blusas & Tops', extraFabric: 'Tricot Biamar' }
        ]
      },
      {
        id: 'nav-l1-4',
        label: 'Linho Nobre',
        type: 'fabric',
        value: 'Linho Puro',
        subOptions: [
          { id: 'sub-l1-4-1', label: 'Ver Todas as Peças em Linho', type: 'fabric', value: 'Linho Puro' },
          { id: 'sub-l1-4-2', label: 'Conjuntos em Linho', type: 'category', value: 'Conjuntos Exclusivos', extraFabric: 'Linho Puro' },
          { id: 'sub-l1-4-3', label: 'Alfaiataria em Linho', type: 'category', value: 'Blazers & Alfaiataria', extraFabric: 'Linho Puro' }
        ]
      },
      { id: 'nav-l1-5', label: 'Blusas', type: 'category', value: 'Blusas' },
      { id: 'nav-l1-6', label: 'Calças', type: 'category', value: 'Calças' }
    ],
    linha_2: [
      { id: 'nav-l2-1', label: 'Alfaiataria', type: 'category', value: 'Alfaiataria' },
      { id: 'nav-l2-2', label: 'Vestidos', type: 'category', value: 'Vestidos' },
      { id: 'nav-l2-3', label: 'Jaquetas E Casacos', type: 'category', value: 'Jaquetas E Casacos' },
      { id: 'nav-l2-4', label: 'Shorts E Saias', type: 'category', value: 'Shorts E Saias' },
      { id: 'nav-l2-5', label: 'Vestidos E Macacões', type: 'category', value: 'Vestidos E Macacões' },
      { id: 'nav-l2-6', label: 'BAZAR', type: 'status', value: 'OUTLET', isSpecial: true, badge: { text: 'OFF', colorBg: 'bg-rose-500', colorText: 'text-white' } },
      { id: 'nav-l2-7', label: 'Últimas Peças', type: 'status', value: 'Últimas Peças', isSpecial: true }
    ],
    gaveta_mobile: [
      {
        id: 'drw-1',
        label: 'Lançamento 2026',
        type: 'status',
        value: 'Lançamento',
        badge: { text: 'NOVO', colorBg: 'bg-[#C5A059]', colorText: 'text-white' },
        subOptions: [
          { id: 'sub-drw-1-1', label: 'Ver Todos os Lançamentos', type: 'status', value: 'Lançamento' },
          { id: 'sub-drw-1-2', label: 'Calças', type: 'status', value: 'Lançamento', extraCategory: 'Calças' },
          { id: 'sub-drw-1-3', label: 'Vestidos & Macacões', type: 'status', value: 'Lançamento', extraCategory: 'Vestidos & Macacões' },
          { id: 'sub-drw-1-4', label: 'Casacos & Jaquetas', type: 'status', value: 'Lançamento', extraCategory: 'Casacos & Jaquetas' },
          { id: 'sub-drw-1-5', label: 'Blazers & Alfaiataria', type: 'status', value: 'Lançamento', extraCategory: 'Blazers & Alfaiataria' },
          { id: 'sub-drw-1-6', label: 'Conjuntos Exclusivos', type: 'status', value: 'Lançamento', extraCategory: 'Conjuntos Exclusivos' }
        ]
      },
      {
        id: 'drw-2',
        label: 'Acessórios',
        type: 'category',
        value: 'Acessórios',
        subOptions: [
          { id: 'sub-drw-2-1', label: 'Ver Todos os Acessórios', type: 'category', value: 'Acessórios' },
          { id: 'sub-drw-2-2', label: 'Bolsas & Carteiras', type: 'category', value: 'Bolsas & Carteiras' },
          { id: 'sub-drw-2-3', label: 'Cintos', type: 'category', value: 'Cintos' },
          { id: 'sub-drw-2-4', label: 'Colares & Joias', type: 'category', value: 'Colares & Joias' },
          { id: 'sub-drw-2-5', label: 'Lenços', type: 'category', value: 'Lenços' },
          { id: 'sub-drw-2-6', label: 'Óculos de Sol', type: 'category', value: 'Óculos de Sol' }
        ]
      },
      {
        id: 'drw-3',
        label: 'Tricots',
        type: 'category',
        value: 'Tricots',
        subOptions: [
          { id: 'sub-drw-3-1', label: 'Ver Todos os Tricots', type: 'category', value: 'Tricots' },
          { id: 'sub-drw-3-2', label: 'Casacos em Tricot Biamar', type: 'category', value: 'Casacos & Jaquetas', extraFabric: 'Tricot Biamar' },
          { id: 'sub-drw-3-3', label: 'Blusas em Tricot Especial', type: 'category', value: 'Blusas & Tops', extraFabric: 'Tricot Biamar' }
        ]
      },
      {
        id: 'drw-4',
        label: 'Linho Nobre',
        type: 'fabric',
        value: 'Linho Puro',
        subOptions: [
          { id: 'sub-drw-4-1', label: 'Ver Todas as Peças em Linho', type: 'fabric', value: 'Linho Puro' },
          { id: 'sub-drw-4-2', label: 'Conjuntos em Linho', type: 'category', value: 'Conjuntos Exclusivos', extraFabric: 'Linho Puro' },
          { id: 'sub-drw-4-3', label: 'Alfaiataria em Linho', type: 'category', value: 'Blazers & Alfaiataria', extraFabric: 'Linho Puro' }
        ]
      },
      { id: 'drw-5', label: 'Blusas', type: 'category', value: 'Blusas' },
      { id: 'drw-6', label: 'Calças', type: 'category', value: 'Calças' },
      { id: 'drw-7', label: 'Alfaiataria', type: 'category', value: 'Alfaiataria' },
      { id: 'drw-8', label: 'Vestidos', type: 'category', value: 'Vestidos' },
      { id: 'drw-9', label: 'Jaquetas E Casacos', type: 'category', value: 'Jaquetas E Casacos' },
      { id: 'drw-10', label: 'Shorts E Saias', type: 'category', value: 'Shorts E Saias' },
      { id: 'drw-11', label: 'Vestidos E Macacões', type: 'category', value: 'Vestidos E Macacões' },
      { id: 'drw-12', label: 'BAZAR', type: 'status', value: 'OUTLET', isSpecial: true, badge: { text: 'OFF', colorBg: 'bg-rose-500', colorText: 'text-white' } },
      { id: 'drw-13', label: 'Últimas Peças', type: 'status', value: 'Últimas Peças', isSpecial: true }
    ]
  };
}

/**
 * Consulta a configuração completa de menus da loja no Supabase.
 */
export async function getStoreNavMenuConfig(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<StoreNavMenuConfig> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data: loja, error } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    if (error || !loja) return getDefaultStoreNavMenuConfig();

    const vis = (loja as any)?.configuracoes_visuais || {};
    if (vis.menu_navegacao && Array.isArray(vis.menu_navegacao.linha_1)) {
      return {
        linha_1: vis.menu_navegacao.linha_1,
        linha_2: Array.isArray(vis.menu_navegacao.linha_2) ? vis.menu_navegacao.linha_2 : [],
        gaveta_mobile: Array.isArray(vis.menu_navegacao.gaveta_mobile) ? vis.menu_navegacao.gaveta_mobile : []
      };
    }

    return getDefaultStoreNavMenuConfig();
  } catch (err) {
    console.error('❌ [Admin] Falha ao consultar menu da loja:', err);
    return getDefaultStoreNavMenuConfig();
  }
}

/**
 * Salva a configuração de menus da loja no Supabase.
 */
export async function saveStoreNavMenuConfig(
  lojaId: string = DEFAULT_TENANT_ID,
  config: StoreNavMenuConfig
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data: loja, error: getErr } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    if (getErr) throw getErr;

    const currentVis = (loja as any)?.configuracoes_visuais || {};
    const updatedVis = {
      ...currentVis,
      menu_navegacao: config
    };

    const { error: upErr } = await supabase
      .from('lojas')
      .update({ configuracoes_visuais: updatedVis })
      .eq('id', lojaId);

    if (upErr) throw upErr;

    clearTenantCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:menu_updated', { detail: config }));
      window.dispatchEvent(new CustomEvent('bcomm:tenant_updated', { detail: { lojaId } }));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Admin] Falha ao salvar menu da loja:', err);
    return { success: false, error: err?.message || 'Falha ao salvar menu.' };
  }
}

/**
 * Consulta a lista completa de produtos do lojista para gestão.
 */
export async function getAdminProducts(lojaId: string = DEFAULT_TENANT_ID): Promise<AdminProductItem[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        slug,
        descricao,
        preco,
        preco_promocional,
        preco_custo,
        tecido,
        modelagem,
        linha,
        destaque,
        mais_vendido,
        outlet,
        ultimas_pecas,
        estoque_total,
        ativo,
        foto_principal,
        categoria_id,
        subcategoria,
        paired_with_slug,
        detalhes,
        categorias (nome),
        variacoes_produto (*),
        midias_produto (*)
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      descricao: p.descricao,
      preco: Number(p.preco),
      preco_promocional: p.preco_promocional ? Number(p.preco_promocional) : null,
      preco_custo: p.preco_custo ? Number(p.preco_custo) : null,
      tecido: p.tecido,
      modelagem: p.modelagem,
      linha: p.linha,
      destaque: Boolean(p.destaque),
      mais_vendido: Boolean(p.mais_vendido),
      outlet: Boolean(p.outlet),
      ultimas_pecas: Boolean(p.ultimas_pecas),
      estoque_total: p.estoque_total || 0,
      ativo: Boolean(p.ativo),
      foto_principal: p.foto_principal,
      categoria_id: p.categoria_id,
      categoria_nome: p.categorias?.nome || 'Geral',
      subcategoria: p.subcategoria || null,
      paired_with_slug: p.paired_with_slug || null,
      detalhes: Array.isArray(p.detalhes) ? p.detalhes : null,
      midias: (p.midias_produto || []).map((m: any) => ({
        id: m.id,
        url: m.url,
        tipo: m.tipo,
        display_order: m.display_order || 0,
        label: m.label
      })),
      variacoes: (p.variacoes_produto || []).map((v: any) => ({
        id: v.id,
        cor_nome: v.cor_nome,
        cor_hex: v.cor_hex,
        tamanho: v.tamanho,
        estoque: v.estoque,
        sku: v.sku
      }))
    }));
  } catch (err) {
    console.error('❌ [Supabase] Erro ao carregar produtos no admin:', err);
    return [];
  }
}

/**
 * Cadastra um novo produto completo com variações e fotos no Supabase.
 */
export async function createAdminProduct(
  input: CreateProductInput,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; product?: any; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    let catId = input.categoria_id;

    // Se foi digitada uma nova categoria
    if (!catId && input.nova_categoria_nome?.trim()) {
      const catSlug = input.nova_categoria_nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: newCat, error: catErr } = await supabase
        .from('categorias')
        .insert({
          loja_id: lojaId,
          nome: input.nova_categoria_nome.trim(),
          slug: catSlug
        })
        .select('id')
        .single();

      if (!catErr && newCat) {
        catId = newCat.id;
      }
    }

    const slug =
      input.slug?.trim() ||
      input.nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // 1. Inserir produto principal
    const { data: product, error: prodErr } = await supabase
      .from('produtos')
      .insert({
        loja_id: lojaId,
        categoria_id: catId || null,
        subcategoria: input.subcategoria || null,
        nome: input.nome.trim(),
        slug: slug,
        descricao: input.descricao || null,
        preco: Number(input.preco),
        preco_promocional: input.preco_promocional ? Number(input.preco_promocional) : null,
        preco_custo: input.preco_custo ? Number(input.preco_custo) : null,
        tecido: input.tecido || null,
        modelagem: input.modelagem || null,
        linha: input.linha || null,
        destaque: Boolean(input.destaque),
        mais_vendido: Boolean(input.mais_vendido),
        outlet: Boolean(input.outlet),
        ultimas_pecas: Boolean(input.ultimas_pecas),
        estoque_total: Number(input.estoque_total || 0),
        foto_principal: input.foto_principal || (input.fotos && input.fotos[0]) || null,
        ativo: true
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // 2. Inserir variações se houver grade
    if (input.tem_grade && input.variacoes && input.variacoes.length > 0) {
      const variacoesData = input.variacoes.map((v) => ({
        loja_id: lojaId,
        produto_id: product.id,
        cor_nome: v.cor_nome || 'Padrão',
        cor_hex: v.cor_hex || '#000000',
        tamanho: v.tamanho || 'U',
        estoque: Number(v.estoque || 0),
        sku: v.sku || `${slug}-${v.cor_nome}-${v.tamanho}`.toUpperCase()
      }));

      await supabase.from('variacoes_produto').insert(variacoesData);
    }

    // 3. Inserir fotos e vídeos em midias_produto
    const midiasData: any[] = [];
    if (input.fotos && input.fotos.length > 0) {
      input.fotos.forEach((url, idx) => {
        midiasData.push({
          loja_id: lojaId,
          produto_id: product.id,
          tipo: 'image',
          url: url,
          label: idx === 0 ? 'Capa Principal' : `Foto ${idx + 1}`,
          display_order: idx
        });
      });
    }

    if (input.video_provador_url?.trim()) {
      midiasData.push({
        loja_id: lojaId,
        produto_id: product.id,
        tipo: 'video',
        url: input.video_provador_url.trim(),
        label: 'Vídeo de Provador (9:16)',
        display_order: 99
      });
    }

    if (midiasData.length > 0) {
      await supabase.from('midias_produto').insert(midiasData);
    }

    return { success: true, product };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao criar produto:', err);
    return { success: false, error: err?.message || 'Falha ao cadastrar produto' };
  }
}

/**
 * Checa quantos pedidos utilizam este produto (para decidir entre arquivar ou excluir).
 */
export async function checkProductOrdersCount(
  productId: string
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { count, error } = await supabase
      .from('itens_pedido')
      .select('*', { count: 'exact', head: true })
      .eq('produto_id', productId);

    if (error) throw error;
    return { count: count || 0 };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao checar pedidos do produto:', err);
    return { count: 0, error: err?.message };
  }
}

/**
 * Exclui ou arquiva um produto com segurança contábil e transparência operacional.
 */
export async function deleteAdminProduct(
  productId: string
): Promise<{ success: boolean; action?: 'archived' | 'deleted'; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Checa se o produto tem pedidos atrelados
    const { count: pedidosCount } = await supabase
      .from('itens_pedido')
      .select('*', { count: 'exact', head: true })
      .eq('produto_id', productId);

    if (pedidosCount && pedidosCount > 0) {
      // Soft delete: arquiva e desativa da vitrine para proteger integridade contábil
      const { error } = await supabase
        .from('produtos')
        .update({
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      return { success: true, action: 'archived' };
    }

    // 2. Se nunca foi vendido, pode excluir com segurança física
    await supabase.from('midias_produto').delete().eq('produto_id', productId);
    await supabase.from('variacoes_produto').delete().eq('produto_id', productId);
    const { error: delErr } = await supabase.from('produtos').delete().eq('id', productId);
    if (delErr) throw delErr;

    return { success: true, action: 'deleted' };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao excluir produto:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Atualiza o cadastro COMPLETO de um produto: dados gerais, tecidos, categorias,
 * grade de variações (cores/tamanhos), mídias (fotos R2 e reels 9:16) e cross-sell.
 */
export async function updateAdminProductFull(
  input: UpdateProductInput
): Promise<{ success: boolean; product?: any; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Atualizar a tabela 'produtos'
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };

    if (input.nome !== undefined) updateFields.nome = input.nome.trim();
    if (input.slug !== undefined) updateFields.slug = input.slug.trim().toLowerCase();
    if (input.categoria_id !== undefined) updateFields.categoria_id = input.categoria_id;
    if (input.subcategoria !== undefined) updateFields.subcategoria = input.subcategoria;
    if (input.descricao !== undefined) updateFields.descricao = input.descricao;
    if (input.preco !== undefined) updateFields.preco = Number(input.preco);
    if (input.preco_promocional !== undefined) updateFields.preco_promocional = input.preco_promocional;
    if (input.preco_custo !== undefined) updateFields.preco_custo = input.preco_custo;
    if (input.tecido !== undefined) updateFields.tecido = input.tecido;
    if (input.modelagem !== undefined) updateFields.modelagem = input.modelagem;
    if (input.linha !== undefined) updateFields.linha = input.linha;
    if (input.destaque !== undefined) updateFields.destaque = Boolean(input.destaque);
    if (input.mais_vendido !== undefined) updateFields.mais_vendido = Boolean(input.mais_vendido);
    if (input.outlet !== undefined) updateFields.outlet = Boolean(input.outlet);
    if (input.ultimas_pecas !== undefined) updateFields.ultimas_pecas = Boolean(input.ultimas_pecas);
    if (input.paired_with_slug !== undefined) updateFields.paired_with_slug = input.paired_with_slug;
    if (input.detalhes !== undefined) updateFields.detalhes = input.detalhes;
    if (input.foto_principal !== undefined) updateFields.foto_principal = input.foto_principal;

    const { data: updatedProd, error: prodErr } = await supabase
      .from('produtos')
      .update(updateFields)
      .eq('id', input.id)
      .select('*')
      .single();

    if (prodErr) throw prodErr;

    // 2. Sincronizar grade de variações (se enviada)
    if (input.variacoes && Array.isArray(input.variacoes)) {
      const { data: existingVars } = await supabase
        .from('variacoes_produto')
        .select('id')
        .eq('produto_id', input.id);

      const existingIds = new Set((existingVars || []).map((v) => v.id));
      const incomingIds = new Set(input.variacoes.filter((v) => v.id && !v.id.startsWith('temp_')).map((v) => v.id!));

      // 2a. Deletar variações removidas pelo usuário
      const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('variacoes_produto').delete().in('id', toDelete);
      }

      // 2b. Atualizar existentes e inserir novas
      let totalEstoqueCalc = 0;
      for (const v of input.variacoes) {
        const est = Number(v.estoque || 0);
        totalEstoqueCalc += est;

        const isNew = !v.id || v.id.startsWith('temp_');
        if (isNew) {
          await supabase.from('variacoes_produto').insert({
            loja_id: input.loja_id || updatedProd.loja_id,
            produto_id: input.id,
            cor_nome: v.cor_nome || 'Padrão',
            cor_hex: v.cor_hex || '#111111',
            tamanho: v.tamanho || 'U',
            estoque: est,
            sku: v.sku || `${updatedProd.slug}-${v.cor_nome}-${v.tamanho}`.toUpperCase()
          });
        } else {
          await supabase
            .from('variacoes_produto')
            .update({
              cor_nome: v.cor_nome,
              cor_hex: v.cor_hex,
              tamanho: v.tamanho,
              estoque: est,
              sku: v.sku || undefined
            })
            .eq('id', v.id);
        }
      }

      // 2c. Atualiza estoque_total recalculado em produtos
      await supabase
        .from('produtos')
        .update({ estoque_total: totalEstoqueCalc })
        .eq('id', input.id);
    }

    // 3. Sincronizar Mídias (se enviadas)
    if (input.fotos && Array.isArray(input.fotos)) {
      // Remove mídias anteriores e insere a lista atualizada com a nova ordenação
      await supabase.from('midias_produto').delete().eq('produto_id', input.id);

      const midiasToInsert = input.fotos.map((f, idx) => ({
        loja_id: input.loja_id || updatedProd.loja_id,
        produto_id: input.id,
        tipo: f.tipo || 'image',
        url: f.url,
        label: f.label || (idx === 0 ? 'Capa Principal' : `Foto ${idx + 1}`),
        display_order: f.display_order !== undefined ? f.display_order : idx
      }));

      if (input.video_provador_url?.trim()) {
        midiasToInsert.push({
          loja_id: input.loja_id || updatedProd.loja_id,
          produto_id: input.id,
          tipo: 'video',
          url: input.video_provador_url.trim(),
          label: 'Vídeo de Provador (9:16)',
          display_order: 99
        });
      }

      if (midiasToInsert.length > 0) {
        await supabase.from('midias_produto').insert(midiasToInsert);

        // Garante que a primeira foto válida vire a foto_principal
        const firstPhoto = midiasToInsert.find((m) => m.tipo === 'image');
        if (firstPhoto) {
          await supabase
            .from('produtos')
            .update({ foto_principal: firstPhoto.url })
            .eq('id', input.id);
        }
      }
    }

    return { success: true, product: updatedProd };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao atualizar cadastro completo da peça:', err);
    return { success: false, error: err?.message || 'Falha ao salvar alterações' };
  }
}

/**
 * Ações em Massa: Ativar ou pausar múltiplos produtos na vitrine.
 */
export async function bulkToggleProductActive(
  productIds: string[],
  novoStatus: boolean
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds);

    if (error) throw error;
    return { success: true, count: productIds.length };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alternar status em massa:', err);
    return { success: false, count: 0, error: err?.message };
  }
}

/**
 * Ações em Massa: Aplicar percentual de desconto promocional em lote.
 */
export async function bulkApplyDiscount(
  productIds: string[],
  discountPercent: number
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: prods, error: getErr } = await supabase
      .from('produtos')
      .select('id, preco')
      .in('id', productIds);

    if (getErr) throw getErr;

    for (const p of prods || []) {
      const precoOriginal = Number(p.preco || 0);
      const novoPromo = discountPercent > 0
        ? Number((precoOriginal * (1 - discountPercent / 100)).toFixed(2))
        : null;

      await supabase
        .from('produtos')
        .update({
          preco_promocional: novoPromo,
          outlet: discountPercent > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);
    }

    return { success: true, count: (prods || []).length };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao aplicar desconto em lote:', err);
    return { success: false, count: 0, error: err?.message };
  }
}

/**
 * Ações em Massa: Mover múltiplos produtos para uma categoria.
 */
export async function bulkUpdateCategory(
  productIds: string[],
  categoryId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('produtos')
      .update({
        categoria_id: categoryId,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds);

    if (error) throw error;
    return { success: true, count: productIds.length };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao mover categoria em lote:', err);
    return { success: false, count: 0, error: err?.message };
  }
}

/**
 * Ações em Massa: Arquivar múltiplos produtos da vitrine com segurança.
 */
export async function bulkArchiveProducts(
  productIds: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds);

    if (error) throw error;
    return { success: true, count: productIds.length };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao arquivar produtos em lote:', err);
    return { success: false, count: 0, error: err?.message };
  }
}

/**
 * Alterna a ativação (pausa / ativação) de um produto na vitrine.
 */
export async function toggleAdminProductActive(
  productId: string,
  novoStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alterar status do produto:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Atualiza preço, preço de custo e estoque geral de um produto.
 */
export async function updateAdminProductDetails(
  productId: string,
  preco: number,
  precoPromocional: number | null,
  estoqueTotal: number,
  precoCusto?: number | null,
  promotionalFlags?: {
    destaque?: boolean;
    mais_vendido?: boolean;
    outlet?: boolean;
    ultimas_pecas?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const updatePayload: any = {
      preco,
      preco_promocional: precoPromocional,
      estoque_total: estoqueTotal,
      updated_at: new Date().toISOString()
    };

    if (precoCusto !== undefined) {
      updatePayload.preco_custo = precoCusto;
    }

    if (promotionalFlags) {
      if (promotionalFlags.destaque !== undefined) updatePayload.destaque = promotionalFlags.destaque;
      if (promotionalFlags.mais_vendido !== undefined) updatePayload.mais_vendido = promotionalFlags.mais_vendido;
      if (promotionalFlags.outlet !== undefined) updatePayload.outlet = promotionalFlags.outlet;
      if (promotionalFlags.ultimas_pecas !== undefined) updatePayload.ultimas_pecas = promotionalFlags.ultimas_pecas;
    }

    const { error } = await supabase
      .from('produtos')
      .update(updatePayload)
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao atualizar detalhes do produto:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Atualiza o estoque físico de uma variação (cor/tamanho) e sincroniza o estoque total do produto.
 */
export async function updateAdminVariationStock(
  variationId: string,
  productId: string,
  novoEstoque: number
): Promise<{ success: boolean; novoEstoqueTotal?: number; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const validStock = Math.max(0, Number(novoEstoque) || 0);

    // 1. Atualiza a variação específica
    const { error: varErr } = await supabase
      .from('variacoes_produto')
      .update({ estoque: validStock })
      .eq('id', variationId);

    if (varErr) throw varErr;

    // 2. Busca todas as variações para recalcular a soma do estoque do produto pai
    const { data: allVars, error: sumErr } = await supabase
      .from('variacoes_produto')
      .select('estoque')
      .eq('produto_id', productId);

    if (sumErr) throw sumErr;

    const totalEstoque = (allVars || []).reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);

    // 3. Atualiza o produto pai com a soma real da grade
    const { error: prodErr } = await supabase
      .from('produtos')
      .update({ estoque_total: totalEstoque, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (prodErr) throw prodErr;

    return { success: true, novoEstoqueTotal: totalEstoque };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao atualizar estoque da variação:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Calcula métricas do DRE Financeiro (Receita, CMV, Despesas e Lucro Líquido Real).
 */
export async function getAdminFinanceMetrics(
  lojaId: string = DEFAULT_TENANT_ID,
  periodo: 'hoje' | '7dias' | 'mes' | 'tudo' = 'tudo'
): Promise<FinanceMetrics> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Busca configurações financeiras da loja
    const { data: store } = await supabase
      .from('lojas')
      .select('configuracoes_financeiras')
      .eq('id', lojaId)
      .single();

    const configFin = (store?.configuracoes_financeiras as any) || {
      taxa_cartao_padrao: 3.5,
      custo_embalagem_padrao: 8.0
    };

    const taxaPercent = Number(configFin.taxa_cartao_padrao || 3.5);
    const embalagemFixa = Number(configFin.custo_embalagem_padrao || 8.0);

    // 2. Busca pedidos faturados
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido (*)
      `)
      .eq('loja_id', lojaId)
      .neq('status', 'cancelado');

    if (periodo === 'hoje') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('created_at', today.toISOString());
    } else if (periodo === '7dias') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      query = query.gte('created_at', date.toISOString());
    } else if (periodo === 'mes') {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      query = query.gte('created_at', date.toISOString());
    }

    const { data: pedidos, error } = await query;
    if (error) throw error;

    const pedidosList = pedidos || [];
    const faturamentoBruto = pedidosList.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const totalPedidosFaturados = pedidosList.length;

    // 3. Coleta preços de custo dos produtos
    const { data: produtosData } = await supabase
      .from('produtos')
      .select('id, nome, preco, preco_custo')
      .eq('loja_id', lojaId);

    const custoMap: Record<string, number> = {};
    const custoMapByName: Record<string, number> = {};
    (produtosData || []).forEach((p) => {
      const c = p.preco_custo !== null && p.preco_custo !== undefined ? Number(p.preco_custo) : Number(p.preco) * 0.4;
      custoMap[p.id] = c;
      if (p.nome) custoMapByName[p.nome.toLowerCase().trim()] = c;
    });

    let totalPecasVendidas = 0;
    let cmvTotal = 0;
    const produtosMap: Record<string, { nome: string; quantidadeVendida: number; faturamento: number; lucro: number }> = {};

    for (const p of pedidosList) {
      const itens = p.itens_pedido || [];
      for (const item of itens) {
        const qtd = Number(item.quantidade || 1);
        const precoUnit = Number(item.preco_unitario || 0);
        const nameKey = item.nome_produto?.toLowerCase().trim();
        const custoUnit =
          item.produto_id && custoMap[item.produto_id] !== undefined
            ? custoMap[item.produto_id]
            : nameKey && custoMapByName[nameKey] !== undefined
            ? custoMapByName[nameKey]
            : precoUnit * 0.4;

        totalPecasVendidas += qtd;
        cmvTotal += custoUnit * qtd;

        const key = item.nome_produto || 'Peça de Luxo';
        if (!produtosMap[key]) {
          produtosMap[key] = { nome: key, quantidadeVendida: 0, faturamento: 0, lucro: 0 };
        }
        produtosMap[key].quantidadeVendida += qtd;
        produtosMap[key].faturamento += precoUnit * qtd;
        produtosMap[key].lucro += (precoUnit - custoUnit) * qtd;
      }
    }

    // Despesas operacionais estimadas
    const despesasTaxas = (faturamentoBruto * taxaPercent) / 100;
    const despesasEmbalagens = totalPedidosFaturados * embalagemFixa;
    const despesasOperacionais = despesasTaxas + despesasEmbalagens;

    const lucroLiquido = Math.max(0, faturamentoBruto - cmvTotal - despesasOperacionais);
    const margemLiquidaPercent = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;
    const ticketMedio = totalPedidosFaturados > 0 ? faturamentoBruto / totalPedidosFaturados : 0;

    const topProdutos = Object.values(produtosMap)
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5);

    return {
      faturamentoBruto,
      cmvTotal,
      despesasOperacionais,
      lucroLiquido,
      margemLiquidaPercent,
      ticketMedio,
      totalPecasVendidas,
      totalPedidosFaturados,
      taxaCartaoPadrao: taxaPercent,
      custoEmbalagemPadrao: embalagemFixa,
      topProdutos
    };
  } catch (err) {
    console.error('❌ [Supabase] Erro ao calcular métricas financeiras:', err);
    return {
      faturamentoBruto: 0,
      cmvTotal: 0,
      despesasOperacionais: 0,
      lucroLiquido: 0,
      margemLiquidaPercent: 0,
      ticketMedio: 0,
      totalPecasVendidas: 0,
      totalPedidosFaturados: 0,
      taxaCartaoPadrao: 3.5,
      custoEmbalagemPadrao: 8.0,
      topProdutos: []
    };
  }
}

/**
 * Consulta a lista completa de clientes e leads da loja (CRM).
 */
export async function getAdminClients(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<AdminClientItem[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: clients, error } = await supabase
      .from('clientes_loja')
      .select(`
        id,
        nome,
        telefone,
        email,
        cpf,
        preferencias,
        created_at,
        pedidos (
          id,
          numero_pedido,
          total,
          status,
          created_at,
          itens_pedido (
            id,
            nome_produto,
            quantidade,
            preco_unitario,
            cor,
            tamanho
          )
        )
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (clients || []).map((c: any) => {
      const orders = c.pedidos || [];
      const paidOrders = orders.filter((o: any) => o.status !== 'cancelado');
      const totalPedidos = paidOrders.length;
      const totalGasto = paidOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
      const ticketMedio = totalPedidos > 0 ? totalGasto / totalPedidos : 0;

      const isVIP = totalGasto >= 1000 || totalPedidos >= 3;
      let tag: 'vip' | 'recorrente' | 'compradora' | 'lead' = 'lead';
      if (isVIP) {
        tag = 'vip';
      } else if (totalPedidos >= 2) {
        tag = 'recorrente';
      } else if (totalPedidos === 1) {
        tag = 'compradora';
      }

      const sortedOrders = [...orders].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastOrder = sortedOrders[0];
      const firstOrder = sortedOrders[sortedOrders.length - 1];

      const mappedOrders = sortedOrders.map((o: any) => ({
        id: o.id,
        numeroPedido: o.numero_pedido,
        total: Number(o.total || 0),
        status: o.status,
        createdAt: o.created_at,
        itens: (o.itens_pedido || []).map((it: any) => ({
          nome: it.nome_produto,
          cor: it.cor,
          tamanho: it.tamanho,
          quantidade: Number(it.quantidade || 1),
          preco: Number(it.preco_unitario || 0)
        }))
      }));

      const pref = c.preferencias || {};

      return {
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        cpf: c.cpf,
        cidade: pref.cidade || null,
        estado: pref.uf || null,
        totalPedidos,
        totalGasto,
        ticketMedio,
        ultimaCompra: lastOrder?.created_at || c.created_at,
        primeiroPedido: firstOrder?.created_at || c.created_at,
        ultimoPedido: lastOrder?.created_at || c.created_at,
        isVIP,
        tag,
        notasInternas: pref.notas_internas || null,
        tamanhoHabitual: pref.tamanho_habitual || null,
        pedidos: mappedOrders
      };
    });
  } catch (err) {
    console.error('❌ [Supabase] Erro ao listar clientes no admin:', err);
    return [];
  }
}

/**
 * Salva notas internas privadas e preferências da cliente no Supabase.
 */
export async function saveClientInternalNotes(
  clienteId: string,
  notas: string,
  tamanhoHabitual?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: client, error: getErr } = await supabase
      .from('clientes_loja')
      .select('preferencias')
      .eq('id', clienteId)
      .single();

    if (getErr) throw getErr;

    const currentPref = client?.preferencias || {};
    const updatedPref = {
      ...currentPref,
      notas_internas: notas,
      ...(tamanhoHabitual !== undefined ? { tamanho_habitual: tamanhoHabitual } : {})
    };

    const { error: updErr } = await supabase
      .from('clientes_loja')
      .update({
        preferencias: updatedPref,
        updated_at: new Date().toISOString()
      })
      .eq('id', clienteId);

    if (updErr) throw updErr;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar notas da cliente:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Lista os hero banners configurados para a vitrine da loja.
 */
export async function getAdminHeroBanners(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<AdminHeroBanner[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('loja_id', lojaId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []).map((b: any) => ({
      id: b.id,
      titulo: b.titulo,
      subtitulo: b.subtitulo,
      cta_texto: b.cta_texto,
      cta_link: b.cta_link,
      tipo_midia: b.tipo_midia || 'video',
      desktop_media_url: b.desktop_media_url,
      mobile_media_url: b.mobile_media_url,
      display_order: Number(b.display_order ?? 0),
      ativo: Boolean(b.ativo)
    }));
  } catch (err) {
    console.error('❌ [Supabase] Erro ao listar hero banners:', err);
    return [];
  }
}

/**
 * Salva ou atualiza um Hero Banner da vitrine.
 */
export async function saveAdminHeroBanner(
  banner: Partial<AdminHeroBanner> & { id?: string },
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    if (banner.id) {
      const { error } = await supabase
        .from('hero_banners')
        .update({
          titulo: banner.titulo,
          subtitulo: banner.subtitulo,
          cta_texto: banner.cta_texto,
          cta_link: banner.cta_link,
          tipo_midia: banner.tipo_midia,
          desktop_media_url: banner.desktop_media_url,
          mobile_media_url: banner.mobile_media_url,
          display_order: banner.display_order !== undefined ? banner.display_order : 0,
          ativo: banner.ativo !== undefined ? banner.ativo : true
        })
        .eq('id', banner.id);

      if (error) throw error;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bcomm:banners_updated'));
      }

      return { success: true, id: banner.id };
    } else {
      // Obter contagem de banners para definir display_order sequencial
      const { data: existing } = await supabase
        .from('hero_banners')
        .select('display_order')
        .eq('loja_id', lojaId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('hero_banners')
        .insert({
          loja_id: lojaId,
          titulo: banner.titulo || 'Nova Coleção',
          subtitulo: banner.subtitulo || 'Curadoria Exclusiva em Moda Feminina',
          cta_texto: banner.cta_texto || 'Conhecer Coleção',
          cta_link: banner.cta_link || '#lancamentos',
          tipo_midia: banner.tipo_midia || 'video',
          desktop_media_url: banner.desktop_media_url || '/video/header_video.mp4',
          mobile_media_url: banner.mobile_media_url || '/video/header_video.mp4',
          display_order: banner.display_order !== undefined ? banner.display_order : nextOrder,
          ativo: banner.ativo !== undefined ? banner.ativo : true
        })
        .select('id')
        .single();

      if (error) throw error;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bcomm:banners_updated'));
      }

      return { success: true, id: data?.id };
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar hero banner:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Exclui um Hero Banner cadastrado.
 */
export async function deleteAdminHeroBanner(
  bannerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { error } = await supabase
      .from('hero_banners')
      .delete()
      .eq('id', bannerId);

    if (error) throw error;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:banners_updated'));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao excluir banner:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Ativa ou pausa um Hero Banner na vitrine.
 */
export async function toggleAdminHeroBannerStatus(
  bannerId: string,
  ativo: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { error } = await supabase
      .from('hero_banners')
      .update({ ativo })
      .eq('id', bannerId);

    if (error) throw error;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:banners_updated'));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alternar status do banner:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Reordena múltiplos Hero Banners na sequência de exibição.
 */
export async function reorderAdminHeroBanners(
  orderedItems: Array<{ id: string; display_order: number }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    for (const item of orderedItems) {
      const { error } = await supabase
        .from('hero_banners')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
      if (error) throw error;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:banners_updated'));
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao reordenar banners:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Salva ou atualiza a barra de avisos superior da loja no Supabase com suporte a estilo visual completo.
 */
export async function saveStoreAnnouncementBar(
  lojaId: string = DEFAULT_TENANT_ID,
  barraAviso: string,
  barraAvisoAtiva: boolean = true,
  barraAvisoEstilo?: BarraAvisoEstilo
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: loja, error: getErr } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    if (getErr) throw getErr;

    const currentVisuais = loja?.configuracoes_visuais || {};
    const updatedVisuais = {
      ...currentVisuais,
      barra_aviso: barraAviso,
      barra_aviso_ativa: barraAvisoAtiva,
      ...(barraAvisoEstilo ? { barra_aviso_estilo: barraAvisoEstilo } : {})
    };

    const { error: updateErr } = await supabase
      .from('lojas')
      .update({
        configuracoes_visuais: updatedVisuais,
        updated_at: new Date().toISOString()
      })
      .eq('id', lojaId);

    if (updateErr) throw updateErr;

    // Limpa o cache de tenants em memória para refletir na hora
    clearTenantCache();

    // Dispara evento global no navegador caso em ambiente cliente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bcomm:tenant_updated', {
          detail: { lojaId, barra_aviso_ativa: barraAvisoAtiva }
        })
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar barra de avisos:', err);
    return { success: false, error: err?.message };
  }
}

export interface StoreSettingsData {
  nome: string;
  slug: string;
  whatsapp: string;
  email: string;

  // Fiscal & Identificação
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;

  // Endereço Físico
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  // Horários de Atendimento Boutique
  horarioSemana?: string;
  horarioSabado?: string;
  horarioDomingo?: string;

  // Canais Sociais & Comunicação
  instagram?: string;
  facebook?: string;
  tiktok?: string;

  // Políticas e Termos Legais
  politicaTrocas?: string;
  politicaPrivacidade?: string;
  termosUso?: string;

  // Pagamentos & PIX
  freteGratisValor: number;
  chavePix: string;
  tipoChavePix: 'telefone' | 'cnpj' | 'email' | 'aleatoria';
  pixTitular: string;
  pixBanco: string;
  pixDescontoPercent: number;
  pixExpiracaoMinutos: number;
  pixWhatsappComprovante?: string;
  senhaMestraBalcao?: string;

  // Logística & Envios
  prazoManuseioDias: number;
  retiradaBoutiqueAtiva: boolean;
  instrucoesRetirada?: string;
  entregaLocalAtiva: boolean;
  entregaLocalTaxa: number;
  entregaLocalBairros?: string;

  // Checkout & Experiência
  presenteAtivo: boolean;
  taxaPresente: number;
  permitirMensagemPresente: boolean;
  pedidoMinimoValor: number;
  reservaEstoqueAtiva: boolean;
  tempoReservaMinutos: number;

  // Inatividade e Limpeza de Pedidos no WhatsApp
  autoDescartarInativosWhatsapp?: boolean;
  prazoInatividadeWhatsappDias?: number;
  destinoInativosWhatsapp?: 'cancelado' | 'coluna_inativos';

  // Marca & Identidade Visual
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  slogan?: string;
  planoFundoMenu?: PlanoFundoMenuConfig;
  planoFundoSite?: PlanoFundoSiteConfig;
  tipografiaMenu?: TipografiaMenuConfig;
  secoesVitrine?: SecoesVitrineConfig;
  coresGlobais?: CoresModoClaroEscuro;
  adminCustom?: AdminCustomThemeConfig;

  // Marketing & SEO
  metaPixelId?: string;
  googleAnalyticsId?: string;
  metaTitlePadrao?: string;
  metaDescriptionPadrao?: string;
  ogImageUrl?: string;

  // Alertas & Notificações
  somNovaVendaAtivo: boolean;
  alertaEstoqueMinimo: number;
  notificarListaEsperaEmail: boolean;
}

export interface PlanoFundoMenuConfig {
  tipo: 'transparente' | 'blur' | 'solido';
  bg_light?: string;
  bg_dark?: string;
  borda_cor_light?: string;
  borda_cor_dark?: string;
}

export interface PlanoFundoSiteConfig {
  tipo: 'solido' | 'imagem' | 'video';
  bg_light?: string;
  bg_dark?: string;
  imagem_url?: string;
  video_url?: string;
  overlay_opacidade?: number;
}

export interface TipografiaMenuConfig {
  fontFamily: string;
  fontSize?: string;
  corTextoLight?: string;
  corTextoDark?: string;
  corHoverLight?: string;
  corHoverDark?: string;
}

export interface SecaoEstiloConfig {
  ativo: boolean;
  bgLight?: string;
  bgDark?: string;
  tituloFont?: string;
  tituloCorLight?: string;
  tituloCorDark?: string;
  subtituloCorLight?: string;
  subtituloCorDark?: string;
}

export interface SecoesVitrineConfig {
  modoIndependente: boolean;
  global: SecaoEstiloConfig;
  lancamentos?: SecaoEstiloConfig;
  maisVendidos?: SecaoEstiloConfig;
  outlet?: SecaoEstiloConfig;
  ultimasPecas?: SecaoEstiloConfig;
}

export interface CoresModoClaroEscuro {
  primaryLight?: string;
  primaryDark?: string;
  textLight?: string;
  textDark?: string;
  accentGold?: string;
}

export interface AdminCustomThemeConfig {
  pageBgLight?: string;
  pageBgDark?: string;
  fontFamily?: string;
  sidebarBg?: string;
  sidebarText?: string;
  sidebarFontFamily?: string;
  buttonBg?: string;
  buttonText?: string;
  buttonRadius?: 'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-full';
}

export interface SaveStoreSettingsInput {
  nome?: string;
  whatsapp?: string;
  email?: string;

  // Fiscal & Identificação
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;

  // Endereço Físico
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  // Horários de Atendimento Boutique
  horarioSemana?: string;
  horarioSabado?: string;
  horarioDomingo?: string;

  // Canais Sociais & Comunicação
  instagram?: string;
  facebook?: string;
  tiktok?: string;

  // Políticas e Termos Legais
  politicaTrocas?: string;
  politicaPrivacidade?: string;
  termosUso?: string;

  // Pagamentos & PIX
  freteGratisValor?: number;
  chavePix?: string;
  tipoChavePix?: 'telefone' | 'cnpj' | 'email' | 'aleatoria';
  pixTitular?: string;
  pixBanco?: string;
  pixDescontoPercent?: number;
  pixExpiracaoMinutos?: number;
  pixWhatsappComprovante?: string;
  senhaMestraBalcao?: string;

  // Logística & Envios
  prazoManuseioDias?: number;
  retiradaBoutiqueAtiva?: boolean;
  instrucoesRetirada?: string;
  entregaLocalAtiva?: boolean;
  entregaLocalTaxa?: number;
  entregaLocalBairros?: string;

  // Checkout & Experiência
  presenteAtivo?: boolean;
  taxaPresente?: number;
  permitirMensagemPresente?: boolean;
  pedidoMinimoValor?: number;
  reservaEstoqueAtiva?: boolean;
  tempoReservaMinutos?: number;

  // Inatividade e Limpeza de Pedidos no WhatsApp
  autoDescartarInativosWhatsapp?: boolean;
  prazoInatividadeWhatsappDias?: number;
  destinoInativosWhatsapp?: 'cancelado' | 'coluna_inativos';

  // Marca & Identidade Visual
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  slogan?: string;
  planoFundoMenu?: PlanoFundoMenuConfig;
  planoFundoSite?: PlanoFundoSiteConfig;
  tipografiaMenu?: TipografiaMenuConfig;
  secoesVitrine?: SecoesVitrineConfig;
  coresGlobais?: CoresModoClaroEscuro;
  adminCustom?: AdminCustomThemeConfig;

  // Marketing & SEO
  metaPixelId?: string;
  googleAnalyticsId?: string;
  metaTitlePadrao?: string;
  metaDescriptionPadrao?: string;
  ogImageUrl?: string;

  // Alertas & Notificações
  somNovaVendaAtivo?: boolean;
  alertaEstoqueMinimo?: number;
  notificarListaEsperaEmail?: boolean;
}

/**
 * Consulta as configurações gerais da loja (visuais, operacionais e financeiras).
 */
export async function getStoreSettings(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<StoreSettingsData | null> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: loja, error } = await supabase
      .from('lojas')
      .select('nome, slug, whatsapp, email, configuracoes_visuais, configuracoes_financeiras')
      .eq('id', lojaId)
      .single();

    if (error) throw error;

    const vis = (loja as any)?.configuracoes_visuais || {};
    const fin = (loja as any)?.configuracoes_financeiras || {};

    return {
      nome: loja.nome || 'Leidy Boutique',
      slug: loja.slug || 'leidy-boutique',
      whatsapp: loja.whatsapp || '554197347601',
      email: loja.email || 'contato@leidyboutique.com.br',

      // Fiscal & Identificação
      razaoSocial: vis.razao_social || 'Leidyane Cristina da Silva ME',
      cnpj: vis.cnpj || '48.912.345/0001-67',
      inscricaoEstadual: vis.inscricao_estadual || 'ISENTO',

      // Endereço Físico
      cep: vis.cep || '80010-000',
      logradouro: vis.logradouro || 'Rua XV de Novembro',
      numero: vis.numero || '1234',
      complemento: vis.complemento || 'Loja 02 - Térreo',
      bairro: vis.bairro || 'Centro',
      cidade: vis.cidade || 'Curitiba',
      estado: vis.estado || 'PR',

      // Horários de Atendimento Boutique
      horarioSemana: vis.horario_semana || '09:00 às 19:00',
      horarioSabado: vis.horario_sabado || '09:00 às 17:00',
      horarioDomingo: vis.horario_domingo || 'Fechado',

      // Canais Sociais & Comunicação
      instagram: vis.instagram || '@leidyboutique_oficial',
      facebook: vis.facebook || 'facebook.com/leidyboutique',
      tiktok: vis.tiktok || '@leidyboutique',

      // Políticas e Termos Legais
      politicaTrocas: vis.politica_trocas || 'Você tem até 7 (sete) dias corridos a partir da data de entrega para solicitar a troca ou devolução do seu pedido, conforme o Código de Defesa do Consumidor (CDC art. 49). As peças devem estar em perfeito estado, sem indícios de uso e com a etiqueta afixada.',
      politicaPrivacidade: vis.politica_privacidade || 'Respeitamos sua privacidade e protegemos seus dados pessoais de acordo com a LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018). Seus dados cadastrais e de pagamento são utilizados exclusivamente para o processamento de compras e emissão de notas.',
      termosUso: vis.termos_uso || 'Ao navegar e efetuar compras em nossa vitrine virtual, o cliente concorda com as condições de pagamento, prazos de envio e políticas de trocas da Leidy Boutique.',

      // Pagamentos & PIX
      freteGratisValor: Number(vis.frete_gratis_valor || 350),
      chavePix: fin.chave_pix || '554197347601',
      tipoChavePix: fin.tipo_chave_pix || 'telefone',
      pixTitular: fin.pix_titular || 'Leidyane Cristina da Silva',
      pixBanco: fin.pix_banco || 'Nu Pagamentos S.A. (Nubank)',
      pixDescontoPercent: Number(fin.pix_desconto_percent ?? 5),
      pixExpiracaoMinutos: Number(fin.pix_expiracao_minutos ?? 30),
      pixWhatsappComprovante: fin.pix_whatsapp_comprovante || '554197347601',
      senhaMestraBalcao: fin.senha_mestra_balcao || 'Leidy@2026!',

      // Logística & Envios
      prazoManuseioDias: Number(vis.prazo_manuseio_dias ?? 1),
      retiradaBoutiqueAtiva: vis.retirada_boutique_ativa ?? true,
      instrucoesRetirada: vis.instrucoes_retirada || 'Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.',
      entregaLocalAtiva: vis.entrega_local_ativa ?? true,
      entregaLocalTaxa: Number(vis.entrega_local_taxa ?? 18.00),
      entregaLocalBairros: vis.entrega_local_bairros || 'Curitiba e Região Metropolitana (São José dos Pinhais, Colombo, Pinhais)',

      // Checkout & Experiência
      presenteAtivo: vis.presente_ativo ?? true,
      taxaPresente: Number(vis.taxa_presente ?? 12.00),
      permitirMensagemPresente: vis.permitir_mensagem_presente ?? true,
      pedidoMinimoValor: Number(vis.pedido_minimo_valor ?? 0),
      reservaEstoqueAtiva: vis.reserva_estoque_ativa ?? true,
      tempoReservaMinutos: Number(vis.tempo_reserva_minutos ?? 20),

      // Inatividade de Pedidos no WhatsApp
      autoDescartarInativosWhatsapp: vis.auto_descartar_inativos_whatsapp ?? true,
      prazoInatividadeWhatsappDias: Number(vis.prazo_inatividade_whatsapp_dias ?? 7),
      destinoInativosWhatsapp: vis.destino_inativos_whatsapp || 'cancelado',

      // Marca & Identidade Visual
      logoUrl: vis.logo_url || '',
      logoDarkUrl: vis.logo_dark_url || '',
      faviconUrl: vis.favicon_url || '',
      slogan: vis.slogan || 'Moda Feminina Autêntica & Elegância Diária',
      planoFundoMenu: vis.plano_fundo_menu || {
        tipo: 'transparente',
        bg_light: '#FAF8F5',
        bg_dark: '#141312'
      },
      planoFundoSite: vis.plano_fundo_site || {
        tipo: 'solido',
        bg_light: '#FAF8F5',
        bg_dark: '#121110',
        overlay_opacidade: 40
      },
      tipografiaMenu: vis.tipografia_menu || {
        fontFamily: 'Montserrat',
        fontSize: '12px',
        corTextoLight: '#1A1918',
        corTextoDark: '#FAF8F5',
        corHoverLight: '#C5A059',
        corHoverDark: '#DFBE76'
      },
      secoesVitrine: vis.secoes_vitrine || {
        modoIndependente: false,
        global: {
          ativo: true,
          tituloFont: 'Playfair Display',
          tituloCorLight: '#FFFFFF',
          tituloCorDark: '#FFFFFF',
          subtituloCorLight: '#FAF8F5',
          subtituloCorDark: '#FAF8F5'
        }
      },
      coresGlobais: vis.cores_globais || {
        primaryLight: '#FAF8F5',
        primaryDark: '#121110',
        textLight: '#1A1918',
        textDark: '#FAF8F5',
        accentGold: '#C5A059'
      },
      adminCustom: vis.admin_custom || {
        pageBgLight: '#F8FAFC',
        pageBgDark: '#0B132B',
        fontFamily: 'Inter',
        sidebarBg: '#0B132B',
        sidebarText: '#94A3B8',
        buttonRadius: 'rounded-xl'
      },

      // Marketing & SEO
      metaPixelId: vis.meta_pixel_id || '',
      googleAnalyticsId: vis.google_analytics_id || '',
      metaTitlePadrao: vis.meta_title_padrao || 'Leidy Boutique | Moda Feminina Exclusiva',
      metaDescriptionPadrao: vis.meta_description_padrao || 'Encontre vestidos, conjuntos, alfaiataria e moda feminina contemporânea com entrega rápida para todo o Brasil.',
      ogImageUrl: vis.og_image_url || '',

      // Alertas & Notificações
      somNovaVendaAtivo: vis.som_nova_venda_ativo ?? true,
      alertaEstoqueMinimo: Number(vis.alerta_estoque_minimo ?? 3),
      notificarListaEsperaEmail: vis.notificar_lista_espera_email ?? true
    };
  } catch (err) {
    console.error('❌ [Supabase] Erro ao buscar configurações da loja:', err);
    return null;
  }
}

/**
 * Salva as configurações gerais da loja no Supabase.
 */
export async function saveStoreGeneralSettings(
  lojaId: string = DEFAULT_TENANT_ID,
  input: SaveStoreSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: loja, error: getErr } = await supabase
      .from('lojas')
      .select('nome, whatsapp, email, configuracoes_visuais, configuracoes_financeiras')
      .eq('id', lojaId)
      .single();

    if (getErr) throw getErr;

    const currentVisuais = (loja as any)?.configuracoes_visuais || {};
    const updatedVisuais = {
      ...currentVisuais,
      ...(input.freteGratisValor !== undefined ? { frete_gratis_valor: Number(input.freteGratisValor) } : {}),

      // Fiscal
      ...(input.razaoSocial !== undefined ? { razao_social: input.razaoSocial.trim() } : {}),
      ...(input.cnpj !== undefined ? { cnpj: input.cnpj.trim() } : {}),
      ...(input.inscricaoEstadual !== undefined ? { inscricao_estadual: input.inscricaoEstadual.trim() } : {}),

      // Endereço
      ...(input.cep !== undefined ? { cep: input.cep.trim() } : {}),
      ...(input.logradouro !== undefined ? { logradouro: input.logradouro.trim() } : {}),
      ...(input.numero !== undefined ? { numero: input.numero.trim() } : {}),
      ...(input.complemento !== undefined ? { complemento: input.complemento.trim() } : {}),
      ...(input.bairro !== undefined ? { bairro: input.bairro.trim() } : {}),
      ...(input.cidade !== undefined ? { cidade: input.cidade.trim() } : {}),
      ...(input.estado !== undefined ? { estado: input.estado.trim() } : {}),

      // Horários
      ...(input.horarioSemana !== undefined ? { horario_semana: input.horarioSemana.trim() } : {}),
      ...(input.horarioSabado !== undefined ? { horario_sabado: input.horarioSabado.trim() } : {}),
      ...(input.horarioDomingo !== undefined ? { horario_domingo: input.horarioDomingo.trim() } : {}),

      // Redes Sociais
      ...(input.instagram !== undefined ? { instagram: input.instagram.trim() } : {}),
      ...(input.facebook !== undefined ? { facebook: input.facebook.trim() } : {}),
      ...(input.tiktok !== undefined ? { tiktok: input.tiktok.trim() } : {}),

      // Políticas
      ...(input.politicaTrocas !== undefined ? { politica_trocas: input.politicaTrocas.trim() } : {}),
      ...(input.politicaPrivacidade !== undefined ? { politica_privacidade: input.politicaPrivacidade.trim() } : {}),
      ...(input.termosUso !== undefined ? { termos_uso: input.termosUso.trim() } : {}),

      // Logística
      ...(input.prazoManuseioDias !== undefined ? { prazo_manuseio_dias: Number(input.prazoManuseioDias) } : {}),
      ...(input.retiradaBoutiqueAtiva !== undefined ? { retirada_boutique_ativa: Boolean(input.retiradaBoutiqueAtiva) } : {}),
      ...(input.instrucoesRetirada !== undefined ? { instrucoes_retirada: input.instrucoesRetirada.trim() } : {}),
      ...(input.entregaLocalAtiva !== undefined ? { entrega_local_ativa: Boolean(input.entregaLocalAtiva) } : {}),
      ...(input.entregaLocalTaxa !== undefined ? { entrega_local_taxa: Number(input.entregaLocalTaxa) } : {}),
      ...(input.entregaLocalBairros !== undefined ? { entrega_local_bairros: input.entregaLocalBairros.trim() } : {}),

      // Checkout
      ...(input.presenteAtivo !== undefined ? { presente_ativo: Boolean(input.presenteAtivo) } : {}),
      ...(input.taxaPresente !== undefined ? { taxa_presente: Number(input.taxaPresente) } : {}),
      ...(input.permitirMensagemPresente !== undefined ? { permitir_mensagem_presente: Boolean(input.permitirMensagemPresente) } : {}),
      ...(input.pedidoMinimoValor !== undefined ? { pedido_minimo_valor: Number(input.pedidoMinimoValor) } : {}),
      ...(input.reservaEstoqueAtiva !== undefined ? { reserva_estoque_ativa: Boolean(input.reservaEstoqueAtiva) } : {}),
      ...(input.tempoReservaMinutos !== undefined ? { tempo_reserva_minutos: Number(input.tempoReservaMinutos) } : {}),
      ...(input.autoDescartarInativosWhatsapp !== undefined ? { auto_descartar_inativos_whatsapp: Boolean(input.autoDescartarInativosWhatsapp) } : {}),
      ...(input.prazoInatividadeWhatsappDias !== undefined ? { prazo_inatividade_whatsapp_dias: Number(input.prazoInatividadeWhatsappDias) } : {}),
      ...(input.destinoInativosWhatsapp !== undefined ? { destino_inativos_whatsapp: input.destinoInativosWhatsapp } : {}),

      // Marca
      ...(input.logoUrl !== undefined ? { logo_url: input.logoUrl.trim() } : {}),
      ...(input.logoDarkUrl !== undefined ? { logo_dark_url: input.logoDarkUrl.trim() } : {}),
      ...(input.faviconUrl !== undefined ? { favicon_url: input.faviconUrl.trim() } : {}),
      ...(input.slogan !== undefined ? { slogan: input.slogan.trim() } : {}),
      ...(input.planoFundoMenu !== undefined ? { plano_fundo_menu: input.planoFundoMenu } : {}),
      ...(input.planoFundoSite !== undefined ? { plano_fundo_site: input.planoFundoSite } : {}),
      ...(input.tipografiaMenu !== undefined ? { tipografia_menu: input.tipografiaMenu } : {}),
      ...(input.secoesVitrine !== undefined ? { secoes_vitrine: input.secoesVitrine } : {}),
      ...(input.coresGlobais !== undefined ? { cores_globais: input.coresGlobais } : {}),
      ...(input.adminCustom !== undefined ? { admin_custom: input.adminCustom } : {}),

      // Marketing & SEO
      ...(input.metaPixelId !== undefined ? { meta_pixel_id: input.metaPixelId.trim() } : {}),
      ...(input.googleAnalyticsId !== undefined ? { google_analytics_id: input.googleAnalyticsId.trim() } : {}),
      ...(input.metaTitlePadrao !== undefined ? { meta_title_padrao: input.metaTitlePadrao.trim() } : {}),
      ...(input.metaDescriptionPadrao !== undefined ? { meta_description_padrao: input.metaDescriptionPadrao.trim() } : {}),
      ...(input.ogImageUrl !== undefined ? { og_image_url: input.ogImageUrl.trim() } : {}),

      // Alertas
      ...(input.somNovaVendaAtivo !== undefined ? { som_nova_venda_ativo: Boolean(input.somNovaVendaAtivo) } : {}),
      ...(input.alertaEstoqueMinimo !== undefined ? { alerta_estoque_minimo: Number(input.alertaEstoqueMinimo) } : {}),
      ...(input.notificarListaEsperaEmail !== undefined ? { notificar_lista_espera_email: Boolean(input.notificarListaEsperaEmail) } : {})
    };

    const currentFin = (loja as any)?.configuracoes_financeiras || {};
    const updatedFin = {
      ...currentFin,
      ...(input.chavePix !== undefined ? { chave_pix: input.chavePix.trim() } : {}),
      ...(input.tipoChavePix !== undefined ? { tipo_chave_pix: input.tipoChavePix } : {}),
      ...(input.pixTitular !== undefined ? { pix_titular: input.pixTitular.trim() } : {}),
      ...(input.pixBanco !== undefined ? { pix_banco: input.pixBanco.trim() } : {}),
      ...(input.pixDescontoPercent !== undefined ? { pix_desconto_percent: Number(input.pixDescontoPercent) } : {}),
      ...(input.pixExpiracaoMinutos !== undefined ? { pix_expiracao_minutos: Number(input.pixExpiracaoMinutos) } : {}),
      ...(input.pixWhatsappComprovante !== undefined ? { pix_whatsapp_comprovante: input.pixWhatsappComprovante.replace(/\D/g, '') } : {}),
      ...(input.senhaMestraBalcao !== undefined ? { senha_mestra_balcao: input.senhaMestraBalcao.trim() } : {})
    };

    const updatePayload: Record<string, any> = {
      configuracoes_visuais: updatedVisuais,
      configuracoes_financeiras: updatedFin,
      updated_at: new Date().toISOString()
    };

    if (input.nome !== undefined) updatePayload.nome = input.nome.trim();
    if (input.whatsapp !== undefined) updatePayload.whatsapp = input.whatsapp.replace(/\D/g, '');
    if (input.email !== undefined) updatePayload.email = input.email.trim();

    const { error: updErr } = await supabase
      .from('lojas')
      .update(updatePayload)
      .eq('id', lojaId);

    if (updErr) throw updErr;

    // Limpa o cache de tenants em memória para refletir imediatamente na vitrine
    clearTenantCache();

    // Dispara evento global no navegador para reatividade instantânea
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bcomm:tenant_updated', {
          detail: { lojaId }
        })
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar configurações da loja:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Lista os módulos contratáveis da loja e seu estado ativo.
 */
export async function getStoreModules(lojaId: string = DEFAULT_TENANT_ID): Promise<StoreModuleConfig[]> {
  const supabase = getSupabaseBrowserClient();

  const defaultModules: StoreModuleConfig[] = [
    {
      key: 'frete_automatico',
      title: 'Cálculo de Frete dos Correios & Melhor Envio',
      description: 'Cálculo automático de SEDEX e PAC por CEP em tempo real diretamente na sacola e no checkout.',
      mensalidade: 'R$ 49,00 /mês',
      categoria: 'Logística',
      active: true,
      badge: 'Ativo'
    },
    {
      key: 'rastreio_whatsapp',
      title: 'Rastreamento Automático via WhatsApp (Evolution API)',
      description: 'Disparo automático de mensagens para a cliente no WhatsApp a cada atualização de status do pedido.',
      mensalidade: 'R$ 79,00 /mês',
      categoria: 'Automação',
      active: false,
      badge: 'Fase 2'
    },
    {
      key: 'recuperacao_carrinho',
      title: 'Recuperador de Carrinho Abandonado',
      description: 'Notificação inteligente para clientes que preencheram o WhatsApp mas não finalizaram a compra.',
      mensalidade: 'R$ 59,00 /mês',
      categoria: 'Conversão',
      active: false
    },
    {
      key: 'checkout_transparente',
      title: 'Checkout Transparente PIX & Cartão',
      description: 'Cobrança direta com baixa automática do pedido sem necessidade de envio manual de comprovante.',
      mensalidade: 'R$ 99,00 /mês',
      categoria: 'Pagamentos',
      active: false
    }
  ];

  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('modulos_ativos')
      .eq('id', lojaId)
      .single();

    if (error || !data?.modulos_ativos) return defaultModules;

    const modulosAtivos = data.modulos_ativos as Record<string, boolean>;

    return defaultModules.map((m) => ({
      ...m,
      active: Boolean(modulosAtivos[m.key])
    }));
  } catch {
    return defaultModules;
  }
}

/**
 * Ativa ou desativa um módulo contratável na loja.
 */
export async function toggleStoreModule(
  lojaId: string = DEFAULT_TENANT_ID,
  moduleKey: string,
  novoStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: store } = await supabase
      .from('lojas')
      .select('modulos_ativos')
      .eq('id', lojaId)
      .single();

    const currentModules = (store?.modulos_ativos as Record<string, boolean>) || {};
    const updatedModules = { ...currentModules, [moduleKey]: novoStatus };

    const { error } = await supabase
      .from('lojas')
      .update({ modulos_ativos: updatedModules })
      .eq('id', lojaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alternar módulo:', err);
    return { success: false, error: err?.message };
  }
}

export interface GlobalSearchResult {
  produtos: Array<{
    id: string;
    nome: string;
    slug: string;
    preco: number;
    foto_principal?: string | null;
    categoria?: string;
  }>;
  pedidos: Array<{
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  clientes: Array<{
    id: string;
    nome: string;
    telefone: string;
    total_compras: number;
    valor_total_gasto: number;
  }>;
}

/**
 * Busca universal inteligente no catálogo, pedidos e clientes (Spotlight Ctrl+K).
 */
export async function globalAdminSearch(
  lojaId: string = DEFAULT_TENANT_ID,
  query: string
): Promise<GlobalSearchResult> {
  const supabase = getSupabaseBrowserClient();
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return { produtos: [], pedidos: [], clientes: [] };
  }

  try {
    const pattern = `%${trimmed}%`;

    const [prodsRes, pedRes, cliRes] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, slug, preco, foto_principal, categorias(nome)')
        .eq('loja_id', lojaId)
        .ilike('nome', pattern)
        .limit(4),
      supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, total, status, created_at,
          clientes_loja (nome)
        `)
        .eq('loja_id', lojaId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('clientes_loja')
        .select(`
          id, nome, telefone, email,
          pedidos (total, status)
        `)
        .eq('loja_id', lojaId)
        .or(`nome.ilike.${pattern},telefone.ilike.${pattern}`)
        .limit(4)
    ]);

    const produtos = (prodsRes.data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco: Number(p.preco || 0),
      foto_principal: p.foto_principal,
      categoria: p.categorias?.nome || 'Geral'
    }));

    const allPedidos = (pedRes.data || []).map((o: any) => ({
      id: o.id,
      numero_pedido: o.numero_pedido,
      cliente_nome: o.clientes_loja?.nome || 'Cliente da Loja',
      total: Number(o.total || 0),
      status: o.status,
      created_at: o.created_at
    }));

    // Filtra pelo número do pedido ou pelo nome do cliente
    const pedidos = allPedidos
      .filter((o: any) =>
        o.numero_pedido.toLowerCase().includes(trimmed) ||
        o.cliente_nome.toLowerCase().includes(trimmed)
      )
      .slice(0, 4);

    const clientes = (cliRes.data || []).map((c: any) => {
      const validOrders = (c.pedidos || []).filter((o: any) => o.status !== 'cancelado');
      const total_compras = validOrders.length;
      const valor_total_gasto = validOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
      return {
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        total_compras,
        valor_total_gasto
      };
    });

    return { produtos, pedidos, clientes };
  } catch (err) {
    console.error('❌ [Supabase] Erro na busca universal:', err);
    return { produtos: [], pedidos: [], clientes: [] };
  }
}

/**
 * Notificações rápidas para a barra superior do Admin (Pedidos pendentes no WhatsApp).
 */
export async function getAdminPendingNotifications(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ count: number; pedidos: Array<{ id: string; numero_pedido: string; cliente_nome: string; total: number; created_at: string }> }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id, numero_pedido, total, created_at,
        clientes_loja (nome)
      `)
      .eq('loja_id', lojaId)
      .in('status', ['aguardando_whatsapp', 'novo', 'pendente'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return {
      count: data?.length || 0,
      pedidos: (data || []).map((p: any) => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        cliente_nome: p.clientes_loja?.nome || 'Cliente da Loja',
        total: Number(p.total || 0),
        created_at: p.created_at
      }))
    };
  } catch {
    return { count: 0, pedidos: [] };
  }
}

/* ========================================================================== */
/* ATRIBUTOS DINÂMICOS DA LOJA (TECIDOS, MODELAGENS, COLEÇÕES, SINALIZADORES) */
/* ========================================================================== */

export interface CustomSinalizador {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
  label?: string;
  color?: string;
  icon?: string;
}

export interface StoreCustomAttributes {
  subcategorias?: string[];
  tecidos: string[];
  modelagens: string[];
  colecoes: string[];
  tamanhos: string[];
  sinalizadores: CustomSinalizador[];
}

export const DEFAULT_STORE_ATTRIBUTES: StoreCustomAttributes = {
  subcategorias: [
    'Alfaiataria',
    'Casual Chic',
    'Vestidos & Macacões',
    'Conjuntos Nobres',
    'Blazers & Casacos',
    'Calças & Bermudas',
    'Blusas & Camisas',
    'Saias',
    'Acessórios Nobres'
  ],
  tecidos: [
    'Cetim de Seda',
    'Tricot Biamar',
    'Crepe Alfaiataria',
    'Couro Premium',
    'Metal Nobre Banho 18k',
    'Lã & Fios Nobres',
    'Linho Puro',
    'Algodão Egípcio'
  ],
  modelagens: [
    'Fluida / Evasê',
    'Ajustada / Slim',
    'Ampla / Oversized',
    'Reta Clássica',
    'Alfaiataria Estruturada'
  ],
  colecoes: [
    'Festa & Noite',
    'Casual Chic',
    'Trabalho & Alfaiataria',
    'Resort & Elegância',
    'Inverno Biamar',
    'Primavera'
  ],
  tamanhos: [
    'PP',
    'P',
    'M',
    'G',
    'GG',
    'Tamanho Único',
    '36',
    '38',
    '40',
    '42',
    '44',
    '46'
  ],
  sinalizadores: [
    { id: 'destaque', nome: 'Destaque', cor: '#d97706', icone: '🌟', label: 'Destaque', color: '#d97706', icon: '🌟' },
    { id: 'mais_vendido', nome: 'Mais Vendido', cor: '#9333ea', icone: '🔥', label: 'Mais Vendido', color: '#9333ea', icon: '🔥' },
    { id: 'outlet', nome: 'Outlet', cor: '#e11d48', icone: '🏷️', label: 'Outlet', color: '#e11d48', icon: '🏷️' },
    { id: 'ultimas_pecas', nome: 'Últimas Peças', cor: '#ea580c', icone: '⏳', label: 'Últimas Peças', color: '#ea580c', icon: '⏳' }
  ]
};

/**
 * Consulta os atributos dinâmicos da loja (mescla defaults com o cadastrado no banco).
 */
export async function getStoreCustomAttributes(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<StoreCustomAttributes> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data: loja } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    const visuais = (loja as any)?.configuracoes_visuais || {};
    const attrs = visuais.atributos_pecas || {};

    const subcategorias = Array.from(new Set([...(DEFAULT_STORE_ATTRIBUTES.subcategorias || []), ...(attrs.subcategorias || [])]));
    const tecidos = Array.from(new Set([...(DEFAULT_STORE_ATTRIBUTES.tecidos), ...(attrs.tecidos || [])]));
    const modelagens = Array.from(new Set([...(DEFAULT_STORE_ATTRIBUTES.modelagens), ...(attrs.modelagens || [])]));
    const colecoes = Array.from(new Set([...(DEFAULT_STORE_ATTRIBUTES.colecoes), ...(attrs.colecoes || [])]));
    const tamanhos = Array.from(new Set([...(DEFAULT_STORE_ATTRIBUTES.tamanhos), ...(attrs.tamanhos || [])]));

    const defaultSinalizadoresMap = new Map(DEFAULT_STORE_ATTRIBUTES.sinalizadores.map((s) => [s.id, {
      ...s,
      label: s.label || s.nome,
      color: s.color || s.cor,
      icon: s.icon || s.icone
    }]));

    (attrs.sinalizadores || []).forEach((s: any) => {
      if (s && s.id) {
        defaultSinalizadoresMap.set(s.id, {
          id: s.id,
          nome: s.nome || s.label || s.id,
          cor: s.cor || s.color || '#d97706',
          icone: s.icone || s.icon || '✨',
          label: s.label || s.nome || s.id,
          color: s.color || s.cor || '#d97706',
          icon: s.icon || s.icone || '✨'
        });
      }
    });

    return {
      subcategorias,
      tecidos,
      modelagens,
      colecoes,
      tamanhos,
      sinalizadores: Array.from(defaultSinalizadoresMap.values())
    };
  } catch (err) {
    console.error('Falha ao carregar atributos dinâmicos da loja:', err);
    return DEFAULT_STORE_ATTRIBUTES;
  }
}

/**
 * Salva ou remove um atributo customizado de estilo ou sinalizador comercial na loja.
 */
export async function saveStoreCustomAttribute(
  lojaId: string = DEFAULT_TENANT_ID,
  tipo: 'subcategorias' | 'tecidos' | 'modelagens' | 'colecoes' | 'tamanhos' | 'sinalizadores',
  item: string | CustomSinalizador,
  acao: 'adicionar' | 'remover' | 'add' | 'remove' = 'adicionar'
): Promise<StoreCustomAttributes> {
  const supabase = getSupabaseBrowserClient();
  const isAdd = acao === 'adicionar' || acao === 'add';

  try {
    const { data: loja } = await supabase
      .from('lojas')
      .select('configuracoes_visuais')
      .eq('id', lojaId)
      .single();

    const visuais = (loja as any)?.configuracoes_visuais || {};
    const attrs = { ...(visuais.atributos_pecas || {}) };

    if (tipo === 'sinalizadores') {
      const currentList: CustomSinalizador[] = Array.isArray(attrs.sinalizadores)
        ? [...attrs.sinalizadores]
        : [...DEFAULT_STORE_ATTRIBUTES.sinalizadores];

      let targetSinalizador: CustomSinalizador;
      if (typeof item === 'object') {
        targetSinalizador = {
          id: item.id || `badge_${Date.now()}`,
          nome: item.nome || item.label || 'Sinalizador',
          cor: item.cor || item.color || '#d97706',
          icone: item.icone || item.icon || '✨',
          label: item.label || item.nome || 'Sinalizador',
          color: item.color || item.cor || '#d97706',
          icon: item.icon || item.icone || '✨'
        };
      } else {
        targetSinalizador = {
          id: String(item).toLowerCase().replace(/\s+/g, '_'),
          nome: String(item),
          cor: '#d97706',
          icone: '✨',
          label: String(item),
          color: '#d97706',
          icon: '✨'
        };
      }

      let updatedList: CustomSinalizador[];
      if (isAdd) {
        updatedList = [...currentList.filter((s) => s.id !== targetSinalizador.id), targetSinalizador];
      } else {
        updatedList = currentList.filter((s) => s.id !== targetSinalizador.id);
      }
      attrs.sinalizadores = updatedList;
    } else {
      const currentArray: string[] = Array.isArray(attrs[tipo])
        ? [...attrs[tipo]]
        : [...(DEFAULT_STORE_ATTRIBUTES[tipo] || [])];

      const stringItem = String(item).trim();
      if (!stringItem) return await getStoreCustomAttributes(lojaId);

      let updatedArray: string[];
      if (isAdd) {
        if (!currentArray.some((x) => x.toLowerCase() === stringItem.toLowerCase())) {
          updatedArray = [...currentArray, stringItem];
        } else {
          updatedArray = currentArray;
        }
      } else {
        updatedArray = currentArray.filter((x) => x.toLowerCase() !== stringItem.toLowerCase());
      }
      attrs[tipo] = updatedArray;
    }

    const { error: updErr } = await supabase
      .from('lojas')
      .update({
        configuracoes_visuais: {
          ...visuais,
          atributos_pecas: attrs
        }
      })
      .eq('id', lojaId);

    if (updErr) throw updErr;

    clearTenantCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcomm:attributes_updated', { detail: { tipo, lojaId } }));
      window.dispatchEvent(new CustomEvent('bcomm:tenant_updated', { detail: { lojaId } }));
    }

    return await getStoreCustomAttributes(lojaId);
  } catch (err) {
    console.error(`Falha ao ${acao} atributo ${tipo}:`, err);
    return await getStoreCustomAttributes(lojaId);
  }
}

/**
 * Atualiza diretamente o estoque de uma variação para um valor absoluto digitado pelo lojista.
 */
export async function updateAdminVariationStockDirect(
  variationId: string,
  productId: string,
  novoEstoque: number,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; novoEstoqueTotal?: number; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const validStock = Math.max(0, Math.floor(novoEstoque));

    const { error: varErr } = await supabase
      .from('variacoes_produto')
      .update({ estoque: validStock })
      .eq('id', variationId);

    if (varErr) throw varErr;

    // Recalcula estoque total do produto no banco
    const { data: allVars } = await supabase
      .from('variacoes_produto')
      .select('estoque')
      .eq('produto_id', productId);

    const totalEstoque = (allVars || []).reduce((acc, v) => acc + Number(v.estoque || 0), 0);

    await supabase
      .from('produtos')
      .update({ estoque_total: totalEstoque })
      .eq('id', productId);

    return { success: true, novoEstoqueTotal: totalEstoque };
  } catch (err: any) {
    console.error('Falha ao atualizar estoque direto:', err);
    return { success: false, error: err?.message || 'Erro ao atualizar estoque.' };
  }
}

