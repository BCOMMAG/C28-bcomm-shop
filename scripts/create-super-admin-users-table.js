const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('🔗 Conectado ao PostgreSQL.');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.super_admin_usuarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      cargo VARCHAR(100) NOT NULL DEFAULT 'super_admin',
      ativo BOOLEAN NOT NULL DEFAULT true,
      is_root BOOLEAN NOT NULL DEFAULT false,
      ultimo_acesso TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Habilitar RLS
    ALTER TABLE public.super_admin_usuarios ENABLE ROW LEVEL SECURITY;

    -- Política para permitir leitura e escrita com chave anônima/service da aplicação
    DROP POLICY IF EXISTS "Acesso publico super_admin_usuarios" ON public.super_admin_usuarios;
    CREATE POLICY "Acesso publico super_admin_usuarios" ON public.super_admin_usuarios
      FOR ALL
      USING (true)
      WITH CHECK (true);

    -- Inserir ou atualizar o Master Root oficial
    INSERT INTO public.super_admin_usuarios (nome, email, senha_hash, cargo, ativo, is_root)
    VALUES (
      'Dono da Plataforma',
      'superadmin@bcomm.com.br',
      'SuperAdmin@2026!',
      'super_admin',
      true,
      true
    )
    ON CONFLICT (email) DO UPDATE SET
      senha_hash = EXCLUDED.senha_hash,
      is_root = true,
      ativo = true,
      updated_at = now();
  `;

  await client.query(sql);
  console.log('✅ Tabela super_admin_usuarios criada/atualizada com sucesso!');

  const check = await client.query('SELECT id, nome, email, cargo, ativo, is_root FROM public.super_admin_usuarios;');
  console.log('📋 Registros atuais:', check.rows);

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

