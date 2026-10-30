import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID, isVideoUrl, detectMediaType } from '@/lib/products';

export interface StoreTenant {
  id: string;
  nome: string;
  slug: string;
  dominio_proprio?: string | null;
  whatsapp: string;
  email?: string | null;
  ativo: boolean;
  configuracoes_visuais?: any;
  modulos_ativos?: Record<string, boolean>;
  created_at: string;
  total_pedidos?: number;
  total_faturamento?: number;
}

export interface SuperAdminStats {
  totalLojas: number;
  lojasAtivas: number;
  faturamentoGlobal: number;
  totalPedidosGlobal: number;
  totalClientesGlobal: number;
  ultimasLojas: StoreTenant[];
}

export interface CreateStorePayload {
  nome: string;
  slug: string;
  whatsapp: string;
  email: string;
  dominioProprio?: string;
  cloneCatalog?: boolean;
}

/**
 * Consulta métricas consolidadas de toda a plataforma SaaS.
 */
export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Consulta todas as lojas
    const { data: lojas, error: lojasErr } = await supabase
      .from('lojas')
      .select('*')
      .order('created_at', { ascending: false });

    if (lojasErr) throw lojasErr;

    const allStores = (lojas || []) as StoreTenant[];
    const totalLojas = allStores.length;
    const lojasAtivas = allStores.filter((l) => l.ativo).length;

    // 2. Consulta todos os pedidos da rede
    const { data: pedidos, error: pedidosErr } = await supabase
      .from('pedidos')
      .select('id, total, status, loja_id');

    const allOrders = pedidos || [];
    const totalPedidosGlobal = allOrders.length;
    const faturamentoGlobal = allOrders
      .filter((o) => o.status !== 'cancelado')
      .reduce((acc, o) => acc + Number(o.total || 0), 0);

    // 3. Consulta de clientes/leads totais da rede
    const { count: leadsCount } = await supabase
      .from('clientes_loja')
      .select('*', { count: 'exact', head: true });

    // Mapear faturamento e pedidos por loja
    const storesWithStats: StoreTenant[] = allStores.map((store) => {
      const storeOrders = allOrders.filter((o) => o.loja_id === store.id);
      const storeRev = storeOrders
        .filter((o) => o.status !== 'cancelado')
        .reduce((acc, o) => acc + Number(o.total || 0), 0);

      return {
        ...store,
        total_pedidos: storeOrders.length,
        total_faturamento: storeRev
      };
    });

    return {
      totalLojas,
      lojasAtivas,
      faturamentoGlobal,
      totalPedidosGlobal,
      totalClientesGlobal: leadsCount || 0,
      ultimasLojas: storesWithStats.slice(0, 5)
    };
  } catch (err) {
    console.error('❌ [Supabase] Erro ao carregar métricas globais do Super Admin:', err);
    return {
      totalLojas: 1,
      lojasAtivas: 1,
      faturamentoGlobal: 0,
      totalPedidosGlobal: 0,
      totalClientesGlobal: 0,
      ultimasLojas: []
    };
  }
}

/**
 * Retorna a lista detalhada de todas as lojas para gestão.
 */
export async function getAllStores(): Promise<StoreTenant[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: lojas, error: lojasErr } = await supabase
      .from('lojas')
      .select('*')
      .order('created_at', { ascending: false });

    if (lojasErr) throw lojasErr;

    // Busca pedidos para agregar dados
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, total, status, loja_id');

    const allOrders = pedidos || [];

    return (lojas || []).map((store: any) => {
      const storeOrders = allOrders.filter((o) => o.loja_id === store.id);
      const storeRev = storeOrders
        .filter((o) => o.status !== 'cancelado')
        .reduce((acc, o) => acc + Number(o.total || 0), 0);

      return {
        ...store,
        total_pedidos: storeOrders.length,
        total_faturamento: storeRev
      };
    });
  } catch (err) {
    console.error('❌ [Supabase] Erro ao buscar lista de lojas no Super Admin:', err);
    return [];
  }
}

/**
 * Alterna a ativação de uma loja na rede (bloqueio/liberação).
 */
export async function toggleStoreStatus(
  lojaId: string,
  novoStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase
      .from('lojas')
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', lojaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alternar status da loja:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Cria uma nova loja na plataforma em menos de 60 segundos com catálogo opcional.
 */
export async function createStoreExpress(
  payload: CreateStorePayload
): Promise<{ success: boolean; loja?: StoreTenant; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const cleanSlug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const cleanPhone = payload.whatsapp.replace(/\D/g, '');

    // 1. Insere a nova loja
    const newStoreData = {
      nome: payload.nome.trim(),
      slug: cleanSlug,
      dominio_proprio: payload.dominioProprio?.trim() || null,
      whatsapp: cleanPhone,
      email: payload.email.trim(),
      ativo: true,
      configuracoes_visuais: {
        cor_primaria: '#C5A059',
        cor_secundaria: '#1A1918',
        cor_fundo: '#FAF8F5',
        tagline: 'Moda Feminina & Estilo Exclusivo',
        frete_gratis_valor: 350.0
      },
      modulos_ativos: {
        frete_automatico: true,
        rastreio_whatsapp: false,
        recuperacao_carrinho: false,
        checkout_transparente: false
      }
    };

    const { data: createdStore, error: insertErr } = await supabase
      .from('lojas')
      .insert(newStoreData)
      .select()
      .single();

    if (insertErr) throw insertErr;
    const newLojaId = createdStore.id;

    // 2. Se habilitado clonar catálogo da loja base (Leidy Boutique)
    if (payload.cloneCatalog) {
      console.log(`📦 Clonando catálogo padrão para a nova loja ${newLojaId}...`);

      // Copia categorias
      const { data: categoriasBase } = await supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', DEFAULT_TENANT_ID);

      const categoryMap = new Map<string, string>();

      if (categoriasBase && categoriasBase.length > 0) {
        for (const cat of categoriasBase) {
          const { data: newCat } = await supabase
            .from('categorias')
            .insert({
              loja_id: newLojaId,
              nome: cat.nome,
              slug: `${cat.slug}-${cleanSlug}`,
              display_order: cat.display_order
            })
            .select()
            .single();

          if (newCat) {
            categoryMap.set(cat.id, newCat.id);
          }
        }
      }

      // Copia os primeiros 8 produtos para demonstração
      const { data: produtosBase } = await supabase
        .from('produtos')
        .select(`
          *,
          variacoes_produto (*),
          midias_produto (*)
        `)
        .eq('loja_id', DEFAULT_TENANT_ID)
        .limit(8);

      if (produtosBase && produtosBase.length > 0) {
        for (const prod of produtosBase) {
          const newCategoryId = prod.categoria_id ? categoryMap.get(prod.categoria_id) : null;

          const { data: newProd } = await supabase
            .from('produtos')
            .insert({
              loja_id: newLojaId,
              categoria_id: newCategoryId || null,
              nome: prod.nome,
              slug: `${prod.slug}-${cleanSlug}`,
              preco: prod.preco,
              preco_promocional: prod.preco_promocional,
              preco_custo: prod.preco_custo || null,
              tecido: prod.tecido,
              modelagem: prod.modelagem,
              linha: prod.linha || 'Coleção Nobre',
              subcategoria: prod.subcategoria || null,
              descricao: prod.descricao,
              destaque: Boolean(prod.destaque),
              mais_vendido: Boolean(prod.mais_vendido),
              outlet: Boolean(prod.outlet),
              ultimas_pecas: Boolean(prod.ultimas_pecas),
              estoque_total: prod.estoque_total,
              foto_principal: prod.foto_principal,
              detalhes: prod.detalhes || null,
              ativo: true
            })
            .select()
            .single();

          if (newProd) {
            // Clona variações
            if (prod.variacoes_produto && prod.variacoes_produto.length > 0) {
              const variationsToInsert = prod.variacoes_produto.map((v: any) => ({
                loja_id: newLojaId,
                produto_id: newProd.id,
                cor_nome: v.cor_nome,
                cor_hex: v.cor_hex,
                tamanho: v.tamanho,
                estoque: v.estoque,
                sku: v.sku ? `${v.sku}-${cleanSlug.toUpperCase()}` : null
              }));
              await supabase.from('variacoes_produto').insert(variationsToInsert);
            }

            // Clona mídias com tipo validado e sanitizado
            if (prod.midias_produto && prod.midias_produto.length > 0) {
              const mediaToInsert = prod.midias_produto.map((m: any) => ({
                loja_id: newLojaId,
                produto_id: newProd.id,
                tipo: detectMediaType(m.tipo, m.url),
                url: m.url,
                label: m.label,
                display_order: m.display_order
              }));
              await supabase.from('midias_produto').insert(mediaToInsert);
            }
          }
        }
      }

      // Cria Hero Banner inicial dinâmico para a nova loja
      await supabase.from('hero_banners').insert({
        loja_id: newLojaId,
        titulo: `Nova Coleção ${payload.nome.trim()}`,
        subtitulo: 'Moda Feminina & Sofisticação Atemporal',
        cta_texto: 'Explorar Peças',
        cta_link: '/catalogo',
        tipo_midia: 'video',
        desktop_media_url: '/video/header_video.mp4',
        mobile_media_url: '/video/header_video.mp4',
        ativo: true,
        display_order: 1
      });
    }

    return { success: true, loja: createdStore as StoreTenant };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao provisionar nova loja no Super Admin:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Atualiza o domínio customizado de um lojista.
 */
export async function updateStoreDomain(
  lojaId: string,
  dominio: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const cleanDomain = dominio ? dominio.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : null;

    const { error } = await supabase
      .from('lojas')
      .update({
        dominio_proprio: cleanDomain,
        updated_at: new Date().toISOString()
      })
      .eq('id', lojaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao atualizar domínio do lojista:', err);
    return { success: false, error: err?.message };
  }
}
