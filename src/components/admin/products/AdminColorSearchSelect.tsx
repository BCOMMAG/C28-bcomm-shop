'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, Check, ChevronDown, Palette, X, AlertCircle } from 'lucide-react';

export interface BoutiqueColorItem {
  nome: string;
  hex?: string;
}

interface AdminColorSearchSelectProps {
  selectedColorName: string;
  selectedColorHex?: string;
  onSelectColor: (colorName: string, colorHex: string) => void;
  availableColors: BoutiqueColorItem[];
  label?: string;
  className?: string;
}

export function AdminColorSearchSelect({
  selectedColorName,
  selectedColorHex = '#1A1918',
  onSelectColor,
  availableColors,
  label,
  className = ''
}: AdminColorSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#1A1918');
  const [confirmColorModal, setConfirmColorModal] = useState<BoutiqueColorItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreatingCustom(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco no input de busca ao abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lista unificada e deduplicada de cores
  const deduplicatedColors = useMemo(() => {
    const map = new Map<string, BoutiqueColorItem>();
    availableColors.forEach((c) => {
      if (c && c.nome) {
        const key = c.nome.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { nome: c.nome.trim(), hex: c.hex || '#1A1918' });
        }
      }
    });
    return Array.from(map.values());
  }, [availableColors]);

  // Cores filtradas pela busca
  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deduplicatedColors;
    return deduplicatedColors.filter(
      (c) => c.nome.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q))
    );
  }, [deduplicatedColors, search]);

  // Detecção inteligente de cores parecidas para evitar duplicações (ex: "off" -> "Off-White")
  const similarColors = useMemo(() => {
    const raw = customName.trim().toLowerCase();
    if (raw.length < 2) return [];

    const cleanRaw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

    return deduplicatedColors
      .filter((c) => {
        const cLower = c.nome.trim().toLowerCase();
        const cleanC = cLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

        if (cleanC === cleanRaw) return true;
        if (cleanC.includes(cleanRaw) || cleanRaw.includes(cleanC)) return true;
        if (cleanC.startsWith(cleanRaw) || cleanRaw.startsWith(cleanC)) return true;
        return false;
      })
      .slice(0, 4);
  }, [customName, deduplicatedColors]);

  const activeColor = useMemo(() => {
    if (!selectedColorName) return null;
    return (
      deduplicatedColors.find(
        (c) => c.nome.toLowerCase() === selectedColorName.toLowerCase()
      ) || {
        nome: selectedColorName,
        hex: selectedColorHex || '#1A1918'
      }
    );
  }, [deduplicatedColors, selectedColorName, selectedColorHex]);

  const handleSelect = (c: BoutiqueColorItem) => {
    onSelectColor(c.nome, c.hex || '#1A1918');
    setIsOpen(false);
    setIsCreatingCustom(false);
    setSearch('');
  };

  const handleSaveCustom = () => {
    const rawTrimmed = customName.trim();
    if (!rawTrimmed) return;

    // Normaliza e verifica se já existe cor idêntica (case-insensitive ou sem acentos)
    const existing = deduplicatedColors.find(
      (c) => c.nome.trim().toLowerCase() === rawTrimmed.toLowerCase()
    );

    const nomeFinal = existing ? existing.nome : (rawTrimmed.charAt(0).toUpperCase() + rawTrimmed.slice(1));
    const hexFinal = existing ? (existing.hex || customHex || '#1A1918') : (customHex || '#1A1918');

    onSelectColor(nomeFinal, hexFinal);
    setIsOpen(false);
    setIsCreatingCustom(false);
    setSearch('');
    setCustomName('');
    setCustomHex('#1A1918');
  };

  // Helper para anel de contraste em cores claras
  const isLightColor = (hex?: string) => {
    if (!hex) return false;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 210;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-slate-700 text-xs mb-1 font-bold">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2.5 p-2 bg-white border border-slate-300 rounded-xl text-left hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Swatch da cor selecionada */}
          <span
            className="w-7 h-7 rounded-lg shrink-0 shadow-2xs transition-transform group-hover:scale-105 border border-black/15 relative overflow-hidden"
            style={{ backgroundColor: activeColor?.hex || selectedColorHex || '#1A1918' }}
          >
            {isLightColor(activeColor?.hex || selectedColorHex || '#1A1918') && (
              <span className="absolute inset-0 border border-slate-300/80 rounded-lg pointer-events-none" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs truncate">
                {activeColor?.nome || 'Selecione uma Cor...'}
              </span>
              {(activeColor?.hex || selectedColorHex) && (
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {activeColor?.hex || selectedColorHex}
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[380px]">
          {/* Header com Busca */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cor pelo nome ou #hex..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-normal"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Ação para Criar Nova Cor Personalizada */}
            {!isCreatingCustom && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustom(true);
                  if (search.trim()) setCustomName(search.trim());
                }}
                className="w-full py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {search.trim()
                    ? `+ Cadastrar "${search.trim()}" como Nova Cor`
                    : '+ Cadastrar Nova Cor Personalizada'}
                </span>
              </button>
            )}
          </div>

          {/* Mini-Formulário de Criação Customizada */}
          {isCreatingCustom && (
            <div className="p-3 bg-amber-50/60 border-b border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  Nova Cor Personalizada
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Nome da Cor
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Marsala, Cru..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Tom / Código Hex
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="w-8 h-7.5 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      placeholder="#000000"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-mono text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Alerta Inteligente de Cores Semelhantes / Duplicadas */}
              {similarColors.length > 0 && (
                <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Cores parecidas já cadastradas na boutique:</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Evite cadastrar variações duplicadas (como maiúsculas/minúsculas). Clique para usar:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {similarColors.map((sc) => (
                      <button
                        key={sc.nome}
                        type="button"
                        onClick={() => setConfirmColorModal(sc)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-200 text-amber-950 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        title={`Clique para usar a cor existente "${sc.nome}"`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-md border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: sc.hex }}
                        />
                        <span>{sc.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveCustom}
                disabled={!customName.trim()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Concluir e Usar Esta Cor
              </button>
            </div>
          )}

          {/* Lista de Cores com Swatches Reais em CSS */}
          <div className="overflow-y-auto max-h-[240px] p-1.5 space-y-1 divide-y divide-slate-100">
            {filteredColors.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                Nenhuma cor encontrada com &ldquo;{search}&rdquo;.
              </div>
            ) : (
              filteredColors.map((c) => {
                const isSelected =
                  selectedColorName.toLowerCase() === c.nome.toLowerCase();
                const light = isLightColor(c.hex);

                return (
                  <button
                    key={c.nome}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 border border-amber-300/80'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Swatch Real CSS em Alta Resolução e Maior Nitidez */}
                      <span
                        className="w-7 h-7 rounded-lg shrink-0 border border-black/20 shadow-xs relative overflow-hidden"
                        style={{ backgroundColor: c.hex }}
                      >
                        {light && (
                          <span className="absolute inset-0 border border-slate-300/80 rounded-lg pointer-events-none" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs block truncate ${
                            isSelected
                              ? 'font-black text-amber-950'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {c.nome}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {c.hex}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal / Pop-up de Confirmação para Reuso de Cor Existente */}
      {confirmColorModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-start gap-3">
              <span
                className="w-9 h-9 rounded-xl border border-black/20 shrink-0 shadow-xs mt-0.5 overflow-hidden"
                style={{ backgroundColor: confirmColorModal.hex }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Deseja usar a cor &ldquo;{confirmColorModal.nome}&rdquo;?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Esta cor já está cadastrada na loja ({confirmColorModal.hex}). Clicando em &ldquo;Usar Cor Existente&rdquo;, você evita variações repetidas com grafias parecidas na peça.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmColorModal(null)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectColor(confirmColorModal.nome, confirmColorModal.hex || '#1A1918');
                  setConfirmColorModal(null);
                  setIsOpen(false);
                  setIsCreatingCustom(false);
                  setSearch('');
                  setCustomName('');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Usar {confirmColorModal.nome}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
