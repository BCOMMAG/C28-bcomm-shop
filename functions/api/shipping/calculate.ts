import {
  calculateStoreShippingRates,
  CONFIG_LOGISTICA_DEFAULT,
  LogisticaAvancadaConfig
} from '../../../src/lib/shipping-engine';
import { DEFAULT_TENANT_ID } from '../../../src/lib/products';

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

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json();
    const {
      lojaId = DEFAULT_TENANT_ID,
      config,
      cepDestino,
      subtotal = 0,
      totalPecas = 1,
      ufDestino = '',
      cidadeDestino = '',
      pesoCustomKg
    } = body;

    if (!cepDestino) {
      return new Response(
        JSON.stringify({ error: 'CEP de destino é obrigatório' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const configLoja: LogisticaAvancadaConfig = config || CONFIG_LOGISTICA_DEFAULT;

    const result = await calculateStoreShippingRates({
      lojaId,
      config: configLoja,
      cepDestino,
      subtotal: Number(subtotal),
      totalPecas: Number(totalPecas),
      ufDestino,
      cidadeDestino,
      pesoCustomKg: pesoCustomKg ? Number(pesoCustomKg) : undefined
    });

    return new Response(
      JSON.stringify({
        success: true,
        options: result.options,
        isFallback: result.isFallback,
        descontoAplicadoReais: result.descontoAplicadoReais,
        freteGratisQualificado: result.freteGratisQualificado,
        configResumo: {
          provedor: configLoja.provedor,
          modoExibicao: configLoja.modo_exibicao,
          prazoManuseioDias: configLoja.prazo_manuseio_dias,
          sobretaxaEmbalagem: configLoja.sobretaxa_embalagem_reais
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('❌ [functions/api/shipping/calculate] Erro:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Falha ao calcular opções de frete' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

