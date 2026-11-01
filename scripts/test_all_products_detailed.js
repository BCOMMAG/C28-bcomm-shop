const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testAllProductsParity() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const { data: produtos } = await supabase
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
      subcategoria,
      foto_principal,
      ativo,
      estoque_total,
      categorias ( nome ),
      variacoes_produto ( cor_nome, cor_hex, tamanho, estoque, preco, preco_promocional, sku ),
      midias_produto ( url, tipo, label, display_order )
    `)
    .order('created_at', { ascending: false });

  console.log('='.repeat(90));
  console.log(`AUDITORIA DETALHADA PEÇA POR PEÇA (${produtos.length} PRODUTOS NO BANCO)`);
  console.log('='.repeat(90));

  produtos.forEach((p, idx) => {
    const vars = p.variacoes_produto || [];
    const midias = p.midias_produto || [];
    const totalEstoque = vars.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
    const precoBase = Number(p.preco) || 0;
    const precoPromo = p.preco_promocional ? Number(p.preco_promocional) : null;
    const hasDiscount = precoPromo !== null && precoPromo > 0 && precoPromo < precoBase;
    const savings = hasDiscount ? precoBase - precoPromo : 0;
    const pct = hasDiscount ? Math.round((savings / precoBase) * 100) : 0;

    // Badges customizados
    const customBadges = [];
    if (Array.isArray(p.status_badges)) {
      p.status_badges.forEach((b) => {
        const clean = b.replace('[Badge] ', '').trim();
        if (clean && !['destaque', 'mais_vendido', 'outlet', 'ultimas_pecas', 'Lançamento', 'Destaque', 'Mais Vendido', 'Outlet', 'Últimas Peças'].includes(clean)) {
          customBadges.push(clean);
        }
      });
    }

    console.log(`\n[${idx + 1}/${produtos.length}] "${p.nome}" (slug: ${p.slug})`);
    console.log(`  ├── Status no Admin: Ativo=${p.ativo} | Categoria=${p.categorias?.nome || 'Geral'} | Tecido=${p.tecido || '-'} | Modelagem=${p.modelagem || '-'}`);
    console.log(`  ├── Precificação no Admin: Base=R$ ${precoBase.toFixed(2)} | Promo=${precoPromo ? `R$ ${precoPromo.toFixed(2)}` : 'Nenhum'} | Custo CMV=${p.preco_custo ? `R$ ${Number(p.preco_custo).toFixed(2)}` : '-'}`);
    
    // O que aparece na loja
    console.log(`  ├── Exibição na Loja:`);
    if (hasDiscount) {
      console.log(`  │   ├── Preço Original Riscado: R$ ${precoBase.toFixed(2).replace('.', ',')}`);
      console.log(`  │   ├── Preço Atual Promocional: R$ ${precoPromo.toFixed(2).replace('.', ',')}`);
      console.log(`  │   ├── Economia em Verde: "ECONOMIA DE R$ ${savings.toFixed(2).replace('.', ',')}! (${pct}% OFF)"`);
      console.log(`  │   └── Tag de Desconto: "${p.outlet ? `OUTLET ${pct}% OFF` : `${pct}% OFF`}"`);
    } else {
      console.log(`  │   ├── Preço de Venda: R$ ${precoBase.toFixed(2).replace('.', ',')}`);
      console.log(`  │   └── Desconto: Nenhum (Sem risco, sem tag verde)`);
    }

    // Sinalizadores
    const flagsLoja = [];
    if (p.destaque) flagsLoja.push('🌟 Lançamento');
    if (p.mais_vendido) flagsLoja.push('🔥 Mais Vendido');
    if (p.outlet) flagsLoja.push('🏷️ Outlet');
    if (p.ultimas_pecas) {
      if (totalEstoque <= 5 && totalEstoque > 0) {
        flagsLoja.push(`⏳ Últimas Peças (Restam ${totalEstoque} un)`);
      } else {
        flagsLoja.push(`⏳ Últimas Peças [SUPRIMIDO NA VITRINE: Estoque=${totalEstoque} > 5]`);
      }
    }
    customBadges.forEach((cb) => flagsLoja.push(`✨ ${cb}`));
    console.log(`  ├── Sinalizadores Visíveis na Vitrine: ${flagsLoja.length > 0 ? flagsLoja.join(' | ') : 'Nenhum'}`);

    // Grade física
    console.log(`  ├── Grade Física: ${vars.length} variações cadastradas | Estoque Total: ${totalEstoque} un`);
    const coresDistintas = Array.from(new Set(vars.map((v) => v.cor_nome)));
    const tamDistintos = Array.from(new Set(vars.map((v) => v.tamanho)));
    console.log(`  │   ├── Cores (${coresDistintas.length}): ${coresDistintas.join(', ')}`);
    console.log(`  │   └── Tamanhos (${tamDistintos.length}): ${tamDistintos.join(', ')}`);

    // Mídias
    console.log(`  └── Galeria: ${midias.length} mídias cadastradas | Foto Principal: ${p.foto_principal ? 'Definida' : 'Ausente'}`);
  });
}

testAllProductsParity().catch(console.error);

