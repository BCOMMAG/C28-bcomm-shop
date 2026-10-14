import fs from 'fs';
import pg from 'pg';
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

const connectionString = process.env.DATABASE_URL;

async function setupAdminRLS() {
  console.log('\n📡 Conectando ao PostgreSQL do Supabase para configurar permissões do Painel Administrativo (/admin)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // 1. Permissões de atualização para pedidos (mudar status e inserir rastreio)
    console.log('⚙️ Atualizando políticas para pedidos e itens...');
    await client.query(`
      DROP POLICY IF EXISTS "Atualização de pedidos no admin" ON public.pedidos;
      CREATE POLICY "Atualização de pedidos no admin" 
        ON public.pedidos FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Atualização de itens no admin" ON public.itens_pedido;
      CREATE POLICY "Atualização de itens no admin" 
        ON public.itens_pedido FOR UPDATE USING (true) WITH CHECK (true);
    `);

    // 2. Permissões de atualização e inserção para produtos e variações (gerenciar catálogo)
    console.log('⚙️ Atualizando políticas para produtos, variações e categorias...');
    await client.query(`
      DROP POLICY IF EXISTS "Atualização de produtos no admin" ON public.produtos;
      CREATE POLICY "Atualização de produtos no admin" 
        ON public.produtos FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Inserção de produtos no admin" ON public.produtos;
      CREATE POLICY "Inserção de produtos no admin" 
        ON public.produtos FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Atualização de variacoes no admin" ON public.variacoes_produto;
      CREATE POLICY "Atualização de variacoes no admin" 
        ON public.variacoes_produto FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Inserção de variacoes no admin" ON public.variacoes_produto;
      CREATE POLICY "Inserção de variacoes no admin" 
        ON public.variacoes_produto FOR INSERT WITH CHECK (true);
    `);

    // 3. Permissões para hero_banners e lojas
    console.log('⚙️ Atualizando políticas para lojas e hero_banners...');
    await client.query(`
      DROP POLICY IF EXISTS "Atualização de lojas no admin" ON public.lojas;
      CREATE POLICY "Atualização de lojas no admin" 
        ON public.lojas FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Atualização de banners no admin" ON public.hero_banners;
      CREATE POLICY "Atualização de banners no admin" 
        ON public.hero_banners FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Inserção de banners no admin" ON public.hero_banners;
      CREATE POLICY "Inserção de banners no admin" 
        ON public.hero_banners FOR INSERT WITH CHECK (true);
    `);

    console.log('🎉 Todas as políticas RLS para o Painel /admin foram configuradas com 100% de sucesso no Supabase!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao configurar RLS de admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupAdminRLS();
