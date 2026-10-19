import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export interface AviseMeLead {
  id: string;
  loja_id: string;
  produto_id: string;
  produto_nome: string;
  variacao_cor?: string | null;
  variacao_tamanho: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string | null;
  status: 'pendente' | 'notificado' | 'cancelado';
  notificado_em?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAviseMeInput {
  lojaId?: string;
  produtoId: string;
  produtoNome: string;
  cor?: string;
  tamanho: string;
  nome: string;
  telefone: string;
  email?: string;
}

/**
 * Registra uma cliente na fila de espera "Avise-me quando chegar"
 */
export async function createAviseMeLead(
  input: CreateAviseMeInput
): Promise<{ success: boolean; error?: string; leadId?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const cleanPhone = input.telefone.replace(/\D/g, '');

    if (!input.nome.trim()) {
      return { success: false, error: 'Por favor, informe seu nome.' };
    }

    if (cleanPhone.length < 10) {
      return { success: false, error: 'Por favor, informe um WhatsApp válido com DDD.' };
    }

    const { data, error } = await supabase
      .from('avise_me_espera')
      .insert({
        loja_id: input.lojaId || DEFAULT_TENANT_ID,
        produto_id: input.produtoId,
        produto_nome: input.produtoNome,
        variacao_cor: input.cor || null,
        variacao_tamanho: input.tamanho,
        cliente_nome: input.nome.trim(),
        cliente_telefone: cleanPhone,
        cliente_email: input.email?.trim() || null,
        status: 'pendente'
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ [aviseme.ts] Erro ao cadastrar na fila:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, leadId: data?.id };
  } catch (err: any) {
    console.error('❌ [aviseme.ts] Erro inesperado ao cadastrar:', err);
    return { success: false, error: err.message || 'Erro inesperado.' };
  }
}

/**
 * Consulta todas as leads na fila de espera da loja
 */
export async function getAviseMeLeads(
  lojaId: string = DEFAULT_TENANT_ID,
  status: 'pendente' | 'notificado' | 'todos' = 'pendente'
): Promise<AviseMeLead[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('avise_me_espera')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('❌ [aviseme.ts] Erro ao buscar leads:', error.message);
      return [];
    }

    return (data || []) as AviseMeLead[];
  } catch (err) {
    console.error('❌ [aviseme.ts] Erro geral:', err);
    return [];
  }
}

/**
 * Retorna um mapa consolidado de demanda reprimida por produto e por variação
 */
export async function getAviseMeSummaryMap(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ byProduct: Record<string, number>; byVariation: Record<string, number>; total: number }> {
  try {
    const leads = await getAviseMeLeads(lojaId, 'pendente');
    const byProduct: Record<string, number> = {};
    const byVariation: Record<string, number> = {};

    leads.forEach((l) => {
      byProduct[l.produto_id] = (byProduct[l.produto_id] || 0) + 1;
      const varKey = `${l.produto_id}_${l.variacao_tamanho}`.toLowerCase();
      byVariation[varKey] = (byVariation[varKey] || 0) + 1;
    });

    return {
      byProduct,
      byVariation,
      total: leads.length
    };
  } catch {
    return { byProduct: {}, byVariation: {}, total: 0 };
  }
}

/**
 * Marca uma lead como notificada
 */
export async function markAviseMeLeadNotified(leadId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('avise_me_espera')
      .update({
        status: 'notificado',
        notificado_em: new Date().toISOString()
      })
      .eq('id', leadId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Remove uma solicitação da fila
 */
export async function deleteAviseMeLead(leadId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('avise_me_espera')
      .delete()
      .eq('id', leadId);

    return !error;
  } catch {
    return false;
  }
}
