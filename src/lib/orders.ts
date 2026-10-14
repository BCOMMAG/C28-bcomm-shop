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

    // 2. Inserir o registro na tabela 'pedidos'
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
        endereco_entrega: payload.endereco,
        observacoes: payload.observacoes || null
      })
      .select('id')
      .single();

    if (pedidoError) {
      console.error('❌ [Supabase] Erro ao registrar pedido:', pedidoError.message);
      return { success: false, numeroPedido, error: pedidoError.message };
    }

    const orderId = pedidoData.id;

    // 3. Inserir itens do pedido
    if (payload.itens && payload.itens.length > 0) {
      const orderItems = payload.itens.map((item) => ({
        pedido_id: orderId,
        loja_id: lojaId,
        nome_produto: item.name,
        cor: item.color,
        tamanho: item.size,
        preco_unitario: item.price,
        quantidade: item.quantity,
        imagem_url: item.image || null
      }));

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
