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

// Cache em memória no Edge da Cloudflare para coordenadas de CEPs e Endereços
const edgeCoordsCache = new Map<string, any>();

// Coordenadas exatas conhecidas dos CEPs padrão da loja
edgeCoordsCache.set('82010600', {
  latitude: -25.4223,
  longitude: -49.3346,
  cidade: 'Curitiba',
  uf: 'PR',
  bairro: 'Santo Inácio',
  logradouro: 'Rua José Boiko',
  cep: '82010600',
});

edgeCoordsCache.set('83005000', {
  latitude: -25.5389,
  longitude: -49.1981,
  cidade: 'São José dos Pinhais',
  uf: 'PR',
  bairro: 'Centro',
  logradouro: 'Rua Quinze de Novembro',
  cep: '83005000',
});

async function handleGeocode(request: Request) {
  try {
    let cleanCep = '';
    let rua = '';
    let numero = '';
    let bairro = '';
    let cidade = '';
    let uf = '';

    if (request.method === 'POST') {
      try {
        const body: any = await request.json();
        cleanCep = (body?.cep || '').replace(/\D/g, '');
        rua = (body?.rua || body?.logradouro || '').trim();
        numero = (body?.numero || '').trim();
        bairro = (body?.bairro || '').trim();
        cidade = (body?.cidade || '').trim();
        uf = (body?.uf || body?.estado || '').trim();
      } catch {}
    } else {
      const url = new URL(request.url);
      cleanCep = (url.searchParams.get('cep') || '').replace(/\D/g, '');
      rua = (url.searchParams.get('rua') || url.searchParams.get('logradouro') || '').trim();
      numero = (url.searchParams.get('numero') || '').trim();
      bairro = (url.searchParams.get('bairro') || '').trim();
      cidade = (url.searchParams.get('cidade') || '').trim();
      uf = (url.searchParams.get('uf') || url.searchParams.get('estado') || '').trim();
    }

    if (cleanCep.length !== 8 && (!rua || !cidade)) {
      return new Response(
        JSON.stringify({ error: 'Forneça ao menos um CEP válido de 8 dígitos ou Rua e Cidade.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Chave de cache inteligente (combina CEP + Número se fornecido)
    const cacheKey = cleanCep
      ? `${cleanCep}${numero ? `_${numero.toLowerCase()}` : ''}`
      : `${rua.toLowerCase()}_${numero.toLowerCase()}_${cidade.toLowerCase()}`;

    // 1. Consulta Cache do Edge
    if (edgeCoordsCache.has(cacheKey)) {
      return new Response(
        JSON.stringify({
          success: true,
          data: edgeCoordsCache.get(cacheKey),
          cached: true
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
          }
        }
      );
    }

    // 2. Se temos apenas CEP ou faltam campos de rua/cidade, consulta o ViaCEP oficial
    let viaCepData: any = null;
    if (cleanCep.length === 8 && (!rua || !cidade)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            viaCepData = data;
            if (!rua) rua = data.logradouro || '';
            if (!bairro) bairro = data.bairro || '';
            if (!cidade) cidade = data.localidade || '';
            if (!uf) uf = data.uf || '';
          }
        }
      } catch (err) {
        console.warn(`[geocode edge] Falha no ViaCEP para ${cleanCep}:`, err);
      }
    }

    // 3. Monta cadeia de busca em cascata no OpenStreetMap Nominatim
    const queriesToTry: string[] = [];

    // Prioridade Máxima: Rua + Número Predial + Bairro + Cidade + UF
    if (rua && numero && numero.toLowerCase() !== 's/n') {
      if (bairro && cidade && uf) {
        queriesToTry.push(`${rua}, ${numero}, ${bairro}, ${cidade}, ${uf}, Brasil`);
      }
      if (cidade && uf) {
        queriesToTry.push(`${rua}, ${numero}, ${cidade}, ${uf}, Brasil`);
      }
    }

    // Prioridade Alta: Rua + Bairro + Cidade + UF (centro da rua)
    if (rua) {
      if (bairro && cidade && uf) {
        queriesToTry.push(`${rua}, ${bairro}, ${cidade}, ${uf}, Brasil`);
      }
      if (cidade && uf) {
        queriesToTry.push(`${rua}, ${cidade}, ${uf}, Brasil`);
      }
    }

    // Prioridade Média: Bairro + Cidade + UF
    if (bairro && cidade && uf) {
      queriesToTry.push(`${bairro}, ${cidade}, ${uf}, Brasil`);
    }

    // Prioridade Fallback: Cidade + UF
    if (cidade && uf) {
      queriesToTry.push(`${cidade}, ${uf}, Brasil`);
    }

    for (const query of queriesToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'BcommShop-CloudflareEdge/1.0 (suporte@bcomm.shop)',
              'Accept': 'application/json'
            }
          }
        );
        clearTimeout(timeoutId);

        if (nomRes.ok) {
          const nomData: any = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
            const hit = nomData[0];
            const result = {
              latitude: Number(hit.lat),
              longitude: Number(hit.lon),
              cidade: cidade || viaCepData?.localidade || hit.address?.city || hit.address?.town || '',
              uf: uf || viaCepData?.uf || hit.address?.state_code || '',
              bairro: bairro || viaCepData?.bairro || hit.address?.suburb || hit.address?.neighbourhood || '',
              logradouro: rua || viaCepData?.logradouro || hit.address?.road || '',
              numero: numero || hit.address?.house_number || '',
              cep: cleanCep || viaCepData?.cep?.replace(/\D/g, '') || hit.address?.postcode?.replace(/\D/g, '') || '',
              precision: numero && hit.address?.house_number ? 'predial' : rua ? 'rua' : 'cidade'
            };

            edgeCoordsCache.set(cacheKey, result);

            return new Response(
              JSON.stringify({
                success: true,
                data: result,
                matchedQuery: query
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Cache-Control': 'public, max-age=86400, s-maxage=86400'
                }
              }
            );
          }
        }
      } catch (nomErr) {
        // Tenta próxima query
      }
    }

    // 4. Fallback BrasilAPI v2 (para quando o CEP está disponível)
    if (cleanCep.length === 8) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data: any = await res.json();
          const coords = data?.location?.coordinates;
          if (coords && coords.latitude && coords.longitude) {
            const result = {
              latitude: Number(coords.latitude),
              longitude: Number(coords.longitude),
              cidade: data.city || cidade || viaCepData?.localidade || 'Cidade',
              uf: data.state || uf || viaCepData?.uf || 'UF',
              bairro: data.neighborhood || bairro || viaCepData?.bairro || '',
              logradouro: data.street || rua || viaCepData?.logradouro || '',
              numero: numero || '',
              cep: cleanCep,
              precision: 'cep_aproximado'
            };

            edgeCoordsCache.set(cacheKey, result);

            return new Response(
              JSON.stringify({
                success: true,
                data: result,
                source: 'brasilapi'
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Cache-Control': 'public, max-age=86400, s-maxage=86400'
                }
              }
            );
          }
        }
      } catch (brErr) {
        console.warn(`[geocode edge] Falha no BrasilAPI para ${cleanCep}:`, brErr);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Não foi possível obter coordenadas para o endereço/CEP informado.' }),
      { status: 404, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('❌ [functions/api/geocode] Erro inesperado:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro interno no servidor de geocodificação.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestGet(context: any) {
  return handleGeocode(context.request);
}

export async function onRequestPost(context: any) {
  return handleGeocode(context.request);
}
