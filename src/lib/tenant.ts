import { Loja } from '@/types/database';

// Cache em memória para resolução rápida de lojas (evita roundtrips desnecessários)
const tenantCache = new Map<string, { loja: Loja; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

// Configuração padrão da Leidy Boutique (Tenant #1 Oficial)
export const DEFAULT_LEIDY_TENANT: Loja = {
  id: 'e8b7f890-4e3a-4a89-9c56-8e1234567890',
  nome: 'Leidy Boutique',
  slug: 'leidy-boutique',
  dominio_proprio: 'leidyboutique.com.br',
  whatsapp: '554197347601',
  email: 'contato@leidyboutique.com.br',
  configuracoes_visuais: {
    cor_primaria: '#C5A059',
    cor_secundaria: '#1A1918',
    cor_fundo: '#FAF8F5',
    logo_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/tenants/leidy-boutique/images/logo.png',
    tagline: 'Curadoria Exclusiva em Moda Feminina',
    frete_gratis_valor: 350.00,
    barra_aviso: 'Frete Grátis para todo o Brasil em compras acima de R$ 350 | Atendimento VIP via WhatsApp',
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
    logo_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/tenants/leidy-boutique/images/logo.png',
    tagline: 'Alta Costura & Alfaiataria Feminina Exclusiva',
    frete_gratis_valor: 400.00,
    barra_aviso: 'Lançamento Coleção Aura Privée: Peças exclusivas sob encomenda',
    barra_aviso_ativa: true
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
 * Resolve a loja pelo hostname (domínio próprio ou subdomínio)
 */
export async function getTenantByHost(host: string): Promise<Loja> {
  const cleanHost = host.split(':')[0].toLowerCase();

  // Se for ambiente local ou preview genérico da Cloudflare Pages
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.includes('pages.dev')
  ) {
    return DEFAULT_LEIDY_TENANT;
  }

  // Verifica cache
  const cached = tenantCache.get(cleanHost);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return DEFAULT_LEIDY_TENANT;
    }

    // Busca via REST direto pelo domínio próprio
    const res = await fetch(`${supabaseUrl}/rest/v1/lojas?dominio_proprio=eq.${encodeURIComponent(cleanHost)}&ativo=eq.true&select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (res.ok) {
      const data: Loja[] = await res.json();
      if (data && data.length > 0) {
        tenantCache.set(cleanHost, { loja: data[0], expiresAt: Date.now() + CACHE_TTL_MS });
        return data[0];
      }
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o host ${cleanHost}:`, error);
  }

  return DEFAULT_LEIDY_TENANT;
}

/**
 * Resolve a loja pelo slug único (ex: 'aura-privee' via ?loja=aura-privee)
 */
export async function getTenantBySlug(slug: string): Promise<Loja> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug || cleanSlug === 'leidy-boutique') {
    return DEFAULT_LEIDY_TENANT;
  }

  if (cleanSlug === 'aura-privee') {
    // Tenta primeiro no Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const res = await fetch(`${supabaseUrl}/rest/v1/lojas?slug=eq.aura-privee&ativo=eq.true&select=*`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        if (res.ok) {
          const data: Loja[] = await res.json();
          if (data && data.length > 0) {
            return data[0];
          }
        }
      }
    } catch {}
    return DEFAULT_AURA_PRIVEE_TENANT;
  }

  const cached = tenantCache.get(`slug:${cleanSlug}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/lojas?slug=eq.${encodeURIComponent(cleanSlug)}&ativo=eq.true&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (res.ok) {
        const data: Loja[] = await res.json();
        if (data && data.length > 0) {
          tenantCache.set(`slug:${cleanSlug}`, { loja: data[0], expiresAt: Date.now() + CACHE_TTL_MS });
          return data[0];
        }
      }
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o slug ${cleanSlug}:`, error);
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
      logo_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/tenants/leidy-boutique/images/logo.png',
      tagline: 'Boutique & Moda Feminina Exclusiva',
      frete_gratis_valor: 350.00
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
