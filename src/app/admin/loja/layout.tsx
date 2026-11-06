'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  Palette,
  Sparkles,
  Sliders,
  FolderTree,
  Tag,
  Truck,
  ShoppingBag,
  CreditCard,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { cn } from '@/lib/chart-utils';

interface StoreTabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const STORE_TABS: StoreTabItem[] = [
  {
    id: 'dados',
    label: 'Dados da Loja',
    href: '/admin/loja/dados',
    icon: Store
  },
  {
    id: 'aparencia',
    label: 'Aparência da Loja',
    href: '/admin/loja/aparencia',
    icon: Palette,
    badge: 'Visual'
  },
  {
    id: 'banners',
    label: 'Banners & Vitrines',
    href: '/admin/loja/banners',
    icon: Sparkles,
    badge: 'Mídia'
  },
  {
    id: 'menu',
    label: 'Menus da Vitrine',
    href: '/admin/loja/menu',
    icon: Sliders,
    badge: 'Links'
  },
  {
    id: 'categorias',
    label: 'Categorias & Subs',
    href: '/admin/loja/categorias',
    icon: FolderTree,
    badge: 'Estrutura'
  },
  {
    id: 'cupons',
    label: 'Cupons & Descontos',
    href: '/admin/loja/cupons',
    icon: Tag,
    badge: 'Promo'
  },
  {
    id: 'logistica',
    label: 'Logística & Frete',
    href: '/admin/loja/logistica',
    icon: Truck,
    badge: 'Envio'
  },
  {
    id: 'checkout',
    label: 'Checkout & Pedido',
    href: '/admin/loja/checkout',
    icon: ShoppingBag,
    badge: 'Checkout'
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos & PIX',
    href: '/admin/loja/pagamentos',
    icon: CreditCard,
    badge: 'PIX'
  },
  {
    id: 'dominio',
    label: 'Domínio Próprio',
    href: '/admin/loja/dominio',
    icon: Globe,
    badge: 'White-Label'
  }
];

export default function LojaVirtualHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { requestNavigation } = useAdminUnsavedChanges();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  // Centraliza a aba ativa no viewport suavemente
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [pathname]);

  const handleProtectedNav = (e: React.MouseEvent, href: string) => {
    if (href === pathname) return;
    const allowed = requestNavigation(href);
    if (!allowed) {
      e.preventDefault();
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          BARRA DE SUBMENUS / ABAS SUPERIORES DA LOJA VIRTUAL (LINHA ÚNICA COMPACTA)
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs relative flex items-center">
        {/* Botão de rolagem à esquerda para telas menores */}
        <button
          type="button"
          onClick={scrollLeft}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 shrink-0 transition-colors cursor-pointer mr-1"
          aria-label="Rolar abas para a esquerda"
          title="Rolar para esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Trilho de abas em linha única com auto-scroll */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
        >
          {STORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              pathname?.startsWith(tab.href + '/') ||
              (pathname === '/admin/loja' && tab.id === 'dados');

            return (
              <Link
                key={tab.id}
                ref={isActive ? activeTabRef : undefined}
                href={tab.href}
                onClick={(e) => handleProtectedNav(e, tab.href)}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-xl transition-all select-none border shrink-0',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/60 hover:border-slate-300'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-800'
                  )}
                />

                <span
                  className={cn(
                    'text-xs font-bold whitespace-nowrap',
                    isActive ? 'text-white' : 'text-slate-800 group-hover:text-slate-950'
                  )}
                >
                  {tab.label}
                </span>

                {tab.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 transition-colors',
                      isActive
                        ? 'bg-white/20 text-amber-300'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-200'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Botão de rolagem à direita para telas menores */}
        <button
          type="button"
          onClick={scrollRight}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 shrink-0 transition-colors cursor-pointer ml-1"
          aria-label="Rolar abas para a direita"
          title="Rolar para direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          CONTEÚDO DA SUBPÁGINA ATIVA SELECIONADA
          ========================================================================= */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
