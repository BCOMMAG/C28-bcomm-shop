import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { logStoreAuditAction } from '@/lib/team';

export interface ReservaEstoque {
  id: string;
  loja_id: string;
  produto_id: string;
  variacao_id?: string | null;
  produto_nome: string;
  tamanho?: string | null;
  cor?: string | null;
  quantidade: number;
  vendedora_id?: string | null;
  vendedora_nome: string;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  motivo: string;
  expira_em: string;
  status: 'ativa' | 'pausada' | 'convertida_venda' | 'liberada' | 'expirada';
  created_at: string;
  minutos_restantes?: number | null;
  is_pausada?: boolean;
  horas_pausada?: number;
}

export interface CreateReservationInput {
  produto_id: string;
  variacao_id?: string;
  produto_nome: string;
  tamanho?: string;
  cor?: string;
  quantidade?: number;
  vendedora_id?: string;
  vendedora_nome: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  motivo?: 'provador' | 'whatsapp_pix' | 'condicional';
  duracaoMinutos?: number;
}

/**
 * Busca todas as reservas ativas da loja e atualiza automaticamente as expiradas.
 * - Reservas com status 'pausada' são mantidas intactas e nunca expiram sozinhas.
 */
export async function getActiveReservations(lojaId: string = DEFAULT_TENANT_ID): Promise<ReservaEstoque[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const nowIso = new Date().toISOString();

    // 1. Marca como 'expirada' APENAS reservas com status 'ativa' cujo prazo já venceu
    await supabase
      .from('reservas_estoque')
      .update({ status: 'expirada' })
      .eq('loja_id', lojaId)
      .eq('status', 'ativa')
      .lt('expira_em', nowIso);

    // 2. Busca reservas ativas vigentes OU pausadas (congeladas)
    const { data, error } = await supabase
      .from('reservas_estoque')
      .select('*')
      .eq('loja_id', lojaId)
      .or(`status.eq.pausada,and(status.eq.ativa,expira_em.gt.${nowIso})`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [reservas.ts] Erro ao buscar reservas:', error.message);
      return [];
    }

    if (!data) return [];

    const nowTime = Date.now();
    return data.map((r: any) => {
      const isPausada = r.status === 'pausada';
      const expiraTime = r.expira_em ? new Date(r.expira_em).getTime() : 0;
      const minutosRestantes = isPausada
        ? null
        : Math.max(0, Math.ceil((expiraTime - nowTime) / (1000 * 60)));

      const horasPausada = isPausada && r.created_at
        ? Math.floor((nowTime - new Date(r.created_at).getTime()) / (1000 * 60 * 60))
        : 0;

      return {
        ...r,
        is_pausada: isPausada,
        minutos_restantes: minutosRestantes,
        horas_pausada: horasPausada
      };
    });
  } catch (err) {
    console.error('❌ [reservas.ts] Falha geral ao buscar reservas:', err);
    return [];
  }
}

/**
 * Cria uma nova reserva provisória de peça (provador, negociação WhatsApp, etc.)
 */
export async function createReservation(
  lojaId: string = DEFAULT_TENANT_ID,
  input: CreateReservationInput
): Promise<{ success: boolean; reserva?: ReservaEstoque; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const duracao = input.duracaoMinutos || 30;
    const expiraEm = new Date(Date.now() + duracao * 60 * 1000).toISOString();

    const newReserva = {
      loja_id: lojaId,
      produto_id: input.produto_id,
      variacao_id: input.variacao_id || null,
      produto_nome: input.produto_nome,
      tamanho: input.tamanho || null,
      cor: input.cor || null,
      quantidade: input.quantidade || 1,
      vendedora_id: input.vendedora_id || null,
      vendedora_nome: input.vendedora_nome || 'Vendedora',
      cliente_nome: input.cliente_nome || null,
      cliente_telefone: input.cliente_telefone || null,
      motivo: input.motivo || 'provador',
      expira_em: expiraEm,
      status: 'ativa'
    };

    const { data, error } = await supabase
      .from('reservas_estoque')
      .insert([newReserva])
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Registra auditoria
    await logStoreAuditAction(lojaId, {
      colaborador_id: input.vendedora_id,
      colaborador_nome: input.vendedora_nome,
      cargo: 'atendente',
      acao: 'criou_reserva_provador',
      entidade: 'produtos',
      entidade_id: input.produto_id,
      dados_novos: {
        produto: input.produto_nome,
        tamanho: input.tamanho,
        quantidade: input.quantidade || 1,
        motivo: input.motivo || 'provador',
        minutos: duracao
      },
      motivo: `Peça reservada no ${input.motivo || 'provador'} por ${duracao} min para evitar venda dupla`
    });

    return {
      success: true,
      reserva: {
        ...data,
        minutos_restantes: duracao
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao criar reserva' };
  }
}

/**
 * Libera a reserva antecipadamente (a cliente devolveu a peça na arara)
 */
export async function cancelReservation(
  lojaId: string = DEFAULT_TENANT_ID,
  reservaId: string,
  autorNome: string = 'Vendedora'
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('reservas_estoque')
      .update({ status: 'liberada' })
      .eq('id', reservaId)
      .eq('loja_id', lojaId);

    if (error) return false;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'liberou_reserva_provador',
      entidade: 'produtos',
      entidade_id: reservaId,
      motivo: 'Peça devolvida à arara e liberada na vitrine online'
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Converte a reserva em venda confirmada
 */
export async function convertReservationToSale(
  lojaId: string = DEFAULT_TENANT_ID,
  reservaId: string,
  autorNome: string = 'Vendedora'
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('reservas_estoque')
      .update({ status: 'convertida_venda' })
      .eq('id', reservaId)
      .eq('loja_id', lojaId);

    if (error) return false;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'converteu_reserva_venda',
      entidade: 'pedidos',
      entidade_id: reservaId,
      motivo: 'Reserva de provador convertida em venda no balcão'
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna o mapa de quantidade reservada por produto e por variação
 */
export async function getReservedStockMap(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ byProduct: Record<string, number>; byVariation: Record<string, number> }> {
  const reservas = await getActiveReservations(lojaId);
  const byProduct: Record<string, number> = {};
  const byVariation: Record<string, number> = {};

  reservas.forEach((r) => {
    byProduct[r.produto_id] = (byProduct[r.produto_id] || 0) + r.quantidade;
    if (r.variacao_id) {
      byVariation[r.variacao_id] = (byVariation[r.variacao_id] || 0) + r.quantidade;
    }
  });

  return { byProduct, byVariation };
}

/**
 * Localiza os IDs de reservas associados a um pedido específico através do número do pedido e/ou telefone.
 */
export async function findOrderReservationIds(
  lojaId: string = DEFAULT_TENANT_ID,
  orderNumber?: string,
  phones: string[] = []
): Promise<string[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    let foundIds: string[] = [];

    // 1. Tenta buscar pelo número do pedido registrado no campo 'motivo'
    if (orderNumber) {
      const cleanNum = orderNumber.trim();
      const { data: resByMotivo } = await supabase
        .from('reservas_estoque')
        .select('id')
        .eq('loja_id', lojaId)
        .in('status', ['ativa', 'pausada'])
        .ilike('motivo', `%${cleanNum}%`);

      if (resByMotivo && resByMotivo.length > 0) {
        foundIds = resByMotivo.map((r: any) => r.id);
      }
    }

    // 2. Se não encontrou pelo motivo, busca pelas variações do telefone da cliente
    if (foundIds.length === 0 && phones.length > 0) {
      const { data: resByPhone } = await supabase
        .from('reservas_estoque')
        .select('id')
        .eq('loja_id', lojaId)
        .in('status', ['ativa', 'pausada'])
        .in('cliente_telefone', phones);

      if (resByPhone && resByPhone.length > 0) {
        foundIds = resByPhone.map((r: any) => r.id);
      }
    }

    return foundIds;
  } catch (err) {
    console.error('❌ [reservas.ts] Erro ao localizar reservas do pedido:', err);
    return [];
  }
}

/**
 * Congela (pausa) o tempo da reserva provisória de um pedido, mantendo as peças bloqueadas
 * no catálogo por tempo indeterminado enquanto a vendedora atende a cliente no WhatsApp.
 */
export async function pauseOrderReservation(
  lojaId: string = DEFAULT_TENANT_ID,
  orderNumber: string,
  phones: string[] = [],
  autorNome: string = 'Atendente'
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const ids = await findOrderReservationIds(lojaId, orderNumber, phones);

    if (ids.length === 0) {
      return { success: false, updatedCount: 0, error: 'Nenhuma reserva ativa encontrada para este pedido.' };
    }

    const { error } = await supabase
      .from('reservas_estoque')
      .update({ status: 'pausada' })
      .in('id', ids);

    if (error) throw error;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'pausou_reserva_estoque',
      entidade: 'pedidos',
      entidade_id: orderNumber,
      motivo: `Reserva do pedido #${orderNumber} congelada para atendimento no WhatsApp`
    }).catch(() => {});

    return { success: true, updatedCount: ids.length };
  } catch (err: any) {
    console.error('❌ [reservas.ts] Falha ao pausar reserva:', err);
    return { success: false, updatedCount: 0, error: err?.message || 'Falha ao pausar reserva' };
  }
}

/**
 * Descongela e retoma a contagem regressiva da reserva com um novo prazo de expiração (padrão: 20 min).
 */
export async function resumeOrderReservation(
  lojaId: string = DEFAULT_TENANT_ID,
  orderNumber: string,
  phones: string[] = [],
  additionalMinutes: number = 20,
  autorNome: string = 'Atendente'
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const ids = await findOrderReservationIds(lojaId, orderNumber, phones);

    if (ids.length === 0) {
      return { success: false, updatedCount: 0, error: 'Nenhuma reserva encontrada para este pedido.' };
    }

    const expiraEm = new Date(Date.now() + Math.max(5, additionalMinutes) * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('reservas_estoque')
      .update({
        status: 'ativa',
        expira_em: expiraEm
      })
      .in('id', ids);

    if (error) throw error;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'retomou_reserva_estoque',
      entidade: 'pedidos',
      entidade_id: orderNumber,
      motivo: `Contagem da reserva do pedido #${orderNumber} retomada (+${additionalMinutes} min)`
    }).catch(() => {});

    return { success: true, updatedCount: ids.length };
  } catch (err: any) {
    console.error('❌ [reservas.ts] Falha ao retomar reserva:', err);
    return { success: false, updatedCount: 0, error: err?.message || 'Falha ao retomar reserva' };
  }
}

/**
 * Estende o prazo de expiração da reserva adicionando minutos extras (+15, +30, +60 min).
 */
export async function extendOrderReservation(
  lojaId: string = DEFAULT_TENANT_ID,
  orderNumber: string,
  phones: string[] = [],
  minutesToAdd: number = 20,
  autorNome: string = 'Atendente'
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const ids = await findOrderReservationIds(lojaId, orderNumber, phones);

    if (ids.length === 0) {
      return { success: false, updatedCount: 0, error: 'Nenhuma reserva encontrada para estender.' };
    }

    const expiraEm = new Date(Date.now() + Math.max(5, minutesToAdd) * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('reservas_estoque')
      .update({
        status: 'ativa',
        expira_em: expiraEm
      })
      .in('id', ids);

    if (error) throw error;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'estendeu_reserva_estoque',
      entidade: 'pedidos',
      entidade_id: orderNumber,
      motivo: `Prazo da reserva do pedido #${orderNumber} estendido por mais ${minutesToAdd} minutos`
    }).catch(() => {});

    return { success: true, updatedCount: ids.length };
  } catch (err: any) {
    console.error('❌ [reservas.ts] Falha ao estender reserva:', err);
    return { success: false, updatedCount: 0, error: err?.message || 'Falha ao estender reserva' };
  }
}

/**
 * Libera antecipadamente as peças da reserva (ex: cliente informou no WhatsApp que desistiu da compra).
 */
export async function releaseOrderReservationFull(
  lojaId: string = DEFAULT_TENANT_ID,
  orderNumber: string,
  phones: string[] = [],
  autorNome: string = 'Atendente'
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const ids = await findOrderReservationIds(lojaId, orderNumber, phones);

    if (ids.length === 0) {
      return { success: false, updatedCount: 0, error: 'Nenhuma reserva encontrada para liberar.' };
    }

    const { error } = await supabase
      .from('reservas_estoque')
      .update({ status: 'liberada' })
      .in('id', ids);

    if (error) throw error;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'atendente',
      acao: 'liberou_reserva_estoque',
      entidade: 'pedidos',
      entidade_id: orderNumber,
      motivo: `Peças do pedido #${orderNumber} liberadas e devolvidas ao catálogo online`
    }).catch(() => {});

    return { success: true, updatedCount: ids.length };
  } catch (err: any) {
    console.error('❌ [reservas.ts] Falha ao liberar reserva:', err);
    return { success: false, updatedCount: 0, error: err?.message || 'Falha ao liberar reserva' };
  }
}
