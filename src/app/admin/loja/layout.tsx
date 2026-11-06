'use client';

import React from 'react';
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
  Globe
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
    id: 'dados',
    label: 'Dados da Loja',
    subtitle: 'Razão social, horários e termos',
    href: '/admin/loja/dados',
    icon: Store
  },
  {
    id: 'aparencia',
    label: 'Aparência da Loja',
    subtitle: 'Logo, cores, fundos & seções',
    href: '/admin/loja/aparencia',
    icon: Palette,
    badge: 'Visual'
  },
  {
    id: 'banners',
    label: 'Banners & Vitrines',
    subtitle: 'Hero banners & avisos',
    href: '/admin/loja/banners',
    icon: Sparkles,
    badge: 'Mídia'
  },
  {
    id: 'menu',
    label: 'Menus da Vitrine',
    subtitle: 'Cabeçalho & navegação',
    href: '/admin/loja/menu',
    icon: Sliders,
    badge: 'Links'
  },
  {
    id: 'categorias',
    label: 'Categorias & Subs',
    subtitle: 'Taxonomia & catálogo',
    href: '/admin/loja/categorias',
    icon: FolderTree,
    badge: 'Estrutura'
  },
  {
    id: 'cupons',
    label: 'Cupons & Descontos',
    subtitle: 'Campanhas promocionais',
    href: '/admin/loja/cupons',
    icon: Tag,
    badge: 'Promo'
  },
  {
    id: 'logistica',
    label: 'Logística & Frete',
    subtitle: 'Melhor Envio, frete grátis e motoboy',
    href: '/admin/loja/logistica',
    icon: Truck,
    badge: 'Envio'
  },
  {
    id: 'checkout',
    label: 'Checkout & Pedido',
    subtitle: 'Presente, pedido mínimo e regras',
    href: '/admin/loja/checkout',
    icon: ShoppingBag,
    badge: 'Checkout'
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos & PIX',
    subtitle: 'Chave PIX e descontos',
    href: '/admin/loja/pagamentos',
    icon: CreditCard,
    badge: 'PIX'
  },
  {
    id: 'dominio',
    label: 'Domínio Próprio',
    subtitle: 'Conexão DNS e white-label',
    href: '/admin/loja/dominio',
    icon: Globe,
    badge: 'White-Label'
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
          BARRA DE SUBMENUS / ABAS SUPERIORES DA LOJA VIRTUAL (10 ABAS UNIFICADAS)
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-5 gap-2">
          {STORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              pathname?.startsWith(tab.href + '/') ||
              (pathname === '/admin/loja' && tab.id === 'dados');

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => handleProtectedNav(e, tab.href)}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all select-none border',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/60 hover:border-slate-300'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
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
                          'text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0',
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
                      'text-[10px] truncate mt-0.5',
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
