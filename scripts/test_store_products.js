const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testStoreProducts() {
  const { data: dbProducts, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias (nome, slug),
      midias_produto (*),
      variacoes_produto (*)
    `)
    .ilike('nome', '%(Cópia)%');

  if (error) {
    console.error(error);
    return;
  }

  const dbProd = dbProducts[0];
  console.log("DB Prod preco:", dbProd.preco, "preco_promocional:", dbProd.preco_promocional);

  // Agora vamos rodar o código do mapDbProductToProduct
  // import from compiled or execute logic directly
  const precoBase = Number(dbProd.preco || 0);
  const precoPromo = dbProd.preco_promocional ? Number(dbProd.preco_promocional) : null;

  const detalhesObj = typeof dbProd.detalhes === 'object' && !Array.isArray(dbProd.detalhes) && dbProd.detalhes !== null ? dbProd.detalhes : {};
  const precosDiferenciados = detalhesObj.precos_diferenciados || {};

  const variations = [];
  if (Array.isArray(dbProd.variacoes_produto)) {
    dbProd.variacoes_produto.forEach(v => {
      const cor = (v.cor_nome || '').trim();
      const tam = (v.tamanho || '').trim();
      const stock = Number(v.estoque ?? 0);
      const customPriceItem = precosDiferenciados[`${cor}_${tam}`];
      const customPrice = customPriceItem?.preco !== undefined ? customPriceItem.preco : v.preco ? Number(v.preco) : undefined;
      const customPromoPrice = customPriceItem?.preco_promocional !== undefined ? customPriceItem.preco_promocional : v.preco_promocional ? Number(v.preco_promocional) : undefined;
      variations.push({
        cor, tam, stock,
        price: customPrice,
        promoPrice: customPromoPrice
      });
    });
  }

  const activeVarsWithStock = variations.filter((v) => v.stock > 0);
  const targetVars = activeVarsWithStock.length > 0 ? activeVarsWithStock : variations;

  const promoVariations = targetVars
    .map((v) => {
      const vBase = v.price && v.price > 0 ? v.price : precoBase;
      const vPromo = v.promoPrice && v.promoPrice > 0 ? v.promoPrice : null;
      if (vPromo !== null && vPromo < vBase) {
        return {
          promoPrice: vPromo,
          basePrice: vBase,
          savings: vBase - vPromo,
          discountPct: Math.round(((vBase - vPromo) / vBase) * 100)
        };
      }
      return null;
    })
    .filter(Boolean);

  let effectiveBasePrice = precoBase;
  let effectivePromoPrice = precoPromo;

  if (effectivePromoPrice === null && promoVariations.length > 0) {
    const minPromoItem = promoVariations.reduce(
      (min, cur) => (cur.promoPrice < min.promoPrice ? cur : min),
      promoVariations[0]
    );
    effectivePromoPrice = minPromoItem.promoPrice;
    effectiveBasePrice = minPromoItem.basePrice;
  }

  const hasRealDiscount = effectivePromoPrice !== null && effectivePromoPrice > 0 && effectivePromoPrice < effectiveBasePrice;
  const currentPrice = hasRealDiscount ? effectivePromoPrice : effectiveBasePrice;
  const originalPrice = hasRealDiscount ? effectiveBasePrice : undefined;
  const savingsAmount = hasRealDiscount ? (effectiveBasePrice - effectivePromoPrice) : undefined;
  const discountPercent = hasRealDiscount ? Math.round(((effectiveBasePrice - effectivePromoPrice) / effectiveBasePrice) * 100) : undefined;

  console.log("Resultado mapeado:");
  console.log({
    hasRealDiscount,
    currentPrice,
    originalPrice,
    savingsAmount,
    discountPercent,
    variations
  });
}

testStoreProducts();

