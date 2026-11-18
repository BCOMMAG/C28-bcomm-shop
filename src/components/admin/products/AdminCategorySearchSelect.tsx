'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Folder,
  Search,
  ChevronDown,
  Check,
  Plus,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CategoriaNode } from '@/types/database';

export interface AdminCategorySearchSelectProps {
  label?: string;
  value: string; // categoria_id
  subcategoria?: string;
  tree: CategoriaNode[];
  fallbackList?: Array<{ id: string; nome: string }>;
  onChange: (
    catId: string,
    catNome: string,
    subcatNome?: string,
    caminhoCompleto?: string
  ) => void;
  onAddNewCategory?: (name: string, parentId?: string | null) => Promise<boolean | void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AdminCategorySearchSelect: React.FC<AdminCategorySearchSelectProps> = ({
  label,
  value,
  subcategoria,
  tree,
  fallbackList = [],
  onChange,
  onAddNewCategory,
  placeholder = 'Buscar categoria ou departamento...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
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

  // Foco no campo de busca ao abrir o dropdown
  useEffect(() => {
    if (isOpen && !isCreatingInline && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen, isCreatingInline]);

  // Foco no input de nova categoria
  useEffect(() => {
    if (isCreatingInline && inlineInputRef.current) {
      setTimeout(() => inlineInputRef.current?.focus(), 60);
    }
  }, [isCreatingInline]);

  // Encontra o nó ativo
  const activeNode = useMemo(() => {
    if (!value) return null;
    return tree.find((n) => n.id === value) || null;
  }, [value, tree]);

  // Rótulo visível no botão do combobox
  const displayLabel = useMemo(() => {
    if (activeNode) {
      if (activeNode.caminho_completo) {
        return activeNode.caminho_completo;
      }
      return `${activeNode.icone ? activeNode.icone + ' ' : ''}${activeNode.nome}`;
    }
    if (value) {
      const fb = fallbackList.find((c) => c.id === value);
      if (fb) return fb.nome;
    }
    return '';
  }, [activeNode, value, fallbackList]);

  // Lista linear de nós filtrados pela digitação do lojista
  const filteredNodes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tree;

    return tree.filter((node) => {
      const matchNome = (node.nome || '').toLowerCase().includes(term);
      const matchCaminho = (node.caminho_completo || '').toLowerCase().includes(term);
      const matchSlug = (node.slug || '').toLowerCase().includes(term);
      return matchNome || matchCaminho || matchSlug;
    });
  }, [tree, searchTerm]);

  // Verifica se o termo pesquisado bate com alguma categoria existente
  const exactMatchExists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return false;
    return tree.some((n) => n.nome.trim().toLowerCase() === term);
  }, [tree, searchTerm]);

  const handleSelectNode = (node: CategoriaNode) => {
    if (node.nivel === 0) {
      // Nó Raiz (Departamento Principal)
      onChange(node.id, node.nome, '', node.caminho_completo || node.nome);
    } else {
      // Subcategoria / Ramificação Interna
      // Define o nó selecionado e preenche a subcategoria com o nome da folha
      onChange(node.id, node.nome, node.nome, node.caminho_completo || node.nome);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNewCategory = async () => {
    const clean = newCatName.trim();
    if (!clean || !onAddNewCategory) return;
    setIsSubmitting(true);
    try {
      await onAddNewCategory(clean, newCatParentId);
      setIsCreatingInline(false);
      setNewCatName('');
      setNewCatParentId(null);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '', '', '');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-slate-700 mb-1 font-bold text-xs flex items-center justify-between">
          <span>{label}</span>
          {onAddNewCategory && !isCreatingInline && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setIsCreatingInline(true);
                setNewCatName(searchTerm || '');
              }}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Nova Categoria</span>
            </button>
          )}
        </label>
      )}

      {/* Botão Seletor Principal Estilo Combobox */}
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
        <div className="flex items-center gap-2 truncate flex-1">
          <FolderTree
            className={`w-4 h-4 shrink-0 ${
              value ? 'text-amber-600' : 'text-slate-400'
            }`}
          />
          <span
            className={`truncate font-semibold ${
              value ? 'text-slate-900' : 'text-slate-400 font-normal'
            }`}
          >
            {displayLabel || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown com Busca em Tempo Real */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] sm:min-w-[340px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Barra de Busca com Input com Foco Automático */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoria ou departamento..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Modo Criação Rápida Inline no topo do Dropdown */}
          {isCreatingInline ? (
            <div className="p-2.5 bg-amber-50/60 border-b border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Nova Categoria / Departamento
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={inlineInputRef}
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex.: Vestidos de Gala, Tricots..."
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewCategory();
                  if (e.key === 'Escape') setIsCreatingInline(false);
                }}
              />
              <div className="flex items-center gap-2">
                <select
                  value={newCatParentId || ''}
                  onChange={(e) => setNewCatParentId(e.target.value || null)}
                  className="flex-1 p-1.5 bg-white border border-slate-300 rounded-md text-[11px] text-slate-700"
                >
                  <option value="">📁 Criar como Categoria Principal (N1)</option>
                  {tree
                    .filter((n) => n.nivel === 0)
                    .map((root) => (
                      <option key={root.id} value={root.id}>
                        ↳ Subcategoria de: {root.nome}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!newCatName.trim() || isSubmitting}
                  onClick={handleCreateNewCategory}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            onAddNewCategory &&
            searchTerm.trim() &&
            !exactMatchExists && (
              <div className="p-2 border-b border-amber-100 bg-amber-50/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingInline(true);
                    setNewCatName(searchTerm.trim());
                  }}
                  className="w-full py-1.5 px-2 rounded-md bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Criar categoria &quot;<strong>{searchTerm.trim()}</strong>&quot;</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold shrink-0">Criar agora</span>
                </button>
              </div>
            )
          )}

          {/* Lista de Categorias com Scroll */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-100 scrollbar-thin">
            {filteredNodes.length > 0 ? (
              filteredNodes.map((node) => {
                const isSelected = value === node.id;
                const depth = node.nivel || 0;
                const isRoot = depth === 0;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectNode(node)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/70 text-amber-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Indentação visual para demonstrar a árvore */}
                      {depth > 0 && (
                        <div
                          className="flex items-center text-slate-300 shrink-0"
                          style={{ paddingLeft: `${(depth - 1) * 12}px` }}
                        >
                          <span className="text-[11px] font-mono select-none">↳</span>
                        </div>
                      )}

                      <span className="text-sm shrink-0">
                        {node.icone ? node.icone : isRoot ? '📁' : '🏷️'}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`truncate ${
                              isRoot ? 'font-bold text-slate-900 text-xs' : 'font-medium text-slate-700 text-xs'
                            }`}
                          >
                            {node.nome}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold tracking-wider uppercase ${
                              isRoot
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            N{depth + 1}
                          </span>
                        </div>

                        {/* Exibe o caminho completo para categorias aninhadas */}
                        {depth > 0 && node.caminho_completo && (
                          <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {node.caminho_completo}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                <Folder className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>Nenhuma categoria encontrada para &quot;{searchTerm}&quot;</p>
                {onAddNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(true);
                      setNewCatName(searchTerm.trim());
                    }}
                    className="mt-2 text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer text-xs"
                  >
                    + Criar nova categoria &quot;{searchTerm}&quot;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rodapé do Dropdown com Contador */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
            <span>
              {filteredNodes.length} de {tree.length} categorias na árvore
            </span>
            {onAddNewCategory && !isCreatingInline && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInline(true);
                  setNewCatName('');
                }}
                className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Nova Categoria
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

