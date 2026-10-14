import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { CustomerOrder } from '@/lib/orders';

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
}

export interface AdminProductItem {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  preco_promocional: number | null;
  tecido?: string | null;
  modelagem?: string | null;
  estoque_total: number;
  ativo: boolean;
  foto_principal?: string | null;
  categoria_nome?: string;
  variacoes: Array<{
    id: string;
    cor_nome: string;
    cor_hex: string;
    tamanho: string;
    estoque: number;
    sku?: string | null;
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
      cliente_nome: p.clientes_loja?.nome || 'Cliente VIP',
      cliente_telefone: p.clientes_loja?.telefone || '',
      subtotal: Number(p.subtotal || 0),
      valor_frete: Number(p.valor_frete || 0),
      valor_desconto: Number(p.valor_desconto || 0),
      total: Number(p.total || 0)
    }));

    const faturamentoTotal = ordersList
      .filter((o) => o.status !== 'cancelado')
      .reduce((acc, o) => acc + Number(o.total || 0), 0);

    const totalPedidos = ordersList.length;
    const pedidosPendentes = ordersList.filter(
      (o) => o.status === 'pendente' || o.status === 'aguardando_whatsapp'
    ).length;
    const pedidosEnviados = ordersList.filter((o) => o.status === 'enviado').length;
    const pedidosEntregues = ordersList.filter((o) => o.status === 'entregue').length;
    const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

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

    return {
      faturamentoTotal,
      totalPedidos,
      pedidosPendentes,
      pedidosEnviados,
      pedidosEntregues,
      ticketMedio,
      totalLeads: leadsCount || 0,
      totalProdutos: produtosCount || 0,
      pedidosRecentes: ordersList.slice(0, 6)
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
      pedidosRecentes: []
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
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map((p: any) => ({
      ...p,
      cliente_nome: p.clientes_loja?.nome || 'Cliente VIP',
      cliente_telefone: p.clientes_loja?.telefone || '',
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

/**
 * Atualiza o status de um pedido na nuvem.
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
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
    console.error('❌ [Supabase] Falha ao atualizar status do pedido:', err);
    return { success: false, error: err?.message };
  }
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
        preco,
        preco_promocional,
        tecido,
        modelagem,
        estoque_total,
        ativo,
        foto_principal,
        categorias (nome),
        variacoes_produto (*)
      `)
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco: Number(p.preco),
      preco_promocional: p.preco_promocional ? Number(p.preco_promocional) : null,
      tecido: p.tecido,
      modelagem: p.modelagem,
      estoque_total: p.estoque_total || 0,
      ativo: Boolean(p.ativo),
      foto_principal: p.foto_principal,
      categoria_nome: p.categorias?.nome || 'Geral',
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
 * Atualiza preço e estoque geral de um produto.
 */
export async function updateAdminProductDetails(
  productId: string,
  preco: number,
  precoPromocional: number | null,
  estoqueTotal: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('produtos')
      .update({
        preco,
        preco_promocional: precoPromocional,
        estoque_total: estoqueTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao atualizar detalhes do produto:', err);
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
