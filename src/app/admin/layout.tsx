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
  Tag,
  ShieldCheck,
  Lock,
  Clock,
  Ban,
  PanelLeftClose,
  PanelLeftOpen,
  FolderTree,
  Crown,
  ArrowUpRight
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useStore } from '@/context/StoreContext';
import { AdminThemeProvider, useAdminTheme } from '@/context/AdminThemeContext';
import { AdminUnsavedChangesProvider, useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { UnsavedChangesModal } from '@/components/admin/UnsavedChangesModal';
import { cn } from '@/lib/chart-utils';
import { GlobalSearchModal } from '@/components/admin/GlobalSearchModal';
import { getAdminPendingNotifications } from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { getStorefrontUrl } from '@/lib/routes';
import { MembroEquipe, getTeamMembers, checkWorkingHoursAccess, isMasterUser, checkSessionValidity } from '@/lib/team';
import { LockScreenModal } from '@/components/admin/team/LockScreenModal';
import { MasterImpersonationBar } from '@/components/admin/MasterImpersonationBar';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { AdminI18nProvider, useAdminI18n } from '@/context/AdminI18nContext';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant } = useStore();
  const { paletteConfig, customTheme } = useAdminTheme();
  const { requestNavigation } = useAdminUnsavedChanges();

  const handleProtectedNav = (e: React.MouseEvent, href: string) => {
    if (href === pathname) return;
    const allowed = requestNavigation(href);
    if (!allowed) {
      e.preventDefault();
    }
  };

  const cleanPath = (pathname || '').replace(/\/$/, '');
  const isLoginPage = cleanPath === '/admin/login' || cleanPath.startsWith('/admin/login');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      if (cleanPath === '/admin/login' || cleanPath.startsWith('/admin/login')) return true;
      if (isMasterUser()) return true;
      const localAuth = localStorage.getItem('bcomm_admin_auth') || localStorage.getItem('leidy_admin_auth');
      if (localAuth === 'true') return true;
    }
    return null;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<MembroEquipe[]>([]);
  const [activeMember, setActiveMember] = useState<MembroEquipe | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedColab = localStorage.getItem('leidy_admin_colaborador') || localStorage.getItem('bcomm_admin_colaborador');
        if (savedColab) {
          const parsed = JSON.parse(savedColab);
          if (parsed && parsed.id) return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [isLockScreenOpen, setIsLockScreenOpen] = useState(false);
  const [pendingNotifs, setPendingNotifs] = useState<{
    count: number;
    pedidos: Array<{ id: string; numero_pedido: string; cliente_nome: string; total: number; created_at: string }>;
  }>({ count: 0, pedidos: [] });
  const [isMaster, setIsMaster] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isMasterUser();
    }
    return false;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { locale, setLocale, t, formatCurrency } = useAdminI18n();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bcomm_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  // Blindagem definitiva: Garante que os favicons do admin sejam sempre os oficiais da BCOMM e preloader inativo
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('bcomm-preloader-running', 'bcomm-veil-active');
      document.documentElement.classList.add('bcomm-no-preloader');
      const c = document.getElementById('bcomm-instant-curtain');
      if (c) c.style.display = 'none';

      // Fixação do Favicon Oficial BCOMM no Painel Administrativo com cache-busting
      const icons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
      if (icons.length > 0) {
        icons.forEach((el) => {
          if (el.rel.includes('apple-touch-icon')) {
            el.href = '/admin-favicon/apple-touch-icon.png?v=20261107_bcomm_stores';
          } else {
            el.href = '/admin-favicon/favicon-32x32.png?v=20261107_bcomm_stores';
          }
        });
      }
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bcomm_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const lojaNome = currentTenant?.nome || 'Painel da Loja';
  const lojaSlug = currentTenant?.slug || '';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    // Checagem de autenticação Master God Mode (Prioridade Máxima)
    if (isMasterUser()) {
      setIsAuthenticated(true);
      setIsMaster(true);
      return;
    }

    // Checagem de autenticação local + Supabase
    const localAuth = typeof window !== 'undefined'
      ? (localStorage.getItem('bcomm_admin_auth') || localStorage.getItem('leidy_admin_auth'))
      : null;
    if (localAuth === 'true') {
      setIsAuthenticated(true);
      if (isMasterUser()) setIsMaster(true);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setIsAuthenticated(true);
          if (isMasterUser(data.session.user)) setIsMaster(true);
        } else {
          setIsAuthenticated(false);
          if (typeof window !== 'undefined') {
            window.location.replace('/admin/login/');
          } else {
            router.push('/admin/login/');
          }
        }
      }).catch(() => {
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
          window.location.replace('/admin/login/');
        } else {
          router.push('/admin/login/');
        }
      });
    } catch {
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        window.location.replace('/admin/login/');
      } else {
        router.push('/admin/login/');
      }
    }
  }, [cleanPath, isLoginPage, router]);

  // Listener para o atalho de teclado global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Carrega notificações operacionais de pedidos pendentes da loja ativa
  useEffect(() => {
    if (!isAuthenticated) return;
    const activeLojaId = currentTenant?.id || DEFAULT_TENANT_ID;
    const fetchNotifs = async () => {
      try {
        const notifs = await getAdminPendingNotifications(activeLojaId);
        setPendingNotifs(notifs);
      } catch (err) {
        console.error('Erro ao buscar notificações:', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`admin-header-pedidos-notifs-${activeLojaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        () => {
          fetchNotifs();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, currentTenant?.id]);

  // Carrega a equipe e o colaborador ativo da sessão
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isMaster) {
      setActiveMember(null);
      return;
    }
    const activeLojaId = currentTenant?.id || DEFAULT_TENANT_ID;
    const loadTeam = async () => {
      try {
        const list = await getTeamMembers(activeLojaId);
        setTeamMembers(list);
        const savedColab = typeof window !== 'undefined' ? localStorage.getItem('leidy_admin_colaborador') : null;
        let chosenMember: MembroEquipe | null = null;
        if (savedColab) {
          try {
            const parsed = JSON.parse(savedColab);
            chosenMember = list.find((m) => m.id === parsed.id) || parsed;
          } catch {
            chosenMember = list.find((m) => m.cargo === 'dono') || null;
          }
        } else {
          chosenMember = list.find((m) => m.cargo === 'dono') || null;
        }

        setActiveMember(chosenMember);

        // Inicializa a versão local do token de sessão se ainda não estiver definida
        if (typeof window !== 'undefined' && chosenMember?.token_version) {
          const localVer = localStorage.getItem('bcomm_token_version');
          if (!localVer) {
            localStorage.setItem('bcomm_token_version', String(chosenMember.token_version));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar equipe no layout:', err);
      }
    };
    loadTeam();
  }, [isAuthenticated, currentTenant?.id]);

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
            {t.adminNav.loadingPanel}
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
    localStorage.removeItem('bcomm_admin_auth');
    localStorage.removeItem('leidy_admin_auth');
    localStorage.removeItem('leidy_admin_user');
    localStorage.removeItem('leidy_admin_colaborador');
    localStorage.removeItem('bcomm_admin_colaborador');
    localStorage.removeItem('bcomm_admin_loja_id');
    localStorage.removeItem('bcomm_admin_loja_slug');
    localStorage.removeItem('bcomm_auth_user');
    localStorage.removeItem('bcomm_token_version');
    router.push('/admin/login/');
  };

  /**
   * Encerramento forçado de sessão acionado pelo Kill-Switch
   */
  const handleForcedLogout = async (reason: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('bcomm_admin_auth');
    localStorage.removeItem('leidy_admin_auth');
    localStorage.removeItem('leidy_admin_user');
    localStorage.removeItem('leidy_admin_colaborador');
    localStorage.removeItem('bcomm_admin_colaborador');
    localStorage.removeItem('bcomm_admin_loja_id');
    localStorage.removeItem('bcomm_admin_loja_slug');
    localStorage.removeItem('bcomm_auth_user');
    localStorage.removeItem('bcomm_token_version');

    const encodedReason = encodeURIComponent(reason);
    if (typeof window !== 'undefined') {
      window.location.replace(`/admin/login/?revoked=true&reason=${encodedReason}`);
    } else {
      router.push(`/admin/login/?revoked=true&reason=${encodedReason}`);
    }
  };

  // TRIPLA CAMADA DE KILL-SWITCH EM TEMPO REAL:
  // 1. Supabase Realtime (WebSocket instantâneo ao suspender ou trocar senha)
  // 2. Heartbeat periódico a cada 15s (Fallback)
  useEffect(() => {
    if (!isAuthenticated || isMaster || !activeMember?.id) return;

    const activeLojaId = currentTenant?.id || DEFAULT_TENANT_ID;
    const memberId = activeMember.id;
    const localVersion = Number(localStorage.getItem('bcomm_token_version') || activeMember.token_version || 1);

    // Camada 1: Supabase Realtime
    const supabase = getSupabaseBrowserClient();
    const killSwitchChannel = supabase
      .channel(`kill-switch-${memberId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'equipe_loja',
          filter: `id=eq.${memberId}`
        },
        (payload: any) => {
          const newRecord = payload.new;
          if (!newRecord) return;

          // Se o colaborador foi inativado / suspenso
          if (newRecord.ativo === false) {
            handleForcedLogout('Seu acesso ao painel foi desativado pela administração da loja.');
            return;
          }

          // Se a senha foi alterada ou o kill-switch acionado (token_version incrementado)
          const dbVersion = Number(newRecord.token_version || 1);
          if (dbVersion > localVersion) {
            handleForcedLogout('Sua sessão foi encerrada porque sua senha ou permissões foram alteradas.');
          }
        }
      )
      .subscribe();

    // Camada 2: Heartbeat periódico (a cada 15 segundos)
    const heartbeatInterval = setInterval(async () => {
      const check = await checkSessionValidity(activeLojaId, memberId, localVersion);
      if (!check.valid) {
        handleForcedLogout(check.reason || 'Sua sessão foi encerrada pela administração da loja.');
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      supabase.removeChannel(killSwitchChannel);
    };
  }, [isAuthenticated, isMaster, activeMember?.id, activeMember?.token_version, currentTenant?.id]);

  // Camada 3: Route Guard (Validação a cada navegação de rota no painel)
  useEffect(() => {
    if (!isAuthenticated || isMaster || !activeMember?.id || isLoginPage) return;

    const activeLojaId = currentTenant?.id || DEFAULT_TENANT_ID;
    const localVersion = Number(localStorage.getItem('bcomm_token_version') || activeMember.token_version || 1);

    checkSessionValidity(activeLojaId, activeMember.id, localVersion).then((check) => {
      if (!check.valid) {
        handleForcedLogout(check.reason || 'Sua sessão foi encerrada pela administração da loja.');
      }
    });
  }, [pathname]);

  const navItems = [
    {
      title: t.adminNav.overview,
      href: '/admin/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: t.adminNav.orders,
      href: '/admin/pedidos/',
      icon: ShoppingBag
    },
    {
      title: t.adminNav.catalog,
      href: '/admin/produtos/',
      icon: Package
    },
    {
      title: t.adminNav.storeSettings,
      href: '/admin/loja/',
      icon: Store
    },
    {
      title: t.adminNav.customers,
      href: '/admin/clientes/',
      icon: Users
    },
    {
      title: t.adminNav.finance,
      href: '/admin/financas/',
      icon: DollarSign
    },
    {
      title: t.adminNav.team,
      href: '/admin/equipe/',
      icon: ShieldCheck
    },
    {
      title: t.adminNav.modules,
      href: '/admin/modulos/',
      icon: Layers
    },
    {
      title: t.adminNav.settings,
      href: '/admin/configuracoes/',
      icon: Settings
    }
  ];

  const allowedNavItems = navItems.filter((item) => {
    if (isMaster) return true;
    if (!activeMember || activeMember.cargo === 'dono') return true;
    if (item.href === '/admin/financas/' && !activeMember.permissoes?.ver_financeiro) return false;
    if (item.href === '/admin/clientes/' && !activeMember.permissoes?.acessar_crm) return false;
    if (item.href === '/admin/loja/' && (!activeMember.permissoes?.configuracoes_loja && activeMember.cargo === 'estoquista')) return false;
    if (item.href === '/admin/modulos/' && activeMember.cargo !== 'gerente') return false;
    if (item.href === '/admin/configuracoes/' && (!activeMember.permissoes?.configuracoes_loja && activeMember.cargo === 'estoquista')) return false;
    if (item.href === '/admin/equipe/' && !activeMember.permissoes?.gerenciar_equipe && activeMember.cargo !== 'gerente') return false;
    return true;
  });

  const isRouteBlocked = (() => {
    if (isMaster) return false;
    if (!activeMember || activeMember.cargo === 'dono') return false;
    if (cleanPath.startsWith('/admin/financas') && !activeMember.permissoes?.ver_financeiro) return true;
    if (cleanPath.startsWith('/admin/configuracoes/assinatura') && activeMember.cargo !== 'gerente') return true;
    if (cleanPath.startsWith('/admin/configuracoes/seguranca') && activeMember.cargo !== 'gerente') return true;
    if (cleanPath.startsWith('/admin/modulos') && activeMember.cargo !== 'gerente') return true;
    if (cleanPath.startsWith('/admin/loja/cupons') && !activeMember.permissoes?.gerenciar_cupons && activeMember.cargo === 'estoquista') return true;
    if (cleanPath.startsWith('/admin/loja') && (!activeMember.permissoes?.configuracoes_loja && activeMember.cargo === 'estoquista')) return true;
    if (cleanPath.startsWith('/admin/cupons') && !activeMember.permissoes?.gerenciar_cupons && activeMember.cargo === 'estoquista') return true;
    if (cleanPath.startsWith('/admin/banners') && activeMember.cargo !== 'gerente') return true;
    if (cleanPath.startsWith('/admin/menu') && activeMember.cargo !== 'gerente') return true;
    if (cleanPath.startsWith('/admin/categorias') && activeMember.cargo === 'estoquista') return true;
    if (cleanPath.startsWith('/admin/equipe') && !activeMember.permissoes?.gerenciar_equipe && activeMember.cargo !== 'gerente') return true;
    return false;
  })();

  const currentNav = navItems.find((item) => {
    const itemClean = item.href.replace(/\/+$/, '');
    const pathClean = (pathname || '').replace(/\/+$/, '');
    return item.exact ? pathClean === itemClean : pathClean.startsWith(itemClean);
  });
  const isRootAdmin = pathname === '/admin/' || pathname === '/admin';

  const c = paletteConfig.colors;

  const vis = currentTenant?.configuracoes_visuais as any;
  const adminCustom = customTheme || vis?.admin_custom;
  const isLeidyTenant = currentTenant?.slug === 'leidy-boutique' || currentTenant?.slug === 'leidyboutique';
  const adminLogoSrc = vis?.logo_dark_url || vis?.logo_url || (isLeidyTenant ? '/images/Logo sem fundo.png' : '/images/bcomm-stores.png');

  return (
    <div
      id="admin-root"
      className="min-h-screen text-slate-800 flex font-sans antialiased selection:bg-amber-100 selection:text-amber-900 transition-colors"
      style={{
        backgroundColor: 'var(--admin-page-bg)',
        fontFamily: 'var(--admin-body-font)'
      }}
    >
      {/* =========================================================================
          1. SIDEBAR LATERAL FIXA NO DESKTOP (Minimizável com Tooltips)
      ========================================================================= */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 border-r select-none print:hidden",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
        style={{
          backgroundColor: adminCustom?.sidebarBg || c.sidebarBg,
          borderColor: c.sidebarBorder,
          fontFamily: adminCustom?.sidebarFontFamily || undefined
        }}
      >
        {/* Topo da Sidebar: Marca, Identidade & Botão Minimizar */}
        <div
          className={cn(
            "border-b transition-all duration-300 flex items-center",
            isSidebarCollapsed ? "p-3 flex-col gap-2.5 justify-center" : "p-5 pb-4 justify-between"
          )}
          style={{ borderColor: c.sidebarBorder }}
        >
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2.5">
              <Link href="/admin/" className="group relative" title={lojaNome}>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden flex items-center justify-center bg-white/10 rounded-xl p-1 shadow-xs border border-white/10">
                  <Image
                    src={adminLogoSrc}
                    alt={lojaNome}
                    width={2752}
                    height={1536}
                    style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Expandir Menu Lateral (w-64)"
              >
                <PanelLeftOpen className="w-4 h-4" style={{ color: c.sidebarTextActive }} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link href="/admin/" className="flex items-center gap-3 group min-w-0">
                <div className="relative h-9 w-10 shrink-0 overflow-hidden flex items-center justify-center bg-white/10 rounded-xl p-1 shadow-xs border border-white/10">
                  <Image
                    src={adminLogoSrc}
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
                    {t.adminNav.panelSubtitle}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                title="Minimizar Menu Lateral para Ganho de Espaço"
              >
                <PanelLeftClose className="w-4 h-4" style={{ color: c.sidebarMuted }} />
              </button>
            </div>
          )}
        </div>

        {/* Menu Vertical de Navegação */}
        <div
          className={cn(
            "flex-1 py-4 overflow-y-auto space-y-1 overflow-x-hidden",
            isSidebarCollapsed ? "px-2" : "px-3"
          )}
        >
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleProtectedNav(e, item.href)}
                className={cn(
                  'flex items-center rounded-xl text-xs font-semibold transition-all group relative',
                  isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5',
                  isActive ? 'shadow-xs font-bold' : 'hover:opacity-100'
                )}
                style={{
                  backgroundColor: isActive ? c.sidebarActive : 'transparent',
                  color: isActive ? c.sidebarTextActive : (adminCustom?.sidebarText || c.sidebarText),
                  borderLeft: isSidebarCollapsed
                    ? undefined
                    : isActive ? `3px solid ${c.sidebarActiveBorder}` : '3px solid transparent'
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    color: isActive ? c.accent : (adminCustom?.sidebarText || c.sidebarMuted)
                  }}
                />

                {!isSidebarCollapsed && (
                  <>
                    <span className="truncate flex-1">{item.title}</span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.accent }}
                      />
                    )}
                  </>
                )}

                {/* Tooltip Flutuante no Modo Minimizado */}
                {isSidebarCollapsed && (
                  <div
                    className="fixed left-20 ml-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-2xl flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: '#1A1918',
                      color: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <span>{item.title}</span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.accent }}
                      />
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: Suporte / Ajuda */}
        <div className="p-3 border-t" style={{ borderColor: c.sidebarBorder }}>
          {isSidebarCollapsed ? (
            <div className="flex justify-center group relative">
              <a
                href="mailto:security@agent-bcomm.space?subject=BCOMM%20Platform%20Support"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                style={{
                  backgroundColor: c.accentSoft,
                  color: c.accent
                }}
                title="Suporte Oficial BCOMM Security"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <div
                className="fixed left-20 ml-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 shadow-2xl border"
                style={{
                  backgroundColor: '#1A1918',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                Suporte Oficial BCOMM
              </div>
            </div>
          ) : (
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
                    {t.adminNav.supportGovernance}
                  </span>
                  <span
                    className="text-[10px] block truncate"
                    style={{ color: c.sidebarMuted }}
                  >
                    security@agent-bcomm.space
                  </span>
                </div>
              </div>
              <a
                href="mailto:security@agent-bcomm.space?subject=BCOMM%20Platform%20Support"
                className="mt-3 block text-center py-1.5 px-3 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90 shadow-2xs"
                style={{ backgroundColor: c.accent }}
              >
                {t.adminNav.sendMessage}
              </a>
            </div>
          )}
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
                    src={adminLogoSrc}
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
                    {t.adminNav.panelSubtitle}
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
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleProtectedNav(e, item.href);
                    }}
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
                <span>{t.adminNav.sessionClosed}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ÁREA PRINCIPAL (Compensada no Desktop com md:pl-64 ou md:pl-20)
      ========================================================================= */}
      <div
        className={cn(
          "flex-1 flex flex-col print:pl-0 min-w-0 transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {/* BARRA EXCLUSIVA MODO MASTER SAAS COM ALTERNADOR GLOBAL (100% INVISÍVEL PARA LOJISTAS) */}
        <MasterImpersonationBar />

        {/* TOPBAR FIXO DO APLICATIVO */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs print:hidden">
          {/* LADO ESQUERDO: HAMBÚRGUER MOBILE + BARRA DE BUSCA UNIVERSAL */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Barra de Busca Universal (Trigger do Spotlight Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full max-w-md hidden sm:flex items-center justify-between pl-3.5 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl text-xs text-slate-400 border border-slate-200 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                <span className="text-slate-500 group-hover:text-slate-700">{t.adminHeader.searchPlaceholder}</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-200 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Botão de Busca no Celular */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              title="Buscar no Painel"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* LADO DIREITO: AÇÕES GLOBAIS, NOTIFICAÇÕES & PERFIL */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botão Abrir Vitrine */}
            <Link
              href={getStorefrontUrl(currentTenant)}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all shadow-2xs shrink-0"
              title="Abre a vitrine pública da loja em nova aba"
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">{t.adminHeader.openStore}</span>
              <span className="sm:hidden">{t.adminHeader.storefront}</span>
              <ExternalLink className="w-3 h-3 text-amber-700/70" />
            </Link>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Sino de Notificações com Dropdown de Pedidos Pendentes */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
                title="Pedidos pendentes no WhatsApp"
              >
                <Bell className="w-4 h-4" />
                {pendingNotifs.count > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                    {pendingNotifs.count}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">{t.adminHeader.notifications}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                      {t.adminHeader.pendingOrders(pendingNotifs.count)}
                    </span>
                  </div>

                  {pendingNotifs.pedidos.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">{t.adminHeader.noPendingOrders}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {pendingNotifs.pedidos.map((p) => (
                        <Link
                          key={p.id}
                          href="/admin/pedidos/"
                          onClick={() => setIsNotifOpen(false)}
                          className="block p-2 rounded-xl hover:bg-slate-50 border border-slate-100 text-xs transition-colors"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>#{p.numero_pedido}</span>
                            <span className="text-emerald-700">
                              {formatCurrency(p.total)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{p.cliente_nome}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/admin/pedidos/"
                    onClick={() => setIsNotifOpen(false)}
                    className="block text-center py-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 rounded-lg transition-colors"
                  >
                    {t.adminHeader.viewAllOrders}
                  </Link>
                </div>
              )}
            </div>

            {/* Seletor de Idioma Global */}
            <div className="shrink-0">
              <LanguageSelector />
            </div>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Link Rápido de Configurações */}
            <Link
              href="/admin/configuracoes/"
              onClick={(e) => handleProtectedNav(e, '/admin/configuracoes/')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Configurações & Paleta de Cores"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Perfil do Operador / Master God Mode */}
            {isMaster ? (
              <div
                className="flex items-center gap-2 pl-1 select-none"
                title="Acesso Supremo Master God Mode (Invisível na Equipe)"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-xs">
                  ⚡
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <span className="font-bold text-amber-900 block truncate max-w-[130px]">
                    Master Admin
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wide">
                    God Mode
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Botão Balcão / PIN Rápido */}
                <button
                  type="button"
                  onClick={() => setIsLockScreenOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
                  title="Bloquear painel e alternar colaboradora via PIN"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.adminHeader.posPin}</span>
                </button>

                <div className="h-5 w-[1px] bg-slate-200" />

                {/* Perfil Administrador com Avatar */}
                <div
                  onClick={() => setIsLockScreenOpen(true)}
                  className="flex items-center gap-2.5 pl-1 cursor-pointer hover:opacity-90 transition-opacity"
                  title="Clique para alternar colaboradora com PIN"
                >
                  <div
                    className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: c.sidebarBg }}
                  >
                    {(activeMember?.nome || lojaNome).charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                      {activeMember?.nome || 'Administrador'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wide">
                      {(() => {
                        const cargo = (activeMember?.cargo || 'dono').toLowerCase();
                        if (cargo === 'dono') return t.team.roleOwner;
                        if (cargo === 'gerente') return t.team.roleManager;
                        if (cargo === 'vendedora' || cargo === 'vendedor') return t.team.roleSeller;
                        if (cargo === 'estoquista') return t.team.roleStockist;
                        return activeMember?.cargo || t.team.roleOwner;
                      })()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs ml-1"
              title="Encerrar sessão no painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.adminHeader.logout}</span>
            </button>
          </div>
        </header>

        {/* BREADCRUMB COMPACTO (Para páginas internas) */}
        {!isRootAdmin && (
          <div className="bg-white border-b border-slate-200/80 py-2 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>{t.adminNav.backToOverview}</span>
                </Link>

                <div className="h-4 w-[1px] bg-slate-200" />

                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-serif-luxury">
                  {cleanPath === '/admin/pedidos' ? t.orders.title : currentNav?.title || t.common.panel}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Link href="/admin/" className="hover:text-slate-900">
                  {t.adminNav.overview}
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
          {!isMaster && activeMember && activeMember.horario_restrito && !checkWorkingHoursAccess(activeMember).permitido ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-serif-luxury text-slate-900">
                Acesso Bloqueado pelo Horário de Atendimento
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {checkWorkingHoursAccess(activeMember).motivo ||
                  'Em conformidade com o Art. 244 da CLT, o acesso ao painel de atendimento está pausado fora do horário contratado da colaboradora.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setIsLockScreenOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Alternar para Outra Colaboradora (PIN)
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Sair do Painel
                </button>
              </div>
            </div>
          ) : !isMaster && isRouteBlocked ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Ban className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-serif-luxury text-slate-900">
                Módulo Exclusivo da Administração
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Seu perfil atual ({activeMember?.cargo?.toUpperCase() || 'COLABORADOR'}) não possui permissão para acessar esta seção restrita da boutique.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  href="/admin/pedidos/"
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Ir para Pedidos & WhatsApp
                </Link>
                <button
                  type="button"
                  onClick={() => setIsLockScreenOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Alternar Colaboradora (PIN)
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* RODAPÉ DO PAINEL */}
        <footer className="bg-white border-t border-slate-200/80 py-3 text-center text-xs text-slate-500 mt-auto print:hidden">
          <div className="max-w-[1700px] mx-auto px-4 flex items-center justify-center">
            <span>
              {t.adminNav.footerPlatform} <strong className="text-slate-800">{lojaNome}</strong>
            </span>
          </div>
        </footer>
      </div>

      {/* MODAL DE BUSCA UNIVERSAL SPOTLIGHT (CTRL+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        lojaSlug={lojaSlug}
      />

      {/* MODAL DE BLOQUEIO DE BALCÃO & FAST USER SWITCH VIA PIN */}
      <LockScreenModal
        isOpen={isLockScreenOpen}
        onClose={() => setIsLockScreenOpen(false)}
        members={teamMembers}
        lojaId={currentTenant?.id || DEFAULT_TENANT_ID}
        onUserSwitched={(m) => {
          setActiveMember(m);
        }}
        onFullLogout={handleLogout}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminUnsavedChangesProvider>
        <AdminI18nProvider>
          <AdminShell>{children}</AdminShell>
          <UnsavedChangesModal />
        </AdminI18nProvider>
      </AdminUnsavedChangesProvider>
    </AdminThemeProvider>
  );
}
