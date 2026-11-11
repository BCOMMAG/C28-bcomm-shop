const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('🔗 Conectado ao PostgreSQL.');

  const sql = `
    -- 1. Garante a extensão pgcrypto
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- 2. Garante a coluna token_version em equipe_loja
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'equipe_loja' AND column_name = 'token_version'
      ) THEN
        ALTER TABLE public.equipe_loja ADD COLUMN token_version INTEGER DEFAULT 1;
      END IF;
    END $$;

    -- 3. Criação da RPC segura admin_alterar_senha_colaborador
    CREATE OR REPLACE FUNCTION public.admin_alterar_senha_colaborador(
      p_loja_id UUID,
      p_alvo_member_id UUID,
      p_nova_senha TEXT,
      p_operador_email TEXT
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth, extensions
    AS $$
    DECLARE
      v_operador RECORD;
      v_alvo RECORD;
      v_is_master BOOLEAN;
      v_auth_user_id UUID;
    BEGIN
      -- A. Validação básica de entrada
      IF p_nova_senha IS NULL OR length(trim(p_nova_senha)) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A senha deve conter no mínimo 6 caracteres.');
      END IF;

      -- B. Verifica se quem está executando é Master God Mode
      v_is_master := (LOWER(TRIM(p_operador_email)) = 'superadmin@bcomm.com.br');

      -- C. Busca dados do operador na loja
      IF NOT v_is_master THEN
        SELECT * INTO v_operador FROM public.equipe_loja
        WHERE loja_id = p_loja_id AND email = LOWER(TRIM(p_operador_email)) AND ativo = true;

        IF v_operador IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'Operador não autorizado ou inativo.');
        END IF;
      END IF;

      -- D. Busca dados do membro alvo
      SELECT * INTO v_alvo FROM public.equipe_loja
      WHERE loja_id = p_loja_id AND id = p_alvo_member_id;

      IF v_alvo IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Colaborador não encontrado.');
      END IF;

      -- E. MATRIZ DE SEGURANÇA RBAC:
      -- 1. Imunidade Absoluta da Proprietária
      IF v_alvo.cargo = 'dono' AND NOT v_is_master AND v_operador.id != v_alvo.id THEN
        RETURN jsonb_build_object('success', false, 'error', 'O acesso da Proprietária possui imunidade absoluta e não pode ser alterado por outro colaborador.');
      END IF;

      -- 2. Restrições do Gerente
      IF NOT v_is_master AND v_operador.cargo = 'gerente' THEN
        IF v_operador.id = v_alvo.id THEN
          RETURN jsonb_build_object('success', false, 'error', 'Gerentes devem alterar sua própria senha através da recuperação segura por e-mail.');
        END IF;
        IF v_alvo.cargo = 'dono' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Gerentes não possuem permissão para alterar dados da Proprietária.');
        END IF;
      END IF;

      -- F. Atualização ou Criação da Conta no auth.users do Supabase
      SELECT id INTO v_auth_user_id FROM auth.users WHERE email = LOWER(TRIM(v_alvo.email));

      IF v_auth_user_id IS NOT NULL THEN
        -- Atualiza senha existente
        UPDATE auth.users
        SET encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
            updated_at = now()
        WHERE id = v_auth_user_id;
      ELSE
        -- Cria conta em auth.users caso tenha sido cadastrado apenas na tabela interna
        v_auth_user_id := gen_random_uuid();
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          v_auth_user_id,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          LOWER(TRIM(v_alvo.email)),
          crypt(p_nova_senha, gen_salt('bf')),
          now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object('nome', v_alvo.nome, 'cargo', v_alvo.cargo),
          now(),
          now()
        );

        -- Vincula identities para compatibilidade total com Supabase Auth
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          v_auth_user_id,
          jsonb_build_object('sub', v_auth_user_id::text, 'email', LOWER(TRIM(v_alvo.email))),
          'email',
          now(),
          now(),
          now()
        );

        UPDATE public.equipe_loja SET auth_user_id = v_auth_user_id WHERE id = v_alvo.id;
      END IF;

      -- G. Dispara o Kill-Switch: Incrementa token_version
      UPDATE public.equipe_loja
      SET token_version = COALESCE(token_version, 1) + 1,
          updated_at = now()
      WHERE id = v_alvo.id;

      -- H. Registra auditoria
      INSERT INTO public.auditoria_loja (
        loja_id, colaborador_nome, cargo, acao, entidade, entidade_id, dados_novos, motivo
      ) VALUES (
        p_loja_id,
        COALESCE(v_operador.nome, 'Master SaaS'),
        COALESCE(v_operador.cargo, 'super_admin'),
        'redefiniu_senha_colaborador',
        'equipe',
        v_alvo.id,
        jsonb_build_object('email', v_alvo.email, 'nome', v_alvo.nome, 'cargo', v_alvo.cargo),
        'Senha redefinida diretamente no painel com encerramento forçado de sessões ativas'
      );

      RETURN jsonb_build_object('success', true, 'message', 'Senha alterada e todas as sessões ativas foram desconectadas.');
    END;
    $$;

    -- Concede permissão de execução da RPC para usuários anônimos e autenticados
    GRANT EXECUTE ON FUNCTION public.admin_alterar_senha_colaborador(UUID, UUID, TEXT, TEXT) TO anon, authenticated, service_role;
  `;

  await client.query(sql);
  console.log('✅ RPC admin_alterar_senha_colaborador criada com sucesso!');

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

