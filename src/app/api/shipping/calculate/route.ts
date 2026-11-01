import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  calculateStoreShippingRates,
  CONFIG_LOGISTICA_DEFAULT,
  LogisticaAvancadaConfig
} from '@/lib/shipping-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lojaId = DEFAULT_TENANT_ID,
      cepDestino,
      subtotal = 0,
      totalPecas = 1,
      ufDestino = '',
      cidadeDestino = '',
      pesoCustomKg
    } = body;

    if (!cepDestino) {
      return NextResponse.json(
        { error: 'CEP de destino é obrigatório' },
        { status: 400 }
      );
    }

    // Busca configurações da loja no Supabase
    let configLoja: LogisticaAvancadaConfig = CONFIG_LOGISTICA_DEFAULT;

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: loja } = await supabase
        .from('lojas')
        .select('configuracoes_visuais')
        .eq('id', lojaId)
        .maybeSingle();

      if (loja?.configuracoes_visuais) {
        const vis = loja.configuracoes_visuais as any;
        if (vis.logistica_avancada) {
          configLoja = {
            ...CONFIG_LOGISTICA_DEFAULT,
            ...vis.logistica_avancada
          };
        } else {
          // Retrocompatibilidade com campos simples existentes
          configLoja = {
            ...CONFIG_LOGISTICA_DEFAULT,
            regras_frete_gratis: {
              ...CONFIG_LOGISTICA_DEFAULT.regras_frete_gratis,
              valor_minimo_padrao: Number(vis.frete_gratis_valor || 350)
            },
            prazo_manuseio_dias: Number(vis.prazo_manuseio_dias ?? 1),
            entrega_local_ativa: vis.entrega_local_ativa ?? true,
            entrega_local_taxa: Number(vis.entrega_local_taxa ?? 18.00),
            entrega_local_bairros: vis.entrega_local_bairros,
            retirada_boutique_ativa: vis.retirada_boutique_ativa ?? true,
            instrucoes_retirada: vis.instrucoes_retirada
          };
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ [api/shipping/calculate] Usando configurações padrão de frete:', dbErr);
    }

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

    return NextResponse.json({
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
    });
  } catch (err: any) {
    console.error('❌ [api/shipping/calculate] Erro interno:', err);
    return NextResponse.json(
      { error: err?.message || 'Falha ao calcular opções de frete' },
      { status: 500 }
    );
  }
}

