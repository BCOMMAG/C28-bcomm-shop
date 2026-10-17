'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  User,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { STORE_INFO } from '@/data/products';

export interface SubOption {
  label: string;
  type: 'status' | 'category' | 'fabric';
  value: string;
  extraCategory?: string;
  extraFabric?: string;
}

export interface NavItem {
  label: string;
  type: 'status' | 'category' | 'fabric';
  value: string;
  isSpecial?: boolean;
  subOptions?: SubOption[];
}

// Linha 1 de Peças e Coleções no Menu Superior Desktop (Sem "Primavera Verão 2026", com subopções)
export const MENU_ROW_1: NavItem[] = [
  {
    label: 'Lançamento 2026',
    type: 'status',
    value: 'Lançamento',
    subOptions: [
      { label: 'Ver Todos os Lançamentos', type: 'status', value: 'Lançamento' },
      { label: 'Blusas & Tops', type: 'status', value: 'Lançamento', extraCategory: 'Blusas & Tops' },
      { label: 'Calças', type: 'status', value: 'Lançamento', extraCategory: 'Calças' },
      { label: 'Vestidos & Macacões', type: 'status', value: 'Lançamento', extraCategory: 'Vestidos & Macacões' },
      { label: 'Casacos & Jaquetas', type: 'status', value: 'Lançamento', extraCategory: 'Casacos & Jaquetas' },
      { label: 'Blazers & Alfaiataria', type: 'status', value: 'Lançamento', extraCategory: 'Blazers & Alfaiataria' },
      { label: 'Conjuntos Exclusivos', type: 'status', value: 'Lançamento', extraCategory: 'Conjuntos Exclusivos' },
    ]
  },
  {
    label: 'Acessórios',
    type: 'category',
    value: 'Acessórios',
    subOptions: [
      { label: 'Ver Todos os Acessórios', type: 'category', value: 'Acessórios' },
      { label: 'Bolsas & Carteiras', type: 'category', value: 'Bolsas & Carteiras' },
      { label: 'Cintos', type: 'category', value: 'Cintos' },
      { label: 'Colares & Joias', type: 'category', value: 'Colares & Joias' },
      { label: 'Lenços', type: 'category', value: 'Lenços' },
      { label: 'Óculos de Sol', type: 'category', value: 'Óculos de Sol' },
    ]
  },
  {
    label: 'Tricots',
    type: 'category',
    value: 'Tricots',
    subOptions: [
      { label: 'Ver Todos os Tricots', type: 'category', value: 'Tricots' },
      { label: 'Casacos em Tricot Biamar', type: 'category', value: 'Casacos & Jaquetas', extraFabric: 'Tricot Biamar' },
      { label: 'Blusas em Tricot Especial', type: 'category', value: 'Blusas & Tops', extraFabric: 'Tricot Biamar' },
    ]
  },
  {
    label: 'Linho Nobre',
    type: 'fabric',
    value: 'Linho Puro',
    subOptions: [
      { label: 'Ver Todas as Peças em Linho', type: 'fabric', value: 'Linho Puro' },
      { label: 'Conjuntos em Linho', type: 'category', value: 'Conjuntos Exclusivos', extraFabric: 'Linho Puro' },
      { label: 'Alfaiataria em Linho', type: 'category', value: 'Blazers & Alfaiataria', extraFabric: 'Linho Puro' },
    ]
  },
  { label: 'Blusas', type: 'category', value: 'Blusas' },
  { label: 'Calças', type: 'category', value: 'Calças' },
];

// Linha 2 de Peças e Coleções no Menu Superior Desktop
export const MENU_ROW_2: NavItem[] = [
  { label: 'Alfaiataria', type: 'category', value: 'Alfaiataria' },
  { label: 'Vestidos', type: 'category', value: 'Vestidos' },
  { label: 'Jaquetas E Casacos', type: 'category', value: 'Jaquetas E Casacos' },
  { label: 'Shorts E Saias', type: 'category', value: 'Shorts E Saias' },
  { label: 'Vestidos E Macacões', type: 'category', value: 'Vestidos E Macacões' },
  { label: 'BAZAR', type: 'status', value: 'OUTLET', isSpecial: true },
  { label: 'Últimas Peças', type: 'status', value: 'Últimas Peças', isSpecial: true },
];

// Itens da Gaveta Lateral Esquerda (Desktop e Mobile)
export const SIDE_DRAWER_ITEMS: NavItem[] = [
  MENU_ROW_1[0], // Lançamento 2026 (com subopções)
  MENU_ROW_1[1], // Acessórios (com subopções)
  MENU_ROW_1[2], // Tricots (com subopções)
  MENU_ROW_1[3], // Linho Nobre (com subopções)
  MENU_ROW_1[4], // Blusas
  MENU_ROW_1[5], // Calças
  MENU_ROW_2[0], // Alfaiataria
  MENU_ROW_2[1], // Vestidos
  MENU_ROW_2[2], // Jaquetas E Casacos
  MENU_ROW_2[3], // Shorts E Saias
  MENU_ROW_2[4], // Vestidos E Macacões
  MENU_ROW_2[5], // BAZAR
  MENU_ROW_2[6], // Últimas Peças
];

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
  isSubpage?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onSelectCategory,
  activeCategory = 'Todas as Peças',
  isSubpage = false
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    isSideDrawerOpen,
    openSideDrawer: openSideDrawerContext,
    closeSideDrawer: closeSideDrawerContext,
    announcementBar
  } = useStore();

  const [headerSearchInput, setHeaderSearchInput] = useState(searchQuery || '');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Estados dos acordions da gaveta lateral (inicia com nenhuma opção pré-selecionada)
  const [expandedDrawerItem, setExpandedDrawerItem] = useState<string | null>(null);

  // Função para abrir a gaveta lateral sempre com opções recolhidas
  const openSideDrawer = () => {
    setExpandedDrawerItem(null);
    openSideDrawerContext();
  };

  // Estado de dropdown flutuante no menu desktop superior com tolerância de transição (grace period)
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropdownMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDesktopDropdown(label);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDesktopDropdown(null);
    }, 260); // 260ms de tolerância evita que o menu suma ao mover o mouse entre o botão e o submenu
  };

  // Limpa timer se o componente for desmontado
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Sincroniza estado de busca se alterado externamente
  useEffect(() => {
    setHeaderSearchInput(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    if (isSubpage) {
      setIsScrolled(true);
      return;
    }
    const handleScroll = () => {
      const top = window.scrollY || document.documentElement.scrollTop || window.pageYOffset || 0;
      setIsScrolled(top > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSubpage]);

  // Trava scroll do body quando a gaveta lateral estiver aberta
  useEffect(() => {
    if (isSideDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSideDrawerOpen]);

  // Regra 1: O menu superior tem que ser transparente na home até o usuário rolar a página
  const isHome = pathname === '/';
  const isTransparent = isHome && !isScrolled && !isSubpage;

  // Executa busca textual no catálogo
  const executeHeaderSearch = (textToSearch?: string) => {
    const term = (textToSearch !== undefined ? textToSearch : headerSearchInput).trim();
    if (!term) return;
    setSearchQuery(term);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    closeSideDrawerContext();
    router.push(`/catalogo?q=${encodeURIComponent(term)}`);
  };

  // Navegação direta das opções de peças do menu
  const handleNavClick = (item: {
    type: string;
    value: string;
    extraCategory?: string;
    extraFabric?: string;
  }) => {
    closeSideDrawerContext();
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDesktopDropdown(null);

    const params = new URLSearchParams();

    if (item.type === 'status') {
      params.set('status', item.value);
      if (item.extraCategory) {
        params.set('categoria', item.extraCategory);
      }
    } else if (item.type === 'category') {
      params.set('categoria', item.value);
      if (item.extraFabric) {
        params.set('tecido', item.extraFabric);
      }
    } else if (item.type === 'fabric') {
      params.set('tecido', item.value);
      if (item.extraCategory) {
        params.set('categoria', item.extraCategory);
      }
    }

    const query = params.toString();
    const targetUrl = query ? `/catalogo?${query}` : '/catalogo';
    router.push(targetUrl);
  };

  const toggleDrawerAccordion = (label: string) => {
    setExpandedDrawerItem((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isTransparent
            ? 'bg-transparent border-b border-transparent shadow-none'
            : 'bg-[#FAF8F5]/98 dark:bg-[#141312]/98 backdrop-blur-md border-b border-[#C5A059]/25 shadow-xs'
        }`}
      >
        {/* BARRA SUPERIOR DE AVISOS DINÂMICA (ANNOUNCEMENT BAR) */}
        {announcementBar?.active && (
          <div className="bg-[#1A1918]/95 backdrop-blur-md text-[#DFBE76] border-b border-[#DFBE76]/25 py-1.5 px-3 text-center text-[10px] sm:text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 transition-all">
            <Sparkles className="w-3 h-3 text-[#DFBE76] shrink-0 animate-pulse" />
            <span className="truncate max-w-[90vw]">{announcementBar.text}</span>
          </div>
        )}

        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative flex items-center justify-between h-16 sm:h-20 lg:h-[86px] transition-all duration-300">
            
            {/* 1. LADO ESQUERDO: Botão Menu Lateral (Mobile & Desktop) */}
            <div className="flex items-center shrink-0 z-20">
              <button
                onClick={openSideDrawer}
                className={`p-1.5 sm:p-2 transition-colors cursor-pointer flex items-center gap-1.5 group ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059]'
                }`}
                title="Abrir menu de categorias"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-105" />
                <span className="hidden xl:inline text-xs font-semibold uppercase tracking-wider group-hover:text-[#C5A059]">
                  Menu
                </span>
              </button>
            </div>

            {/* 2. LOGO NO DESKTOP: Posicionada um pouco mais para a direita (entre a opção Menu e as opções do centro) */}
            <div className="hidden lg:flex items-center shrink-0 ml-4 xl:ml-8 2xl:ml-12 mr-6 xl:mr-10 2xl:mr-14 z-20">
              <Link
                href="/"
                className="flex items-center cursor-pointer transition-transform duration-300 hover:scale-105 shrink-0"
                title="Leidy Boutique - Início"
              >
                <div className="relative w-36 sm:w-44 lg:w-48 xl:w-52 h-10 sm:h-12 lg:h-14 flex items-center shrink-0">
                  <Image
                    src="/images/Logo sem fundo.png"
                    alt="Leidy Boutique"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* 3. LOGO NO MOBILE: Exatamente no meio da tela (Regra 3) */}
            <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
              <Link href="/" className="flex items-center justify-center" title="Leidy Boutique">
                <div className="relative w-28 sm:w-36 h-8 sm:h-10 flex items-center justify-center">
                  <Image
                    src="/images/Logo sem fundo.png"
                    alt="Leidy Boutique"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* 4. CENTRO (DESKTOP): Links de Navegação em 2 Linhas com Dropdown de Subopções */}
            <nav className="hidden lg:flex flex-col justify-center items-center gap-1 px-2 xl:px-4 flex-1 min-w-0">
              {/* Linha 1 com z-30 para sobrepor perfeitamente a Linha 2 */}
              <div
                className={`relative z-30 flex items-center justify-center gap-x-3.5 xl:gap-x-5 2xl:gap-x-6 text-[11px] xl:text-xs 2xl:text-[13px] font-medium tracking-normal ${
                  isTransparent ? 'text-white/95 drop-shadow-sm' : 'text-[#1A1918] dark:text-[#FAF8F5]'
                }`}
              >
                {MENU_ROW_1.map((item) => {
                  const hasSub = Boolean(item.subOptions && item.subOptions.length > 0);
                  const isDropdownActive = activeDesktopDropdown === item.label;

                  return (
                    <div
                      key={item.label}
                      className={`relative ${isDropdownActive ? 'z-50' : 'z-20'}`}
                      onMouseEnter={() => hasSub && handleDropdownMouseEnter(item.label)}
                      onMouseLeave={() => hasSub && handleDropdownMouseLeave()}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick(item)}
                        className={`whitespace-nowrap transition-colors cursor-pointer py-1 flex items-center gap-0.5 ${
                          isTransparent
                            ? 'hover:text-[#DFBE76]'
                            : 'hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {hasSub && <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />}
                      </button>

                      {/* Dropdown flutuante desktop com ponte invisível e tolerância de hover para não sumir ao mover o mouse */}
                      {hasSub && isDropdownActive && (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-1.5 z-50 animate-fadeIn"
                          onMouseEnter={() => handleDropdownMouseEnter(item.label)}
                          onMouseLeave={handleDropdownMouseLeave}
                        >
                          {/* Ponte invisível que impede que o mouse saia da área ativa durante o deslocamento */}
                          <div className="absolute -top-3 inset-x-0 h-3 bg-transparent pointer-events-auto" />
                          <div className="relative bg-white dark:bg-[#1A1918] border border-[#C5A059]/40 shadow-2xl p-2 min-w-[220px] space-y-1">
                            <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold block px-2 py-1 border-b border-[#C5A059]/15">
                              {item.label}
                            </span>
                            {item.subOptions!.map((sub) => (
                              <button
                                key={sub.label}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick(sub);
                                }}
                                className="w-full text-left text-xs py-1.5 px-2.5 text-[#1A1918] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] hover:text-[#C5A059] transition-colors rounded-none truncate cursor-pointer"
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Linha 2 com z-10 */}
              <div
                className={`relative z-10 flex items-center justify-center gap-x-3.5 xl:gap-x-5 2xl:gap-x-6 text-[11px] xl:text-xs 2xl:text-[13px] font-medium tracking-normal ${
                  isTransparent ? 'text-white/95 drop-shadow-sm' : 'text-[#1A1918] dark:text-[#FAF8F5]'
                }`}
              >
                {MENU_ROW_2.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
                      item.isSpecial
                        ? item.label === 'BAZAR'
                          ? 'font-bold text-[#C5A059] dark:text-[#DFBE76] hover:text-[#1A1918] dark:hover:text-white'
                          : 'font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-600'
                        : isTransparent
                        ? 'hover:text-[#DFBE76]'
                        : 'hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* 5. LADO DIREITO: Ações do Header */}
            {/* Desktop: Busca Expansível, Modo Noturno, Favoritos e Sacola */}
            {/* Mobile: EXCLUSIVAMENTE Pesquisar, Favoritos e Sacola (Regra 4) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0 z-20">
              
              {/* DESKTOP: Busca Expansível */}
              <div className="relative hidden lg:flex items-center">
                {desktopSearchOpen ? (
                  <div className="flex items-center gap-1 bg-white dark:bg-[#201D1B] border border-[#C5A059]/40 px-2 py-1 shadow-md animate-fadeIn">
                    <Search className="w-3.5 h-3.5 text-[#C5A059]" />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={headerSearchInput}
                      autoFocus
                      onChange={(e) => setHeaderSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          executeHeaderSearch();
                        }
                        if (e.key === 'Escape') {
                          setDesktopSearchOpen(false);
                        }
                      }}
                      className="w-32 lg:w-44 px-1.5 py-0.5 text-xs bg-transparent text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none"
                    />
                    {headerSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderSearchInput('');
                          setSearchQuery('');
                        }}
                        className="p-0.5 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white cursor-pointer"
                        title="Limpar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => executeHeaderSearch()}
                      className="p-1 rounded-none bg-[#22C55E] hover:bg-[#16A34A] text-white cursor-pointer transition-transform hover:scale-105"
                      title="Pesquisar no catálogo"
                    >
                      <ArrowRight className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopSearchOpen(false)}
                      className="p-1 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white cursor-pointer"
                      title="Fechar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDesktopSearchOpen(true)}
                    className={`p-1.5 sm:p-2 transition-colors cursor-pointer ${
                      isTransparent
                        ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                        : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                    }`}
                    title="Pesquisar no site"
                    aria-label="Pesquisar"
                  >
                    <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>

              {/* DESKTOP: Alternador de Modo Escuro / Claro */}
              <button
                onClick={toggleTheme}
                className={`hidden lg:flex p-1.5 sm:p-2 transition-colors cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                }`}
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#DFBE76] transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform hover:-rotate-12" />
                )}
              </button>

              {/* MOBILE: Botão PESQUISAR (Substitui o modo noturno no mobile conforme solicitado) */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className={`lg:hidden p-1.5 sm:p-2 transition-colors cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                }`}
                title="Pesquisar peças"
                aria-label="Pesquisar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Minha Conta & Rastreamento (Exibido em Mobile e Desktop) */}
              <Link
                href="/minha-conta"
                className={`relative p-1.5 sm:p-2 transition-colors cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                }`}
                aria-label="Minha Conta e Rastreamento de Pedidos"
                title="Minha Conta & Rastreio"
              >
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </Link>

              {/* Favoritos (Exibido em Mobile e Desktop) */}
              <Link
                href="/favoritos"
                className={`relative p-1.5 sm:p-2 transition-colors cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                }`}
                aria-label="Ver coleção de favoritos"
                title="Meus Favoritos"
              >
                <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[#C5A059] text-white text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-none flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Sacola de Compras com Contador (Exibido em Mobile e Desktop) */}
              <button
                onClick={onOpenCart}
                className={`relative p-1.5 sm:p-2 transition-transform active:scale-95 cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#DFBE76] drop-shadow-sm'
                    : 'text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] dark:hover:text-[#DFBE76]'
                }`}
                aria-label="Abrir sacola de compras"
                title="Sacola de Compras"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.7]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C5A059] text-white text-[9px] sm:text-[10px] w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-none flex items-center justify-center font-bold border-1.5 border-white dark:border-[#141312] animate-scale shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* 6. BARRA DE PESQUISA NO MOBILE: Campo com botão "Buscar na Loja" e flexa verde (Regra 4) */}
        {mobileSearchOpen && (
          <div className="lg:hidden bg-white/98 dark:bg-[#141312]/98 border-t border-b border-[#C5A059]/30 p-3 sm:p-3.5 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="O que você está procurando? (Ex: vestido, tricot...)"
                  value={headerSearchInput}
                  autoFocus
                  onChange={(e) => setHeaderSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeHeaderSearch();
                    }
                  }}
                  className="w-full pl-8.5 pr-8 py-2 text-xs rounded-none border border-[#C5A059]/40 bg-[#FAF8F5] dark:bg-[#201D1B] text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
                />
                <Search className="w-3.5 h-3.5 text-[#C5A059] absolute left-2.5 top-1/2 -translate-y-1/2" />
                {headerSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderSearchInput('');
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white"
                    title="Limpar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botão "Buscar na Loja" com Flexa Verde conforme solicitado */}
              <button
                type="button"
                onClick={() => executeHeaderSearch()}
                className="py-2 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm cursor-pointer transition-transform active:scale-95 shrink-0"
                title="Buscar na Loja"
              >
                <span>Buscar na Loja</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              {/* Fechar Busca Mobile */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white cursor-pointer shrink-0"
                title="Fechar busca"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 7. GAVETA LATERAL ESQUERDA (DESKTOP E MOBILE) */}
      {isSideDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop escuro com desfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={closeSideDrawerContext}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-[88vw] max-w-sm sm:max-w-md bg-[#FAF8F5] dark:bg-[#181615] text-[#1A1918] dark:text-[#FAF8F5] shadow-2xl flex flex-col border-r border-[#C5A059]/30 h-full animate-slide-in-left">
              
              {/* Topo da Gaveta: Limpo e Elegante (SEM "Minha Conta & Atendimento" conforme Regra 2) */}
              <div className="p-4 sm:p-5 border-b border-[#C5A059]/20 flex items-center justify-between bg-white dark:bg-[#1E1C1A] shrink-0">
                <span className="text-xs uppercase tracking-[0.2em] text-[#C5A059] dark:text-[#DFBE76] font-bold">
                  Navegue por Peças
                </span>
                <button
                  onClick={closeSideDrawerContext}
                  className="p-1.5 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white transition-colors cursor-pointer"
                  title="Fechar menu"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Lista Vertical de Peças e Coleções com Acordeão Interativo para Subopções (Regra 2) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1 custom-scrollbar">
                {SIDE_DRAWER_ITEMS.map((item) => {
                  const hasSub = Boolean(item.subOptions && item.subOptions.length > 0);
                  const isExpanded = expandedDrawerItem === item.label;

                  return (
                    <div key={item.label} className="border-b border-[#C5A059]/10 last:border-0 pb-1">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (hasSub) {
                              toggleDrawerAccordion(item.label);
                            } else {
                              handleNavClick(item);
                            }
                          }}
                          className="w-full flex items-center justify-between py-2.5 sm:py-3 px-2 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-none transition-colors group cursor-pointer"
                        >
                          <span
                            className={`text-sm sm:text-base ${
                              item.isSpecial
                                ? item.label === 'BAZAR'
                                  ? 'font-bold text-[#C5A059] dark:text-[#DFBE76]'
                                  : 'font-semibold text-rose-600 dark:text-rose-400'
                                : 'font-semibold text-[#2D1B20] dark:text-[#FAF8F5] group-hover:text-[#C5A059] dark:group-hover:text-[#DFBE76]'
                            }`}
                          >
                            {item.label}
                          </span>
                          {hasSub && (
                            <ChevronRight
                              className={`w-4 h-4 text-[#78716C] dark:text-[#A8A29E] transition-transform duration-200 ${
                                isExpanded ? 'rotate-90 text-[#C5A059]' : ''
                              }`}
                            />
                          )}
                        </button>
                      </div>

                      {/* Subopções exibidas ao clicar no item (ex: Blusas, Calças, Vestidos etc.) */}
                      {hasSub && isExpanded && (
                        <div className="pl-4 pr-2 pb-2 pt-1 space-y-1 bg-black/5 dark:bg-white/5 border-l-2 border-[#C5A059] animate-fadeIn">
                          {item.subOptions!.map((sub) => (
                            <button
                              key={sub.label}
                              type="button"
                              onClick={() => handleNavClick(sub)}
                              className="w-full text-left py-2 px-2.5 text-xs sm:text-sm font-medium text-[#57534E] dark:text-[#D6D3D1] hover:text-[#C5A059] dark:hover:text-[#DFBE76] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{sub.label}</span>
                              <span className="text-[10px] text-[#A8A29E]">→</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rodapé da Gaveta: Meus Pedidos, Meus Favoritos, WhatsApp VIP e Modo Escuro */}
              <div className="p-4 sm:p-5 border-t border-[#C5A059]/20 bg-white dark:bg-[#1E1C1A] space-y-2.5 shrink-0">
                <Link
                  href="/minha-conta"
                  onClick={closeSideDrawerContext}
                  className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] py-1"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <span>Espaço VIP / Meus Pedidos</span>
                  </div>
                  <span className="text-[10px] text-[#C5A059] uppercase tracking-wider font-bold">
                    Rastrear
                  </span>
                </Link>

                <Link
                  href="/favoritos"
                  onClick={closeSideDrawerContext}
                  className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1A1918] dark:text-[#FAF8F5] hover:text-[#C5A059] py-1"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#C5A059]" />
                    <span>Meus Favoritos</span>
                  </div>
                  <span className="bg-[#C5A059] text-white px-2 py-0.5 rounded-none font-bold text-xs">
                    {wishlistCount}
                  </span>
                </Link>

                <a
                  href={`https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(
                    'Olá Leidy! Gostaria de um atendimento personalizado na boutique.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366] text-[#1A1918] dark:text-white hover:text-white border border-[#25D366]/30 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white" />
                  <span>Atendimento VIP no WhatsApp</span>
                </a>

                {/* Alternador de Modo Escuro / Claro */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between py-2 px-3 bg-[#FAF8F5] dark:bg-[#201D1B] border border-[#C5A059]/30 text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] hover:border-[#C5A059] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-[#DFBE76]" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#C5A059]" />
                    )}
                    <span>Modo Visual: {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                  </div>
                  <span className="text-[11px] text-[#C5A059] underline font-medium">
                    {theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
