'use client';

import React, { useState } from 'react';
import { Sparkles, DollarSign, RotateCcw, Copy, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useAdminI18n } from '@/context/AdminI18nContext';

export interface PrecoVariavelItem {
  preco?: number;
  preco_promocional?: number;
}

export interface ProductVariationPriceMatrixProps {
  cores: Array<{ nome: string; hex?: string }>;
  tamanhos: string[];
  basePrice: number;
  basePromoPrice?: number;
  variacoes?: Array<{ cor_nome: string; tamanho: string; estoque: number }>;
  precosPorVariacao: Record<string, PrecoVariavelItem>;
  onChange: (updated: Record<string, PrecoVariavelItem>) => void;
  onFeedback?: (msg: string) => void;
}

export function ProductVariationPriceMatrix({
  cores,
  tamanhos,
  basePrice,
  basePromoPrice,
  variacoes,
  precosPorVariacao,
  onChange,
  onFeedback
}: ProductVariationPriceMatrixProps) {
  const { currency, t } = useAdminI18n();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

  // Controle de células desbloqueadas manualmente pelo administrador mesmo sem estoque
  const [unlockedCells, setUnlockedCells] = useState<Set<string>>(new Set());
  const [confirmModalData, setConfirmModalData] = useState<{
    corNome: string;
    tam: string;
    estoque: number;
    existsInGrade: boolean;
  } | null>(null);


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
    onFeedback?.(t.products.matrix.toastReplicatedBase);
  };

  const handleLimparPrecosDiferenciados = () => {
    onChange({});
    onFeedback?.(t.products.matrix.toastCleared);
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
    onFeedback?.(t.products.matrix.toastReplicatedRow(firstTam, corNome));
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
    onFeedback?.(t.products.matrix.toastReplicatedCol(tamanho));
  };

  if (cores.length === 0 || tamanhos.length === 0) {
    return (
      <div className="p-6 text-center bg-amber-50/50 rounded-xl border border-dashed border-amber-300 text-amber-900 text-xs">
        {t.products.matrix.emptyGrid}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tabela Matriz */}
      <div className="overflow-x-auto border border-amber-200/80 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-amber-100/70 text-amber-950 font-bold uppercase text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-2.5 min-w-[140px]">{t.products.matrix.thColor}</th>
              {tamanhos.map((tam) => (
                <th key={tam} className="p-2.5 text-center min-w-[140px]">
                  {t.products.matrix.thSize} {tam === 'Tamanho Único' ? t.products.matrix.singleSize : tam} ({currencySymbol})
                </th>
              ))}
              <th className="p-2.5 text-center min-w-[140px]">{t.products.matrix.thActions}</th>
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

                    // Análise de estoque para bloqueio inteligente
                    const matchingVar = variacoes?.find(
                      (v) => (v.cor_nome || '').trim().toLowerCase() === corNome.trim().toLowerCase() && (v.tamanho || '').trim() === tam.trim()
                    );
                    const existsInGrade = Boolean(matchingVar);
                    const estoqueNum = matchingVar ? Number(matchingVar.estoque || 0) : 0;
                    const isZeroStock = !existsInGrade || estoqueNum === 0;
                    const isUnlockedManually = unlockedCells.has(key);
                    const isBlocked = isZeroStock && !isUnlockedManually;

                    return (
                      <td
                        key={tam}
                        className={`p-2 text-center transition-colors ${
                          isBlocked
                            ? 'bg-slate-100/80 border border-slate-200'
                            : isUnlockedManually
                            ? 'bg-amber-50/40 border border-amber-300/60'
                            : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {/* Indicador de Status de Estoque e Cadeado */}
                          {isBlocked ? (
                            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold px-0.5 mb-1">
                              <span className="flex items-center gap-1 text-slate-500">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                {existsInGrade ? t.products.matrix.stockZero : t.products.matrix.notInGrade}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModalData({
                                    corNome,
                                    tam,
                                    estoque: estoqueNum,
                                    existsInGrade
                                  })
                                }
                                className="text-amber-700 hover:text-amber-900 underline text-[9px] cursor-pointer"
                                title={t.products.matrix.unlockNotice}
                              >
                                {t.products.matrix.unlockBtn}
                              </button>
                            </div>
                          ) : isUnlockedManually ? (
                            <div className="flex items-center justify-between text-[9px] text-amber-800 font-bold px-0.5 mb-1">
                              <span className="flex items-center gap-1">
                                <Unlock className="w-2.5 h-2.5 text-amber-600" />
                                {t.products.matrix.unlockedBadge}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUnlockedCells((prev) => {
                                    const next = new Set(prev);
                                    next.delete(key);
                                    return next;
                                  });
                                }}
                                className="text-slate-400 hover:text-slate-600 text-[9px] cursor-pointer"
                                title={t.products.matrix.relockBtn}
                              >
                                {t.products.matrix.relockBtn}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium px-0.5 mb-0.5">
                              <span>{t.products.matrix.stockLabel}</span>
                              <span className="font-bold text-slate-700">{estoqueNum} {t.products.matrix.stockUnit}</span>
                            </div>
                          )}

                          {/* Preço de Venda do Tamanho */}
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{currencySymbol}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={precoVendaAtual || ''}
                              readOnly={isBlocked}
                              onClick={() => {
                                if (isBlocked) {
                                  setConfirmModalData({
                                    corNome,
                                    tam,
                                    estoque: estoqueNum,
                                    existsInGrade
                                  });
                                }
                              }}
                              onChange={(e) => {
                                if (isBlocked) return;
                                handleUpdateCellPrice(
                                  corNome,
                                  tam,
                                  'preco',
                                  parseFloat(e.target.value) || 0
                                );
                              }}
                              className={`w-28 pl-5 pr-1.5 py-1 rounded-md text-[11px] font-mono font-bold focus:outline-none shadow-2xs ${
                                isBlocked
                                  ? 'bg-slate-200/50 border border-slate-300 text-slate-500 cursor-not-allowed'
                                  : customItem?.preco !== undefined && customItem.preco !== basePrice
                                  ? 'bg-amber-100/70 border border-amber-400 text-amber-950 font-black focus:ring-1 focus:ring-amber-500'
                                  : 'bg-white border border-slate-300 text-slate-900 focus:ring-1 focus:ring-amber-500'
                              }`}
                              title={isBlocked ? t.products.matrix.unlockNotice : `${t.products.matrix.thSalePrice}: ${corNome} ${tam}`}
                            />
                          </div>

                          {/* Preço Promocional Específico */}
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-rose-400">{currencySymbol}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={promoAtual || ''}
                              readOnly={isBlocked}
                              onClick={() => {
                                if (isBlocked) {
                                  setConfirmModalData({
                                    corNome,
                                    tam,
                                    estoque: estoqueNum,
                                    existsInGrade
                                  });
                                }
                              }}
                              onChange={(e) => {
                                if (isBlocked) return;
                                handleUpdateCellPrice(
                                  corNome,
                                  tam,
                                  'preco_promocional',
                                  parseFloat(e.target.value) || 0
                                );
                              }}
                              placeholder={isBlocked ? t.products.matrix.blockedPlaceholder : t.products.matrix.promoPlaceholder}
                              className={`w-28 pl-5 pr-1.5 py-1 rounded-md text-[11px] font-mono font-bold focus:outline-none shadow-2xs ${
                                isBlocked
                                  ? 'bg-slate-200/50 border border-slate-300 text-slate-500 cursor-not-allowed placeholder:text-slate-400'
                                  : 'bg-rose-50/40 border border-rose-200 text-rose-900 focus:ring-1 focus:ring-rose-500'
                              }`}
                              title={isBlocked ? t.products.matrix.unlockNotice : `${t.products.matrix.thPromoPrice}: ${corNome} ${tam}`}
                            />
                          </div>

                          {/* Badge Herança vs Personalizado */}
                          <div className="text-[9px]">
                            {hasCustom ? (
                              <span className="text-amber-800 font-bold bg-amber-100 px-1 py-0.2 rounded">{t.products.matrix.customBadge}</span>
                            ) : (
                              <span className="text-slate-400">{t.products.matrix.inheritedBadge}</span>
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
                      title={t.products.matrix.replicateInColorTooltip(corNome)}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{t.products.matrix.replicateInColorBtn}</span>
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
                {t.products.matrix.replicateSizeFooter}
              </td>
              {tamanhos.map((tam) => (
                <td key={tam} className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleReplicarColunaTamanho(tam)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold cursor-pointer transition-colors"
                    title={`Replicar ${tam}`}
                  >
                    {t.products.matrix.replicateInAllColorsBtn}
                  </button>
                </td>
              ))}
              <td className="p-2 text-center text-slate-400 font-normal">
                {t.products.matrix.replicateVerticalHint}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pop-up Modal de Confirmação Inteligente para Desbloqueio Consciente */}
      {confirmModalData && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {t.products.matrix.modalZeroStockTitle}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t.products.matrix.modalZeroStockDesc(confirmModalData.corNome, confirmModalData.tam, confirmModalData.existsInGrade)}
                </p>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 mt-2 text-[11px] text-amber-900">
                  {t.products.matrix.modalZeroStockWhy} <strong>{t.products.matrix.modalZeroStockReason}</strong>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t.products.matrix.modalZeroStockQuestion}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                {t.products.matrix.modalCancelBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  const k = `${confirmModalData.corNome}_${confirmModalData.tam}`;
                  setUnlockedCells((prev) => new Set([...prev, k]));
                  setConfirmModalData(null);
                  onFeedback?.(t.products.matrix.toastUnlocked(confirmModalData.corNome, confirmModalData.tam));
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{t.products.matrix.modalConfirmUnlockBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
