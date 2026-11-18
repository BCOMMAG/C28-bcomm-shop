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
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Folder,
  FolderOpen,
  CornerDownRight,
  Eye,
  EyeOff,
  GitBranch,
  Network
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  CategoriaNode,
  getCategoriaTree,
  saveCategoriaNode,
  deleteCategoriaNode,
  reorderCategoriaNodes,
  validateAntiLoop,
  slugifyCategoria,
  getDescendantCategoryIds
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function AdminCategoriasPage() {
  const { currentTenant, refreshProducts } = useStore();
  const { t } = useAdminI18n();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [tree, setTree] = useState<CategoriaNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estados de Expansão dos Galhos da Árvore
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Estados do Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNode, setEditingNode] = useState<CategoriaNode | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formIcone, setFormIcone] = useState('📁');
  const [formDescricao, setFormDescricao] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  // Modal de Exclusão Segura
  const [nodeToDelete, setNodeToDelete] = useState<CategoriaNode | null>(null);
  const [deleteStrategy, setDeleteStrategy] = useState<'reparent_to_parent' | 'orphan'>('reparent_to_parent');
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCategoriaTree(tenantId);
      setTree(data);
      // Por padrão, expande os departamentos raiz
      const rootIds = data.filter((n) => !n.parent_id).map((n) => n.id);
      setExpandedIds(new Set(rootIds));
    } catch {
      showToast('Erro ao carregar árvore de categorias.', 'error');
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

  // Cálculos de métricas da taxonomia
  const rootCount = useMemo(() => {
    return tree.filter((n) => !n.parent_id).length;
  }, [tree]);

  const subBranchCount = useMemo(() => {
    return tree.filter((n) => Boolean(n.parent_id)).length;
  }, [tree]);

  const maxDepth = useMemo(() => {
    if (tree.length === 0) return 0;
    return Math.max(...tree.map((n) => (n.nivel ?? 0) + 1));
  }, [tree]);

  const totalProdutosCategorizados = useMemo(() => {
    return tree.reduce((acc, n) => acc + (n.total_produtos_diretos || 0), 0);
  }, [tree]);

  // Alternar expansão de um nó
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(tree.map((n) => n.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filtragem com auto-expansão da árvore
  const { matchingIds, isSearching } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { matchingIds: new Set<string>(), isSearching: false };

    const matches = new Set<string>();
    const nodeMap = new Map<string, CategoriaNode>();
    tree.forEach((n) => nodeMap.set(n.id, n));

    tree.forEach((node) => {
      if (
        node.nome.toLowerCase().includes(term) ||
        node.slug.toLowerCase().includes(term) ||
        (node.caminho_completo && node.caminho_completo.toLowerCase().includes(term))
      ) {
        matches.add(node.id);
        // Garante que todos os ancestrais sejam incluídos para manter o galho visível
        let curr = node.parent_id;
        while (curr && nodeMap.has(curr)) {
          matches.add(curr);
          curr = nodeMap.get(curr)!.parent_id;
        }
      }
    });

    return { matchingIds: matches, isSearching: true };
  }, [tree, searchTerm]);

  // Quando buscar, abre automaticamente os galhos correspondentes
  useEffect(() => {
    if (isSearching && matchingIds.size > 0) {
      setExpandedIds(new Set([...expandedIds, ...matchingIds]));
    }
  }, [isSearching, matchingIds]);

  // Abrir Modal para Novo Departamento Raiz (Nível 1)
  const handleOpenCreateRoot = () => {
    setEditingNode(null);
    setFormNome('');
    setFormSlug('');
    setFormParentId(null);
    setFormIcone('📁');
    setFormDescricao('');
    setFormAtivo(true);
    setIsModalOpen(true);
  };

  // Abrir Modal para Nova Subcategoria abaixo de um nó específico
  const handleOpenCreateChild = (parent: CategoriaNode) => {
    setEditingNode(null);
    setFormNome('');
    setFormSlug('');
    setFormParentId(parent.id);
    setFormIcone('↳');
    setFormDescricao('');
    setFormAtivo(true);
    setIsModalOpen(true);
    // Garante que o pai esteja expandido
    setExpandedIds((prev) => new Set([...prev, parent.id]));
  };

  // Abrir Modal de Edição de um nó
  const handleOpenEdit = (node: CategoriaNode) => {
    setEditingNode(node);
    setFormNome(node.nome);
    setFormSlug(node.slug);
    setFormParentId(node.parent_id);
    setFormIcone(node.icone || '📁');
    setFormDescricao(node.descricao || '');
    setFormAtivo(node.ativo !== false);
    setIsModalOpen(true);
  };

  // Auto-gerar slug a partir do nome
  const handleNomeChange = (val: string) => {
    setFormNome(val);
    if (!editingNode) {
      setFormSlug(slugifyCategoria(val));
    }
  };

  // Salvar formulário do nó
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      showToast('O nome da categoria é obrigatório.', 'error');
      return;
    }

    if (editingNode && !validateAntiLoop(editingNode.id, formParentId, tree)) {
      showToast('Operação inválida: uma categoria não pode ser movida para dentro de sua própria ramificação.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveCategoriaNode(tenantId, {
        id: editingNode?.id,
        nome: formNome.trim(),
        slug: formSlug.trim() || undefined,
        parent_id: formParentId,
        icone: formIcone.trim() || undefined,
        descricao: formDescricao.trim() || undefined,
        ativo: formAtivo
      });

      if (res.success) {
        showToast(
          editingNode ? 'Categoria atualizada com sucesso!' : 'Nova categoria cadastrada na árvore!'
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

  // Exclusão Segura
  const handleConfirmDelete = async () => {
    if (!nodeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategoriaNode(tenantId, nodeToDelete.id, {
        strategy: deleteStrategy,
        targetParentId: nodeToDelete.parent_id
      });
      if (res.success) {
        showToast(`Categoria "${nodeToDelete.nome}" removida da taxonomia.`);
        setNodeToDelete(null);
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

  // Reordenar entre irmãos (Subir ou Descer)
  const handleMoveOrder = async (node: CategoriaNode, direction: 'up' | 'down') => {
    const siblings = tree.filter((n) => n.parent_id === node.parent_id);
    const currentIndex = siblings.findIndex((n) => n.id === node.id);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === siblings.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...siblings];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const orderedIds = reordered.map((n) => n.id);
    const res = await reorderCategoriaNodes(tenantId, node.parent_id, orderedIds);
    if (res.success) {
      showToast('Ordem atualizada com sucesso!');
      await loadData();
    } else {
      showToast(res.error || 'Erro ao reordenar.', 'error');
    }
  };

  // Nós raiz ordenados para renderização em cascata
  const rootNodes = useMemo(() => {
    return tree.filter((n) => !n.parent_id).sort((a, b) => a.display_order - b.display_order);
  }, [tree]);

  // Lista de opções válidas para Categoria-Mãe no modal (exclui o próprio nó e descendentes)
  const availableParentOptions = useMemo(() => {
    if (!editingNode) return tree;
    const forbiddenIds = new Set(getDescendantCategoryIds(editingNode.id, tree));
    return tree.filter((n) => !forbiddenIds.has(n.id));
  }, [tree, editingNode]);

  // Componente recursivo para renderizar cada nó da árvore
  const renderTreeNode = (node: CategoriaNode) => {
    // Se estiver pesquisando e este nó não fizer parte da busca, oculta
    if (isSearching && !matchingIds.has(node.id)) {
      return null;
    }

    const hasChildren = node.filhos && node.filhos.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const level = node.nivel || 0;

    // Badges visuais de nível
    const levelBadges = [
      { label: 'N1 • DEPARTAMENTO', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
      { label: 'N2 • SUBCATEGORIA', bg: 'bg-sky-100 text-sky-900 border-sky-300' },
      { label: 'N3 • ESPECIALIZAÇÃO', bg: 'bg-purple-100 text-purple-900 border-purple-300' },
      { label: 'N4 • RAMIFICAÇÃO', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
    ];
    const levelBadge = levelBadges[Math.min(level, levelBadges.length - 1)];

    return (
      <div key={node.id} className="group/item">
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all border gap-3 my-1',
            level === 0
              ? 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/60 ml-4 sm:ml-8 relative before:absolute before:-left-4 before:top-1/2 before:w-4 before:h-[1px] before:bg-slate-300'
          )}
          style={{ paddingLeft: level > 1 ? `${Math.min(level * 18, 90)}px` : undefined }}
        >
          {/* Lado Esquerdo: Expansor, Ícone, Nível, Nome e Caminho */}
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Botão Expansor [+] / [-] */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs"
                title={isExpanded ? 'Recolher ramificação' : 'Expandir ramificação'}
              >
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200 text-slate-700',
                    !isExpanded && '-rotate-90'
                  )}
                />
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center shrink-0 opacity-30 text-slate-400">
                •
              </div>
            )}

            {/* Ícone ou Emoji do Nó */}
            <span className="text-base shrink-0" title="Ícone da categoria">
              {node.icone || (level === 0 ? '📁' : '↳')}
            </span>

            {/* Identificação Textual */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm truncate">
                  {node.nome}
                </span>

                {/* Badge de Nível */}
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.2 rounded-md border tracking-wider shrink-0',
                    levelBadge.bg
                  )}
                >
                  {levelBadge.label}
                </span>

                {/* Status Ativo / Pausado */}
                {!node.ativo && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0">
                    <EyeOff className="w-2.5 h-2.5" />
                    Pausada
                  </span>
                )}
              </div>

              {/* Trilha Slug e Metadados */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                <span className="font-mono text-slate-400">/{node.slug}</span>
                {node.caminho_completo && level > 0 && (
                  <span className="text-slate-400 hidden sm:inline" title="Caminho hierárquico">
                    • {node.caminho_completo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Contadores e Botões de Ação */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end pt-1 lg:pt-0 border-t border-slate-100 lg:border-t-0">
            {/* Contagem de Peças (Diretas e Totais no Ramo) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-lg text-xs font-semibold text-slate-700 shrink-0 shadow-2xs">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>{node.total_produtos_diretos || 0} produtos</span>
              {hasChildren && (node.total_produtos_arvore || 0) > (node.total_produtos_diretos || 0) && (
                <span className="text-[10px] text-slate-500 font-normal">
                  ({node.total_produtos_arvore} no ramo)
                </span>
              )}
            </div>

            {/* Botão + Subcategoria Imediata */}
            <button
              type="button"
              onClick={() => handleOpenCreateChild(node)}
              className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
              title="Adicionar subcategoria filha abaixo deste galho"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Subcategoria</span>
            </button>

            {/* Botão Subir Ordem */}
            <button
              type="button"
              onClick={() => handleMoveOrder(node, 'up')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Mover para cima"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* Botão Descer Ordem */}
            <button
              type="button"
              onClick={() => handleMoveOrder(node, 'down')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Mover para baixo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* Botão Editar Nó */}
            <button
              type="button"
              onClick={() => handleOpenEdit(node)}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
              title="Editar categoria e mover de galho"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            {/* Botão Excluir */}
            <button
              type="button"
              onClick={() => {
                setNodeToDelete(node);
                setDeleteStrategy('reparent_to_parent');
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Excluir categoria"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filhos Recursivos */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 pl-2 sm:pl-4 border-l-2 border-slate-200/70 ml-3 sm:ml-5 my-1">
            {node.filhos!.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border animate-fade-in transition-all',
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* CABEÇALHO DA PÁGINA                                             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Taxonomia & Árvore de Categorias</span>
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 tracking-wider">
                  N-NÍVEIS
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Organize departamentos, subcategorias e ramificações infinitas da boutique com autonomia total.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/catalogo"
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Ver Catálogo</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenCreateRoot}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ NOVO DEPARTAMENTO (N1)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CARDS DE KPI: ESTRUTURA DA TAXONOMIA                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Departamentos Raiz
            </span>
            <span className="text-xl font-bold text-slate-900">
              {loading ? '...' : rootCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Sub-ramificações
            </span>
            <span className="text-xl font-bold text-slate-900">
              {loading ? '...' : subBranchCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Profundidade da Árvore
            </span>
            <span className="text-xl font-bold text-slate-900">
              {loading ? '...' : `${maxDepth} Camadas`}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Peças Categorizadas
            </span>
            <span className="text-xl font-bold text-slate-900">
              {loading ? '...' : totalProdutosCategorizados}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE PESQUISA & CONTROLES DA ÁRVORE                        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, slug ou ramificação..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-semibold"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Expandir Todos
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Recolher Todos
          </button>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Atualizar árvore"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ÁRVORE HIERÁRQUICA DE CATEGORIAS                               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Carregando árvore de taxonomia...</p>
          </div>
        ) : tree.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <FolderTree className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nenhuma categoria na árvore ainda
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Cadastre o primeiro departamento raiz para estruturar as vitrines e os produtos da sua boutique.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateRoot}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro Departamento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {rootNodes.map((rootNode) => renderTreeNode(rootNode))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CATEGORIA E REPARENTING           */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-fade-in my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 font-bold text-base shrink-0">
                  {formIcone || '📁'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingNode ? `Editar: ${editingNode.nome}` : formParentId ? 'Nova Subcategoria' : 'Novo Departamento Raiz'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formParentId
                      ? 'Adicione uma ramificação especializada abaixo da categoria mãe.'
                      : 'Crie um departamento de nível 1 na vitrine da boutique.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-slate-700 text-xs mb-1 font-bold">
                  Nome da Categoria / Subcategoria *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Ex: Tricots de Gola Alta, Sobretudos, Bolsas Clutches..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-slate-700 text-xs mb-1 font-bold">
                  Slug da URL (Link Amigável)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500">
                  <span className="text-xs text-slate-400 font-mono">/catalogo?categoria=</span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugifyCategoria(e.target.value))}
                    className="w-full bg-transparent text-slate-900 font-mono text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Categoria-Mãe (Reparenting Inteligente) */}
              <div>
                <label className="block text-slate-700 text-xs mb-1 font-bold flex items-center justify-between">
                  <span>Categoria-Mãe (Galho Superior)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Mude para mover de galho</span>
                </label>
                <select
                  value={formParentId || ''}
                  onChange={(e) => setFormParentId(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">📁 [NENHUMA - DEPARTAMENTO RAIZ (NÍVEL 1)]</option>
                  {availableParentOptions.map((opt) => {
                    const depth = opt.nivel || 0;
                    const prefix = depth > 0 ? `${'  '.repeat(depth)}↳ ` : '';
                    return (
                      <option key={opt.id} value={opt.id}>
                        {prefix}
                        {opt.nome} ({opt.caminho_completo || opt.nome})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ícone e Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 text-xs mb-1 font-bold">
                    Ícone ou Emoji
                  </label>
                  <input
                    type="text"
                    value={formIcone}
                    onChange={(e) => setFormIcone(e.target.value)}
                    placeholder="Ex: 🧶, 👗, 🧥, ✨..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold text-xs text-center focus:bg-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs mb-1 font-bold">
                    Status na Loja
                  </label>
                  <select
                    value={formAtivo ? 'ativo' : 'pausado'}
                    onChange={(e) => setFormAtivo(e.target.value === 'ativo')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold text-xs focus:bg-white cursor-pointer"
                  >
                    <option value="ativo">✅ Ativa na vitrine</option>
                    <option value="pausado">⏸️ Pausada (Oculta)</option>
                  </select>
                </div>
              </div>

              {/* Descrição Opcional */}
              <div>
                <label className="block text-slate-700 text-xs mb-1 font-bold">
                  Descrição Editorial (Opcional)
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Subtítulo ou mensagem da categoria que aparecerá no cabeçalho do catálogo..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Gravando...' : editingNode ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE EXCLUSÃO SEGURA                                       */}
      {/* ============================================================== */}
      {nodeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Excluir "{nodeToDelete.nome}"?
                </h3>
                <p className="text-xs text-slate-400">
                  Proteção de integridade para produtos e ramificações filhas.
                </p>
              </div>
            </div>

            {/* Alerta de Impacto */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Impacto da Exclusão:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                <li>
                  <strong>{nodeToDelete.filhos?.length || 0} subcategorias filhas</strong> ligadas diretamente a este galho.
                </li>
                <li>
                  <strong>{nodeToDelete.total_produtos_diretos || 0} produtos vinculados diretamente</strong> a esta categoria.
                </li>
              </ul>
            </div>

            {/* Opções de Resolução Segura */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                O que deseja fazer com as peças e subcategorias?
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="strategy"
                  value="reparent_to_parent"
                  checked={deleteStrategy === 'reparent_to_parent'}
                  onChange={() => setDeleteStrategy('reparent_to_parent')}
                  className="mt-0.5 accent-amber-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Mover tudo para a categoria mãe (Recomendado)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    As peças e subcategorias são transferidas para o galho superior sem que nada se perca.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="strategy"
                  value="orphan"
                  checked={deleteStrategy === 'orphan'}
                  onChange={() => setDeleteStrategy('orphan')}
                  className="mt-0.5 accent-amber-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Tornar subcategorias independentes (Raiz)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    As subcategorias viram departamentos de Nível 1 e as peças ficam desvinculadas.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNodeToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
