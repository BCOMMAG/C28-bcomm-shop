// ==============================================================================
// 🚀 SCRIPT DE SEED DO CATÁLOGO COMPLETO NO SUPABASE (TENANT #1 - LEIDY BOUTIQUE)
// Migra produtos, categorias, variações, mídias e banners para o PostgreSQL
// ==============================================================================

import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRODUCTS, CATEGORIES, STORE_INFO } from '../src/data/products';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega as variáveis de ambiente do .env.local nativamente
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const connectionString = process.env.DATABASE_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'e8b7f890-4e3a-4a89-9c56-8e1234567890';
const TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'leidy-boutique';

if (!connectionString) {
  console.error('\n❌ ERRO: DATABASE_URL não encontrada no .env.local!');
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runSeed() {
  console.log('\n============================================================');
  console.log('🚀 INICIANDO SEED DO CATÁLOGO DA LEIDY BOUTIQUE NO SUPABASE');
  console.log('============================================================\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com o Supabase PostgreSQL!');

    // 1. Ajustes e expansões não-destrutivas de colunas no schema
    console.log('\n🛠️ Verificando e garantindo colunas adicionais de alta fidelidade...');
    await client.query(`
      ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS detalhes TEXT[] DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS paired_with_slug TEXT;
      ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS foto_principal TEXT;
      ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS subcategoria TEXT;
      ALTER TABLE public.variacoes_produto ADD COLUMN IF NOT EXISTS imagem_url TEXT;
    `);
    console.log('✅ Colunas de alta fidelidade garantidas com sucesso.');

    // 2. Garantir que o Tenant #1 (Leidy Boutique) existe
    console.log(`\n🏬 Verificando Tenant: [${TENANT_SLUG}] (${TENANT_ID})...`);
    await client.query(
      `
      INSERT INTO public.lojas (id, nome, slug, whatsapp, email, configuracoes_visuais, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        slug = EXCLUDED.slug,
        whatsapp = EXCLUDED.whatsapp,
        email = EXCLUDED.email,
        configuracoes_visuais = EXCLUDED.configuracoes_visuais;
    `,
      [
        TENANT_ID,
        STORE_INFO.name,
        TENANT_SLUG,
        STORE_INFO.whatsapp,
        'contato@leidyboutique.com.br',
        JSON.stringify({
          cor_primaria: '#DFBE76',
          cor_secundaria: '#1A1918',
          cor_fundo: '#FAF8F5',
          logo_url: '/images/Logo sem fundo.png',
          tagline: STORE_INFO.tagline,
          frete_gratis_valor: STORE_INFO.freeShippingThreshold
        })
      ]
    );
    console.log('✅ Tenant #1 (Leidy Boutique) validado.');

    // 3. Cadastrar Categorias
    console.log('\n📂 Migrando Categorias...');
    const uniqueCategories = Array.from(
      new Set(
        PRODUCTS.map((p) => p.category)
          .concat(CATEGORIES.filter((c) => c !== 'Todos os Modelos' && c !== 'Mais Vendidos' && c !== 'OUTLET'))
          .filter(Boolean)
      )
    );

    const categoryMap = new Map<string, string>(); // nome -> uuid

    let order = 10;
    for (const catName of uniqueCategories) {
      const catSlug = slugify(catName);
      const res = await client.query(
        `
        INSERT INTO public.categorias (loja_id, nome, slug, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (loja_id, slug) DO UPDATE SET
          nome = EXCLUDED.nome,
          display_order = EXCLUDED.display_order
        RETURNING id;
      `,
        [TENANT_ID, catName, catSlug, order]
      );
      categoryMap.set(catName, res.rows[0].id);
      order += 10;
    }
    console.log(`✅ ${uniqueCategories.length} categorias cadastradas/sincronizadas.`);

    // 4. Migrar Produtos, Variações e Mídias
    console.log('\n👗 Migrando 16 Produtos de Luxo, Variações e Mídias...');
    let totalVariacoes = 0;
    let totalMidias = 0;

    for (const prod of PRODUCTS) {
      const categoriaId = categoryMap.get(prod.category) || null;
      const basePrice = prod.originalPrice || prod.price;
      const promoPrice = prod.originalPrice ? prod.price : null;
      const isNewArrival = Boolean(prod.isNewArrival || prod.status?.includes('Lançamento') || prod.status?.includes('Novidade'));

      // Inserir / Atualizar Produto
      const prodRes = await client.query(
        `
        INSERT INTO public.produtos (
          loja_id, categoria_id, nome, slug, descricao, detalhes,
          preco, preco_promocional, tecido, modelagem, linha, subcategoria,
          status_badges, destaque, outlet, mais_vendido, ultimas_pecas,
          estoque_total, rating, review_count, foto_principal, paired_with_slug, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, true)
        ON CONFLICT (loja_id, slug) DO UPDATE SET
          categoria_id = EXCLUDED.categoria_id,
          nome = EXCLUDED.nome,
          descricao = EXCLUDED.descricao,
          detalhes = EXCLUDED.detalhes,
          preco = EXCLUDED.preco,
          preco_promocional = EXCLUDED.preco_promocional,
          tecido = EXCLUDED.tecido,
          modelagem = EXCLUDED.modelagem,
          linha = EXCLUDED.linha,
          subcategoria = EXCLUDED.subcategoria,
          status_badges = EXCLUDED.status_badges,
          destaque = EXCLUDED.destaque,
          outlet = EXCLUDED.outlet,
          mais_vendido = EXCLUDED.mais_vendido,
          ultimas_pecas = EXCLUDED.ultimas_pecas,
          foto_principal = EXCLUDED.foto_principal,
          paired_with_slug = EXCLUDED.paired_with_slug,
          updated_at = timezone('utc'::text, now())
        RETURNING id;
      `,
        [
          TENANT_ID,
          categoriaId,
          prod.name,
          prod.id,
          prod.description,
          prod.details || [],
          basePrice,
          promoPrice,
          prod.fabric || null,
          prod.fit || null,
          prod.line || null,
          prod.subcategory || null,
          prod.status || [],
          isNewArrival,
          Boolean(prod.isOutlet),
          Boolean(prod.isBestSeller),
          Boolean(prod.isLastPieces),
          15, // estoque padrão
          prod.rating || 5.0,
          prod.reviewCount || 0,
          prod.thumbnail,
          prod.pairedWithId || null
        ]
      );

      const produtoId = prodRes.rows[0].id;

      // Limpar variações e mídias antigas para re-inserir atualizadas
      await client.query(`DELETE FROM public.variacoes_produto WHERE produto_id = $1;`, [produtoId]);
      await client.query(`DELETE FROM public.midias_produto WHERE produto_id = $1;`, [produtoId]);

      // Inserir Variações (Cores x Tamanhos)
      for (const cor of prod.colors) {
        for (const tam of prod.sizes) {
          const sku = `${prod.id}-${slugify(cor.name)}-${slugify(tam)}`;
          await client.query(
            `
            INSERT INTO public.variacoes_produto (loja_id, produto_id, cor_nome, cor_hex, tamanho, estoque, sku, imagem_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
            [TENANT_ID, produtoId, cor.name, cor.hex, tam, 5, sku, cor.imageSrc || null]
          );
          totalVariacoes++;
        }
      }

      // Inserir Mídias (Vídeos e Imagens)
      let mediaOrder = 1;
      for (const m of prod.media) {
        await client.query(
          `
          INSERT INTO public.midias_produto (loja_id, produto_id, tipo, url, label, display_order)
          VALUES ($1, $2, $3, $4, $5, $6);
        `,
          [TENANT_ID, produtoId, m.type, m.src, m.label, mediaOrder]
        );
        totalMidias++;
        mediaOrder++;
      }
    }
    console.log(`✅ 16 Produtos migrados.`);
    console.log(`✅ ${totalVariacoes} Variações de cor e tamanho cadastradas.`);
    console.log(`✅ ${totalMidias} Mídias (fotos e vídeos de provador) cadastradas.`);

    // 5. Cadastrar Hero Banner Oficial
    console.log('\n🎬 Cadastrando Hero Banner Oficial da Loja...');
    await client.query(`DELETE FROM public.hero_banners WHERE loja_id = $1;`, [TENANT_ID]);
    await client.query(
      `
      INSERT INTO public.hero_banners (
        loja_id, titulo, subtitulo, cta_texto, cta_link, tipo_midia,
        desktop_media_url, mobile_media_url, display_order, ativo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, true);
    `,
      [
        TENANT_ID,
        'Coleção Elegance & Alfaiataria',
        'Curadoria Exclusiva em Moda Feminina',
        'Conhecer Coleção',
        '#lancamentos',
        'video',
        '/video/header_video.mp4',
        '/video/header_video.mp4'
      ]
    );
    console.log('✅ Hero Banner registrado com sucesso.');

    // 6. Cadastrar Menus de Navegação
    console.log('\n🧭 Cadastrando Menus de Navegação Oficiais...');
    await client.query(`DELETE FROM public.menus_navegacao WHERE loja_id = $1;`, [TENANT_ID]);
    const menus = [
      { label: 'Início', href: '/', badge: null },
      { label: 'Catálogo', href: '/catalogo', badge: null },
      { label: 'Lançamentos', href: '/#lancamentos', badge: 'Novo' },
      { label: 'Mais Vendidos', href: '/#mais-vendidos', badge: 'Top' },
      { label: 'OUTLET', href: '/#outlet', badge: 'Promo' },
      { label: 'Últimas Peças', href: '/#ultimas-pecas', badge: null }
    ];

    let menuOrder = 1;
    for (const menu of menus) {
      await client.query(
        `
        INSERT INTO public.menus_navegacao (loja_id, label, href, badge_texto, display_order, ativo)
        VALUES ($1, $2, $3, $4, $5, true);
      `,
        [TENANT_ID, menu.label, menu.href, menu.badge, menuOrder]
      );
      menuOrder++;
    }
    console.log(`✅ ${menus.length} itens de menu cadastrados.`);

    console.log('\n============================================================');
    console.log('🎉 SEED DO SUPABASE CONCLUÍDO COM 100% DE SUCESSO!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ ERRO durante o seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
