'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Sparkles,
  Sliders,
  FolderTree,
  Tag
} from 'lucide-react';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
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
    id: 'cupons',
    label: 'Cupons & Descontos',
    subtitle: 'Campanhas & Códigos Promocionais',
    href: '/admin/loja/cupons',
    icon: Tag,
    badge: 'Promo'
  },
  {
    id: 'categorias',
    label: 'Categorias & Subs',
    subtitle: 'Taxonomia & Catálogo',
    href: '/admin/loja/categorias',
    icon: FolderTree,
    badge: 'Estrutura'
  },
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
  }
];

export default function LojaVirtualHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { requestNavigation } = useAdminUnsavedChanges();

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
          BARRA DE SUBMENUS / ABAS SUPERIORES (TABS BAR)
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
          {STORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              pathname?.startsWith(tab.href + '/') ||
              (pathname === '/admin/loja' && tab.id === 'cupons');

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

