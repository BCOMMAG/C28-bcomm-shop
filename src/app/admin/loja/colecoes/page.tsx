'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ShoppingBag,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Home,
  CheckSquare,
  Square,
  ChevronRight,
  Info
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID, formatCurrency } from '@/lib/products';
import {
  ColecaoLojaItem,
  getColecoesLoja,
  saveColecaoLoja,
  deleteColecaoLoja,
  reorderColecoesLoja,
  bulkUpdateProdutosColecao,
  slugifyColecao,
  AdminProductItem,
  getAdminProducts,
  AdminCategoryFull,
  getAdminCategoriesFull
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function ColecoesPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const storeSlug = currentTenant?.slug || 'leidy';

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [colecoes, setColecoes] = useState<ColecaoLojaItem[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryFull[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativas' | 'pausadas' | 'home'>('todos');

  // Edição inline de nome rápida
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState('');

  // Modal de Criação / Edição de Detalhes
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ColecaoLojaItem | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formBadgeTexto, setFormBadgeTexto] = useState('');
  const [formBadgeCor, setFormBadgeCor] = useState('#C5A059');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formExibirNaHome, setFormExibirNaHome] = useState(false);
  const [formAtivo, setFormAtivo] = useState(true);

  // Modal / Gaveta de Curadoria de Peças
  const [isCuratingModalOpen, setIsCuratingModalOpen] = useState(false);
  const [curatingCollection, setCuratingCollection] = useState<ColecaoLojaItem | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');

  // Toast Feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [colData, prodsData, catsData] = await Promise.all([
        getColecoesLoja(tenantId),
        getAdminProducts(tenantId).catch(() => []),
        getAdminCategoriesFull(tenantId).catch(() => [])
      ]);
      setColecoes(colData);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Erro ao carregar coleções:', err);
      showToast('Falha ao carregar coleções da loja.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // KPIs
  const kpis = useMemo(() => {
    const total = colecoes.length;
    const ativas = colecoes.filter((c) => c.ativo).length;
    const naHome = colecoes.filter((c) => c.ativo && c.exibir_na_home).length;
    const totalPecas = new Set(colecoes.flatMap((c) => c.produto_ids || [])).size;
    return { total, ativas, naHome, totalPecas };
  }, [colecoes]);

  // Lista filtrada para busca
  const filteredColecoes = useMemo(() => {
    return colecoes.filter((col) => {
      const matchSearch =
        col.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (col.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'ativas') return col.ativo;
      if (statusFilter === 'pausadas') return !col.ativo;
      if (statusFilter === 'home') return col.ativo && col.exibir_na_home;

      return true;
    });
  }, [colecoes, searchQuery, statusFilter]);

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setEditingCollection(null);
    setFormNome('');
    setFormSlug('');
    setFormDescricao('');
    setFormBadgeTexto('NOVO');
    setFormBadgeCor('#C5A059');
    setFormBannerUrl('');
    setFormExibirNaHome(true);
    setFormAtivo(true);
    setIsDetailModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (col: ColecaoLojaItem) => {
    setEditingCollection(col);
    setFormNome(col.nome);
    setFormSlug(col.slug);
    setFormDescricao(col.descricao || '');
    setFormBadgeTexto(col.badge_texto || '');
    setFormBadgeCor(col.badge_cor || '#C5A059');
    setFormBannerUrl(col.banner_url || '');
    setFormExibirNaHome(Boolean(col.exibir_na_home));
    setFormAtivo(Boolean(col.ativo));
    setIsDetailModalOpen(true);
  };

  // Salvar Modal de Criação / Edição
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      showToast('O nome da coleção é obrigatório.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveColecaoLoja(tenantId, {
        ...(editingCollection ? { id: editingCollection.id, produto_ids: editingCollection.produto_ids, is_sistema: editingCollection.is_sistema } : {}),
        nome: formNome.trim(),
        slug: formSlug.trim() ? slugifyColecao(formSlug) : slugifyColecao(formNome),
        descricao: formDescricao.trim(),
        badge_texto: formBadgeTexto.trim(),
        badge_cor: formBadgeCor,
        banner_url: formBannerUrl.trim(),
        exibir_na_home: formExibirNaHome,
        ativo: formAtivo
      });

      if (res.success && res.colecao) {
        showToast(editingCollection ? 'Coleção atualizada com sucesso!' : 'Nova coleção criada com sucesso!');
        setIsDetailModalOpen(false);
        loadData();
      } else {
        showToast(res.error || 'Erro ao salvar coleção.', 'error');
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Edição rápida de nome inline
  const handleStartInlineEdit = (col: ColecaoLojaItem) => {
    setInlineEditingId(col.id);
    setInlineNameValue(col.nome);
  };

  const handleSaveInlineEdit = async (col: ColecaoLojaItem) => {
    if (!inlineNameValue.trim() || inlineNameValue.trim() === col.nome) {
      setInlineEditingId(null);
      return;
    }

    try {
      const res = await saveColecaoLoja(tenantId, {
        ...col,
        nome: inlineNameValue.trim()
      });

      if (res.success) {
        showToast(`Nome alterado para "${inlineNameValue.trim()}"!`);
        setColecoes((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, nome: inlineNameValue.trim() } : c))
        );
      } else {
        showToast(res.error || 'Erro ao alterar nome.', 'error');
      }
    } catch {
      showToast('Falha ao salvar alteração.', 'error');
    } finally {
      setInlineEditingId(null);
    }
  };

  // Alternar Ativo / Pausado
  const handleToggleAtivo = async (col: ColecaoLojaItem) => {
    const novoStatus = !col.ativo;
    try {
      const res = await saveColecaoLoja(tenantId, {
        ...col,
        ativo: novoStatus
      });

      if (res.success) {
        showToast(`Coleção ${novoStatus ? 'ativada' : 'pausada'} com sucesso!`);
        setColecoes((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, ativo: novoStatus } : c))
        );
      } else {
        showToast(res.error || 'Erro ao atualizar status.', 'error');
      }
    } catch {
      showToast('Falha ao alterar status.', 'error');
    }
  };

  // Alternar Exibir na Home
  const handleToggleHome = async (col: ColecaoLojaItem) => {
    const novoHome = !col.exibir_na_home;
    try {
      const res = await saveColecaoLoja(tenantId, {
        ...col,
        exibir_na_home: novoHome
      });

      if (res.success) {
        showToast(novoHome ? 'Coleção incluída na Página Inicial!' : 'Coleção removida da Página Inicial!');
        setColecoes((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, exibir_na_home: novoHome } : c))
        );
      } else {
        showToast(res.error || 'Erro ao atualizar exibição na Home.', 'error');
      }
    } catch {
      showToast('Falha ao alterar exibição.', 'error');
    }
  };

  // Duplicar Coleção
  const handleDuplicate = async (col: ColecaoLojaItem) => {
    try {
      const res = await saveColecaoLoja(tenantId, {
        nome: `${col.nome} (Cópia)`,
        slug: `${col.slug}-copia`,
        descricao: col.descricao,
        badge_texto: col.badge_texto,
        badge_cor: col.badge_cor,
        banner_url: col.banner_url,
        ativo: true,
        exibir_na_home: false,
        produto_ids: [...(col.produto_ids || [])]
      });

      if (res.success) {
        showToast('Coleção duplicada com sucesso!');
        loadData();
      } else {
        showToast(res.error || 'Erro ao duplicar coleção.', 'error');
      }
    } catch {
      showToast('Falha ao duplicar coleção.', 'error');
    }
  };

  // Excluir Coleção
  const handleDelete = async (col: ColecaoLojaItem) => {
    if (col.is_sistema) {
      showToast('Coleções base do sistema não podem ser excluídas. Você pode renomeá-las ou pausá-las livremente.', 'error');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a coleção "${col.nome}"? As peças não serão excluídas do catálogo, apenas desvinculadas desta coleção.`)) {
      return;
    }

    try {
      const res = await deleteColecaoLoja(tenantId, col.id);
      if (res.success) {
        showToast('Coleção excluída com sucesso!');
        setColecoes((prev) => prev.filter((c) => c.id !== col.id));
      } else {
        showToast(res.error || 'Erro ao excluir coleção.', 'error');
      }
    } catch {
      showToast('Falha ao excluir coleção.', 'error');
    }
  };

  // Reordenação
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= colecoes.length) return;

    const listCopy = [...colecoes];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    setColecoes(listCopy);
    try {
      await reorderColecoesLoja(tenantId, listCopy.map((c) => c.id));
      showToast('Ordem das coleções atualizada!');
    } catch {
      showToast('Falha ao salvar nova ordenação.', 'error');
      loadData();
    }
  };

  // Abrir Gaveta de Curadoria de Peças
  const handleOpenCurating = (col: ColecaoLojaItem) => {
    setCuratingCollection(col);
    setSelectedProductIds(new Set(col.produto_ids || []));
    setProductSearch('');
    setCategoryFilter('todas');
    setIsCuratingModalOpen(true);
  };

  // Salvar Curadoria
  const handleSaveCurating = async () => {
    if (!curatingCollection) return;

    setIsSaving(true);
    try {
      const idsArray = Array.from(selectedProductIds);
      const res = await bulkUpdateProdutosColecao(tenantId, curatingCollection.id, idsArray, 'substituir');

      if (res.success) {
        showToast(`Curadoria salva! ${idsArray.length} peças vinculadas à coleção.`);
        setColecoes((prev) =>
          prev.map((c) => (c.id === curatingCollection.id ? { ...c, produto_ids: idsArray } : c))
        );
        setIsCuratingModalOpen(false);
      } else {
        showToast(res.error || 'Erro ao salvar peças da coleção.', 'error');
      }
    } catch {
      showToast('Falha ao salvar curadoria.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Produtos filtrados na gaveta de curadoria
  const filteredProductsForCurating = useMemo(() => {
    return products.filter((p) => {
      if (p.lixeira || p.arquivado) return false;
      const matchSearch =
        p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(productSearch.toLowerCase());
      if (!matchSearch) return false;

      if (categoryFilter !== 'todas' && p.categoria_id !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [products, productSearch, categoryFilter]);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllCurating = () => {
    const next = new Set(selectedProductIds);
    filteredProductsForCurating.forEach((p) => next.add(p.id));
    setSelectedProductIds(next);
  };

  const handleUnselectAllCurating = () => {
    const next = new Set(selectedProductIds);
    filteredProductsForCurating.forEach((p) => next.delete(p.id));
    setSelectedProductIds(next);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notificação */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-fade-in transition-all',
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
          )}
        >
          {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Coleções & Curadoria Editorial
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                  Autonomia do Lojista
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Crie cápsulas temáticas, renomeie coleções livremente, defina destaques da Home e monte carrosséis editoriais exclusivos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Coleção</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS / KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total de Coleções</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{kpis.total}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Cápsulas e seções</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Coleções Ativas</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{kpis.ativas}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Visíveis na loja</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Na Página Inicial (Home)</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{kpis.naHome}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Com carrossel temático</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider block">Peças em Coleções</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{kpis.totalPecas}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Produtos com curadoria</span>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar coleção por nome, slug ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'todos', label: 'Todas' },
              { id: 'ativas', label: 'Ativas' },
              { id: 'pausadas', label: 'Pausadas' },
              { id: 'home', label: 'Na Home' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE COLEÇÕES */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs text-slate-500">Carregando coleções e curadoria...</p>
        </div>
      ) : filteredColecoes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma coleção encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua busca.'
              : 'Clique em "Criar Nova Coleção" para começar sua primeira cápsula.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredColecoes.map((col, index) => {
            const isEditingThis = inlineEditingId === col.id;
            const pecasCount = (col.produto_ids || []).length;

            return (
              <div
                key={col.id}
                className={cn(
                  'bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-xs',
                  !col.ativo
                    ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* LADO ESQUERDO: Ordenação, Badge, Nome e Detalhes */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Botões de Ordenação Vertical */}
                    <div className="flex flex-col gap-0.5 shrink-0 pt-0.5 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Subir posição na vitrine"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === filteredColecoes.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Descer posição na vitrine"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Badge da Coleção */}
                        {col.badge_texto && (
                          <span
                            style={{ backgroundColor: col.badge_cor || '#C5A059' }}
                            className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded shadow-2xs uppercase tracking-wider shrink-0"
                          >
                            {col.badge_texto}
                          </span>
                        )}

                        {/* Indicação se é do Sistema */}
                        {col.is_sistema && (
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            BASE DA LOJA
                          </span>
                        )}

                        {/* Status na Home */}
                        {col.exibir_na_home && col.ativo ? (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Home className="w-3 h-3" /> Na Página Inicial
                          </span>
                        ) : null}

                        {/* Quantidade de Peças */}
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {pecasCount} {pecasCount === 1 ? 'peça vinculada' : 'peças vinculadas'}
                        </span>
                      </div>

                      {/* Nome da Coleção com Edição Rápida Inline */}
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 pt-1 max-w-md">
                          <input
                            type="text"
                            value={inlineNameValue}
                            onChange={(e) => setInlineNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(col);
                              if (e.key === 'Escape') setInlineEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1 text-sm font-bold rounded-lg border border-amber-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineEdit(col)}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h2
                            onClick={() => handleStartInlineEdit(col)}
                            className="text-base font-extrabold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                            title="Clique para editar o nome da coleção instantaneamente"
                          >
                            {col.nome}
                          </h2>
                          <button
                            type="button"
                            onClick={() => handleStartInlineEdit(col)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 transition-opacity p-0.5"
                            title="Editar nome"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Descrição e Slug */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {col.descricao && <span className="line-clamp-1 italic text-slate-600 dark:text-slate-300">{col.descricao}</span>}
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          /catalogo?colecao={col.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LADO DIREITO: Controles Operacionais e Botões de Ação */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Switch Ativo / Pausado */}
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(col)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer',
                        col.ativo
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                      title={col.ativo ? 'Coleção ativa na vitrine (clique para pausar)' : 'Coleção pausada (clique para ativar)'}
                    >
                      {col.ativo ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                      <span className="hidden sm:inline">{col.ativo ? 'Ativa' : 'Pausada'}</span>
                    </button>

                    {/* Switch Exibir na Home */}
                    <button
                      type="button"
                      onClick={() => handleToggleHome(col)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer',
                        col.exibir_na_home
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                      title={col.exibir_na_home ? 'Exibida na Página Inicial (clique para ocultar)' : 'Oculta na Página Inicial (clique para exibir)'}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Home</span>
                    </button>

                    {/* Botão Ver na Vitrine */}
                    <Link
                      href={`/catalogo?colecao=${encodeURIComponent(col.slug)}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Ver catálogo desta coleção na vitrine"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {/* Botão Gerenciar Peças (Curadoria) */}
                    <button
                      type="button"
                      onClick={() => handleOpenCurating(col)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Curadoria ({pecasCount})</span>
                    </button>

                    {/* Botão Editar Detalhes */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(col)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Configurar</span>
                    </button>

                    {/* Botão Duplicar */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(col)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Duplicar coleção para criar nova edição"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Excluir */}
                    {!col.is_sistema && (
                      <button
                        type="button"
                        onClick={() => handleDelete(col)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Excluir coleção"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DETALHES DA COLEÇÃO */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCollection ? 'Editar Detalhes da Coleção' : 'Criar Nova Coleção'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Coleção *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Preview Outono/Inverno, Cápsula Réveillon, Linho Nobre..."
                  value={formNome}
                  onChange={(e) => {
                    setFormNome(e.target.value);
                    if (!editingCollection) {
                      setFormSlug(slugifyColecao(e.target.value));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Slug da URL (identificador amigável)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">/catalogo?colecao=</span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugifyColecao(e.target.value))}
                    placeholder="nome-da-colecao"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição Editorial (subtítulo para a vitrine e catálogo)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Peças refinadas em tecidos fluidos, perfeitas para ocasiões especiais."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Selo / Badge (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NOVO, EXCLUSIVO, HOT"
                    value={formBadgeTexto}
                    onChange={(e) => setFormBadgeTexto(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Cor do Selo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formBadgeCor}
                      onChange={(e) => setFormBadgeCor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={formBadgeCor}
                      onChange={(e) => setFormBadgeCor(e.target.value)}
                      className="flex-1 px-2.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  URL da Capa ou Banner Editorial (opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://... ou /images/colecoes/capa.webp"
                  value={formBannerUrl}
                  onChange={(e) => setFormBannerUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Exibir Carrossel na Página Inicial (Home)</span>
                    <span className="text-[11px] text-slate-500 block">Cria automaticamente uma seção de destaque para esta coleção na vitrine</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formExibirNaHome}
                    onChange={(e) => setFormExibirNaHome(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Coleção Ativa</span>
                    <span className="text-[11px] text-slate-500 block">Se desmarcada, a coleção fica em pausa e oculta na loja</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingCollection ? 'Salvar Alterações' : 'Criar Coleção'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GAVETA / MODAL DE CURADORIA DE PEÇAS */}
      {isCuratingModalOpen && curatingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Topo da Gaveta */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Curadoria da Coleção: <span className="text-amber-600">{curatingCollection.nome}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marque as peças do catálogo que fazem parte desta coleção ({selectedProductIds.size} selecionadas)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCuratingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros da Gaveta */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar peça por nome ou referência..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSelectAllCurating}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 whitespace-nowrap"
                >
                  Marcar Visíveis
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAllCurating}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl whitespace-nowrap"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Lista de Peças */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProductsForCurating.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhum produto corresponde aos filtros da curadoria.
                </div>
              ) : (
                filteredProductsForCurating.map((p) => {
                  const isChecked = selectedProductIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer select-none',
                        isChecked
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="text-slate-400 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductSelection(p.id);
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>

                        <div className="relative w-12 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
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

                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                            {p.categoria_nome || 'Geral'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {p.nome}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {p.slug}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                          {formatCurrency(p.preco)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Estoque: {p.estoque_total} un
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé da Gaveta */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedProductIds.size} {selectedProductIds.size === 1 ? 'peça selecionada' : 'peças selecionadas'} para esta coleção
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCuratingModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCurating}
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar Curadoria</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

