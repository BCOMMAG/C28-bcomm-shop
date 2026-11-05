'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import {
  AdminProductItem,
  AdminCategoryFull,
  toggleProductPromotionalFlag,
  bulkUpdatePromotionalFlags,
  bulkUpdateProductCategory
} from '@/lib/admin';

interface AdminCollectionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AdminProductItem[];
  categoriesList: AdminCategoryFull[];
  initialTab?: CollectionTab;
  initialCategoryId?: string;
  tenantId?: string;
  onProductsUpdated?: (updated: AdminProductItem[]) => void;
  onUpdated?: () => void;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

type CollectionTab = 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas' | 'categorias';

const TAB_CONFIG: Record<
  CollectionTab,
  {
    title: string;
    subtitle: string;
    flag?: 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas';
    icon: any;
    color: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  destaque: {
    title: '🌟 Lançamentos Exclusivos (Destaques)',
    subtitle: 'Peças exibidas com destaque no primeiro carrossel da vitrine da Home (#lancamentos).',
    flag: 'destaque',
    icon: Sparkles,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: '🌟 Lançamento'
  },
  mais_vendido: {
    title: '🔥 Mais Vendidos & Queridinhos',
    subtitle: 'Peças em destaque na seção de maior sucesso da boutique (#mais-vendidos).',
    flag: 'mais_vendido',
    icon: Flame,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    badgeText: '🔥 Mais Vendido'
  },
  outlet: {
    title: '🏷️ Bazar & Oportunidades (Outlet)',
    subtitle: 'Peças selecionadas com condições especiais de liquidação e desconto (#outlet).',
    flag: 'outlet',
    icon: Tag,
    color: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    badgeText: '🏷️ Outlet'
  },
  ultimas_pecas: {
    title: '⏳ Últimas Peças & Escassez',
    subtitle: 'Peças com estoque limitado que compõem o carrossel de últimas unidades (#ultimas-pecas).',
    flag: 'ultimas_pecas',
    icon: Clock,
    color: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    badgeText: '⏳ Últimas Peças'
  },
  categorias: {
    title: '📁 Categorias Principais do Catálogo',
    subtitle: 'Organize a taxonomia das peças da loja (Tricots, Vestidos, Alfaiataria, Linho Nobre, etc.).',
    icon: FolderOpen,
    color: 'text-sky-600',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: '📁 Categoria'
  }
};

export function AdminCollectionsManagerModal({
  isOpen,
  onClose,
  products,
  categoriesList,
  initialTab,
  initialCategoryId,
  tenantId,
  onProductsUpdated,
  onUpdated,
  onToast
}: AdminCollectionsManagerModalProps) {
  const [activeTab, setActiveTab] = useState<CollectionTab>(initialTab || 'destaque');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>(
    initialCategoryId || categoriesList[0]?.id || ''
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const notifyUpdated = (updated: AdminProductItem[]) => {
    if (onProductsUpdated) onProductsUpdated(updated);
    if (onUpdated) onUpdated();
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (onToast) onToast(msg, type);
  };

  const currentTabCfg = TAB_CONFIG[activeTab];

  // Produtos que atualmente pertencem à coleção ativa
  const currentCollectionProducts = useMemo(() => {
    if (activeTab === 'categorias') {
      if (!selectedCatId) return [];
      return products.filter((p) => p.categoria_id === selectedCatId && !p.lixeira && !p.arquivado);
    }
    const flag = currentTabCfg.flag;
    if (!flag) return [];
    return products.filter((p) => Boolean(p[flag]) && !p.lixeira && !p.arquivado);
  }, [products, activeTab, selectedCatId, currentTabCfg.flag]);

  // Sugestões de produtos para adicionar (que NÃO estão na coleção ativa)
  const candidateProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => !p.lixeira && !p.arquivado)
      .filter((p) => {
        if (activeTab === 'categorias') {
          // Só sugere os que NÃO são da categoria selecionada
          return p.categoria_id !== selectedCatId;
        }
        const flag = currentTabCfg.flag;
        if (!flag) return false;
        // Só sugere os que NÃO têm a flag marcada
        return !p[flag];
      })
      .filter((p) => {
        const nome = (p.nome || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        const cat = (p.categoria_nome || '').toLowerCase();
        return nome.includes(query) || slug.includes(query) || cat.includes(query);
      })
      .slice(0, 8);
  }, [products, activeTab, currentTabCfg.flag, selectedCatId, searchQuery]);

  // Ação de adicionar produto à coleção ativa
  const handleAddProduct = async (product: AdminProductItem) => {
    setIsProcessingId(product.id);
    try {
      if (activeTab === 'categorias') {
        const targetCat = categoriesList.find((c) => c.id === selectedCatId);
        const res = await bulkUpdateProductCategory([product.id], selectedCatId, targetCat?.nome);
        if (res.success) {
          const updated = products.map((p) =>
            p.id === product.id ? { ...p, categoria_id: selectedCatId, categoria_nome: targetCat?.nome || p.categoria_nome } : p
          );
          notifyUpdated(updated);
          showToast(`"${product.nome}" movido para a categoria ${targetCat?.nome || ''}!`);
          setSearchQuery('');
        } else {
          showToast(res.error || 'Erro ao mover produto.', 'error');
        }
      } else {
        const flag = currentTabCfg.flag!;
        const res = await toggleProductPromotionalFlag(product.id, flag, true);
        if (res.success) {
          const updated = products.map((p) =>
            p.id === product.id ? { ...p, [flag]: true } : p
          );
          notifyUpdated(updated);
          showToast(`"${product.nome}" adicionado a ${currentTabCfg.title}!`);
          setSearchQuery('');
        } else {
          showToast(res.error || 'Erro ao adicionar produto.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Ação de remover produto da coleção ativa
  const handleRemoveProduct = async (product: AdminProductItem) => {
    setIsProcessingId(product.id);
    try {
      if (activeTab === 'categorias') {
        // Remove da categoria atual (atribui nulo ou categoria geral)
        const res = await bulkUpdateProductCategory([product.id], '');
        if (res.success) {
          const updated = products.map((p) =>
            p.id === product.id ? { ...p, categoria_id: undefined, categoria_nome: undefined } : p
          );
          notifyUpdated(updated);
          showToast(`"${product.nome}" desvinculado da categoria.`);
        } else {
          showToast(res.error || 'Erro ao desvincular.', 'error');
        }
      } else {
        const flag = currentTabCfg.flag!;
        const res = await toggleProductPromotionalFlag(product.id, flag, false);
        if (res.success) {
          const updated = products.map((p) =>
            p.id === product.id ? { ...p, [flag]: false } : p
          );
          notifyUpdated(updated);
          showToast(`"${product.nome}" removido de ${currentTabCfg.title}.`);
        } else {
          showToast(res.error || 'Erro ao remover produto.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Mover produto diretamente para outra categoria a partir da tabela
  const handleMoveProductToCategory = async (productId: string, newCatId: string) => {
    setIsProcessingId(productId);
    try {
      const targetCat = categoriesList.find((c) => c.id === newCatId);
      const res = await bulkUpdateProductCategory([productId], newCatId, targetCat?.nome);
      if (res.success) {
        const updated = products.map((p) =>
          p.id === productId ? { ...p, categoria_id: newCatId, categoria_nome: targetCat?.nome || p.categoria_nome } : p
        );
        notifyUpdated(updated);
        showToast(`Peça transferida para ${targetCat?.nome || 'categoria'}!`);
      } else {
        showToast(res.error || 'Erro ao transferir categoria.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Ação em massa: remover todas as peças selecionadas da coleção ativa
  const handleBulkRemoveProducts = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    setIsProcessingId('bulk');
    try {
      if (activeTab === 'categorias') {
        const res = await bulkUpdateProductCategory(ids, '');
        if (res.success) {
          const idSet = new Set(ids);
          const updated = products.map((p) =>
            idSet.has(p.id) ? { ...p, categoria_id: undefined, categoria_nome: undefined } : p
          );
          notifyUpdated(updated);
          showToast(`${ids.length} peças desvinculadas da categoria com sucesso!`);
          setSelectedProductIds(new Set());
        } else {
          showToast(res.error || 'Erro ao remover peças em lote.', 'error');
        }
      } else {
        const flag = currentTabCfg.flag!;
        const res = await bulkUpdatePromotionalFlags(ids, flag, false);
        if (res.success) {
          const idSet = new Set(ids);
          const updated = products.map((p) =>
            idSet.has(p.id) ? { ...p, [flag]: false } : p
          );
          notifyUpdated(updated);
          showToast(`${ids.length} peças removidas de ${currentTabCfg.title}!`);
          setSelectedProductIds(new Set());
        } else {
          showToast(res.error || 'Erro ao remover peças em lote.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === currentCollectionProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(currentCollectionProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-serif-luxury text-amber-400 flex items-center gap-2">
                <span>Gestor de Vitrines, Destaques & Categorias</span>
              </h3>
              <p className="text-xs text-slate-300">
                Adicione ou remova peças das seções da Home com 1 clique. As alterações sincronizam instantaneamente na vitrine.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores de Vitrine / Coleção */}
        <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-slate-200 bg-slate-50/80 overflow-x-auto">
          {(Object.keys(TAB_CONFIG) as CollectionTab[]).map((tabKey) => {
            const cfg = TAB_CONFIG[tabKey];
            const isActive = activeTab === tabKey;
            const Icon = cfg.icon;

            // Contagem em tempo real
            let count = 0;
            if (tabKey === 'categorias') {
              count = categoriesList.length;
            } else if (cfg.flag) {
              count = products.filter((p) => Boolean(p[cfg.flag!]) && !p.lixeira && !p.arquivado).length;
            }

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border-amber-600 shadow-2xs -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.color : 'text-slate-400'}`} />
                <span>{cfg.title.split(' ')[1] || cfg.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Cabeçalho com Explicação da Aba e Campo de Busca para Adicionar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>{currentTabCfg.title}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({currentCollectionProducts.length} peças nesta seleção)
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{currentTabCfg.subtitle}</p>
            </div>

            {/* Seletor de Categoria se for a aba de categorias */}
            {activeTab === 'categorias' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-700">Categoria:</span>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} ({products.filter((p) => p.categoria_id === cat.id).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Campo de Busca Rápida para Adicionar Peça com 1 Clique */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'categorias'
                    ? 'Buscar produto para incluir nesta categoria...'
                    : `Buscar peça no catálogo para adicionar a ${currentTabCfg.title.split(' ')[1] || 'esta seção'}...`
                }
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown de Sugestões / Resultados da Busca */}
            {candidateProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto animate-in fade-in duration-150">
                <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Resultados encontrados ({candidateProducts.length}) — Clique para adicionar:
                </div>
                {candidateProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-amber-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative w-10 h-12 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200">
                        {p.foto_principal ? (
                          <Image src={p.foto_principal} alt={p.nome} fill unoptimized sizes="40px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">Sem foto</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-900 block truncate">{p.nome}</span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {p.categoria_nome || 'Sem Categoria'} • R$ {Number(p.preco || 0).toFixed(2).replace('.', ',')} • Estoque: {p.estoque_total || 0} un
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingId === p.id}
                      onClick={() => handleAddProduct(p)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isProcessingId === p.id ? 'Adicionando...' : 'Adicionar'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barra de Seleção e Ações em Lote */}
        {currentCollectionProducts.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={selectedProductIds.size > 0 && selectedProductIds.size === currentCollectionProducts.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>
                {selectedProductIds.size > 0
                  ? `${selectedProductIds.size} peça(s) selecionada(s)`
                  : 'Selecionar todas as peças desta seção'}
              </span>
            </label>

            {selectedProductIds.size > 0 && (
              <button
                type="button"
                disabled={isProcessingId === 'bulk'}
                onClick={handleBulkRemoveProducts}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isProcessingId === 'bulk'
                    ? 'Removendo em lote...'
                    : `Remover ${selectedProductIds.size} selecionadas`}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Lista de Peças Atuais na Coleção (com Scroll) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {currentCollectionProducts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-slate-700 text-sm">Nenhuma peça nesta seção no momento</h5>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use o campo de busca acima para pesquisar e adicionar peças do catálogo com 1 clique para compor esta vitrine.
              </p>
            </div>
          ) : (
            currentCollectionProducts.map((product) => (
              <div
                key={product.id}
                className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all"
              >
                {/* Checkbox de Seleção */}
                <div className="flex items-center shrink-0 pr-1">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={() => handleToggleSelectProduct(product.id)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Lado Esquerdo: Miniatura da Foto e Informações */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                    {product.foto_principal ? (
                      <Image src={product.foto_principal} alt={product.nome} fill unoptimized sizes="48px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">Sem foto</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {product.categoria_nome || 'Sem Categoria'}
                      </span>
                      {activeTab !== 'categorias' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentTabCfg.badgeBg}`}>
                          {currentTabCfg.badgeText}
                        </span>
                      )}
                      {!product.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          Pausada
                        </span>
                      )}
                    </div>

                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5" title={product.nome}>
                      {product.nome}
                    </h5>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Preço: <span className="font-bold text-slate-800">R$ {Number(product.preco || 0).toFixed(2).replace('.', ',')}</span> • Estoque: <span className={`font-bold ${product.estoque_total > 5 ? 'text-emerald-700' : 'text-amber-700'}`}>{product.estoque_total} un</span>
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Ações / Transferir Categoria ou Remover */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Se for a aba de categorias, permite mover para outra categoria facilmente */}
                  {activeTab === 'categorias' && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 text-[11px]">Mover:</span>
                      <select
                        value={product.categoria_id || ''}
                        disabled={isProcessingId === product.id}
                        onChange={(e) => handleMoveProductToCategory(product.id, e.target.value)}
                        className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        {categoriesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isProcessingId === product.id}
                    onClick={() => handleRemoveProduct(product)}
                    className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                    title={`Remover de ${currentTabCfg.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Remover</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Dicas e Botão Concluir */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Todas as alterações são gravadas em tempo real no banco e refletem na vitrine pública.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer self-end sm:self-auto"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

