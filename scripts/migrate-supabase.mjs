// ==============================================================================
// 🚀 SCRIPT DE MIGRAÇÃO AUTOMATIZADA PARA O SUPABASE
// Executa o script docs/DATABASE_SCHEMA.sql diretamente no PostgreSQL do Supabase
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega a URL de conexão do argumento da linha de comando ou da variável de ambiente
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('\n❌ ERRO: Nenhuma string de conexão do Supabase fornecida!');
  console.log('👉 Uso: node scripts/migrate-supabase.mjs "postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres"\n');
  process.exit(1);
}

async function runMigration() {
  console.log('\n📡 Conectando ao banco de dados PostgreSQL do Supabase...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso com o Supabase!\n');

    // Lê o arquivo DATABASE_SCHEMA.sql
    const schemaPath = path.join(__dirname, '..', 'docs', 'DATABASE_SCHEMA.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Executando o script docs/DATABASE_SCHEMA.sql no Supabase...');
    await client.query(sqlContent);
    console.log('🎉 Todas as tabelas, índices e políticas de RLS foram criadas com sucesso!\n');

    // Validação: Lista as tabelas criadas no schema público
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas ativas encontradas no Supabase:');
    tablesRes.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. public.${row.table_name}`);
    });

    // Validação do Tenant #1 (Leidy Boutique)
    const storeRes = await client.query(`SELECT id, nome, slug, whatsapp FROM public.lojas;`);
    console.log('\n🏬 Lojas (Tenants) cadastradas no banco:');
    storeRes.rows.forEach((loja) => {
      console.log(`   ✨ [${loja.nome}] (Slug: ${loja.slug}) | WhatsApp: ${loja.whatsapp} | ID: ${loja.id}`);
    });

    console.log('\n🚀 MIGRAÇÃO CONCLUÍDA COM 100% DE SUCESSO!\n');
  } catch (error) {
    console.error('\n❌ ERRO durante a execução da migração no Supabase:', error.message);
    if (error.code) console.error('Código do erro:', error.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
