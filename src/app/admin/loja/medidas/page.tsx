'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ruler,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Scissors,
  Layers,
  ArrowUp,
  ArrowDown,
  Info,
  Sliders,
  CheckCircle2,
  X,
  ExternalLink,
  MessageCircle,
  Eye
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSizeGuide,
  saveStoreSizeGuide,
  getStoreCustomAttributes,
  saveStoreSizesList,
  saveStoreSizeGrids,
  DEFAULT_STORE_SIZE_GUIDE,
  DEFAULT_STORE_SIZE_GRIDS,
  LojaGuiaMedidas,
  TabelaMedidasLinha,
  GradePredefinida
} from '@/lib/admin';

export default function StoreSizesAndMeasurementsPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tabela' | 'tamanhos' | 'grades' | 'provador'>('tabela');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados do Guia de Medidas (Aba 1 & Aba 4)
  const [guiaMedidas, setGuiaMedidas] = useState<LojaGuiaMedidas>(DEFAULT_STORE_SIZE_GUIDE);

  // Estados dos Tamanhos Oficiais (Aba 2)
  const [tamanhosList, setTamanhosList] = useState<string[]>([]);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Estados das Grades Rápidas (Aba 3)
  const [gradesList, setGradesList] = useState<GradePredefinida[]>([]);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState<GradePredefinida | null>(null);
  const [gridName, setGridName] = useState('');
  const [gridSelectedSizes, setGridSelectedSizes] = useState<string[]>([]);

  // Modal de Edição de Linha de Medida
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TabelaMedidasLinha | null>(null);
  const [rowTamanho, setRowTamanho] = useState('');
  const [rowManequim, setRowManequim] = useState('');
  const [rowBusto, setRowBusto] = useState('');
  const [rowCintura, setRowCintura] = useState('');
  const [rowQuadril, setRowQuadril] = useState('');
  const [rowComprimento, setRowComprimento] = useState('');
  const [rowBustoMin, setRowBustoMin] = useState<number | ''>('');
  const [rowBustoMax, setRowBustoMax] = useState<number | ''>('');
  const [rowCinturaMin, setRowCinturaMin] = useState<number | ''>('');
  const [rowCinturaMax, setRowCinturaMax] = useState<number | ''>('');
  const [rowQuadrilMin, setRowQuadrilMin] = useState<number | ''>('');
  const [rowQuadrilMax, setRowQuadrilMax] = useState<number | ''>('');
  const [rowIsAdaptavel, setRowIsAdaptavel] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carregar dados da loja
  const loadData = async () => {
    setLoading(true);
    try {
      const [guideData, attrsData] = await Promise.all([
        getStoreSizeGuide(tenantId),
        getStoreCustomAttributes(tenantId)
      ]);

      setGuiaMedidas(guideData);
      setTamanhosList(attrsData.tamanhos || []);
      setGradesList(attrsData.grades_predefinidas || DEFAULT_STORE_SIZE_GRIDS);
    } catch (err) {
      console.error('Falha ao carregar dados de medidas:', err);
      showToast('Erro ao carregar dados da loja.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // ==========================================
  // HANDLERS: GUIA DE MEDIDAS (ABA 1)
  // ==========================================
  const handleSaveSizeGuide = async () => {
    setSaving(true);
    try {
      const res = await saveStoreSizeGuide(tenantId, guiaMedidas);
      if (res.success) {
        showToast('Tabela do Guia de Medidas salva com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar guia de medidas.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaultGuide = () => {
    if (confirm('Deseja restaurar a tabela de medidas para os valores padrão oficiais da boutique?')) {
      setGuiaMedidas(DEFAULT_STORE_SIZE_GUIDE);
      showToast('Valores padrão restaurados! Clique em "Salvar Alterações" para confirmar.');
    }
  };

  const handleOpenRowModal = (row?: TabelaMedidasLinha) => {
    if (row) {
      setEditingRow(row);
      setRowTamanho(row.tamanho);
      setRowManequim(row.manequim);
      setRowBusto(row.busto);
      setRowCintura(row.cintura);
      setRowQuadril(row.quadril);
      setRowComprimento(row.comprimento || '');
      setRowBustoMin(row.busto_min ?? '');
      setRowBustoMax(row.busto_max ?? '');
      setRowCinturaMin(row.cintura_min ?? '');
      setRowCinturaMax(row.cintura_max ?? '');
      setRowQuadrilMin(row.quadril_min ?? '');
      setRowQuadrilMax(row.quadril_max ?? '');
      setRowIsAdaptavel(row.is_adaptavel ?? false);
    } else {
      setEditingRow(null);
      setRowTamanho('');
      setRowManequim('');
      setRowBusto('');
      setRowCintura('');
      setRowQuadril('');
      setRowComprimento('');
      setRowBustoMin('');
      setRowBustoMax('');
      setRowCinturaMin('');
      setRowCinturaMax('');
      setRowQuadrilMin('');
      setRowQuadrilMax('');
      setRowIsAdaptavel(false);
    }
    setIsRowModalOpen(true);
  };

  const handleSaveRow = () => {
    if (!rowTamanho.trim()) {
      showToast('Informe o nome do tamanho (ex: P, M, 38).', 'error');
      return;
    }

    const updatedRow: TabelaMedidasLinha = {
      id: editingRow ? editingRow.id : `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tamanho: rowTamanho.trim(),
      manequim: rowManequim.trim() || '-',
      busto: rowBusto.trim() || '-',
      cintura: rowCintura.trim() || '-',
      quadril: rowQuadril.trim() || '-',
      comprimento: rowComprimento.trim() || undefined,
      busto_min: rowBustoMin !== '' ? Number(rowBustoMin) : undefined,
      busto_max: rowBustoMax !== '' ? Number(rowBustoMax) : undefined,
      cintura_min: rowCinturaMin !== '' ? Number(rowCinturaMin) : undefined,
      cintura_max: rowCinturaMax !== '' ? Number(rowCinturaMax) : undefined,
      quadril_min: rowQuadrilMin !== '' ? Number(rowQuadrilMin) : undefined,
      quadril_max: rowQuadrilMax !== '' ? Number(rowQuadrilMax) : undefined,
      is_adaptavel: rowIsAdaptavel
    };

    setGuiaMedidas((prev) => {
      let newLinhas: TabelaMedidasLinha[];
      if (editingRow) {
        newLinhas = prev.linhas.map((r) => (r.id === editingRow.id ? updatedRow : r));
      } else {
        newLinhas = [...prev.linhas, updatedRow];
      }
      return { ...prev, linhas: newLinhas };
    });

    setIsRowModalOpen(false);
    showToast(editingRow ? 'Linha de medida atualizada!' : 'Nova linha de medida adicionada!');
  };

  const handleDeleteRow = (id: string) => {
    setGuiaMedidas((prev) => ({
      ...prev,
      linhas: prev.linhas.filter((r) => r.id !== id)
    }));
    showToast('Linha removida da tabela.');
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    setGuiaMedidas((prev) => {
      const newLinhas = [...prev.linhas];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newLinhas.length) return prev;
      const temp = newLinhas[index];
      newLinhas[index] = newLinhas[targetIndex];
      newLinhas[targetIndex] = temp;
      return { ...prev, linhas: newLinhas };
    });
  };

  // ==========================================
  // HANDLERS: TAMANHOS OFICIAIS (ABA 2)
  // ==========================================
  const handleAddSize = () => {
    const clean = newSizeInput.trim().toUpperCase();
    if (!clean) return;
    if (tamanhosList.includes(clean)) {
      showToast(`O tamanho "${clean}" já se encontra cadastrado.`, 'error');
      return;
    }
    setTamanhosList((prev) => [...prev, clean]);
    setNewSizeInput('');
    showToast(`Tamanho "${clean}" adicionado à lista!`);
  };

  const handleRemoveSize = (tam: string) => {
    setTamanhosList((prev) => prev.filter((t) => t !== tam));
    showToast(`Tamanho "${tam}" removido.`);
  };

  const handleMoveSize = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tamanhosList.length) return;
    const updated = [...tamanhosList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTamanhosList(updated);
  };

  const handleSaveSizesList = async () => {
    setSaving(true);
    try {
      const res = await saveStoreSizesList(tenantId, tamanhosList);
      if (res.success) {
        showToast('Catálogo de tamanhos oficiais salvo com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar tamanhos.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha ao salvar lista de tamanhos.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HANDLERS: GRADES RÁPIDAS (ABA 3)
  // ==========================================
  const handleOpenGridModal = (grid?: GradePredefinida) => {
    if (grid) {
      setEditingGrid(grid);
      setGridName(grid.nome);
      setGridSelectedSizes([...grid.tamanhos]);
    } else {
      setEditingGrid(null);
      setGridName('');
      setGridSelectedSizes([]);
    }
    setIsGridModalOpen(true);
  };

  const handleToggleGridSize = (tam: string) => {
    setGridSelectedSizes((prev) =>
      prev.includes(tam) ? prev.filter((t) => t !== tam) : [...prev, tam]
    );
  };

  const handleSaveGrid = () => {
    if (!gridName.trim()) {
      showToast('Informe o nome da grade rápida (ex: Grade P, M, G).', 'error');
      return;
    }
    if (gridSelectedSizes.length === 0) {
      showToast('Selecione ao menos um tamanho para esta grade.', 'error');
      return;
    }

    const updatedGrid: GradePredefinida = {
      id: editingGrid ? editingGrid.id : `grid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nome: gridName.trim(),
      tamanhos: gridSelectedSizes
    };

    let newGrades: GradePredefinida[];
    if (editingGrid) {
      newGrades = gradesList.map((g) => (g.id === editingGrid.id ? updatedGrid : g));
    } else {
      newGrades = [...gradesList, updatedGrid];
    }

    setGradesList(newGrades);
    setIsGridModalOpen(false);
    showToast(editingGrid ? 'Grade rápida atualizada!' : 'Nova grade rápida criada!');
  };

  const handleDeleteGrid = (id: string) => {
    setGradesList((prev) => prev.filter((g) => g.id !== id));
    showToast('Grade rápida removida.');
  };

  const handleSaveAllGrids = async () => {
    setSaving(true);
    try {
      const res = await saveStoreSizeGrids(tenantId, gradesList);
      if (res.success) {
        showToast('Grades rápidas salvas com sucesso! Já disponíveis no cadastro de produtos.');
      } else {
        showToast(res.error || 'Erro ao salvar grades.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha ao salvar grades rápidas.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-none shadow-xl border text-sm font-semibold transition-all duration-300 animate-slideUp ${
            toast.type === 'success'
              ? 'bg-[#1A1918] text-[#FAF8F5] border-[#C5A059]'
              : 'bg-rose-900 text-white border-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
          ) : (
            <Info className="w-5 h-5 text-rose-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header com Identidade Visual & Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C5A059]/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
              Guia & Caimento
            </span>
            <span className="text-xs text-neutral-500 font-medium">Catálogo & Modelagem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2.5">
            <Ruler className="w-7 h-7 text-[#C5A059]" />
            Tamanhos & Guia de Medidas
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
            Configure as medidas em centímetros para as peças da sua loja, gerencie os tamanhos oficiais da boutique e crie grades rápidas para acelerar o cadastro de estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tabela' && (
            <button
              onClick={handleSaveSizeGuide}
              disabled={saving}
              className="py-2.5 px-5 bg-[#1A1918] dark:bg-[#FAF8F5] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C5A059] dark:text-[#1A1918]" />
              <span>{saving ? 'Salvando...' : 'Salvar Guia de Medidas'}</span>
            </button>
          )}

          {activeTab === 'tamanhos' && (
            <button
              onClick={handleSaveSizesList}
              disabled={saving}
              className="py-2.5 px-5 bg-[#1A1918] dark:bg-[#FAF8F5] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C5A059] dark:text-[#1A1918]" />
              <span>{saving ? 'Salvando...' : 'Salvar Tamanhos Oficiais'}</span>
            </button>
          )}

          {activeTab === 'grades' && (
            <button
              onClick={handleSaveAllGrids}
              disabled={saving}
              className="py-2.5 px-5 bg-[#1A1918] dark:bg-[#FAF8F5] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C5A059] dark:text-[#1A1918]" />
              <span>{saving ? 'Salvando...' : 'Salvar Grades Rápidas'}</span>
            </button>
          )}

          {activeTab === 'provador' && (
            <button
              onClick={handleSaveSizeGuide}
              disabled={saving}
              className="py-2.5 px-5 bg-[#1A1918] dark:bg-[#FAF8F5] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C5A059] dark:text-[#1A1918]" />
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex border-b border-[#C5A059]/25 text-xs font-bold uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setActiveTab('tabela')}
          className={`py-3 px-5 border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'tabela'
              ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>1. Tabela em Centímetros</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {guiaMedidas.linhas.length} tamanhos
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tamanhos')}
          className={`py-3 px-5 border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'tamanhos'
              ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Padrões de Tamanhos da Loja</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {tamanhosList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`py-3 px-5 border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'grades'
              ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Grades Rápidas (Atalhos de Estoque)</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {gradesList.length} grades
          </span>
        </button>

        <button
          onClick={() => setActiveTab('provador')}
          className={`py-3 px-5 border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'provador'
              ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>4. Provador Virtual & Dicas de Caimento</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-500 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <span>Carregando configurações de medidas da boutique...</span>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* ABA 1: TABELA EM CENTÍMETROS DO GUIA DE MEDIDAS           */}
          {/* ======================================================== */}
          {activeTab === 'tabela' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Card de Configurações Básicas do Cabeçalho */}
              <div className="bg-white dark:bg-[#1E1B19] border border-[#C5A059]/25 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guiaMedidas.ativo !== false}
                        onChange={(e) =>
                          setGuiaMedidas((prev) => ({ ...prev, ativo: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#25D366]"></div>
                    </label>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                        Guia de Medidas Ativo na Loja
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Exibe o link "Guia de Medidas" nas páginas e modais de produtos do catálogo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultGuide}
                      className="py-2 px-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Padrão Boutique</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRowModal()}
                      className="py-2 px-3.5 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Tamanho na Tabela</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Título do Guia de Medidas
                    </label>
                    <input
                      type="text"
                      value={guiaMedidas.titulo || ''}
                      onChange={(e) =>
                        setGuiaMedidas((prev) => ({ ...prev, titulo: e.target.value }))
                      }
                      placeholder="Ex: Guia de Medidas & Caimento Interativo"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Subtítulo Explicativo
                    </label>
                    <input
                      type="text"
                      value={guiaMedidas.subtitulo || ''}
                      onChange={(e) =>
                        setGuiaMedidas((prev) => ({ ...prev, subtitulo: e.target.value }))
                      }
                      placeholder="Ex: Encontre o tamanho ideal com caimento impecável para seu biotipo"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* Tabela Interativa de Medidas */}
              <div className="overflow-x-auto border border-[#C5A059]/30 bg-white dark:bg-[#1E1B19] shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F3EB] dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] uppercase tracking-wider font-semibold border-b border-[#C5A059]/25">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Ordem</th>
                      <th className="py-3 px-4">Tamanho</th>
                      <th className="py-3 px-4">Manequim</th>
                      <th className="py-3 px-4">Busto (cm)</th>
                      <th className="py-3 px-4">Cintura (cm)</th>
                      <th className="py-3 px-4">Quadril (cm)</th>
                      <th className="py-3 px-4">Comprimento / Obs</th>
                      <th className="py-3 px-4 text-center">Calibração Provador</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C5A059]/15 text-[#57534E] dark:text-[#D6D3D1]">
                    {guiaMedidas.linhas.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#FAF8F5] dark:hover:bg-[#252220]/60 transition-colors ${
                          row.is_adaptavel ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveRow(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:text-[#C5A059] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRow(idx, 'down')}
                              disabled={idx === guiaMedidas.linhas.length - 1}
                              className="p-1 hover:text-[#C5A059] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{row.tamanho}</span>
                            {row.is_adaptavel && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 uppercase">
                                Adaptável
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                          {row.manequim}
                        </td>

                        <td className="py-3 px-4">{row.busto}</td>
                        <td className="py-3 px-4">{row.cintura}</td>
                        <td className="py-3 px-4">{row.quadril}</td>
                        <td className="py-3 px-4 text-neutral-500">
                          {row.comprimento || '-'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {row.busto_min || row.cintura_min || row.quadril_min ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              Calibrado
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400">
                              {row.is_adaptavel ? 'Automático' : 'Manual'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenRowModal(row)}
                              className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-[#C5A059] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Editar medidas deste tamanho"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Excluir este tamanho da tabela"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dica de Caimento da Boutique */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-[#C5A059]/30 text-xs text-[#57534E] dark:text-[#D6D3D1] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                  <Scissors className="w-4 h-4 text-[#C5A059]" />
                  <span>Dica de Caimento Exibida no Rodapé da Tabela:</span>
                </div>
                <textarea
                  rows={2}
                  value={guiaMedidas.dica_caimento || ''}
                  onChange={(e) =>
                    setGuiaMedidas((prev) => ({ ...prev, dica_caimento: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-[#C5A059]/40 bg-white dark:bg-[#1E1B19] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059] text-xs leading-relaxed"
                  placeholder="Ex: Se suas medidas ficarem entre dois tamanhos, recomendamos escolher..."
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: PADRÕES DE TAMANHOS OFICIAIS DA LOJA               */}
          {/* ======================================================== */}
          {activeTab === 'tamanhos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-[#1E1B19] border border-[#C5A059]/25 p-5 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                    Adicionar Novo Tamanho Oficial
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Cadastre os tamanhos que sua boutique trabalha para que apareçam como opções padrão no cadastro de produtos e grades.
                  </p>
                </div>

                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSize()}
                    placeholder="Ex: XGG, 34, 48, G1, Tam Único..."
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white text-xs rounded-none focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="py-2 px-4 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Lista Ordenada de Tamanhos */}
              <div className="bg-white dark:bg-[#1E1B19] border border-[#C5A059]/25 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#C5A059]" />
                    <span>Tamanhos Cadastrados ({tamanhosList.length})</span>
                  </h4>
                  <span className="text-xs text-neutral-500">
                    Use as setas para definir a ordem em que aparecem no catálogo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {tamanhosList.map((tam, idx) => (
                    <div
                      key={tam}
                      className="flex items-center justify-between p-2.5 bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 group hover:border-[#C5A059] transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[11px] font-mono text-neutral-400">
                          #{idx + 1}
                        </span>
                        <strong className="text-xs font-bold text-[#1A1918] dark:text-[#FAF8F5] truncate">
                          {tam}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveSize(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-neutral-400 hover:text-[#C5A059] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Mover para esquerda/anterior"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSize(idx, 'down')}
                          disabled={idx === tamanhosList.length - 1}
                          className="p-1 text-neutral-400 hover:text-[#C5A059] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Mover para direita/próximo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(tam)}
                          className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          title="Excluir tamanho"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: GRADES RÁPIDAS (ATALHOS DE ESTOQUE)                 */}
          {/* ======================================================== */}
          {activeTab === 'grades' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                    Grades Pré-definidas para Cadastro Rápido de Peças
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Essas grades aparecem como botões na seção de variações de estoque para adicionar múltiplos tamanhos com um clique.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenGridModal()}
                  className="py-2 px-3.5 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Grade Rápida</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradesList.map((grid) => (
                  <div
                    key={grid.id}
                    className="p-4 bg-white dark:bg-[#1E1B19] border border-[#C5A059]/30 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-sm text-[#1A1918] dark:text-[#FAF8F5]">
                          {grid.nome}
                        </h5>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenGridModal(grid)}
                            className="p-1.5 text-neutral-500 hover:text-[#C5A059] transition-colors cursor-pointer"
                            title="Editar grade rápida"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGrid(grid.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir grade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {grid.tamanhos.map((tam) => (
                          <span
                            key={tam}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 text-[#1A1918] dark:text-[#FAF8F5]"
                          >
                            {tam}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
                      <span>{grid.tamanhos.length} tamanho(s) nesta grade</span>
                      <span className="text-[#C5A059] font-medium">Disponível no cadastro de peças</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: PROVADOR VIRTUAL & DICAS DE CAIMENTO              */}
          {/* ======================================================== */}
          {activeTab === 'provador' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Opções de Ativação */}
              <div className="bg-white dark:bg-[#1E1B19] border border-[#C5A059]/25 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>Provador Virtual Inteligente no Catálogo</span>
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Permite que as clientes insiram suas medidas de busto, cintura e quadril para receberem a recomendação exata de tamanho.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guiaMedidas.provador_virtual_ativo !== false}
                      onChange={(e) =>
                        setGuiaMedidas((prev) => ({
                          ...prev,
                          provador_virtual_ativo: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>Botão de Dúvidas via WhatsApp no Guia</span>
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Exibe no rodapé do modal do guia de medidas o botão "Consultar Consultora no WhatsApp".
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guiaMedidas.whatsapp_duvidas_ativo !== false}
                      onChange={(e) =>
                        setGuiaMedidas((prev) => ({
                          ...prev,
                          whatsapp_duvidas_ativo: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
              </div>

              {/* Informação sobre como a calibração funciona */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Como o Provador Virtual calcula a recomendação?</span>
                </div>
                <p className="leading-relaxed">
                  Quando a cliente arrasta a régua ou digita suas medidas no modal, o sistema compara os centímetros de Busto, Cintura e Quadril com as faixas mínimas e máximas configuradas na sua <strong>Tabela em Centímetros</strong> (Aba 1). Dessa forma, a recomendação se adapta 100% à modelagem das roupas da sua loja!
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR / EDITAR LINHA DA TABELA DE MEDIDAS       */}
      {/* ======================================================== */}
      {isRowModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1E1B19] border border-[#C5A059]/40 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-serif-luxury text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#C5A059]" />
                <span>{editingRow ? 'Editar Linha de Medida' : 'Adicionar Linha de Medida'}</span>
              </h3>
              <button
                onClick={() => setIsRowModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tamanho *
                </label>
                <input
                  type="text"
                  value={rowTamanho}
                  onChange={(e) => setRowTamanho(e.target.value)}
                  placeholder="Ex: P, M, 38, Tam Único"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Manequim
                </label>
                <input
                  type="text"
                  value={rowManequim}
                  onChange={(e) => setRowManequim(e.target.value)}
                  placeholder="Ex: 36 - 38 ou 40"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Comprimento (opcional)
                </label>
                <input
                  type="text"
                  value={rowComprimento}
                  onChange={(e) => setRowComprimento(e.target.value)}
                  placeholder="Ex: 105 cm ou Midi"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="col-span-2 sm:col-span-3 pt-2">
                <span className="block font-bold uppercase tracking-wider text-[11px] text-[#C5A059] mb-2">
                  Medidas Exibidas na Tabela (Texto para o Cliente):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-neutral-500 mb-1">Busto</label>
                    <input
                      type="text"
                      value={rowBusto}
                      onChange={(e) => setRowBusto(e.target.value)}
                      placeholder="Ex: 84 - 88 cm"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Cintura</label>
                    <input
                      type="text"
                      value={rowCintura}
                      onChange={(e) => setRowCintura(e.target.value)}
                      placeholder="Ex: 66 - 70 cm"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Quadril</label>
                    <input
                      type="text"
                      value={rowQuadril}
                      onChange={(e) => setRowQuadril(e.target.value)}
                      placeholder="Ex: 92 - 96 cm"
                      className="w-full px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-3 pt-2">
                <span className="block font-bold uppercase tracking-wider text-[11px] text-neutral-700 dark:text-neutral-300 mb-2">
                  Faixas Numéricas para o Provador Virtual (cm mínimo e máximo):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="font-semibold block text-[11px]">Busto Min/Max</span>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rowBustoMin}
                        onChange={(e) => setRowBustoMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Min"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                      <input
                        type="number"
                        value={rowBustoMax}
                        onChange={(e) => setRowBustoMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Max"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="font-semibold block text-[11px]">Cintura Min/Max</span>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rowCinturaMin}
                        onChange={(e) => setRowCinturaMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Min"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                      <input
                        type="number"
                        value={rowCinturaMax}
                        onChange={(e) => setRowCinturaMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Max"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="font-semibold block text-[11px]">Quadril Min/Max</span>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rowQuadrilMin}
                        onChange={(e) => setRowQuadrilMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Min"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                      <input
                        type="number"
                        value={rowQuadrilMax}
                        onChange={(e) => setRowQuadrilMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Max"
                        className="w-full px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rowIsAdaptavel}
                    onChange={(e) => setRowIsAdaptavel(e.target.checked)}
                    className="accent-[#C5A059]"
                  />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Marcar como modelagem adaptável / Tamanho Único (com elasticidade para múltiplos biotipos)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsRowModalOpen(false)}
                className="py-2 px-4 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRow}
                className="py-2 px-5 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                Salvar na Tabela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CRIAR / EDITAR GRADE RÁPIDA DE ESTOQUE             */}
      {/* ======================================================== */}
      {isGridModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1B19] border border-[#C5A059]/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-serif-luxury text-lg font-bold text-[#1A1918] dark:text-[#FAF8F5] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C5A059]" />
                <span>{editingGrid ? 'Editar Grade Rápida' : 'Nova Grade Rápida'}</span>
              </h3>
              <button
                onClick={() => setIsGridModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome da Grade Rápida *
                </label>
                <input
                  type="text"
                  value={gridName}
                  onChange={(e) => setGridName(e.target.value)}
                  placeholder="Ex: Grade P, M, G ou Grade Numérica 36 ao 44"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#252220] text-neutral-900 dark:text-white rounded-none focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Selecione os tamanhos que compõem esta grade:
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-neutral-200 dark:border-neutral-800 bg-[#FAF8F5] dark:bg-[#252220]">
                  {tamanhosList.map((tam) => {
                    const isSelected = gridSelectedSizes.includes(tam);
                    return (
                      <button
                        key={tam}
                        type="button"
                        onClick={() => handleToggleGridSize(tam)}
                        className={`py-1.5 px-2 text-xs font-semibold border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A1918] dark:bg-white text-white dark:text-[#1A1918] border-[#1A1918] dark:border-white'
                            : 'bg-white dark:bg-[#1E1B19] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-[#C5A059]'
                        }`}
                      >
                        {tam}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  {gridSelectedSizes.length} tamanho(s) selecionado(s)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsGridModalOpen(false)}
                className="py-2 px-4 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGrid}
                className="py-2 px-5 bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                Salvar Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

