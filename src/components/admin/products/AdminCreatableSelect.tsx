'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Plus, Trash2, Check, X, Sparkles } from 'lucide-react';

interface AdminCreatableSelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  onCreateOption: (newOption: string) => Promise<boolean | void>;
  onDeleteOption?: (optToDelete: string) => Promise<boolean | void>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  emptyLabel?: string;
  className?: string;
}

export const AdminCreatableSelect: React.FC<AdminCreatableSelectProps> = ({
  label,
  value,
  options,
  onChange,
  onCreateOption,
  onDeleteOption,
  placeholder = 'Selecione ou cadastre...',
  disabled = false,
  required = false,
  emptyLabel = 'Deixar em branco',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [inlineInputValue, setInlineInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreatingInline(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Foco no campo de busca ao abrir
  useEffect(() => {
    if (isOpen && !isCreatingInline && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, isCreatingInline]);

  // Foco no input de criação
  useEffect(() => {
    if (isCreatingInline && inlineInputRef.current) {
      setTimeout(() => inlineInputRef.current?.focus(), 50);
    }
  }, [isCreatingInline]);

  // Filtra opções
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

  // Verifica se o termo digitado já existe
  const exactMatchExists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return options.some((opt) => opt.toLowerCase() === term);
  }, [options, searchTerm]);

  const handleCreateNew = async (textToCreate: string) => {
    const clean = textToCreate.trim();
    if (!clean) return;
    setIsSubmitting(true);
    try {
      await onCreateOption(clean);
      onChange(clean);
      setSearchTerm('');
      setIsCreatingInline(false);
      setInlineInputValue('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    if (!onDeleteOption) return;
    if (confirm(`Deseja realmente remover a opção "${opt}" das configurações da loja?`)) {
      await onDeleteOption(opt);
      if (value === opt) onChange('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-slate-700 mb-1 font-bold text-xs flex items-center justify-between">
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        </label>
      )}

      {/* Botão Seletor Principal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setIsCreatingInline(false);
            setSearchTerm('');
          }
        }}
        className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          isOpen
            ? 'border-amber-500 bg-white ring-2 ring-amber-500/20'
            : 'border-slate-300 hover:border-slate-400 focus:bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`truncate font-semibold ${value ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-xs animate-fade-in">
          {/* Barra de Busca */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!exactMatchExists && searchTerm.trim()) {
                      handleCreateNew(searchTerm);
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                placeholder="Buscar ou cadastrar..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 p-1">
            {/* Opção Vazia / Limpar */}
            {!required && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center justify-between text-slate-400 hover:bg-slate-50 italic ${
                  !value ? 'bg-amber-50/50 text-amber-800 font-bold' : ''
                }`}
              >
                <span>{emptyLabel}</span>
                {!value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {onDeleteOption && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, opt)}
                          title="Remover opção da loja"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-slate-400 italic">
                Nenhuma opção encontrada com &quot;{searchTerm}&quot;
              </div>
            )}
          </div>

          {/* Atalho Rápido para Criar pelo Termo de Busca */}
          {searchTerm.trim() && !exactMatchExists && (
            <div className="p-2 border-t border-slate-100 bg-amber-50/40">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateNew(searchTerm)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar &quot;{searchTerm.trim()}&quot;</span>
              </button>
            </div>
          )}

          {/* Formulário Inline de Cadastro Manual */}
          {isCreatingInline ? (
            <div className="p-2.5 border-t border-slate-100 bg-slate-50 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Cadastrar Nova Opção</span>
              <div className="flex items-center gap-1.5">
                <input
                  ref={inlineInputRef}
                  type="text"
                  value={inlineInputValue}
                  onChange={(e) => setInlineInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNew(inlineInputValue);
                    } else if (e.key === 'Escape') {
                      setIsCreatingInline(false);
                    }
                  }}
                  placeholder="Nome da nova opção..."
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={isSubmitting || !inlineInputValue.trim()}
                  onClick={() => handleCreateNew(inlineInputValue)}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInline(true);
                  setInlineInputValue(searchTerm.trim());
                }}
                className="w-full py-1.5 px-3 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Cadastrar Nova Opção</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
