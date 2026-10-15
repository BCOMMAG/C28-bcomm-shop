import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega .env.local
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

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL ausente.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // 1. Políticas RLS para tabela lojas (leitura e gravação do Super Admin)
    console.log('🛠️ Aplicando políticas de gravação para lojas e catálogos...');
    await client.query(`
      DROP POLICY IF EXISTS "Permissao total lojas" ON public.lojas;
      CREATE POLICY "Permissao total lojas" ON public.lojas FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total categorias" ON public.categorias;
      CREATE POLICY "Permissao total categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total produtos" ON public.produtos;
      CREATE POLICY "Permissao total produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total variacoes" ON public.variacoes_produto;
      CREATE POLICY "Permissao total variacoes" ON public.variacoes_produto FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total midias" ON public.midias_produto;
      CREATE POLICY "Permissao total midias" ON public.midias_produto FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total pedidos" ON public.pedidos;
      CREATE POLICY "Permissao total pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total itens_pedido" ON public.itens_pedido;
      CREATE POLICY "Permissao total itens_pedido" ON public.itens_pedido FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Permissao total clientes_loja" ON public.clientes_loja;
      CREATE POLICY "Permissao total clientes_loja" ON public.clientes_loja FOR ALL USING (true) WITH CHECK (true);
    `);

    // 2. Inserir ou atualizar Tenant #2 oficial: Aura Privée
    console.log('🏛️ Cadastrando Tenant #2 oficial: Aura Privée...');
    await client.query(`
      INSERT INTO public.lojas (
        id,
        nome,
        slug,
        dominio_proprio,
        whatsapp,
        email,
        configuracoes_visuais,
        modulos_ativos,
        ativo
      ) VALUES (
        'f9c8e7d6-5b4a-3c2d-1e0f-9876543210ab',
        'Aura Privée',
        'aura-privee',
        'auraprivee.com.br',
        '5511999998888',
        'contato@auraprivee.com.br',
        '{
          "cor_primaria": "#E0A99A",
          "cor_secundaria": "#18181B",
          "cor_fundo": "#FAF8F5",
          "logo_url": "https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/tenants/leidy-boutique/images/logo.png",
          "tagline": "Alta Costura & Alfaiataria Feminina Exclusiva",
          "frete_gratis_valor": 400.00
        }'::jsonb,
        '{
          "frete_automatico": true,
          "rastreio_whatsapp": true,
          "recuperacao_carrinho": false,
          "checkout_transparente": false
        }'::jsonb,
        true
      )
      ON CONFLICT (slug) DO UPDATE SET
        nome = EXCLUDED.nome,
        whatsapp = EXCLUDED.whatsapp,
        configuracoes_visuais = EXCLUDED.configuracoes_visuais;
    `);

    console.log('🎉 Políticas RLS e Tenant #2 (Aura Privée) configurados com sucesso no Supabase!');
  } catch (err) {
    console.error('❌ Erro no script:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
