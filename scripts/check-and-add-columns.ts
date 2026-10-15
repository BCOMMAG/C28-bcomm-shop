import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase!');

    // 1. Adiciona coluna preco_custo na tabela produtos se não existir
    await client.query(`
      ALTER TABLE public.produtos 
      ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) DEFAULT NULL;
    `);
    console.log('✅ Coluna preco_custo verificada/adicionada em produtos!');

    // 2. Adiciona coluna configuracoes_financeiras em lojas se não existir
    await client.query(`
      ALTER TABLE public.lojas 
      ADD COLUMN IF NOT EXISTS configuracoes_financeiras JSONB DEFAULT '{
        "taxa_cartao_padrao": 3.5,
        "custo_embalagem_padrao": 8.00,
        "imposto_padrao": 4.0
      }'::jsonb;
    `);
    console.log('✅ Coluna configuracoes_financeiras verificada/adicionada em lojas!');

    // 3. Atualiza produtos da Leidy com um preço de custo de referência (~40% do preço) se for nulo
    await client.query(`
      UPDATE public.produtos 
      SET preco_custo = ROUND(preco * 0.40, 2)
      WHERE preco_custo IS NULL;
    `);
    console.log('✅ Preço de custo de referência populado para produtos existentes!');

    // 4. Garante permissões RLS para hero_banners, midias_produto e configuracoes
    await client.query(`
      DROP POLICY IF EXISTS "Permissao total hero_banners" ON public.hero_banners;
      CREATE POLICY "Permissao total hero_banners" ON public.hero_banners FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total midias_produto" ON public.midias_produto;
      CREATE POLICY "Permissao total midias_produto" ON public.midias_produto FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log('✅ Políticas RLS para hero_banners e midias_produto configuradas!');

  } catch (err) {
    console.error('Erro na migration:', err);
  } finally {
    await client.end();
  }
}

run();
