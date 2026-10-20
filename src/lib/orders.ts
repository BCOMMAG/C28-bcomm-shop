import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export interface CustomerLeadPayload {
  lojaId?: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  endereco?: {
    cep?: string;
    cidade?: string;
    uf?: string;
  };
  origem?: string;
}

export interface CreateOrderPayload {
  lojaId?: string;
  numeroPedido: string;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
    cpf?: string;
  };
  endereco: {
    cep: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  itens: Array<{
    productId?: string;
    name: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  valorFrete: number;
  valorDesconto: number;
  total: number;
  metodoPagamento: 'pix' | 'credit_card' | 'whatsapp';
  observacoes?: string;
  status?: 'pendente' | 'aguardando_whatsapp' | 'pago' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
  isGift?: boolean;
  giftFee?: number;
  giftMessage?: string;
}

/**
 * Salva ou atualiza os dados da cliente/lead no Supabase de forma transparente.
 * Captura leads mesmo se ela abandonar o checkout antes do pagamento.
 */
export async function saveCustomerLead(payload: CustomerLeadPayload): Promise<{
  success: boolean;
  clienteId?: string;
  error?: string;
}> {
  try {
    const cleanPhone = (payload.telefone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: 'Telefone incompleto' };
    }

    const supabase = getSupabaseBrowserClient();
    const lojaId = payload.lojaId || DEFAULT_TENANT_ID;

    const { data, error } = await supabase
      .from('clientes_loja')
      .upsert(
        {
          loja_id: lojaId,
          nome: payload.nome.trim() || 'Cliente WhatsApp',
          telefone: cleanPhone,
          email: payload.email?.trim() || null,
          cpf: payload.cpf?.replace(/\D/g, '') || null,
          preferencias: {
            ultimo_cep: payload.endereco?.cep || null,
            cidade: payload.endereco?.cidade || null,
            uf: payload.endereco?.uf || null,
            origem: payload.origem || 'checkout_lead'
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'loja_id,telefone' }
      )
      .select('id')
      .single();

    if (error) {
      console.warn('⚠️ [Supabase] Aviso ao capturar lead do cliente:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, clienteId: data?.id };
  } catch (err: any) {
    console.warn('⚠️ [Supabase] Falha de rede ao capturar lead:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Registra o pedido e seus itens no Supabase PostgreSQL antes do envio para o WhatsApp.
 */
export async function createOrderInDatabase(payload: CreateOrderPayload): Promise<{
  success: boolean;
  orderId?: string;
  numeroPedido: string;
  error?: string;
}> {
  const lojaId = payload.lojaId || DEFAULT_TENANT_ID;
  const numeroPedido = payload.numeroPedido;

  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Identificar ou cadastrar a cliente no banco
    let clienteId: string | undefined = undefined;
    if (payload.cliente.telefone) {
      const leadResult = await saveCustomerLead({
        lojaId,
        nome: payload.cliente.nome,
        telefone: payload.cliente.telefone,
        email: payload.cliente.email,
        cpf: payload.cliente.cpf,
        endereco: {
          cep: payload.endereco.cep,
          cidade: payload.endereco.cidade,
          uf: payload.endereco.uf
        },
        origem: 'pedido_finalizado'
      });
      clienteId = leadResult.clienteId;
    }

    // 2. Preparar metadados de presente e observações
    let finalObservacoes = payload.observacoes?.trim() || '';
    if (payload.isGift) {
      const giftNotes = [
        `🎁 PEDIDO PARA PRESENTE (Taxa: R$ ${(payload.giftFee || 0).toFixed(2).replace('.', ',')})`,
        payload.giftMessage?.trim()
          ? `💌 Dedicatória: "${payload.giftMessage.trim()}"`
          : '💌 Dedicatória: (Nenhuma mensagem informada)'
      ].join('\n');
      finalObservacoes = finalObservacoes ? `${giftNotes}\n\n${finalObservacoes}` : giftNotes;
    }

    const enderecoFinal = {
      ...payload.endereco,
      ...(payload.isGift
        ? {
            presente: {
              ativo: true,
              taxa: payload.giftFee || 0,
              mensagem: payload.giftMessage?.trim() || ''
            }
          }
        : {})
    };

    // Inserir o registro na tabela 'pedidos'
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        loja_id: lojaId,
        numero_pedido: numeroPedido,
        cliente_id: clienteId || null,
        status: payload.status || 'aguardando_whatsapp',
        subtotal: payload.subtotal,
        valor_frete: payload.valorFrete,
        valor_desconto: payload.valorDesconto,
        total: payload.total,
        metodo_pagamento: payload.metodoPagamento,
        endereco_entrega: enderecoFinal,
        observacoes: finalObservacoes || null
      })
      .select('id')
      .single();

    if (pedidoError) {
      console.error('❌ [Supabase] Erro ao registrar pedido:', pedidoError.message);
      return { success: false, numeroPedido, error: pedidoError.message };
    }

    const orderId = pedidoData.id;

    // 3. Inserir itens do pedido com amarração correta ao produto no banco
    if (payload.itens && payload.itens.length > 0) {
      const isUuid = (val?: string) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      // Busca mapeamento de slug / nome -> id para os produtos que não vieram como UUID
      const unresolvedItems = payload.itens.filter((i) => !isUuid(i.productId));
      const productMapByName = new Map<string, string>();
      const productMapBySlug = new Map<string, string>();

      if (unresolvedItems.length > 0) {
        const { data: dbProducts } = await supabase
          .from('produtos')
          .select('id, slug, nome')
          .eq('loja_id', lojaId);

        if (dbProducts) {
          dbProducts.forEach((p) => {
            if (p.slug) productMapBySlug.set(p.slug.toLowerCase(), p.id);
            if (p.nome) productMapByName.set(p.nome.toLowerCase().trim(), p.id);
          });
        }
      }

      const orderItems = payload.itens.map((item) => {
        let produtoId: string | null = null;
        if (isUuid(item.productId)) {
          produtoId = item.productId!;
        } else if (item.productId && productMapBySlug.has(item.productId.toLowerCase())) {
          produtoId = productMapBySlug.get(item.productId.toLowerCase())!;
        } else if (item.name && productMapByName.has(item.name.toLowerCase().trim())) {
          produtoId = productMapByName.get(item.name.toLowerCase().trim())!;
        }

        return {
          pedido_id: orderId,
          loja_id: lojaId,
          produto_id: produtoId,
          nome_produto: item.name,
          cor: item.color,
          tamanho: item.size,
          preco_unitario: item.price,
          quantidade: item.quantity,
          imagem_url: item.image || null
        };
      });

      const { error: itemsError } = await supabase.from('itens_pedido').insert(orderItems);
      if (itemsError) {
        console.warn('⚠️ [Supabase] Aviso ao registrar itens do pedido:', itemsError.message);
      }
    }

    console.log(`✅ [Supabase] Pedido #${numeroPedido} gravado com sucesso! ID: ${orderId}`);
    return { success: true, orderId, numeroPedido };
  } catch (err: any) {
    console.error('❌ [Supabase] Exceção ao gravar pedido no banco:', err);
    return { success: false, numeroPedido, error: err?.message };
  }
}

export interface CustomerOrder {
  id: string;
  numero_pedido: string;
  status: 'pendente' | 'aguardando_whatsapp' | 'pago' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
  subtotal: number;
  valor_frete: number;
  valor_desconto: number;
  total: number;
  metodo_pagamento: string;
  endereco_entrega: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    presente?: {
      ativo: boolean;
      taxa: number;
      mensagem?: string;
    } | null;
  };
  codigo_rastreio?: string | null;
  observacoes?: string | null;
  created_at: string;
  cliente_id?: string | null;
  cliente_nome?: string;
  cliente_telefone?: string;
  clientes_loja?: {
    nome?: string;
    telefone?: string;
    email?: string;
  } | null;
  itens_pedido: Array<{
    id: string;
    produto_id?: string | null;
    nome_produto: string;
    cor: string;
    tamanho: string;
    preco_unitario: number;
    quantidade: number;
    imagem_url?: string | null;
  }>;
}

/**
 * Consulta os pedidos de uma cliente através do telefone no Supabase (Passwordless).
 */
export async function getCustomerOrders(
  phone: string,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{
  success: boolean;
  cliente: { id: string; nome: string; telefone: string; email?: string } | null;
  pedidos: CustomerOrder[];
  error?: string;
}> {
  try {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, cliente: null, pedidos: [], error: 'Telefone inválido' };
    }

    const supabase = getSupabaseBrowserClient();

    // 1. Busca o cliente cadastrado
    const { data: cliente, error: clientErr } = await supabase
      .from('clientes_loja')
      .select('id, nome, telefone, email')
      .eq('loja_id', lojaId)
      .eq('telefone', cleanPhone)
      .maybeSingle();

    if (clientErr) {
      console.warn('⚠️ [Supabase] Erro ao buscar cliente por telefone:', clientErr.message);
    }

    // Se o cliente foi encontrado, busca por cliente_id
    if (cliente?.id) {
      const { data: pedidos, error: pedidosErr } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (*)
        `)
        .eq('loja_id', lojaId)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (pedidosErr) {
        console.warn('⚠️ [Supabase] Erro ao buscar pedidos da cliente:', pedidosErr.message);
        return { success: false, cliente, pedidos: [], error: pedidosErr.message };
      }

      return {
        success: true,
        cliente,
        pedidos: (pedidos as any) || []
      };
    }

    return { success: true, cliente: null, pedidos: [] };
  } catch (err: any) {
    console.error('❌ [Supabase] Falha ao carregar pedidos da cliente:', err);
    return { success: false, cliente: null, pedidos: [], error: err?.message };
  }
}

/**
 * Consulta um pedido específico pelo código de identificação (ex: LB-2026-1042).
 */
export async function getOrderByNumber(
  orderNumber: string,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{
  success: boolean;
  pedido: CustomerOrder | null;
  error?: string;
}> {
  try {
    const cleanNumber = orderNumber.trim().replace('#', '');
    if (!cleanNumber) {
      return { success: false, pedido: null, error: 'Código de pedido não fornecido' };
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido (*)
      `)
      .eq('loja_id', lojaId)
      .ilike('numero_pedido', `%${cleanNumber}%`)
      .maybeSingle();

    if (error || !data) {
      return { success: false, pedido: null, error: error?.message || 'Pedido não encontrado' };
    }

    return { success: true, pedido: data as any };
  } catch (err: any) {
    return { success: false, pedido: null, error: err?.message };
  }
}

/**
 * Detecta se o pedido foi solicitado como presente.
 */
export function isOrderGift(order: CustomerOrder): boolean {
  if (order.endereco_entrega && (order.endereco_entrega as any)?.presente?.ativo) {
    return true;
  }
  if (order.observacoes && (order.observacoes.includes('🎁') || order.observacoes.toLowerCase().includes('presente'))) {
    return true;
  }
  return false;
}

/**
 * Extrai detalhes da embalagem e mensagem de dedicatória do pedido.
 */
export function getOrderGiftDetails(order: CustomerOrder): {
  isGift: boolean;
  fee?: number;
  message?: string;
} {
  const presenteObj = (order.endereco_entrega as any)?.presente;
  if (presenteObj?.ativo) {
    return {
      isGift: true,
      fee: presenteObj.taxa,
      message: presenteObj.mensagem || ''
    };
  }
  if (order.observacoes && (order.observacoes.includes('🎁') || order.observacoes.toLowerCase().includes('presente'))) {
    let msg = '';
    const match = order.observacoes.match(/Dedicat[oó]ria(?:\s+no\s+Cart[ãa]o)?:\s*(?:["“](.+?)["”]|(.+))/i);
    if (match) {
      msg = (match[1] || match[2] || '').trim();
      if (msg.includes('(Nenhuma mensagem') || msg.includes('(Sem mensagem')) {
        msg = '';
      }
    }
    return {
      isGift: true,
      message: msg
    };
  }
  return { isGift: false };
}

