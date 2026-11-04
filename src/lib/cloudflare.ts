/**
 * Módulo de Integração Direta com a Cloudflare for SaaS (Custom Hostnames API)
 * 
 * Permite que qualquer lojista conecte ou desconecte seu próprio domínio de forma 100% autônoma,
 * emitindo e renovando certificados SSL/TLS automaticamente via Cloudflare Edge.
 */

const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

export interface CloudflareCustomHostnameResult {
  id: string;
  hostname: string;
  status: 'active' | 'pending' | 'pending_validation' | 'moved' | 'blocked';
  ssl: {
    status: 'active' | 'pending_validation' | 'pending_issuance' | 'pending_deployment' | 'initializing';
    method: string;
    type: string;
    validation_records?: Array<{
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
    }>;
  };
  created_at?: string;
}

/**
 * Sanitiza o domínio para o formato padrão minúsculo sem protocolo e sem barras.
 */
export function sanitizeDomainName(raw: string): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .replace(/\s+/g, '');
}

/**
 * Cria um Custom Hostname na Cloudflare para o domínio da loja.
 * Emite certificado SSL Let's Encrypt / Google Trust Services automático.
 */
export async function createCloudflareCustomHostname(
  domain: string
): Promise<{ success: boolean; data?: CloudflareCustomHostnameResult; error?: string }> {
  const clean = sanitizeDomainName(domain);

  if (!clean) {
    return { success: false, error: 'Domínio inválido fornecido.' };
  }

  // Se já existir, recupera os dados existentes
  const existing = await getCloudflareCustomHostname(clean);
  if (existing.success && existing.data) {
    return { success: true, data: existing.data };
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
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

    const json = await res.json();

    if (!res.ok || !json.success) {
      const errMsg = json.errors?.[0]?.message || `Erro HTTP ${res.status} da Cloudflare`;
      console.error('❌ [Cloudflare API] Falha ao criar custom hostname:', json.errors);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      data: json.result as CloudflareCustomHostnameResult
    };
  } catch (err: any) {
    console.error('❌ [Cloudflare API] Erro inesperado na requisição:', err);
    return { success: false, error: err?.message || 'Falha de comunicação com a Cloudflare' };
  }
}

/**
 * Consulta os detalhes e o status em tempo real de um Custom Hostname na Cloudflare.
 */
export async function getCloudflareCustomHostname(
  domain: string
): Promise<{ success: boolean; data?: CloudflareCustomHostnameResult; error?: string }> {
  const clean = sanitizeDomainName(domain);

  if (!clean) {
    return { success: false, error: 'Domínio inválido fornecido.' };
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${encodeURIComponent(clean)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { success: false, error: json.errors?.[0]?.message || 'Erro ao consultar Cloudflare' };
    }

    const hostnames = json.result || [];
    if (hostnames.length === 0) {
      return { success: false, error: 'Domínio não encontrado na Cloudflare' };
    }

    return {
      success: true,
      data: hostnames[0] as CloudflareCustomHostnameResult
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro na requisição' };
  }
}

/**
 * Remove e desconecta um Custom Hostname na Cloudflare, liberando o slot.
 */
export async function deleteCloudflareCustomHostname(
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const clean = sanitizeDomainName(domain);

  if (!clean) {
    return { success: false, error: 'Domínio inválido fornecido.' };
  }

  // Primeiro localiza o ID do hostname
  const existing = await getCloudflareCustomHostname(clean);
  if (!existing.success || !existing.data?.id) {
    // Se já não existia na Cloudflare, considera removido
    return { success: true };
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${existing.data.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const json = await res.json();

    if (!res.ok || !json.success) {
      const errMsg = json.errors?.[0]?.message || `Erro HTTP ${res.status}`;
      console.error('❌ [Cloudflare API] Falha ao deletar custom hostname:', json.errors);
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Cloudflare API] Erro ao deletar custom hostname:', err);
    return { success: false, error: err?.message || 'Falha de comunicação com a Cloudflare' };
  }
}

