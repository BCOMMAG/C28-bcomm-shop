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
  motivo: 'provador' | 'whatsapp_pix' | 'condicional';
  expira_em: string;
  status: 'ativa' | 'convertida_venda' | 'liberada' | 'expirada';
  created_at: string;
  minutos_restantes?: number;
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
 */
export async function getActiveReservations(lojaId: string = DEFAULT_TENANT_ID): Promise<ReservaEstoque[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const nowIso = new Date().toISOString();

    // 1. Marca como 'expirada' qualquer reserva ativa cujo prazo já tenha vencido
    await supabase
      .from('reservas_estoque')
      .update({ status: 'expirada' })
      .eq('loja_id', lojaId)
      .eq('status', 'ativa')
      .lt('expira_em', nowIso);

    // 2. Busca reservas ativas vigentes
    const { data, error } = await supabase
      .from('reservas_estoque')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('status', 'ativa')
      .gt('expira_em', nowIso)
      .order('expira_em', { ascending: true });

    if (error) {
      console.error('❌ [reservas.ts] Erro ao buscar reservas:', error.message);
      return [];
    }

    if (!data) return [];

    const nowTime = Date.now();
    return data.map((r: any) => {
      const expiraTime = new Date(r.expira_em).getTime();
      const minutosRestantes = Math.max(0, Math.ceil((expiraTime - nowTime) / (1000 * 60)));
      return {
        ...r,
        minutos_restantes: minutosRestantes
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
