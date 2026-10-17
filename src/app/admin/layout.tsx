'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Store,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Users,
  Settings,
  Search,
  Bell,
  MessageSquare,
  Sliders,
  Check,
  Tag
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useStore } from '@/context/StoreContext';
import { AdminThemeProvider, useAdminTheme } from '@/context/AdminThemeContext';
import { cn } from '@/lib/chart-utils';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant } = useStore();
  const { paletteConfig } = useAdminTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const lojaNome = currentTenant?.nome || 'Painel da Loja';
  const lojaSlug = currentTenant?.slug || '';

  const cleanPath = (pathname || '').replace(/\/$/, '');
  const isLoginPage = cleanPath === '/admin/login' || cleanPath.startsWith('/admin/login');

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    // Checagem de autenticação local + Supabase
    const localAuth = typeof window !== 'undefined' ? localStorage.getItem('leidy_admin_auth') : null;
    if (localAuth === 'true') {
      setIsAuthenticated(true);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/admin/login/');
        }
      }).catch(() => {
        setIsAuthenticated(false);
        router.push('/admin/login/');
      });
    } catch {
      setIsAuthenticated(false);
      router.push('/admin/login/');
    }
  }, [cleanPath, isLoginPage, router]);

  // Se for a página de login, renderiza apenas o conteúdo sem shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Enquanto valida a autenticação
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-slate-700 font-bold">
            Carregando Painel Administrativo...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado (durante o redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('leidy_admin_auth');
    localStorage.removeItem('leidy_admin_user');
    router.push('/admin/login/');
  };

  const navItems = [
    {
      title: 'Visão Geral',
      href: '/admin/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Pedidos',
      href: '/admin/pedidos/',
      icon: ShoppingBag
    },
    {
      title: 'Catálogo & Estoque',
      href: '/admin/produtos/',
      icon: Package
    },
    {
      title: 'Finanças',
      href: '/admin/financas/',
      icon: DollarSign
    },
    {
      title: 'Clientes & CRM',
      href: '/admin/clientes/',
      icon: Users
    },
    {
      title: 'Cupons & Descontos',
      href: '/admin/cupons/',
      icon: Tag
    },
    {
      title: 'Vitrine & Banners',
      href: '/admin/banners/',
      icon: Sparkles
    },
    {
      title: 'Loja de Módulos',
      href: '/admin/modulos/',
      icon: Layers
    },
    {
      title: 'Configurações',
      href: '/admin/configuracoes/',
      icon: Settings
    }
  ];

  const currentNav = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href)
  );
  const isRootAdmin = pathname === '/admin/' || pathname === '/admin';

  const c = paletteConfig.colors;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* =========================================================================
          1. SIDEBAR LATERAL FIXA NO DESKTOP (Inspirada no Layout de Referência)
      ========================================================================= */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-40 transition-colors duration-200 border-r select-none"
        style={{
          backgroundColor: c.sidebarBg,
          borderColor: c.sidebarBorder
        }}
      >
        {/* Topo da Sidebar: Marca e Identidade */}
        <div className="p-5 pb-4 border-b" style={{ borderColor: c.sidebarBorder }}>
          <Link href="/admin/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-10 shrink-0 overflow-hidden flex items-center justify-center bg-white/10 rounded-xl p-1 shadow-xs border border-white/10">
              <Image
                src="/images/Logo sem fundo.png"
                alt={lojaNome}
                width={2752}
                height={1536}
                style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="min-w-0">
              <span
                className="font-serif-luxury text-base font-bold tracking-tight block truncate group-hover:opacity-90 transition-opacity"
                style={{ color: c.sidebarTextActive }}
              >
                {lojaNome}
              </span>
              <span
                className="text-[9px] uppercase tracking-widest font-bold block"
                style={{ color: c.sidebarMuted }}
              >
                PAINEL ADMINISTRATIVO
              </span>
            </div>
          </Link>
        </div>

        {/* Menu Vertical de Navegação */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                  isActive ? 'shadow-xs font-bold' : 'hover:opacity-100'
                )}
                style={{
                  backgroundColor: isActive ? c.sidebarActive : 'transparent',
                  color: isActive ? c.sidebarTextActive : c.sidebarText,
                  borderLeft: isActive ? `3px solid ${c.sidebarActiveBorder}` : '3px solid transparent'
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    color: isActive ? c.accent : c.sidebarMuted
                  }}
                />
                <span className="truncate flex-1">{item.title}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.accent }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: Card de Suporte / Ajuda */}
        <div className="p-4 border-t" style={{ borderColor: c.sidebarBorder }}>
          <div
            className="p-3.5 rounded-2xl border transition-all"
            style={{
              backgroundColor: paletteConfig.isDarkSidebar ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
              borderColor: paletteConfig.isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: c.accentSoft,
                  color: c.accent
                }}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span
                  className="text-xs font-bold block truncate"
                  style={{ color: c.sidebarTextActive }}
                >
                  Precisa de Ajuda?
                </span>
                <span
                  className="text-[10px] block truncate"
                  style={{ color: c.sidebarMuted }}
                >
                  Fale com a nossa equipe
                </span>
              </div>
            </div>
            <a
              href="https://wa.me/5551999999999?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20painel%20BCOMM"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center py-1.5 px-3 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90 shadow-2xs"
              style={{ backgroundColor: c.accent }}
            >
              Iniciar Chat
            </a>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. DRAWER MOBILE (Menu Lateral Retrátil no Celular)
      ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop escurecido */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Lateral */}
          <div
            className="relative w-72 max-w-[80vw] h-full flex flex-col z-50 p-4 border-r shadow-2xl"
            style={{
              backgroundColor: c.sidebarBg,
              borderColor: c.sidebarBorder
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: c.sidebarBorder }}>
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-9 overflow-hidden flex items-center justify-center bg-white/10 rounded-lg p-1">
                  <Image
                    src="/images/Logo sem fundo.png"
                    alt={lojaNome}
                    width={2752}
                    height={1536}
                    style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div className="min-w-0">
                  <span
                    className="font-serif-luxury text-sm font-bold block truncate"
                    style={{ color: c.sidebarTextActive }}
                  >
                    {lojaNome}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider block"
                    style={{ color: c.sidebarMuted }}
                  >
                    Painel Administrativo
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isActive ? 'font-bold' : ''
                    )}
                    style={{
                      backgroundColor: isActive ? c.sidebarActive : 'transparent',
                      color: isActive ? c.sidebarTextActive : c.sidebarText,
                      borderLeft: isActive ? `3px solid ${c.sidebarActiveBorder}` : '3px solid transparent'
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? c.accent : c.sidebarMuted }} />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: c.sidebarBorder }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ÁREA PRINCIPAL (Compensada no Desktop com md:pl-64)
      ========================================================================= */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* TOPBAR FIXO DO APLICATIVO */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
          {/* LADO ESQUERDO: HAMBÚRGUER MOBILE + BARRA DE BUSCA UNIVERSAL */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Barra de Busca estilo SaaS */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar no painel (pedidos, produtos, clientes)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* LADO DIREITO: AÇÕES GLOBAIS, NOTIFICAÇÕES & PERFIL */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botão Abrir Vitrine */}
            <Link
              href={`/?loja=${lojaSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all shadow-2xs shrink-0"
              title="Abre a vitrine pública da loja em nova aba"
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Abrir Vitrine da Loja</span>
              <span className="sm:hidden">Vitrine</span>
              <ExternalLink className="w-3 h-3 text-amber-700/70" />
            </Link>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Link Rápido de Configurações */}
            <Link
              href="/admin/configuracoes/"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Configurações & Paleta de Cores"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <div className="h-5 w-[1px] bg-slate-200" />

            {/* Perfil Administrador com Avatar */}
            <div className="flex items-center gap-2.5 pl-1">
              <div
                className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                style={{ backgroundColor: c.sidebarBg }}
              >
                {lojaNome.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <span className="font-bold text-slate-900 block">Administrador</span>
                <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">{lojaNome}</span>
              </div>
            </div>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs ml-1"
              title="Encerrar sessão no painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* BREADCRUMB COMPACTO (Para páginas internas) */}
        {!isRootAdmin && (
          <div className="bg-white border-b border-slate-200/80 py-2 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
              <Link
                href="/admin/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Voltar à Visão Geral</span>
              </Link>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Link href="/admin/" className="hover:text-slate-900">
                  Dashboard
                </Link>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-slate-900">
                  {currentNav?.title || 'Seção'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CANVAS PRINCIPAL (Aproveitamento total da tela sem bordas mortas) */}
        <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* RODAPÉ DO PAINEL */}
        <footer className="bg-white border-t border-slate-200/80 py-3 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-[1700px] mx-auto px-4 flex items-center justify-center">
            <span>
              Plataforma BCOMM &bull; Gestão da loja <strong className="text-slate-800">{lojaNome}</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
