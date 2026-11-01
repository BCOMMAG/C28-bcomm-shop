const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Import the mapDbProductToProduct logic or execute it
async function check() {
  const { data } = await supabase
    .from('produtos')
    .select('*, variacoes_produto(*), midias_produto(*)')
    .ilike('nome', '%(Cópia)%');

  const p = data[0];
  
  // Vamos ver o que o mapDbProductToProduct faz
  const precoBase = Number(p.preco || 0);
  const precoPromo = p.preco_promocional ? Number(p.preco_promocional) : null;
  console.log({ precoBase, precoPromo });
  
  const hasRealDiscount = precoPromo !== null && precoPromo > 0 && precoPromo < precoBase;
  console.log("hasRealDiscount:", hasRealDiscount);
}
check();

