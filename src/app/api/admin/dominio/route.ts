import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createCloudflareCustomHostname,
  deleteCloudflareCustomHostname,
  getCloudflareCustomHostname,
  sanitizeDomainName
} from '@/lib/cloudflare';
import { clearTenantCache } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, lojaId, domain } = body;

    if (!lojaId) {
      return NextResponse.json({ success: false, error: 'lojaId é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseBrowserClient();

    // 1. CONECTAR NOVO DOMÍNIO PRÓPRIO
    if (action === 'connect') {
      const clean = sanitizeDomainName(domain);
      if (!clean) {
        return NextResponse.json({ success: false, error: 'Domínio inválido fornecido.' }, { status: 400 });
      }

      // Impede o uso de domínios restritos da plataforma
      const reserved = ['bcomm-ag.space', 'bcomm.shop', 'bcomm.com.br', 'bcomm-shop.pages.dev', 'localhost'];
      if (reserved.some((r) => clean === r || clean.endsWith(`.${r}`))) {
        return NextResponse.json({
          success: false,
          error: 'Este domínio pertence à infraestrutura da plataforma BCOMM e não pode ser usado por lojas.'
        }, { status: 400 });
      }

      // 1.1 Cadastra automaticamente na Cloudflare for SaaS
      const cfResult = await createCloudflareCustomHostname(clean);
      if (!cfResult.success) {
        return NextResponse.json({
          success: false,
          error: `Erro da Cloudflare: ${cfResult.error}`
        }, { status: 500 });
      }

      // 1.2 Adiciona o domínio automaticamente no Cloudflare Pages
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '47ce862c285bb81ad80e052f7ed16ae5';
      const pagesProject = process.env.CLOUDFLARE_PAGES_PROJECT || 'bcomm-shop';
      const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

      if (apiToken) {
        try {
          await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pagesProject}/domains`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name: clean })
            }
          );
        } catch (pagesErr) {
          console.warn('⚠️ [Cloudflare Pages Domain Add Warning]:', pagesErr);
        }
      }

      // 1.3 Atualiza o banco de dados Supabase
      const { error: dbErr } = await supabase
        .from('lojas')
        .update({
          dominio_proprio: clean,
          updated_at: new Date().toISOString()
        })
        .eq('id', lojaId);

      if (dbErr) {
        // Se der chave duplicada no banco
        if (dbErr.code === '23505' || dbErr.message?.includes('duplicate key') || dbErr.message?.includes('unique')) {
          // Reverte o cadastro na Cloudflare para não ficar órfão
          await deleteCloudflareCustomHostname(clean);
          return NextResponse.json({
            success: false,
            error: 'Este domínio já está cadastrado por outra loja na plataforma BCOMM.'
          }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
      }

      clearTenantCache();

      return NextResponse.json({
        success: true,
        message: 'Domínio conectado e autorizado com sucesso na Cloudflare!',
        cloudflare: cfResult.data
      });
    }

    // 2. DESCONECTAR DOMÍNIO PRÓPRIO
    if (action === 'disconnect') {
      // 2.1 Busca o domínio atual da loja
      const { data: loja } = await supabase
        .from('lojas')
        .select('dominio_proprio')
        .eq('id', lojaId)
        .single();

      const currentDom = loja?.dominio_proprio;

      // 2.2 Se tinha domínio cadastrado, remove da Cloudflare for SaaS e do Pages
      if (currentDom) {
        await deleteCloudflareCustomHostname(currentDom);

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '47ce862c285bb81ad80e052f7ed16ae5';
        const pagesProject = process.env.CLOUDFLARE_PAGES_PROJECT || 'bcomm-shop';
        const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

        if (apiToken) {
          try {
            await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pagesProject}/domains/${encodeURIComponent(currentDom)}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (pagesDelErr) {
            console.warn('⚠️ [Cloudflare Pages Domain Delete Warning]:', pagesDelErr);
          }
        }
      }

      // 2.3 Seta como NULL no Supabase
      const { error: dbErr } = await supabase
        .from('lojas')
        .update({
          dominio_proprio: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lojaId);

      if (dbErr) {
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
      }

      clearTenantCache();

      return NextResponse.json({
        success: true,
        message: 'Domínio desconectado com sucesso. A loja voltou ao link padrão BCOMM.'
      });
    }

    // 3. CONSULTAR STATUS EM TEMPO REAL NA CLOUDFLARE
    if (action === 'status') {
      const clean = sanitizeDomainName(domain);
      if (!clean) {
        return NextResponse.json({ success: false, error: 'Domínio não informado' }, { status: 400 });
      }

      const cfData = await getCloudflareCustomHostname(clean);
      return NextResponse.json(cfData);
    }

    return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
  } catch (err: any) {
    console.error('❌ [API /api/admin/dominio] Erro inesperado:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

