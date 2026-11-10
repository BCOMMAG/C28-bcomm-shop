'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Store,
  ChevronDown,
  ExternalLink,
  ArrowUpRight,
  LogOut,
  Search,
  Check,
  RefreshCw,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { getAllStores, StoreTenant } from '@/lib/super-admin';

export function MasterImpersonationBar() {
  const router = useRouter();
  const { currentTenant, switchTenant, isMaster } = useStore();
  const [stores, setStores] = useState<StoreTenant[]>([]);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStores, setLoadingStores] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carrega todas as lojas do SaaS para o alternador
  useEffect(() => {
    let isMounted = true;
    async function loadStores() {
      if (!isMaster) return;
      setLoadingStores(true);
      try {
        const data = await getAllStores();
        if (isMounted) {
          setStores(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar lojas para o seletor Master:', err);
      } finally {
        if (isMounted) setLoadingStores(false);
      }
    }
    loadStores();
    return () => {
      isMounted = false;
    };
  }, [isMaster]);

  if (!isMaster) {
    return null;
  }

  const handleSelectStore = async (store: StoreTenant) => {
    try {
      setSwitching(true);
      await switchTenant(store as any);
      setIsOpenDropdown(false);
    } catch (err) {
      console.error('Erro ao alternar de loja:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleExitMasterMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bcomm_impersonated_tenant_id');
      localStorage.removeItem('bcomm_impersonated_tenant_slug');
      localStorage.removeItem('bcomm_master_active');
    }
    router.push('/super-admin/lojas/');
  };

  const filteredStores = stores.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nome.toLowerCase().includes(term) ||
      s.slug.toLowerCase().includes(term) ||
      (s.dominio_proprio && s.dominio_proprio.toLowerCase().includes(term))
    );
  });

  const storefrontUrl = currentTenant?.dominio_proprio
    ? `https://${currentTenant.dominio_proprio}`
    : `/${currentTenant?.slug || 'leidy-boutique'}/`;

  if (isCollapsed) {
    return (
      <div className="fixed top-2 right-4 z-50 animate-fade-in print:hidden">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/95 hover:bg-black text-amber-400 border border-amber-500/50 rounded-full shadow-2xl text-xs font-bold cursor-pointer transition-all hover:scale-105 backdrop-blur-md"
          title="Restaurar barra Master God Mode"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Master Mode: <strong>{currentTenant?.nome}</strong></span>
          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 border-b border-amber-500/40 shadow-xl px-3 sm:px-6 py-2 select-none relative z-50 print:hidden text-xs">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Esquerda: Badge Master God Mode + Dropdown de Troca de Loja */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px] text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Master Ativo (God Mode)</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Seletor Dropdown de Lojas da Rede SaaS */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpenDropdown((prev) => !prev)}
              disabled={switching}
              className="flex items-center gap-2 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/50 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Clique para alternar instantaneamente entre lojas do SaaS"
            >
              <Store className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="font-semibold max-w-[160px] sm:max-w-[220px] truncate">
                {switching ? 'Alternando boutique...' : currentTenant?.nome || 'Selecionar Loja'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">({currentTenant?.slug})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpenDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popover Flutuante */}
            {isOpenDropdown && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-50 animate-fade-in backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Alternador Global de Boutiques
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {stores.length} loja(s)
                  </span>
                </div>

                {/* Campo de Busca Rápida */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, slug ou domínio..."
                    className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 font-sans"
                    autoFocus
                  />
                </div>

                {/* Lista de Lojas */}
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {loadingStores ? (
                    <div className="py-6 text-center text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Carregando lojas da rede...</span>
                    </div>
                  ) : filteredStores.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-xs">
                      Nenhuma loja encontrada para &quot;{searchTerm}&quot;.
                    </div>
                  ) : (
                    filteredStores.map((store) => {
                      const isCurrent = store.id === currentTenant?.id || store.slug === currentTenant?.slug;
                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSelectStore(store)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                              : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-bold text-white">
                                {store.nome}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                  store.ativo
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {store.ativo ? 'Online' : 'Pausada'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>/{store.slug}</span>
                              {store.dominio_proprio && (
                                <span className="text-[#38BDF8] truncate max-w-[120px]">
                                  • {store.dominio_proprio}
                                </span>
                              )}
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 text-center">
                  <Link
                    href="/super-admin/lojas/"
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center justify-center gap-1"
                  >
                    Gerenciar todas as lojas no Super Admin <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Ações Rápidas (Abrir Vitrine, Super Admin, Encerrar, Minimizar) */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Abrir Vitrine Pública da loja atual */}
          <Link
            href={storefrontUrl}
            target="_blank"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Abrir catálogo público desta loja em nova aba"
          >
            <ExternalLink className="w-3 h-3 text-[#38BDF8]" />
            <span className="hidden sm:inline">Vitrine Pública</span>
          </Link>

          {/* Console Super Admin */}
          <Link
            href="/super-admin/lojas/"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 transition-colors"
            title="Voltar ao console geral do SaaS"
          >
            <span>Super Admin</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          {/* Sair do Modo Master */}
          <button
            type="button"
            onClick={handleExitMasterMode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors cursor-pointer"
            title="Sair do modo Master e retornar ao Super Admin"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sair do Master</span>
          </button>

          {/* Botão Minimizar */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra para o canto"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

