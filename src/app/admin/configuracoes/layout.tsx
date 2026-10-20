'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Store,
  CreditCard,
  Truck,
  ShoppingBag,
  Palette,
  Layers,
  Bell,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sliders,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/chart-utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SETTINGS_SECTIONS: NavSection[] = [
  {
    title: 'Conta & Acesso',
    items: [
      {
        label: 'Perfil do Usuário',
        href: '/admin/configuracoes/perfil',
        icon: User,
        description: 'Dados pessoais, avatar e assinatura',
        badge: 'Você',
        badgeColor: 'bg-slate-100 text-slate-700'
      },
      {
        label: 'Segurança & Acessos',
        href: '/admin/configuracoes/seguranca',
        icon: ShieldCheck,
        description: 'Senhas, PIN balcão e sessões ativas',
        badge: 'Crítico',
        badgeColor: 'bg-amber-100 text-amber-800'
      }
    ]
  },
  {
    title: 'Operação & Vendas',
    items: [
      {
        label: 'Dados da Loja',
        href: '/admin/configuracoes/loja',
        icon: Store,
        description: 'Razão social, endereço, horários e termos'
      },
      {
        label: 'Pagamentos & PIX',
        href: '/admin/configuracoes/pagamentos',
        icon: CreditCard,
        description: 'Chave PIX oficial, descontos e gateways',
        badge: '5% OFF',
        badgeColor: 'bg-emerald-100 text-emerald-800'
      },
      {
        label: 'Logística & Frete',
        href: '/admin/configuracoes/logistica',
        icon: Truck,
        description: 'Frete grátis, Correios, motoboy e retirada'
      },
      {
        label: 'Checkout & Pedido',
        href: '/admin/configuracoes/checkout',
        icon: ShoppingBag,
        description: 'Embalagem presente, cartão e pedido mínimo'
      }
    ]
  },
  {
    title: 'Marca, Canais & Dados',
    items: [
      {
        label: 'Aparência & Temas',
        href: '/admin/configuracoes/aparencia',
        icon: Palette,
        description: 'Paleta visual do admin, logotipos e favicon'
      },
      {
        label: 'Integrações & SEO',
        href: '/admin/configuracoes/integracoes',
        icon: Layers,
        description: 'Pixel Meta, Google Analytics 4 e metatags'
      },
      {
        label: 'Alertas & Sons',
        href: '/admin/configuracoes/notificacoes',
        icon: Bell,
        description: 'Sons de nova venda e estoque mínimo'
      },
      {
        label: 'Exportação de Dados',
        href: '/admin/configuracoes/dados',
        icon: FileSpreadsheet,
        description: 'Relatórios CSV contábeis e backups'
      }
    ]
  }
];

export default function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentTenant } = useStore();
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';
  const lojaSlug = currentTenant?.slug || 'leidy-boutique';

  const cleanPath = (pathname || '').replace(/\/$/, '');

  return (
    <div className="space-y-6 pb-16">
      {/* CABEÇALHO GLOBAL DE CONFIGURAÇÕES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Painel</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-semibold text-slate-700">Configurações</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-amber-400 shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                Configurações da Loja
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central de governança, operação, segurança e parametrização de {lojaNome}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={currentTenant?.dominio_proprio ? `https://${currentTenant.dominio_proprio}` : `/${lojaSlug}/`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold transition-all shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* NAVEGAÇÃO MOBILE (Scroll Horizontal de Pílulas) */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-none pb-2">
        <div className="flex items-center gap-2 min-w-max">
          {SETTINGS_SECTIONS.flatMap((s) => s.items).map((item) => {
            const Icon = item.icon;
            const isActive = cleanPath === item.href || (item.href === '/admin/configuracoes/loja' && cleanPath === '/admin/configuracoes');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0',
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-amber-400' : 'text-slate-500')} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-amber-400/20 text-amber-300' : item.badgeColor || 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* CORPO DO LAYOUT: SIDEBAR DESKTOP + CONTEÚDO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR DE NAVEGAÇÃO DESKTOP */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-20">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-6">
            {SETTINGS_SECTIONS.map((section, idx) => (
              <div key={section.title} className={idx > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 font-mono">
                  {section.title}
                </h3>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = cleanPath === item.href || (item.href === '/admin/configuracoes/loja' && cleanPath === '/admin/configuracoes');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'group flex items-start gap-3 p-2.5 rounded-xl text-xs transition-all relative',
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <div
                          className={cn(
                            'p-1.5 rounded-lg shrink-0 transition-colors',
                            isActive
                              ? 'bg-slate-800 text-amber-400'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={cn('font-bold truncate', isActive ? 'text-white' : 'text-slate-900')}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  'text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                                  isActive
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : item.badgeColor || 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-[10px] truncate mt-0.5',
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* DICA DE ATALHO / GOVERNANÇA */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Sincronização em Nuvem</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Todas as alterações salvas são refletidas instantaneamente na vitrine pública e no balcão de vendas PDV.
            </p>
          </div>
        </aside>

        {/* ÁREA CENTRAL DE CONTEÚDO */}
        <main className="lg:col-span-8 xl:col-span-9 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
