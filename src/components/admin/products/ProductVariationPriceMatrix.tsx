'use client';

import React from 'react';
import { Sparkles, DollarSign, RotateCcw, Copy } from 'lucide-react';

export interface PrecoVariavelItem {
  preco?: number;
  preco_promocional?: number;
}

export interface ProductVariationPriceMatrixProps {
  cores: Array<{ nome: string; hex?: string }>;
  tamanhos: string[];
  basePrice: number;
  basePromoPrice?: number;
  precosPorVariacao: Record<string, PrecoVariavelItem>;
  onChange: (updated: Record<string, PrecoVariavelItem>) => void;
  onFeedback?: (msg: string) => void;
}

export function ProductVariationPriceMatrix({
  cores,
  tamanhos,
  basePrice,
  basePromoPrice,
  precosPorVariacao,
  onChange,
  onFeedback
}: ProductVariationPriceMatrixProps) {
  const formatBRL = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleUpdateCellPrice = (
    corNome: string,
    tam: string,
    field: 'preco' | 'preco_promocional',
    val: number
  ) => {
    const key = `${corNome}_${tam}`;
    const currentItem = precosPorVariacao[key] || {};
    const updated = {
      ...precosPorVariacao,
      [key]: {
        ...currentItem,
        [field]: val > 0 ? val : undefined
      }
    };
    // Se ambos ficarem undefined, limpa o nó
    if (!updated[key].preco && !updated[key].preco_promocional) {
      delete updated[key];
    }
    onChange(updated);
  };

  const handleReplicarBaseParaTodos = () => {
    const updated: Record<string, PrecoVariavelItem> = {};
    cores.forEach((c) => {
      tamanhos.forEach((t) => {
        const key = `${c.nome}_${t}`;
        updated[key] = {
          preco: basePrice > 0 ? basePrice : undefined,
          preco_promocional: basePromoPrice && basePromoPrice > 0 ? basePromoPrice : undefined
        };
      });
    });
    onChange(updated);
    onFeedback?.('Preço base replicado para todas as combinações de cor e tamanho!');
  };

  const handleLimparPrecosDiferenciados = () => {
    onChange({});
    onFeedback?.('Preços diferenciados limpos. Todas as variações agora herdam o preço base da peça.');
  };

  const handleReplicarLinhaCor = (corNome: string) => {
    if (tamanhos.length <= 1) return;
    const firstTam = tamanhos[0];
    const sourceKey = `${corNome}_${firstTam}`;
    const source = precosPorVariacao[sourceKey] || { preco: basePrice, preco_promocional: basePromoPrice };

    const updated = { ...precosPorVariacao };
    tamanhos.forEach((t) => {
      const key = `${corNome}_${t}`;
      updated[key] = {
        preco: source.preco,
        preco_promocional: source.preco_promocional
      };
    });
    onChange(updated);
    onFeedback?.(`Preço do tamanho ${firstTam} replicado para todos os tamanhos da cor ${corNome}!`);
  };

  const handleReplicarColunaTamanho = (tamanho: string) => {
    if (cores.length <= 1) return;
    const firstCor = cores[0]?.nome;
    if (!firstCor) return;
    const sourceKey = `${firstCor}_${tamanho}`;
    const source = precosPorVariacao[sourceKey] || { preco: basePrice, preco_promocional: basePromoPrice };

    const updated = { ...precosPorVariacao };
    cores.forEach((c) => {
      const key = `${c.nome}_${tamanho}`;
      updated[key] = {
        preco: source.preco,
        preco_promocional: source.preco_promocional
      };
    });
    onChange(updated);
    onFeedback?.(`Preço do tamanho ${tamanho} replicado em todas as cores!`);
  };

  if (cores.length === 0 || tamanhos.length === 0) {
    return (
      <div className="p-6 text-center bg-amber-50/50 rounded-xl border border-dashed border-amber-300 text-amber-900 text-xs">
        Cadastre ao menos uma cor e um tamanho na grade acima para configurar preços por variação.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de Ferramentas e Atalhos Globais de Preço */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-100/60 border border-amber-300 rounded-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="text-xs font-bold text-amber-950 block">
              Precificação Granular por Cor × Tamanho
            </span>
            <span className="text-[11px] text-amber-800 block">
              Defina preços de venda e ofertas promocionais específicos para qualquer combinação.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReplicarBaseParaTodos}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Aplica o preço base da peça em todas as variações"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Replicar Base (R$ {formatBRL(basePrice)}) para Todos</span>
          </button>

          <button
            type="button"
            onClick={handleLimparPrecosDiferenciados}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            title="Restaura herança automática do preço base"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar Herança Padrão</span>
          </button>
        </div>
      </div>

      {/* Tabela Matriz */}
      <div className="overflow-x-auto border border-amber-200 rounded-xl bg-amber-50/20 shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-amber-100/70 text-amber-950 font-bold uppercase text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-2.5 min-w-[140px]">Cor</th>
              {tamanhos.map((tam) => (
                <th key={tam} className="p-2.5 text-center min-w-[130px]">
                  Tam. {tam === 'Tamanho Único' ? 'Único' : tam} (R$)
                </th>
              ))}
              <th className="p-2.5 text-center min-w-[140px]">Ações da Cor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 bg-white">
            {cores.map((c) => {
              const corNome = c.nome;
              const hex = c.hex || '#1A1918';

              return (
                <tr key={corNome} className="hover:bg-amber-50/40 transition-colors">
                  <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="truncate">{corNome}</span>
                  </td>

                  {tamanhos.map((tam) => {
                    const key = `${corNome}_${tam}`;
                    const customItem = precosPorVariacao[key];
                    const hasCustom = customItem?.preco !== undefined || customItem?.preco_promocional !== undefined;
                    const precoVendaAtual = customItem?.preco !== undefined ? customItem.preco : basePrice;
                    const promoAtual = customItem?.preco_promocional !== undefined ? customItem.preco_promocional : (basePromoPrice || 0);

                    return (
                      <td key={tam} className="p-2 text-center">
                        <div className="space-y-1">
                          {/* Preço de Venda do Tamanho */}
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={precoVendaAtual || ''}
                              onChange={(e) =>
                                handleUpdateCellPrice(
                                  corNome,
                                  tam,
                                  'preco',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-24 pl-5 pr-1.5 py-1 rounded-md text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs ${
                                customItem?.preco !== undefined && customItem.preco !== basePrice
                                  ? 'bg-amber-100/70 border border-amber-400 text-amber-950 font-black'
                                  : 'bg-slate-50 border border-slate-200 text-slate-900'
                              }`}
                              title={`Preço de venda para ${corNome} Tam ${tam}`}
                            />
                          </div>

                          {/* Preço Promocional Específico */}
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-rose-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={promoAtual || ''}
                              onChange={(e) =>
                                handleUpdateCellPrice(
                                  corNome,
                                  tam,
                                  'preco_promocional',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Promoção"
                              className="w-24 pl-5 pr-1.5 py-1 bg-rose-50/40 border border-rose-200 rounded-md text-[11px] font-mono font-bold text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              title={`Preço promocional para ${corNome} Tam ${tam}`}
                            />
                          </div>

                          {/* Badge Herança vs Personalizado */}
                          <div className="text-[9px]">
                            {hasCustom ? (
                              <span className="text-amber-800 font-bold bg-amber-100 px-1 py-0.2 rounded">★ Personalizado</span>
                            ) : (
                              <span className="text-slate-400">Herdando base</span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Ação da Cor */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleReplicarLinhaCor(corNome)}
                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                      title={`Replicar o valor do primeiro tamanho em todos os tamanhos da cor ${corNome}`}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Replicar nesta Cor</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Rodapé: Ações por Tamanho */}
          <tfoot className="bg-amber-50/80 border-t border-amber-200 text-[10px] font-bold text-amber-950">
            <tr>
              <td className="p-2 text-slate-500 uppercase tracking-wider">
                Replicar Tamanho:
              </td>
              {tamanhos.map((tam) => (
                <td key={tam} className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleReplicarColunaTamanho(tam)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold cursor-pointer transition-colors"
                    title={`Replicar o preço de ${tam} da primeira cor em todas as outras cores`}
                  >
                    Em Todas
                  </button>
                </td>
              ))}
              <td className="p-2 text-center text-slate-400 font-normal">
                (Aplica na vertical)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
