import { Product, ProductMedia, ProductVariation } from '@/types';
import { PRODUCTS } from '@/data/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'e8b7f890-4e3a-4a89-9c56-8e1234567890';

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Converte o registro bruto do banco de dados (PostgreSQL/Supabase)
 * no formato tipado Product consumido pela vitrine e componentes.
 */
export function mapDbProductToProduct(dbProd: any): Product {
  const precoBase = Number(dbProd.preco || 0);
  const precoPromo = dbProd.preco_promocional ? Number(dbProd.preco_promocional) : null;
  const currentPrice = precoPromo !== null ? precoPromo : precoBase;
  const originalPrice = precoPromo !== null ? precoBase : undefined;

  let discountBadge: string | undefined = undefined;
  if (originalPrice && originalPrice > currentPrice) {
    const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    discountBadge = `OUTLET ${discountPercent}% OFF`;
  }

  // Agrupamento de Variações de Cores e Estoque por Grade
  const colorsMap = new Map<string, { name: string; hex: string; imageSrc?: string }>();
  const sizesSet = new Set<string>();
  const variations: ProductVariation[] = [];

  if (Array.isArray(dbProd.variacoes_produto)) {
    dbProd.variacoes_produto.forEach((v: any) => {
      const cor = (v.cor_nome || '').trim();
      const tam = (v.tamanho || '').trim();
      const stock = Number(v.estoque ?? 0);
      variations.push({
        id: v.id,
        color: cor,
        size: tam,
        stock,
        sku: v.sku || undefined,
        price: v.preco ? Number(v.preco) : undefined
      });
      if (tam) sizesSet.add(tam);
      if (cor && !colorsMap.has(cor)) {
        colorsMap.set(cor, {
          name: cor,
          hex: v.cor_hex || '#000000',
          imageSrc: v.imagem_url || undefined
        });
      }
    });
  }

  // Ordenação padronizada e lógica de tamanhos de moda
  const standardSizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'Tamanho Único', '34', '36', '38', '40', '42', '44', '46'];
  const sortedSizes = Array.from(sizesSet).sort((a, b) => {
    const idxA = standardSizeOrder.indexOf(a);
    const idxB = standardSizeOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Ordenação das Mídias (Fotos e Vídeos) - Filtra mídias ocultas da vitrine
  const mediaList: ProductMedia[] = [];
  if (Array.isArray(dbProd.midias_produto)) {
    const sortedMedia = [...dbProd.midias_produto].sort(
      (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
    );
    sortedMedia.forEach((m: any) => {
      // Mídias marcadas como ocultas são preservadas no acervo, mas não exibidas na vitrine
      if (m.label && m.label.includes('[OCULTO]')) {
        return;
      }
      mediaList.push({
        type: m.tipo === 'video' ? 'video' : 'image',
        src: m.url,
        label: m.label || ''
      });
    });
  }

  // Se a foto principal estiver oculta nas mídias, faz fallback para a primeira mídia visível
  const isMainPhotoHidden =
    Array.isArray(dbProd.midias_produto) &&
    dbProd.midias_produto.some(
      (m: any) => m.url === dbProd.foto_principal && m.label && m.label.includes('[OCULTO]')
    );

  const thumbnail =
    (!isMainPhotoHidden && dbProd.foto_principal) ||
    mediaList.find((m) => m.type === 'image')?.src ||
    '/placeholder-product.jpg';

  return {
    id: dbProd.slug, // Mantém o slug como id para compatibilidade de rotas e carrinho
    slug: dbProd.slug || dbProd.id,
    name: dbProd.nome,
    price: currentPrice,
    formattedPrice: formatPrice(currentPrice),
    originalPrice,
    formattedOriginalPrice: originalPrice ? formatPrice(originalPrice) : undefined,
    discountBadge,
    isOutlet: Boolean(dbProd.outlet),
    isBestSeller: Boolean(dbProd.mais_vendido),
    isNewArrival: Boolean(dbProd.destaque),
    isLastPieces: Boolean(dbProd.ultimas_pecas),
    remainingPieces: dbProd.ultimas_pecas ? 3 : undefined,
    badge: Array.isArray(dbProd.status_badges) && dbProd.status_badges.length > 0 ? dbProd.status_badges[0] : undefined,
    category: dbProd.categorias?.nome || 'Geral',
    subcategory: dbProd.subcategoria || undefined,
    fabric: dbProd.tecido || undefined,
    fit: dbProd.modelagem || undefined,
    line: dbProd.linha || undefined,
    status: Array.isArray(dbProd.status_badges) ? dbProd.status_badges : [],
    description: dbProd.descricao || '',
    details: Array.isArray(dbProd.detalhes) ? dbProd.detalhes : [],
    sizes: sortedSizes.length > 0 ? sortedSizes : ['Tamanho Único'],
    colors: Array.from(colorsMap.values()),
    variations,
    totalStock: Number(dbProd.estoque_total ?? variations.reduce((acc, v) => acc + v.stock, 0)),
    media: mediaList,
    thumbnail,
    rating: Number(dbProd.rating || 5.0),
    reviewCount: Number(dbProd.review_count || 0),
    pairedWithId: dbProd.paired_with_slug || undefined
  };
}

/**
 * Busca a lista de produtos de um Tenant no Supabase com fallback gracioso para os produtos locais.
 */
export async function getStoreProducts(lojaId: string = DEFAULT_TENANT_ID): Promise<Product[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categorias (nome, slug),
        variacoes_produto (*),
        midias_produto (*)
      `)
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ [Supabase] Erro ao buscar produtos dinâmicos, usando fallback local:', error.message);
      return PRODUCTS;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [Supabase] Nenhum produto ativo encontrado, usando fallback local.');
      return PRODUCTS;
    }

    return data.map(mapDbProductToProduct);
  } catch (err) {
    console.warn('⚠️ [Supabase] Falha de conexão ao carregar produtos, usando fallback local:', err);
    return PRODUCTS;
  }
}

/**
 * Busca os banners da vitrine da loja no Supabase.
 */
export async function getStoreHeroBanner(lojaId: string = DEFAULT_TENANT_ID) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
