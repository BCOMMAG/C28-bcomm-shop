'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Sparkles,
  Sliders,
  FolderTree,
  Store,
  ExternalLink,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { getStorefrontUrl } from '@/lib/routes';
import { cn } from '@/lib/chart-utils';

interface StoreTabItem {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const STORE_TABS: StoreTabItem[] = [
  {
    id: 'aparencia',
    label: 'Aparência da Loja',
    subtitle: 'Logo, Cores, Fundos & Seções',
    href: '/admin/loja/aparencia',
    icon: Palette,
    badge: 'Visual'
  },
  {
    id: 'banners',
    label: 'Banners & Vitrines',
    subtitle: 'Hero Banners & Avisos',
    href: '/admin/loja/banners',
    icon: Sparkles,
    badge: 'Mídia'
  },
  {
    id: 'menu',
    label: 'Menus da Vitrine',
    subtitle: 'Cabeçalho & Navegação',
    href: '/admin/loja/menu',
    icon: Sliders,
    badge: 'Links'
  },
  {
    id: 'categorias',
    label: 'Categorias & Subs',
    subtitle: 'Taxonomia & Catálogo',
    href: '/admin/loja/categorias',
    icon: FolderTree,
    badge: 'Estrutura'
  }
];

export default function LojaVirtualHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentTenant } = useStore();
  const { requestNavigation } = useAdminUnsavedChanges();

  const lojaSlug = currentTenant?.slug || '';
  const lojaNome = currentTenant?.nome || 'Loja Virtual';
  const storefrontUrl = getStorefrontUrl({ slug: lojaSlug });

  const handleProtectedNav = (e: React.MouseEvent, href: string) => {
    if (href === pathname) return;
    const allowed = requestNavigation(href);
    if (!allowed) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          CABEÇALHO EXECUTIVO DO HUB DE CONFIGURAÇÕES DA LOJA
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/"
              onClick={(e) => handleProtectedNav(e, '/admin/')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Painel
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Experiência do Consumidor
            </span>
            <span className="text-xs text-slate-400">• Loja: {lojaSlug}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            Configurações da Loja
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Centralize e personalize tudo o que o seu cliente enxerga na sua vitrine: identidade visual, hero banners, menus de navegação do topo e organização de categorias.
          </p>
        </div>

        {/* Botão de Atalho Rápido para Abrir a Loja ao Vivo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs border border-slate-800 transition-all cursor-pointer hover:shadow-md"
            title="Abrir o catálogo da sua loja virtual em uma nova aba para conferir as alterações"
          >
            <span>Ver Minha Loja Ao Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE SUBMENUS / ABAS SUPERIORES (TABS BAR)
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              pathname?.startsWith(tab.href + '/') ||
              (pathname === '/admin/loja' && tab.id === 'aparencia');

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => handleProtectedNav(e, tab.href)}
                className={cn(
                  'flex items-center gap-3.5 p-3 rounded-xl transition-all select-none border',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/60 hover:border-slate-300'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-xs font-bold truncate',
                        isActive ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {tab.label}
                    </span>
                    {tab.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider',
                          isActive
                            ? 'bg-white/20 text-amber-300'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-[11px] truncate mt-0.5',
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    )}
                  >
                    {tab.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CONTEÚDO DA SUBPÁGINA ATIVA SELECIONADA
          ========================================================================= */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}

