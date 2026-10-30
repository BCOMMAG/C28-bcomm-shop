import { Product, ProductMedia, ProductVariation } from '@/types';
import { PRODUCTS } from '@/data/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'e8b7f890-4e3a-4a89-9c56-8e1234567890';

export const BOUTIQUE_OFFICIAL_COLORS = [
  { nome: 'Preto Clássico', hex: '#1A1918' },
  { nome: 'Branco Off-White', hex: '#FAF9F6' },
  { nome: 'Rosa Quartz', hex: '#E8A598' },
  { nome: 'Dourado Champagne', hex: '#DFBE76' },
  { nome: 'Bege Areia Nobre', hex: '#E2D3B8' },
  { nome: 'Marrom Caramelo', hex: '#8B5A2B' },
  { nome: 'Terracota Nobre', hex: '#C05A46' },
  { nome: 'Verde Esmeralda', hex: '#1B4D3E' },
  { nome: 'Azul Serenity', hex: '#92A1CF' },
  { nome: 'Lavanda Imperial', hex: '#967BB6' }
];

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Detecta de forma infalível se uma URL aponta para um arquivo de vídeo.
 * Trata extensões modernas (.mp4, .mov, .webm, etc.) e limpa query strings e fragmentos de CDN/R2.
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase().trim();
  return /\.(mp4|mov|webm|m4v|ogv|avi)$/i.test(clean) || clean.includes('/videos/');
}

/**
 * Heurística dupla para determinação de tipo de mídia (vídeo ou imagem).
 */
export function detectMediaType(tipo?: string | null, url?: string | null): 'video' | 'image' {
  if (isVideoUrl(url)) return 'video';
  if (tipo === 'video') return 'video';
  return 'image';
}

/**
 * Utilitário para interpretar tags de metadados embutidas no label da mídia
 * Ex: "[COR: Marrom Caramelo] [CAPA_COR] [OCULTO] Foto 1"
 */
export function parseMediaColor(label?: string): {
  colorName?: string;
  isColorCover: boolean;
  isHidden: boolean;
  cleanLabel: string;
} {
  if (!label) return { isColorCover: false, isHidden: false, cleanLabel: '' };
  const isHidden = label.includes('[OCULTO]');
  const isColorCover = label.includes('[CAPA_COR]') || label.toLowerCase().includes('capa');
  const colorMatch = label.match(/\[COR:\s*([^\]]+)\]/i);
  const colorName = colorMatch ? colorMatch[1].trim() : undefined;
  const cleanLabel = label
    .replace(/\[OCULTO\]/gi, '')
    .replace(/\[CAPA_COR\]/gi, '')
    .replace(/\[COR:\s*[^\]]+\]/gi, '')
    .trim();
  return { colorName, isColorCover, isHidden, cleanLabel };
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

  const isOutlet = Boolean(dbProd.outlet);
  let discountBadge: string | undefined = undefined;
  if (originalPrice && originalPrice > currentPrice) {
    const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    discountBadge = isOutlet ? `OUTLET ${discountPercent}% OFF` : `${discountPercent}% OFF`;
  } else if (isOutlet) {
    discountBadge = 'OUTLET';
  }

  // 1. Processamento e Ordenação das Mídias (Fotos e Vídeos) - Filtra mídias ocultas da vitrine
  const mediaList: ProductMedia[] = [];
  if (Array.isArray(dbProd.midias_produto)) {
    const sortedMedia = [...dbProd.midias_produto].sort(
      (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
    );
    sortedMedia.forEach((m: any) => {
      const parsed = parseMediaColor(m.label);
      // Mídias marcadas como ocultas são preservadas no acervo, mas não exibidas na vitrine
      if (parsed.isHidden) {
        return;
      }
      const isVideo = detectMediaType(m.tipo, m.url) === 'video';
      mediaList.push({
        type: isVideo ? 'video' : 'image',
        src: m.url,
        label: parsed.cleanLabel || m.label || '',
        colorName: parsed.colorName,
        isColorCover: parsed.isColorCover
      });
    });
  }

  // Dicionário de preços granulares por variação (se gravado em detalhes.precos_diferenciados)
  const detalhesObj =
    typeof dbProd.detalhes === 'object' && !Array.isArray(dbProd.detalhes) && dbProd.detalhes !== null
      ? dbProd.detalhes
      : {};
  const precosDiferenciados = detalhesObj.precos_diferenciados || {};

  // 2. Agrupamento de Variações de Cores e Estoque por Grade
  const colorsMap = new Map<string, { name: string; hex: string; imageSrc?: string }>();
  const sizesSet = new Set<string>();
  const variations: ProductVariation[] = [];

  if (Array.isArray(dbProd.variacoes_produto)) {
    dbProd.variacoes_produto.forEach((v: any) => {
      const cor = (v.cor_nome || '').trim();
      const tam = (v.tamanho || '').trim();
      const stock = Number(v.estoque ?? 0);

      // Preço específico da variação (busca na matriz de detalhes ou na coluna v.preco)
      const customPriceItem = precosDiferenciados[`${cor}_${tam}`];
      const customPrice = customPriceItem?.preco !== undefined ? customPriceItem.preco : v.preco ? Number(v.preco) : undefined;
      const customPromoPrice = customPriceItem?.preco_promocional !== undefined ? customPriceItem.preco_promocional : v.preco_promocional ? Number(v.preco_promocional) : undefined;

      variations.push({
        id: v.id,
        color: cor,
        size: tam,
        stock,
        sku: v.sku || undefined,
        price: customPrice,
        promoPrice: customPromoPrice
      });

      if (tam) sizesSet.add(tam);

      if (cor && !colorsMap.has(cor)) {
        // Encontra a melhor foto para esta cor (preferência para capa da cor, ou primeira foto da cor)
        const colorCoverPhoto = mediaList.find((m) => m.type === 'image' && m.colorName?.toLowerCase() === cor.toLowerCase() && m.isColorCover);
        const colorFirstPhoto = mediaList.find((m) => m.type === 'image' && m.colorName?.toLowerCase() === cor.toLowerCase());
        const resolvedImageSrc = colorCoverPhoto?.src || colorFirstPhoto?.src || v.imagem_url || undefined;

        colorsMap.set(cor, {
          name: cor,
          hex: v.cor_hex || '#000000',
          imageSrc: resolvedImageSrc
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

  // Se a foto principal estiver oculta nas mídias, faz fallback para a primeira mídia visível
  const isMainPhotoHidden =
    Array.isArray(dbProd.midias_produto) &&
    dbProd.midias_produto.some(
      (m: any) => m.url === dbProd.foto_principal && m.label && m.label.includes('[OCULTO]')
    );

  // Garante que a foto principal e thumbnail NUNCA sejam um arquivo de vídeo
  const firstRealPhoto = mediaList.find((m) => m.type === 'image' && !isVideoUrl(m.src))?.src;
  const mainPhotoIsVideo = isVideoUrl(dbProd.foto_principal);
  const thumbnail =
    (!isMainPhotoHidden && !mainPhotoIsVideo && dbProd.foto_principal) ||
    firstRealPhoto ||
    '/placeholder-product.jpg';

  const computedTotalStock = variations.length > 0
    ? variations.reduce((acc, v) => acc + v.stock, 0)
    : Number(dbProd.estoque_total || 0);

  // Escassez real: uma peça só é "últimas peças" se o estoque físico disponível for entre 1 e 5 unidades
  const isCriticalStock = computedTotalStock > 0 && computedTotalStock <= 5;
  const isLastPieces = Boolean(dbProd.ultimas_pecas) ? isCriticalStock : isCriticalStock;
  const remainingPieces = isCriticalStock ? computedTotalStock : undefined;

  // Sanitiza badges para evitar que produtos reabastecidos (> 5 un) exibam selos residuais de escassez
  let resolvedBadge = Array.isArray(dbProd.status_badges) && dbProd.status_badges.length > 0 ? dbProd.status_badges[0] : undefined;
  if (resolvedBadge && (resolvedBadge.includes('peça') || resolvedBadge.includes('Últimas')) && !isCriticalStock) {
    resolvedBadge = undefined;
  }

  const sanitizedStatusList = Array.isArray(dbProd.status_badges)
    ? dbProd.status_badges.filter((b: string) => {
        if ((b.includes('peça') || b.includes('Últimas')) && !isCriticalStock) return false;
        return true;
      })
    : [];

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
    isLastPieces,
    remainingPieces,
    badge: resolvedBadge,
    category: dbProd.categorias?.nome || 'Geral',
    subcategory: dbProd.subcategoria || undefined,
    fabric: dbProd.tecido || undefined,
    fit: dbProd.modelagem || undefined,
    line: dbProd.linha || undefined,
    status: sanitizedStatusList,
    description: dbProd.descricao || '',
    details: Array.isArray(dbProd.detalhes)
      ? dbProd.detalhes
      : Array.isArray(dbProd.detalhes?.especificacoes)
      ? dbProd.detalhes.especificacoes
      : [],
    sizes: sortedSizes.length > 0 ? sortedSizes : ['Tamanho Único'],
    colors: Array.from(colorsMap.values()),
    variations,
    totalStock: computedTotalStock,
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
