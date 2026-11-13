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
  ArrowRight,
  Filter,
  Check,
  ShoppingBag
} from 'lucide-react';
import {
  AdminProductItem,
  AdminCategoryFull,
  toggleProductPromotionalFlag,
  bulkUpdatePromotionalFlags,
  bulkUpdateProductCategory,
  ColecaoLojaItem,
  getColecoesLoja
} from '@/lib/admin';
import { useAdminI18n } from '@/context/AdminI18nContext';

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

export type CollectionTab = 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas' | 'categorias';

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
  const { formatCurrency, t } = useAdminI18n();
  const [activeTab, setActiveTab] = useState<CollectionTab>(initialTab || 'destaque');
  // Modo de exibição: 'current' (peças na seção) | 'add_catalog' (navegador de catálogo para adicionar)
  const [viewMode, setViewMode] = useState<'current' | 'add_catalog'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('todos');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>(
    initialCategoryId || categoriesList[0]?.id || ''
  );
  // Seleção de peças na aba 'current' (para remoção em lote)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  // Seleção de peças na aba 'add_catalog' (para inclusão em lote)
  const [selectedAddProductIds, setSelectedAddProductIds] = useState<Set<string>>(new Set());

  // Coleções configuradas pelo lojista
  const [colecoesLoja, setColecoesLoja] = useState<ColecaoLojaItem[]>([]);

  React.useEffect(() => {
    if (!isOpen || !tenantId) return;
    let isMounted = true;
    getColecoesLoja(tenantId)
      .then((cols) => {
        if (isMounted) setColecoesLoja(cols);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen, tenantId]);

  const colLancamentos = useMemo(() => colecoesLoja.find((c) => c.id === 'base-lancamentos' || c.slug === 'lancamentos-2026'), [colecoesLoja]);
  const colMaisVendidos = useMemo(() => colecoesLoja.find((c) => c.id === 'base-mais-vendidos' || c.slug === 'mais-vendidos'), [colecoesLoja]);
  const colOutlet = useMemo(() => colecoesLoja.find((c) => c.id === 'base-outlet' || c.slug === 'outlet-bazar'), [colecoesLoja]);
  const colUltimasPecas = useMemo(() => colecoesLoja.find((c) => c.id === 'base-ultimas-pecas' || c.slug === 'ultimas-pecas'), [colecoesLoja]);

  const tabTitles: Record<CollectionTab, { title: string; subtitle: string; label: string }> = useMemo(() => ({
    destaque: {
      title: colLancamentos?.nome ? `🌟 ${colLancamentos.nome}` : t.products.collectionsModal.tabFeatured,
      subtitle: colLancamentos?.descricao || t.products.collectionsModal.featuredDesc,
      label: colLancamentos?.nome || t.products.collectionsModal.tabFeatured.replace(/^🌟\s*/, '')
    },
    mais_vendido: {
      title: colMaisVendidos?.nome ? `🔥 ${colMaisVendidos.nome}` : t.products.collectionsModal.tabBestSellers,
      subtitle: colMaisVendidos?.descricao || t.products.collectionsModal.bestSellersDesc,
      label: colMaisVendidos?.nome || t.products.collectionsModal.tabBestSellers.replace(/^🔥\s*/, '')
    },
    outlet: {
      title: colOutlet?.nome ? `🏷️ ${colOutlet.nome}` : t.products.collectionsModal.tabOutlet,
      subtitle: colOutlet?.descricao || t.products.collectionsModal.outletDesc,
      label: colOutlet?.nome || t.products.collectionsModal.tabOutlet.replace(/^🏷️\s*/, '')
    },
    ultimas_pecas: {
      title: colUltimasPecas?.nome ? `⏳ ${colUltimasPecas.nome}` : t.products.collectionsModal.tabLastPieces,
      subtitle: colUltimasPecas?.descricao || t.products.collectionsModal.lastPiecesDesc,
      label: colUltimasPecas?.nome || t.products.collectionsModal.tabLastPieces.replace(/^⏳\s*/, '')
    },
    categorias: {
      title: t.products.collectionsModal.tabCategories,
      subtitle: t.products.collectionsModal.categoriesDesc,
      label: t.products.collectionsModal.tabCategories.replace(/^📁\s*/, '')
    }
  }), [t, colLancamentos, colMaisVendidos, colOutlet, colUltimasPecas]);

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

  // Produtos candidatos do catálogo completo disponíveis para adicionar (que NÃO estão nesta seção)
  const candidateProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => !p.lixeira && !p.arquivado)
      .filter((p) => {
        if (activeTab === 'categorias') {
          return p.categoria_id !== selectedCatId;
        }
        const flag = currentTabCfg.flag;
        if (!flag) return false;
        return !p[flag];
      })
      .filter((p) => {
        if (catalogCategoryFilter !== 'todos' && p.categoria_id !== catalogCategoryFilter) {
          return false;
        }
        if (!query) return true;
        const nome = (p.nome || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        const cat = (p.categoria_nome || '').toLowerCase();
        return nome.includes(query) || slug.includes(query) || cat.includes(query);
      });
  }, [products, activeTab, currentTabCfg.flag, selectedCatId, searchQuery, catalogCategoryFilter]);

  // Ação de alternar flag individualmente em uma peça (Multisseção com 1 clique)
  const handleToggleProductSectionFlag = async (
    product: AdminProductItem,
    flag: 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas'
  ) => {
    const nextVal = !product[flag];
    setIsProcessingId(`${product.id}_${flag}`);
    try {
      const res = await toggleProductPromotionalFlag(product.id, flag, nextVal);
      if (res.success) {
        const updated = products.map((p) =>
          p.id === product.id ? { ...p, [flag]: nextVal } : p
        );
        notifyUpdated(updated);
        const flagName =
          flag === 'destaque'
            ? 'Lançamentos'
            : flag === 'mais_vendido'
            ? 'Mais Vendidos'
            : flag === 'outlet'
            ? 'Outlet'
            : 'Últimas Peças';
        showToast(
          nextVal
            ? `"${product.nome}" incluído em ${flagName}!`
            : `"${product.nome}" removido de ${flagName}.`
        );
      } else {
        showToast(res.error || 'Erro ao atualizar flag.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Ação de adicionar produto individual à coleção ativa
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
          showToast(`"${product.nome}" adicionado à categoria ${targetCat?.nome || ''}!`);
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

  // Ação em massa: adicionar todas as peças selecionadas à coleção ativa
  const handleBulkAddProducts = async () => {
    const ids = Array.from(selectedAddProductIds);
    if (ids.length === 0) return;

    setIsProcessingId('bulk_add');
    try {
      if (activeTab === 'categorias') {
        const targetCat = categoriesList.find((c) => c.id === selectedCatId);
        const res = await bulkUpdateProductCategory(ids, selectedCatId, targetCat?.nome);
        if (res.success) {
          const idSet = new Set(ids);
          const updated = products.map((p) =>
            idSet.has(p.id) ? { ...p, categoria_id: selectedCatId, categoria_nome: targetCat?.nome || p.categoria_nome } : p
          );
          notifyUpdated(updated);
          showToast(`${ids.length} peças adicionadas à categoria ${targetCat?.nome || ''}!`);
          setSelectedAddProductIds(new Set());
          setViewMode('current');
        } else {
          showToast(res.error || 'Erro ao adicionar peças em lote.', 'error');
        }
      } else {
        const flag = currentTabCfg.flag!;
        const res = await bulkUpdatePromotionalFlags(ids, flag, true);
        if (res.success) {
          const idSet = new Set(ids);
          const updated = products.map((p) =>
            idSet.has(p.id) ? { ...p, [flag]: true } : p
          );
          notifyUpdated(updated);
          showToast(`${ids.length} peças adicionadas a ${currentTabCfg.title}!`);
          setSelectedAddProductIds(new Set());
          setViewMode('current');
        } else {
          showToast(res.error || 'Erro ao adicionar peças em lote.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Ação de remover produto individual da coleção ativa
  const handleRemoveProduct = async (product: AdminProductItem) => {
    setIsProcessingId(product.id);
    try {
      if (activeTab === 'categorias') {
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

    setIsProcessingId('bulk_remove');
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

  const handleToggleSelectAllCurrent = () => {
    if (selectedProductIds.size === currentCollectionProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(currentCollectionProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelectCurrentProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllCandidates = () => {
    if (selectedAddProductIds.size === candidateProducts.length) {
      setSelectedAddProductIds(new Set());
    } else {
      setSelectedAddProductIds(new Set(candidateProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelectCandidateProduct = (id: string) => {
    setSelectedAddProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-serif-luxury text-amber-400 flex items-center gap-2">
                <span>{t.products.collectionsModal.title}</span>
              </h3>
              <p className="text-xs text-slate-300">
                {t.products.collectionsModal.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin/loja/colecoes/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
              title="Gerenciar e criar novas coleções personalizadas"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Coleções & Curadoria ↗</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={t.products.collectionsModal.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                  setViewMode('current');
                  setSearchQuery('');
                  setSelectedProductIds(new Set());
                  setSelectedAddProductIds(new Set());
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border-amber-600 shadow-2xs -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.color : 'text-slate-400'}`} />
                <span>{tabTitles[tabKey]?.label || cfg.title.split(' ')[1] || cfg.title}</span>
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

        {/* Sub-Cabeçalho com Seletor de Categoria e Alternador de Modo (Peças Atuais vs Adicionar do Catálogo) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>{tabTitles[activeTab]?.title || currentTabCfg.title}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({t.products.collectionsModal.curatedCount(currentCollectionProducts.length)})
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{tabTitles[activeTab]?.subtitle || currentTabCfg.subtitle}</p>
            </div>

            {/* Seletor de Categoria se for a aba de categorias */}
            {activeTab === 'categorias' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-700">{t.products.batchModal.categoryLabel}:</span>
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    setSelectedCatId(e.target.value);
                    setSelectedProductIds(new Set());
                    setSelectedAddProductIds(new Set());
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 cursor-pointer shadow-2xs"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} ({products.filter((p) => p.categoria_id === cat.id && !p.lixeira && !p.arquivado).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Alternador Proeminente de Visão: Peças Nesta Seção vs + Adicionar Peças do Catálogo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
              <button
                type="button"
                onClick={() => setViewMode('current')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'current'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.products.collectionsModal.viewModeCurrent(currentCollectionProducts.length)}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('add_catalog')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'add_catalog'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.products.collectionsModal.viewModeAdd(candidateProducts.length)}</span>
              </button>
            </div>

            {/* Barra de Filtro e Busca */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    viewMode === 'add_catalog'
                      ? t.products.collectionsModal.filterAddPlaceholder
                      : t.products.collectionsModal.filterCurrentPlaceholder
                  }
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {viewMode === 'add_catalog' && categoriesList.length > 0 && (
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer shrink-0"
                >
                  <option value="todos">{t.products.collectionsModal.allCategoriesOption}</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: PEÇAS NESTA SEÇÃO (Visualização, Reordenação & Remoção em Lote)   */}
        {/* ========================================================================= */}
        {viewMode === 'current' && (
          <>
            {/* Barra de Seleção e Ações em Lote de Remoção */}
            {currentCollectionProducts.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={
                      selectedProductIds.size > 0 &&
                      selectedProductIds.size === currentCollectionProducts.length
                    }
                    onChange={handleToggleSelectAllCurrent}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>
                    {selectedProductIds.size > 0
                      ? t.products.collectionsModal.selectedCurrentCount(selectedProductIds.size)
                      : t.products.collectionsModal.selectAllCurrent}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  {selectedProductIds.size > 0 && (
                    <button
                      type="button"
                      disabled={isProcessingId === 'bulk_remove'}
                      onClick={handleBulkRemoveProducts}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {isProcessingId === 'bulk_remove'
                          ? t.products.collectionsModal.removingBtn
                          : t.products.collectionsModal.removeSelectedBtn(selectedProductIds.size)}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewMode('add_catalog')}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.products.collectionsModal.addToShowcaseBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Peças Atuais na Coleção (com Scroll) */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
              {currentCollectionProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{t.products.collectionsModal.emptyShowcaseTitle}</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      {t.products.collectionsModal.emptyShowcaseDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('add_catalog')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.products.collectionsModal.openCatalogBtn}</span>
                  </button>
                </div>
              ) : (
                currentCollectionProducts
                  .filter((p) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return (
                      (p.nome || '').toLowerCase().includes(q) ||
                      (p.slug || '').toLowerCase().includes(q) ||
                      (p.categoria_nome || '').toLowerCase().includes(q)
                    );
                  })
                  .map((product) => (
                    <div
                      key={product.id}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all"
                    >
                      {/* Checkbox de Seleção */}
                      <div className="flex items-center shrink-0 pr-1">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => handleToggleSelectCurrentProduct(product.id)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Lado Esquerdo: Miniatura da Foto e Informações */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                          {product.foto_principal ? (
                            <Image
                              src={product.foto_principal}
                              alt={product.nome}
                              fill
                              unoptimized
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                              Sem foto
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {product.categoria_nome || 'Sem Categoria'}
                            </span>
                            {!product.ativo && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                {t.products.lifecycle.paused}
                              </span>
                            )}
                          </div>

                          <h5
                            className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5"
                            title={product.nome}
                          >
                            {product.nome}
                          </h5>

                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {t.products.quickPriceModal.salePriceLabel}:{' '}
                            <span className="font-bold text-slate-800">
                              {formatCurrency(Number(product.preco || 0))}
                            </span>{' '}
                            • {t.products.table.thStock}:{' '}
                            <span
                              className={`font-bold ${
                                product.estoque_total > 5 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {product.estoque_total} un
                            </span>
                          </p>

                          {/* Chips de Multisseção com 1 Clique */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-slate-400 mr-1">
                              {t.products.collectionsModal.alsoInLabel}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleProductSectionFlag(product, 'destaque')}
                              disabled={isProcessingId === `${product.id}_destaque`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                product.destaque
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={t.products.quickPriceModal.flagFeaturedLabel}
                            >
                              <span>🌟 {tabTitles.destaque.label}</span>
                              {product.destaque && <Check className="w-2.5 h-2.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProductSectionFlag(product, 'mais_vendido')}
                              disabled={isProcessingId === `${product.id}_mais_vendido`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                product.mais_vendido
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={t.products.quickPriceModal.flagBestSellerLabel}
                            >
                              <span>🔥 {tabTitles.mais_vendido.label}</span>
                              {product.mais_vendido && <Check className="w-2.5 h-2.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProductSectionFlag(product, 'outlet')}
                              disabled={isProcessingId === `${product.id}_outlet`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                product.outlet
                                  ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={t.products.quickPriceModal.flagOutletLabel}
                            >
                              <span>🏷️ {tabTitles.outlet.label}</span>
                              {product.outlet && <Check className="w-2.5 h-2.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProductSectionFlag(product, 'ultimas_pecas')}
                              disabled={isProcessingId === `${product.id}_ultimas_pecas`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                product.ultimas_pecas
                                  ? 'bg-orange-100 text-orange-900 border-orange-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={t.products.quickPriceModal.flagLastPiecesLabel}
                            >
                              <span>⏳ {tabTitles.ultimas_pecas.label}</span>
                              {product.ultimas_pecas && <Check className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Ações / Transferir Categoria ou Remover */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {activeTab === 'categorias' && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 text-[11px]">{t.products.collectionsModal.moveCategoryLabel}</span>
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
                          title={t.products.collectionsModal.removeSingleBtn}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">{t.products.collectionsModal.removeSingleBtn}</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: ADICIONAR PEÇAS DO CATÁLOGO (Navegador com Seleção em Lote)       */}
        {/* ========================================================================= */}
        {viewMode === 'add_catalog' && (
          <>
            {/* Barra de Seleção e Ações em Lote de Inclusão */}
            <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={
                    selectedAddProductIds.size > 0 &&
                    selectedAddProductIds.size === candidateProducts.length
                  }
                  onChange={handleToggleSelectAllCandidates}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>
                  {selectedAddProductIds.size > 0
                    ? `${selectedAddProductIds.size} / ${candidateProducts.length}`
                    : t.products.collectionsModal.selectAllCandidates(candidateProducts.length)}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedAddProductIds.size === 0 || isProcessingId === 'bulk_add'}
                  onClick={handleBulkAddProducts}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isProcessingId === 'bulk_add'
                      ? t.products.collectionsModal.insertingBtn
                      : selectedAddProductIds.size > 0
                      ? t.products.collectionsModal.insertSelectedBtn(selectedAddProductIds.size)
                      : t.products.collectionsModal.insertSingleBtn}
                  </span>
                </button>
              </div>
            </div>

            {/* Grid / Lista de Peças Candidatas do Catálogo */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
              {candidateProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-slate-700 text-sm">{t.products.collectionsModal.emptyCandidatesTitle}</h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {t.products.collectionsModal.emptyCandidatesDesc}
                  </p>
                </div>
              ) : (
                candidateProducts.map((p) => {
                  const isSelected = selectedAddProductIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleSelectCandidateProduct(p.id)}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center shrink-0 pr-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectCandidateProduct(p.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Info da Peça */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                          {p.foto_principal ? (
                            <Image
                              src={p.foto_principal}
                              alt={p.nome}
                              fill
                              unoptimized
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                              Sem foto
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {p.categoria_nome || 'Sem Categoria'}
                            </span>
                            {p.destaque && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                🌟 {tabTitles.destaque.label}
                              </span>
                            )}
                            {p.mais_vendido && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                🔥 {tabTitles.mais_vendido.label}
                              </span>
                            )}
                            {p.outlet && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 border border-rose-200">
                                🏷️ {tabTitles.outlet.label}
                              </span>
                            )}
                            {p.ultimas_pecas && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-900 border border-orange-200">
                                ⏳ {tabTitles.ultimas_pecas.label}
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                            {p.nome}
                          </h5>

                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {t.products.quickPriceModal.salePriceLabel}:{' '}
                            <span className="font-bold text-slate-800">
                              {formatCurrency(Number(p.preco || 0))}
                            </span>{' '}
                            • {t.products.table.thStock}:{' '}
                            <span
                              className={`font-bold ${
                                p.estoque_total > 5 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {p.estoque_total} un
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Botão Individual de Adicionar com 1 Clique */}
                      <button
                        type="button"
                        disabled={isProcessingId === p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProduct(p);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 self-end sm:self-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isProcessingId === p.id ? t.products.collectionsModal.insertingBtn : t.products.collectionsModal.insertSingleBtn}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Rodapé com Dicas e Botão Concluir */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t.products.collectionsModal.footerNotice}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {viewMode === 'add_catalog' && selectedAddProductIds.size > 0 && (
              <button
                type="button"
                disabled={isProcessingId === 'bulk_add'}
                onClick={handleBulkAddProducts}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {t.products.collectionsModal.insertSelectedBtn(selectedAddProductIds.size)}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {t.products.collectionsModal.footerDoneBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
