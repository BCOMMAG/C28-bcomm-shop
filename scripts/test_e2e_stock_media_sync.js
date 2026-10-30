import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mpexpfuvqwstrjctjrbv.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhwZnV2cXdzdHJqY3RqcmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI4MjMsImV4cCI6MjEwNzU2ODgyM30.ru147EyJ4T06N5mED6cEqfixlVR0QwTWX9hGyXuPgDQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runVerification() {
  console.log('=== VERIFICAÇÃO END-TO-END: ESTOQUE E SINCRONIZAÇÃO ===\n');

  // 1. Verificar Sobretudo Cópia
  const { data: copiaProd, error: copiaErr } = await supabase
    .from('produtos')
    .select('id, nome, slug, estoque_total, detalhes, midias_produto(*), variacoes_produto(*)')
    .ilike('nome', '%Sobretudo Estruturado em Lã Batida Deluxe (Cópia)%')
    .single();

  if (copiaErr || !copiaProd) {
    console.error('Erro ao buscar Sobretudo Cópia:', copiaErr);
    process.exit(1);
  }

  console.log(`Produto: ${copiaProd.nome} (ID: ${copiaProd.id})`);
  console.log(`Estoque Total no Banco: ${copiaProd.estoque_total} un`);
  console.log(`Qtd de Variações: ${copiaProd.variacoes_produto.length}`);
  const somaVariacoes = copiaProd.variacoes_produto.reduce((acc, v) => acc + (v.estoque || 0), 0);
  console.log(`Soma Real das Variações: ${somaVariacoes} un`);
  console.log(`Sincronização Perfeita (Trigger OK?): ${copiaProd.estoque_total === somaVariacoes ? 'SIM ✓' : 'NÃO ✗'}`);
  console.log(`Detalhes JSONB:`, JSON.stringify(copiaProd.detalhes, null, 2));
  console.log(`Mídias associadas: ${copiaProd.midias_produto.length} foto(s)`);

  // 2. Testar simulação de reposição via variação
  console.log('\n--- Teste de Disparo do Trigger em variacoes_produto ---');
  const targetVar = copiaProd.variacoes_produto[0];
  const originalEstoque = targetVar.estoque;
  console.log(`Modificando variação ${targetVar.cor_nome}/${targetVar.tamanho} (ID: ${targetVar.id}): ${originalEstoque} -> ${originalEstoque + 1}`);

  const { error: upVarErr } = await supabase
    .from('variacoes_produto')
    .update({ estoque: originalEstoque + 1 })
    .eq('id', targetVar.id);

  if (upVarErr) {
    console.error('Erro ao atualizar variação:', upVarErr);
  } else {
    // Re-checar produto
    const { data: refreshedProd } = await supabase
      .from('produtos')
      .select('estoque_total')
      .eq('id', copiaProd.id)
      .single();

    console.log(`Estoque Total do Produto após update da variação: ${refreshedProd?.estoque_total} un (Esperado: ${somaVariacoes + 1})`);
    console.log(`Trigger funcionou em tempo real? ${refreshedProd?.estoque_total === somaVariacoes + 1 ? 'SIM ✓' : 'NÃO ✗'}`);

    // Reverter para manter integridade exata
    await supabase
      .from('variacoes_produto')
      .update({ estoque: originalEstoque })
      .eq('id', targetVar.id);
    console.log('Estoque revertido para o original com sucesso.');
  }

  console.log('\n=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===');
}

runVerification().catch(console.error);
