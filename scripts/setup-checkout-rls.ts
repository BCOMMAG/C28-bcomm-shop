import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega as variáveis de ambiente do .env.local nativamente
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

async function setupRLS() {
  console.log('\n📡 Conectando ao PostgreSQL do Supabase para ajustar RLS do Checkout...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida!');

    // Políticas robustas para clientes_loja (permite upsert/criação anônima de clientes e leads no checkout)
    console.log('⚙️ Atualizando políticas RLS para clientes_loja...');
    await client.query(`
      DROP POLICY IF EXISTS "Clientes anônimos podem criar cadastro no checkout" ON public.clientes_loja;
      DROP POLICY IF EXISTS "Leitura pública de clientes" ON public.clientes_loja;
      DROP POLICY IF EXISTS "Clientes anônimos podem atualizar seu cadastro" ON public.clientes_loja;

      CREATE POLICY "Clientes anônimos podem criar cadastro no checkout" 
        ON public.clientes_loja FOR INSERT WITH CHECK (true);

      CREATE POLICY "Clientes anônimos podem atualizar seu cadastro" 
        ON public.clientes_loja FOR UPDATE USING (true) WITH CHECK (true);

      CREATE POLICY "Leitura de clientes para checkout" 
        ON public.clientes_loja FOR SELECT USING (true);
    `);

    // Políticas robustas para pedidos e itens_pedido
    console.log('⚙️ Atualizando políticas RLS para pedidos e itens_pedido...');
    await client.query(`
      DROP POLICY IF EXISTS "Clientes anônimos podem registrar pedidos no checkout" ON public.pedidos;
      DROP POLICY IF EXISTS "Leitura pública de pedidos" ON public.pedidos;
      DROP POLICY IF EXISTS "Clientes anônimos podem registrar itens do pedido" ON public.itens_pedido;
      DROP POLICY IF EXISTS "Leitura pública de itens do pedido" ON public.itens_pedido;

      CREATE POLICY "Clientes anônimos podem registrar pedidos no checkout" 
        ON public.pedidos FOR INSERT WITH CHECK (true);

      CREATE POLICY "Leitura de pedidos para checkout" 
        ON public.pedidos FOR SELECT USING (true);

      CREATE POLICY "Clientes anônimos podem registrar itens do pedido" 
        ON public.itens_pedido FOR INSERT WITH CHECK (true);

      CREATE POLICY "Leitura de itens do pedido para checkout" 
        ON public.itens_pedido FOR SELECT USING (true);
    `);

    console.log('🎉 Políticas de Checkout & Leads configuradas com 100% de sucesso no Supabase!\n');
  } catch (error) {
    console.error('❌ Erro ao configurar RLS:', error);
  } finally {
    await client.end();
  }
}

setupRLS();
