import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function sanitizeDomain(raw: string): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .replace(/\s+/g, '');
}

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'JSON inválido enviado no corpo da requisição.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { action, lojaId, domain } = body;

    if (!lojaId) {
      return new Response(
        JSON.stringify({ success: false, error: 'lojaId é obrigatório.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Configuração de credenciais
    const zoneId =
      context.env?.CLOUDFLARE_ZONE_ID ||
      process.env.CLOUDFLARE_ZONE_ID ||
      '70260e837b225659f69b4a463c5223ba';

    const accountId =
      context.env?.CLOUDFLARE_ACCOUNT_ID ||
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      '47ce862c285bb81ad80e052f7ed16ae5';

    const pagesProject =
      context.env?.CLOUDFLARE_PAGES_PROJECT ||
      process.env.CLOUDFLARE_PAGES_PROJECT ||
      'bcomm-shop';

    const apiToken =
      context.env?.CLOUDFLARE_API_TOKEN ||
      process.env.CLOUDFLARE_API_TOKEN ||
      '';

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://mpexpfuvqwstrjctjrbv.supabase.co';

    const supabaseAnonKey =
      context.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhwZnV2cXdzdHJqY3RqcmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI4MjMsImV4cCI6MjEwNzU2ODgyM30.ru147EyJ4T06N5mED6cEqfixlVR0QwTWX9hGyXuPgDQ';

    if (!apiToken || !zoneId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Credenciais da Cloudflare API não estão configuradas no ambiente do Cloudflare Pages.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // ==========================================
    // 1. CONECTAR NOVO DOMÍNIO PRÓPRIO
    // ==========================================
    if (action === 'connect') {
      let clean = sanitizeDomain(domain);
      if (!clean) {
        return new Response(
          JSON.stringify({ success: false, error: 'Informe um domínio válido para conectar.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Se for domínio de 2 ou 3 níveis sem subdomínio (ex: boutiqueleidy.com.br), normaliza para www
      if (!clean.startsWith('www.')) {
        const parts = clean.split('.');
        if (parts.length === 2 || (parts.length === 3 && parts[1] === 'com' && parts[2] === 'br')) {
          clean = `www.${clean}`;
        }
      }

      // Impede o uso de domínios reservados da infraestrutura
      const reserved = ['bcomm-ag.space', 'bcomm.shop', 'bcomm.com.br', 'bcomm-shop.pages.dev', 'localhost'];
      if (reserved.some((r) => clean === r || clean.endsWith(`.${r}`))) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Este domínio pertence à infraestrutura da BCOMM e não pode ser usado por lojas.'
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 1.1 Consulta se já existe na Cloudflare for SaaS
      let cfData: any = null;
      try {
        const checkRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(clean)}`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const checkJson: any = await checkRes.json();
        if (checkJson.success && Array.isArray(checkJson.result) && checkJson.result.length > 0) {
          cfData = checkJson.result[0];
        }
      } catch (err) {
        console.warn('[Cloudflare Check Error]:', err);
      }

      // 1.2 Se não existir, cadastra na Cloudflare for SaaS com SSL automático via HTTP DCV
      if (!cfData) {
        const createRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              hostname: clean,
              ssl: {
                method: 'http',
                type: 'dv',
                settings: {
                  min_tls_version: '1.2'
                }
              }
            })
          }
        );
        const createJson: any = await createRes.json();

        if (!createJson.success) {
          const errMsg = createJson.errors?.[0]?.message || 'Falha ao autorizar domínio na Cloudflare.';
          return new Response(
            JSON.stringify({ success: false, error: `Erro Cloudflare: ${errMsg}` }),
            { status: 500, headers: corsHeaders }
          );
        }

        cfData = createJson.result;
      }

      // 1.3 Adiciona o domínio automaticamente no Cloudflare Pages (autoriza a vitrine no Edge)
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

      // 1.4 Atualiza a tabela `lojas` no Supabase
      const { error: dbErr } = await supabase
        .from('lojas')
        .update({
          dominio_proprio: clean,
          updated_at: new Date().toISOString()
        })
        .eq('id', lojaId);

      if (dbErr) {
        if (dbErr.code === '23505' || dbErr.message?.includes('unique') || dbErr.message?.includes('duplicate key')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Este domínio já está associado a outra loja na plataforma BCOMM.'
            }),
            { status: 409, headers: corsHeaders }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: `Erro no Supabase: ${dbErr.message}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Domínio "${clean}" conectado e autorizado com sucesso na Cloudflare!`,
          domain: clean,
          cloudflare: cfData
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ==========================================
    // 2. DESCONECTAR DOMÍNIO PRÓPRIO
    // ==========================================
    if (action === 'disconnect') {
      const { data: loja } = await supabase
        .from('lojas')
        .select('dominio_proprio')
        .eq('id', lojaId)
        .single();

      const currentDom = loja?.dominio_proprio;

      if (currentDom) {
        try {
          const searchRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(currentDom)}`,
            {
              headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          const searchJson: any = await searchRes.json();
          if (searchJson.success && Array.isArray(searchJson.result) && searchJson.result.length > 0) {
            const hostId = searchJson.result[0].id;
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${hostId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
        } catch (err) {
          console.warn('[Cloudflare Delete Error]:', err);
        }

        // 2.2 Remove automaticamente do Cloudflare Pages
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

      const { error: dbErr } = await supabase
        .from('lojas')
        .update({
          dominio_proprio: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lojaId);

      if (dbErr) {
        return new Response(
          JSON.stringify({ success: false, error: `Erro no Supabase: ${dbErr.message}` }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Domínio desconectado da Cloudflare e removido com sucesso.'
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ==========================================
    // 3. CONSULTAR STATUS NA CLOUDFLARE
    // ==========================================
    if (action === 'status') {
      const targetDomain = sanitizeDomain(domain);
      if (!targetDomain) {
        return new Response(
          JSON.stringify({ success: false, error: 'Domínio não informado para consulta.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const searchRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(targetDomain)}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const searchJson: any = await searchRes.json();
      const hostnameData = searchJson.result?.[0] || null;

      return new Response(
        JSON.stringify({
          success: true,
          hostname: targetDomain,
          status: hostnameData?.status || 'not_found',
          sslStatus: hostnameData?.ssl?.status || 'not_found',
          cloudflare: hostnameData
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Ação "${action}" desconhecida.` }),
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('❌ [functions/api/admin/dominio] Erro inesperado:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Erro interno do servidor no Edge.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

