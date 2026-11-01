const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function runAudit() {
  console.log('🔍 INICIANDO AUDITORIA MINUCIOSA DE PARIDADE: LOJA VS ADMIN...');

  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local não encontrado');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);

  if (!urlMatch || !keyMatch) {
    console.error('❌ Credenciais ausentes no .env.local');
    return;
  }

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  // 1. Consulta a loja oficial
  const { data: loja, error: lojaErr } = await supabase
    .from('lojas')
    .select('*')
    .eq('slug', 'leidy-boutique')
    .single();

  if (lojaErr || !loja) {
    console.error('❌ Erro ao consultar loja:', lojaErr);
    return;
  }

  console.log(`✅ Loja carregada: ${loja.nome} (ID: ${loja.id})`);
  const sinalizadoresLoja = loja?.configuracoes_visuais?.atributos_pecas?.sinalizadores || [];
  console.log(`📋 Sinalizadores configurados na loja (${sinalizadoresLoja.length}):`);
  sinalizadoresLoja.forEach((s) => console.log(`   - [${s.icone || s.icon || '✨'}] ${s.nome || s.label} (id: ${s.id}, cor: ${s.cor || s.color}, ativo: ${s.ativo !== false})`));

  // 2. Consulta todos os produtos da loja
  const { data: produtos, error: prodErr } = await supabase
    .from('produtos')
    .select(`
      id,
      slug,
      nome,
      preco,
      preco_promocional,
      preco_custo,
      destaque,
      mais_vendido,
      outlet,
      ultimas_pecas,
      status_badges,
      detalhes,
      tecido,
      modelagem,
      linha,
      subcategoria,
      descricao,
      foto_principal,
      ativo,
      estoque_total,
      categorias ( id, nome ),
      variacoes_produto ( id, cor_nome, cor_hex, tamanho, estoque, preco, preco_promocional, sku ),
      midias_produto ( id, url, tipo, label, display_order )
    `)
    .eq('loja_id', loja.id)
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.error('❌ Erro ao consultar produtos:', prodErr);
    return;
  }

  console.log(`\n📦 Total de produtos cadastrados no banco para esta loja: ${produtos.length}`);

  const report = {
    totalProdutos: produtos.length,
    produtosAtivos: produtos.filter((p) => p.ativo).length,
    produtosPausados: produtos.filter((p) => !p.ativo).length,
    itensComDescontoNoAdmin: [],
    itensSemDescontoNoAdmin: [],
    itensOutletNoAdmin: [],
    itensDestaqueNoAdmin: [],
    itensMaisVendidoNoAdmin: [],
    itensUltimasPecasNoAdmin: [],
    discrepanciasDetectadas: []
  };

  produtos.forEach((p) => {
    const vars = p.variacoes_produto || [];
    const midias = p.midias_produto || [];
    const totalEstoque = vars.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
    const precoBase = Number(p.preco) || 0;
    const precoPromo = p.preco_promocional ? Number(p.preco_promocional) : null;
    const temDescontoBase = precoPromo !== null && precoPromo > 0 && precoPromo < precoBase;

    // Checa variações com preço promocional diferenciado
    const promoVars = vars.filter((v) => v.preco_promocional && Number(v.preco_promocional) < (Number(v.preco) || precoBase));

    const info = {
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      ativo: p.ativo,
      precoBase,
      precoPromo,
      temDescontoBase,
      promovarsCount: promoVars.length,
      isOutlet: Boolean(p.outlet),
      isDestaque: Boolean(p.destaque),
      isMaisVendido: Boolean(p.mais_vendido),
      isUltimasPecasFlag: Boolean(p.ultimas_pecas),
      estoqueTotal: totalEstoque,
      statusBadges: p.status_badges || [],
      detalhesBadges: p.detalhes?.badges || [],
      fotosCount: midias.length
    };

    if (temDescontoBase || promoVars.length > 0) {
      report.itensComDescontoNoAdmin.push(info);
    } else {
      report.itensSemDescontoNoAdmin.push(info);
    }

    if (p.outlet) report.itensOutletNoAdmin.push(info);
    if (p.destaque) report.itensDestaqueNoAdmin.push(info);
    if (p.mais_vendido) report.itensMaisVendidoNoAdmin.push(info);
    if (p.ultimas_pecas) report.itensUltimasPecasNoAdmin.push(info);

    // Auditoria de inconsistências potenciais
    // 1. Promoção maior ou igual ao preço base
    if (precoPromo !== null && precoPromo >= precoBase && precoBase > 0) {
      report.discrepanciasDetectadas.push({
        tipo: 'PRECO_PROMO_INVALIDO',
        produto: p.nome,
        detalhe: `Preço promocional (R$ ${precoPromo}) >= Preço de venda (R$ ${precoBase})`
      });
    }

    // 2. Peça marcada como Outlet sem desconto configurado
    if (p.outlet && !temDescontoBase && promoVars.length === 0) {
      report.discrepanciasDetectadas.push({
        tipo: 'OUTLET_SEM_DESCONTO',
        produto: p.nome,
        detalhe: `Marcado como Outlet no Admin, mas sem preço promocional definido nem na peça nem nas variações (Preço: R$ ${precoBase})`
      });
    }

    // 3. Peça marcada com desconto mas SEM flag Outlet
    if (temDescontoBase && !p.outlet) {
      report.discrepanciasDetectadas.push({
        tipo: 'DESCONTO_FORA_DE_OUTLET',
        produto: p.nome,
        detalhe: `Possui preço promocional (R$ ${precoPromo} vs R$ ${precoBase}), mas NÃO está marcado como Outlet (aparece como promoção normal da boutique)`
      });
    }

    // 4. Peça com flag 'ultimas_pecas = true', mas estoque físico abundante (> 5 un)
    if (p.ultimas_pecas && totalEstoque > 5) {
      report.discrepanciasDetectadas.push({
        tipo: 'ULTIMAS_PECAS_COM_ESTOQUE_ALTO',
        produto: p.nome,
        detalhe: `Flag ultimas_pecas ativa, porém possui ${totalEstoque} unidades em estoque (a regra de escassez da vitrine oculta o selo acima de 5 un)`
      });
    }

    // 5. Peça sem variações cadastradas
    if (vars.length === 0) {
      report.discrepanciasDetectadas.push({
        tipo: 'SEM_VARIACOES',
        produto: p.nome,
        detalhe: 'Não possui nenhuma variação física (cor/tamanho) cadastrada na grade'
      });
    }

    // 6. Peça sem fotos
    if (midias.length === 0 && !p.foto_principal) {
      report.discrepanciasDetectadas.push({
        tipo: 'SEM_FOTOS',
        produto: p.nome,
        detalhe: 'Não possui foto principal nem mídias cadastradas'
      });
    }
  });

  console.log('\n--- RESUMO DA AUDITORIA ---');
  console.log(`Ativos na Vitrine: ${report.produtosAtivos}`);
  console.log(`Pausados / Ocultos: ${report.produtosPausados}`);
  console.log(`Peças com Desconto no Admin: ${report.itensComDescontoNoAdmin.length}`);
  console.log(`Peças com Flag Outlet no Admin: ${report.itensOutletNoAdmin.length}`);
  console.log(`Peças com Flag Destaque no Admin: ${report.itensDestaqueNoAdmin.length}`);
  console.log(`Peças com Flag Mais Vendido no Admin: ${report.itensMaisVendidoNoAdmin.length}`);
  console.log(`Peças com Flag Últimas Peças no Admin: ${report.itensUltimasPecasNoAdmin.length}`);
  console.log(`\nDiscrepâncias / Alertas Encontrados (${report.discrepanciasDetectadas.length}):`);
  report.discrepanciasDetectadas.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.tipo}] "${d.produto}": ${d.detalhe}`);
  });

  // Salva o relatório detalhado em arquivo para consulta
  fs.writeFileSync(
    path.join(__dirname, 'audit_report.json'),
    JSON.stringify({ report, produtosAmbos: produtos }, null, 2)
  );
  console.log('\n✅ Relatório salvo em scripts/audit_report.json');
}

runAudit().catch(console.error);

