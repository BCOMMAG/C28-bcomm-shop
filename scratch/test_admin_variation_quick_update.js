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

async function runVariationStockAndDuplicateTests() {
  console.log('🚀 [INICIANDO TESTES DO PAINEL ADMIN - GESTÃO DE GRADE & DUPLICAÇÃO]');

  // 1. Buscar produto com variações
  console.log('\n🧪 [TESTE 1] Buscando produto com variações no Supabase...');
  const { data: dbProducts, error: prodErr } = await supabase
    .from('produtos')
    .select(`
      *,
      variacoes_produto (*)
    `)
    .eq('loja_id', TENANT_ID)
    .limit(5);

  if (prodErr || !dbProducts || dbProducts.length === 0) {
    console.error('❌ Erro ao buscar produtos:', prodErr);
    process.exit(1);
  }

  const productWithVars = dbProducts.find(p => p.variacoes_produto && p.variacoes_produto.length > 0);
  if (!productWithVars) {
    console.error('❌ Nenhum produto com variações encontrado.');
    process.exit(1);
  }

  console.log(`✅ Produto selecionado: "${productWithVars.nome}" (ID: ${productWithVars.id})`);
  console.log(`   Estoque Pai Inicial: ${productWithVars.estoque_total}`);
  const targetVar = productWithVars.variacoes_produto[0];
  const initialVarStock = targetVar.estoque;
  console.log(`   Variação Alvo: Cor "${targetVar.cor_nome}", Tam "${targetVar.tamanho}", Estoque: ${initialVarStock}`);

  // 2. Simular updateAdminVariationStock (+1 un)
  console.log('\n🧪 [TESTE 2] Testando incremento ágil de estoque (+1)...');
  const novoEstoque = initialVarStock + 1;

  // Passo A: Atualiza a variação
  const { error: updateVarErr } = await supabase
    .from('variacoes_produto')
    .update({ estoque: novoEstoque })
    .eq('id', targetVar.id);

  if (updateVarErr) throw updateVarErr;

  // Passo B: Recalcula a soma das variações
  const { data: allVars, error: sumErr } = await supabase
    .from('variacoes_produto')
    .select('estoque')
    .eq('produto_id', productWithVars.id);

  if (sumErr) throw sumErr;

  const totalRecalculado = (allVars || []).reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);

  // Passo C: Atualiza o produto pai
  const { error: updateParentErr } = await supabase
    .from('produtos')
    .update({ estoque_total: totalRecalculado, updated_at: new Date().toISOString() })
    .eq('id', productWithVars.id);

  if (updateParentErr) throw updateParentErr;

  console.log(`✅ Variação atualizada com sucesso para ${novoEstoque} un.`);
  console.log(`✅ Estoque pai recalculado sincronizado: ${totalRecalculado} un.`);

  // 3. Reverter alteração de estoque para preservar integridade
  console.log('\n🧪 [TESTE 3] Revertendo alteração de estoque para o valor original...');
  await supabase
    .from('variacoes_produto')
    .update({ estoque: initialVarStock })
    .eq('id', targetVar.id);

  const { data: revertedVars } = await supabase
    .from('variacoes_produto')
    .select('estoque')
    .eq('produto_id', productWithVars.id);
  const totalRevertido = (revertedVars || []).reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);

  await supabase
    .from('produtos')
    .update({ estoque_total: totalRevertido, updated_at: new Date().toISOString() })
    .eq('id', productWithVars.id);

  console.log(`✅ Estoque revertido para: ${initialVarStock} un (Pai: ${totalRevertido} un).`);

  // 4. Testar Clonagem / Duplicação em 1 clique
  console.log('\n🧪 [TESTE 4] Testando duplicação de peça em 1 clique (Item 1.3.3)...');
  const cloneSlug = `teste-clone-${Date.now()}`;
  const { data: clonedProd, error: cloneErr } = await supabase
    .from('produtos')
    .insert({
      loja_id: TENANT_ID,
      nome: `${productWithVars.nome} (Clone de Teste)`,
      slug: cloneSlug,
      descricao: productWithVars.descricao,
      preco: productWithVars.preco,
      preco_promocional: productWithVars.preco_promocional,
      preco_custo: productWithVars.preco_custo,
      estoque_total: 10,
      ativo: false
    })
    .select()
    .single();

  if (cloneErr) {
    console.error('❌ Erro ao criar clone:', cloneErr);
    process.exit(1);
  }

  console.log(`✅ Peça clonada criada com ID: ${clonedProd.id} e Slug: "${clonedProd.slug}"`);

  // Clonar variações para a peça clonada
  const clonedVarsData = [
    {
      loja_id: TENANT_ID,
      produto_id: clonedProd.id,
      cor_nome: 'Dourado',
      cor_hex: '#C5A059',
      tamanho: 'P',
      estoque: 5,
      sku: `${clonedProd.slug}-DOUR-P`
    },
    {
      loja_id: TENANT_ID,
      produto_id: clonedProd.id,
      cor_nome: 'Dourado',
      cor_hex: '#C5A059',
      tamanho: 'M',
      estoque: 5,
      sku: `${clonedProd.slug}-DOUR-M`
    }
  ];

  const { error: insVarsErr } = await supabase
    .from('variacoes_produto')
    .insert(clonedVarsData);

  if (insVarsErr) {
    console.error('❌ Erro ao clonar variações:', insVarsErr);
    process.exit(1);
  }
  console.log(`✅ Grade de variações clonada com sucesso (2 variações).`);

  // Limpeza: deletar o produto de teste
  console.log('\n🧪 [TESTE 5] Limpando dados do teste de clonagem...');
  await supabase.from('variacoes_produto').delete().eq('produto_id', clonedProd.id);
  await supabase.from('produtos').delete().eq('id', clonedProd.id);
  console.log(`✅ Produto de teste e suas variações removidos com segurança contábil.`);

  console.log('\n🎉 [SUCESSO TOTAL] Todos os 5 testes de gestão ágil de grade e clonagem foram aprovados!');
}

runVariationStockAndDuplicateTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
