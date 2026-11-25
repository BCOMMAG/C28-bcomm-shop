'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu as MenuIcon,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Smartphone,
  Monitor,
  Tag,
  Link as LinkIcon,
  ShoppingBag,
  Sliders,
  Layers,
  FolderTree,
  Check,
  Search,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  NavMenuItem,
  NavMenuSubOption,
  StoreNavMenuConfig,
  getStoreNavMenuConfig,
  saveStoreNavMenuConfig,
  getDefaultStoreNavMenuConfig,
  getAdminCategoriesFull,
  AdminCategoryFull,
  AdminProductItem,
  getAdminProducts,
  ColecaoLojaItem,
  getColecoesLoja,
  CategoriaNode,
  getCategoriaTree,
  saveCategoriaNode,
  getStoreCatalogFilterSettings,
  saveStoreCatalogFilterSettings
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function AdminMenuPage() {
  const { currentTenant } = useStore();
  const { t, locale } = useAdminI18n();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [menuConfig, setMenuConfig] = useState<StoreNavMenuConfig | null>(null);
  const [categories, setCategories] = useState<AdminCategoryFull[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [colecoes, setColecoes] = useState<ColecaoLojaItem[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoriaNode[]>([]);
  const [strictSubcategoryMode, setStrictSubcategoryMode] = useState(false);
  const [isSavingFilterRule, setIsSavingFilterRule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'linha_1' | 'linha_2' | 'gaveta_mobile'>('linha_1');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal de Adição / Edição de Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Campos do Formulário Modal
  const [itemLabel, setItemLabel] = useState('');
  const [itemType, setItemType] = useState<'status' | 'category' | 'subcategory' | 'link' | 'fabric'>('category');
  const [itemValue, setItemValue] = useState('');
  const [itemCustomUrl, setItemCustomUrl] = useState('');
  const [itemExtraCategory, setItemExtraCategory] = useState('');
  const [itemExtraFabric, setItemExtraFabric] = useState('');
  const [itemIsSpecial, setItemIsSpecial] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [badgeText, setBadgeText] = useState('NOVO');
  const [badgeColorBg, setBadgeColorBg] = useState('bg-[#C5A059]');

  // Subopções do Item - Configuração Avançada em Árvore Hierárquica Multinível
  const [itemSubOptions, setItemSubOptions] = useState<NavMenuSubOption[]>([]);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subLabel, setSubLabel] = useState('');
  
  // Modo de Destino do Submenu: 'tree' (Qualquer Categoria ou Subcategoria), 'status' (Coleções), 'fabric' (Tecidos), 'link' (Livre)
  const [subDestMode, setSubDestMode] = useState<'tree' | 'status' | 'fabric' | 'link'>('tree');
  const [selectedRootCat, setSelectedRootCat] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [selectedSubSubCat, setSelectedSubSubCat] = useState('');
  const [customNewSubCat, setCustomNewSubCat] = useState('');
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [linkInsideParentContext, setLinkInsideParentContext] = useState(true);
  const [alsoCreateInCategoryTree, setAlsoCreateInCategoryTree] = useState(true);

  // Fallbacks legados para outros tipos
  const [subValue, setSubValue] = useState('');
  const [subCustomUrl, setSubCustomUrl] = useState('');
  const [subExtraCategory, setSubExtraCategory] = useState('');
  const [subExtraFabric, setSubExtraFabric] = useState('');

  // Busca rápida de produtos para Peça Única
  const [productSearch, setProductSearch] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sanitização profunda e auto-cura de dados antigos ou inconsistentes
  const sanitizeMenuConfig = (cfg: StoreNavMenuConfig): StoreNavMenuConfig => {
    const sanitizeList = (list: NavMenuItem[]) =>
      (list || []).map((item) => {
        const itemCat = item.type === 'category' ? item.value : undefined;
        const sanitizedSubs = (item.subOptions || []).map((sub) => {
          if (sub.type === 'subcategory') {
            const effectiveParent = sub.parentCategory || itemCat;
            const isRegataGlitch =
              sub.label.toLowerCase() === 'regatas' &&
              (sub.value === 'Casacos & Jaquetas' || !sub.value);
            return {
              ...sub,
              ...(effectiveParent ? { parentCategory: effectiveParent } : {}),
              value: isRegataGlitch ? 'Regatas' : (sub.value || sub.label)
            };
          }
          return sub;
        });
        return {
          ...item,
          subOptions: sanitizedSubs
        };
      });

    return {
      linha_1: sanitizeList(cfg.linha_1),
      linha_2: sanitizeList(cfg.linha_2),
      gaveta_mobile: sanitizeList(cfg.gaveta_mobile)
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, catsRes, prodsRes, colecoesRes, treeRes, filterCfg] = await Promise.all([
        getStoreNavMenuConfig(tenantId),
        getAdminCategoriesFull(tenantId),
        getAdminProducts(tenantId).catch(() => []),
        getColecoesLoja(tenantId).catch(() => []),
        getCategoriaTree(tenantId).catch(() => []),
        getStoreCatalogFilterSettings(tenantId).catch(() => ({ filtragem_estrita_subcategoria: false }))
      ]);

      if (menuRes) {
        setMenuConfig(sanitizeMenuConfig(menuRes));
      } else {
        setMenuConfig(menuRes);
      }
      setCategories(catsRes);
      setProducts(prodsRes);
      setColecoes(colecoesRes);
      setCategoryTree(treeRes || []);
      setStrictSubcategoryMode(Boolean(filterCfg?.filtragem_estrita_subcategoria));
    } catch {
      showToast(t.storeMenu.toastError, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  useEffect(() => {
    const handleFilterSync = (e: any) => {
      if (e?.detail && typeof e.detail.filtragem_estrita_subcategoria === 'boolean') {
        setStrictSubcategoryMode(e.detail.filtragem_estrita_subcategoria);
      }
    };
    window.addEventListener('bcomm:catalog_filter_settings_updated', handleFilterSync);
    return () => window.removeEventListener('bcomm:catalog_filter_settings_updated', handleFilterSync);
  }, []);

  const handleToggleStrictSubcategoryMode = async (nextVal: boolean) => {
    setStrictSubcategoryMode(nextVal);
    setIsSavingFilterRule(true);
    try {
      const res = await saveStoreCatalogFilterSettings(tenantId, {
        filtragem_estrita_subcategoria: nextVal
      });
      if (res.success) {
        showToast(
          nextVal
            ? 'Vínculo estrito ativado: submenus exigem categoria principal + subcategoria.'
            : 'Modo flexível ativado: submenus exibem qualquer item da categoria/subcategoria selecionada.'
        );
      } else {
        setStrictSubcategoryMode(!nextVal);
        showToast(res.error || 'Erro ao salvar regra de filtragem.', 'error');
      }
    } catch {
      setStrictSubcategoryMode(!nextVal);
      showToast('Erro ao salvar regra de filtragem.', 'error');
    } finally {
      setIsSavingFilterRule(false);
    }
  };

  // Lista de subcategorias agregadas
  const allSubcategories = useMemo(() => {
    const list: string[] = [];
    categories.forEach((cat) => {
      (cat.subcategorias || []).forEach((sub) => {
        if (!list.includes(sub)) list.push(sub);
      });
    });
    return list;
  }, [categories]);

  // Categorias Raiz da Loja (Nível 1 na Árvore)
  const rootCategoryNodes = useMemo(() => {
    if (categoryTree && categoryTree.length > 0) {
      const roots = categoryTree.filter((n) => !n.parent_id || n.nivel === 0);
      if (roots.length > 0) return roots;
    }
    return categories.map((c) => ({
      id: c.id,
      nome: c.nome,
      slug: c.slug,
      parent_id: null,
      nivel: 0
    })) as CategoriaNode[];
  }, [categoryTree, categories]);

  // Subcategorias filhas da Categoria Raiz selecionada (Nível 2)
  const childSubcategoryNodes = useMemo(() => {
    if (!selectedRootCat) return [];
    const rootNode = categoryTree.find(
      (n) => n.nome.toLowerCase() === selectedRootCat.toLowerCase() || n.id === selectedRootCat
    );
    const result: Array<{ id: string; nome: string; parent_id: string | null; nivel: number }> = [];

    if (rootNode) {
      categoryTree
        .filter((n) => n.parent_id === rootNode.id)
        .forEach((child) => {
          result.push(child);
        });
    }

    // Complementa com o cadastro tradicional se não duplicado
    const catObj = categories.find(
      (c) => c.nome.toLowerCase() === selectedRootCat.toLowerCase() || c.id === selectedRootCat
    );
    if (catObj && Array.isArray(catObj.subcategorias)) {
      catObj.subcategorias.forEach((s) => {
        if (s && s.trim() && !result.some((r) => r.nome.toLowerCase() === s.trim().toLowerCase())) {
          result.push({
            id: `sub-${s.trim()}`,
            nome: s.trim(),
            parent_id: rootNode ? rootNode.id : catObj.id,
            nivel: 1
          });
        }
      });
    }

    // Complementa com produtos cadastrados com essa categoria e subcategoria
    products.forEach((p) => {
      const isMatch =
        (p.categoria_nome && p.categoria_nome.toLowerCase() === selectedRootCat.toLowerCase()) ||
        (catObj && p.categoria_id === catObj.id) ||
        (rootNode && p.categoria_id === rootNode.id);
      if (isMatch && p.subcategoria && p.subcategoria.trim()) {
        const sTrim = p.subcategoria.trim();
        if (!result.some((r) => r.nome.toLowerCase() === sTrim.toLowerCase())) {
          result.push({
            id: `sub-prod-${sTrim}`,
            nome: sTrim,
            parent_id: rootNode ? rootNode.id : null,
            nivel: 1
          });
        }
      }
    });

    return result;
  }, [selectedRootCat, categoryTree, categories, products]);

  // Sub-subcategorias (Nível 3 se existirem nós filhos da categoria selecionada)
  const grandChildNodes = useMemo(() => {
    if (!selectedSubCat || selectedSubCat === '__ALL__' || selectedSubCat === '__NEW__') return [];
    const subNode =
      childSubcategoryNodes.find((n) => n.nome.toLowerCase() === selectedSubCat.toLowerCase()) ||
      categoryTree.find((n) => n.nome.toLowerCase() === selectedSubCat.toLowerCase());
    if (!subNode) return [];
    return categoryTree.filter((n) => n.parent_id === subNode.id);
  }, [selectedSubCat, childSubcategoryNodes, categoryTree]);

  // Todas as categorias e subcategorias da loja (autonomia total para vincular em qualquer menu)
  const allStoreCategoryOptions = useMemo(() => {
    const items: Array<{
      id: string;
      nome: string;
      nivel: number;
      caminho?: string;
      icone?: string;
      count?: number;
      source: 'tree' | 'category' | 'product_sub';
    }> = [];
    const seenNames = new Set<string>();

    // Ordenação em profundidade (raiz -> filhos -> netos) para visualização clara
    const addTreeBranch = (parentId: string | null) => {
      const children = categoryTree
        .filter((n) => (parentId ? n.parent_id === parentId : !n.parent_id))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      children.forEach((node) => {
        const key = node.nome.trim().toLowerCase();
        items.push({
          id: node.id,
          nome: node.nome,
          nivel: node.nivel || 0,
          caminho: node.caminho_completo,
          icone: node.icone,
          count: node.total_produtos_arvore ?? node.total_produtos_diretos ?? 0,
          source: 'tree'
        });
        seenNames.add(key);
        addTreeBranch(node.id);
      });
    };

    if (categoryTree.length > 0) {
      addTreeBranch(null);
      // Garante qualquer nó órfão caso exista
      categoryTree.forEach((node) => {
        if (!items.some((i) => i.id === node.id)) {
          items.push({
            id: node.id,
            nome: node.nome,
            nivel: node.nivel || 0,
            caminho: node.caminho_completo,
            icone: node.icone,
            count: node.total_produtos_arvore ?? node.total_produtos_diretos ?? 0,
            source: 'tree'
          });
          seenNames.add(node.nome.trim().toLowerCase());
        }
      });
    }

    categories.forEach((c) => {
      const key = c.nome.trim().toLowerCase();
      if (key && !seenNames.has(key)) {
        items.push({
          id: c.id,
          nome: c.nome,
          nivel: 0,
          source: 'category'
        });
        seenNames.add(key);
      }
      (c.subcategorias || []).forEach((sub) => {
        const sKey = sub.trim().toLowerCase();
        if (sKey && !seenNames.has(sKey)) {
          items.push({
            id: `cat-sub-${c.id}-${sKey}`,
            nome: sub.trim(),
            nivel: 1,
            caminho: `${c.nome} > ${sub.trim()}`,
            source: 'category'
          });
          seenNames.add(sKey);
        }
      });
    });

    products.forEach((p) => {
      if (p.subcategoria && p.subcategoria.trim()) {
        const sTrim = p.subcategoria.trim();
        const sKey = sTrim.toLowerCase();
        if (!seenNames.has(sKey)) {
          items.push({
            id: `prod-sub-${sKey}`,
            nome: sTrim,
            nivel: 1,
            caminho: p.categoria_nome ? `${p.categoria_nome} > ${sTrim}` : undefined,
            source: 'product_sub'
          });
          seenNames.add(sKey);
        }
      }
    });

    return items;
  }, [categoryTree, categories, products]);

  // Lista filtrada pela busca dentro do modal de submenus
  const filteredStoreCategoryOptions = useMemo(() => {
    const q = subSearchTerm.trim().toLowerCase();
    if (!q) return allStoreCategoryOptions;
    return allStoreCategoryOptions.filter(
      (opt) =>
        opt.nome.toLowerCase().includes(q) ||
        (opt.caminho && opt.caminho.toLowerCase().includes(q))
    );
  }, [allStoreCategoryOptions, subSearchTerm]);

  // Prévia da Trilha e Destino do Submenu em Tempo Real
  const previewData = useMemo(() => {
    if (subDestMode === 'tree') {
      const effectiveSub = selectedSubCat === '__NEW__' ? customNewSubCat.trim() : selectedSubCat;
      const isAllRoot = !effectiveSub || effectiveSub === '__ALL__';
      const targetName = isAllRoot
        ? selectedRootCat
        : selectedSubSubCat && selectedSubSubCat !== '__ALL_SUB__'
        ? selectedSubSubCat
        : effectiveSub;

      const useParentContext = !isAllRoot && linkInsideParentContext && Boolean(selectedRootCat);

      const trail = isAllRoot
        ? `Toda a Categoria: ${selectedRootCat}`
        : useParentContext
        ? `${selectedRootCat} ➔ ${targetName}`
        : `Categoria Direta: ${targetName}`;

      const link = isAllRoot
        ? `/catalogo?categoria=${encodeURIComponent(selectedRootCat)}`
        : useParentContext
        ? `/catalogo?categoria=${encodeURIComponent(selectedRootCat)}&subcategoria=${encodeURIComponent(targetName)}`
        : `/catalogo?categoria=${encodeURIComponent(targetName)}`;

      return {
        trail,
        link,
        type: useParentContext ? ('subcategory' as const) : ('category' as const),
        value: targetName,
        parentCategory: useParentContext ? selectedRootCat : undefined
      };
    }

    if (subDestMode === 'status') {
      const col = subValue || 'Lançamento';
      const link = subExtraCategory
        ? `/catalogo?status=${encodeURIComponent(col)}&categoria=${encodeURIComponent(subExtraCategory)}`
        : `/catalogo?status=${encodeURIComponent(col)}`;
      return {
        trail: `Coleção: ${col}${subExtraCategory ? ` ➔ Categoria: ${subExtraCategory}` : ''}`,
        link,
        type: 'status' as const,
        value: col,
        parentCategory: undefined
      };
    }

    if (subDestMode === 'fabric') {
      const fab = subValue || 'Linho Puro';
      const link = `/catalogo?tecido=${encodeURIComponent(fab)}`;
      return {
        trail: `Tecido Nobre: ${fab}`,
        link,
        type: 'fabric' as const,
        value: fab,
        parentCategory: undefined
      };
    }

    // Link personalizado
    return {
      trail: `Link Personalizado: ${subCustomUrl || '/'}`,
      link: subCustomUrl || '/',
      type: 'link' as const,
      value: subCustomUrl || '/',
      parentCategory: undefined
    };
  }, [subDestMode, selectedRootCat, selectedSubCat, selectedSubSubCat, customNewSubCat, linkInsideParentContext, subValue, subExtraCategory, subCustomUrl]);

  // Lista de produtos filtrada para o Link Picker de Peça Única
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10);
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.nome.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      .slice(0, 15);
  }, [products, productSearch]);

  // Salvar alterações gerais do menu no banco
  const handleSaveMenu = async (customConfig?: StoreNavMenuConfig) => {
    const configToSave = customConfig || menuConfig;
    if (!configToSave) return;

    setIsSaving(true);
    try {
      const res = await saveStoreNavMenuConfig(tenantId, configToSave);
      if (res.success) {
        showToast('Estrutura de menus salva e sincronizada com a vitrine!');
      } else {
        showToast(res.error || 'Erro ao salvar menu.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar padrão de fábrica
  const handleRestoreDefault = async () => {
    if (!confirm(t.storeMenu.restoreConfirm)) return;
    const defaults = getDefaultStoreNavMenuConfig();
    setMenuConfig(defaults);
    await handleSaveMenu(defaults);
    showToast(t.storeMenu.restoreSuccess);
  };

  // Abrir Modal para Novo Item
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setEditingIndex(null);
    setItemLabel('');
    setItemType('category');
    setItemValue(categories[0]?.nome || 'Alfaiataria');
    setItemCustomUrl('');
    setItemExtraCategory('');
    setItemExtraFabric('');
    setItemIsSpecial(false);
    setHasBadge(false);
    setBadgeText('NOVO');
    setBadgeColorBg('bg-[#C5A059]');
    setItemSubOptions([]);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar Item
  const handleOpenEditItem = (item: NavMenuItem, index: number) => {
    setEditingItem(item);
    setEditingIndex(index);
    setItemLabel(item.label);
    setItemType(item.type);
    setItemValue(item.value);
    setItemCustomUrl(item.customUrl || '');
    setItemExtraCategory(item.extraCategory || '');
    setItemExtraFabric(item.extraFabric || '');
    setItemIsSpecial(Boolean(item.isSpecial));
    setHasBadge(Boolean(item.badge));
    setBadgeText(item.badge?.text || 'NOVO');
    setBadgeColorBg(item.badge?.colorBg || 'bg-[#C5A059]');

    // Sanitiza e auto-cura submenus ao abrir
    const itemCat = item.type === 'category' ? item.value : undefined;
    const sanitizedSubs = (item.subOptions || []).map((sub) => {
      if (sub.type === 'subcategory') {
        const effectiveParent = sub.parentCategory || itemCat;
        const isRegataGlitch =
          sub.label.toLowerCase() === 'regatas' &&
          (sub.value === 'Casacos & Jaquetas' || !sub.value);
        return {
          ...sub,
          ...(effectiveParent ? { parentCategory: effectiveParent } : {}),
          value: isRegataGlitch ? 'Regatas' : (sub.value || sub.label)
        };
      }
      return sub;
    });

    setItemSubOptions(sanitizedSubs);
    setIsModalOpen(true);
  };

  // Confirmar salvamento do Item no Modal
  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim()) {
      showToast(t.storeMenu.labelRequired, 'error');
      return;
    }
    if (!menuConfig) return;

    const newItem: NavMenuItem = {
      id: editingItem?.id || `nav-${Date.now()}`,
      label: itemLabel.trim(),
      type: itemType,
      value: itemValue,
      customUrl: itemCustomUrl.trim() || undefined,
      extraCategory: itemExtraCategory.trim() || undefined,
      extraFabric: itemExtraFabric.trim() || undefined,
      isSpecial: itemIsSpecial,
      badge: hasBadge
        ? {
            text: badgeText.trim() || 'NOVO',
            colorBg: badgeColorBg,
            colorText: 'text-white'
          }
        : undefined,
      subOptions: itemSubOptions.length > 0 ? itemSubOptions : undefined
    };

    const currentList = [...menuConfig[activeTab]];
    if (editingIndex !== null) {
      currentList[editingIndex] = newItem;
    } else {
      currentList.push(newItem);
    }

    const updatedConfig: StoreNavMenuConfig = {
      ...menuConfig,
      [activeTab]: currentList
    };

    setMenuConfig(updatedConfig);
    setIsModalOpen(false);
    handleSaveMenu(updatedConfig);
  };

  // Excluir Item
  const handleDeleteItem = (index: number) => {
    if (!menuConfig) return;
    const currentList = [...menuConfig[activeTab]];
    const removed = currentList.splice(index, 1);
    const updatedConfig: StoreNavMenuConfig = {
      ...menuConfig,
      [activeTab]: currentList
    };
    setMenuConfig(updatedConfig);
    handleSaveMenu(updatedConfig);
    showToast(`Item "${removed[0]?.label}" removido do menu.`);
  };

  // Mover Ordem do Item
  const handleMoveItemOrder = (index: number, direction: 'up' | 'down') => {
    if (!menuConfig) return;
    const currentList = [...menuConfig[activeTab]];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    const updatedConfig: StoreNavMenuConfig = {
      ...menuConfig,
      [activeTab]: currentList
    };
    setMenuConfig(updatedConfig);
    handleSaveMenu(updatedConfig);
  };

  // Subopções: Salvar modal de subopção
  const handleSaveSubOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subLabel.trim()) {
      showToast(t.storeMenu.subLabelRequired, 'error');
      return;
    }

    if (subDestMode === 'tree' && selectedSubCat === '__NEW__') {
      const newSubName = customNewSubCat.trim();
      if (!newSubName) {
        showToast('Informe o nome da nova subcategoria.', 'error');
        return;
      }

      if (alsoCreateInCategoryTree) {
        const parentNode = categoryTree.find(
          (n) =>
            n.nome.toLowerCase() === selectedRootCat.toLowerCase() || n.id === selectedRootCat
        );
        const alreadyExists = categoryTree.some(
          (n) =>
            n.nome.trim().toLowerCase() === newSubName.toLowerCase() &&
            (parentNode ? n.parent_id === parentNode.id : !n.parent_id)
        );
        if (!alreadyExists) {
          try {
            const res = await saveCategoriaNode(tenantId, {
              nome: newSubName,
              parent_id: parentNode ? parentNode.id : null
            });
            if (res.success) {
              const freshTree = await getCategoriaTree(tenantId).catch(() => categoryTree);
              setCategoryTree(freshTree);
            }
          } catch {}
        }
      }
    }

    const newSub: NavMenuSubOption = {
      id:
        editingSubIndex !== null && itemSubOptions[editingSubIndex]?.id
          ? itemSubOptions[editingSubIndex].id
          : `sub-${Date.now()}`,
      label: subLabel.trim(),
      type: previewData.type,
      value: previewData.value,
      parentCategory: previewData.parentCategory,
      customUrl: subDestMode === 'link' ? (subCustomUrl.trim() || undefined) : undefined,
      extraCategory: subDestMode === 'status' ? (subExtraCategory.trim() || undefined) : undefined,
      extraFabric: subDestMode === 'fabric' ? (subExtraFabric.trim() || undefined) : undefined
    };

    if (editingSubIndex !== null) {
      const updated = [...itemSubOptions];
      updated[editingSubIndex] = newSub;
      setItemSubOptions(updated);
    } else {
      setItemSubOptions((prev) => [...prev, newSub]);
    }

    setSubModalOpen(false);
  };

  // Abrir modal para adicionar submenu com autonomia total sobre todas as categorias
  const handleOpenAddSub = () => {
    setEditingSubIndex(null);
    setSubDestMode('tree');
    setSubSearchTerm('');

    const fallbackRoot = rootCategoryNodes[0]?.nome || categories[0]?.nome || '';
    const hasCategoryParent = itemType === 'category' && Boolean(itemValue);
    const defaultRoot = hasCategoryParent ? itemValue : fallbackRoot;

    setSelectedRootCat(defaultRoot);
    setLinkInsideParentContext(hasCategoryParent);

    // Se houver subcategorias vinculadas ao item pai, sugere a primeira; caso contrário, mantém toda a categoria ou deixa o lojista escolher qualquer outra
    const rootNode = categoryTree.find(
      (n) => n.nome.toLowerCase() === defaultRoot.toLowerCase() || n.id === defaultRoot
    );
    const children = rootNode ? categoryTree.filter((n) => n.parent_id === rootNode.id) : [];

    if (children.length > 0) {
      setSelectedSubCat(children[0].nome);
      setSubLabel(children[0].nome);
    } else {
      setSelectedSubCat('__ALL__');
      setSubLabel(defaultRoot);
    }

    setSelectedSubSubCat('');
    setCustomNewSubCat('');
    setAlsoCreateInCategoryTree(true);
    setSubValue('');
    setSubCustomUrl('');
    setSubExtraCategory('');
    setSubExtraFabric('');
    setSubModalOpen(true);
  };

  // Abrir modal para editar submenu
  const handleOpenEditSub = (subIdx: number) => {
    const target = itemSubOptions[subIdx];
    if (!target) return;
    setEditingSubIndex(subIdx);
    setSubLabel(target.label || '');
    setSubSearchTerm('');

    const fallbackRoot = rootCategoryNodes[0]?.nome || categories[0]?.nome || '';
    const itemParentCat = itemType === 'category' && itemValue ? itemValue : '';

    if (target.type === 'subcategory') {
      setSubDestMode('tree');
      const parent = target.parentCategory || itemParentCat || fallbackRoot;
      setSelectedRootCat(parent);
      setLinkInsideParentContext(Boolean(parent));
      setSelectedSubCat(target.value || target.label);
      setSelectedSubSubCat('');
      setCustomNewSubCat('');
    } else if (target.type === 'category') {
      setSubDestMode('tree');
      const targetVal = target.value || itemParentCat || fallbackRoot;
      const isSameAsMenuItem =
        Boolean(itemParentCat) && targetVal.toLowerCase() === itemParentCat.toLowerCase();
      if (isSameAsMenuItem) {
        setSelectedRootCat(targetVal);
        setSelectedSubCat('__ALL__');
        setLinkInsideParentContext(true);
      } else {
        setSelectedRootCat(itemParentCat || targetVal);
        setSelectedSubCat(targetVal);
        setLinkInsideParentContext(false);
      }
      setSelectedSubSubCat('');
      setCustomNewSubCat('');
    } else if (target.type === 'status') {
      setSubDestMode('status');
      setSubValue(target.value || 'Lançamento');
      setSubExtraCategory(target.extraCategory || '');
    } else if (target.type === 'fabric') {
      setSubDestMode('fabric');
      setSubValue(target.value || 'Linho Puro');
    } else {
      setSubDestMode('link');
      setSubCustomUrl(target.customUrl || target.value || '');
    }

    setSubModalOpen(true);
  };


  const handleMoveSubOptionUp = (idx: number) => {
    if (idx <= 0) return;
    setItemSubOptions((prev) => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const handleMoveSubOptionDown = (idx: number) => {
    if (idx >= itemSubOptions.length - 1) return;
    setItemSubOptions((prev) => {
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const handleRemoveSubOption = (subIdx: number) => {
    setItemSubOptions((prev) => prev.filter((_, idx) => idx !== subIdx));
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
              <MenuIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t.storeMenu.pageTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.storeMenu.pageSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title={t.storeMenu.restoreDefaultBtn}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.storeMenu.restoreDefaultBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveMenu()}
            disabled={isSaving}
            className="admin-btn-primary px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? t.storeMenu.savingBtn : t.storeMenu.saveAllBtn}</span>
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW DO CABEÇALHO */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {t.storeMenu.livePreviewTitle}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            {t.storeMenu.dynamicUpdate}
          </span>
        </div>

        {/* Simulação da Linha 1 */}
        <div className="flex items-center justify-center gap-4 py-1 text-xs font-medium text-slate-200 flex-wrap">
          {menuConfig?.linha_1.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-1 relative group cursor-default">
              <span className="hover:text-amber-400 transition-colors">{item.label}</span>
              {item.badge && (
                <span className={cn('text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase', item.badge.colorBg)}>
                  {item.badge.text}
                </span>
              )}
              {item.subOptions && item.subOptions.length > 0 && (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </div>
          ))}
        </div>

        {/* Simulação da Linha 2 */}
        <div className="flex items-center justify-center gap-4 pt-1 border-t border-slate-900 text-xs font-medium text-slate-300 flex-wrap">
          {menuConfig?.linha_2.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-1 cursor-default">
              <span
                className={cn(
                  'hover:text-amber-400 transition-colors',
                  item.isSpecial ? 'font-bold text-amber-300' : ''
                )}
              >
                {item.label}
              </span>
              {item.badge && (
                <span className={cn('text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase', item.badge.colorBg)}>
                  {item.badge.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* REGRA GLOBAL DE EXIBIÇÃO DE SUBMENUS & SUBCATEGORIAS NO CATÁLOGO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
              strictSubcategoryMode
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            )}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                Regra de Exibição de Submenus &amp; Subcategorias no Catálogo
              </h3>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border',
                  strictSubcategoryMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                )}
              >
                {strictSubcategoryMode ? 'Vínculo Estrito Ativo' : 'Modo Flexível (Inativo)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {strictSubcategoryMode ? (
                <>
                  <strong>Vínculo Estrito Ativado:</strong> Ao clicar em um submenu (ex:{' '}
                  <em>Outono/Inverno ➔ Casacos &amp; Jaquetas</em>), o catálogo exibirá{' '}
                  <strong>somente</strong> peças cadastradas na categoria principal{' '}
                  <strong>Outono/Inverno</strong> que também tenham a subcategoria{' '}
                  <strong>Casacos &amp; Jaquetas</strong>.
                </>
              ) : (
                <>
                  <strong>Modo Flexível (Padrão):</strong> Ao clicar em um submenu (ex:{' '}
                  <em>Outono/Inverno ➔ Casacos &amp; Jaquetas</em>), o catálogo exibirá todas as
                  peças da categoria ou subcategoria <strong>Casacos &amp; Jaquetas</strong>, mesmo
                  que o produto não tenha vínculo direto com <strong>Outono/Inverno</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={strictSubcategoryMode}
          disabled={isSavingFilterRule}
          onClick={() => handleToggleStrictSubcategoryMode(!strictSubcategoryMode)}
          className={cn(
            'inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-60',
            strictSubcategoryMode
              ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-xs'
              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
          )}
        >
          <span
            className={cn(
              'w-9 h-5 rounded-full relative transition-colors inline-flex items-center p-0.5',
              strictSubcategoryMode ? 'bg-amber-500' : 'bg-slate-300'
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                strictSubcategoryMode ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </span>
          <span>{strictSubcategoryMode ? 'Exigir Vínculo Estrito: ON' : 'Exigir Vínculo Estrito: OFF'}</span>
        </button>
      </div>

      {/* ABAS DE SELEÇÃO: LINHA 1, LINHA 2, GAVETA MOBILE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('linha_1')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'linha_1'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <Monitor className="w-4 h-4" />
          <span>{t.storeMenu.tabLine1}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {menuConfig?.linha_1.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('linha_2')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'linha_2'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.storeMenu.tabLine2}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {menuConfig?.linha_2.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gaveta_mobile')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'gaveta_mobile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <Smartphone className="w-4 h-4" />
          <span>{t.storeMenu.tabDrawerMobile}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {menuConfig?.gaveta_mobile.length || 0}
          </span>
        </button>
      </div>

      {/* LISTAGEM DOS ITENS DA ABA SELECIONADA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'linha_1'
                ? t.storeMenu.tabLine1Title
                : activeTab === 'linha_2'
                ? t.storeMenu.tabLine2Title
                : t.storeMenu.tabDrawerTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {t.storeMenu.tabSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateItem}
            className="admin-btn-primary px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.storeMenu.newItemBtn}</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-600">{t.storeMenu.loadingItems}</span>
          </div>
        ) : !menuConfig || menuConfig[activeTab].length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <MenuIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">{t.storeMenu.emptyTabTitle}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {t.storeMenu.emptyTabDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {menuConfig[activeTab].map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === menuConfig[activeTab].length - 1;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Lado Esquerdo: Ordenação + Rótulo + Destino + Badges */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveItemOrder(index, 'up')}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveItemOrder(index, 'down')}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.label}
                        </h4>

                        {/* Badges Visuais */}
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.2 rounded-full uppercase',
                              item.badge.colorBg,
                              item.badge.colorText || 'text-white'
                            )}
                          >
                            {item.badge.text}
                          </span>
                        )}

                        {item.isSpecial && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.2 rounded-full">
                            {t.storeMenu.specialHighlight}
                          </span>
                        )}

                        {/* Destino */}
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.type === 'category' && `${t.storeMenu.destTypeCategory}: ${item.value}`}
                          {item.type === 'status' && `${t.storeMenu.destTypeStatus}: ${item.value}`}
                          {item.type === 'fabric' && `${t.storeMenu.destTypeFabric}: ${item.value}`}
                          {item.type === 'link' && `${t.storeMenu.destTypeCustom}: ${item.customUrl || item.value}`}
                        </span>
                      </div>

                      {/* Subopções associadas */}
                      {item.subOptions && item.subOptions.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-0.5">
                            <Layers className="w-3 h-3" />
                            {item.subOptions.length} submenus:
                          </span>
                          {item.subOptions.map((sub) => (
                            <span
                              key={sub.id}
                              className="text-[11px] font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {sub.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lado Direito: Ações */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditItem(item, index)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t.storeMenu.btnEdit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title={t.storeMenu.btnDelete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE ITEM DE MENU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? t.storeMenu.modalTitleEdit : t.storeMenu.modalTitleCreate}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.storeMenu.modalSubtitle}
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

            <form onSubmit={handleSaveItemModal} className="p-6 space-y-4">
              {/* Rótulo visível */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.storeMenu.labelField}
                </label>
                <input
                  type="text"
                  placeholder={t.storeMenu.labelPlaceholder}
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              {/* Construtor Inteligente de Destino */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.storeMenu.destinationType}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('category');
                      setItemValue(categories[0]?.nome || '');
                    }}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                      itemType === 'category'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    {t.storeMenu.destTypeCategory}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('status');
                      setItemValue('Lançamento');
                    }}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                      itemType === 'status'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    {t.storeMenu.destTypeStatus}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('fabric');
                      setItemValue('Linho Puro');
                    }}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                      itemType === 'fabric'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    {t.storeMenu.destTypeFabric}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('link');
                      setItemValue('');
                    }}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                      itemType === 'link'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    {t.storeMenu.destTypeCustom}
                  </button>
                </div>

                {/* Seleção baseada no Tipo */}
                {itemType === 'category' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.storeMenu.destSelectCategory}
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      {allStoreCategoryOptions.length > 0
                        ? allStoreCategoryOptions.map((cat) => (
                            <option key={cat.id} value={cat.nome}>
                              {cat.nivel > 0 ? `${'  '.repeat(cat.nivel)}↳ ` : ''}
                              {cat.nome}
                              {cat.caminho && cat.nivel > 0 ? ` (${cat.caminho})` : ''}
                            </option>
                          ))
                        : categories.map((cat) => (
                            <option key={cat.id} value={cat.nome}>
                              {cat.nome}
                            </option>
                          ))}
                    </select>
                  </div>
                )}

                {itemType === 'status' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.storeMenu.destSelectStatus}
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => {
                        setItemValue(e.target.value);
                        const selectedCol = colecoes.find((c) => c.nome === e.target.value);
                        if (selectedCol && (!itemLabel.trim() || colecoes.some((c) => c.nome === itemLabel.trim()))) {
                          setItemLabel(selectedCol.nome);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      {colecoes.length > 0 ? (
                        colecoes.map((col) => (
                          <option key={col.id} value={col.nome}>
                            {col.nome} {col.badge_texto ? `(${col.badge_texto})` : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Lançamento">{t.storeMenu.statusLancamento}</option>
                          <option value="Mais Vendidos">{t.storeMenu.statusMaisVendidos}</option>
                          <option value="OUTLET">{t.storeMenu.statusOutlet}</option>
                          <option value="Últimas Peças">{t.storeMenu.statusUltimasPecas}</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {itemType === 'fabric' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.storeMenu.destSelectFabric}
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="Linho Puro">{t.storeMenu.fabricLinho}</option>
                      <option value="Tricot Biamar">{t.storeMenu.fabricTricot}</option>
                      <option value="Alfaiataria Premium">{t.storeMenu.fabricAlfaiataria}</option>
                      <option value="Seda Acetinada">{t.storeMenu.fabricSeda}</option>
                    </select>
                  </div>
                )}

                {itemType === 'link' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t.storeMenu.destUrlLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={t.storeMenu.destUrlPlaceholder}
                      value={itemCustomUrl}
                      onChange={(e) => setItemCustomUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Badges e Destaques Visuais */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {t.storeMenu.badgeField}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {t.storeMenu.badgeFieldDesc}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasBadge}
                    onChange={(e) => setHasBadge(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>

                {hasBadge && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {t.storeMenu.badgeTextLabel}
                      </label>
                      <input
                        type="text"
                        placeholder={t.storeMenu.badgePlaceholder}
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {t.storeMenu.badgeBgColorLabel}
                      </label>
                      <select
                        value={badgeColorBg}
                        onChange={(e) => setBadgeColorBg(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="bg-[#C5A059]">{t.storeMenu.badgeColorChampagne}</option>
                        <option value="bg-rose-500">{t.storeMenu.badgeColorRose}</option>
                        <option value="bg-emerald-600">{t.storeMenu.badgeColorEmerald}</option>
                        <option value="bg-slate-900">{t.storeMenu.badgeColorSlate}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submenus Suspensos (apenas se for Linha 1 ou Gaveta Mobile) */}
              {(activeTab === 'linha_1' || activeTab === 'gaveta_mobile') && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">
                        {t.storeMenu.dropdownTitle}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t.storeMenu.dropdownDesc}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddSub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.storeMenu.btnAddSubmenu}</span>
                    </button>
                  </div>

                  {itemSubOptions.length > 0 ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-64 overflow-y-auto">
                      {itemSubOptions.map((sub, sIdx) => {
                        const isSubcategory = sub.type === 'subcategory';
                        const parentName = sub.parentCategory || (itemType === 'category' ? itemValue : undefined);
                        const targetLink = isSubcategory
                          ? `/catalogo?categoria=${encodeURIComponent(parentName || '')}&subcategoria=${encodeURIComponent(sub.value)}`
                          : sub.type === 'category'
                          ? `/catalogo?categoria=${encodeURIComponent(sub.value)}`
                          : sub.type === 'status'
                          ? `/catalogo?status=${encodeURIComponent(sub.value)}`
                          : sub.customUrl || '#';

                        return (
                          <div
                            key={sub.id || sIdx}
                            className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs group hover:border-amber-300 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {sIdx + 1}
                              </span>
                              <div className="truncate">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate">{sub.label}</span>
                                  {isSubcategory && parentName ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                                      <span>{parentName}</span>
                                      <span className="text-amber-500 font-bold">➔</span>
                                      <span>{sub.value}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {sub.type === 'category' ? `Categoria: ${sub.value}` : sub.type}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block truncate mt-0.5">
                                  {targetLink}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (sIdx <= 0) return;
                                  setItemSubOptions((prev) => {
                                    const copy = [...prev];
                                    const temp = copy[sIdx - 1];
                                    copy[sIdx - 1] = copy[sIdx];
                                    copy[sIdx] = temp;
                                    return copy;
                                  });
                                }}
                                disabled={sIdx === 0}
                                title="Mover para Cima"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (sIdx >= itemSubOptions.length - 1) return;
                                  setItemSubOptions((prev) => {
                                    const copy = [...prev];
                                    const temp = copy[sIdx + 1];
                                    copy[sIdx + 1] = copy[sIdx];
                                    copy[sIdx] = temp;
                                    return copy;
                                  });
                                }}
                                disabled={sIdx === itemSubOptions.length - 1}
                                title="Mover para Baixo"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditSub(sIdx)}
                                title="Editar Submenu"
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setItemSubOptions((prev) => prev.filter((_, idx) => idx !== sIdx));
                                }}
                                title="Excluir Submenu"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] italic text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                      {t.storeMenu.noSubmenus}
                    </div>
                  )}
                </div>
              )}

              {/* Ações do Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {t.storeMenu.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.storeMenu.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SECUNDÁRIO: ADICIONAR / EDITAR SUBMENU SUSPENSO */}
      {subModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingSubIndex !== null ? 'Editar Submenu Suspenso' : 'Adicionar Submenu Suspenso'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Selecione o destino encadeado e defina o rótulo da opção
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubOption} className="space-y-4">
              {/* SELETOR PRINCIPAL DO TIPO DE DESTINO */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Destino do Submenu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubDestMode('tree');
                      if (!selectedRootCat) {
                        const def =
                          itemType === 'category' && itemValue
                            ? itemValue
                            : rootCategoryNodes[0]?.nome || categories[0]?.nome || '';
                        setSelectedRootCat(def);
                        setLinkInsideParentContext(itemType === 'category' && Boolean(itemValue));
                        setSelectedSubCat('__ALL__');
                      }
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                      subDestMode === 'tree'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Catálogo (Árvore)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubDestMode('status');
                      if (!subValue) setSubValue('Lançamento');
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                      subDestMode === 'status'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coleção / Status</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubDestMode('fabric');
                      if (!subValue) setSubValue('Linho Puro');
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                      subDestMode === 'fabric'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tecido Nobre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubDestMode('link')}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                      subDestMode === 'link'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Link Livre</span>
                  </button>
                </div>
              </div>

              {/* SELEÇÃO AUTÔNOMA DE QUALQUER CATEGORIA OU SUBCATEGORIA DA LOJA */}
              {subDestMode === 'tree' && (
                <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  {/* Contexto do Menu Pai (ex: Outono/Inverno) */}
                  {selectedRootCat && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Categoria Principal do Menu
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {selectedRootCat}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                        <div className="text-[11px] text-slate-600 leading-snug">
                          <span className="font-semibold text-slate-800 block">
                            Combinar com &quot;{selectedRootCat}&quot; na URL
                          </span>
                          <span>
                            {linkInsideParentContext
                              ? `Navega para ${selectedRootCat} ➔ Submenu (obedece a regra Estrito/Flexível).`
                              : 'Abre diretamente a categoria selecionada abaixo, ignorando o menu pai.'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={linkInsideParentContext}
                          onChange={(e) => setLinkInsideParentContext(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* BUSCA & SELEÇÃO COMPLETA DE TODAS AS CATEGORIAS / SUBCATEGORIAS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        Escolha qualquer Categoria ou Subcategoria ({allStoreCategoryOptions.length})
                      </label>
                      {selectedRootCat && childSubcategoryNodes.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {childSubcategoryNodes.length} direta{childSubcategoryNodes.length === 1 ? '' : 's'} em {selectedRootCat}
                        </span>
                      )}
                    </div>

                    {/* Campo de Busca Rápida */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={subSearchTerm}
                        onChange={(e) => setSubSearchTerm(e.target.value)}
                        placeholder="Buscar qualquer categoria (ex: Casacos, Primavera, Blusas...)"
                        className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      {subSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setSubSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Lista Completa Rolável com Autonomia Total */}
                    <div className="bg-white border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 shadow-2xs">
                      {/* Opção: Toda a categoria raiz do item */}
                      {selectedRootCat && !subSearchTerm.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubCat('__ALL__');
                            setSelectedSubSubCat('');
                            setSubLabel(selectedRootCat);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer',
                            selectedSubCat === '__ALL__'
                              ? 'bg-amber-50 text-amber-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <span className="truncate">
                            • Toda a Categoria &quot;{selectedRootCat}&quot; (Ver todas as peças)
                          </span>
                          {selectedSubCat === '__ALL__' && (
                            <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </button>
                      )}

                      {/* Subcategorias vinculadas diretamente à categoria pai (se houver) */}
                      {selectedRootCat && childSubcategoryNodes.length > 0 && !subSearchTerm.trim() && (
                        <div className="bg-amber-50/40">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 border-b border-amber-100">
                            Subcategorias já vinculadas em &quot;{selectedRootCat}&quot;
                          </div>
                          {childSubcategoryNodes.map((s) => {
                            const isSelected =
                              selectedSubCat.toLowerCase() === s.nome.toLowerCase() &&
                              selectedSubCat !== '__ALL__' &&
                              selectedSubCat !== '__NEW__';
                            return (
                              <button
                                key={`direct-${s.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedSubCat(s.nome);
                                  setSelectedSubSubCat('');
                                  setSubLabel(s.nome);
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer',
                                  isSelected
                                    ? 'bg-amber-100/80 text-amber-950 font-bold'
                                    : 'hover:bg-amber-50/70 text-slate-800'
                                )}
                              >
                                <span className="truncate">↳ {s.nome}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Todas as Categorias e Subcategorias da Loja */}
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-100">
                          Todas as Categorias &amp; Subcategorias da Loja ({filteredStoreCategoryOptions.length})
                        </div>
                        {filteredStoreCategoryOptions.length > 0 ? (
                          filteredStoreCategoryOptions.map((opt) => {
                            const isSelected =
                              selectedSubCat.toLowerCase() === opt.nome.toLowerCase() &&
                              selectedSubCat !== '__ALL__' &&
                              selectedSubCat !== '__NEW__';
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubCat(opt.nome);
                                  setSelectedSubSubCat('');
                                  setSubLabel(opt.nome);
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer',
                                  isSelected
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'hover:bg-slate-50 text-slate-800'
                                )}
                              >
                                <div className="min-w-0 flex items-center gap-1.5">
                                  {opt.nivel > 0 && (
                                    <span
                                      className="text-slate-400 shrink-0"
                                      style={{ paddingLeft: `${(opt.nivel - 1) * 10}px` }}
                                    >
                                      ↳
                                    </span>
                                  )}
                                  {opt.icone && <span className="shrink-0">{opt.icone}</span>}
                                  <span className="truncate">{opt.nome}</span>
                                  <span
                                    className={cn(
                                      'text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0',
                                      isSelected
                                        ? 'bg-white/20 text-amber-300'
                                        : 'bg-slate-100 text-slate-500'
                                    )}
                                  >
                                    {opt.source === 'product_sub'
                                      ? 'SUB'
                                      : `N${opt.nivel + 1}`}
                                  </span>
                                  {opt.caminho && opt.nivel > 0 && (
                                    <span
                                      className={cn(
                                        'text-[10px] truncate hidden sm:inline',
                                        isSelected ? 'text-slate-300' : 'text-slate-400'
                                      )}
                                    >
                                      ({opt.caminho})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {typeof opt.count === 'number' && (
                                    <span
                                      className={cn(
                                        'text-[10px]',
                                        isSelected ? 'text-slate-300' : 'text-slate-400'
                                      )}
                                    >
                                      {opt.count}p
                                    </span>
                                  )}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-4 text-center text-[11px] text-slate-400">
                            Nenhuma categoria encontrada para &quot;{subSearchTerm}&quot;.
                          </div>
                        )}
                      </div>

                      {/* Opção: Criar nova subcategoria */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubCat('__NEW__');
                          setSelectedSubSubCat('');
                          if (subSearchTerm.trim()) {
                            setCustomNewSubCat(subSearchTerm.trim());
                            setSubLabel(subSearchTerm.trim());
                          }
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                          selectedSubCat === '__NEW__'
                            ? 'bg-amber-100 text-amber-950'
                            : 'text-amber-700 hover:bg-amber-50'
                        )}
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          + Criar Nova Subcategoria{selectedRootCat ? ` em "${selectedRootCat}"` : ''}...
                        </span>
                      </button>
                    </div>

                    {/* Campo se escolher criar nova subcategoria */}
                    {selectedSubCat === '__NEW__' && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <label className="text-[10px] uppercase font-bold text-amber-900 block">
                          Nome da Nova Subcategoria{selectedRootCat ? ` em "${selectedRootCat}"` : ''}:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Regatas, Croppeds, Casacos..."
                          value={customNewSubCat}
                          onChange={(e) => {
                            setCustomNewSubCat(e.target.value);
                            setSubLabel(e.target.value);
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                        <label className="flex items-center gap-2 text-[11px] text-amber-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={alsoCreateInCategoryTree}
                            onChange={(e) => setAlsoCreateInCategoryTree(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-amber-600"
                          />
                          <span>Cadastrar também na Árvore de Categorias de Produtos</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* NÍVEL 3: SUB-SUBITEM (Se houver netos cadastrados) */}
                  {grandChildNodes.length > 0 && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Sub-subitem: Refinamento em &quot;{selectedSubCat}&quot;</span>
                      </label>
                      <select
                        value={selectedSubSubCat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSubSubCat(val);
                          if (val && val !== '__ALL_SUB__') {
                            setSubLabel(val);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="__ALL_SUB__">
                          • Todas as peças de &quot;{selectedSubCat}&quot;
                        </option>
                        {grandChildNodes.map((gc) => (
                          <option key={gc.id} value={gc.nome}>
                            ↳ {gc.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* CARD VISUAL DA TRILHA */}
                  <div className="p-3 bg-white border border-amber-200/90 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Trilha Hierárquica do Submenu:</span>
                      </div>
                      <span
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase',
                          strictSubcategoryMode
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        )}
                      >
                        {strictSubcategoryMode ? 'Filtro Estrito Ativo' : 'Filtro Flexível Ativo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900">
                        {previewData.trail}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                      Destino Vitrine: {previewData.link}
                    </div>
                  </div>
                </div>
              )}

              {/* OPÇÃO 2: STATUS / COLEÇÃO */}
              {subDestMode === 'status' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Coleção ou Status
                    </label>
                    <select
                      value={subValue}
                      onChange={(e) => {
                        setSubValue(e.target.value);
                        if (!subLabel || colecoes.some((c) => c.nome === subLabel)) {
                          setSubLabel(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      {colecoes.length > 0 ? (
                        colecoes.map((col) => (
                          <option key={col.id} value={col.nome}>
                            {col.nome} {col.badge_texto ? `(${col.badge_texto})` : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Lançamento">Lançamento</option>
                          <option value="Mais Vendidos">Mais Vendidos</option>
                          <option value="OUTLET">OUTLET</option>
                          <option value="Últimas Peças">Últimas Peças</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Filtrar Categoria na Coleção (Opcional)
                    </label>
                    <select
                      value={subExtraCategory}
                      onChange={(e) => setSubExtraCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Todas as Peças da Coleção</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* OPÇÃO 3: TECIDO NOBRE */}
              {subDestMode === 'fabric' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Selecione o Tecido Nobre
                  </label>
                  <select
                    value={subValue}
                    onChange={(e) => {
                      setSubValue(e.target.value);
                      if (!subLabel) setSubLabel(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Linho Puro">Linho Puro</option>
                    <option value="Tricot Biamar">Tricot Biamar</option>
                    <option value="Alfaiataria Premium">Alfaiataria Premium</option>
                    <option value="Seda Acetinada">Seda Acetinada</option>
                  </select>
                </div>
              )}

              {/* OPÇÃO 4: LINK LIVRE */}
              {subDestMode === 'link' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    URL ou Caminho Interno
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: /cliente ou https://..."
                    value={subCustomUrl}
                    onChange={(e) => setSubCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}

              {/* RÓTULO VISÍVEL DO SUBMENU */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Texto do Submenu (Visível para o Cliente) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Regatas, Linho, Lançamentos..."
                  value={subLabel}
                  onChange={(e) => setSubLabel(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-semibold text-slate-900"
                />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSubIndex !== null ? 'Salvar Submenu' : 'Confirmar Submenu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
