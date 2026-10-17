const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
const parsed = {};
for (const line of lines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) parsed[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(parsed.NEXT_PUBLIC_SUPABASE_URL, parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const TENANT_ID = 'e8b7f890-4e3a-4a89-9c56-8e1234567890';

async function runGlobalSearchTests() {
  console.log('🚀 [INICIANDO TESTES DO SPOTLIGHT DE BUSCA UNIVERSAL & NOTIFICAÇÕES]');

  // 1. Testar Busca de Produtos
  console.log('\n🧪 [TESTE 1] Testando busca universal de produtos por palavra-chave ("Tricot")...');
  const { data: prods, error: pErr } = await supabase
    .from('produtos')
    .select('id, nome, slug, preco, foto_principal, categorias(nome)')
    .eq('loja_id', TENANT_ID)
    .ilike('nome', '%Tricot%')
    .limit(4);

  if (pErr) throw pErr;
  console.log(`✅ Produtos encontrados: ${prods.length}`);
  prods.forEach(p => console.log(`   - "${p.nome}" (R$ ${p.preco}) [Cat: ${p.categorias?.nome || 'Geral'}]`));

  // 2. Testar Busca de Pedidos
  console.log('\n🧪 [TESTE 2] Testando busca universal de pedidos...');
  const { data: orders, error: oErr } = await supabase
    .from('pedidos')
    .select(`
      id, numero_pedido, total, status, created_at,
      clientes_loja (nome)
    `)
    .eq('loja_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(4);

  if (oErr) throw oErr;
  console.log(`✅ Pedidos recuperados para o índice: ${orders.length}`);
  orders.forEach(o => console.log(`   - #${o.numero_pedido} | Cliente: ${o.clientes_loja?.nome || 'Cliente'} | Total: R$ ${o.total} | Status: ${o.status}`));

  // 3. Testar Notificações Operacionais de Pedidos Pendentes
  console.log('\n🧪 [TESTE 3] Testando consulta de notificações operacionais (pedidos pendentes)...');
  const { data: pending, error: pendErr } = await supabase
    .from('pedidos')
    .select(`
      id, numero_pedido, total, created_at,
      clientes_loja (nome)
    `)
    .eq('loja_id', TENANT_ID)
    .in('status', ['aguardando_whatsapp', 'novo', 'pendente'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (pendErr) throw pendErr;
  console.log(`✅ Pedidos aguardando ação: ${pending.length}`);
  pending.forEach(p => console.log(`   - #${p.numero_pedido} (${p.clientes_loja?.nome || 'Cliente'}) -> R$ ${p.total}`));

  // 4. Testar Busca de Clientes / Leads
  console.log('\n🧪 [TESTE 4] Testando índice de clientes CRM no Spotlight...');
  const { data: clients, error: cErr } = await supabase
    .from('clientes_loja')
    .select(`
      id, nome, telefone,
      pedidos (total, status)
    `)
    .eq('loja_id', TENANT_ID)
    .limit(4);

  if (cErr) throw cErr;
  console.log(`✅ Clientes indexados no Spotlight: ${clients.length}`);
  clients.forEach(c => {
    const validOrders = (c.pedidos || []).filter(o => o.status !== 'cancelado');
    const totalGasto = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    console.log(`   - ${c.nome} (${c.telefone}) | Pedidos: ${validOrders.length} | Total: R$ ${totalGasto.toFixed(2)}`);
  });

  console.log('\n🎉 [SUCESSO TOTAL] Todos os testes de busca universal e notificações foram aprovados!');
}

runGlobalSearchTests().catch(err => {
  console.error('❌ Falha nos testes de busca:', err);
  process.exit(1);
});
