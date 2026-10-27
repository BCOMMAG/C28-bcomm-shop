/**
 * Módulo Centralizador de Roteamento Multi-Tenant & URLs Limpas (White-Label)
 * 
 * Regras Canônicas:
 * - Em ambientes de plataforma/demo (localhost, *.pages.dev, bcomm.com.br):
 *   Home: /:loja/ (ex: /leidyboutique/)
 *   Central da Cliente: /:loja/cliente/
 *   Favoritos: /:loja/cliente/favoritos/
 *   Catálogo: /:loja/catalogo/
 *   Checkout: /:loja/checkout/
 * 
 * - Em domínios próprios (ex: www.leidyboutique.com.br):
 *   Home: /
 *   Central da Cliente: /cliente/
 *   Favoritos: /cliente/favoritos/
 *   Catálogo: /catalogo/
 *   Checkout: /checkout/
 */

import { Loja } from '@/types/database';

/**
 * Normaliza o slug da loja para formatos amigáveis e canônicos
 */
export function normalizeTenantSlug(slug?: string | null): string {
  if (!slug) return 'leidyboutique';
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (clean === 'leidy-boutique' || clean === 'leidyboutique') {
    return 'leidyboutique';
  }
  if (clean === 'aura-privee' || clean === 'auraprivee') {
    return 'auraprivee';
  }
  return clean;
}

/**
 * Determina se o hostname atual é um host genérico da plataforma BCOMM
 */
export function isPlatformHostname(hostname?: string): boolean {
  if (typeof window === 'undefined') {
    if (!hostname) return true;
  }
  const host = (hostname || (typeof window !== 'undefined' ? window.location.hostname : 'localhost')).toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.pages.dev') ||
    host === 'bcomm.com.br' ||
    host === 'www.bcomm.com.br'
  );
}

/**
 * Retorna o prefixo de rota da loja
 * - Se for domínio próprio: ''
 * - Se for host da plataforma: '/slug'
 */
export function getTenantPathPrefix(slugOrTenant?: string | Loja | null): string {
  const isPlatform = isPlatformHostname();
  if (!isPlatform) {
    return '';
  }

  let slug: string = 'leidyboutique';
  if (typeof slugOrTenant === 'string') {
    slug = normalizeTenantSlug(slugOrTenant);
  } else if (slugOrTenant && slugOrTenant.slug) {
    slug = normalizeTenantSlug(slugOrTenant.slug);
  } else if (typeof window !== 'undefined') {
    // Tenta detectar da URL atual
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const knownRoutes = ['admin', 'super-admin', 'catalogo', 'checkout', 'favoritos', 'minha-conta', 'cliente'];
    if (pathSegments.length > 0 && !knownRoutes.includes(pathSegments[0])) {
      slug = normalizeTenantSlug(pathSegments[0]);
    }
  }

  return `/${slug}`;
}

/**
 * URL da Home da Loja
 */
export function getStoreHomeUrl(slugOrTenant?: string | Loja | null): string {
  const prefix = getTenantPathPrefix(slugOrTenant);
  return prefix ? `${prefix}/` : '/';
}

/**
 * URL da Central VIP da Cliente
 */
export function getStoreCustomerUrl(slugOrTenant?: string | Loja | null): string {
  const prefix = getTenantPathPrefix(slugOrTenant);
  return prefix ? `${prefix}/cliente/` : '/cliente/';
}

/**
 * URL da Central de Favoritos
 */
export function getStoreWishlistUrl(slugOrTenant?: string | Loja | null): string {
  const prefix = getTenantPathPrefix(slugOrTenant);
  return prefix ? `${prefix}/cliente/favoritos/` : '/cliente/favoritos/';
}

/**
 * URL do Catálogo de Produtos
 */
export function getStoreCatalogUrl(slugOrTenant?: string | Loja | null): string {
  const prefix = getTenantPathPrefix(slugOrTenant);
  return prefix ? `${prefix}/catalogo/` : '/catalogo/';
}

/**
 * URL do Checkout Seguro
 */
export function getStoreCheckoutUrl(slugOrTenant?: string | Loja | null): string {
  const prefix = getTenantPathPrefix(slugOrTenant);
  return prefix ? `${prefix}/checkout/` : '/checkout/';
}

/**
 * Retorna a URL canônica correta para abrir a vitrine da loja
 * 1. Se a loja possui domínio próprio configurado (ex: www.minhaboutique.com.br):
 *    Retorna 'https://www.minhaboutique.com.br' (sanitizado).
 * 2. Se não possui domínio próprio:
 *    - Em desenvolvimento local (localhost) sem forceAbsolute: retorna '/:slug'
 *    - Em produção / links externos: retorna 'https://bcomm-shop.pages.dev/:slug'
 */
export function getStorefrontUrl(
  tenant?: Partial<Loja> | null,
  options?: { forceAbsolute?: boolean; path?: string }
): string {
  const customDomain = tenant?.dominio_proprio?.trim();
  const subPath = options?.path ? (options.path.startsWith('/') ? options.path : `/${options.path}`) : '';

  if (customDomain) {
    // Sanitiza contra protocolos repetidos e barras finais
    const cleanDomain = customDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${cleanDomain}${subPath}`;
  }

  const slug = normalizeTenantSlug(tenant?.slug);
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocal && !options?.forceAbsolute) {
    return `/${slug}${subPath}`;
  }

  return `https://bcomm-shop.pages.dev/${slug}${subPath}`;
}

