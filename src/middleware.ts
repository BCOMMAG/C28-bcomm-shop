import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantByHost } from '@/lib/tenant';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost';

  // Resolve os dados da loja correspondente ao domínio ou subdomínio
  const loja = await getTenantByHost(host);

  // Injeta cabeçalhos customizados com os dados da loja para serem consumidos nas páginas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', loja.id);
  requestHeaders.set('x-tenant-slug', loja.slug);
  requestHeaders.set('x-tenant-name', loja.nome);
  requestHeaders.set('x-tenant-whatsapp', loja.whatsapp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Salva cookie seguro com o slug da loja para rápida identificação client-side
  response.cookies.set('tenant_slug', loja.slug, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return response;
}

// Configuração do Matcher: ignora arquivos estáticos, rotas internas do Next e imagens
export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto:
     * - _next/static (arquivos estáticos JS/CSS)
     * - _next/image (otimização de imagens)
     * - favicon.ico, sitemap.xml, robots.txt
     * - arquivos com extensão de mídias (.png, .jpg, .svg, .mp4, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
};
