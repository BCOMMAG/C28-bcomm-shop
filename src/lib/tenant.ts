import { Loja } from '@/types/database';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Cache em memória para resolução rápida de lojas (evita roundtrips desnecessários)
const tenantCache = new Map<string, { loja: Loja; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

/**
 * Limpa o cache de tenants em memória para refletir alterações imediatas do painel admin
 */
export function clearTenantCache(): void {
  tenantCache.clear();
}

/**
 * Normaliza qualquer variação de slug para o slug canônico cadastrado no banco Supabase
 */
export function getCanonicalDbSlug(slug?: string | null): string {
  const clean = (slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (clean === 'leidyboutique' || clean === 'leidy-boutique' || clean === '') {
    return 'leidy-boutique';
  }
  if (clean === 'auraprivee' || clean === 'aura-privee') {
    return 'aura-privee';
  }
  return clean;
}

// Configuração padrão da Leidy Boutique (Tenant #1 Oficial)
export const DEFAULT_LEIDY_TENANT: Loja = {
  "id": "e8b7f890-4e3a-4a89-9c56-8e1234567890",
  "nome": "Leidy Boutique",
  "slug": "leidy-boutique",
  "dominio_proprio": null,
  "whatsapp": "554197347601",
  "email": "contato@leidyboutique.com.br",
  "configuracoes_visuais": {
    "slogan": "Moda Feminina Autêntica & Elegância Diária",
    "tagline": "Curadoria Exclusiva em Moda Feminina",
    "logo_url": "/images/Logo sem fundo.png",
    "cor_fundo": "#FAF8F5",
    "barra_aviso": "Frete Grátis para todo o Brasil acima de R$ 350 | Atendimento VIP via WhatsApp",
    "favicon_url": "",
    "admin_custom": {
      "buttonBg": "#0F172A",
      "sidebarBg": "#0B132B",
      "buttonText": "#F59E0B",
      "fontFamily": "Montserrat",
      "pageBgDark": "#0B132B",
      "pageBgLight": "#ffffff",
      "sidebarText": "#94A3B8",
      "buttonRadius": "rounded-xl"
    },
    "cor_primaria": "#DFBE76",
    "og_image_url": "",
    "logo_dark_url": "",
    "cor_secundaria": "#1A1918",
    "secoes_vitrine": {
      "global": {
        "ativo": true,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "outlet": {
        "ativo": false,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "lancamentos": {
        "ativo": false,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "maisVendidos": {
        "ativo": false,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "ultimasPecas": {
        "ativo": false,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "modoIndependente": false
    },
    "tipografia_menu": {
      "fontSize": "12px",
      "fontFamily": "Montserrat",
      "corHoverDark": "#DFBE76",
      "corTextoDark": "#FAF8F5",
      "corHoverLight": "#C5A059",
      "corTextoLight": "#1A1918"
    },
    "plano_fundo_menu": {
      "tipo": "transparente",
      "bg_dark": "#141312",
      "bg_light": "#FAF8F5"
    },
    "plano_fundo_site": {
      "tipo": "solido",
      "bg_dark": "#121110",
      "bg_light": "#FAF8F5",
      "overlay_opacidade": 40
    },
    "barra_aviso_ativa": true,
    "barra_aviso_estilo": {
      "modo": "unificado",
      "icone": "gift",
      "bg_dark": "#0D0C0B",
      "bg_light": "#1A1918",
      "text_dark": "#EED59B",
      "text_light": "#ffffff",
      "font_family": "'Montserrat', sans-serif"
    },
    "frete_gratis_valor": 350,
    "_teste_e2e_timestamp": 1792612811741
  },
  "modulos_ativos": {
    "frete_automatico": true,
    "rastreio_whatsapp": false,
    "recuperacao_carrinho": false,
    "checkout_transparente": false
  },
  "ativo": true,
  "created_at": "2026-10-14T16:19:01.168355+00:00",
  "updated_at": "2026-10-22T13:41:17.531+00:00",
  "configuracoes_financeiras": {
    "chave_pix": "554197347601",
    "pix_banco": "Nu Pagamentos S.A. (Nubank)",
    "pix_titular": "Leidyane Cristina da Silva",
    "imposto_padrao": 4,
    "tipo_chave_pix": "telefone",
    "taxa_cartao_padrao": 3.5,
    "custo_embalagem_padrao": 8
  }
};

// Configuração padrão da Aura Privée (Tenant #2 Modelo / Prospecção)
export const DEFAULT_AURA_PRIVEE_TENANT: Loja = {
  id: 'f9c8e7d6-5b4a-3c2d-1e0f-9876543210ab',
  nome: 'Aura Privée',
  slug: 'aura-privee',
  dominio_proprio: 'auraprivee.com.br',
  whatsapp: '5511999998888',
  email: 'contato@auraprivee.com.br',
  configuracoes_visuais: {
    cor_primaria: '#E0A99A',
    cor_secundaria: '#18181B',
    cor_fundo: '#FAF8F5',
    logo_url: '/images/Logo sem fundo.png',
    tagline: 'Alta Costura & Alfaiataria Feminina Exclusiva',
    frete_gratis_valor: 400.00,
    barra_aviso: 'Lançamento Coleção Aura Privée: Peças exclusivas sob encomenda',
    barra_aviso_ativa: true
  },
  configuracoes_financeiras: {
    imposto_padrao: 4,
    taxa_cartao_padrao: 3.5,
    custo_embalagem_padrao: 8.0,
    chave_pix: '5511999998888',
    tipo_chave_pix: 'telefone',
    pix_titular: 'Aura Privée Moda de Luxo LTDA',
    pix_banco: 'Banco Inter'
  },
  modulos_ativos: {
    frete_automatico: true,
    rastreio_whatsapp: true,
    recuperacao_carrinho: false,
    checkout_transparente: false
  },
  ativo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Resolve a loja pelo ID (UUID)
 */
export async function getTenantById(lojaId: string): Promise<Loja | null> {
  if (!lojaId) return null;
  const cached = tenantCache.get(`id:${lojaId}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', lojaId)
      .eq('ativo', true)
      .maybeSingle();

    if (!error && data) {
      const loja = data as Loja;
      tenantCache.set(`id:${lojaId}`, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(`slug:${loja.slug}`, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      return loja;
    }
  } catch (e) {
    console.warn(`Erro ao resolver tenant por ID ${lojaId}:`, e);
  }
  return null;
}

/**
 * Resolve a loja pelo hostname (domínio próprio ou subdomínio)
 */
export async function getTenantByHost(host: string): Promise<Loja> {
  const cleanHost = host.split(':')[0].toLowerCase();

  // Se for ambiente local ou preview genérico da Cloudflare Pages, consulta pelo slug padrão
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.includes('pages.dev')
  ) {
    return getTenantBySlug('leidy-boutique');
  }

  // Verifica cache
  const cached = tenantCache.get(cleanHost);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('dominio_proprio', cleanHost)
      .eq('ativo', true);

    if (!error && data && data.length > 0) {
      const loja = data[0] as Loja;
      tenantCache.set(cleanHost, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      return loja;
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o host ${cleanHost}:`, error);
  }

  return DEFAULT_LEIDY_TENANT;
}

/**
 * Resolve a loja pelo slug único (ex: 'leidyboutique', 'leidy-boutique', 'aura-privee')
 */
export async function getTenantBySlug(slug: string): Promise<Loja> {
  const cleanSlug = (slug || '').trim().toLowerCase() || 'leidy-boutique';
  const dbSlug = getCanonicalDbSlug(cleanSlug);

  const cached = tenantCache.get(`slug:${dbSlug}`) || tenantCache.get(`slug:${cleanSlug}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('slug', dbSlug)
      .eq('ativo', true);

    if (!error && data && data.length > 0) {
      const tenantFound = data[0] as Loja;
      tenantCache.set(`slug:${dbSlug}`, { loja: tenantFound, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(`slug:${cleanSlug}`, { loja: tenantFound, expiresAt: Date.now() + CACHE_TTL_MS });
      return tenantFound;
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o slug ${cleanSlug} (dbSlug: ${dbSlug}):`, error);
  }

  if (dbSlug === 'leidy-boutique') {
    return DEFAULT_LEIDY_TENANT;
  }
  if (dbSlug === 'aura-privee') {
    return DEFAULT_AURA_PRIVEE_TENANT;
  }

  // Gera um Tenant dinâmico para o slug (nunca cai na Leidy Boutique)
  const formattedName = cleanSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `custom-${cleanSlug}`,
    nome: formattedName,
    slug: cleanSlug,
    dominio_proprio: null,
    whatsapp: '5511999999999',
    email: `contato@${cleanSlug}.com.br`,
    configuracoes_visuais: {
      cor_primaria: '#DFBE76',
      cor_secundaria: '#1A1918',
      cor_fundo: '#FAF8F5',
      logo_url: '/images/Logo sem fundo.png',
      tagline: 'Boutique & Moda Feminina Exclusiva',
      frete_gratis_valor: 350.00,
      barra_aviso: 'Atendimento VIP & Peças Exclusivas',
      barra_aviso_ativa: true
    },
    modulos_ativos: {
      frete_automatico: true,
      rastreio_whatsapp: false,
      recuperacao_carrinho: false,
      checkout_transparente: false
    },
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
