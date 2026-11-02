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

// Cache no Edge da Cloudflare para coordenadas de CEPs
const edgeCepCache = new Map<string, any>();

// Coordenadas exatas garantidas dos CEPs padrão
edgeCepCache.set('82010600', {
  latitude: -25.4223,
  longitude: -49.3346,
  cidade: 'Curitiba',
  uf: 'PR',
  bairro: 'Santo Inácio',
  logradouro: 'Rua José Boiko',
  cep: '82010600',
});

edgeCepCache.set('83005000', {
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

    if (request.method === 'POST') {
      try {
        const body: any = await request.json();
        cleanCep = (body?.cep || '').replace(/\D/g, '');
      } catch {}
    }

    if (!cleanCep) {
      const url = new URL(request.url);
      cleanCep = (url.searchParams.get('cep') || '').replace(/\D/g, '');
    }

    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido. Forneça um CEP com 8 dígitos.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Cache do Edge
    if (edgeCepCache.has(cleanCep)) {
      return new Response(
        JSON.stringify({
          success: true,
          data: edgeCepCache.get(cleanCep),
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

    // 2. Consulta no ViaCEP oficial
    let viaCepData: any = null;
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
        }
      }
    } catch (err) {
      console.warn(`[geocode edge] Falha no ViaCEP para ${cleanCep}:`, err);
    }

    // 3. Geocodificação no OpenStreetMap Nominatim via Cloudflare Edge Worker
    if (viaCepData && viaCepData.localidade) {
      const queriesToTry: string[] = [];

      if (viaCepData.logradouro) {
        queriesToTry.push(
          `${viaCepData.logradouro}, ${viaCepData.bairro || ''}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`
        );
        queriesToTry.push(
          `${viaCepData.logradouro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`
        );
      }

      if (viaCepData.bairro) {
        queriesToTry.push(
          `${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`
        );
      }

      queriesToTry.push(`${viaCepData.localidade}, ${viaCepData.uf}, Brasil`);

      for (const query of queriesToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
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
              const result = {
                latitude: Number(nomData[0].lat),
                longitude: Number(nomData[0].lon),
                cidade: viaCepData.localidade,
                uf: viaCepData.uf,
                bairro: viaCepData.bairro || '',
                logradouro: viaCepData.logradouro || '',
                cep: cleanCep
              };

              edgeCepCache.set(cleanCep, result);

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
          // Continua tentando fallbacks
        }
      }
    }

    // 4. Fallback BrasilAPI v2
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
            cidade: data.city || viaCepData?.localidade || 'Cidade',
            uf: data.state || viaCepData?.uf || 'UF',
            bairro: data.neighborhood || viaCepData?.bairro || '',
            logradouro: data.street || viaCepData?.logradouro || '',
            cep: cleanCep
          };

          edgeCepCache.set(cleanCep, result);

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

    return new Response(
      JSON.stringify({ error: 'Não foi possível obter coordenadas para o CEP informado.' }),
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
