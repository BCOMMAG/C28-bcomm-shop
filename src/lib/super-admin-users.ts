import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface SuperAdminUser {
  id: string;
  nome: string;
  email: string;
  senha_hash?: string;
  cargo: string;
  ativo: boolean;
  is_root: boolean;
  ultimo_acesso?: string | null;
  created_at: string;
  updated_at: string;
}

export const SUPER_ADMIN_ROOT_EMAIL = 'superadmin@bcomm.com.br';
export const SUPER_ADMIN_ROOT_PASSWORD = 'SuperAdmin@2026!';

/**
 * Consulta todos os operadores e administradores do Super Admin cadastrados.
 */
export async function getAllSuperAdminUsers(): Promise<SuperAdminUser[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('super_admin_usuarios')
      .select('id, nome, email, cargo, ativo, is_root, ultimo_acesso, created_at, updated_at')
      .order('is_root', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar super admins:', error.message);
      return [];
    }

    return (data || []) as SuperAdminUser[];
  } catch (err) {
    console.error('❌ Falha geral ao buscar super admins:', err);
    return [];
  }
}

/**
 * Cria um novo usuário/operador para o console Super Admin.
 */
export async function createSuperAdminUser(params: {
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  ativo?: boolean;
}): Promise<{ success: boolean; data?: SuperAdminUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanNome = params.nome.trim();
  const cleanSenha = params.senha.trim();
  const cleanCargo = params.cargo.trim() || 'super_admin';

  if (!cleanNome || !cleanEmail || !cleanSenha) {
    return { success: false, error: 'Nome, e-mail e senha são obrigatórios.' };
  }

  if (cleanSenha.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  try {
    const supabase = getSupabaseBrowserClient();

    // Verifica se já existe um usuário com esse e-mail
    const { data: existing } = await supabase
      .from('super_admin_usuarios')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Já existe um usuário com este e-mail no Super Admin.' };
    }

    const { data, error } = await supabase
      .from('super_admin_usuarios')
      .insert([
        {
          nome: cleanNome,
          email: cleanEmail,
          senha_hash: cleanSenha,
          cargo: cleanCargo,
          ativo: params.ativo !== undefined ? params.ativo : true,
          is_root: false
        }
      ])
      .select('id, nome, email, cargo, ativo, is_root, ultimo_acesso, created_at, updated_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SuperAdminUser };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao criar usuário do Super Admin.' };
  }
}

/**
 * Atualiza os dados de um operador do Super Admin.
 */
export async function updateSuperAdminUser(
  id: string,
  params: {
    nome?: string;
    email?: string;
    senha?: string;
    cargo?: string;
    ativo?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Verifica se é o usuário Root (não pode alterar e-mail nem ser desativado)
    const { data: current } = await supabase
      .from('super_admin_usuarios')
      .select('is_root, email')
      .eq('id', id)
      .single();

    if (current?.is_root) {
      if (params.ativo === false) {
        return { success: false, error: 'O acesso Master Root do Dono não pode ser desativado.' };
      }
      if (params.email && params.email.trim().toLowerCase() !== SUPER_ADMIN_ROOT_EMAIL) {
        return { success: false, error: 'O e-mail do Dono da Plataforma não pode ser alterado.' };
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (params.nome) updatePayload.nome = params.nome.trim();
    if (params.email && !current?.is_root) updatePayload.email = params.email.trim().toLowerCase();
    if (params.senha && params.senha.trim().length >= 6) {
      updatePayload.senha_hash = params.senha.trim();
    }
    if (params.cargo && !current?.is_root) updatePayload.cargo = params.cargo.trim();
    if (params.ativo !== undefined && !current?.is_root) updatePayload.ativo = params.ativo;

    const { error } = await supabase
      .from('super_admin_usuarios')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao atualizar usuário do Super Admin.' };
  }
}

/**
 * Ativa ou pausa um operador do Super Admin com um clique.
 */
export async function toggleSuperAdminStatus(id: string, nextStatus: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: current } = await supabase
      .from('super_admin_usuarios')
      .select('is_root')
      .eq('id', id)
      .single();

    if (current?.is_root && !nextStatus) {
      return { success: false, error: 'O usuário Master Root não pode ser desativado.' };
    }

    const { error } = await supabase
      .from('super_admin_usuarios')
      .update({ ativo: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao alternar status do operador.' };
  }
}

/**
 * Exclui um operador do Super Admin (com proteção ao Master Root).
 */
export async function deleteSuperAdminUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data: user } = await supabase
      .from('super_admin_usuarios')
      .select('email, is_root')
      .eq('id', id)
      .single();

    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (user.is_root || user.email === SUPER_ADMIN_ROOT_EMAIL) {
      return { success: false, error: 'O acesso Master Root do Dono da Plataforma é intocável e não pode ser excluído.' };
    }

    const { error } = await supabase
      .from('super_admin_usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir usuário.' };
  }
}

/**
 * Validação de credenciais de login no console Super Admin.
 * Valida tanto o Master Root oficial quanto operadores criados dinamicamente na tabela.
 */
export async function verifySuperAdminLogin(
  email: string,
  senha: string
): Promise<{ success: boolean; user?: SuperAdminUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanSenha = senha.trim();

  // 1. Validação do Master Root nativo
  if (cleanEmail === SUPER_ADMIN_ROOT_EMAIL && cleanSenha === SUPER_ADMIN_ROOT_PASSWORD) {
    // Atualiza último acesso se existir na tabela
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('super_admin_usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('email', SUPER_ADMIN_ROOT_EMAIL);
    } catch {}

    return {
      success: true,
      user: {
        id: 'master-root-id',
        nome: 'Dono da Plataforma',
        email: SUPER_ADMIN_ROOT_EMAIL,
        cargo: 'super_admin',
        ativo: true,
        is_root: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  // 2. Validação dinâmica na tabela super_admin_usuarios
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: user, error } = await supabase
      .from('super_admin_usuarios')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return { success: false, error: 'Credenciais de Super Administrador incorretas.' };
    }

    if (!user.ativo) {
      return { success: false, error: 'Este acesso ao Super Admin está suspenso ou desativado pelo Dono.' };
    }

    if (user.senha_hash !== cleanSenha) {
      return { success: false, error: 'Credenciais de Super Administrador incorretas.' };
    }

    // Registra o último acesso
    await supabase
      .from('super_admin_usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', user.id);

    return {
      success: true,
      user: user as SuperAdminUser
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao validar credenciais.' };
  }
}

