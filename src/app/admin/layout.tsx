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
  ShieldCheck,
  Bell,
  Sparkles,
  DollarSign,
  Users
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lojaNome, setLojaNome] = useState('Leidy Boutique');
  const [lojaSlug, setLojaSlug] = useState('leidy-boutique');

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
      <div className="min-h-screen bg-[#121110] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#DFBE76] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#DFBE76] font-medium">
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
      title: 'Central de Pedidos',
      href: '/admin/pedidos/',
      icon: ShoppingBag,
      badge: 'Ao Vivo'
    },
    {
      title: 'Catálogo de Peças',
      href: '/admin/produtos/',
      icon: Package
    },
    {
      title: 'Financeiro & Lucro',
      href: '/admin/financas/',
      icon: DollarSign,
      badge: 'DRE'
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
      icon: Layers,
      badge: 'SaaS'
    }
  ];

  return (
    <div className="min-h-screen bg-[#121110] text-[#FAF8F5] flex flex-col md:flex-row antialiased">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 flex-col bg-[#1A1918] border-r border-[#C5A059]/20 shrink-0">
        {/* Topo da Marca */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-14 shrink-0 overflow-hidden flex items-center justify-start">
              <Image
                src="/images/Logo sem fundo.png"
                alt="Leidy Boutique"
                width={2752}
                height={1536}
                style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <span className="font-serif-luxury text-base font-bold tracking-wide text-white block">
                {lojaNome}
              </span>
              <span className="text-[10px] tracking-widest text-[#DFBE76] uppercase block font-semibold">
                Painel do Lojista
              </span>
            </div>
          </div>
        </div>

        {/* Status Multi-Tenant da Loja */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-300">Loja Ativa & Online</span>
            </div>
            <span className="text-[10px] bg-[#DFBE76]/15 text-[#DFBE76] border border-[#DFBE76]/30 px-2 py-0.5 rounded-none font-bold">
              TENANT #1
            </span>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-none text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#DFBE76]/20 to-[#DFBE76]/5 text-white border-l-2 border-[#DFBE76] shadow-sm'
                    : 'text-[#A8A29E] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#DFBE76]' : 'text-[#78716C]'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 font-bold tracking-wider ${
                      isActive
                        ? 'bg-[#DFBE76] text-black'
                        : 'bg-white/10 text-[#A8A29E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-white/5 space-y-2 bg-black/30">
          <Link
            href={`/?loja=${lojaSlug}`}
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-[#A8A29E] hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-[#DFBE76]" />
              <span>Ver Minha Loja Ao Vivo</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#78716C]" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-[#1A1918]/80 backdrop-blur-md border-b border-[#C5A059]/20 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Botão Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#FAF8F5] hover:text-[#DFBE76]"
              aria-label="Abrir menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#78716C]">
              <span>Plataforma SaaS</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#FAF8F5] font-medium">{lojaNome}</span>
            </div>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center gap-3">
            <Link
              href={`/?loja=${lojaSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 transition-colors"
              title="Abrir a vitrine da loja em nova aba"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Abrir Vitrine</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

            {/* Perfil */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A9833E] to-[#DFBE76] flex items-center justify-center font-bold text-xs text-black shadow-md">
                LB
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-white leading-tight">
                  Leidy Admin
                </span>
                <span className="block text-[10px] text-[#A8A29E] leading-tight">
                  admin@leidyboutique.com.br
                </span>
              </div>
            </div>

            {/* Botão Sair Destacado */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
              title="Encerrar sessão com segurança"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* MENU MOBILE EXPANSÍVEL */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1A1918] border-b border-[#C5A059]/20 px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium ${
                    isActive
                      ? 'bg-[#DFBE76]/20 text-[#DFBE76] border-l-2 border-[#DFBE76]'
                      : 'text-[#A8A29E] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white/10 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href={`/?loja=${lojaSlug}`}
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs text-[#DFBE76] py-2"
              >
                <Store className="w-4 h-4" />
                <span>Ver Minha Loja Ao Vivo</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-[#78716C]" />
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-xs text-rose-300 py-2 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Painel</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA PÁGINA */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
