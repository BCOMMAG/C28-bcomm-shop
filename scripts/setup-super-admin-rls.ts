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

async function setupSuperAdminRLS() {
  console.log('\n📡 Conectando ao PostgreSQL do Supabase para configurar permissões do Super Admin (/super-admin)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // 1. Permissões de INSERT, UPDATE e SELECT total para a tabela lojas
    console.log('⚙️ Atualizando políticas RLS para public.lojas...');
    await client.query(`
      DROP POLICY IF EXISTS "Inserção de lojas no super admin" ON public.lojas;
      CREATE POLICY "Inserção de lojas no super admin" 
        ON public.lojas FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Atualização total de lojas" ON public.lojas;
      CREATE POLICY "Atualização total de lojas" 
        ON public.lojas FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Leitura total de lojas" ON public.lojas;
      CREATE POLICY "Leitura total de lojas" 
        ON public.lojas FOR SELECT USING (true);
    `);

    // 2. Permissões para categorias e produtos (necessário para provisionar novos catálogos)
    console.log('⚙️ Atualizando políticas para clonagem de templates e onboarding express...');
    await client.query(`
      DROP POLICY IF EXISTS "Inserção de categorias no super admin" ON public.categorias;
      CREATE POLICY "Inserção de categorias no super admin" 
        ON public.categorias FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Leitura irrestrita de produtos para clone" ON public.produtos;
      CREATE POLICY "Leitura irrestrita de produtos para clone" 
        ON public.produtos FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Leitura irrestrita de variacoes para clone" ON public.variacoes_produto;
      CREATE POLICY "Leitura irrestrita de variacoes para clone" 
        ON public.variacoes_produto FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Leitura irrestrita de midias para clone" ON public.midias_produto;
      CREATE POLICY "Leitura irrestrita de midias para clone" 
        ON public.midias_produto FOR SELECT USING (true);
    `);

    console.log('🎉 Todas as políticas RLS para o Super Admin foram configuradas com 100% de sucesso no Supabase!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao configurar RLS do Super Admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupSuperAdminRLS();
