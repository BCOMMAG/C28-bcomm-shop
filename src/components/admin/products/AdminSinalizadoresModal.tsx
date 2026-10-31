'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Tag,
  Palette,
  Eye,
  Check
} from 'lucide-react';
import { CustomSinalizador, saveStoreSinalizadores, getStoreCustomAttributes } from '@/lib/admin';

interface AdminSinalizadoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  initialSinalizadores?: CustomSinalizador[];
  onUpdated?: (updatedList: CustomSinalizador[]) => void;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

const PALETA_SUGERIDA = [
  { nome: 'Ouro Nobre', hex: '#C5A059' },
  { nome: 'Dourado Quente', hex: '#DFBE76' },
  { nome: 'Rubi / Outlet', hex: '#E11D48' },
  { nome: 'Terracota / Escassez', hex: '#8B5A2B' },
  { nome: 'Púrpura Imperial', hex: '#9333EA' },
  { nome: 'Esmeralda', hex: '#059669' },
  { nome: 'Safira Luxo', hex: '#0284C7' },
  { nome: 'Preto Nobre', hex: '#1A1918' },
  { nome: 'Caramelo', hex: '#B45309' },
  { nome: 'Rosa Quartz', hex: '#DB2777' }
];

const PRESETS_RAPIDOS = [
  { nome: 'Alta Costura', icone: '✨', cor: '#C5A059' },
  { nome: 'Peça Exclusiva', icone: '💎', cor: '#0284C7' },
  { nome: 'Linho Puro', icone: '🌿', cor: '#059669' },
  { nome: 'Edição Limitada', icone: '👑', cor: '#7C3AED' },
  { nome: 'Frete Grátis', icone: '🚚', cor: '#10B981' }
];

export function AdminSinalizadoresModal({
  isOpen,
  onClose,
  tenantId,
  initialSinalizadores = [],
  onUpdated,
  onToast
}: AdminSinalizadoresModalProps) {
  const [sinalizadores, setSinalizadores] = useState<CustomSinalizador[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoIcone, setNovoIcone] = useState('✨');
  const [novaCor, setNovaCor] = useState('#C5A059');

  useEffect(() => {
    if (isOpen) {
      if (initialSinalizadores.length > 0) {
        setSinalizadores([...initialSinalizadores]);
      } else {
        getStoreCustomAttributes(tenantId).then((res) => {
          setSinalizadores(res.sinalizadores || []);
        });
      }
    }
  }, [isOpen, initialSinalizadores, tenantId]);

  if (!isOpen) return null;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast(msg, type === 'info' ? 'success' : type);
  };

  const handleUpdateItem = (idx: number, patch: Partial<CustomSinalizador>) => {
    setSinalizadores((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveCustom = (id: string) => {
    setSinalizadores((prev) => prev.filter((item) => item.id !== id));
    showToast('Sinalizador removido da lista!', 'info');
  };

  const handleAddNovo = (nome?: string, icone?: string, cor?: string) => {
    const finalNome = (nome || novoNome).trim();
    if (!finalNome) {
      showToast('Digite um nome para o novo sinalizador.', 'error');
      return;
    }

    const finalIcone = icone || novoIcone || '✨';
    const finalCor = cor || novaCor || '#C5A059';
    const slugId = `badge_${finalNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    const novoItem: CustomSinalizador = {
      id: slugId,
      nome: finalNome,
      label: finalNome,
      icone: finalIcone,
      icon: finalIcone,
      cor: finalCor,
      color: finalCor,
      textColor: '#ffffff',
      ativo: true,
      ordem: sinalizadores.length + 1,
      isSystem: false
    };

    setSinalizadores((prev) => [...prev, novoItem]);
    setNovoNome('');
    setNovoIcone('✨');
    showToast(`Sinalizador "${finalNome}" adicionado!`, 'success');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveStoreSinalizadores(tenantId, sinalizadores);
      if (onUpdated) onUpdated(res.sinalizadores);
      showToast('Configurações globais de sinalizadores salvas com sucesso!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar sinalizadores da loja.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-700">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif-luxury">
                Gerenciamento Global de Sinalizadores (Badges)
              </h3>
              <p className="text-[11px] text-slate-500">
                Altere cores, ícones e nomes oficiais. As alterações refletem imediatamente na vitrine e nos produtos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          {/* Seção 1: Sinalizadores Atuais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Sinalizadores Configurados ({sinalizadores.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Os 4 sinalizadores do sistema são protegidos para garantir a integridade dos dados.
              </span>
            </div>

            <div className="space-y-2.5">
              {sinalizadores.map((s, idx) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border transition-all ${
                    s.ativo !== false
                      ? 'border-slate-200 bg-white hover:border-amber-300 shadow-2xs'
                      : 'border-dashed border-slate-200 bg-slate-50/70 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Lado Esquerdo: Ícone, Nome e Badge Preview */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Ícone */}
                      <input
                        type="text"
                        value={s.icone || s.icon || '✨'}
                        onChange={(e) => handleUpdateItem(idx, { icone: e.target.value, icon: e.target.value })}
                        title="Emoji ou Ícone"
                        className="w-9 h-9 text-center bg-slate-50 border border-slate-300 rounded-lg text-base shrink-0 focus:bg-white"
                      />

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={s.nome || s.label || ''}
                          onChange={(e) => handleUpdateItem(idx, { nome: e.target.value, label: e.target.value })}
                          placeholder="Nome do sinalizador..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white"
                        />
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {s.isSystem ? (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 rounded">
                              Sistema (Core)
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 rounded">
                              Personalizado
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">id: {s.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Seletor de Cor, Preview na Vitrine e Ações */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {/* Seletor de Cor */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <input
                          type="color"
                          value={s.cor || s.color || '#C5A059'}
                          onChange={(e) => handleUpdateItem(idx, { cor: e.target.value, color: e.target.value })}
                          className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent shrink-0"
                          title="Escolha a cor do badge"
                        />
                        <input
                          type="text"
                          value={s.cor || s.color || '#C5A059'}
                          onChange={(e) => handleUpdateItem(idx, { cor: e.target.value, color: e.target.value })}
                          className="w-16 bg-transparent text-[10px] font-mono font-bold text-slate-700 uppercase focus:outline-none"
                        />
                      </div>

                      {/* Prévia Como Aparece no Card da Vitrine */}
                      <div
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded shadow-xs flex items-center gap-1 shrink-0"
                        style={{
                          backgroundColor: s.cor || s.color || '#C5A059',
                          color: s.textColor || '#ffffff'
                        }}
                        title="Prévia exata do badge na vitrine da loja"
                      >
                        <span>{s.icone || s.icon || '✨'}</span>
                        <span className="truncate max-w-[100px]">{s.nome || 'Badge'}</span>
                      </div>

                      {/* Switch Ativo/Inativo */}
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={s.ativo !== false}
                          onChange={(e) => handleUpdateItem(idx, { ativo: e.target.checked })}
                          className="accent-amber-600 rounded"
                        />
                        <span className="hidden sm:inline">{s.ativo !== false ? 'Ativo' : 'Oculto'}</span>
                      </label>

                      {/* Excluir se for customizado */}
                      {!s.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustom(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Excluir sinalizador personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Criar Novo Sinalizador */}
          <div className="pt-4 space-y-3">
            <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              Criar Novo Sinalizador Comercial
            </h5>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Ícone</label>
                  <input
                    type="text"
                    value={novoIcone}
                    onChange={(e) => setNovoIcone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center text-sm"
                    placeholder="✨"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome do Sinalizador</label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Alta Costura, Exclusivo, Linho Puro..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor Oficial</label>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1">
                    <input
                      type="color"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Adicionar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">Sugestões rápidas:</span>
                  {PRESETS_RAPIDOS.map((p) => (
                    <button
                      key={p.nome}
                      type="button"
                      onClick={() => handleAddNovo(p.nome, p.icone, p.cor)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-800 cursor-pointer transition-colors"
                    >
                      {p.icone} {p.nome}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddNovo()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar à Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            As alterações são salvas na loja e refletidas instantaneamente na vitrine.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salvar Alterações Globais</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
