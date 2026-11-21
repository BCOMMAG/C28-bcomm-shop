'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Pipette,
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
  Filter,
  X,
  Layers,
  Package,
  CheckSquare,
  Square,
  Info,
  ExternalLink,
  Tag,
  Merge
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID, BOUTIQUE_OFFICIAL_COLORS } from '@/lib/products';
import {
  getStoreCustomAttributes,
  getAdminProducts,
  saveStoreCustomAttribute,
  renameStoreColor,
  deleteStoreColors,
  mergeStoreColors,
  AdminProductItem,
  StoreCustomAttributes
} from '@/lib/admin';
import { useAdminI18n } from '@/context/AdminI18nContext';

interface BoutiqueColorEntry {
  nome: string;
  hex: string;
}

export default function StoreColorsManagementPage() {
  const { currentTenant, refreshProducts } = useStore();
  const { t } = useAdminI18n();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [storeColors, setStoreColors] = useState<BoutiqueColorEntry[]>([]);
  const [allProducts, setAllProducts] = useState<AdminProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterUsage, setFilterUsage] = useState<'todos' | 'em_uso' | 'sem_uso'>('todos');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1A1918');

  const [editingColor, setEditingColor] = useState<BoutiqueColorEntry | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('#1A1918');
  const [editUpdateProducts, setEditUpdateProducts] = useState(true);

  const [colorToDelete, setColorToDelete] = useState<{
    nome: string;
    hex: string;
    count: number;
    productNames: string[];
  } | null>(null);

  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeTargetName, setMergeTargetName] = useState('');
  const [mergeTargetHex, setMergeTargetHex] = useState('#1A1918');

  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carregamento de dados
  const loadData = async () => {
    setLoading(true);
    try {
      const [attrs, prods] = await Promise.all([
        getStoreCustomAttributes(tenantId).catch(() => null),
        getAdminProducts(tenantId).catch(() => [])
      ]);

      const map = new Map<string, { nome: string; hex: string }>();

      // 1. Cores do catálogo da loja
      if (attrs?.cores && Array.isArray(attrs.cores)) {
        attrs.cores.forEach((c: any) => {
          if (typeof c === 'string') {
            const clean = c.trim();
            if (clean) {
              const canonical = clean.charAt(0).toUpperCase() + clean.slice(1);
              map.set(clean.toLowerCase(), { nome: canonical, hex: '#1A1918' });
            }
          } else if (c && c.nome) {
            const clean = String(c.nome).trim();
            if (clean) {
              const canonical = clean.charAt(0).toUpperCase() + clean.slice(1);
              map.set(clean.toLowerCase(), { nome: canonical, hex: c.hex || '#1A1918' });
            }
          }
        });
      }

      // 2. Cores das variações dos produtos
      (prods || []).forEach((p) => {
        if (p.variacoes && Array.isArray(p.variacoes)) {
          p.variacoes.forEach((v: any) => {
            const clean = (v.cor_nome || '').trim();
            if (clean) {
              const canonical = clean.charAt(0).toUpperCase() + clean.slice(1);
              if (!map.has(clean.toLowerCase())) {
                map.set(clean.toLowerCase(), { nome: canonical, hex: v.cor_hex || '#1A1918' });
              }
            }
          });
        }
      });

      // 3. Paleta oficial da boutique como fallback inicial se a lista estiver vazia
      if (map.size === 0) {
        BOUTIQUE_OFFICIAL_COLORS.forEach((c) => {
          map.set(c.nome.toLowerCase(), { nome: c.nome, hex: c.hex });
        });
      }

      const list = Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
      setStoreColors(list);
      setAllProducts(prods || []);
    } catch (err: any) {
      console.error('Erro ao carregar cores:', err);
      showToast('Falha ao carregar catálogo de cores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Mapeamento do uso de cada cor nas peças da loja
  const colorUsageMap = useMemo(() => {
    const map = new Map<string, { count: number; products: Array<{ id: string; nome: string }> }>();

    storeColors.forEach((cor) => {
      map.set(cor.nome.toLowerCase(), { count: 0, products: [] });
    });

    allProducts.forEach((p) => {
      const colorsInProd = new Set<string>();
      if (p.variacoes && Array.isArray(p.variacoes)) {
        p.variacoes.forEach((v: any) => {
          const cName = (v.cor_nome || '').trim().toLowerCase();
          if (cName) colorsInProd.add(cName);
        });
      }

      colorsInProd.forEach((cName) => {
        let entry = map.get(cName);
        if (!entry) {
          entry = { count: 0, products: [] };
          map.set(cName, entry);
        }
        entry.count += 1;
        entry.products.push({ id: p.id, nome: p.nome });
      });
    });

    return map;
  }, [storeColors, allProducts]);

  // Lista filtrada
  const filteredColors = useMemo(() => {
    let list = storeColors;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.nome.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)
      );
    }

    if (filterUsage === 'em_uso') {
      list = list.filter((c) => {
        const usage = colorUsageMap.get(c.nome.toLowerCase());
        return (usage?.count || 0) > 0;
      });
    } else if (filterUsage === 'sem_uso') {
      list = list.filter((c) => {
        const usage = colorUsageMap.get(c.nome.toLowerCase());
        return !usage || usage.count === 0;
      });
    }

    return list;
  }, [storeColors, search, filterUsage, colorUsageMap]);

  // Helper para contraste de cores claras
  const isLightColor = (hex?: string) => {
    if (!hex) return false;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 215;
  };

  // Copiar HEX
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Criar nova cor
  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newColorName.trim();
    if (!cleanName) {
      showToast('Digite o nome da cor.', 'error');
      return;
    }

    const canonical = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const exists = storeColors.some((c) => c.nome.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      showToast(`A cor "${canonical}" já existe no catálogo da boutique.`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await saveStoreCustomAttribute(tenantId, 'cores' as any, { nome: canonical, hex: newColorHex }, 'add');
      showToast(`Cor "${canonical}" cadastrada com sucesso no catálogo!`);
      setIsCreateModalOpen(false);
      setNewColorName('');
      setNewColorHex('#1A1918');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar cor.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar edição
  const handleOpenEdit = (color: BoutiqueColorEntry) => {
    setEditingColor(color);
    setEditName(color.nome);
    setEditHex(color.hex || '#1A1918');
    setEditUpdateProducts(true);
  };

  // Salvar edição
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColor) return;
    const cleanNewName = editName.trim();
    if (!cleanNewName) {
      showToast('Digite o nome da cor.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await renameStoreColor(
        tenantId,
        editingColor.nome,
        cleanNewName,
        editHex,
        editUpdateProducts
      );

      if (res.success) {
        showToast(
          res.updatedProductsCount && res.updatedProductsCount > 0
            ? `Cor atualizada e ${res.updatedProductsCount} variação(ões) em peças sincronizadas!`
            : 'Cor atualizada com sucesso no catálogo!'
        );
        setEditingColor(null);
        await loadData();
        try {
          await refreshProducts();
        } catch {}
      } else {
        showToast(res.error || 'Erro ao atualizar cor.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar exclusão individual
  const handleOpenDelete = (color: BoutiqueColorEntry) => {
    const usage = colorUsageMap.get(color.nome.toLowerCase());
    setColorToDelete({
      nome: color.nome,
      hex: color.hex,
      count: usage?.count || 0,
      productNames: (usage?.products || []).map((p) => p.nome)
    });
  };

  // Confirmar exclusão individual
  const handleConfirmDelete = async () => {
    if (!colorToDelete) return;
    setIsProcessing(true);
    try {
      const res = await deleteStoreColors(tenantId, [colorToDelete.nome]);
      if (res.success) {
        showToast(`Cor "${colorToDelete.nome}" removida do catálogo universal.`);
        setColorToDelete(null);
        setSelectedNames((prev) => prev.filter((n) => n !== colorToDelete.nome));
        await loadData();
      } else {
        showToast(res.error || 'Erro ao excluir cor.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar exclusão em massa
  const handleConfirmBulkDelete = async () => {
    if (selectedNames.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await deleteStoreColors(tenantId, selectedNames);
      if (res.success) {
        showToast(`${selectedNames.length} cor(es) removida(s) do catálogo universal.`);
        setIsBulkDeleteModalOpen(false);
        setSelectedNames([]);
        await loadData();
      } else {
        showToast(res.error || 'Erro ao excluir cores selecionadas.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar mesclagem de cores selecionadas
  const handleOpenMerge = () => {
    if (selectedNames.length < 2) {
      showToast('Selecione pelo menos 2 cores para mesclar.', 'error');
      return;
    }
    const first = storeColors.find((c) => c.nome.toLowerCase() === selectedNames[0].toLowerCase());
    setMergeTargetName(first ? first.nome : selectedNames[0]);
    setMergeTargetHex(first ? first.hex : '#1A1918');
    setIsMergeModalOpen(true);
  };

  // Confirmar mesclagem
  const handleConfirmMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeTargetName.trim() || selectedNames.length < 2) return;

    setIsProcessing(true);
    try {
      const res = await mergeStoreColors(
        tenantId,
        selectedNames,
        { nome: mergeTargetName.trim(), hex: mergeTargetHex }
      );

      if (res.success) {
        showToast(
          res.migratedCount && res.migratedCount > 0
            ? `Cores mescladas em "${mergeTargetName}" e ${res.migratedCount} variação(ões) migradas com sucesso!`
            : `Cores unificadas com sucesso em "${mergeTargetName}"!`
        );
        setIsMergeModalOpen(false);
        setSelectedNames([]);
        await loadData();
        try {
          await refreshProducts();
        } catch {}
      } else {
        showToast(res.error || 'Erro ao mesclar cores.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Seleção em massa
  const handleToggleSelectAll = () => {
    if (selectedNames.length === filteredColors.length) {
      setSelectedNames([]);
    } else {
      setSelectedNames(filteredColors.map((c) => c.nome));
    }
  };

  const handleToggleSelect = (nome: string) => {
    setSelectedNames((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  };

  // Presets rápidos para criação/edição
  const quickPalettePresets = [
    { nome: 'Preto Clássico', hex: '#1A1918' },
    { nome: 'Branco Off-White', hex: '#FAF9F6' },
    { nome: 'Rosa Quartz', hex: '#E8A598' },
    { nome: 'Dourado Champagne', hex: '#DFBE76' },
    { nome: 'Bege Areia Nobre', hex: '#E2D3B8' },
    { nome: 'Marrom Caramelo', hex: '#8B5A2B' },
    { nome: 'Terracota Nobre', hex: '#C05A46' },
    { nome: 'Verde Esmeralda', hex: '#1B4D3E' },
    { nome: 'Verde Matcha', hex: '#6B8E23' },
    { nome: 'Azul Serenity', hex: '#92A1CF' },
    { nome: 'Azul Marinho', hex: '#000080' },
    { nome: 'Bordô Marsala', hex: '#6B1D2F' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950 border-red-500/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER DA PÁGINA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-serif-luxury tracking-tight">
                Catálogo & Gestão de Cores
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                {storeColors.length} cores cadastradas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerencie a paleta universal da boutique: crie novas cores, ajuste nomes, tonalidades e unifique duplicadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Recarregar catálogo de cores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Peças</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Cor</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS: BUSCA, FILTRO E AÇÕES EM MASSA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cor por nome (ex: Off-White, Marsala) ou #HEX..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-medium transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de Uso */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setFilterUsage('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterUsage === 'todos'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({storeColors.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterUsage('em_uso')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterUsage === 'em_uso'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Uso
            </button>
            <button
              type="button"
              onClick={() => setFilterUsage('sem_uso')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterUsage === 'sem_uso'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem Peças
            </button>
          </div>
        </div>

        {/* BARRA DE AÇÕES EM MASSA QUANDO HOUVER SELEÇÃO */}
        {selectedNames.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
              <CheckSquare className="w-4 h-4 text-amber-700" />
              <span>{selectedNames.length} cor(es) selecionada(s)</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedNames.length >= 2 && (
                <button
                  type="button"
                  onClick={handleOpenMerge}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 font-bold text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  <Merge className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mesclar em Uma Só</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionadas</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNames([])}
                className="text-xs text-slate-500 hover:text-slate-700 underline font-semibold ml-1 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTAGEM DE CORES */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span className="text-xs font-medium">Carregando catálogo de cores da loja...</span>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs space-y-3">
          <Palette className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Nenhuma cor encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? `Nenhum resultado para "${search}". Tente outro termo.`
              : 'Nenhuma cor cadastrada no momento.'}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Primeira Cor</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredColors.length > 0 && selectedNames.length === filteredColors.length
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 w-16 text-center">Amostra</th>
                  <th className="py-3.5 px-4">Nome da Cor</th>
                  <th className="py-3.5 px-4">Código HEX</th>
                  <th className="py-3.5 px-4">Uso no Estoque</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredColors.map((color) => {
                  const isSelected = selectedNames.includes(color.nome);
                  const usage = colorUsageMap.get(color.nome.toLowerCase());
                  const usedCount = usage?.count || 0;
                  const isLight = isLightColor(color.hex);

                  return (
                    <tr
                      key={color.nome}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Checkbox de seleção */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(color.nome)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Swatch visual da cor */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-block relative">
                          <span
                            className="w-8 h-8 rounded-xl block border border-black/15 shadow-2xs relative overflow-hidden"
                            style={{ backgroundColor: color.hex || '#1A1918' }}
                          >
                            {isLight && (
                              <span className="absolute inset-0 border border-slate-300/80 rounded-xl pointer-events-none" />
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Nome da Cor */}
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <span>{color.nome}</span>
                          {BOUTIQUE_OFFICIAL_COLORS.some(
                            (b) => b.nome.toLowerCase() === color.nome.toLowerCase()
                          ) && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">
                              Oficial
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Código HEX com botão de copiar */}
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleCopyHex(color.hex)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                          title="Clique para copiar código HEX"
                        >
                          <span>{color.hex.toUpperCase()}</span>
                          {copiedHex === color.hex ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Badge de Uso */}
                      <td className="py-3 px-4">
                        {usedCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {usedCount} {usedCount === 1 ? 'peça vinculada' : 'peças vinculadas'}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-[11px]">
                            Disponível (sem peças)
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(color)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition-all cursor-pointer shadow-2xs"
                            title="Editar nome ou tonalidade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(color)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-red-400 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 transition-all cursor-pointer shadow-2xs"
                            title="Excluir cor do catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR NOVA COR                                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif-luxury">
                  Cadastrar Nova Cor na Boutique
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColor} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Cor:
                </label>
                <input
                  type="text"
                  required
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Ex: Marsala Nobre, Rosa Quartz, Mostarda..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Seletor de Tonalidade HEX */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tonalidade & Código HEX:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#1A1918"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span
                    className="w-9 h-9 rounded-xl border border-black/15 shadow-2xs shrink-0"
                    style={{ backgroundColor: newColorHex }}
                  />
                </div>
              </div>

              {/* Presets Rápidos */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Sugestões Rápidas de Tonalidades:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickPalettePresets.map((p) => (
                    <button
                      key={p.nome}
                      type="button"
                      onClick={() => {
                        if (!newColorName) setNewColorName(p.nome);
                        setNewColorHex(p.hex);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100/60 border border-slate-200 flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: p.hex }} />
                      <span>{p.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Salvando...' : 'Salvar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR COR COM PROPAGAÇÃO EM CASCATA                                */}
      {/* ========================================================================= */}
      {editingColor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif-luxury">
                  Editar Cor: {editingColor.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingColor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Cor:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Tonalidade HEX */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código HEX:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editHex}
                    onChange={(e) => setEditHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={editHex}
                    onChange={(e) => setEditHex(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span
                    className="w-9 h-9 rounded-xl border border-black/15 shadow-2xs shrink-0"
                    style={{ backgroundColor: editHex }}
                  />
                </div>
              </div>

              {/* Checkbox de Atualização em Cascata */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUpdateProducts}
                    onChange={(e) => setEditUpdateProducts(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Atualizar automaticamente nas peças existentes
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Sincroniza o novo nome e tom em todas as peças que usam "{editingColor.nome}" no estoque e vitrine da loja.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingColor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO INDIVIDUAL                                      */}
      {/* ========================================================================= */}
      {colorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 pb-2 border-b border-slate-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base font-serif-luxury">
                Excluir Cor do Catálogo?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você tem certeza que deseja remover a cor <strong>"{colorToDelete.nome}"</strong> do catálogo universal da boutique?
            </p>

            {colorToDelete.count > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  Atenção: Esta cor está vinculada a {colorToDelete.count} peça(s):
                </span>
                <p className="text-[11px] text-amber-800 leading-tight">
                  {colorToDelete.productNames.slice(0, 3).join(', ')}
                  {colorToDelete.productNames.length > 3 ? ` e mais ${colorToDelete.productNames.length - 3}...` : ''}
                </p>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Ao remover, ela deixará de aparecer como opção para novas peças, mas o estoque das peças existentes não será apagado.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setColorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXCLUSÃO EM MASSA                                                  */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 pb-2 border-b border-slate-100">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base font-serif-luxury">
                Excluir {selectedNames.length} Cores Selecionadas?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja remover as seguintes cores do catálogo universal da boutique?
            </p>

            <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 space-y-1">
              {selectedNames.map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{n}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Excluindo...' : `Excluir ${selectedNames.length} Cores`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MESCLAR / UNIFICAR CORES DUPLICADAS                                */}
      {/* ========================================================================= */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Merge className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif-luxury">
                  Mesclar Cores Selecionadas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMerge} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Você selecionou <strong>{selectedNames.length} cores</strong> para unificar:
              </p>

              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {selectedNames.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 font-bold text-[11px]"
                  >
                    {n}
                  </span>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Final Unificado:
                </label>
                <input
                  type="text"
                  required
                  value={mergeTargetName}
                  onChange={(e) => setMergeTargetName(e.target.value)}
                  placeholder="Ex: Off-White"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código HEX Final:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={mergeTargetHex}
                    onChange={(e) => setMergeTargetHex(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={mergeTargetHex}
                    onChange={(e) => setMergeTargetHex(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900 text-[11px]">
                <span className="font-bold block">✨ O que acontecerá:</span>
                <p>
                  Todas as variações de peças que usavam qualquer uma das {selectedNames.length} cores serão automaticamente migradas para <strong>"{mergeTargetName}"</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Mesclando...' : 'Confirmar Mesclagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

