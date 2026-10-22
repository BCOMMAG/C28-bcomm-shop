'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { Footer } from '@/components/Footer';
import {
  PRODUCTS,
  STORE_INFO,
  ALL_CATEGORIES,
  CATEGORIES_ROUPAS,
  CATEGORIES_ACESSORIOS,
  FAIXAS_PRECO,
  FILTROS_TECIDO,
  FILTROS_MODELAGEM,
  FILTROS_LINHA,
  FILTROS_STATUS
} from '@/data/products';
import { useStore } from '@/context/StoreContext';
import {
  Search,
  SlidersHorizontal,
  ArrowLeft,
  RotateCcw,
  X,
  Check,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { Product } from '@/types';

function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Contexto Global
  const {
    wishlistIds,
    toggleWishlist,
    addToCart,
    cartCount,
    wishlistCount,
    openCart,
    closeCart,
    cartItems,
    updateCartQuantity,
    removeFromCart,
    selectedProduct,
    isProductModalOpen,
    openProduct,
    closeProduct,
    isSizeGuideOpen,
    openSizeGuide,
    closeSizeGuide,
    isCartOpen,
    searchQuery,
    setSearchQuery,
    products
  } = useStore();

  const handleSafeQuickAdd = (p: Product) => {
    let targetSize = p.sizes?.[0] || 'Tamanho Único';
    let targetColor = p.colors?.[0]?.name || 'Padrão';

    if (p.variations && p.variations.length > 0) {
      const availableVar = p.variations.find((v) => v.stock > 0);
      if (availableVar) {
        targetSize = availableVar.size;
        targetColor = availableVar.color;
      }
    }

    addToCart({
      product: p,
      size: targetSize,
      color: targetColor,
      quantity: 1
    });
  };

  // Parâmetros de URL iniciais
  const urlCategory = searchParams.get('categoria') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlFabric = searchParams.get('tecido') || '';
  const urlMinPrice = searchParams.get('precoMin') ? Number(searchParams.get('precoMin')) : null;
  const urlMaxPrice = searchParams.get('precoMax') ? Number(searchParams.get('precoMax')) : null;
  const urlSearch = searchParams.get('q') || '';

  // Função para criar o estado padrão dos filtros com seleção múltipla
  const createDefaultFilters = (cat?: string, st?: string, minP?: number | null, maxP?: number | null, tec?: string) => {
    const categories: string[] = cat && cat !== 'Todas as Peças' ? [cat] : [];
    const statuses: string[] = st && st !== 'Todos' ? [st] : [];
    const fabrics: string[] = tec ? [tec] : [];
    let priceRangeIndices: number[] = [];

    if (minP !== null || maxP !== null) {
      const idx = FAIXAS_PRECO.findIndex((f) => f.min === (minP ?? 0) && f.max === (maxP ?? 99999));
      if (idx !== -1) priceRangeIndices = [idx];
    }

    return {
      categories,
      priceRangeIndices,
      customMinPrice: minP !== null && priceRangeIndices.length === 0 ? String(minP) : '',
      customMaxPrice: maxP !== null && priceRangeIndices.length === 0 ? String(maxP) : '',
      sizes: [] as string[],
      colors: [] as string[],
      fabrics,
      fits: [] as string[],
      lines: [] as string[],
      statuses
    };
  };

  // 1. Filtros Efetivamente Aplicados na Listagem de Produtos
  const [appliedFilters, setAppliedFilters] = useState(() =>
    createDefaultFilters(urlCategory, urlStatus, urlMinPrice, urlMaxPrice, urlFabric)
  );

  // 2. Filtros em Edição / Rascunho (o usuário pode mexer à vontade e depois clicar em APLICAR FILTROS)
  const [draftFilters, setDraftFilters] = useState(() =>
    createDefaultFilters(urlCategory, urlStatus, urlMinPrice, urlMaxPrice, urlFabric)
  );

  // Estados da Barra Superior
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'newest'>('relevance');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5>(4); // Amostragem de produtos por linha no desktop

  // Controle de Gaveta Mobile de Filtros
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

  // Sincronizar parâmetros de URL quando mudarem
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    } else {
      setSearchQuery('');
    }

    const cat = searchParams.get('categoria');
    const st = searchParams.get('status');
    const tec = searchParams.get('tecido');
    const min = searchParams.get('precoMin') ? Number(searchParams.get('precoMin')) : null;
    const max = searchParams.get('precoMax') ? Number(searchParams.get('precoMax')) : null;

    const updated = createDefaultFilters(cat || undefined, st || undefined, min, max, tec || undefined);
    setAppliedFilters(updated);
    setDraftFilters(updated);
  }, [searchParams, setSearchQuery]);

  const allSizes = ['PP', 'P', 'M', 'G', 'GG', 'Tamanho Único'];
  const allColors = [
    { label: 'Marrom Caramelo', value: 'Marrom Caramelo', hex: '#8B5A2B' },
    { label: 'Branco Off-White', value: 'Branco Off-White', hex: '#FAF9F6' },
    { label: 'Rosa Quartz', value: 'Rosa Quartz', hex: '#E8A598' },
    { label: 'Prata Acetinado', value: 'Prata Acetinado', hex: '#D1D5DB' },
    { label: 'Bege Areia Nobre', value: 'Bege Areia Nobre', hex: '#E2D3B8' },
    { label: 'Preto Clássico', value: 'Preto Clássico', hex: '#1A1918' },
    { label: 'Dourado Champagne', value: 'Dourado Champagne', hex: '#DFBE76' }
  ];

  // Identificação dinâmica de categorias ou subcategorias extras cadastradas no banco
  const dynamicExtraCategories = useMemo(() => {
    const allKnown = new Set([...CATEGORIES_ROUPAS, ...CATEGORIES_ACESSORIOS]);
    const extras = new Set<string>();
    products.forEach((p) => {
      if (p.category && !allKnown.has(p.category)) extras.add(p.category);
      if (p.subcategory && !allKnown.has(p.subcategory)) extras.add(p.subcategory);
    });
    return Array.from(extras).sort();
  }, [products]);

  // Alternadores de Seleção Múltipla para o Rascunho de Filtros
  const toggleDraftCategory = (cat: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const toggleDraftPriceRange = (idx: number) => {
    setDraftFilters((prev) => ({
      ...prev,
      priceRangeIndices: prev.priceRangeIndices.includes(idx)
        ? prev.priceRangeIndices.filter((i) => i !== idx)
        : [...prev.priceRangeIndices, idx],
      customMinPrice: '',
      customMaxPrice: ''
    }));
  };

  const toggleDraftSize = (sz: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(sz)
        ? prev.sizes.filter((s) => s !== sz)
        : [...prev.sizes, sz]
    }));
  };

  const toggleDraftColor = (colVal: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(colVal)
        ? prev.colors.filter((c) => c !== colVal)
        : [...prev.colors, colVal]
    }));
  };

  const toggleDraftFabric = (fab: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      fabrics: prev.fabrics.includes(fab)
        ? prev.fabrics.filter((f) => f !== fab)
        : [...prev.fabrics, fab]
    }));
  };

  const toggleDraftFit = (fit: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      fits: prev.fits.includes(fit)
        ? prev.fits.filter((f) => f !== fit)
        : [...prev.fits, fit]
    }));
  };

  const toggleDraftLine = (lin: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      lines: prev.lines.includes(lin)
        ? prev.lines.filter((l) => l !== lin)
        : [...prev.lines, lin]
    }));
  };

  const toggleDraftStatus = (st: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(st)
        ? prev.statuses.filter((s) => s !== st)
        : [...prev.statuses, st]
    }));
  };

  // AÇÃO 1: APLICAR FILTROS (Efetiva os filtros selecionados)
  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setMobileFilterDrawerOpen(false);
  };

  // AÇÃO 2: REVERTER FILTROS AO NORMAL (Retira todos os filtros aplicados)
  const resetAllFilters = () => {
    const empty = createDefaultFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setSearchQuery('');
    setMobileFilterDrawerOpen(false);
    if (typeof window !== 'undefined' && window.location.search) {
      router.replace('/catalogo', { scroll: false });
    }
  };

  // Ouvir evento global para resetar todos os filtros (ex: ao clicar em "Explorar Catálogo" na sacola)
  useEffect(() => {
    const handleResetEvent = () => {
      resetAllFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('leidy:reset-catalog-filters', handleResetEvent);
    return () => window.removeEventListener('leidy:reset-catalog-filters', handleResetEvent);
  }, []);

  // Remoção de filtros individuais diretamente nas tags ativas
  const removeAppliedCategory = (cat: string) => {
    const updated = appliedFilters.categories.filter((c) => c !== cat);
    setAppliedFilters((prev) => ({ ...prev, categories: updated }));
    setDraftFilters((prev) => ({ ...prev, categories: updated }));
  };

  const removeAppliedStatus = (st: string) => {
    const updated = appliedFilters.statuses.filter((s) => s !== st);
    setAppliedFilters((prev) => ({ ...prev, statuses: updated }));
    setDraftFilters((prev) => ({ ...prev, statuses: updated }));
  };

  const removeAppliedPriceRange = (idx: number) => {
    const updated = appliedFilters.priceRangeIndices.filter((i) => i !== idx);
    setAppliedFilters((prev) => ({ ...prev, priceRangeIndices: updated }));
    setDraftFilters((prev) => ({ ...prev, priceRangeIndices: updated }));
  };

  const clearAppliedCustomPrice = () => {
    setAppliedFilters((prev) => ({ ...prev, customMinPrice: '', customMaxPrice: '' }));
    setDraftFilters((prev) => ({ ...prev, customMinPrice: '', customMaxPrice: '' }));
  };

  const removeAppliedSize = (sz: string) => {
    const updated = appliedFilters.sizes.filter((s) => s !== sz);
    setAppliedFilters((prev) => ({ ...prev, sizes: updated }));
    setDraftFilters((prev) => ({ ...prev, sizes: updated }));
  };

  const removeAppliedColor = (col: string) => {
    const updated = appliedFilters.colors.filter((c) => c !== col);
    setAppliedFilters((prev) => ({ ...prev, colors: updated }));
    setDraftFilters((prev) => ({ ...prev, colors: updated }));
  };

  const removeAppliedFabric = (fab: string) => {
    const updated = appliedFilters.fabrics.filter((f) => f !== fab);
    setAppliedFilters((prev) => ({ ...prev, fabrics: updated }));
    setDraftFilters((prev) => ({ ...prev, fabrics: updated }));
  };

  const removeAppliedFit = (fit: string) => {
    const updated = appliedFilters.fits.filter((f) => f !== fit);
    setAppliedFilters((prev) => ({ ...prev, fits: updated }));
    setDraftFilters((prev) => ({ ...prev, fits: updated }));
  };

  const removeAppliedLine = (lin: string) => {
    const updated = appliedFilters.lines.filter((l) => l !== lin);
    setAppliedFilters((prev) => ({ ...prev, lines: updated }));
    setDraftFilters((prev) => ({ ...prev, lines: updated }));
  };

  // Cálculo da Filtragem Efetiva (baseado em appliedFilters)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q))
      );
    }

    // 2. Categorias (Seleção Múltipla com correspondência inteligente para os links do menu)
    if (appliedFilters.categories.length > 0) {
      result = result.filter((p) =>
        appliedFilters.categories.some((cat) => {
          const catLower = (cat || '').toLowerCase();
          if (catLower === 'acessórios' || catLower === 'acessorios') {
            return (
              p.category.toLowerCase() === 'acessórios' ||
              p.category.toLowerCase() === 'acessorios' ||
              CATEGORIES_ACESSORIOS.some((ac) => ac.toLowerCase() === p.category.toLowerCase()) ||
              Boolean(p.subcategory && CATEGORIES_ACESSORIOS.some((ac) => ac.toLowerCase() === p.subcategory?.toLowerCase()))
            );
          }
          if (catLower === 'tricots') {
            return (
              p.category.toLowerCase().includes('tricot') ||
              (p.subcategory && p.subcategory.toLowerCase().includes('tricot')) ||
              (p.fabric && p.fabric.toLowerCase().includes('tricot'))
            );
          }
          if (catLower === 'alfaiataria') {
            return (
              p.category.toLowerCase().includes('alfaiataria') ||
              (p.fit && p.fit.toLowerCase().includes('alfaiataria')) ||
              p.category.toLowerCase().includes('blazer')
            );
          }
          if (catLower === 'jaquetas e casacos' || catLower === 'casacos & jaquetas') {
            return p.category.toLowerCase().includes('casaco') || p.category.toLowerCase().includes('jaqueta');
          }
          if (catLower === 'shorts e saias' || catLower === 'saias e shorts') {
            return (
              p.category.toLowerCase().includes('saia') ||
              p.category.toLowerCase().includes('short') ||
              p.category.toLowerCase().includes('bermuda')
            );
          }
          if (catLower === 'vestidos e macacões' || catLower === 'vestidos e macacoes') {
            return (
              p.category.toLowerCase().includes('vestido') ||
              p.category.toLowerCase().includes('macacão') ||
              p.category.toLowerCase().includes('macacoes')
            );
          }
          if (catLower === 'vestidos') {
            return p.category.toLowerCase().includes('vestido');
          }
          if (catLower === 'blusas') {
            return (
              p.category.toLowerCase().includes('blusa') ||
              p.category.toLowerCase().includes('camisa') ||
              p.category.toLowerCase().includes('top')
            );
          }
          if (catLower === 'calças' || catLower === 'calcas') {
            return p.category.toLowerCase().includes('calça') || p.category.toLowerCase().includes('calca');
          }
          return (
            p.category.toLowerCase() === catLower ||
            (p.subcategory && p.subcategory.toLowerCase() === catLower) ||
            p.category.toLowerCase().includes(catLower) ||
            catLower.includes(p.category.toLowerCase())
          );
        })
      );
    }

    // 3. Status & Destaques (Seleção Múltipla)
    if (appliedFilters.statuses.length > 0) {
      result = result.filter((p) =>
        appliedFilters.statuses.some((st) => {
          if (st === 'Mais Vendidos') return p.isBestSeller;
          if (st === 'OUTLET' || st === 'Peças em OUTLET' || st === 'BAZAR') return p.isOutlet;
          if (st === 'Novidades' || st === 'Lançamento' || st === 'Lançamento 2026') {
            return p.isNewArrival || p.status?.includes('Lançamento') || p.status?.includes('Novidades');
          }
          if (st === 'Últimas Peças') {
            return p.isLastPieces || (p.remainingPieces !== undefined && p.remainingPieces <= 5) || p.badge?.includes('peça');
          }
          return p.status?.some((s) => s.toLowerCase() === st.toLowerCase());
        })
      );
    }

    // 4. Faixas de Preço (Seleção Múltipla / Manual)
    if (appliedFilters.priceRangeIndices.length > 0) {
      result = result.filter((p) =>
        appliedFilters.priceRangeIndices.some((idx) => {
          const range = FAIXAS_PRECO[idx];
          return range && p.price >= range.min && p.price <= range.max;
        })
      );
    } else {
      const min = appliedFilters.customMinPrice ? parseFloat(appliedFilters.customMinPrice) : null;
      const max = appliedFilters.customMaxPrice ? parseFloat(appliedFilters.customMaxPrice) : null;
      if (min !== null) result = result.filter((p) => p.price >= min);
      if (max !== null) result = result.filter((p) => p.price <= max);
    }

    // 5. Tamanho (Seleção Múltipla)
    if (appliedFilters.sizes.length > 0) {
      result = result.filter((p) =>
        appliedFilters.sizes.some((sz) =>
          p.sizes.some((s) => s.toLowerCase().includes(sz.toLowerCase()))
        )
      );
    }

    // 6. Cor (Seleção Múltipla)
    if (appliedFilters.colors.length > 0) {
      result = result.filter((p) =>
        appliedFilters.colors.some((col) =>
          p.colors.some((c) => c.name.toLowerCase() === col.toLowerCase())
        )
      );
    }

    // 7. Tecido (Seleção Múltipla)
    if (appliedFilters.fabrics.length > 0) {
      result = result.filter((p) =>
        appliedFilters.fabrics.some((fab) => p.fabric === fab)
      );
    }

    // 8. Modelagem (Seleção Múltipla)
    if (appliedFilters.fits.length > 0) {
      result = result.filter((p) =>
        appliedFilters.fits.some((fit) => p.fit === fit)
      );
    }

    // 9. Linha (Seleção Múltipla)
    if (appliedFilters.lines.length > 0) {
      result = result.filter((p) =>
        appliedFilters.lines.some((lin) => p.line === lin)
      );
    }

    // Ordenação
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }

    return result;
  }, [appliedFilters, searchQuery, sortBy, products]);

  // Contagem de Peças que batiam no Rascunho Atual (para o botão "APLICAR FILTROS")
  const draftMatchesCount = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q))
      );
    }

    if (draftFilters.categories.length > 0) {
      result = result.filter((p) =>
        draftFilters.categories.some(
          (cat) =>
            p.category.toLowerCase() === cat.toLowerCase() ||
            (p.subcategory && p.subcategory.toLowerCase() === cat.toLowerCase())
        )
      );
    }

    if (draftFilters.statuses.length > 0) {
      result = result.filter((p) =>
        draftFilters.statuses.some((st) => {
          if (st === 'Mais Vendidos') return p.isBestSeller;
          if (st === 'OUTLET' || st === 'Peças em OUTLET') return p.isOutlet;
          if (st === 'Novidades' || st === 'Lançamento') return p.isNewArrival || p.status?.includes('Lançamento');
          if (st === 'Últimas Peças') return p.isLastPieces || (p.remainingPieces !== undefined && p.remainingPieces <= 5) || p.badge?.includes('peça');
          return p.status?.some((s) => s.toLowerCase() === st.toLowerCase());
        })
      );
    }

    if (draftFilters.priceRangeIndices.length > 0) {
      result = result.filter((p) =>
        draftFilters.priceRangeIndices.some((idx) => {
          const range = FAIXAS_PRECO[idx];
          return range && p.price >= range.min && p.price <= range.max;
        })
      );
    } else {
      const min = draftFilters.customMinPrice ? parseFloat(draftFilters.customMinPrice) : null;
      const max = draftFilters.customMaxPrice ? parseFloat(draftFilters.customMaxPrice) : null;
      if (min !== null) result = result.filter((p) => p.price >= min);
      if (max !== null) result = result.filter((p) => p.price <= max);
    }

    if (draftFilters.sizes.length > 0) {
      result = result.filter((p) =>
        draftFilters.sizes.some((sz) =>
          p.sizes.some((s) => s.toLowerCase().includes(sz.toLowerCase()))
        )
      );
    }

    if (draftFilters.colors.length > 0) {
      result = result.filter((p) =>
        draftFilters.colors.some((col) =>
          p.colors.some((c) => c.name.toLowerCase() === col.toLowerCase())
        )
      );
    }

    if (draftFilters.fabrics.length > 0) {
      result = result.filter((p) =>
        draftFilters.fabrics.some((fab) => p.fabric === fab)
      );
    }

    if (draftFilters.fits.length > 0) {
      result = result.filter((p) =>
        draftFilters.fits.some((fit) => p.fit === fit)
      );
    }

    if (draftFilters.lines.length > 0) {
      result = result.filter((p) =>
        draftFilters.lines.some((lin) => p.line === lin)
      );
    }

    return result.length;
  }, [draftFilters, searchQuery, products]);

  // Contagem de filtros ativos aplicados
  const activeFiltersCount = useMemo(() => {
    return (
      (searchQuery.trim() !== '' ? 1 : 0) +
      appliedFilters.categories.length +
      appliedFilters.statuses.length +
      appliedFilters.priceRangeIndices.length +
      (appliedFilters.customMinPrice || appliedFilters.customMaxPrice ? 1 : 0) +
      appliedFilters.sizes.length +
      appliedFilters.colors.length +
      appliedFilters.fabrics.length +
      appliedFilters.fits.length +
      appliedFilters.lines.length
    );
  }, [appliedFilters, searchQuery]);

  // Contagem de filtros marcados no rascunho
  const draftFiltersCount = useMemo(() => {
    return (
      draftFilters.categories.length +
      draftFilters.statuses.length +
      draftFilters.priceRangeIndices.length +
      (draftFilters.customMinPrice || draftFilters.customMaxPrice ? 1 : 0) +
      draftFilters.sizes.length +
      draftFilters.colors.length +
      draftFilters.fabrics.length +
      draftFilters.fits.length +
      draftFilters.lines.length
    );
  }, [draftFilters]);

  // Controle de Acordeão dos Filtros Laterais
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categorias: true,
    preco: false,
    tamanho: false,
    cor: false,
    tecido: false,
    modelagem: false,
    linha: false,
    status: false
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Renderizador Direto da Barra Lateral de Filtros (Função direta impede desmonte dos inputs e perda de foco)
  const renderFiltersSidebarContent = (isDesktop = false) => (
    <div className="space-y-4 text-[#1A1918] dark:text-[#FAF8F5]">
      
      {/* Botão Superior Rápido para Aplicar Filtros (Exibido na Gaveta Mobile) */}
      {!isDesktop && (
        <div className="pb-1 border-b border-[#C5A059]/15 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
            {draftFiltersCount > 0 ? `${draftFiltersCount} filtros selecionados` : 'Nenhum filtro marcado'}
          </span>
          {(draftFiltersCount > 0 || activeFiltersCount > 0) && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-[#C5A059] dark:text-[#DFBE76] hover:underline font-semibold cursor-pointer"
            >
              Limpar tudo
            </button>
          )}
        </div>
      )}

      {/* 1. Categorias (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('categorias')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Categorias
            </span>
            {draftFilters.categories.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.categories.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.categories.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, categories: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.categorias ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.categorias && (
          <div className="pt-2 max-h-56 overflow-y-auto pr-1 space-y-1 text-xs custom-scrollbar">
            <button
              type="button"
              onClick={() => setDraftFilters((p) => ({ ...p, categories: [] }))}
              className={`w-full text-left py-1.5 px-2.5 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                draftFilters.categories.length === 0
                  ? 'bg-[#1A1918] text-white dark:bg-[#C5A059] font-semibold'
                  : 'hover:bg-[#FAF8F5] dark:hover:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1]'
              }`}
            >
              <span>Todas as Peças</span>
              <span className="text-[10px] opacity-70">({products.length})</span>
            </button>
            
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A8A29E] pt-2 pb-1 px-2">
              Roupas Femininas
            </p>
            {CATEGORIES_ROUPAS.map((cat) => {
              const count = products.filter((p) => p.category === cat || p.subcategory === cat).length;
              const isSelected = draftFilters.categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleDraftCategory(cat)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1918] text-white dark:bg-[#C5A059] font-semibold'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-black/30 dark:border-white/30'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className="text-[10px] opacity-70 shrink-0">({count})</span>
                </button>
              );
            })}

            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A8A29E] pt-2 pb-1 px-2">
              Acessórios
            </p>
            {CATEGORIES_ACESSORIOS.map((cat) => {
              const count = products.filter((p) => p.category === cat || p.subcategory === cat).length;
              const isSelected = draftFilters.categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleDraftCategory(cat)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1918] text-white dark:bg-[#C5A059] font-semibold'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-black/30 dark:border-white/30'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className="text-[10px] opacity-70 shrink-0">({count})</span>
                </button>
              );
            })}

            {dynamicExtraCategories.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A8A29E] pt-2 pb-1 px-2">
                  Outras Categorias & Subs
                </p>
                {dynamicExtraCategories.map((cat) => {
                  const count = products.filter((p) => p.category === cat || p.subcategory === cat).length;
                  const isSelected = draftFilters.categories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleDraftCategory(cat)}
                      className={`w-full text-left py-1.5 px-2.5 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1918] text-white dark:bg-[#C5A059] font-semibold'
                          : 'hover:bg-[#FAF8F5] dark:hover:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-black/30 dark:border-white/30'}`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span className="truncate">{cat}</span>
                      </div>
                      <span className="text-[10px] opacity-70 shrink-0">({count})</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Faixa de Preço (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('preco')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Faixa de Preço
            </span>
            {(draftFilters.priceRangeIndices.length > 0 || draftFilters.customMinPrice || draftFilters.customMaxPrice) && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.priceRangeIndices.length || 1}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {(draftFilters.priceRangeIndices.length > 0 || draftFilters.customMinPrice || draftFilters.customMaxPrice) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, priceRangeIndices: [], customMinPrice: '', customMaxPrice: '' }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.preco ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.preco && (
          <div className="pt-2 space-y-2 text-xs">
            <div className="space-y-1">
              {FAIXAS_PRECO.map((faixa, idx) => {
                const isSelected = draftFilters.priceRangeIndices.includes(idx);
                return (
                  <button
                    type="button"
                    key={faixa.label}
                    onClick={() => toggleDraftPriceRange(idx)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#1A1918] dark:text-[#FAF8F5] font-semibold'
                        : 'border-transparent text-[#57534E] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-black/30 dark:border-white/30'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{faixa.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Inputs de Preço Manual */}
            <div className="pt-2.5 border-t border-[#C5A059]/10 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] dark:text-[#A8A29E] block">
                Digitar faixa personalizada:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] block mb-0.5">Mín (R$)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={draftFilters.customMinPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftFilters((p) => ({ ...p, priceRangeIndices: [], customMinPrice: val }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-none border border-[#C5A059]/30 bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] transition-all"
                  />
                </div>
                <span className="text-xs text-[#78716C] pt-4 font-bold">-</span>
                <div className="flex-1">
                  <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] block mb-0.5">Máx (R$)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="700"
                    value={draftFilters.customMaxPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftFilters((p) => ({ ...p, priceRangeIndices: [], customMaxPrice: val }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-none border border-[#C5A059]/30 bg-white dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>
              {(draftFilters.customMinPrice !== '' || draftFilters.customMaxPrice !== '') && (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-[#C5A059] font-medium">
                    Faixa: R$ {draftFilters.customMinPrice || '0'} até R$ {draftFilters.customMaxPrice || '∞'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftFilters((p) => ({ ...p, customMinPrice: '', customMaxPrice: '' }))}
                    className="text-[10px] text-[#78716C] hover:text-red-500 underline cursor-pointer"
                  >
                    Limpar valores
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tamanhos (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('tamanho')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Tamanho
            </span>
            {draftFilters.sizes.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.sizes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.sizes.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, sizes: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.tamanho ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.tamanho && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {allSizes.map((sz) => {
              const isSelected = draftFilters.sizes.includes(sz);
              return (
                <button
                  type="button"
                  key={sz}
                  onClick={() => toggleDraftSize(sz)}
                  className={`px-3 py-1.5 rounded-none text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white border-[#1A1918] dark:border-[#C5A059] shadow-xs'
                      : 'bg-white dark:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1] border-black/15 dark:border-white/15 hover:border-[#C5A059]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{sz}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Cores (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('cor')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Cor
            </span>
            {draftFilters.colors.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.colors.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.colors.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, colors: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.cor ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.cor && (
          <div className="pt-2 space-y-1">
            {allColors.map((col) => {
              const isSelected = draftFilters.colors.includes(col.value);
              return (
                <button
                  type="button"
                  key={col.value}
                  onClick={() => toggleDraftColor(col.value)}
                  className={`w-full text-left py-1.5 px-2 rounded-none text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059]/15 font-bold text-[#1A1918] dark:text-white border border-[#C5A059]/40'
                      : 'text-[#57534E] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-none border border-black/25 dark:border-white/25 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Tecidos (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('tecido')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Tecido
            </span>
            {draftFilters.fabrics.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.fabrics.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.fabrics.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, fabrics: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.tecido ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.tecido && (
          <div className="pt-2 space-y-1 text-xs">
            {FILTROS_TECIDO.map((fab) => {
              const isSelected = draftFilters.fabrics.includes(fab);
              return (
                <button
                  type="button"
                  key={fab}
                  onClick={() => toggleDraftFabric(fab)}
                  className={`w-full text-left py-1.5 px-2 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059]/15 font-bold text-[#1A1918] dark:text-[#FAF8F5] border border-[#C5A059]/40'
                      : 'text-[#57534E] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-black/30 dark:border-white/30'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{fab}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Modelagem (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('modelagem')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Modelagem
            </span>
            {draftFilters.fits.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.fits.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.fits.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, fits: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.modelagem ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.modelagem && (
          <div className="pt-2 space-y-1 text-xs">
            {FILTROS_MODELAGEM.map((mod) => {
              const isSelected = draftFilters.fits.includes(mod);
              return (
                <button
                  type="button"
                  key={mod}
                  onClick={() => toggleDraftFit(mod)}
                  className={`w-full text-left py-1.5 px-2 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059]/15 font-bold text-[#1A1918] dark:text-[#FAF8F5] border border-[#C5A059]/40'
                      : 'text-[#57534E] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-black/30 dark:border-white/30'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{mod}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Linha de Estilo (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('linha')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Linha
            </span>
            {draftFilters.lines.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.lines.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.lines.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, lines: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.linha ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.linha && (
          <div className="pt-2 space-y-1 text-xs">
            {FILTROS_LINHA.map((lin) => {
              const isSelected = draftFilters.lines.includes(lin);
              return (
                <button
                  type="button"
                  key={lin}
                  onClick={() => toggleDraftLine(lin)}
                  className={`w-full text-left py-1.5 px-2 rounded-none transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059]/15 font-bold text-[#1A1918] dark:text-[#FAF8F5] border border-[#C5A059]/40'
                      : 'text-[#57534E] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#C5A059] bg-[#C5A059] text-white' : 'border-black/30 dark:border-white/30'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{lin}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Status & Destaque (Multi-select) */}
      <div className="border-b border-[#C5A059]/15 pb-2.5">
        <button
          type="button"
          onClick={() => toggleSection('status')}
          className="w-full flex items-center justify-between py-1.5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C5A059] dark:text-[#DFBE76] group-hover:text-[#1A1918] dark:group-hover:text-white transition-colors">
              Status & Destaque
            </span>
            {draftFilters.statuses.length > 0 && (
              <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-none font-bold">
                {draftFilters.statuses.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {draftFilters.statuses.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftFilters((p) => ({ ...p, statuses: [] }));
                }}
                className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:underline cursor-pointer mr-1"
              >
                Limpar
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${
                openSections.status ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSections.status && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {FILTROS_STATUS.map((st) => {
              const isSelected = draftFilters.statuses.includes(st);
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => toggleDraftStatus(st)}
                  className={`px-3 py-1.5 rounded-none text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white border-[#1A1918] dark:border-[#C5A059] shadow-xs'
                      : 'bg-white dark:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1] border-black/15 dark:border-white/15 hover:border-[#C5A059]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botões de Ação do Painel de Filtros: APLICAR FILTROS e Reverter ao Normal */}
      <div className="pt-3 space-y-2">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>APLICAR FILTROS</span>
        </button>

        {(draftFiltersCount > 0 || activeFiltersCount > 0) && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="w-full py-2 border border-[#C5A059]/40 bg-white dark:bg-[#201D1B] text-[#57534E] dark:text-[#D6D3D1] hover:text-[#1A1918] dark:hover:text-white rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reverter Filtros ao Normal</span>
          </button>
        )}
      </div>

    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative z-10 text-[#1A1918] dark:text-[#FAF8F5] transition-colors duration-300">
      {/* Header Fixo com Barra de Pesquisa */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={openCart}
        onOpenWishlist={() => {}}
        onSelectCategory={(cat) => {
          if (cat === 'Todas as Peças') {
            resetAllFilters();
          } else {
            setAppliedFilters((prev) => ({ ...prev, categories: [cat] }));
            setDraftFilters((prev) => ({ ...prev, categories: [cat] }));
          }
        }}
        activeCategory={
          appliedFilters.categories.length === 1
            ? appliedFilters.categories[0]
            : appliedFilters.categories.length > 1
            ? `${appliedFilters.categories.length} Categorias`
            : 'Todas as Peças'
        }
        isSubpage={true}
      />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        {/* CONTAINER EM LARGURA TOTAL PARA PREENCHER MONITORES LARGOS (Conforme solicitado no print) */}
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          
          {/* Navegação / Breadcrumb */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-white/90 hover:text-[#DFBE76] font-semibold transition-colors drop-shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Inicial</span>
            </Link>

            {wishlistCount > 0 && (
              <Link
                href="/favoritos"
                className="text-xs uppercase tracking-wider text-[#DFBE76] hover:underline font-semibold drop-shadow-xs"
              >
                Ver Favoritos ({wishlistCount}) →
              </Link>
            )}
          </div>

          {/* Cabeçalho do Catálogo */}
          <div className="border-b border-[#C5A059]/30 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h1 className="font-serif-luxury text-2xl sm:text-4xl text-white font-medium drop-shadow-sm">
                {appliedFilters.categories.length === 0
                  ? 'Catálogo Completo'
                  : appliedFilters.categories.join(', ')}
              </h1>
              <span className="text-xs text-white/80">
                Mostrando <strong>{filteredProducts.length}</strong> de {products.length} modelos
              </span>
            </div>

            {/* Barra de Pesquisa, Ordenação e Grade em Linha Única (Abaixo de Catálogo Completo conforme solicitado) */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Campo de Pesquisa */}
              <div className="relative flex-1 max-w-md xl:max-w-xl">
                <input
                  type="text"
                  placeholder="Pesquisar por modelo, tecido, cor ou estilo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-none border border-[#C5A059]/30 bg-white dark:bg-[#1A1918] text-[#1A1918] dark:text-[#FAF8F5] placeholder-[#78716C] dark:placeholder-[#A8A29E] focus:outline-none focus:border-[#C5A059] shadow-2xs transition-all"
                />
                <Search className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1A1918] dark:hover:text-white p-1 cursor-pointer"
                    title="Limpar busca"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Controles de Ordenar e Amostragem de Produtos por Linha (Ao lado da pesquisa) */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white dark:bg-[#1A1918] px-3 py-1.5 sm:px-4 sm:py-2 rounded-none border border-[#C5A059]/30 shadow-2xs">
                {/* Botão Mobile para Abrir Gaveta de Filtros */}
                <button
                  type="button"
                  onClick={() => setMobileFilterDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-2.5 py-1.5 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/40 text-xs font-semibold text-[#1A1918] dark:text-[#FAF8F5] cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-none bg-[#C5A059] text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de Ordenação */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#78716C] dark:text-[#A8A29E] hidden sm:inline whitespace-nowrap font-medium">
                    Ordenar:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 sm:px-3 py-1.5 text-xs rounded-none border border-[#C5A059]/30 bg-[#FAF8F5] dark:bg-[#252220] focus:outline-none focus:border-[#C5A059] text-[#1A1918] dark:text-[#FAF8F5] font-medium cursor-pointer"
                  >
                    <option value="relevance">Destaques da Boutique</option>
                    <option value="price-asc">Menor Preço</option>
                    <option value="price-desc">Maior Preço</option>
                    <option value="newest">Mais Recentes</option>
                  </select>
                </div>

                {/* SELETOR DE AMOSTRAGEM / GRADE (Colunas por Linha no Desktop) */}
                <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-[#C5A059]/25">
                  <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E] whitespace-nowrap font-medium">
                    Produtos por linha:
                  </span>
                  {[2, 3, 4, 5].map((cols) => {
                    const isActive = gridColumns === cols;
                    return (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => setGridColumns(cols as 2 | 3 | 4 | 5)}
                        className={`w-7 h-7 rounded-none text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          isActive
                            ? 'bg-[#1A1918] dark:bg-[#C5A059] text-white shadow-xs'
                            : 'bg-[#FAF8F5] dark:bg-[#252220] text-[#57534E] dark:text-[#A8A29E] hover:border-[#C5A059] border border-transparent'
                        }`}
                        title={`Mostrar ${cols} produtos por linha`}
                      >
                        {cols}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* LAYOUT PRINCIPAL DE 2 COLUNAS: FILTROS À ESQUERDA + PRODUTOS EM LARGURA TOTAL */}
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
            
            {/* ============================================================ */}
            {/* 1. COLUNA ESQUERDA: FILTROS DA BOUTIQUE (Scroll Independente com Botão Fixo no Topo) */}
            {/* ============================================================ */}
            <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white dark:bg-[#1A1918] p-4 xl:p-5 rounded-none border border-[#C5A059]/25 shadow-xs sticky top-28 max-h-[calc(100vh-8.5rem)]">
              {/* Header Fixo do Painel Desktop: Título + Botão de Aplicar Filtros no Topo */}
              <div className="shrink-0 pb-3.5 mb-3 border-b border-[#C5A059]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-serif-luxury text-base font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                      Filtros da Boutique
                    </span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] bg-[#C5A059] text-white px-2 py-0.5 rounded-none font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                {/* Botão APLICAR FILTROS Fixo no Topo (Visível imediatamente sem precisar rolar a tela) */}
                <button
                  type="button"
                  onClick={applyFilters}
                  className="w-full py-2.5 px-3 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>APLICAR FILTROS</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#A8A29E] pt-0.5">
                  <span>
                    {draftFiltersCount > 0
                      ? `${draftFiltersCount} ${draftFiltersCount === 1 ? 'filtro selecionado' : 'filtros selecionados'}`
                      : 'Nenhum filtro marcado'}
                  </span>
                  {(draftFiltersCount > 0 || activeFiltersCount > 0) && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-[11px] text-[#C5A059] dark:text-[#DFBE76] hover:underline font-semibold cursor-pointer"
                    >
                      Limpar tudo
                    </button>
                  )}
                </div>
              </div>

              {/* Lista dos Filtros com Rolagem Independente */}
              <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                {renderFiltersSidebarContent(true)}
              </div>
            </aside>

            {/* ============================================================ */}
            {/* 2. COLUNA CENTRAL: CHIPS DE FILTROS ATIVOS + GRID DE PRODUTOS  */}
            {/* ============================================================ */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* CHIPS DE FILTROS ATIVOS (Remoção Rápida com 'X') */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs text-white font-semibold mr-1 drop-shadow-xs">
                    Filtros ativos:
                  </span>

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs">
                      <span>Busca: "{searchQuery}"</span>
                      <button onClick={() => setSearchQuery('')} className="hover:text-red-400 cursor-pointer text-[#DFBE76]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {appliedFilters.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => removeAppliedCategory(cat)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover filtro ${cat}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.statuses.map((st) => (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>{st}</span>
                      <button
                        onClick={() => removeAppliedStatus(st)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover status ${st}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.priceRangeIndices.map((idx) => {
                    const fx = FAIXAS_PRECO[idx];
                    if (!fx) return null;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                      >
                        <span>{fx.label}</span>
                        <button
                          onClick={() => removeAppliedPriceRange(idx)}
                          className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                          title={`Remover faixa de preço ${fx.label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  {(appliedFilters.customMinPrice || appliedFilters.customMaxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs">
                      <span>
                        R$ {appliedFilters.customMinPrice || 0} - R${' '}
                        {appliedFilters.customMaxPrice || 'Max'}
                      </span>
                      <button
                        onClick={clearAppliedCustomPrice}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title="Remover preço personalizado"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {appliedFilters.sizes.map((sz) => (
                    <span
                      key={sz}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>Tam: {sz}</span>
                      <button
                        onClick={() => removeAppliedSize(sz)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover tamanho ${sz}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.colors.map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>Cor: {col}</span>
                      <button
                        onClick={() => removeAppliedColor(col)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover cor ${col}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.fabrics.map((fab) => (
                    <span
                      key={fab}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>Tecido: {fab}</span>
                      <button
                        onClick={() => removeAppliedFabric(fab)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover tecido ${fab}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.fits.map((fit) => (
                    <span
                      key={fit}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>Modelagem: {fit}</span>
                      <button
                        onClick={() => removeAppliedFit(fit)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover modelagem ${fit}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {appliedFilters.lines.map((lin) => (
                    <span
                      key={lin}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black/60 dark:bg-[#1A1918]/90 border border-[#C5A059]/50 text-xs text-white font-medium shadow-sm backdrop-blur-xs"
                    >
                      <span>Linha: {lin}</span>
                      <button
                        onClick={() => removeAppliedLine(lin)}
                        className="hover:text-red-400 cursor-pointer text-[#DFBE76]"
                        title={`Remover linha ${lin}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-[#DFBE76] hover:text-white hover:underline font-semibold ml-auto cursor-pointer flex items-center gap-1 transition-colors drop-shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reverter filtros</span>
                  </button>
                </div>
              )}

              {/* GRID DE PRODUTOS DINÂMICO CONFORME AMOSTRAGEM ESCOLHIDA */}
              {filteredProducts.length > 0 ? (
                <div
                  className={`grid grid-cols-2 ${
                    gridColumns === 2
                      ? 'lg:grid-cols-2'
                      : gridColumns === 3
                      ? 'lg:grid-cols-3'
                      : gridColumns === 5
                      ? 'lg:grid-cols-5'
                      : 'lg:grid-cols-4'
                  } gap-3 sm:gap-4`}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpenDetails={openProduct}
                      onQuickAdd={handleSafeQuickAdd}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      isOutletSection={product.isOutlet}
                      columnsCount={gridColumns}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1A1918] rounded-none p-12 text-center border border-[#C5A059]/20 space-y-4 my-8">
                  <div className="w-16 h-16 rounded-none bg-[#FAF8F5] dark:bg-[#252220] border border-[#C5A059]/30 flex items-center justify-center mx-auto text-[#C5A059]">
                    <SlidersHorizontal className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#1A1918] dark:text-[#FAF8F5] font-medium">
                    Nenhuma peça encontrada com essa combinação
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] max-w-md mx-auto">
                    Tente ajustar o tamanho, a faixa de preço ou a categoria para visualizar outros modelos da nossa boutique.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="px-6 py-2.5 bg-[#1A1918] dark:bg-[#C5A059] text-white rounded-none text-xs uppercase tracking-widest font-semibold hover:bg-[#C5A059] transition-all cursor-pointer"
                  >
                    Ver Todas as Peças ({products.length})
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      {/* Vistos Recentemente no Catálogo */}
      <RecentlyViewedSection
        onOpenDetails={openProduct}
        onQuickAdd={handleSafeQuickAdd}
        isWishlisted={(id) => wishlistIds.includes(id)}
        onToggleWishlist={toggleWishlist}
      />

      <Footer />

      {/* GAVETA / MODAL DE FILTROS PARA DISPOSITIVOS MÓVEIS */}
      {mobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setMobileFilterDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs bg-white dark:bg-[#1A1918] shadow-2xl flex flex-col border-r border-[#C5A059]/30">
              <div className="p-4 border-b border-[#C5A059]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-serif-luxury text-base font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                    Filtros da Boutique
                  </span>
                </div>
                <button
                  onClick={() => setMobileFilterDrawerOpen(false)}
                  className="p-1.5 text-[#57534E] dark:text-[#A8A29E] hover:text-[#1A1918] rounded-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {renderFiltersSidebarContent()}
              </div>

              <div className="p-4 border-t border-[#C5A059]/20 bg-[#FAF8F5] dark:bg-[#141312] space-y-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="w-full py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] rounded-none text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>APLICAR FILTROS</span>
                </button>

                {(draftFiltersCount > 0 || activeFiltersCount > 0) && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="w-full py-2.5 border border-[#C5A059]/40 bg-white dark:bg-[#201D1B] text-[#57534E] dark:text-[#D6D3D1] hover:text-[#1A1918] dark:hover:text-white rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reverter Filtros ao Normal</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={closeProduct}
        onAddToCart={addToCart}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
        onOpenSizeGuide={openSizeGuide}
        onSelectPairedProduct={openProduct}
      />

      {/* Sacola Lateral */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onQuickAddItem={openProduct}
      />

      {/* Modal Guia de Medidas */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={closeSizeGuide}
        product={selectedProduct}
      />
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121110] flex items-center justify-center text-xs text-[#78716C]">Carregando catálogo da Leidy Boutique...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}
