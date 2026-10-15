import { Loja } from '@/types/database';

// Cache em memória para resolução rápida de lojas (evita roundtrips desnecessários)
const tenantCache = new Map<string, { loja: Loja; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

// Configuração padrão da Leidy Boutique (Fallback seguro)
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
    logo_url: '/images/Logo sem fundo.png',
    tagline: 'Curadoria Exclusiva em Moda Feminina',
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

/**
 * Resolve a loja pelo hostname (domínio próprio ou slug)
 */
export async function getTenantByHost(host: string): Promise<Loja> {
  const cleanHost = host.split(':')[0].toLowerCase();

  // Se for ambiente local de desenvolvimento ou teste de prévia genérico, retorna Leidy Boutique
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.includes('pages.dev') ||
    cleanHost.includes('leidyboutique')
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

    // Busca via REST direto (leve e compatível com Edge / Cloudflare Workers)
    const query = cleanHost.includes('.') && !cleanHost.endsWith('.plataforma.com')
      ? `dominio_proprio=eq.${encodeURIComponent(cleanHost)}`
      : `slug=eq.${encodeURIComponent(cleanHost.split('.')[0])}`;

    const res = await fetch(`${supabaseUrl}/rest/v1/lojas?${query}&ativo=eq.true&select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 60 }
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

  // Fallback seguro: Leidy Boutique
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

  const cached = tenantCache.get(`slug:${cleanSlug}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return DEFAULT_LEIDY_TENANT;
    }

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
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o slug ${cleanSlug}:`, error);
  }

  return DEFAULT_LEIDY_TENANT;
}

