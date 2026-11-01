const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listTables() {
  const tables = [
    'lojas',
    'categorias',
    'produtos',
    'variacoes_produto',
    'midias_produto',
    'pedidos',
    'itens_pedido',
    'clientes_loja',
    'cupons',
    'hero_banners',
    'equipe_loja',
    'auditoria_equipe',
    'reservas_estoque',
    'avise_me_quando_chegar',
    'configuracoes_loja'
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) console.log(t, '❌ ERROR:', error.message);
    else console.log(t, '✅ COUNT:', count);
  }
}
listTables();

