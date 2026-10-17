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
  midias?: Array<{
    id: string;
    url: string;
    tipo: 'image' | 'video';
    display_order: number;
    label?: string | null;
  }>;
  variacoes: Array<{
    id: string;
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
      cliente_nome: p.clientes_loja?.nome || 'Cliente VIP',
      cliente_telefone: p.clientes_loja?.telefone || '',
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
      .select('status, itens_pedido (*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) throw orderErr || new Error('Pedido não encontrado');

    const previousStatus = order.status;
    const itens = order.itens_pedido || [];

    // Se mudou para PAGO (e antes não era pago nem enviado) -> Baixa estoque!
    const isNowPaid = newStatus === 'pago' || newStatus === 'em_separacao';
    const wasPending = previousStatus === 'pendente' || previousStatus === 'aguardando_whatsapp';

    if (isNowPaid && wasPending) {
      console.log('📉 [Estoque] Baixando estoque para pedido confirmado:', orderId);
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
              .ilike('cor_nome', item.cor)
              .ilike('tamanho', item.tamanho);

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
              .ilike('cor_nome', item.cor)
              .ilike('tamanho', item.tamanho);

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
 * Exclui ou arquiva um produto com segurança contábil.
 */
export async function deleteAdminProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
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
      return { success: true };
    }

    // 2. Se nunca foi vendido, pode excluir com segurança física
    await supabase.from('midias_produto').delete().eq('produto_id', productId);
    await supabase.from('variacoes_produto').delete().eq('produto_id', productId);
    const { error: delErr } = await supabase.from('produtos').delete().eq('id', productId);
    if (delErr) throw delErr;

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao excluir produto:', err);
    return { success: false, error: err?.message };
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
  precoCusto?: number | null
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
    (produtosData || []).forEach((p) => {
      custoMap[p.id] = p.preco_custo ? Number(p.preco_custo) : Number(p.preco) * 0.4;
    });

    let totalPecasVendidas = 0;
    let cmvTotal = 0;
    const produtosMap: Record<string, { nome: string; quantidadeVendida: number; faturamento: number; lucro: number }> = {};

    for (const p of pedidosList) {
      const itens = p.itens_pedido || [];
      for (const item of itens) {
        const qtd = Number(item.quantidade || 1);
        const precoUnit = Number(item.preco_unitario || 0);
        const custoUnit = item.produto_id && custoMap[item.produto_id] ? custoMap[item.produto_id] : precoUnit * 0.4;

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
): Promise<{ success: boolean; error?: string }> {
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
          ativo: banner.ativo !== undefined ? banner.ativo : true
        })
        .eq('id', banner.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('hero_banners').insert({
        loja_id: lojaId,
        titulo: banner.titulo || 'Nova Coleção',
        subtitulo: banner.subtitulo || 'Alta Costura e Sofisticação',
        cta_texto: banner.cta_texto || 'Explorar Coleção',
        cta_link: banner.cta_link || '/catalogo',
        tipo_midia: banner.tipo_midia || 'video',
        desktop_media_url: banner.desktop_media_url || '/images/hero-desktop.mp4',
        mobile_media_url: banner.mobile_media_url || '/images/hero-mobile.mp4',
        ativo: true
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar hero banner:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Salva ou atualiza a barra de avisos superior da loja no Supabase.
 */
export async function saveStoreAnnouncementBar(
  lojaId: string = DEFAULT_TENANT_ID,
  barraAviso: string,
  barraAvisoAtiva: boolean = true
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
      barra_aviso_ativa: barraAvisoAtiva
    };

    const { error: updateErr } = await supabase
      .from('lojas')
      .update({
        configuracoes_visuais: updatedVisuais,
        updated_at: new Date().toISOString()
      })
      .eq('id', lojaId);

    if (updateErr) throw updateErr;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao salvar barra de avisos:', err);
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
