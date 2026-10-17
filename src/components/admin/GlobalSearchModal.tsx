'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Package,
  ShoppingBag,
  Users,
  Tag,
  DollarSign,
  Sparkles,
  Settings,
  Store,
  ArrowRight,
  Clock,
  ExternalLink,
  Layers
} from 'lucide-react';
import { globalAdminSearch, GlobalSearchResult } from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaSlug: string;
}

export function GlobalSearchModal({ isOpen, onClose, lojaSlug }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult>({
    produtos: [],
    pedidos: [],
    clientes: []
  });
  const [loading, setLoading] = useState(false);

  // Foco automático ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults({ produtos: [], pedidos: [], clientes: [] });
    }
  }, [isOpen]);

  // Listener para fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounce da busca
  useEffect(() => {
    if (!query.trim()) {
      setResults({ produtos: [], pedidos: [], clientes: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await globalAdminSearch(DEFAULT_TENANT_ID, query);
        setResults(res);
      } catch (err) {
        console.error('Erro na busca rápida:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  if (!isOpen) return null;

  const hasSearchTerm = query.trim().length > 0;
  const hasResults =
    results.produtos.length > 0 ||
    results.pedidos.length > 0 ||
    results.clientes.length > 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop para fechar ao clicar fora */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Caixa de Diálogo Spotlight */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Barra de Entrada de Busca */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-amber-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite para buscar peças, pedidos, clientes ou navegação rápida..."
            className="flex-1 bg-transparent border-none text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200/80 text-slate-600 border border-slate-300">
            ESC
          </span>
        </div>

        {/* Corpo de Resultados / Ações */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Buscando no banco de dados...</span>
            </div>
          )}

          {!loading && hasSearchTerm && !hasResults && (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Nenhum resultado encontrado para &quot;{query}&quot;</p>
              <p className="text-[11px]">Tente buscar por nome da peça, código de pedido ou nome da cliente.</p>
            </div>
          )}

          {/* 1. SEÇÃO DE RESULTADOS: PRODUTOS */}
          {!loading && results.produtos.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Catálogo de Peças ({results.produtos.length})
              </span>
              <div className="space-y-1.5">
                {results.produtos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate(`/admin/produtos/`)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 border border-transparent hover:border-amber-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-11 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 relative">
                        {p.foto_principal ? (
                          <Image src={p.foto_principal} alt={p.nome} fill sizes="36px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                            Foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-amber-900">
                          {p.nome}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {p.categoria} &bull; {p.slug}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 font-serif-luxury">
                        {formatCurrency(p.preco)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. SEÇÃO DE RESULTADOS: PEDIDOS */}
          {!loading && results.pedidos.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Pedidos Recentes ({results.pedidos.length})
              </span>
              <div className="space-y-1.5">
                {results.pedidos.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleNavigate(`/admin/pedidos/`)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          #{o.numero_pedido} &bull; {o.cliente_nome}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Status: <span className="font-semibold text-slate-700">{o.status}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(o.total)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. SEÇÃO DE RESULTADOS: CLIENTES */}
          {!loading && results.clientes.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Clientes & CRM ({results.clientes.length})
              </span>
              <div className="space-y-1.5">
                {results.clientes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(`/admin/clientes/`)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {c.nome}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {c.telefone} &bull; {c.total_compras} pedidos
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-emerald-800">
                        LTV: {formatCurrency(c.valor_total_gasto)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. ATALHOS RÁPIDOS DO SISTEMA (Aparecem quando o input está vazio) */}
          {!hasSearchTerm && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Acesso Rápido & Módulos
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    title: 'Cadastrar Nova Peça',
                    desc: 'Subir fotos R2 e grade de cor/tamanho',
                    href: '/admin/produtos/',
                    icon: Package,
                    color: 'text-amber-700 bg-amber-50 border-amber-200'
                  },
                  {
                    title: 'Central de Pedidos',
                    desc: 'Expedição Correios e Romaneio',
                    href: '/admin/pedidos/',
                    icon: ShoppingBag,
                    color: 'text-sky-700 bg-sky-50 border-sky-200'
                  },
                  {
                    title: 'DRE & Lucro Real',
                    desc: 'Demonstrativo e CMV da boutique',
                    href: '/admin/financas/',
                    icon: DollarSign,
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  },
                  {
                    title: 'Clientes & Dossiê VIP',
                    desc: 'Histórico de compras e LTV',
                    href: '/admin/clientes/',
                    icon: Users,
                    color: 'text-purple-700 bg-purple-50 border-purple-200'
                  },
                  {
                    title: 'Cupons & Descontos',
                    desc: 'Gerenciar códigos promocionais',
                    href: '/admin/cupons/',
                    icon: Tag,
                    color: 'text-rose-700 bg-rose-50 border-rose-200'
                  },
                  {
                    title: 'Banners Hero & Topbar',
                    desc: 'Mídia 16:9 e 9:16 da vitrine',
                    href: '/admin/banners/',
                    icon: Sparkles,
                    color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
                  },
                  {
                    title: 'Configurações & Chave PIX',
                    desc: 'Regra de frete e 6 paletas visuais',
                    href: '/admin/configuracoes/',
                    icon: Settings,
                    color: 'text-slate-700 bg-slate-100 border-slate-300'
                  },
                  {
                    title: 'Abrir Vitrine Pública',
                    desc: 'Visualizar loja aberta ao vivo',
                    href: `/?loja=${lojaSlug}`,
                    external: true,
                    icon: Store,
                    color: 'text-amber-800 bg-amber-100/60 border-amber-300'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      onClick={() => {
                        if (item.external) {
                          window.open(item.href, '_blank');
                        } else {
                          handleNavigate(item.href);
                        }
                      }}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-amber-900">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                        </div>
                      </div>
                      {item.external ? (
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 shrink-0" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Spotlight com Dicas */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Pressione <strong className="font-mono text-slate-700">ESC</strong> para fechar
            </span>
            <span>&bull;</span>
            <span>
              Atalho rápido: <strong className="font-mono text-slate-700">Ctrl + K</strong>
            </span>
          </div>
          <span className="font-semibold text-amber-800">Spotlight BCOMM Admin</span>
        </div>
      </div>
    </div>
  );
}
