import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export type CargoColaborador = 'dono' | 'gerente' | 'atendente' | 'estoquista';

export interface PermissoesColaborador {
  ver_financeiro: boolean;
  ver_cmv: boolean;
  editar_catalogo: boolean;
  excluir_catalogo: boolean;
  ajustar_estoque: boolean;
  gerenciar_pedidos: boolean;
  acessar_crm: boolean;
  exportar_clientes: boolean;
  gerenciar_cupons: boolean;
  configuracoes_loja: boolean;
  gerenciar_equipe: boolean;
}

export interface MembroEquipe {
  id: string;
  loja_id: string;
  auth_user_id?: string | null;
  nome: string;
  email: string;
  telefone: string;
  cargo: CargoColaborador;
  ativo: boolean;
  pin_hash?: string | null;
  token_version: number;
  convite_token?: string | null;
  convite_expira_em?: string | null;
  alcada_desconto_percentual: number;
  comissao_percentual: number;
  meta_vendas_mensal: number;
  codigo_vendedora?: string | null;
  horario_restrito: boolean;
  horario_inicio: string;
  horario_fim: string;
  dias_semana_permitidos: number[];
  modo_plantao_liberado: boolean;
  permissoes: PermissoesColaborador;
  ultimo_acesso?: string | null;
  created_at: string;
  updated_at: string;
  
  // Métricas agregadas de vendas
  total_vendas_mes?: number;
  comissao_acumulada_mes?: number;
  pedidos_atendidos_mes?: number;
}

export interface RegistroAuditoria {
  id: string;
  loja_id: string;
  colaborador_id?: string | null;
  colaborador_nome: string;
  cargo: string;
  acao: string;
  entidade: string;
  entidade_id?: string | null;
  ip_address?: string | null;
  dados_anteriores?: Record<string, any> | null;
  dados_novos?: Record<string, any> | null;
  motivo?: string | null;
  created_at: string;
}

export interface CreateTeamMemberInput {
  nome: string;
  email: string;
  telefone: string;
  cargo: CargoColaborador;
  alcada_desconto_percentual?: number;
  comissao_percentual?: number;
  meta_vendas_mensal?: number;
  codigo_vendedora?: string;
  horario_restrito?: boolean;
  horario_inicio?: string;
  horario_fim?: string;
  pin?: string;
}

/**
 * Permissões padrão por cargo
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<CargoColaborador, PermissoesColaborador> = {
  dono: {
    ver_financeiro: true,
    ver_cmv: true,
    editar_catalogo: true,
    excluir_catalogo: true,
    ajustar_estoque: true,
    gerenciar_pedidos: true,
    acessar_crm: true,
    exportar_clientes: true,
    gerenciar_cupons: true,
    configuracoes_loja: true,
    gerenciar_equipe: true
  },
  gerente: {
    ver_financeiro: false,
    ver_cmv: true,
    editar_catalogo: true,
    excluir_catalogo: false,
    ajustar_estoque: true,
    gerenciar_pedidos: true,
    acessar_crm: true,
    exportar_clientes: false,
    gerenciar_cupons: true,
    configuracoes_loja: false,
    gerenciar_equipe: true
  },
  atendente: {
    ver_financeiro: false,
    ver_cmv: false,
    editar_catalogo: false,
    excluir_catalogo: false,
    ajustar_estoque: false,
    gerenciar_pedidos: true,
    acessar_crm: true,
    exportar_clientes: false,
    gerenciar_cupons: false,
    configuracoes_loja: false,
    gerenciar_equipe: false
  },
  estoquista: {
    ver_financeiro: false,
    ver_cmv: false,
    editar_catalogo: false,
    excluir_catalogo: false,
    ajustar_estoque: true,
    gerenciar_pedidos: true,
    acessar_crm: false,
    exportar_clientes: false,
    gerenciar_cupons: false,
    configuracoes_loja: false,
    gerenciar_equipe: false
  }
};

/**
 * Busca todos os membros da equipe da loja com métricas agregadas de vendas
 */
export async function getTeamMembers(lojaId: string = DEFAULT_TENANT_ID): Promise<MembroEquipe[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: members, error } = await supabase
      .from('equipe_loja')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [team.ts] Erro ao buscar equipe:', error.message);
      return [];
    }

    if (!members || members.length === 0) return [];

    // Busca agregação de pedidos com vendedora vinculada
    const { data: orders } = await supabase
      .from('pedidos')
      .select('vendedora_id, total, comissao_valor, status')
      .eq('loja_id', lojaId)
      .not('vendedora_id', 'is', null);

    const metricsByMember: Record<string, { total: number; comissao: number; count: number }> = {};
    if (orders) {
      orders.forEach((o: any) => {
        if (!metricsByMember[o.vendedora_id]) {
          metricsByMember[o.vendedora_id] = { total: 0, comissao: 0, count: 0 };
        }
        if (o.status !== 'cancelado') {
          metricsByMember[o.vendedora_id].total += Number(o.total || 0);
          metricsByMember[o.vendedora_id].comissao += Number(o.comissao_valor || 0);
          metricsByMember[o.vendedora_id].count += 1;
        }
      });
    }

    return members.map((m: any) => {
      const metrics = metricsByMember[m.id] || { total: 0, comissao: 0, count: 0 };
      return {
        ...m,
        alcada_desconto_percentual: Number(m.alcada_desconto_percentual || 0),
        comissao_percentual: Number(m.comissao_percentual || 0),
        meta_vendas_mensal: Number(m.meta_vendas_mensal || 0),
        total_vendas_mes: metrics.total,
        comissao_acumulada_mes: metrics.comissao,
        pedidos_atendidos_mes: metrics.count,
        permissoes: typeof m.permissoes === 'object' && m.permissoes !== null
          ? m.permissoes
          : DEFAULT_PERMISSIONS_BY_ROLE[m.cargo as CargoColaborador] || DEFAULT_PERMISSIONS_BY_ROLE.atendente
      };
    });
  } catch (err) {
    console.error('❌ [team.ts] Erro geral ao obter membros da equipe:', err);
    return [];
  }
}

/**
 * Cria um novo colaborador na equipe
 */
export async function createTeamMember(
  lojaId: string = DEFAULT_TENANT_ID,
  input: CreateTeamMemberInput,
  autorNome: string = 'Administrador'
): Promise<{ success: boolean; member?: MembroEquipe; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const cleanEmail = input.email.trim().toLowerCase();
    const codigoVendedora = input.codigo_vendedora
      ? input.codigo_vendedora.trim().toLowerCase().replace(/\s+/g, '')
      : input.nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[input.cargo];
    const pin = input.pin?.trim() || Math.floor(1000 + Math.random() * 9000).toString();
    const conviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const conviteExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newMember = {
      loja_id: lojaId,
      nome: input.nome.trim(),
      email: cleanEmail,
      telefone: input.telefone.trim(),
      cargo: input.cargo,
      ativo: true,
      pin_hash: pin, // No contexto do balcão o PIN é de 4 dígitos
      token_version: 1,
      convite_token: conviteToken,
      convite_expira_em: conviteExpira,
      alcada_desconto_percentual: input.alcada_desconto_percentual ?? (input.cargo === 'atendente' ? 5 : input.cargo === 'gerente' ? 15 : 0),
      comissao_percentual: input.comissao_percentual ?? (input.cargo === 'atendente' ? 2.5 : input.cargo === 'gerente' ? 3.0 : 0),
      meta_vendas_mensal: input.meta_vendas_mensal ?? 10000,
      codigo_vendedora: codigoVendedora,
      horario_restrito: input.horario_restrito ?? (input.cargo === 'atendente' || input.cargo === 'estoquista'),
      horario_inicio: input.horario_inicio || '08:00:00',
      horario_fim: input.horario_fim || '19:00:00',
      dias_semana_permitidos: [1, 2, 3, 4, 5, 6],
      modo_plantao_liberado: false,
      permissoes: defaultPerms
    };

    const { data, error } = await supabase
      .from('equipe_loja')
      .insert([newMember])
      .select('*')
      .single();

    if (error) {
      console.error('❌ [team.ts] Erro ao cadastrar colaborador:', error.message);
      return { success: false, error: error.message };
    }

    // Registra auditoria
    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'dono',
      acao: 'convidou_colaborador',
      entidade: 'equipe',
      entidade_id: data.id,
      dados_novos: { nome: data.nome, cargo: data.cargo, email: data.email },
      motivo: `Novo colaborador (${data.cargo}) cadastrado na equipe`
    });

    return { success: true, member: data };
  } catch (err: any) {
    console.error('❌ [team.ts] Falha de execução ao criar colaborador:', err);
    return { success: false, error: err.message || 'Erro inesperado' };
  }
}

/**
 * Atualiza os dados ou permissões de um membro da equipe
 */
export async function updateTeamMember(
  lojaId: string = DEFAULT_TENANT_ID,
  memberId: string,
  updates: Partial<MembroEquipe>,
  autorNome: string = 'Administrador'
): Promise<{ success: boolean; member?: MembroEquipe; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data: previous } = await supabase
      .from('equipe_loja')
      .select('*')
      .eq('id', memberId)
      .eq('loja_id', lojaId)
      .single();

    const { data, error } = await supabase
      .from('equipe_loja')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('loja_id', lojaId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Registra auditoria
    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'dono',
      acao: 'atualizou_colaborador',
      entidade: 'equipe',
      entidade_id: memberId,
      dados_anteriores: previous,
      dados_novos: updates,
      motivo: `Atualização de perfil / permissões de ${data.nome}`
    });

    return { success: true, member: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Suspende ou reativa o acesso de um colaborador (1 clique)
 */
export async function toggleTeamMemberActive(
  lojaId: string = DEFAULT_TENANT_ID,
  memberId: string,
  ativo: boolean,
  autorNome: string = 'Administrador'
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('equipe_loja')
      .update({
        ativo,
        token_version: ativo ? undefined : Math.floor(Date.now() / 1000), // Invalida sessões ativas se suspender
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('loja_id', lojaId);

    if (error) return false;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'dono',
      acao: ativo ? 'reativou_colaborador' : 'suspendeu_colaborador',
      entidade: 'equipe',
      entidade_id: memberId,
      dados_novos: { ativo },
      motivo: ativo ? 'Acesso ao painel reativado' : 'Acesso ao painel suspenso pelo lojista'
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Kill-Switch: Força o encerramento de todas as sessões ativas de um colaborador
 */
export async function revokeAllSessions(
  lojaId: string = DEFAULT_TENANT_ID,
  memberId: string,
  autorNome: string = 'Administrador'
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const newTokenVersion = Math.floor(Date.now() / 1000);
    const { error } = await supabase
      .from('equipe_loja')
      .update({
        token_version: newTokenVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('loja_id', lojaId);

    if (error) return false;

    await logStoreAuditAction(lojaId, {
      colaborador_nome: autorNome,
      cargo: 'dono',
      acao: 'revogou_sessoes',
      entidade: 'equipe',
      entidade_id: memberId,
      motivo: 'Kill-switch acionado: todas as sessões ativas foram desconectadas forçadamente'
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Validação de PIN de 4 dígitos para troca rápida de vendedora no balcão
 */
export async function verifyMemberPin(
  lojaId: string = DEFAULT_TENANT_ID,
  memberId: string,
  pin: string
): Promise<{ valid: boolean; member?: MembroEquipe }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: member, error } = await supabase
      .from('equipe_loja')
      .select('*')
      .eq('id', memberId)
      .eq('loja_id', lojaId)
      .single();

    if (error || !member) return { valid: false };

    if (!member.ativo) return { valid: false };

    const isMatch = member.pin_hash === pin.trim();
    if (isMatch) {
      // Atualiza último acesso
      await supabase
        .from('equipe_loja')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', memberId);
    }

    return { valid: isMatch, member };
  } catch {
    return { valid: false };
  }
}

/**
 * Busca a trilha de auditoria recente da loja
 */
export async function getStoreAuditLogs(
  lojaId: string = DEFAULT_TENANT_ID,
  limit: number = 50
): Promise<RegistroAuditoria[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('auditoria_loja')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [team.ts] Erro ao buscar auditoria:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ [team.ts] Falha geral ao buscar auditoria:', err);
    return [];
  }
}

/**
 * Registra um evento de auditoria de forma assíncrona
 */
export async function logStoreAuditAction(
  lojaId: string = DEFAULT_TENANT_ID,
  action: Omit<RegistroAuditoria, 'id' | 'created_at' | 'loja_id'>
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('auditoria_loja').insert([
      {
        loja_id: lojaId,
        colaborador_id: action.colaborador_id || null,
        colaborador_nome: action.colaborador_nome || 'Sistema',
        cargo: action.cargo || 'sistema',
        acao: action.acao,
        entidade: action.entidade,
        entidade_id: action.entidade_id || null,
        ip_address: action.ip_address || null,
        dados_anteriores: action.dados_anteriores || null,
        dados_novos: action.dados_novos || null,
        motivo: action.motivo || null
      }
    ]);
  } catch (err) {
    console.warn('⚠️ [team.ts] Não foi possível registrar auditoria:', err);
  }
}

/**
 * Verifica se o colaborador está dentro do horário de expediente legal (CLT)
 */
export function checkWorkingHoursAccess(member: MembroEquipe): { permitido: boolean; motivo?: string } {
  // Proprietário e Gerente não têm restrição de expediente
  if (member.cargo === 'dono' || member.cargo === 'gerente') {
    return { permitido: true };
  }

  // Se não tiver restrição habilitada ou estiver em modo plantão liberado
  if (!member.horario_restrito || member.modo_plantao_liberado) {
    return { permitido: true };
  }

  // Obter hora local de Brasília (America/Sao_Paulo)
  const now = new Date();
  const options = { timeZone: 'America/Sao_Paulo', hour12: false };
  const formatterTime = new Intl.DateTimeFormat('pt-BR', { ...options, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatterDay = new Intl.DateTimeFormat('pt-BR', { ...options, weekday: 'short' });

  const timeParts = formatterTime.format(now).split(':');
  const currentMinutes = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

  // Verificar dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
  const dayOfWeek = now.getDay();
  if (member.dias_semana_permitidos && !member.dias_semana_permitidos.includes(dayOfWeek)) {
    return {
      permitido: false,
      motivo: 'Acesso bloqueado aos domingos e folgas em conformidade com o Art. 244 da CLT.'
    };
  }

  // Horários limite
  const startParts = (member.horario_inicio || '08:00:00').split(':');
  const endParts = (member.horario_fim || '19:00:00').split(':');
  const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
  const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return {
      permitido: false,
      motivo: `Acesso indisponível fora do horário de expediente (${member.horario_inicio.substring(0,5)} às ${member.horario_fim.substring(0,5)}). A Leidy Boutique respeita o seu descanso legal CLT.`
    };
  }

  return { permitido: true };
}
