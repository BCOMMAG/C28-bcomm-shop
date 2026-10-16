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
  CheckCircle2
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useStore } from '@/context/StoreContext';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const navItems: Array<{
    title: string;
    href: string;
    icon: any;
    exact?: boolean;
    badge?: string;
  }> = [
    {
      title: 'Visão Geral',
      href: '/admin/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Central de Pedidos',
      href: '/admin/pedidos/',
      icon: ShoppingBag
    },
    {
      title: 'Catálogo de Produtos',
      href: '/admin/produtos/',
      icon: Package
    },
    {
      title: 'Finanças & Lucro Real',
      href: '/admin/financas/',
      icon: DollarSign
    },
    {
      title: 'Vitrine & Banners',
      href: '/admin/banners/',
      icon: Sparkles
    },
    {
      title: 'Clientes & CRM',
      href: '/admin/clientes/',
      icon: Users
    },
    {
      title: 'Loja de Módulos',
      href: '/admin/modulos/',
      icon: Layers
    }
  ];

  // Identifica a página atual para breadcrumb
  const currentNav = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href)
  );

  const isRootAdmin = pathname === '/admin/' || pathname === '/admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* HEADER PRINCIPAL FIXO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        {/* LINHA 1: MARCA, TENANT, VITRINE E LOGOUT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* LADO ESQUERDO: LOGO E TENANT */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link href="/admin/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
                <div className="relative h-9 w-12 shrink-0 overflow-hidden flex items-center justify-center bg-slate-900 rounded-lg p-1 shadow-sm">
                  <Image
                    src="/images/Logo sem fundo.png"
                    alt={lojaNome}
                    width={2752}
                    height={1536}
                    style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors truncate whitespace-nowrap block">
                    {lojaNome}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden sm:block">
                    Painel Administrativo
                  </span>
                </div>
              </Link>
            </div>

            {/* LADO DIREITO: AÇÕES GLOBAIS */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Botão Abrir Vitrine */}
              <Link
                href={`/?loja=${lojaSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-sm shrink-0"
                title="Abre a vitrine pública da loja em nova aba"
              >
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                <span className="hidden md:inline">Abrir Vitrine da Loja</span>
                <span className="md:hidden">Vitrine</span>
                <ExternalLink className="w-3 h-3 text-amber-600/70" />
              </Link>

              <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

              {/* Perfil Admin */}
              <div className="hidden lg:flex items-center gap-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center shadow-sm">
                  {lojaNome.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-800 block">Administrador</span>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{lojaNome}</span>
                </div>
              </div>

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-sm"
                title="Encerrar sessão no painel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>

              {/* Botão Menu Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* LINHA 2: BARRA DE NAVEGAÇÃO PRINCIPAL (ABAS HORIZONTAIS DESKTOP) */}
        <div className="hidden md:block bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold text-amber-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold tracking-wider ${
                          isActive
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* MENU MOBILE EXPANSÍVEL */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* LINHA 3: BREADCRUMB E BOTÃO DE VOLTAR */}
      {!isRootAdmin && (
        <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link
              href="/admin/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel Geral</span>
            </Link>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Link href="/admin/" className="hover:text-slate-800">
                Dashboard
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800">
                {currentNav?.title || 'Seção'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL COM FUNDO CLARO */}
      <main className="max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>

      {/* RODAPÉ DO PAINEL */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <span>
            Plataforma BCOMM &bull; Gestão da loja <strong className="text-slate-700">{lojaNome}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
