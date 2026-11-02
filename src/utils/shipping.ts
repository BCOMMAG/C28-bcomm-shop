import {
  calculateStoreShippingRates,
  CONFIG_LOGISTICA_DEFAULT,
  SERVICOS_PADRAO_MELHOR_ENVIO,
  LogisticaAvancadaConfig
} from '@/lib/shipping-engine';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado?: string;
  regiao?: string;
  ibge?: string;
  erro?: boolean | string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  formattedPrice: string;
  deliveryDays: string;
  iconType: 'sedex' | 'pac' | 'pickup';
}

/**
 * Formata um valor de CEP para a máscara 00000-000
 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

/**
 * Consulta a API pública do ViaCEP sem necessidade de autenticação ou banco de dados
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro === true || data.erro === 'true') {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao consultar ViaCEP:', error);
    return null;
  }
}

/**
 * Consulta o motor unificado de frete da BCOMM (/api/shipping/calculate).
 * Integra Melhor Envio (Correios e Jadlog), regras de autonomia do lojista,
 * desconto progressivo e cai na contingência automaticamente em caso de oscilação.
 */
export async function fetchStoreShippingOptions(params: {
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
  const cleanCep = (params.cepDestino || '').replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return {
      options: [],
      isFallback: false,
      descontoAplicadoReais: 0,
      freteGratisQualificado: false
    };
  }

  // 1. Tenta chamar o endpoint /api/shipping/calculate (Cloudflare Pages, Vercel ou Node.js)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/shipping/calculate', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lojaId: params.lojaId,
        config: params.config,
        cepDestino: cleanCep,
        subtotal: params.subtotal,
        totalPecas: params.totalPecas || 1,
        ufDestino: params.ufDestino,
        cidadeDestino: params.cidadeDestino,
        pesoCustomKg: params.pesoCustomKg
      })
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.options && data.options.length > 0) {
        return {
          options: data.options,
          isFallback: Boolean(data.isFallback),
          descontoAplicadoReais: Number(data.descontoAplicadoReais || 0),
          freteGratisQualificado: Boolean(data.freteGratisQualificado)
        };
      }
    }
  } catch (err) {
    console.warn('[shipping.ts] Queda ou ausência de rota /api/shipping/calculate, acionando motor unificado client-side:', err);
  }

  // 2. Motor Unificado Client-Side: calcula respeitando integralmente as configurações da loja
  try {
    const localResult = await calculateStoreShippingRates({
      lojaId: params.lojaId,
      config: params.config,
      cepDestino: cleanCep,
      subtotal: params.subtotal,
      totalPecas: params.totalPecas || 1,
      ufDestino: params.ufDestino,
      cidadeDestino: params.cidadeDestino,
      pesoCustomKg: params.pesoCustomKg
    });

    if (localResult && localResult.options.length > 0) {
      return localResult;
    }
  } catch (engineErr) {
    console.warn('[shipping.ts] Erro no motor local, acionando fallback estrito:', engineErr);
  }

  // 3. Fallback síncrono com respeito estrito às opções do lojista (nada de PAC se estiver desmarcado!)
  const fallbackOpts = calculateShippingOptions(params.ufDestino || '', params.subtotal, params.config);
  return {
    options: fallbackOpts,
    isFallback: true,
    descontoAplicadoReais: 0,
    freteGratisQualificado: params.subtotal >= (params.config?.regras_frete_gratis?.valor_minimo_padrao || 350)
  };
}

/**
 * Calcula prazos e valores de frete com respeito integral à autonomia de transportadoras da loja
 */
export function calculateShippingOptions(
  uf: string,
  subtotal: number = 0,
  config?: LogisticaAvancadaConfig
): ShippingOption[] {
  const cfg = config || CONFIG_LOGISTICA_DEFAULT;
  const ufUpper = (uf || '').toUpperCase().trim();
  const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(ufUpper);
  const isSulOuCentro = ['PR', 'SC', 'RS', 'DF', 'GO', 'MT', 'MS'].includes(ufUpper);

  let sedexPrice = 18.90;
  let sedexDays = '1 a 2 dias úteis';
  let pacPrice = 14.50;
  let pacDays = '3 a 5 dias úteis';

  if (isSudeste) {
    sedexPrice = 18.90;
    sedexDays = '1 a 2 dias úteis';
    pacPrice = 14.50;
    pacDays = '3 a 5 dias úteis';
  } else if (isSulOuCentro) {
    sedexPrice = 27.90;
    sedexDays = '2 a 4 dias úteis';
    pacPrice = 21.00;
    pacDays = '5 a 7 dias úteis';
  } else {
    sedexPrice = 38.90;
    sedexDays = '3 a 6 dias úteis';
    pacPrice = 28.50;
    pacDays = '7 a 12 dias úteis';
  }

  const servicos = cfg.servicos_habilitados || SERVICOS_PADRAO_MELHOR_ENVIO;
  const sedexConfig = servicos.find(s => s.codigo === 'correios_sedex' || s.id === 1);
  const pacConfig = servicos.find(s => s.codigo === 'correios_pac' || s.id === 2);
  const jadlogComConfig = servicos.find(s => s.codigo === 'jadlog_com' || s.id === 3);
  const jadlogPkgConfig = servicos.find(s => s.codigo === 'jadlog_package' || s.id === 4);

  const options: ShippingOption[] = [];

  // 1. Sedex (Apenas se ativo na loja)
  if (sedexConfig && sedexConfig.ativo) {
    const nomeSedex = cfg.modo_exibicao === 'white_label'
      ? 'Entrega Expressa Prioritária'
      : (sedexConfig.nome_personalizado || 'SEDEX');
    options.push({
      id: 'sedex',
      name: nomeSedex,
      description: `${sedexDays} • Envio Prioritário`,
      price: sedexPrice,
      formattedPrice: `R$ ${sedexPrice.toFixed(2).replace('.', ',')}`,
      deliveryDays: sedexDays,
      iconType: 'sedex'
    });
  }

  // 2. PAC (Apenas se ativo na loja)
  if (pacConfig && pacConfig.ativo) {
    const nomePac = cfg.modo_exibicao === 'white_label'
      ? 'Entrega Econômica Padrão'
      : (pacConfig.nome_personalizado || 'PAC');
    options.push({
      id: 'pac',
      name: nomePac,
      description: `${pacDays} • Envio Econômico Segurado`,
      price: pacPrice,
      formattedPrice: `R$ ${pacPrice.toFixed(2).replace('.', ',')}`,
      deliveryDays: pacDays,
      iconType: 'pac'
    });
  }

  // 3. Jadlog .Com (Apenas se ativo na loja)
  if (jadlogComConfig && jadlogComConfig.ativo) {
    const nomeJadlogCom = cfg.modo_exibicao === 'white_label'
      ? 'Jadlog Express'
      : (jadlogComConfig.nome_personalizado || 'Jadlog .Com');
    options.push({
      id: 'jadlog_com',
      name: nomeJadlogCom,
      description: `${sedexDays} • Envio Rápido Rodoviário`,
      price: Number((sedexPrice * 0.95).toFixed(2)),
      formattedPrice: `R$ ${(sedexPrice * 0.95).toFixed(2).replace('.', ',')}`,
      deliveryDays: sedexDays,
      iconType: 'sedex'
    });
  }

  // 4. Jadlog .Package (Apenas se ativo na loja)
  if (jadlogPkgConfig && jadlogPkgConfig.ativo) {
    const nomeJadlogPkg = cfg.modo_exibicao === 'white_label'
      ? 'Jadlog Econômico'
      : (jadlogPkgConfig.nome_personalizado || 'Jadlog .Package');
    options.push({
      id: 'jadlog_package',
      name: nomeJadlogPkg,
      description: `${pacDays} • Envio Econômico`,
      price: Number((pacPrice * 0.9).toFixed(2)),
      formattedPrice: `R$ ${(pacPrice * 0.9).toFixed(2).replace('.', ',')}`,
      deliveryDays: pacDays,
      iconType: 'pac'
    });
  }

  // 5. Retirada na Boutique (Apenas se ativa na loja)
  if (cfg.retirada_boutique_ativa) {
    options.push({
      id: 'pickup',
      name: 'Retirada na Boutique Física',
      description: cfg.instrucoes_retirada || 'Disponível em até 2 horas úteis • Sem custo de frete',
      price: 0,
      formattedPrice: 'Grátis',
      deliveryDays: 'Pronta Entrega',
      iconType: 'pickup'
    });
  }

  // Garantia: Se todas as opções foram desmarcadas, expõe ao menos o Sedex ativo
  if (options.length === 0) {
    options.push({
      id: 'sedex',
      name: sedexConfig?.nome_personalizado || 'SEDEX Express Prioritário',
      description: `${sedexDays} • Envio Prioritário`,
      price: sedexPrice,
      formattedPrice: `R$ ${sedexPrice.toFixed(2).replace('.', ',')}`,
      deliveryDays: sedexDays,
      iconType: 'sedex'
    });
  }

  return options;
}

