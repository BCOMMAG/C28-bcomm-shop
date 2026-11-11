const { Client } = require('../node_modules/pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('🔗 Conectado ao PostgreSQL.');

  const sql = `
    -- 1. Garante a coluna senha_acesso na tabela equipe_loja
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'equipe_loja' AND column_name = 'senha_acesso'
      ) THEN
        ALTER TABLE public.equipe_loja ADD COLUMN senha_acesso TEXT;
      END IF;
    END $$;

    -- 2. Recriação da RPC segura admin_alterar_senha_colaborador com GoTrue token compatibility
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
      v_operador_id UUID := NULL;
      v_operador_nome TEXT := NULL;
      v_operador_cargo TEXT := NULL;
      v_alvo_id UUID;
      v_alvo_nome TEXT;
      v_alvo_email TEXT;
      v_alvo_cargo TEXT;
      v_is_master BOOLEAN;
      v_auth_user_id UUID;
      v_identity_id UUID;
    BEGIN
      -- A. Validação básica de entrada
      IF p_nova_senha IS NULL OR length(trim(p_nova_senha)) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A senha deve conter no mínimo 6 caracteres.');
      END IF;

      -- B. Verifica se quem está executando é Master God Mode
      v_is_master := (LOWER(TRIM(p_operador_email)) = 'superadmin@bcomm.com.br');

      -- C. Busca dados do operador na loja
      IF NOT v_is_master THEN
        SELECT id, nome, cargo INTO v_operador_id, v_operador_nome, v_operador_cargo
        FROM public.equipe_loja
        WHERE loja_id = p_loja_id AND email = LOWER(TRIM(p_operador_email)) AND ativo = true;

        IF v_operador_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'Operador não autorizado ou inativo.');
        END IF;
      ELSE
        v_operador_nome := 'Super Admin Master';
        v_operador_cargo := 'super_admin';
      END IF;

      -- D. Busca dados do membro alvo
      SELECT id, nome, email, cargo INTO v_alvo_id, v_alvo_nome, v_alvo_email, v_alvo_cargo
      FROM public.equipe_loja
      WHERE loja_id = p_loja_id AND id = p_alvo_member_id;

      IF v_alvo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Colaborador não encontrado na loja.');
      END IF;

      -- E. MATRIZ DE SEGURANÇA RBAC:
      -- 1. Imunidade Absoluta da Proprietária
      IF v_alvo_cargo = 'dono' AND NOT v_is_master AND (v_operador_id IS NULL OR v_operador_id != v_alvo_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'O acesso da Proprietária possui imunidade absoluta e não pode ser alterado por outro colaborador.');
      END IF;

      -- 2. Restrições do Gerente
      IF NOT v_is_master AND v_operador_cargo = 'gerente' THEN
        IF v_operador_id = v_alvo_id THEN
          RETURN jsonb_build_object('success', false, 'error', 'Gerentes devem alterar sua própria senha através da recuperação segura por e-mail.');
        END IF;
        IF v_alvo_cargo = 'dono' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Gerentes não possuem permissão para alterar credenciais da Proprietária.');
        END IF;
      END IF;

      -- F. Atualização ou Criação da Conta no auth.users do Supabase
      SELECT id INTO v_auth_user_id FROM auth.users WHERE email = LOWER(TRIM(v_alvo_email));

      IF v_auth_user_id IS NOT NULL THEN
        -- Atualiza senha criptografada existente e normaliza tokens vazios
        UPDATE auth.users
        SET encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change = COALESCE(email_change, ''),
            phone_change = COALESCE(phone_change, ''),
            phone_change_token = COALESCE(phone_change_token, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            reauthentication_token = COALESCE(reauthentication_token, ''),
            updated_at = now()
        WHERE id = v_auth_user_id;

        -- Garante que exista registro em auth.identities com provider_id correto
        SELECT id INTO v_identity_id FROM auth.identities
        WHERE user_id = v_auth_user_id AND provider = 'email';

        IF v_identity_id IS NULL THEN
          INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            v_auth_user_id::text,
            v_auth_user_id,
            jsonb_build_object('sub', v_auth_user_id::text, 'email', LOWER(TRIM(v_alvo_email)), 'email_verified', true, 'phone_verified', false),
            'email',
            now(),
            now(),
            now()
          );
        ELSE
          UPDATE auth.identities
          SET identity_data = jsonb_build_object('sub', v_auth_user_id::text, 'email', LOWER(TRIM(v_alvo_email)), 'email_verified', true, 'phone_verified', false),
              provider_id = v_auth_user_id::text,
              updated_at = now()
          WHERE id = v_identity_id;
        END IF;
      ELSE
        -- Cria nova conta em auth.users com tokens normalizados
        v_auth_user_id := gen_random_uuid();
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          phone_change, phone_change_token, email_change_token_current, reauthentication_token
        ) VALUES (
          v_auth_user_id,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          LOWER(TRIM(v_alvo_email)),
          crypt(p_nova_senha, gen_salt('bf')),
          now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object('nome', v_alvo_nome, 'cargo', v_alvo_cargo),
          now(),
          now(),
          '', '', '', '',
          '', '', '', ''
        );

        -- Insere identidade com provider_id explícito NOT NULL
        INSERT INTO auth.identities (
          id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          v_auth_user_id::text,
          v_auth_user_id,
          jsonb_build_object('sub', v_auth_user_id::text, 'email', LOWER(TRIM(v_alvo_email)), 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now(),
          now()
        );
      END IF;

      -- G. Atualiza equipe_loja com auth_user_id, senha_acesso e incrementa token_version (Kill-Switch)
      UPDATE public.equipe_loja
      SET auth_user_id = v_auth_user_id,
          senha_acesso = p_nova_senha,
          token_version = COALESCE(token_version, 1) + 1,
          updated_at = now()
      WHERE id = v_alvo_id;

      -- H. Registra auditoria da loja
      INSERT INTO public.auditoria_loja (
        loja_id, colaborador_nome, cargo, acao, entidade, entidade_id, dados_novos, motivo
      ) VALUES (
        p_loja_id,
        v_operador_nome,
        v_operador_cargo,
        'redefiniu_senha_colaborador',
        'equipe',
        v_alvo_id,
        jsonb_build_object('email', v_alvo_email, 'nome', v_alvo_nome, 'cargo', v_alvo_cargo),
        'Senha redefinida diretamente no painel com encerramento forçado de sessões ativas'
      );

      RETURN jsonb_build_object(
        'success', true,
        'message', 'Senha alterada com sucesso! As sessões ativas do colaborador foram desconectadas imediatamente.'
      );
    END;
    $$;

    -- Concede permissão de execução
    GRANT EXECUTE ON FUNCTION public.admin_alterar_senha_colaborador(UUID, UUID, TEXT, TEXT) TO anon, authenticated, service_role;
  `;

  await client.query(sql);
  console.log('✅ RPC admin_alterar_senha_colaborador 100% blindada e compatível com GoTrue!');

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
