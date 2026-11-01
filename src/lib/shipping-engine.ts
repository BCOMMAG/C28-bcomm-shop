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

  // Modalidades Locais
  entrega_local_ativa?: boolean;
  entrega_local_taxa?: number;
  entrega_local_bairros?: string;
  retirada_boutique_ativa?: boolean;
  instrucoes_retirada?: string;
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
  retirada_boutique_ativa: true,
  instrucoes_retirada: 'Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.'
};

// Cache simples em memória para cotações (TTL de 60 minutos)
const shippingCache = new Map<string, { timestamp: number; options: ShippingOption[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

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

  // 7. Injeta modalidades locais se o CEP for da região da loja
  const isLocalCity = cidadeDestino.toLowerCase().includes('curitiba') ||
                      cidadeDestino.toLowerCase().includes('são josé dos pinhais') ||
                      cleanDestino.startsWith('80') || cleanDestino.startsWith('81') || cleanDestino.startsWith('82') || cleanDestino.startsWith('83');

  if (isLocalCity) {
    // Retirada na Loja
    if (config.retirada_boutique_ativa) {
      finalOptions.unshift({
        id: 'retirada_boutique',
        name: 'Retirada na Boutique Física',
        description: 'Pronto em até 2 horas úteis • Sem custo de frete',
        price: 0,
        formattedPrice: 'Grátis',
        deliveryDays: 'Em até 2 horas úteis',
        iconType: 'pickup'
      });
    }

    // Motoboy Express
    if (config.entrega_local_ativa) {
      const taxaMotoboy = Number(config.entrega_local_taxa || 18.00);
      finalOptions.splice(1, 0, {
        id: 'motoboy_express',
        name: 'Entrega Expressa via Motoboy',
        description: 'Entrega no mesmo dia para pedidos aprovados até 14h',
        price: taxaMotoboy,
        formattedPrice: `R$ ${taxaMotoboy.toFixed(2).replace('.', ',')}`,
        deliveryDays: 'Hoje ou próximo dia útil',
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

