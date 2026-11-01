const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, variacoes_produto(*), midias_produto(*)')
    .ilike('nome', '%(Cópia)%');

  if (error) console.error(error);
  else {
    const p = data[0];
    console.log("ID:", p.id);
    console.log("Nome:", p.nome);
    console.log("Slug:", p.slug);
    console.log("Preco (base):", p.preco);
    console.log("Preco Promocional:", p.preco_promocional);
    console.log("Outlet:", p.outlet);
    console.log("Ultimas Pecas:", p.ultimas_pecas);
    console.log("Destaque:", p.destaque);
    console.log("Detalhes:", JSON.stringify(p.detalhes, null, 2));
    console.log("Variacoes:", p.variacoes_produto.map(v => ({
      cor: v.cor_nome,
      tam: v.tamanho,
      estoque: v.estoque,
      preco: v.preco,
      preco_promocional: v.preco_promocional
    })));
  }
}
check();

