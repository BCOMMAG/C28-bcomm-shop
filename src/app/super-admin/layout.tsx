'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  Store,
  PlusCircle,
  Link2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Server,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SuperAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cleanPath = (pathname || '').replace(/\/$/, '');
  const isLoginPage = cleanPath === '/super-admin/login' || cleanPath.startsWith('/super-admin/login');

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    const localAuth = typeof window !== 'undefined' ? localStorage.getItem('bcomm_super_admin_auth') : null;
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
          router.push('/super-admin/login/');
        }
      }).catch(() => {
        setIsAuthenticated(false);
        router.push('/super-admin/login/');
      });
    } catch {
      setIsAuthenticated(false);
      router.push('/super-admin/login/');
    }
  }, [cleanPath, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0C0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#38BDF8] font-medium">
            Carregando Console Super Admin BCOMM...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('bcomm_super_admin_auth');
    router.push('/super-admin/login/');
  };

  const navItems = [
    {
      title: 'Visão Global da Rede',
      href: '/super-admin/',
      icon: Globe,
      exact: true
    },
    {
      title: 'Lojas & Tenants',
      href: '/super-admin/lojas/',
      icon: Store,
      badge: 'Multi-Tenant'
    },
    {
      title: 'Criar Nova Loja (60s)',
      href: '/super-admin/nova-loja/',
      icon: PlusCircle,
      badge: 'Express'
    },
    {
      title: 'Domínios Customizados',
      href: '/super-admin/dominios/',
      icon: Link2
    }
  ];

  return (
    <div className="min-h-screen bg-[#0C0E14] text-[#F1F5F9] flex flex-col md:flex-row antialiased selection:bg-[#38BDF8] selection:text-black">
      {/* SIDEBAR EXECUTIVA BCOMM */}
      <aside className="hidden md:flex w-72 flex-col bg-[#11141E] border-r border-slate-800 shrink-0">
        {/* Topo da Marca BCOMM */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284C7] via-[#38BDF8] to-[#DFBE76] flex items-center justify-center font-black text-black text-sm shadow-lg shadow-sky-500/20">
              BC
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-white block">
                BCOMM Platform
              </span>
              <span className="text-[10px] tracking-widest text-[#38BDF8] uppercase block font-semibold">
                Super Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Badge de Rede */}
        <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-[11px] font-medium text-slate-300">Cluster Cloudflare</span>
          </div>
          <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 font-mono font-bold">
            v2.4 SAAS
          </span>
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
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent text-white border-l-2 border-[#38BDF8] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#38BDF8]' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      isActive
                        ? 'bg-[#38BDF8] text-black'
                        : 'bg-slate-800 text-slate-400'
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
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-[#DFBE76]" />
              <span>Ver Tenant #1 (Leidy)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-md transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Super Admin</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-[#11141E]/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
              aria-label="Abrir menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Plataforma SaaS Multi-Tenant</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-medium">BCOMM Master Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/super-admin/nova-loja"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#38BDF8] hover:bg-sky-400 text-black rounded-md transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Loja em 60s</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                SA
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-white leading-tight">
                  Super Administrador
                </span>
                <span className="block text-[10px] text-slate-400 leading-tight">
                  BCOMM Agência Digital
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MENU MOBILE */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#11141E] border-b border-slate-800 px-4 py-4 space-y-2">
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-sky-500/20 text-[#38BDF8] border-l-2 border-[#38BDF8]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-800 rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/super-admin/nova-loja"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs text-[#38BDF8] py-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Nova Loja (60s)</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-rose-400 py-2 text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Console</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTEÚDO */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
