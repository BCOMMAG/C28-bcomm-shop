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
  Layers
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
  getAdminProducts
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AdminMenuPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [menuConfig, setMenuConfig] = useState<StoreNavMenuConfig | null>(null);
  const [categories, setCategories] = useState<AdminCategoryFull[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
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

  // Subopções do Item
  const [itemSubOptions, setItemSubOptions] = useState<NavMenuSubOption[]>([]);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subLabel, setSubLabel] = useState('');
  const [subType, setSubType] = useState<'status' | 'category' | 'subcategory' | 'link' | 'fabric'>('category');
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, catsRes, prodsRes] = await Promise.all([
        getStoreNavMenuConfig(tenantId),
        getAdminCategoriesFull(tenantId),
        getAdminProducts(tenantId).catch(() => [])
      ]);
      setMenuConfig(menuRes);
      setCategories(catsRes);
      setProducts(prodsRes);
    } catch {
      showToast('Erro ao carregar configurações de menu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

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
    if (!confirm('Deseja restaurar a estrutura padrão de menus da boutique?')) return;
    const defaults = getDefaultStoreNavMenuConfig();
    setMenuConfig(defaults);
    await handleSaveMenu(defaults);
    showToast('Menu restaurado para a curadoria padrão de fábrica!');
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
    setItemSubOptions(item.subOptions ? [...item.subOptions] : []);
    setIsModalOpen(true);
  };

  // Confirmar salvamento do Item no Modal
  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim()) {
      showToast('O rótulo do item é obrigatório.', 'error');
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
  const handleSaveSubOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subLabel.trim()) {
      showToast('O rótulo do submenu é obrigatório.', 'error');
      return;
    }

    const newSub: NavMenuSubOption = {
      id: `sub-${Date.now()}`,
      label: subLabel.trim(),
      type: subType,
      value: subValue,
      customUrl: subCustomUrl.trim() || undefined,
      extraCategory: subExtraCategory.trim() || undefined,
      extraFabric: subExtraFabric.trim() || undefined
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

  const handleOpenAddSub = () => {
    setEditingSubIndex(null);
    setSubLabel('');
    setSubType('category');
    setSubValue(categories[0]?.nome || '');
    setSubCustomUrl('');
    setSubExtraCategory('');
    setSubExtraFabric('');
    setSubModalOpen(true);
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
                Menus & Navegação da Vitrine
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gerencie links, submenus suspensos, badges e gaveta mobile da loja em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Restaurar padrão da boutique"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveMenu()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Salvar Menus</span>
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW DO CABEÇALHO */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Pré-Visualização em Tempo Real (Desktop Header)
            </span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            Atualização dinâmica
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
          <span>Linha 1 Superior (Desktop)</span>
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
          <span>Linha 2 Destaques (Desktop)</span>
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
          <span>Gaveta Mobile & Acordeão</span>
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
                ? 'Itens da Linha 1 do Topo (com Submenus Suspensos)'
                : activeTab === 'linha_2'
                ? 'Itens da Linha 2 de Destaques Rápidos'
                : 'Itens da Gaveta Lateral Sanfonada no Celular'}
            </h3>
            <p className="text-xs text-slate-500">
              Clique em editar para configurar o link de destino, subitens ou badges visuais.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Item</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-600">Carregando itens de menu...</span>
          </div>
        ) : !menuConfig || menuConfig[activeTab].length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <MenuIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Nenhum item configurado nesta aba</h4>
            <p className="text-xs text-slate-500 mt-1">
              Clique em &quot;Adicionar Item&quot; ou restaure o padrão da boutique.
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
                            Destaque Especial
                          </span>
                        )}

                        {/* Destino */}
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.type === 'category' && `Categoria: ${item.value}`}
                          {item.type === 'status' && `Coleção/Status: ${item.value}`}
                          {item.type === 'fabric' && `Tecido: ${item.value}`}
                          {item.type === 'link' && `Link: ${item.customUrl || item.value}`}
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
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Excluir item"
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
                    {editingItem ? 'Editar Item de Menu' : 'Novo Item de Menu'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure o nome, destino, submenus suspensos e badges
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
                  Texto do Menu *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alfaiataria, Lançamento 2026, Tricots..."
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              {/* Construtor Inteligente de Destino */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Para onde esse item direciona?
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
                    Categoria
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
                    Coleção / Status
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
                    Tecido Nobre
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
                    Link Livre
                  </button>
                </div>

                {/* Seleção baseada no Tipo */}
                {itemType === 'category' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Selecione a Categoria:
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      {categories.map((cat) => (
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
                      Selecione a Coleção / Status:
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="Lançamento">Lançamento 2026</option>
                      <option value="Mais Vendidos">Mais Vendidos</option>
                      <option value="OUTLET">OUTLET / BAZAR</option>
                      <option value="Últimas Peças">Últimas Peças</option>
                    </select>
                  </div>
                )}

                {itemType === 'fabric' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Selecione o Tecido:
                    </label>
                    <select
                      value={itemValue}
                      onChange={(e) => setItemValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="Linho Puro">Linho Puro</option>
                      <option value="Tricot Biamar">Tricot Biamar</option>
                      <option value="Alfaiataria Premium">Alfaiataria Premium</option>
                      <option value="Seda Acetinada">Seda Acetinada</option>
                    </select>
                  </div>
                )}

                {itemType === 'link' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      URL de Destino:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: /cliente ou https://wa.me/..."
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
                      Badge de Destaque Visual
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Exibe um selo como &quot;NOVO&quot;, &quot;HOT&quot; ou &quot;OFF&quot; ao lado do link.
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
                        Texto do Selo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: NOVO"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Cor de Fundo
                      </label>
                      <select
                        value={badgeColorBg}
                        onChange={(e) => setBadgeColorBg(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="bg-[#C5A059]">Dourado Champagne (#C5A059)</option>
                        <option value="bg-rose-500">Vermelho Rosê (Rose 500)</option>
                        <option value="bg-emerald-600">Verde Esmeralda (Emerald 600)</option>
                        <option value="bg-slate-900">Preto Sofisticado (Slate 900)</option>
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
                        Submenus Suspensos (Dropdown)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Opções que aparecem quando o mouse passa sobre este item no topo da loja.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddSub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Submenu</span>
                    </button>
                  </div>

                  {itemSubOptions.length > 0 ? (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                      {itemSubOptions.map((sub, sIdx) => (
                        <div
                          key={sub.id || sIdx}
                          className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{sub.label}</span>
                            <span className="text-[10px] text-slate-400">
                              ({sub.type}: {sub.value})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubOption(sIdx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] italic text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                      Sem submenus. O clique no item abrirá direto o destino principal.
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Salvar Item' : 'Adicionar ao Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SECUNDÁRIO: ADICIONAR SUBMENU SUSPENSO */}
      {subModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Adicionar Submenu</h4>
              <button
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubOption} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Texto do Submenu *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Blazers em Alfaiataria, Ver Todos..."
                  value={subLabel}
                  onChange={(e) => setSubLabel(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Tipo de Destino
                </label>
                <select
                  value={subType}
                  onChange={(e) => {
                    setSubType(e.target.value as any);
                    if (e.target.value === 'category') setSubValue(categories[0]?.nome || '');
                    if (e.target.value === 'status') setSubValue('Lançamento');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="category">Categoria</option>
                  <option value="subcategory">Subcategoria</option>
                  <option value="status">Coleção / Status</option>
                  <option value="link">Link Personalizado</option>
                </select>
              </div>

              {subType === 'category' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={subValue}
                    onChange={(e) => setSubValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {subType === 'subcategory' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Subcategoria
                  </label>
                  <select
                    value={subValue}
                    onChange={(e) => setSubValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {allSubcategories.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {subType === 'status' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Coleção / Status
                  </label>
                  <select
                    value={subValue}
                    onChange={(e) => setSubValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Lançamento">Lançamento 2026</option>
                    <option value="Mais Vendidos">Mais Vendidos</option>
                    <option value="OUTLET">OUTLET</option>
                    <option value="Últimas Peças">Últimas Peças</option>
                  </select>
                </div>
              )}

              {subType === 'link' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: /cliente"
                    value={subCustomUrl}
                    onChange={(e) => setSubCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Confirmar Submenu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
