import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { ShippingOption } from '@/utils/shipping';

export interface TransportadoraHabilitada {
  id: number;
  codigo: string; // 'correios_sedex' | 'correios_pac' | 'jadlog_com' | 'jadlog_package' | 'loggi' | 'azul_cargo'
  nome: string;
  transportadora: string;
  nome_personalizado?: string;
  ativo: boolean;
  prazo_adicional_dias?: number;
  permite_frete_gratis?: boolean;
}

export interface FaixaDescontoProgressivo {
  a_partir_de: number;
  desconto_reais?: number;
  isencao_total?: boolean;
}

export interface RegraRegionalFreteGratis {
  uf?: string;
  regiao?: 'SUL' | 'SUDESTE' | 'CENTRO_OESTE' | 'NORDESTE' | 'NORTE';
  valor_minimo: number;
}

export interface LogisticaAvancadaConfig {
  provedor: 'melhor_envio' | 'manual';
  ambiente: 'sandbox' | 'production';
  token_melhor_envio?: string;
  cep_origem: string;
  modo_exibicao: 'transparente' | 'white_label' | 'tarifa_unica';
  
  // Regras de Frete Grátis
  regras_frete_gratis: {
    ativo: boolean;
    valor_minimo_padrao: number;
    teto_maximo_subsidio?: number;
    aplicar_apenas_economico: boolean;
    regras_regionais?: RegraRegionalFreteGratis[];
  };

  // Descontos Progressivos / Subsídio Escalonado
  desconto_progressivo: {
    ativo: boolean;
    faixas: FaixaDescontoProgressivo[];
  };

  // Taxas e Prazos Operacionais
  sobretaxa_embalagem_reais: number;
  prazo_manuseio_dias: number;
  peso_padrao_peca_gramas: number;
  dimensoes_pacote: {
    altura: number;
    largura: number;
    comprimento: number;
  };

  // Serviços e Transportadoras
  servicos_habilitados: TransportadoraHabilitada[];

  // Modalidades Locais (Boutique Física & Raio Geográfico)
  entrega_local_ativa?: boolean;
  entrega_local_taxa?: number;
  entrega_local_bairros?: string;
  entrega_motoboy?: EntregaMotoboyConfig;
  retirada_boutique_ativa?: boolean;
  instrucoes_retirada?: string;
  origem_coordenadas?: CoordenadasGeograficas;
}

export interface EntregaMotoboyFaixaPreco {
  ate_km: number;
  valor_reais: number;
}

export interface CoordenadasGeograficas {
  latitude: number;
  longitude: number;
  cidade?: string;
  uf?: string;
  bairro?: string;
  logradouro?: string;
  cep?: string;
}

export interface EntregaMotoboyConfig {
  ativo: boolean;
  nome_personalizado?: string;
  modo_cobertura?: 'raio_km' | 'bairros_especificos' | 'hibrido';
  raio_maximo_km: number;
  bairros_excluidos?: string[];
  taxa_tipo: 'fixa' | 'por_faixa_km';
  taxa_fixa_reais: number;
  faixas_distancia?: EntregaMotoboyFaixaPreco[];
  valor_minimo_pedido?: number;
  permite_frete_gratis?: boolean;
  horario_limite_mesmo_dia?: string;
  dias_semana_disponiveis?: number[];
  descricao_vitrine?: string;
  origem_coordenadas?: CoordenadasGeograficas;
}

export const SERVICOS_PADRAO_MELHOR_ENVIO: TransportadoraHabilitada[] = [
  {
    id: 1,
    codigo: 'correios_sedex',
    nome: 'SEDEX',
    transportadora: 'Correios',
    nome_personalizado: 'SEDEX Express Prioritário',
    ativo: true,
    prazo_adicional_dias: 0,
    permite_frete_gratis: false
  },
  {
    id: 2,
    codigo: 'correios_pac',
    nome: 'PAC',
    transportadora: 'Correios',
    nome_personalizado: 'PAC Econômico Segurado',
    ativo: true,
    prazo_adicional_dias: 0,
    permite_frete_gratis: true
  },
  {
    id: 3,
    codigo: 'jadlog_com',
    nome: '.Com',
    transportadora: 'Jadlog',
    nome_personalizado: 'Jadlog Express',
    ativo: true,
    prazo_adicional_dias: 0,
    permite_frete_gratis: false
  },
  {
    id: 4,
    codigo: 'jadlog_package',
    nome: '.Package',
    transportadora: 'Jadlog',
    nome_personalizado: 'Jadlog Econômico',
    ativo: true,
    prazo_adicional_dias: 0,
    permite_frete_gratis: true
  }
];

export const CONFIG_LOGISTICA_DEFAULT: LogisticaAvancadaConfig = {
  provedor: 'melhor_envio',
  ambiente: 'sandbox',
  token_melhor_envio: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI5NTM0MDIxNWVkZTU2MmU3ZWI3YjVlNmU0ODc3MzY4YmZjNTQwZTk4NzE4OWY1YmE3Yjg2YzliMTQ1NTY2ZmEzMGVlNDcyOGU2ZGIyMTEyZSIsImlhdCI6MTc5MzU2NzQ2Ni4yODIwMywibmJmIjoxNzkzNTY3NDY2LjI4MjAzMiwiZXhwIjoxODI1MTAzNDY2LjI3MjA4NCwic3ViIjoiYTMxZmI3OTItMWE2Mi00ZTNkLTlkMDctNDYxMDE5YjM5N2EzIiwic2NvcGVzIjpbImNhcnQtcmVhZCIsImNhcnQtd3JpdGUiLCJjb21wYW5pZXMtcmVhZCIsImNvbXBhbmllcy13cml0ZSIsImNvdXBvbnMtcmVhZCIsImNvdXBvbnMtd3JpdGUiLCJub3RpZmljYXRpb25zLXJlYWQiLCJvcmRlcnMtcmVhZCIsInByb2R1Y3RzLXJlYWQiLCJwcm9kdWN0cy1kZXN0cm95IiwicHJvZHVjdHMtd3JpdGUiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siLCJtY3A6dXNlIl19.HafmTl0rZqNmis2sl6mBJ4otIaRodVEzDlhjM5bqAcGepJfKZUQo83FnjXUMoEfZiz5hAaZTEzCn40sqV_W7T_bpKMJW-XS8rdohCWqcTNi7U9es3c6KSNNGasw7oD3B1nRPU768DxfMKHcfxeqVq5wK-0XhpwYr-PjHKwxtwBczWjxf6wzepeKDHRY-yS_Ez0XycIvV_AqsuPG93Tn1Gu61vQLXles-lahxnoIdfAN7oHpPKLrUMdUQ2ChjQzOwkp7Oypn7x881Q3zbMIAGVgpAIM7nqpb4I812YhmRMdMG-rA_MrVfu4bHLi11aKULuBpAkx8nO7mnCf0sVLcgerdBOYgCz9tzJPT0ICV3au88eKKtk7ea9peJkj666ZlmD6ThS5gUrnaJZIMpFK1mLu3rShxFVQQxIJxPrrB5aOlOPlI3aJT9wJ2EeHYrAdwBWEoUUVigQLaBpzPlVx-Z-qmtzxcnRE61AXiEMeoP2r5AgbeLLcGnkfpFvXdttvePAeR4z8uoQotRGILSQZTg7a97-wczSbnsVe93Djkky1j1NjAU-avVCN9rXNoMgOTwDJVy6DJi1r_TdL-6NH2mwNhSJmXkbXRhfJkZZEGNYBj9iV6m9tzstUO0bVhj2J-uouRo6vekb9A7rS8sfxJdIMxfX4eP3QcEwoO3YiezWWw',
  cep_origem: '83005000', // Curitiba / São José dos Pinhais
  modo_exibicao: 'transparente',
  regras_frete_gratis: {
    ativo: true,
    valor_minimo_padrao: 350,
    teto_maximo_subsidio: 50,
    aplicar_apenas_economico: true,
    regras_regionais: [
      { uf: 'PR', valor_minimo: 200 },
      { regiao: 'SUDESTE', valor_minimo: 300 },
      { regiao: 'SUL', valor_minimo: 300 }
    ]
  },
  desconto_progressivo: {
    ativo: true,
    faixas: [
      { a_partir_de: 500, desconto_reais: 15 },
      { a_partir_de: 1000, desconto_reais: 30 },
      { a_partir_de: 2000, desconto_reais: 60 },
      { a_partir_de: 3000, isencao_total: true }
    ]
  },
  sobretaxa_embalagem_reais: 2.50,
  prazo_manuseio_dias: 1,
  peso_padrao_peca_gramas: 300,
  dimensoes_pacote: {
    altura: 8,
    largura: 20,
    comprimento: 25
  },
  servicos_habilitados: SERVICOS_PADRAO_MELHOR_ENVIO,
  entrega_local_ativa: true,
  entrega_local_taxa: 18.00,
  entrega_local_bairros: 'Curitiba e Região Metropolitana (São José dos Pinhais, Colombo, Pinhais)',
  entrega_motoboy: {
    ativo: true,
    nome_personalizado: 'Entrega Expressa via Motoboy',
    modo_cobertura: 'raio_km',
    raio_maximo_km: 15,
    taxa_tipo: 'fixa',
    taxa_fixa_reais: 18.00,
    faixas_distancia: [
      { ate_km: 5, valor_reais: 12.00 },
      { ate_km: 15, valor_reais: 18.00 },
      { ate_km: 25, valor_reais: 28.00 }
    ],
    valor_minimo_pedido: 0,
    permite_frete_gratis: false,
    horario_limite_mesmo_dia: '14:00',
    dias_semana_disponiveis: [1, 2, 3, 4, 5, 6],
    descricao_vitrine: 'Entrega no mesmo dia para pedidos aprovados até as 14h',
    origem_coordenadas: {
      latitude: -25.5348,
      longitude: -49.2064,
      cidade: 'São José dos Pinhais',
      uf: 'PR',
      cep: '83005000'
    }
  },
  retirada_boutique_ativa: true,
  instrucoes_retirada: 'Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.',
  origem_coordenadas: {
    latitude: -25.5348,
    longitude: -49.2064,
    cidade: 'São José dos Pinhais',
    uf: 'PR',
    cep: '83005000'
  }
};

// Cache simples em memória para cotações (TTL de 60 minutos)
const shippingCache = new Map<string, { timestamp: number; options: ShippingOption[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

// Cache dinâmico em memória para coordenadas de CEPs já consultados
const cepCoordinatesCache = new Map<string, CoordenadasGeograficas>();

// Coordenadas da boutique física padrão (Rua XV de Novembro, Centro, São José dos Pinhais/PR)
cepCoordinatesCache.set('83005000', {
  latitude: -25.5389,
  longitude: -49.1981,
  cidade: 'São José dos Pinhais',
  uf: 'PR',
  bairro: 'Centro',
  logradouro: 'Rua Quinze de Novembro',
  cep: '83005000'
});

/**
 * Calcula a distância geodésica em quilômetros corrigida pela malha viária urbana
 * Utiliza a fórmula de Haversine com fator de conversão linear -> viário (1.25x)
 */
export function calculateGeodesicDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Fator de correção viária urbana (1.25x da linha reta para esquinas e trânsito)
  return Number((straightDistance * 1.25).toFixed(1));
}

/**
 * Consulta coordenadas geográficas de alta precisão para qualquer CEP no Brasil
 * Pipeline em 2 Etapas:
 * 1. ViaCEP oficial dos Correios -> obtém nome exato do logradouro (rua/avenida), bairro e cidade
 * 2. OpenStreetMap Nominatim -> geocodifica o logradouro real com precisão métrica na rua correta
 */
export async function fetchCepCoordinates(cep: string): Promise<CoordenadasGeograficas | null> {
  const cleanCep = (cep || '').replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  if (cepCoordinatesCache.has(cleanCep)) {
    return cepCoordinatesCache.get(cleanCep)!;
  }

  // 1. Consulta dados cadastrais oficiais no ViaCEP
  let viaCepData: any = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        viaCepData = data;
      }
    }
  } catch (err) {
    // Prossegue para os fallbacks
  }

  // 2. Se o ViaCEP localizou o logradouro e a cidade, busca as coordenadas exatas no OpenStreetMap Nominatim
  if (viaCepData && viaCepData.localidade) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Prioridade 1: Rua + Bairro + Cidade + Estado (Precisão cirúrgica)
      const streetQuery = viaCepData.logradouro
        ? `${viaCepData.logradouro}, ${viaCepData.bairro || ''}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`
        : `${viaCepData.bairro || ''}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;

      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(streetQuery)}&format=json&limit=1`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BcommShop-Logistics/1.0 (suporte@bcomm.shop)' }
      });
      clearTimeout(timeoutId);

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
          const result: CoordenadasGeograficas = {
            latitude: Number(nomData[0].lat),
            longitude: Number(nomData[0].lon),
            cidade: viaCepData.localidade,
            uf: viaCepData.uf,
            bairro: viaCepData.bairro || '',
            logradouro: viaCepData.logradouro || '',
            cep: cleanCep
          };
          cepCoordinatesCache.set(cleanCep, result);
          return result;
        }
      }
    } catch (err) {
      // Prossegue para o fallback
    }
  }

  // 3. Fallback: BrasilAPI v2
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const coords = data?.location?.coordinates;
      if (coords && coords.latitude && coords.longitude) {
        const result: CoordenadasGeograficas = {
          latitude: Number(coords.latitude),
          longitude: Number(coords.longitude),
          cidade: data.city || viaCepData?.localidade,
          uf: data.state || viaCepData?.uf,
          bairro: data.neighborhood || viaCepData?.bairro,
          logradouro: data.street || viaCepData?.logradouro,
          cep: cleanCep
        };
        cepCoordinatesCache.set(cleanCep, result);
        return result;
      }
    }
  } catch (err) {
    // Prossegue
  }

  // 4. Fallback de Cidade: se temos a cidade pelo ViaCEP, pega as coordenadas da cidade
  if (viaCepData && viaCepData.localidade) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const cityQuery = `${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
      const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=1`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BcommShop-Logistics/1.0 (suporte@bcomm.shop)' }
      });
      clearTimeout(timeoutId);

      if (cityRes.ok) {
        const cityData = await cityRes.json();
        if (Array.isArray(cityData) && cityData.length > 0 && cityData[0].lat && cityData[0].lon) {
          const result: CoordenadasGeograficas = {
            latitude: Number(cityData[0].lat),
            longitude: Number(cityData[0].lon),
            cidade: viaCepData.localidade,
            uf: viaCepData.uf,
            bairro: viaCepData.bairro || '',
            logradouro: viaCepData.logradouro || '',
            cep: cleanCep
          };
          cepCoordinatesCache.set(cleanCep, result);
          return result;
        }
      }
    } catch (err) {
      // Falha graciosa
    }
  }

  return null;
}

/**
 * Consulta a API do Melhor Envio (Sandbox ou Produção)
 */
export async function fetchMelhorEnvioRates(
  token: string,
  isSandbox: boolean,
  cepOrigem: string,
  cepDestino: string,
  packageInfo: { height: number; width: number; length: number; weight: number }
): Promise<any[]> {
  const cleanFrom = cepOrigem.replace(/\D/g, '');
  const cleanTo = cepDestino.replace(/\D/g, '');

  const baseUrl = isSandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout de rede

  try {
    const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'BCOMM Platform (contato@agent-bcomm.space)'
      },
      body: JSON.stringify({
        from: { postal_code: cleanFrom },
        to: { postal_code: cleanTo },
        package: packageInfo
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[shipping-engine] Melhor Envio retornou HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[shipping-engine] Falha na chamada da API do Melhor Envio:', err?.message || err);
    return [];
  }
}

/**
 * Motor central de cálculo com aplicação integral de autonomia e regras da loja
 */
export async function calculateStoreShippingRates(params: {
  lojaId?: string;
  config?: LogisticaAvancadaConfig;
  cepDestino: string;
  subtotal: number;
  totalPecas?: number;
  ufDestino?: string;
  cidadeDestino?: string;
  pesoCustomKg?: number;
}): Promise<{
  options: ShippingOption[];
  isFallback: boolean;
  descontoAplicadoReais: number;
  freteGratisQualificado: boolean;
}> {
  const {
    config = CONFIG_LOGISTICA_DEFAULT,
    cepDestino,
    subtotal,
    totalPecas = 1,
    ufDestino = '',
    cidadeDestino = '',
    pesoCustomKg
  } = params;

  const cleanDestino = (cepDestino || '').replace(/\D/g, '');
  if (cleanDestino.length !== 8) {
    return { options: [], isFallback: false, descontoAplicadoReais: 0, freteGratisQualificado: false };
  }

  // Verifica cache
  const cacheKey = `${params.lojaId || 'default'}_${cleanDestino}_${Math.round(subtotal)}_${totalPecas}_${pesoCustomKg || 0}`;
  const cached = shippingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      options: cached.options,
      isFallback: false,
      descontoAplicadoReais: 0,
      freteGratisQualificado: subtotal >= (config.regras_frete_gratis?.valor_minimo_padrao || 350)
    };
  }

  // 1. Calcula peso e dimensões do pacote da loja
  const pesoFinalKg = pesoCustomKg && pesoCustomKg > 0
    ? pesoCustomKg
    : Math.max(0.3, (totalPecas * (config.peso_padrao_peca_gramas || 300)) / 1000);

  const alturaFinalCm = Math.min(60, (config.dimensoes_pacote?.altura || 8) + (totalPecas > 2 ? Math.floor(totalPecas * 1.5) : 0));
  const larguraFinalCm = config.dimensoes_pacote?.largura || 20;
  const comprimentoFinalCm = config.dimensoes_pacote?.comprimento || 25;

  let rawRates: any[] = [];
  let isFallback = false;

  // 2. Dispara cotação no Melhor Envio (se ativo e com token)
  if (config.provedor === 'melhor_envio' && config.token_melhor_envio) {
    rawRates = await fetchMelhorEnvioRates(
      config.token_melhor_envio,
      config.ambiente === 'sandbox',
      config.cep_origem || '83005000',
      cleanDestino,
      {
        height: alturaFinalCm,
        width: larguraFinalCm,
        length: comprimentoFinalCm,
        weight: Number(pesoFinalKg.toFixed(2))
      }
    );
  }

  // 3. Fallback inteligente caso a API esteja indisponível
  if (!rawRates || rawRates.length === 0 || rawRates.every(r => r.error)) {
    isFallback = true;
    rawRates = generateFallbackRates(ufDestino, pesoFinalKg);
  }

  // 4. Mapeamento e filtragem das transportadoras selecionadas pelo lojista
  const habilitadosMap = new Map<string, TransportadoraHabilitada>();
  (config.servicos_habilitados || SERVICOS_PADRAO_MELHOR_ENVIO).forEach(s => {
    habilitadosMap.set(s.codigo, s);
    // Mapeamento por id do Melhor Envio
    if (s.id) habilitadosMap.set(String(s.id), s);
  });

  // 5. Cálculo das Regras de Frete Grátis e Desconto Progressivo
  const freteGratisConfig = config.regras_frete_gratis || CONFIG_LOGISTICA_DEFAULT.regras_frete_gratis;
  let valorMinimoFreteGratis = freteGratisConfig.valor_minimo_padrao || 350;

  // Regra regional de Frete Grátis
  if (freteGratisConfig.regras_regionais && ufDestino) {
    const ufUpper = ufDestino.toUpperCase().trim();
    const regraUf = freteGratisConfig.regras_regionais.find(r => r.uf?.toUpperCase() === ufUpper);
    if (regraUf) {
      valorMinimoFreteGratis = regraUf.valor_minimo;
    } else {
      const isSul = ['PR', 'SC', 'RS'].includes(ufUpper);
      const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(ufUpper);
      const isNorteNordeste = ['BA', 'PE', 'CE', 'MA', 'PA', 'AM', 'RN', 'PB', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'].includes(ufUpper);

      const regraRegiao = freteGratisConfig.regras_regionais.find(r =>
        (r.regiao === 'SUL' && isSul) ||
        (r.regiao === 'SUDESTE' && isSudeste) ||
        (r.regiao === 'NORTE_NORDESTE' as any && isNorteNordeste)
      );
      if (regraRegiao) valorMinimoFreteGratis = regraRegiao.valor_minimo;
    }
  }

  const atingiuFreteGratis = freteGratisConfig.ativo && subtotal >= valorMinimoFreteGratis;

  // Desconto Progressivo por Valor de Compra
  let descontoProgressivoReais = 0;
  let isencaoTotalTicketAlto = false;

  if (config.desconto_progressivo?.ativo && config.desconto_progressivo?.faixas) {
    const faixasOrdenadas = [...config.desconto_progressivo.faixas].sort((a, b) => b.a_partir_de - a.a_partir_de);
    const faixaAplicavel = faixasOrdenadas.find(f => subtotal >= f.a_partir_de);
    if (faixaAplicavel) {
      if (faixaAplicavel.isencao_total) {
        isencaoTotalTicketAlto = true;
      } else if (faixaAplicavel.desconto_reais) {
        descontoProgressivoReais = faixaAplicavel.desconto_reais;
      }
    }
  }

  // 6. Formata e filtra as opções para a vitrine
  const options: ShippingOption[] = [];
  const sobretaxaEmbalagem = Number(config.sobretaxa_embalagem_reais || 0);
  const prazoManuseio = Number(config.prazo_manuseio_dias || 0);

  rawRates.forEach(rate => {
    if (rate.error) return;

    // Normaliza código do serviço
    const serviceName = (rate.name || '').toLowerCase();
    const companyName = (rate.company?.name || '').toLowerCase();
    let codigo = 'desconhecido';

    if (companyName.includes('correios') || rate.company?.id === 1) {
      if (serviceName.includes('sedex')) codigo = 'correios_sedex';
      else if (serviceName.includes('pac')) codigo = 'correios_pac';
    } else if (companyName.includes('jadlog') || rate.company?.id === 2) {
      if (serviceName.includes('.com') || rate.id === 4) codigo = 'jadlog_com';
      else if (serviceName.includes('package') || rate.id === 3) codigo = 'jadlog_package';
    }

    // Checa se o lojista manteve o serviço ATIVO
    const configServico = habilitadosMap.get(codigo) || habilitadosMap.get(String(rate.id));
    if (configServico && !configServico.ativo) {
      return; // Ocultado pela autonomia do lojista!
    }

    // Preço bruto da transportadora
    const precoBruto = Number(rate.price || rate.custom_price || 0);
    const prazoBruto = parseInt(rate.delivery_time || rate.custom_delivery_time || '5', 10);
    const prazoFinalDias = prazoBruto + prazoManuseio;

    // Aplicação da sobretaxa de embalagem configurada
    let precoComSobretaxa = precoBruto + sobretaxaEmbalagem;

    // Aplicação do desconto de frete
    let valorFinal = precoComSobretaxa;
    const isModalidadeEconomica = codigo === 'correios_pac' || codigo === 'jadlog_package';

    if (isencaoTotalTicketAlto) {
      valorFinal = 0;
    } else if (atingiuFreteGratis) {
      if (!freteGratisConfig.aplicar_apenas_economico || isModalidadeEconomica) {
        const teto = Number(freteGratisConfig.teto_maximo_subsidio || 0);
        if (teto > 0 && precoComSobretaxa > teto) {
          valorFinal = precoComSobretaxa - teto; // Isenta até o teto, cliente paga a diferença
        } else {
          valorFinal = 0;
        }
      }
    } else if (descontoProgressivoReais > 0) {
      valorFinal = Math.max(0, precoComSobretaxa - descontoProgressivoReais);
    }

    // Nome de exibição respeitando o modo White-Label / Transparência
    let nomeExibicao = configServico?.nome_personalizado || rate.name;
    if (config.modo_exibicao === 'white_label') {
      if (codigo.includes('sedex') || codigo.includes('com')) {
        nomeExibicao = 'Entrega Expressa Prioritária';
      } else {
        nomeExibicao = 'Entrega Econômica Padrão';
      }
    }

    const prazoTexto = `${prazoFinalDias} ${prazoFinalDias === 1 ? 'dia útil' : 'dias úteis'}`;
    const iconType: 'sedex' | 'pac' | 'pickup' = codigo.includes('sedex') ? 'sedex' : 'pac';

    options.push({
      id: codigo !== 'desconhecido' ? codigo : `shipping_${rate.id}`,
      name: nomeExibicao,
      description: `${prazoTexto} • Envio rastreado e segurado`,
      price: Number(valorFinal.toFixed(2)),
      formattedPrice: valorFinal === 0 ? 'Grátis' : `R$ ${valorFinal.toFixed(2).replace('.', ',')}`,
      deliveryDays: prazoTexto,
      iconType
    });
  });

  // Se o lojista configurou o modo "Tarifa Única Mais Barata", seleciona apenas a melhor
  let finalOptions = options;
  if (config.modo_exibicao === 'tarifa_unica' && options.length > 0) {
    const menor = [...options].sort((a, b) => a.price - b.price)[0];
    finalOptions = [{
      ...menor,
      id: 'envio_padrao_loja',
      name: 'Envio Padrão Recomendado',
      description: `${menor.deliveryDays} • Melhor custo-benefício`
    }];
  }

  // 7. Modalidades Locais (Retirada na Boutique & Entrega Expressa via Motoboy por Raio)
  const motoboyCfg: EntregaMotoboyConfig = config.entrega_motoboy || {
    ativo: config.entrega_local_ativa !== false,
    nome_personalizado: 'Entrega Expressa via Motoboy',
    modo_cobertura: 'raio_km',
    raio_maximo_km: 15,
    taxa_tipo: 'fixa',
    taxa_fixa_reais: Number(config.entrega_local_taxa || 18.00),
    horario_limite_mesmo_dia: '14:00',
    dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
  };

  // Coordenadas da Loja de Origem
  const coordsOrigem = config.origem_coordenadas || motoboyCfg.origem_coordenadas || (
    config.cep_origem ? await fetchCepCoordinates(config.cep_origem) : null
  ) || {
    latitude: -25.5348,
    longitude: -49.2064,
    cidade: 'São José dos Pinhais',
    uf: 'PR',
    cep: config.cep_origem || '83005000'
  };

  // Coordenadas do Destino do Cliente
  const coordsDestino = await fetchCepCoordinates(cleanDestino);

  let distanciaCalculadaKm: number | null = null;
  if (coordsOrigem && coordsDestino) {
    distanciaCalculadaKm = calculateGeodesicDistanceKm(
      coordsOrigem.latitude,
      coordsOrigem.longitude,
      coordsDestino.latitude,
      coordsDestino.longitude
    );
  }

  // Fallback de proximidade para quando não houver coordenadas exatas
  const isCityMatch = Boolean(
    (cidadeDestino && coordsOrigem.cidade && cidadeDestino.toLowerCase() === coordsOrigem.cidade.toLowerCase()) ||
    (coordsDestino?.cidade && coordsOrigem.cidade && coordsDestino.cidade.toLowerCase() === coordsOrigem.cidade.toLowerCase()) ||
    (cleanDestino.slice(0, 2) === (coordsOrigem.cep || '83005000').replace(/\D/g, '').slice(0, 2))
  );

  // Elegibilidade da Retirada na Boutique
  const isEligivelRetirada = (distanciaCalculadaKm !== null && distanciaCalculadaKm <= 60) || isCityMatch;
  if (config.retirada_boutique_ativa && isEligivelRetirada) {
    finalOptions.unshift({
      id: 'retirada_boutique',
      name: 'Retirada na Boutique Física',
      description: config.instrucoes_retirada || 'Pronto em até 2 horas úteis • Sem custo de frete',
      price: 0,
      formattedPrice: 'Grátis',
      deliveryDays: 'Em até 2 horas úteis',
      iconType: 'pickup'
    });
  }

  // Elegibilidade do Motoboy com Autonomia Estrita do Lojista
  if (motoboyCfg.ativo) {
    const atendeValorMinimo = !motoboyCfg.valor_minimo_pedido || subtotal >= motoboyCfg.valor_minimo_pedido;

    // Checagem de bairros excluídos
    const isBairroExcluido = Boolean(
      motoboyCfg.bairros_excluidos &&
      coordsDestino?.bairro &&
      motoboyCfg.bairros_excluidos.some(b => coordsDestino.bairro?.toLowerCase().includes(b.toLowerCase()))
    );

    let isDentroDoRaio = false;
    if (distanciaCalculadaKm !== null) {
      isDentroDoRaio = distanciaCalculadaKm <= motoboyCfg.raio_maximo_km;
    } else if (isCityMatch) {
      // Se não obteve coordenadas mas é a mesma cidade da loja física e o raio for padrão
      isDentroDoRaio = motoboyCfg.raio_maximo_km >= 15;
    }

    if (atendeValorMinimo && !isBairroExcluido && isDentroDoRaio) {
      // Determinação da taxa
      let taxaMotoboy = motoboyCfg.taxa_fixa_reais;
      if (motoboyCfg.taxa_tipo === 'por_faixa_km' && motoboyCfg.faixas_distancia && distanciaCalculadaKm !== null) {
        const faixasOrdenadas = [...motoboyCfg.faixas_distancia].sort((a, b) => a.ate_km - b.ate_km);
        const faixa = faixasOrdenadas.find(f => distanciaCalculadaKm! <= f.ate_km);
        if (faixa) {
          taxaMotoboy = faixa.valor_reais;
        } else if (faixasOrdenadas.length > 0) {
          taxaMotoboy = faixasOrdenadas[faixasOrdenadas.length - 1].valor_reais;
        }
      }

      // Frete Grátis via Motoboy se a loja permitir
      if (motoboyCfg.permite_frete_gratis && atingiuFreteGratis) {
        taxaMotoboy = 0;
      }

      // Horário e Prazo (Horário Oficial de Brasília UTC-3)
      const agora = new Date();
      const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;
      const minutoBrasilia = agora.getUTCMinutes();
      const horaAtualDecimal = horaBrasilia + (minutoBrasilia / 60);

      const [corteHora, corteMin] = (motoboyCfg.horario_limite_mesmo_dia || '14:00').split(':').map(Number);
      const horarioCorteDecimal = (corteHora || 14) + ((corteMin || 0) / 60);

      const diaSemana = agora.getDay();
      const isDiaDisponivel = (motoboyCfg.dias_semana_disponiveis || [1, 2, 3, 4, 5, 6]).includes(diaSemana);
      const isMesmoDia = isDiaDisponivel && horaAtualDecimal < horarioCorteDecimal;

      const prazoTexto = isMesmoDia ? 'Hoje até as 18h' : 'Próximo dia útil';
      const distanciaDesc = distanciaCalculadaKm !== null ? ` • Aprox. ${distanciaCalculadaKm} km` : '';

      const insertIndex = finalOptions.length > 0 && finalOptions[0].id === 'retirada_boutique' ? 1 : 0;
      finalOptions.splice(insertIndex, 0, {
        id: 'motoboy_express',
        name: motoboyCfg.nome_personalizado || 'Entrega Expressa via Motoboy',
        description: isMesmoDia
          ? `Entrega hoje para pedidos aprovados até ${motoboyCfg.horario_limite_mesmo_dia || '14:00'}${distanciaDesc}`
          : `Entrega expressa no próximo dia útil${distanciaDesc}`,
        price: taxaMotoboy,
        formattedPrice: taxaMotoboy === 0 ? 'Grátis' : `R$ ${taxaMotoboy.toFixed(2).replace('.', ',')}`,
        deliveryDays: prazoTexto,
        iconType: 'sedex'
      });
    }
  }

  // Salva no cache
  shippingCache.set(cacheKey, { timestamp: Date.now(), options: finalOptions });

  return {
    options: finalOptions,
    isFallback,
    descontoAplicadoReais: descontoProgressivoReais,
    freteGratisQualificado: atingiuFreteGratis || isencaoTotalTicketAlto
  };
}

/**
 * Tabela inteligente de contingência offline
 */
function generateFallbackRates(uf: string, pesoKg: number): any[] {
  const ufUpper = (uf || '').toUpperCase().trim();
  const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(ufUpper);
  const isSul = ['PR', 'SC', 'RS'].includes(ufUpper);
  const pesoFator = Math.max(1, pesoKg / 0.5);

  let pacPrice = 18.40;
  let pacDays = 6;
  let sedexPrice = 28.85;
  let sedexDays = 2;

  if (isSul) {
    pacPrice = 14.90 * pesoFator;
    pacDays = 3;
    sedexPrice = 21.50 * pesoFator;
    sedexDays = 1;
  } else if (isSudeste) {
    pacPrice = 18.40 * pesoFator;
    pacDays = 5;
    sedexPrice = 28.85 * pesoFator;
    sedexDays = 2;
  } else {
    pacPrice = 29.90 * pesoFator;
    pacDays = 8;
    sedexPrice = 49.90 * pesoFator;
    sedexDays = 3;
  }

  return [
    {
      id: 2,
      name: 'PAC',
      price: Number(pacPrice.toFixed(2)),
      delivery_time: String(pacDays),
      company: { id: 1, name: 'Correios' }
    },
    {
      id: 1,
      name: 'SEDEX',
      price: Number(sedexPrice.toFixed(2)),
      delivery_time: String(sedexDays),
      company: { id: 1, name: 'Correios' }
    }
  ];
}

