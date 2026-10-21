'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  FolderTree,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  AdminCategoryFull,
  getAdminCategoriesFull,
  saveAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AdminCategoriasPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [categories, setCategories] = useState<AdminCategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estados do Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryFull | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSubcategorias, setFormSubcategorias] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Subcategoria rápida inline
  const [inlineAddingCatId, setInlineAddingCatId] = useState<string | null>(null);
  const [inlineSubInput, setInlineSubInput] = useState('');

  // Modal de Exclusão
  const [catToDelete, setCatToDelete] = useState<AdminCategoryFull | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminCategoriesFull(tenantId);
      setCategories(data);
    } catch {
      showToast('Erro ao carregar categorias.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('bcomm:categories_updated', handleUpdate);
    return () => window.removeEventListener('bcomm:categories_updated', handleUpdate);
  }, [tenantId]);

  // Cálculos de métricas
  const totalSubcategorias = useMemo(() => {
    return categories.reduce((acc, cat) => acc + (cat.subcategorias?.length || 0), 0);
  }, [categories]);

  const totalProdutosCategorizados = useMemo(() => {
    return categories.reduce((acc, cat) => acc + (cat.total_produtos || 0), 0);
  }, [categories]);

  // Filtragem
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        c.subcategorias?.some((s) => s.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormNome('');
    setFormSlug('');
    setFormSubcategorias([]);
    setNewSubInput('');
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (cat: AdminCategoryFull) => {
    setEditingCategory(cat);
    setFormNome(cat.nome);
    setFormSlug(cat.slug);
    setFormSubcategorias([...(cat.subcategorias || [])]);
    setNewSubInput('');
    setIsModalOpen(true);
  };

  // Auto-gerar slug a partir do nome
  const handleNomeChange = (val: string) => {
    setFormNome(val);
    if (!editingCategory) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormSlug(generated);
    }
  };

  // Adicionar subcategoria no formulário modal
  const handleAddSubcategoria = () => {
    const clean = newSubInput.trim();
    if (!clean) return;
    if (formSubcategorias.includes(clean)) {
      showToast('Esta subcategoria já foi adicionada.', 'error');
      return;
    }
    setFormSubcategorias((prev) => [...prev, clean]);
    setNewSubInput('');
  };

  // Remover subcategoria no formulário modal
  const handleRemoveSubcategoria = (subToRemove: string) => {
    setFormSubcategorias((prev) => prev.filter((s) => s !== subToRemove));
  };

  // Salvar formulário
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      showToast('O nome da categoria é obrigatório.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveAdminCategory(tenantId, {
        id: editingCategory?.id,
        nome: formNome.trim(),
        slug: formSlug.trim() || undefined,
        subcategorias: formSubcategorias
      });

      if (res.success) {
        showToast(
          editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!'
        );
        setIsModalOpen(false);
        await loadData();
        try {
          await refreshProducts();
        } catch {}
      } else {
        showToast(res.error || 'Erro ao salvar categoria.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar subcategoria rápida diretamente na linha
  const handleAddInlineSubcategory = async (cat: AdminCategoryFull) => {
    const clean = inlineSubInput.trim();
    if (!clean) return;

    const currentSubs = cat.subcategorias || [];
    if (currentSubs.includes(clean)) {
      showToast('Esta subcategoria já existe nesta categoria.', 'error');
      return;
    }

    const updatedSubs = [...currentSubs, clean];
    try {
      const res = await saveAdminCategory(tenantId, {
        id: cat.id,
        nome: cat.nome,
        slug: cat.slug,
        subcategorias: updatedSubs
      });

      if (res.success) {
        showToast(`Subcategoria "${clean}" adicionada a ${cat.nome}!`);
        setInlineAddingCatId(null);
        setInlineSubInput('');
        await loadData();
      } else {
        showToast(res.error || 'Erro ao adicionar subcategoria.', 'error');
      }
    } catch {
      showToast('Falha ao adicionar subcategoria.', 'error');
    }
  };

  // Excluir subcategoria diretamente da linha
  const handleRemoveInlineSubcategory = async (cat: AdminCategoryFull, subToRemove: string) => {
    const updatedSubs = (cat.subcategorias || []).filter((s) => s !== subToRemove);
    try {
      const res = await saveAdminCategory(tenantId, {
        id: cat.id,
        nome: cat.nome,
        slug: cat.slug,
        subcategorias: updatedSubs
      });

      if (res.success) {
        showToast(`Subcategoria "${subToRemove}" removida.`);
        await loadData();
      } else {
        showToast(res.error || 'Erro ao remover subcategoria.', 'error');
      }
    } catch {
      showToast('Falha ao remover subcategoria.', 'error');
    }
  };

  // Excluir Categoria
  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminCategory(catToDelete.id, tenantId);
      if (res.success) {
        showToast(`Categoria "${catToDelete.nome}" excluída.`);
        setCatToDelete(null);
        await loadData();
        try {
          await refreshProducts();
        } catch {}
      } else {
        showToast(res.error || 'Erro ao excluir categoria.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao excluir categoria.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reordenar Categoria (Subir ou Descer)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;

    setCategories(newCats);

    const orderedIds = newCats.map((c) => c.id);
    const res = await reorderAdminCategories(tenantId, orderedIds);
    if (!res.success) {
      showToast('Erro ao salvar nova ordenação.', 'error');
      loadData();
    } else {
      showToast('Ordem atualizada com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Categorias & Subcategorias
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize a arquitetura de departamentos da boutique, filtros do catálogo e menus de navegação.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/${tenantSlug}/catalogo`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Catálogo</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO E ESTATÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Categorias Principais
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {loading ? '...' : categories.length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Subcategorias Mapeadas
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {loading ? '...' : totalSubcategorias}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Produtos Classificados
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {loading ? '...' : totalProdutosCategorizados}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por categoria ou subcategoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exibindo <span className="font-bold text-slate-900">{filteredCategories.length}</span> de{' '}
          {categories.length} departamentos
        </div>
      </div>

      {/* LISTAGEM DE CATEGORIAS */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Carregando categorias e subcategorias...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma categoria encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente ajustar sua busca por outros termos.'
              : 'Comece criando a primeira categoria para os produtos da boutique.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Categoria</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((cat, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredCategories.length - 1;
            const isInlineAdding = inlineAddingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Lado Esquerdo: Reordenação + Nome e Slug */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Botões de subir/descer na ordem da vitrine */}
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                    <button
                      type="button"
                      disabled={isFirst || Boolean(searchTerm)}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Subir posição na vitrine"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || Boolean(searchTerm)}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Descer posição na vitrine"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Informações da Categoria */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {cat.nome}
                      </h3>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        /{cat.slug}
                      </span>
                      <Link
                        href={`/admin/produtos?categoria=${encodeURIComponent(cat.id)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md transition-colors"
                        title="Ver produtos desta categoria"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{cat.total_produtos} produtos</span>
                      </Link>
                    </div>

                    {/* Subcategorias vinculadas */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        Subcategorias:
                      </span>

                      {cat.subcategorias && cat.subcategorias.length > 0 ? (
                        cat.subcategorias.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 pl-2.5 pr-1.5 py-0.5 rounded-lg border border-slate-200/80 transition-colors group/sub"
                          >
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInlineSubcategory(cat, sub)}
                              className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title={`Remover subcategoria "${sub}"`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] italic text-slate-400">
                          Nenhuma subcategoria adicionada
                        </span>
                      )}

                      {/* Adicionar subcategoria inline */}
                      {isInlineAdding ? (
                        <div className="inline-flex items-center gap-1 bg-white border border-amber-400 rounded-lg p-0.5 shadow-xs">
                          <input
                            type="text"
                            placeholder="Nome da subcategoria..."
                            value={inlineSubInput}
                            autoFocus
                            onChange={(e) => setInlineSubInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddInlineSubcategory(cat);
                              }
                              if (e.key === 'Escape') {
                                setInlineAddingCatId(null);
                                setInlineSubInput('');
                              }
                            }}
                            className="text-xs px-2 py-0.5 w-36 text-slate-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineSubcategory(cat)}
                            className="p-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineAddingCatId(null);
                              setInlineSubInput('');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInlineAddingCatId(cat.id);
                            setInlineSubInput('');
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50/80 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="Editar categoria e subcategorias"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatToDelete(cat)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CATEGORIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                  {editingCategory ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure o nome, link permanente e suas subcategorias
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alfaiataria, Tricots Biamar, Vestidos..."
                  value={formNome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slug (URL amigável) *
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                  <span className="px-3 text-xs text-slate-400 font-mono select-none">
                    /catalogo?categoria=
                  </span>
                  <input
                    type="text"
                    placeholder="alfaiataria"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    required
                    className="flex-1 px-2 py-2.5 text-xs font-mono bg-transparent text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subcategorias vinculadas */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subcategorias Vinculadas
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Subdivisões que aparecerão no filtro lateral e no menu suspenso desta categoria.
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Ex: Blazers, Calças Cenoura..."
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategoria();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategoria}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Tags de Subcategorias */}
                <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 max-h-36 overflow-y-auto">
                  {formSubcategorias.length > 0 ? (
                    formSubcategorias.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-slate-800 pl-3 pr-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategoria(sub)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic m-auto">
                      Nenhuma subcategoria adicionada ainda.
                    </span>
                  )}
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Excluir a categoria &quot;{catToDelete.nome}&quot;?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Esta ação removerá a categoria e suas subcategorias da vitrine e dos filtros do catálogo.
              {catToDelete.total_produtos > 0 && (
                <span className="block mt-2 font-bold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Atenção: Existem {catToDelete.total_produtos} produto(s) vinculados a esta categoria!
                </span>
              )}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
