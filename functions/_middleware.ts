/**
 * Cloudflare Pages Edge Middleware
 * 
 * Responsabilidades:
 * 1. Redirecionamento 301 de Domínio Raiz (Apex sem www) para www (ex: boutiqueleidy.com.br -> www.boutiqueleidy.com.br)
 * 2. Detecção dinâmica de Loja/Tenant por Hostname próprio, subdomínio ou subpasta
 * 3. Injeção dinâmica no Edge (HTMLRewriter) de:
 *    - OG Image (1200x630 para WhatsApp, Instagram, Facebook, Telegram, Twitter)
 *    - Título e Descrição de Compartilhamento Social (og:title, og:description)
 *    - Favicon dinâmico da Loja (link rel="icon" e link rel="apple-touch-icon")
 *    - Título da Aba do Navegador (<title>)
 * 4. Cache em memória Edge (TTL 60s) para latência quase zero (<1ms)
 */

declare const HTMLRewriter: any;

interface TenantMetadata {
  id: string;
  nome: string;
  slug: string;
  dominio_proprio?: string | null;
  slogan?: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  og_image_url?: string;
}

// Cache em memória compartilhado na instância do Worker Edge (60 segundos)
const tenantMemoryCache = new Map<string, { data: TenantMetadata | null; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

const DEFAULT_SUPABASE_URL = 'https://mpexpfuvqwstrjctjrbv.supabase.co';
const DEFAULT_SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhwZnV2cXdzdHJqY3RqcmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI4MjMsImV4cCI6MjEwNzU2ODgyM30.ru147EyJ4T06N5mED6cEqfixlVR0QwTWX9hGyXuPgDQ';

async function fetchTenantFromSupabase(
  identifier: { host?: string; slug?: string },
  supabaseUrl: string,
  anonKey: string
): Promise<TenantMetadata | null> {
  const cacheKey = identifier.host ? `host:${identifier.host}` : `slug:${identifier.slug}`;
  const cached = tenantMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    let filterQuery = '';
    if (identifier.host) {
      const cleanHost = identifier.host.toLowerCase().replace(/^www\./, '');
      const withWww = `www.${cleanHost}`;
      filterQuery = `or=(dominio_proprio.eq.${cleanHost},dominio_proprio.eq.${withWww})&ativo=eq.true`;
    } else if (identifier.slug) {
      const cleanSlug = identifier.slug.toLowerCase().trim();
      filterQuery = `slug=eq.${cleanSlug}&ativo=eq.true`;
    } else {
      return null;
    }

    const endpoint = `${supabaseUrl}/rest/v1/lojas?${filterQuery}&select=id,nome,slug,dominio_proprio,configuracoes_visuais&limit=1`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      tenantMemoryCache.set(cacheKey, { data: null, expiresAt: Date.now() + 10000 });
      return null;
    }

    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) {
      tenantMemoryCache.set(cacheKey, { data: null, expiresAt: Date.now() + 30000 });
      return null;
    }

    const item = rows[0];
    const vis = item.configuracoes_visuais || {};
    const metadata: TenantMetadata = {
      id: item.id,
      nome: item.nome || 'Boutique Exclusiva',
      slug: item.slug || 'loja',
      dominio_proprio: item.dominio_proprio || null,
      slogan: vis.slogan || vis.tagline || 'Moda Feminina Autêntica & Elegância Diária',
      tagline: vis.tagline || 'Curadoria Exclusiva em Moda Feminina',
      logo_url: vis.logo_url || '/images/Logo sem fundo.png',
      favicon_url: vis.favicon_url || '',
      og_image_url: vis.og_image_url || '',
    };

    tenantMemoryCache.set(cacheKey, { data: metadata, expiresAt: Date.now() + CACHE_TTL_MS });
    return metadata;
  } catch (err) {
    console.warn('[Edge Middleware] Erro ao consultar Supabase:', err);
    return null;
  }
}

export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  // 1. Ignorar rotas de assets estáticos e APIs internas para máxima velocidade
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|mp4|webm|json|xml|txt|map)$/i)
  ) {
    return next();
  }

  // 2. Redirecionamento 301 de Domínio Raiz (Apex) para www
  // Exemplo: boutiqueleidy.com.br -> www.boutiqueleidy.com.br
  const isPlatformHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.pages.dev') ||
    hostname === 'bcomm-ag.space' ||
    hostname === 'www.bcomm-ag.space' ||
    hostname.endsWith('.bcomm-ag.space');

  if (!isPlatformHost && !hostname.startsWith('www.')) {
    const parts = hostname.split('.');
    if (parts.length === 2 || (parts.length === 3 && parts[1] === 'com' && parts[2] === 'br')) {
      url.hostname = `www.${hostname}`;
      return Response.redirect(url.toString(), 301);
    }
  }

  // 3. Executa a requisição original da Cloudflare Pages para carregar o HTML estático
  const response = await next();

  // Verifica se a resposta é um documento HTML
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // 4. Identifica o Tenant Alvo
  const supabaseUrl = env?.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnon = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON;

  let tenant: TenantMetadata | null = null;

  // 4.1 Se for Domínio Próprio de Cliente (ex: www.boutiqueleidy.com.br)
  if (!isPlatformHost) {
    tenant = await fetchTenantFromSupabase({ host: hostname }, supabaseUrl, supabaseAnon);
  }

  // 4.2 Se for subdomínio da plataforma (ex: leidy.bcomm-ag.space)
  if (!tenant && hostname.endsWith('.bcomm-ag.space')) {
    const sub = hostname.replace('.bcomm-ag.space', '').replace(/^www\./, '');
    const reserved = ['stores', 'app', 'admin', 'api', 'stage', 'preview', 'mail'];
    if (sub && !reserved.includes(sub)) {
      tenant = await fetchTenantFromSupabase({ slug: sub }, supabaseUrl, supabaseAnon);
    }
  }

  // 4.3 Se for rota com slug na URL (ex: /leidy-boutique/ ou /aura-privee/)
  if (!tenant) {
    const segments = pathname.split('/').filter(Boolean);
    const knownStatic = ['admin', 'super-admin', 'catalogo', 'checkout', 'cliente', 'favoritos', 'minha-conta'];
    if (segments.length > 0 && !knownStatic.includes(segments[0])) {
      const slugCandidate = segments[0];
      tenant = await fetchTenantFromSupabase({ slug: slugCandidate }, supabaseUrl, supabaseAnon);
    }
  }

  // 4.4 Fallback padrão para a loja principal se estiver em stores.bcomm-ag.space ou www.boutiqueleidy.com.br
  if (!tenant && (hostname === 'stores.bcomm-ag.space' || hostname.includes('boutiqueleidy'))) {
    tenant = await fetchTenantFromSupabase({ slug: 'leidy-boutique' }, supabaseUrl, supabaseAnon);
  }

  // Se não for detectado nenhum tenant específico (ex: landing page bcomm-ag.space principal), entrega o HTML padrão
  if (!tenant) {
    return response;
  }

  // 5. Prepara os valores dinâmicos da Loja
  const storeName = tenant.nome;
  const storeSlogan = tenant.slogan || 'Moda Feminina Autêntica & Elegância Diária';
  const pageTitle = `${storeName} | ${storeSlogan}`;
  const canonicalUrl = tenant.dominio_proprio
    ? `https://${tenant.dominio_proprio.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}${pathname}`
    : `${url.origin}${pathname}`;

  // Se a loja tiver OG Image dedicada no R2, usa ela. Senão, usa a logo oficial ou fallback otimizado
  const ogImageUrl = tenant.og_image_url || tenant.logo_url || `${url.origin}/og-image_optimized_300.jpg`;
  const faviconUrl = tenant.favicon_url || tenant.logo_url || '/favicon.ico';

  // 6. Injeta dinamicamente no HTML puro usando Cloudflare HTMLRewriter
  const rewriter = new HTMLRewriter()
    // Atualiza o título da aba do navegador
    .on('title', {
      element(e: any) {
        e.setInnerContent(pageTitle);
      },
    })
    // Atualiza metatags de descrição e SEO
    .on('meta[name="description"]', {
      element(e: any) {
        e.setAttribute('content', storeSlogan);
      },
    })
    // Atualiza Open Graph (WhatsApp, Facebook, LinkedIn, Telegram)
    .on('meta[property="og:title"]', {
      element(e: any) {
        e.setAttribute('content', pageTitle);
      },
    })
    .on('meta[property="og:description"]', {
      element(e: any) {
        e.setAttribute('content', storeSlogan);
      },
    })
    .on('meta[property="og:image"]', {
      element(e: any) {
        e.setAttribute('content', ogImageUrl);
      },
    })
    .on('meta[property="og:url"]', {
      element(e: any) {
        e.setAttribute('content', canonicalUrl);
      },
    })
    .on('meta[property="og:site_name"]', {
      element(e: any) {
        e.setAttribute('content', storeName);
      },
    })
    // Atualiza Twitter Card
    .on('meta[name="twitter:title"]', {
      element(e: any) {
        e.setAttribute('content', pageTitle);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(e: any) {
        e.setAttribute('content', storeSlogan);
      },
    })
    .on('meta[name="twitter:image"]', {
      element(e: any) {
        e.setAttribute('content', ogImageUrl);
      },
    })
    // Atualiza Favicons
    .on('link[rel="icon"]', {
      element(e: any) {
        if (faviconUrl) {
          e.setAttribute('href', faviconUrl);
        }
      },
    })
    .on('link[rel="apple-touch-icon"]', {
      element(e: any) {
        if (faviconUrl) {
          e.setAttribute('href', faviconUrl);
        }
      },
    });

  return rewriter.transform(response);
}
