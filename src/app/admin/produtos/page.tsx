'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  Upload,
  Video,
  Star,
  DollarSign,
  Tag,
  FileText,
  Palette,
  ArrowRight,
  Download,
  CheckSquare,
  Square,
  ShieldAlert,
  Sliders,
  Scissors,
  Clock,
  Bell,
  LayoutGrid,
  List,
  Kanban,
  SlidersHorizontal,
  Check,
  Smartphone,
  ArrowLeft,
  Columns3,
  ScrollText,
  Play,
  Film,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProductBatchImportModal } from '@/components/admin/products/ProductBatchImportModal';
import {
  getAdminProducts,
  toggleAdminProductActive,
  updateAdminProductDetails,
  updateAdminVariationStock,
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminCategoriesFull,
  saveAdminCategory,
  checkProductOrdersCount,
  updateAdminProductFull,
  bulkToggleProductActive,
  bulkApplyDiscount,
  bulkUpdateCategory,
  bulkArchiveProducts,
  AdminProductItem,
  AdminCategoryFull,
  CreateProductInput,
  UpdateProductInput,
  getStoreCustomAttributes,
  saveStoreCustomAttribute,
  updateAdminVariationStockDirect,
  StoreCustomAttributes,
  CustomSinalizador,
  DEFAULT_STORE_ATTRIBUTES
} from '@/lib/admin';
import { uploadBrowserFileToR2, deleteFromR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { PRODUCTS } from '@/data/products';
import { useStore, notifyStockChangeCrossTab } from '@/context/StoreContext';
import { ProductFittingRoomModal } from '@/components/admin/products/ProductFittingRoomModal';
import { ProductWaitlistModal } from '@/components/admin/products/ProductWaitlistModal';
import { AdminCreatableSelect } from '@/components/admin/products/AdminCreatableSelect';
import { CrossSellPickerModal } from '@/components/admin/products/CrossSellPickerModal';
import { getReservedStockMap } from '@/lib/reservas';
import { getAviseMeSummaryMap } from '@/lib/aviseme';
import { getStorefrontUrl } from '@/lib/routes';

type ViewMode = 'cards' | 'lista' | 'kanban';
type SortOrder = 'recentes' | 'menor_estoque' | 'maior_estoque' | 'maior_preco' | 'menor_preco' | 'nome';

export default function AdminProdutosPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<AdminCategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [stockFilter, setStockFilter] = useState<
    'todos' | 'criticos' | 'esgotados' | 'ativos' | 'pausados' | 'destaques' | 'outlet' | 'mais_vendidos' | 'ultimas_pecas'
  >('todos');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modos de Visualização & Ordenação
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recentes');

  // Popover de Filtros Avançados
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados de Reserva de Provador (30 min)
  const [reservedStockMap, setReservedStockMap] = useState<Record<string, number>>({});
  const [isFittingModalOpen, setIsFittingModalOpen] = useState(false);
  const [selectedFittingProduct, setSelectedFittingProduct] = useState<AdminProductItem | null>(null);

  // Estados de Fila de Espera (Avise-me Quando Chegar)
  const [aviseMeSummary, setAviseMeSummary] = useState<Record<string, number>>({});
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [selectedWaitlistProduct, setSelectedWaitlistProduct] = useState<AdminProductItem | null>(null);

  // Modal de Criação de Produto
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Estado do formulário de novo produto
  const [newProductName, setNewProductName] = useState('');
  const [newProductSlug, setNewProductSlug] = useState('');
  const [newProductCatId, setNewProductCatId] = useState('');
  const [newProductSubcat, setNewProductSubcat] = useState('');
  const [newCustomCatName, setNewCustomCatName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductPromoPrice, setNewProductPromoPrice] = useState('');
  const [newProductCostPrice, setNewProductCostPrice] = useState('');
  const [newProductFabric, setNewProductFabric] = useState('Alfaiataria Premium');
  const [newProductModeling, setNewProductModeling] = useState('Fluido');
  const [newProductCollection, setNewProductCollection] = useState('Alto Verão');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductHasGrid, setNewProductHasGrid] = useState(true);
  const [newProductStockSimple, setNewProductStockSimple] = useState('10');

  // Destaques
  const [newIsLaunch, setNewIsLaunch] = useState(true);
  const [newIsBestSeller, setNewIsBestSeller] = useState(false);
  const [newIsOutlet, setNewIsOutlet] = useState(false);
  const [newIsLastPieces, setNewIsLastPieces] = useState(false);

  // Mídias do novo produto
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');

  // Grade de variações do novo produto
  const [gridVariations, setGridVariations] = useState<
    Array<{ cor_nome: string; cor_hex: string; tamanho: string; estoque: number }>
  >([
    { cor_nome: 'Preto', cor_hex: '#111111', tamanho: 'P', estoque: 3 },
    { cor_nome: 'Preto', cor_hex: '#111111', tamanho: 'M', estoque: 5 },
    { cor_nome: 'Dourado', cor_hex: '#C5A059', tamanho: 'P', estoque: 2 },
    { cor_nome: 'Dourado', cor_hex: '#C5A059', tamanho: 'M', estoque: 4 }
  ]);

  // Modal de Edição Rápida
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPromoPrice, setEditPromoPrice] = useState<string>('');
  const [editCostPrice, setEditCostPrice] = useState<string>('');
  const [editStock, setEditStock] = useState<number>(0);
  const [editDestaque, setEditDestaque] = useState<boolean>(false);
  const [editMaisVendido, setEditMaisVendido] = useState<boolean>(false);
  const [editOutlet, setEditOutlet] = useState<boolean>(false);
  const [editUltimasPecas, setEditUltimasPecas] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingVarId, setUpdatingVarId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Ações em Massa (Bulk Actions)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [bulkDiscountValue, setBulkDiscountValue] = useState('10');
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState('');

  // Modal Visual de Exclusão / Arquivamento
  const [deleteModalProduct, setDeleteModalProduct] = useState<AdminProductItem | null>(null);
  const [isCheckingOrdersCount, setIsCheckingOrdersCount] = useState(false);
  const [productOrdersCount, setProductOrdersCount] = useState<number>(0);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Modal de Edição Completa da Peça (Dossiê Integral)
  const [editingFullProduct, setEditingFullProduct] = useState<AdminProductItem | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'geral' | 'midias' | 'grade' | 'comercial'>('geral');
  const [editFullName, setEditFullName] = useState('');
  const [editFullSlug, setEditFullSlug] = useState('');
  const [editFullCatId, setEditFullCatId] = useState('');
  const [editFullSubcat, setEditFullSubcat] = useState('');
  const [editFullDesc, setEditFullDesc] = useState('');
  const [editFullFabric, setEditFullFabric] = useState('');
  const [editFullModeling, setEditFullModeling] = useState('');
  const [editFullCollection, setEditFullCollection] = useState('');
  const [editFullPairedSlug, setEditFullPairedSlug] = useState('');
  const [editFullPairedSlugs, setEditFullPairedSlugs] = useState<string[]>([]);
  const [isCrossSellModalOpen, setIsCrossSellModalOpen] = useState(false);
  const [editViewMode, setEditViewMode] = useState<'abas' | 'scroll'>('abas');
  const [storeAttributes, setStoreAttributes] = useState<StoreCustomAttributes>(DEFAULT_STORE_ATTRIBUTES);
  const [savedSuccessVarId, setSavedSuccessVarId] = useState<string | null>(null);

  // Grade Multi-Tamanhos por Cor
  const [multiVarSizes, setMultiVarSizes] = useState<Array<{ id: string; tamanho: string; estoque: number }>>([
    { id: 'size_1', tamanho: 'M', estoque: 5 }
  ]);

  // Sinalizadores Customizados
  const [isAddingCustomBadge, setIsAddingCustomBadge] = useState(false);
  const [newCustomBadgeName, setNewCustomBadgeName] = useState('');
  const [newCustomBadgeColor, setNewCustomBadgeColor] = useState('#d97706');
  const [newCustomBadgeIcon, setNewCustomBadgeIcon] = useState('✨');
  const [customBadgesSelected, setCustomBadgesSelected] = useState<string[]>([]);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInputName, setNewCatInputName] = useState('');
  const [editFullDetails, setEditFullDetails] = useState('');
  const [editFullPrice, setEditFullPrice] = useState<number>(0);
  const [editFullPromoPrice, setEditFullPromoPrice] = useState<string>('');
  const [editFullCostPrice, setEditFullCostPrice] = useState<string>('');
  const [editFullDestaque, setEditFullDestaque] = useState(false);
  const [editFullMaisVendido, setEditFullMaisVendido] = useState(false);
  const [editFullOutlet, setEditFullOutlet] = useState(false);
  const [editFullUltimasPecas, setEditFullUltimasPecas] = useState(false);
  const [editFullFotos, setEditFullFotos] = useState<
    Array<{ id?: string; url: string; tipo: 'image' | 'video'; label?: string | null; display_order: number }>
  >([]);
  const [editFullCoverIndex, setEditFullCoverIndex] = useState(0);
  const [editFullVideoProvador, setEditFullVideoProvador] = useState('');
  const [editFullVariacoes, setEditFullVariacoes] = useState<
    Array<{ id?: string; cor_nome: string; cor_hex: string; tamanho: string; estoque: number; sku?: string | null }>
  >([]);
  const [newVarColorName, setNewVarColorName] = useState('Preto');
  const [newVarColorHex, setNewVarColorHex] = useState('#111111');
  const [newVarSize, setNewVarSize] = useState('M');
  const [newVarStock, setNewVarStock] = useState('5');
  const [newVarSku, setNewVarSku] = useState('');
  const [isSavingFullEdit, setIsSavingFullEdit] = useState(false);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const [uploadingEditVideo, setUploadingEditVideo] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carrega produtos do Supabase com fallback inteligente para o catálogo da boutique
  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, reservasMap, aviseMeMap, customAttrs] = await Promise.all([
        getAdminProducts(tenantId),
        getAdminCategoriesFull(tenantId),
        getReservedStockMap(tenantId).catch(() => ({ byProduct: {}, byVariation: {} })),
        getAviseMeSummaryMap(tenantId).catch(() => ({ byProduct: {}, byVariation: {}, total: 0 })),
        getStoreCustomAttributes(tenantId).catch(() => DEFAULT_STORE_ATTRIBUTES)
      ]);

      setCategoriesList(catsData || []);
      setReservedStockMap(reservasMap?.byProduct || {});
      setAviseMeSummary(aviseMeMap?.byProduct || {});
      setStoreAttributes(customAttrs || DEFAULT_STORE_ATTRIBUTES);

      if (prodsData && prodsData.length > 0) {
        setProducts(prodsData);
      } else if (tenantId === DEFAULT_TENANT_ID) {
        // Fallback apenas para o tenant padrão inicial se o banco estiver inacessível
        const mappedProducts: AdminProductItem[] = PRODUCTS.map((p, idx) => ({
          id: p.id,
          nome: p.name,
          slug: p.id,
          descricao: p.description,
          preco: p.price,
          preco_promocional: p.originalPrice || null,
          preco_custo: Number((p.price * 0.4).toFixed(2)),
          tecido: p.fabric || 'Alfaiataria Premium',
          modelagem: p.fit || 'Fluido',
          linha: p.line || 'Coleção Nobre',
          destaque: Boolean(p.isNewArrival),
          mais_vendido: Boolean(p.isBestSeller),
          outlet: Boolean(p.isOutlet),
          ultimas_pecas: Boolean(p.isLastPieces),
          estoque_total: p.remainingPieces || 12,
          ativo: true,
          foto_principal: p.thumbnail,
          categoria_id: `cat-${idx}`,
          categoria_nome: p.category,
          midias: (p.media || []).map((m, mIdx) => ({
            id: `mid-${p.id}-${mIdx}`,
            url: m.src,
            tipo: m.type,
            display_order: mIdx,
            label: m.label
          })),
          variacoes: (p.colors || []).flatMap((c) =>
            (p.sizes || []).map((s) => ({
              id: `var-${p.id}-${c.name}-${s}`,
              cor_nome: c.name,
              cor_hex: c.hex,
              tamanho: s,
              estoque: 3
            }))
          )
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, [tenantId]);

  // Recupera modo de visualização salvo no LocalStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('leidy_admin_produtos_view_mode') as ViewMode | null;
      if (savedMode && ['cards', 'lista', 'kanban'].includes(savedMode)) {
        setViewMode(savedMode);
      }
      const savedEditMode = localStorage.getItem('bcomm_product_edit_view_mode') as 'abas' | 'scroll' | null;
      if (savedEditMode && ['abas', 'scroll'].includes(savedEditMode)) {
        setEditViewMode(savedEditMode);
      }
    } catch {
      // Ignora erro de storage
    }
  }, []);

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('leidy_admin_produtos_view_mode', mode);
    } catch {
      // Ignora erro de storage
    }
  };

  // Fecha o Popover ao clicar fora e escuta atalho "/" para busca rápida
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === 'Escape') {
        setSelectedProductIds(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  // Alternar ativação na vitrine
  const handleToggleActive = async (product: AdminProductItem) => {
    const nextState = !product.ativo;
    const res = await toggleAdminProductActive(product.id, nextState);
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ativo: nextState } : p))
      );
      showToast(
        nextState
          ? `Peça "${product.nome}" ativada na vitrine!`
          : `Peça "${product.nome}" pausada da vitrine pública.`
      );
    } else {
      showToast(res.error || 'Erro ao alterar visibilidade.', 'error');
    }
  };

  // Abrir Modal Visual de Exclusão / Arquivamento
  const handleOpenDeleteModal = async (product: AdminProductItem) => {
    setDeleteModalProduct(product);
    setIsCheckingOrdersCount(true);
    setProductOrdersCount(0);
    try {
      const res = await checkProductOrdersCount(product.id);
      setProductOrdersCount(res.count);
    } catch {
      setProductOrdersCount(0);
    } finally {
      setIsCheckingOrdersCount(false);
    }
  };

  // Confirmar Exclusão ou Arquivamento
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeletingProduct(true);
    try {
      const res = await deleteAdminProduct(deleteModalProduct.id);
      if (res.success) {
        if (res.action === 'archived') {
          setProducts((prev) =>
            prev.map((p) => (p.id === deleteModalProduct.id ? { ...p, ativo: false } : p))
          );
          showToast(`Peça "${deleteModalProduct.nome}" arquivada e desativada da vitrine! Histórico de vendas preservado.`);
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== deleteModalProduct.id));
          showToast(`Peça "${deleteModalProduct.nome}" excluída definitivamente do catálogo.`);
        }
        setDeleteModalProduct(null);
      } else {
        showToast(res.error || 'Erro ao processar exclusão/arquivamento.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Abrir Modal de Edição Completa da Peça
  const handleOpenFullEdit = (product: AdminProductItem) => {
    setEditingFullProduct(product);
    setActiveEditTab('geral');
    setEditFullName(product.nome);
    setEditFullSlug(product.slug);
    setEditFullCatId(product.categoria_id || '');
    setEditFullSubcat(product.subcategoria || '');
    setEditFullDesc(product.descricao || '');
    setEditFullFabric(product.tecido || '');
    setEditFullModeling(product.modelagem || '');
    setEditFullCollection(product.linha || '');

    // Paired slugs (Cross-Sell / Compre o Look)
    const pairedList = product.paired_with_slug
      ? product.paired_with_slug
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    setEditFullPairedSlugs(pairedList);
    setEditFullPairedSlug(pairedList.join(','));

    // Sinalizadores Customizados
    const initialCustomBadges: string[] = [];
    if (Array.isArray(product.detalhes)) {
      product.detalhes.forEach((d) => {
        if (d.startsWith('[Badge] ')) {
          initialCustomBadges.push(d.replace('[Badge] ', '').trim());
        }
      });
    }
    setCustomBadgesSelected(initialCustomBadges);

    setEditFullDetails(
      Array.isArray(product.detalhes)
        ? product.detalhes.filter((d) => !d.startsWith('[Badge] ')).join('\n')
        : ''
    );
    setEditFullPrice(product.preco);
    setEditFullPromoPrice(product.preco_promocional ? String(product.preco_promocional) : '');
    setEditFullCostPrice(product.preco_custo ? String(product.preco_custo) : '');
    setEditFullDestaque(Boolean(product.destaque));
    setEditFullMaisVendido(Boolean(product.mais_vendido));
    setEditFullOutlet(Boolean(product.outlet));
    setEditFullUltimasPecas(Boolean(product.ultimas_pecas));

    // Mídias
    const existingMidias = (product.midias || []).map((m, idx) => ({
      id: m.id,
      url: m.url,
      tipo: m.tipo || ('image' as const),
      label: m.label || (idx === 0 ? 'Capa Principal' : `Mídia ${idx + 1}`),
      display_order: m.display_order ?? idx
    }));

    // Se a foto_principal não estiver na lista de mídias, inclui no início
    if (product.foto_principal && !existingMidias.some((m) => m.url === product.foto_principal)) {
      existingMidias.unshift({
        id: 'capa_inicial',
        url: product.foto_principal,
        tipo: 'image',
        label: 'Capa Principal',
        display_order: 0
      });
    }

    setEditFullFotos(existingMidias);
    setEditFullCoverIndex(0);

    const videoMedia = existingMidias.find((m) => m.tipo === 'video');
    setEditFullVideoProvador(videoMedia ? videoMedia.url : '');

    // Variações
    const existingVars = (product.variacoes || []).map((v) => ({
      id: v.id,
      cor_nome: v.cor_nome,
      cor_hex: v.cor_hex,
      tamanho: v.tamanho,
      estoque: v.estoque,
      sku: v.sku || ''
    }));
    setEditFullVariacoes(existingVars);
    setMultiVarSizes([{ id: 'size_1', tamanho: 'M', estoque: 5 }]);
    setIsAddingNewCat(false);
    setIsAddingCustomBadge(false);
  };

  // Salvar Edição Completa da Peça
  const handleSaveFullEdit = async () => {
    if (!editingFullProduct) return;
    if (!editFullName.trim()) {
      showToast('O nome da peça é obrigatório.', 'error');
      return;
    }
    if (editFullPrice <= 0) {
      showToast('O preço de venda deve ser maior que zero.', 'error');
      return;
    }

    setIsSavingFullEdit(true);
    try {
      const parsedPromo = editFullPromoPrice ? parseFloat(editFullPromoPrice) : null;
      const parsedCost = editFullCostPrice ? parseFloat(editFullCostPrice) : null;

      const baseDetails = editFullDetails
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const badgeDetails = customBadgesSelected.map((b) => `[Badge] ${b}`);
      const detailsArray = [...baseDetails, ...badgeDetails];

      // Reordena fotos com base no coverIndex
      const orderedFotos = [...editFullFotos];
      if (editFullCoverIndex > 0 && editFullCoverIndex < orderedFotos.length) {
        const [coverItem] = orderedFotos.splice(editFullCoverIndex, 1);
        orderedFotos.unshift(coverItem);
      }

      const pairedSlugFinal = editFullPairedSlugs.join(',') || null;
      const firstVideo = orderedFotos.find((f) => f.tipo === 'video');

      const payload: UpdateProductInput = {
        id: editingFullProduct.id,
        loja_id: tenantId,
        nome: editFullName.trim(),
        slug: editFullSlug.trim().toLowerCase() || editingFullProduct.slug,
        categoria_id: editFullCatId || null,
        subcategoria: editFullSubcat.trim() || null,
        descricao: editFullDesc,
        preco: editFullPrice,
        preco_promocional: parsedPromo,
        preco_custo: parsedCost,
        tecido: editFullFabric || null,
        modelagem: editFullModeling || null,
        linha: editFullCollection || null,
        destaque: editFullDestaque,
        mais_vendido: editFullMaisVendido,
        outlet: editFullOutlet,
        ultimas_pecas: editFullUltimasPecas,
        paired_with_slug: pairedSlugFinal,
        detalhes: detailsArray.length > 0 ? detailsArray : null,
        foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : editingFullProduct.foto_principal,
        fotos: orderedFotos,
        video_provador_url: firstVideo ? firstVideo.url : editFullVideoProvador.trim() || null,
        variacoes: editFullVariacoes
      };

      const res = await updateAdminProductFull(payload);
      if (res.success) {
        const catObj = categoriesList.find((c) => c.id === editFullCatId);
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== editingFullProduct.id) return p;
            return {
              ...p,
              nome: editFullName.trim(),
              slug: payload.slug || p.slug,
              categoria_id: editFullCatId || null,
              subcategoria: editFullSubcat.trim() || null,
              categoria_nome: catObj ? catObj.nome : p.categoria_nome,
              descricao: editFullDesc,
              preco: editFullPrice,
              preco_promocional: parsedPromo,
              preco_custo: parsedCost,
              tecido: editFullFabric,
              modelagem: editFullModeling,
              linha: editFullCollection,
              destaque: editFullDestaque,
              mais_vendido: editFullMaisVendido,
              outlet: editFullOutlet,
              ultimas_pecas: editFullUltimasPecas,
              paired_with_slug: pairedSlugFinal,
              detalhes: detailsArray,
              foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : p.foto_principal,
              midias: orderedFotos.map((f, i) => ({
                id: f.id || `m_${i}`,
                url: f.url,
                tipo: f.tipo || 'image',
                display_order: i,
                label: i === 0 ? 'Capa Principal' : `Mídia ${i + 1}`
              })),
              variacoes: editFullVariacoes.map((v, i) => ({
                id: v.id || `v_${i}`,
                cor_nome: v.cor_nome,
                cor_hex: v.cor_hex,
                tamanho: v.tamanho,
                estoque: v.estoque,
                sku: v.sku
              })),
              estoque_total: editFullVariacoes.reduce((acc, v) => acc + Number(v.estoque || 0), 0)
            };
          })
        );

        notifyStockChangeCrossTab();
        showToast(`Peça "${editFullName}" atualizada com sucesso!`);
        setEditingFullProduct(null);
      } else {
        showToast(res.error || 'Erro ao salvar alterações da peça.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar peça.', 'error');
    } finally {
      setIsSavingFullEdit(false);
    }
  };

  // Upload Unificado de Foto e Vídeo na Galeria da Peça
  const handleUploadEditMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v)$/i.test(file.name);
    const folder = isVideo ? 'videos' : 'produtos';
    const tipo = isVideo ? ('video' as const) : ('image' as const);

    setUploadingEditPhoto(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, folder);
      if (res.success && res.url) {
        setEditFullFotos((prev) => [
          ...prev,
          {
            id: `media_${Date.now()}`,
            url: res.url,
            tipo,
            label: isVideo
              ? `Vídeo ${prev.filter((m) => m.tipo === 'video').length + 1}`
              : `Foto ${prev.filter((m) => m.tipo === 'image').length + 1}`,
            display_order: prev.length
          }
        ]);
        if (isVideo && !editFullVideoProvador) {
          setEditFullVideoProvador(res.url);
        }
        showToast(isVideo ? 'Vídeo adicionado com sucesso!' : 'Foto adicionada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar mídia.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha no upload do arquivo.', 'error');
    } finally {
      setUploadingEditPhoto(false);
      e.target.value = '';
    }
  };

  // Excluir Mídia na Edição Completa
  const handleDeleteEditPhoto = async (index: number) => {
    const photo = editFullFotos[index];
    if (!photo) return;

    if (photo.url && photo.url.includes('.r2.dev')) {
      deleteFromR2(photo.url).catch(console.warn);
    }

    setEditFullFotos((prev) => prev.filter((_, idx) => idx !== index));
    if (editFullCoverIndex === index) {
      setEditFullCoverIndex(0);
    } else if (editFullCoverIndex > index) {
      setEditFullCoverIndex((prev) => prev - 1);
    }
    showToast('Mídia removida da galeria.');
  };

  // Reordenar Fotos e Vídeos (Mover para esquerda/frente ou direita/trás)
  const handleMoveEditMedia = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editFullFotos.length) return;

    setEditFullFotos((prev) => {
      const updated = [...prev];
      const item = updated.splice(index, 1)[0];
      updated.splice(targetIndex, 0, item);
      return updated.map((m, i) => ({ ...m, display_order: i }));
    });

    if (editFullCoverIndex === index) {
      setEditFullCoverIndex(targetIndex);
    } else if (editFullCoverIndex === targetIndex) {
      setEditFullCoverIndex(index);
    }
  };

  // Definir como Capa Principal da Peça (move para posição 0)
  const handleSetCoverMedia = (index: number) => {
    if (index === 0) return;
    setEditFullFotos((prev) => {
      const updated = [...prev];
      const [cover] = updated.splice(index, 1);
      updated.unshift(cover);
      return updated.map((m, i) => ({ ...m, display_order: i }));
    });
    setEditFullCoverIndex(0);
    showToast('Mídia definida como capa principal da vitrine!');
  };

  // Gerenciamento da Grade Multi-Tamanhos por Cor
  const handleAddMultiSizeRow = () => {
    setMultiVarSizes((prev) => [
      ...prev,
      { id: `size_${Date.now()}_${prev.length}`, tamanho: 'G', estoque: 5 }
    ]);
  };

  const handleRemoveMultiSizeRow = (id: string) => {
    setMultiVarSizes((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleUpdateMultiSizeRow = (id: string, field: 'tamanho' | 'estoque', value: any) => {
    setMultiVarSizes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleApplySizePreset = (preset: 'pmg' | 'numeros') => {
    if (preset === 'pmg') {
      setMultiVarSizes([
        { id: `preset_p_${Date.now()}`, tamanho: 'P', estoque: 5 },
        { id: `preset_m_${Date.now()}`, tamanho: 'M', estoque: 5 },
        { id: `preset_g_${Date.now()}`, tamanho: 'G', estoque: 5 }
      ]);
      showToast('Grade P, M, G carregada!');
    } else if (preset === 'numeros') {
      setMultiVarSizes([
        { id: `preset_36_${Date.now()}`, tamanho: '36', estoque: 5 },
        { id: `preset_38_${Date.now()}`, tamanho: '38', estoque: 5 },
        { id: `preset_40_${Date.now()}`, tamanho: '40', estoque: 5 },
        { id: `preset_42_${Date.now()}`, tamanho: '42', estoque: 5 },
        { id: `preset_44_${Date.now()}`, tamanho: '44', estoque: 5 }
      ]);
      showToast('Grade 36 ao 44 carregada!');
    }
  };

  const handleFinishColorMultiSizes = () => {
    if (!newVarColorName.trim()) {
      showToast('Informe o nome da cor para gerar as variações.', 'error');
      return;
    }
    if (multiVarSizes.length === 0) {
      showToast('Adicione ao menos um tamanho e estoque para esta cor.', 'error');
      return;
    }

    const newItems = multiVarSizes.map((row) => ({
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cor_nome: newVarColorName.trim(),
      cor_hex: newVarColorHex,
      tamanho: row.tamanho.trim(),
      estoque: Math.max(0, Number(row.estoque) || 0),
      sku: `${editFullSlug || 'peca'}-${newVarColorName.trim()}-${row.tamanho.trim()}`.toUpperCase()
    }));

    setEditFullVariacoes((prev) => [...prev, ...newItems]);
    setMultiVarSizes([{ id: `size_${Date.now()}`, tamanho: 'M', estoque: 5 }]);
    showToast(`${newItems.length} variações da cor "${newVarColorName}" adicionadas à grade!`);
  };

  const handleRemoveVariationInFullEdit = (index: number) => {
    setEditFullVariacoes((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Variação removida da grade.');
  };

  // Adicionar novo atributo customizado da loja
  const handleCreateStoreAttribute = async (
    tipo: 'subcategorias' | 'tecidos' | 'modelagens' | 'colecoes' | 'tamanhos',
    novoItem: string
  ) => {
    try {
      const updated = await saveStoreCustomAttribute(tenantId, tipo, novoItem, 'add');
      setStoreAttributes(updated);
      showToast(`"${novoItem}" adicionado com sucesso às opções da loja!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar novo atributo.', 'error');
    }
  };

  // Remover atributo customizado da loja
  const handleDeleteStoreAttribute = async (
    tipo: 'subcategorias' | 'tecidos' | 'modelagens' | 'colecoes' | 'tamanhos',
    itemParaRemover: string
  ) => {
    try {
      const updated = await saveStoreCustomAttribute(tenantId, tipo, itemParaRemover, 'remove');
      setStoreAttributes(updated);
      showToast(`"${itemParaRemover}" removido das opções da loja.`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover atributo.', 'error');
    }
  };

  // Criar Categoria Diretamente no Modal
  const handleCreateCategoryInline = async () => {
    if (!newCatInputName.trim()) {
      showToast('Digite o nome da categoria.', 'error');
      return;
    }
    try {
      const res = await saveAdminCategory(tenantId, {
        nome: newCatInputName.trim()
      });
      if (res.success && res.data) {
        const novaCat = res.data;
        setCategoriesList((prev) => [...prev, novaCat]);
        setEditFullCatId(novaCat.id);
        setNewCatInputName('');
        setIsAddingNewCat(false);
        showToast(`Categoria "${novaCat.nome}" cadastrada e selecionada!`);
      } else {
        showToast(res.error || 'Erro ao criar categoria.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao criar categoria.', 'error');
    }
  };

  // Criar Novo Sinalizador Comercial
  const handleAddCustomBadge = async () => {
    if (!newCustomBadgeName.trim()) {
      showToast('Digite o nome do sinalizador.', 'error');
      return;
    }
    const badgeLabel = newCustomBadgeName.trim();
    const newBadge: CustomSinalizador = {
      id: `badge_${Date.now()}`,
      nome: badgeLabel,
      cor: newCustomBadgeColor || '#d97706',
      label: badgeLabel,
      color: newCustomBadgeColor || '#d97706',
      icon: newCustomBadgeIcon || '✨',
      icone: newCustomBadgeIcon || '✨'
    };
    try {
      const updated = await saveStoreCustomAttribute(tenantId, 'sinalizadores', newBadge, 'add');
      setStoreAttributes(updated);
      setCustomBadgesSelected((prev) => [...prev, badgeLabel]);
      setNewCustomBadgeName('');
      setIsAddingCustomBadge(false);
      showToast(`Sinalizador "${badgeLabel}" criado e ativado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar novo sinalizador.', 'error');
    }
  };

  // --- SELEÇÃO & AÇÕES EM MASSA ---
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = (filteredIds: string[]) => {
    if (selectedProductIds.size === filteredIds.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredIds));
    }
  };

  const handleBulkToggle = async (active: boolean) => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    setIsBulkActionRunning(true);
    try {
      const res = await bulkToggleProductActive(ids, active);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, ativo: active } : p))
        );
        showToast(`${res.count} peças ${active ? 'ativadas' : 'pausadas'} na vitrine com sucesso!`);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao alterar status em massa.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkApplyDiscountAction = async () => {
    const ids = Array.from(selectedProductIds);
    const percent = parseFloat(bulkDiscountValue) || 0;
    if (ids.length === 0 || percent <= 0) return;

    setIsBulkActionRunning(true);
    try {
      const res = await bulkApplyDiscount(ids, percent);
      if (res.success) {
        await fetchProductsData();
        showToast(`Desconto de ${percent}% aplicado em ${res.count} peças!`);
        setShowBulkDiscountModal(false);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao aplicar desconto em lote.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkUpdateCategoryAction = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0 || !bulkCategoryTarget) return;

    setIsBulkActionRunning(true);
    try {
      const res = await bulkUpdateCategory(ids, bulkCategoryTarget);
      if (res.success) {
        await fetchProductsData();
        showToast(`${res.count} peças movidas para a nova categoria!`);
        setShowBulkCategoryModal(false);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao mover categoria em lote.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkArchiveAction = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    if (!confirm(`Deseja realmente arquivar as ${ids.length} peças selecionadas? Elas serão desativadas da vitrine.`)) {
      return;
    }

    setIsBulkActionRunning(true);
    try {
      const res = await bulkArchiveProducts(ids);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, ativo: false } : p))
        );
        showToast(`${res.count} peças arquivadas da vitrine!`);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao arquivar peças em massa.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  // Exportar Catálogo em CSV
  const handleExportCatalogCSV = () => {
    try {
      const headers = [
        'ID',
        'Nome da Peça',
        'Slug',
        'Categoria',
        'Preço de Venda (R$)',
        'Preço Promocional (R$)',
        'Custo CMV (R$)',
        'Margem Bruta (%)',
        'Estoque Total',
        'Status Vitrine',
        'Tags',
        'Grade de Cores e Tamanhos'
      ];

      const rows = products.map((p) => {
        const custo = p.preco_custo || p.preco * 0.4;
        const margem = p.preco > 0 ? (((p.preco - custo) / p.preco) * 100).toFixed(1) : '0';
        const tags = [
          p.destaque ? 'Destaque' : '',
          p.mais_vendido ? 'Mais Vendido' : '',
          p.outlet ? 'Outlet' : '',
          p.ultimas_pecas ? 'Últimas Peças' : ''
        ].filter(Boolean).join(' | ');

        const grade = (p.variacoes || [])
          .map((v) => `${v.cor_nome} ${v.tamanho}: ${v.estoque} un`)
          .join('; ');

        return [
          p.id,
          `"${p.nome.replace(/"/g, '""')}"`,
          p.slug,
          `"${p.categoria_nome || 'Geral'}"`,
          p.preco.toFixed(2),
          p.preco_promocional ? p.preco_promocional.toFixed(2) : '',
          custo.toFixed(2),
          `${margem}%`,
          p.estoque_total,
          p.ativo ? 'Ativo' : 'Pausado',
          `"${tags}"`,
          `"${grade}"`
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `catalogo_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Planilha do catálogo exportada com sucesso!');
    } catch (err: any) {
      showToast('Erro ao exportar planilha: ' + (err.message || err), 'error');
    }
  };

  // Exportar Catálogo em Excel (.xlsx) Nativo
  const handleExportCatalogXLSX = () => {
    try {
      const data = products.map((p) => {
        const custo = p.preco_custo || p.preco * 0.4;
        const margem = p.preco > 0 ? (((p.preco - custo) / p.preco) * 100).toFixed(1) : '0';
        const tags = [
          p.destaque ? 'Destaque' : '',
          p.mais_vendido ? 'Mais Vendido' : '',
          p.outlet ? 'Outlet' : '',
          p.ultimas_pecas ? 'Últimas Peças' : ''
        ].filter(Boolean).join(' | ');

        const cores = Array.from(new Set((p.variacoes || []).map((v) => v.cor_nome))).join(', ');
        const tamanhos = Array.from(new Set((p.variacoes || []).map((v) => v.tamanho))).join(', ');
        const gradeDetalhada = (p.variacoes || [])
          .map((v) => `${v.cor_nome} ${v.tamanho}: ${v.estoque} un`)
          .join('; ');

        return {
          'Nome do Produto': p.nome,
          'Categoria': p.categoria_nome || 'Geral',
          'Preço Venda': p.preco,
          'Preço Promocional': p.preco_promocional || '',
          'Preço Custo': custo,
          'Margem Bruta (%)': `${margem}%`,
          'Estoque Total': p.estoque_total,
          'Status Vitrine': p.ativo ? 'Ativo' : 'Pausado',
          'Cores': cores,
          'Tamanhos': tamanhos,
          'Grade Detalhada': gradeDetalhada,
          'Tags': tags,
          'Slug': p.slug
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
      XLSX.writeFile(wb, `catalogo_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Planilha Excel (.xlsx) exportada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao exportar Excel: ' + (err.message || err), 'error');
    }
  };

  // Ajuste Rápido de Estoque por Variação (+ / -)
  const handleQuickVariationStockChange = async (
    variationId: string,
    productId: string,
    delta: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.variacoes) return;

    const variation = product.variacoes.find((v) => v.id === variationId);
    if (!variation) return;

    const novoEstoque = Math.max(0, variation.estoque + delta);
    setUpdatingVarId(variationId);

    try {
      const res = await updateAdminVariationStock(variationId, productId, novoEstoque);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const updatedVars = (p.variacoes || []).map((v) =>
              v.id === variationId ? { ...v, estoque: novoEstoque } : v
            );
            return {
              ...p,
              estoque_total: res.novoEstoqueTotal ?? updatedVars.reduce((acc, v) => acc + v.estoque, 0),
              variacoes: updatedVars
            };
          })
        );
        notifyStockChangeCrossTab();
        setSavedSuccessVarId(variationId);
        setTimeout(() => setSavedSuccessVarId(null), 1200);
      } else {
        showToast(res.error || 'Erro ao atualizar estoque da variação.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar estoque.', 'error');
    } finally {
      setUpdatingVarId(null);
    }
  };

  // Ajuste Direto e Imediato de Estoque (Digitação Livre do Lojista)
  const handleDirectVariationStockChange = async (
    variationId: string,
    productId: string,
    rawQuantity: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.variacoes) return;

    const variation = product.variacoes.find((v) => v.id === variationId);
    if (!variation) return;

    const estoqueValidado = Math.max(0, Math.floor(rawQuantity));
    if (variation.estoque === estoqueValidado) return;

    setUpdatingVarId(variationId);
    try {
      const res = await updateAdminVariationStockDirect(variationId, productId, estoqueValidado, tenantId);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const updatedVars = (p.variacoes || []).map((v) =>
              v.id === variationId ? { ...v, estoque: estoqueValidado } : v
            );
            return {
              ...p,
              estoque_total: res.novoEstoqueTotal ?? updatedVars.reduce((acc, v) => acc + v.estoque, 0),
              variacoes: updatedVars
            };
          })
        );
        notifyStockChangeCrossTab();
        setSavedSuccessVarId(variationId);
        setTimeout(() => setSavedSuccessVarId(null), 1200);
      } else {
        showToast(res.error || 'Erro ao atualizar estoque.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar estoque digitado.', 'error');
    } finally {
      setUpdatingVarId(null);
    }
  };

  // Duplicar Peça em 1 Clique (Clonagem com Variações de Grade)
  const handleDuplicateProduct = async (product: AdminProductItem) => {
    setDuplicatingId(product.id);
    try {
      const timestampSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedSlug = `${product.slug}-copia-${timestampSuffix}`;

      const payload: CreateProductInput = {
        nome: `${product.nome} (Cópia)`,
        slug: generatedSlug,
        descricao: product.descricao || '',
        preco: product.preco,
        preco_promocional: product.preco_promocional || null,
        preco_custo: product.preco_custo || null,
        categoria_id: product.categoria_id || undefined,
        tecido: product.tecido || 'Alfaiataria Premium',
        modelagem: product.modelagem || 'Fluido',
        linha: product.linha || 'Coleção Nobre',
        destaque: false,
        mais_vendido: false,
        outlet: Boolean(product.outlet),
        ultimas_pecas: false,
        estoque_total: product.estoque_total,
        foto_principal: product.foto_principal || '',
        fotos: (product.midias || [])
          .filter((m) => m.tipo !== 'video')
          .map((m) => m.url),
        video_provador_url: (product.midias || []).find((m) => m.tipo === 'video')?.url,
        tem_grade: Boolean(product.variacoes && product.variacoes.length > 0),
        variacoes: (product.variacoes || []).map((v) => ({
          cor_nome: v.cor_nome,
          cor_hex: v.cor_hex,
          tamanho: v.tamanho,
          estoque: v.estoque
        }))
      };

      const res = await createAdminProduct(payload, tenantId);
      if (res.success) {
        showToast(`Peça "${product.nome}" duplicada com sucesso!`);
        fetchProductsData();
      } else {
        showToast(res.error || 'Erro ao duplicar peça.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao duplicar peça.', 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  // Abrir modal de edição rápida
  const handleOpenEdit = (product: AdminProductItem) => {
    setEditingProduct(product);
    setEditPrice(product.preco);
    setEditPromoPrice(product.preco_promocional ? String(product.preco_promocional) : '');
    setEditCostPrice(product.preco_custo ? String(product.preco_custo) : '');
    setEditStock(product.estoque_total);
    setEditDestaque(Boolean(product.destaque));
    setEditMaisVendido(Boolean(product.mais_vendido));
    setEditOutlet(Boolean(product.outlet));
    setEditUltimasPecas(Boolean(product.ultimas_pecas));
  };

  // Salvar Edição Rápida
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);

    const promoVal = editPromoPrice.trim() ? Number(editPromoPrice) : null;
    const costVal = editCostPrice.trim() ? Number(editCostPrice) : null;

    const res = await updateAdminProductDetails(
      editingProduct.id,
      Number(editPrice),
      promoVal,
      Number(editStock),
      costVal,
      {
        destaque: editDestaque,
        mais_vendido: editMaisVendido,
        outlet: editOutlet,
        ultimas_pecas: editUltimasPecas
      }
    );

    if (res.success) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                preco: Number(editPrice),
                preco_promocional: promoVal,
                preco_custo: costVal,
                estoque_total: Number(editStock),
                destaque: editDestaque,
                mais_vendido: editMaisVendido,
                outlet: editOutlet,
                ultimas_pecas: editUltimasPecas
              }
            : p
        )
      );
      showToast(`Peça "${editingProduct.nome}" atualizada com sucesso!`);
      setEditingProduct(null);
    } else {
      showToast(res.error || 'Erro ao salvar alterações.', 'error');
    }
    setIsSaving(false);
  };

  // Upload de Foto no Cloudflare R2
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'produtos');
      if (res.success && res.url) {
        setUploadedPhotos((prev) => [...prev, res.url!]);
        showToast('Foto enviada com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Falha no upload da foto.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado no upload.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload de Vídeo de Provador no Cloudflare R2
  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'videos');
      if (res.success && res.url) {
        setUploadedVideoUrl(res.url);
        showToast('Vídeo de Provador (9:16) enviado para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Falha no upload do vídeo.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado no upload do vídeo.', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Grade Dinâmica de Variações
  const addGridVariation = () => {
    setGridVariations((prev) => [
      ...prev,
      { cor_nome: 'Nova Cor', cor_hex: '#C5A059', tamanho: 'M', estoque: 5 }
    ]);
  };

  const removeGridVariation = (index: number) => {
    setGridVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGridVariation = (
    index: number,
    field: 'cor_nome' | 'cor_hex' | 'tamanho' | 'estoque',
    value: any
  ) => {
    setGridVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Submeter Criação de Produto
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      showToast('Informe o nome da peça.', 'error');
      return;
    }
    if (!newProductPrice.trim()) {
      showToast('Informe o preço de venda da peça.', 'error');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const precoNum = Number(newProductPrice);
      const promoNum = newProductPromoPrice.trim() ? Number(newProductPromoPrice) : null;
      const custoNum = newProductCostPrice.trim() ? Number(newProductCostPrice) : null;

      const totalEstoqueGrade = newProductHasGrid
        ? gridVariations.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0)
        : Number(newProductStockSimple || 10);

      const generatedSlug =
        newProductSlug.trim() ||
        newProductName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const payload: CreateProductInput = {
        nome: newProductName.trim(),
        slug: generatedSlug,
        descricao: newProductDesc.trim(),
        preco: precoNum,
        preco_promocional: promoNum,
        preco_custo: custoNum,
        categoria_id: newProductCatId || undefined,
        subcategoria: newProductSubcat.trim() || undefined,
        nova_categoria_nome: newCustomCatName.trim() || undefined,
        tecido: newProductFabric.trim(),
        modelagem: newProductModeling.trim(),
        linha: newProductCollection.trim(),
        destaque: newIsLaunch,
        mais_vendido: newIsBestSeller,
        outlet: newIsOutlet,
        ultimas_pecas: newIsLastPieces,
        estoque_total: totalEstoqueGrade,
        foto_principal: uploadedPhotos[coverPhotoIndex] || uploadedPhotos[0] || '',
        fotos: uploadedPhotos,
        video_provador_url: uploadedVideoUrl || undefined,
        tem_grade: newProductHasGrid,
        variacoes: newProductHasGrid ? gridVariations : []
      };

      const res = await createAdminProduct(payload, tenantId);
      if (res.success) {
        showToast(`Peça "${newProductName}" cadastrada com sucesso!`);
        setIsCreateModalOpen(false);
        // Reset formulário
        setNewProductName('');
        setNewProductSlug('');
        setNewProductPrice('');
        setNewProductPromoPrice('');
        setNewProductCostPrice('');
        setNewProductDesc('');
        setUploadedPhotos([]);
        setUploadedVideoUrl('');
        fetchProductsData();
      } else {
        showToast(res.error || 'Erro ao cadastrar produto.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar produto.', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Categorias para filtro
  const categoriesFilter = [
    'todas',
    ...Array.from(new Set(products.map((p) => p.categoria_nome || 'Geral')))
  ];

  // Filtro de Busca e Estoque
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todas' && p.categoria_nome !== selectedCategory) {
      return false;
    }
    if (stockFilter === 'criticos') {
      const temCritico = p.estoque_total <= 2 || (p.variacoes && p.variacoes.some((v) => v.estoque <= 2));
      if (!temCritico) return false;
    } else if (stockFilter === 'esgotados') {
      if (p.estoque_total > 0) return false;
    } else if (stockFilter === 'ativos') {
      if (!p.ativo) return false;
    } else if (stockFilter === 'pausados') {
      if (p.ativo) return false;
    } else if (stockFilter === 'destaques') {
      if (!p.destaque) return false;
    } else if (stockFilter === 'outlet') {
      if (!p.outlet) return false;
    } else if (stockFilter === 'mais_vendidos') {
      if (!p.mais_vendido) return false;
    } else if (stockFilter === 'ultimas_pecas') {
      if (!p.ultimas_pecas) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = p.nome.toLowerCase().includes(term);
      const matchSlug = p.slug.toLowerCase().includes(term);
      return matchName || matchSlug;
    }
    return true;
  });

  const totalAtivos = products.filter((p) => p.ativo).length;
  const totalPausados = products.filter((p) => !p.ativo).length;
  const estoqueTotalPecas = products.reduce((acc, p) => acc + (p.estoque_total || 0), 0);

  const valorTotalCatalogo = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.preco * (p.estoque_total || 0)), 0);
  }, [products]);

  const pecasCriticasCount = useMemo(() => {
    return products.filter((p) => (p.estoque_total || 0) <= 2).length;
  }, [products]);

  const taxaAtivas = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round((totalAtivos / products.length) * 100);
  }, [products.length, totalAtivos]);

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'todas') count++;
    if (stockFilter !== 'todos') count++;
    if (searchTerm.trim() !== '') count++;
    if (sortOrder !== 'recentes') count++;
    return count;
  }, [selectedCategory, stockFilter, searchTerm, sortOrder]);

  const handleClearAllFilters = () => {
    setSelectedCategory('todas');
    setStockFilter('todos');
    setSearchTerm('');
    setSortOrder('recentes');
  };

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortOrder === 'menor_estoque') {
        return (a.estoque_total || 0) - (b.estoque_total || 0);
      }
      if (sortOrder === 'maior_estoque') {
        return (b.estoque_total || 0) - (a.estoque_total || 0);
      }
      if (sortOrder === 'maior_preco') {
        return (b.preco || 0) - (a.preco || 0);
      }
      if (sortOrder === 'menor_preco') {
        return (a.preco || 0) - (b.preco || 0);
      }
      if (sortOrder === 'nome') {
        return a.nome.localeCompare(b.nome);
      }
      return 0; // recentes / padrão
    });
  }, [filteredProducts, sortOrder]);

  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-500'
              : 'bg-rose-900 text-rose-100 border border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. STATUS DE SINCRONIZAÇÃO EM TEMPO REAL & ATALHO VITRINE */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-800">
            Catálogo & Estoque Sincronizados com a Vitrine Pública
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
            (PostgreSQL / Supabase Realtime • 100% de Paridade)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={getStorefrontUrl(currentTenant, { path: '/catalogo' })}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Abrir a vitrine da loja como um cliente real"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            <span>Ver Vitrine da Loja ↗</span>
          </Link>
        </div>
      </div>

      {/* 2. CARDS DE MÉTRICAS OPERACIONAIS ESTILO PEDIDOS (INTERATIVOS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          {
            id: 'todos',
            label: 'Total de Peças',
            icon: Package,
            value: products.length,
            unit: 'modelos',
            subValue: formatCurrency(valorTotalCatalogo),
            subLabel: 'em estoque',
            bgLight: 'bg-slate-50/70',
            border: 'border-slate-200',
            activeBorder: 'ring-2 ring-slate-700 border-slate-700',
            iconColor: 'text-slate-600',
            isSelected: stockFilter === 'todos' && selectedCategory === 'todas',
            action: () => {
              setStockFilter('todos');
              setSelectedCategory('todas');
            }
          },
          {
            id: 'ativos',
            label: 'Ativas na Vitrine',
            icon: CheckCircle2,
            value: totalAtivos,
            unit: 'peças',
            subValue: `${taxaAtivas}%`,
            subLabel: 'do catálogo',
            bgLight: 'bg-emerald-50/70',
            border: 'border-emerald-200',
            activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
            iconColor: 'text-emerald-600',
            isSelected: stockFilter === 'ativos',
            action: () => setStockFilter(stockFilter === 'ativos' ? 'todos' : 'ativos')
          },
          {
            id: 'pausados',
            label: 'Pausadas',
            icon: EyeOff,
            value: totalPausados,
            unit: 'peças',
            subValue: totalPausados > 0 ? 'Fora da vitrine' : 'Nenhuma',
            subLabel: '',
            bgLight: 'bg-amber-50/70',
            border: 'border-amber-200',
            activeBorder: 'ring-2 ring-amber-500 border-amber-500',
            iconColor: 'text-amber-600',
            isSelected: stockFilter === 'pausados',
            action: () => setStockFilter(stockFilter === 'pausados' ? 'todos' : 'pausados')
          },
          {
            id: 'grade',
            label: 'Estoque em Grade',
            icon: Layers,
            value: estoqueTotalPecas,
            unit: 'un',
            subValue: pecasCriticasCount > 0 ? `${pecasCriticasCount} críticas (≤ 2)` : 'Normal',
            subLabel: '',
            bgLight: 'bg-indigo-50/70',
            border: 'border-indigo-200',
            activeBorder: 'ring-2 ring-indigo-500 border-indigo-500',
            iconColor: 'text-indigo-600',
            isSelected: stockFilter === 'criticos',
            action: () => setStockFilter(stockFilter === 'criticos' ? 'todos' : 'criticos')
          }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.id}
              onClick={kpi.action}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs relative ${
                kpi.bgLight
              } ${kpi.isSelected ? kpi.activeBorder : `${kpi.border} hover:border-slate-400`}`}
              title={`Filtrar por ${kpi.label}`}
            >
              {kpi.isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              )}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${kpi.iconColor}`} />
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {kpi.value} <span className="text-[10px] font-semibold text-slate-500 lowercase">{kpi.unit}</span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 truncate">
                  {kpi.subValue} {kpi.subLabel && <span className="text-[10px] font-normal text-slate-500">{kpi.subLabel}</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. TOOLBAR COMPACTA EM LINHA ÚNICA (ESTILO PEDIDOS) */}
      <div className="space-y-2">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar peça por nome, categoria ou referência... (Tecle /)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-8 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão Popover de Filtros Avançados */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Menu Popover Deslizante */}
            {isFilterPopoverOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-40 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                    Filtrar Catálogo
                  </span>
                  <button
                    onClick={handleClearAllFilters}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Limpar Todos
                  </button>
                </div>

                {/* Filtro por Categoria */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Coleção / Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {categoriesFilter.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'todas' ? 'Todas as Coleções' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Comercial / Grade */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Status Comercial / Grade
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'todos', label: 'Todas as Peças' },
                      { id: 'criticos', label: '⚠️ Reposição (≤ 2)' },
                      { id: 'destaques', label: '🌟 Destaques' },
                      { id: 'mais_vendidos', label: '🔥 Mais Vendidos' },
                      { id: 'outlet', label: '🏷️ Outlet' },
                      { id: 'ultimas_pecas', label: '⏳ Últimas Peças' },
                      { id: 'esgotados', label: '⛔ Esgotados' },
                      { id: 'ativos', label: '✅ Ativas Vitrine' },
                      { id: 'pausados', label: '⏸️ Pausadas' }
                    ].map((st) => {
                      const checked = stockFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStockFilter(st.id as any)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] text-left cursor-pointer transition-colors ${
                            checked
                              ? 'bg-amber-50 border-amber-400 font-bold text-amber-950'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                              checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-2 h-2 stroke-[3]" />}
                          </div>
                          <span className="truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ordenação Comercial */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Ordenar Catálogo
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="recentes">Padrão / Mais Recentes</option>
                    <option value="menor_estoque">Menor Estoque (Críticos Primeiro)</option>
                    <option value="maior_estoque">Maior Estoque</option>
                    <option value="maior_preco">Maior Preço de Venda</option>
                    <option value="menor_preco">Menor Preço de Venda</option>
                    <option value="nome">Nome da Peça (A-Z)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {sortedProducts.length} peça(s) encontrada(s)
                  </span>
                  <button
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Ver Resultados
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Botão Exportar Excel (.xlsx) */}
          <button
            onClick={handleExportCatalogXLSX}
            title="Exportar planilha Excel (.xlsx) completa com estoque, grades e margem"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Exportar Excel</span>
            <span className="md:hidden">Excel</span>
          </button>

          {/* Botão Atualizar */}
          <button
            onClick={fetchProductsData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Atualizar listagem de produtos do catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
            <span className="hidden md:inline">Atualizar</span>
          </button>

          {/* Botão Importar em Lote */}
          <button
            onClick={() => setIsBatchImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer shrink-0"
            title="Importar peças em lote por planilha Excel ou CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Importar em Lote</span>
            <span className="sm:hidden">Lote</span>
          </button>

          {/* Botão Cadastrar Nova Peça */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer shrink-0"
            title="Cadastrar nova peça no catálogo"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cadastrar Peça</span>
            <span className="sm:hidden">Nova Peça</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Alternador de Modos de Visualização (Cards, Lista e Kanban) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto shrink-0">
            <button
              onClick={() => handleChangeViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Modo Cards Detalhados"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleChangeViewMode('lista')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Modo Tabela / Lista Compacta"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleChangeViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Modo Colunas Verticais / Kanban Operacional"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chips de Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] px-1 animate-in fade-in duration-150">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filtros ativos:</span>

            {selectedCategory !== 'todas' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                Coleção: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('todas')}
                  className="hover:text-amber-950 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {stockFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                Status: {stockFilter}
                <button
                  onClick={() => setStockFilter('todos')}
                  className="hover:text-amber-950 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm.trim() !== '' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-full font-bold">
                Busca: “{searchTerm}”
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-slate-950 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortOrder !== 'recentes' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-full font-bold">
                Ordem: {sortOrder}
                <button
                  onClick={() => setSortOrder('recentes')}
                  className="hover:text-slate-950 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer ml-1"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* LISTAGEM DE PRODUTOS NOS 3 MODOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Carregando catálogo de peças...</span>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Nenhuma peça encontrada</p>
          <p className="text-xs">Tente ajustar o termo digitado ou os filtros aplicados.</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-amber-400 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Nova Peça</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ======================================================== */
        /* MODO 1: CARDS DETALHADOS (COM GRADE EXPANSÍVEL)          */
        /* ======================================================== */
        <div className={`space-y-4 transition-all duration-200 ${selectedProductIds.size > 0 ? 'pb-32' : 'pb-6'}`}>
          {/* Barra de Seleção em Massa no Topo da Lista */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
              <input
                type="checkbox"
                checked={sortedProducts.length > 0 && selectedProductIds.size === sortedProducts.length}
                onChange={() => handleSelectAllFiltered(sortedProducts.map((p) => p.id))}
                className="accent-amber-600 rounded cursor-pointer"
              />
              <span>
                {selectedProductIds.size === 0
                  ? `Selecionar todas as ${sortedProducts.length} peças filtradas`
                  : `${selectedProductIds.size} de ${sortedProducts.length} peças selecionadas`}
              </span>
            </label>

            {selectedProductIds.size > 0 && (
              <button
                onClick={() => setSelectedProductIds(new Set())}
                className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-xs"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {sortedProducts.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const hasPromo = product.preco_promocional && product.preco_promocional > 0;
            const custo = product.preco_custo || product.preco * 0.4;
            const margemBruta = product.preco > 0 ? ((product.preco - custo) / product.preco) * 100 : 0;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all ${
                  product.ativo ? 'border-slate-200 hover:border-amber-400' : 'border-rose-200 bg-rose-50/20 opacity-80'
                }`}
              >
                {/* Linha Principal da Peça */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Checkbox de Seleção em Massa */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectProduct(product.id)}
                      className="text-slate-400 hover:text-amber-600 transition-colors p-1 shrink-0 cursor-pointer"
                      title={selectedProductIds.has(product.id) ? 'Desmarcar peça' : 'Selecionar para ações em lote'}
                    >
                      {selectedProductIds.has(product.id) ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    {/* Foto da Peça */}
                    <div className="relative w-16 h-20 bg-slate-100 rounded-lg shrink-0 border border-slate-200 overflow-hidden shadow-2xs">
                      {product.foto_principal ? (
                        <Image
                          src={product.foto_principal}
                          alt={product.nome}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          Sem Foto
                        </div>
                      )}
                      {product.midias && product.midias.some((m) => m.tipo === 'video') && (
                        <span className="absolute bottom-1 right-1 bg-slate-900/90 text-amber-400 px-1 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                          <Video className="w-2.5 h-2.5" /> 9:16
                        </span>
                      )}
                    </div>

                    {/* Informações da Peça */}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          {product.categoria_nome}
                        </span>
                        {!product.ativo && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase">
                            Pausada
                          </span>
                        )}
                        {product.destaque && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                            🌟 Destaque
                          </span>
                        )}
                        {product.mais_vendido && (
                          <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold uppercase">
                            🔥 Mais Vendido
                          </span>
                        )}
                        {product.outlet && (
                          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold uppercase">
                            🏷️ Outlet
                          </span>
                        )}
                        {product.ultimas_pecas && (
                          <span className="text-[10px] bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded font-bold uppercase">
                            ⏳ Últimas Peças
                          </span>
                        )}
                        {reservedStockMap[product.id] > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold uppercase animate-pulse flex items-center gap-1">
                            👗 {reservedStockMap[product.id]} no provador
                          </span>
                        )}
                        {(aviseMeSummary[product.id] || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWaitlistProduct(product);
                              setIsWaitlistModalOpen(true);
                            }}
                            className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Clientes aguardando reposição desta peça"
                          >
                            <Bell className="w-3 h-3 text-purple-600" />
                            <span>{aviseMeSummary[product.id]} na fila</span>
                          </button>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {product.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Slug: <span className="font-mono text-slate-700">{product.slug}</span>
                        {product.tecido && ` • Tecido: ${product.tecido}`}
                      </p>
                    </div>
                  </div>

                  {/* Preço, Custo e Estoque */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Preço de Venda</span>
                      {hasPromo ? (
                        <div>
                          <span className="text-xs line-through text-slate-400 block">
                            {formatCurrency(product.preco)}
                          </span>
                          <span className="text-sm font-extrabold text-amber-800 font-serif-luxury block">
                            {formatCurrency(product.preco_promocional!)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-slate-900 font-serif-luxury block">
                          {formatCurrency(product.preco)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Custo (CMV)</span>
                      <span className="text-xs font-semibold text-slate-700 block">
                        {product.preco_custo ? formatCurrency(product.preco_custo) : formatCurrency(custo)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 font-mono block">
                        {margemBruta.toFixed(0)}% margem
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Estoque</span>
                      <span
                        className={`text-xs font-extrabold block ${
                          product.estoque_total > 5
                            ? 'text-emerald-700'
                            : product.estoque_total > 0
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {product.estoque_total > 0 ? `${product.estoque_total} un` : 'Esgotado'}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Ver na Vitrine Pública */}
                      <Link
                        href={`/catalogo?categoria=${encodeURIComponent(product.categoria_nome || 'all')}`}
                        target="_blank"
                        title="Ver peça na vitrine pública da boutique"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Editar Completo (Destaque Principal) */}
                      <button
                        onClick={() => handleOpenFullEdit(product)}
                        title="Editar Cadastro Completo: Fotos e Vídeos, Descrição, Grade e Estilo"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Editar Preços Rápido */}
                      <button
                        onClick={() => handleOpenEdit(product)}
                        title="Ajuste Rápido de Preços e CMV"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Preços</span>
                      </button>

                      {/* Botão Provador / Reserva (30 min) */}
                      <button
                        onClick={() => {
                          setSelectedFittingProduct(product);
                          setIsFittingModalOpen(true);
                        }}
                        title="Travar peça no provador por 30 minutos (evita venda dupla no site)"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                          (reservedStockMap[product.id] || 0) > 0
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">
                          {(reservedStockMap[product.id] || 0) > 0
                            ? `${reservedStockMap[product.id]} no provador`
                            : 'Provador'}
                        </span>
                      </button>

                      {/* Botão Fila de Espera / Avise-me */}
                      {(aviseMeSummary[product.id] || 0) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedWaitlistProduct(product);
                            setIsWaitlistModalOpen(true);
                          }}
                          title="Ver clientes aguardando reposição desta peça e notificar no WhatsApp"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 shadow-2xs"
                        >
                          <Bell className="w-3.5 h-3.5 text-purple-600" />
                          <span className="hidden sm:inline">
                            Fila ({aviseMeSummary[product.id]})
                          </span>
                        </button>
                      )}

                      {/* Pausar / Ativar */}
                      <button
                        onClick={() => handleToggleActive(product)}
                        title={product.ativo ? 'Pausar da vitrine' : 'Ativar na vitrine'}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                          product.ativo
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border-slate-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {product.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{product.ativo ? 'Pausar' : 'Ativar'}</span>
                      </button>

                      {/* Duplicar Peça */}
                      <button
                        onClick={() => handleDuplicateProduct(product)}
                        disabled={duplicatingId === product.id}
                        title="Duplicar peça em 1 clique (clona fotos, categorias e variações)"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Copy className={`w-3.5 h-3.5 ${duplicatingId === product.id ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Duplicar</span>
                      </button>

                      {/* Excluir / Arquivar (Abre Modal Visual) */}
                      <button
                        onClick={() => handleOpenDeleteModal(product)}
                        title="Excluir ou arquivar peça"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Expandir Grade */}
                      <button
                        data-testid="btn-expand-product-grid"
                        onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={isExpanded ? 'Recolher grade' : 'Ver variações de cor e tamanho'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grade de Variações Expandida */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        Grade de Cores, Tamanhos & Estoque por Peça
                      </span>
                    </div>

                    {product.variacoes && product.variacoes.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {product.variacoes.map((v) => (
                          <div
                            key={v.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: v.cor_hex || '#111' }}
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-800 block leading-tight">
                                  {v.tamanho}
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight truncate">
                                  {v.cor_nome}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickVariationStockChange(v.id, product.id, -1)}
                                disabled={updatingVarId === v.id || v.estoque <= 0}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Diminuir estoque (-1)"
                              >
                                -
                              </button>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={v.estoque}
                                  key={`${v.id}-${v.estoque}`}
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt((e.target as HTMLInputElement).value);
                                      if (!isNaN(val)) handleDirectVariationStockChange(v.id, product.id, val);
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val !== v.estoque) {
                                      handleDirectVariationStockChange(v.id, product.id, val);
                                    }
                                  }}
                                  className={`w-11 text-xs font-extrabold py-0.5 px-0.5 rounded text-center border transition-all focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                    savedSuccessVarId === v.id
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400/40'
                                      : v.estoque > 2
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:bg-white'
                                      : v.estoque > 0
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 focus:bg-white'
                                      : 'bg-rose-50 text-rose-800 border-rose-200 focus:bg-white'
                                  }`}
                                  title="Digite a quantidade e tecle Enter (ou clique fora) para salvar"
                                />
                              </div>
                              <button
                                onClick={() => handleQuickVariationStockChange(v.id, product.id, 1)}
                                disabled={updatingVarId === v.id}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
                                title="Aumentar estoque (+1)"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Peça com estoque simples (sem grade subdividida por cor/tamanho).
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'lista' ? (
        /* ======================================================== */
        /* MODO 2: LISTA / TABELA COMPACTA (ALTA DENSIDADE)          */
        /* ======================================================== */
        <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all duration-200 ${selectedProductIds.size > 0 ? 'mb-32' : 'mb-6'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={sortedProducts.length > 0 && selectedProductIds.size === sortedProducts.length}
                      onChange={() => handleSelectAllFiltered(sortedProducts.map((p) => p.id))}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-14">Foto</th>
                  <th className="p-3">Peça / Coleção</th>
                  <th className="p-3">Preço Venda</th>
                  <th className="p-3">Custo / Margem</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3 text-center">Status Vitrine</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  const hasPromo = product.preco_promocional && product.preco_promocional > 0;
                  const custo = product.preco_custo || product.preco * 0.4;
                  const margemBruta = product.preco > 0 ? ((product.preco - custo) / product.preco) * 100 : 0;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/50' : !product.ativo ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectProduct(product.id)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Foto miniatura */}
                      <td className="p-3">
                        <div className="relative w-10 h-12 bg-slate-100 rounded-md overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                          {product.foto_principal ? (
                            <Image
                              src={product.foto_principal}
                              alt={product.nome}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                              -
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nome & Coleção */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="font-bold text-slate-900 block hover:text-amber-700 transition-colors cursor-pointer"
                            onClick={() => handleOpenFullEdit(product)}
                            title="Clique para abrir o dossiê da peça"
                          >
                            {product.nome}
                          </span>
                          {product.destaque && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                              🌟 Destaque
                            </span>
                          )}
                          {product.mais_vendido && (
                            <span className="text-[9px] bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.2 rounded font-bold uppercase">
                              🔥 Mais Vendido
                            </span>
                          )}
                          {product.outlet && (
                            <span className="text-[9px] bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold uppercase">
                              🏷️ Outlet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-amber-800">{product.categoria_nome || 'Geral'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">/{product.slug}</span>
                        </div>
                      </td>

                      {/* Preço de Venda */}
                      <td className="p-3 whitespace-nowrap">
                        {hasPromo ? (
                          <div>
                            <span className="font-extrabold text-slate-900 font-mono text-xs block">
                              {formatCurrency(product.preco_promocional!)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through font-mono block">
                              {formatCurrency(product.preco)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-900 font-mono text-xs block">
                            {formatCurrency(product.preco)}
                          </span>
                        )}
                      </td>

                      {/* CMV e Margem */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-slate-600 font-mono text-[11px] block">
                          {formatCurrency(custo)}
                        </span>
                        <span
                          className={`text-[10px] font-bold block ${
                            margemBruta >= 50
                              ? 'text-emerald-700'
                              : margemBruta >= 30
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          Margem: {margemBruta.toFixed(1)}%
                        </span>
                      </td>

                      {/* Estoque Total & Grade */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs font-black px-2 py-0.5 rounded-full ${
                              product.estoque_total > 5
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : product.estoque_total > 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {product.estoque_total} un
                          </span>
                          {product.variacoes && product.variacoes.length > 0 && (
                            <span className="text-[10px] text-slate-400" title={`${product.variacoes.length} variações na grade`}>
                              ({product.variacoes.length} vars)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status com Toggle Direto */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            product.ativo
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                          title={product.ativo ? 'Clique para pausar da vitrine' : 'Clique para ativar na vitrine'}
                        >
                          {product.ativo ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Ativa</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-rose-600" />
                              <span>Pausada</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edição rápida de preço e estoque"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenFullEdit(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-800 transition-colors cursor-pointer"
                            title="Abrir dossiê completo da peça"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicateProduct(product)}
                            disabled={duplicatingId === product.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                            title="Duplicar peça em 1 clique"
                          >
                            <Copy className={`w-3.5 h-3.5 ${duplicatingId === product.id ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteModal(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir ou arquivar peça"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* MODO 3: KANBAN OPERACIONAL (COLUNAS VERTICAIS)           */
        /* ======================================================== */
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto transition-all duration-200 ${selectedProductIds.size > 0 ? 'pb-32' : 'pb-6'}`}>
          {[
            {
              id: 'ativas',
              label: 'Ativas na Vitrine',
              filter: (p: AdminProductItem) => p.ativo,
              color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900',
              badgeColor: 'bg-emerald-100 text-emerald-800'
            },
            {
              id: 'pausadas',
              label: 'Pausadas / Rascunhos',
              filter: (p: AdminProductItem) => !p.ativo,
              color: 'border-amber-400 bg-amber-50/40 text-amber-900',
              badgeColor: 'bg-amber-100 text-amber-800'
            },
            {
              id: 'criticas',
              label: 'Estoque Crítico / Esgotadas',
              filter: (p: AdminProductItem) => (p.estoque_total || 0) <= 2,
              color: 'border-rose-400 bg-rose-50/40 text-rose-900',
              badgeColor: 'bg-rose-100 text-rose-800'
            }
          ].map((col) => {
            const colProducts = sortedProducts.filter(col.filter);
            const colValor = colProducts.reduce((acc, p) => acc + (p.preco * (p.estoque_total || 0)), 0);

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col min-h-[500px] shadow-2xs"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {col.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {formatCurrency(colValor)} em estoque
                    </span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colProducts.length}
                  </span>
                </div>

                {/* Cards Verticais na Coluna */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5 max-h-[70vh]">
                  {colProducts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white/60 rounded-xl border border-dashed border-slate-200">
                      Nenhuma peça neste status
                    </div>
                  ) : (
                    colProducts.map((product) => {
                      const custo = product.preco_custo || product.preco * 0.4;
                      const margemBruta = product.preco > 0 ? ((product.preco - custo) / product.preco) * 100 : 0;

                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:shadow-sm hover:border-amber-400 transition-all space-y-2.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative w-12 h-16 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200">
                              {product.foto_principal ? (
                                <Image
                                  src={product.foto_principal}
                                  alt={product.nome}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                  -
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                                {product.categoria_nome || 'Geral'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate" title={product.nome}>
                                {product.nome}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs font-black text-slate-900 font-mono">
                                  {formatCurrency(product.preco_promocional || product.preco)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span
                              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                product.estoque_total > 5
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : product.estoque_total > 0
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {product.estoque_total} un em grade
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleActive(product)}
                                className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title={product.ativo ? 'Pausar da vitrine' : 'Ativar na vitrine'}
                              >
                                {product.ativo ? 'Pausar' : 'Ativar'}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edição rápida"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE CADASTRO COMPLETO (COM CLOUDFLARE R2) */}
      {/* ============================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-auto shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-slate-900 tracking-wide">
                  Cadastrar Nova Peça no Catálogo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados da peça, suba fotos em alta definição e vídeo de provador para o Cloudflare R2.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-6 text-xs">
              {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" /> 1. Informações Básicas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1 font-bold">Nome da Peça *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vestido Longo Alfaiataria Florença"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Categoria</label>
                    <select
                      value={newProductCatId}
                      onChange={(e) => {
                        setNewProductCatId(e.target.value);
                        setNewProductSubcat('');
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Subcategoria</label>
                    {(() => {
                      const selCat = categoriesList.find((c) => c.id === newProductCatId);
                      const availableSubs = selCat?.subcategorias || [];
                      return availableSubs.length > 0 ? (
                        <select
                          value={newProductSubcat}
                          onChange={(e) => setNewProductSubcat(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">Selecione ou deixe em branco...</option>
                          {availableSubs.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: Blazers, Cenoura, Tricots..."
                          value={newProductSubcat}
                          onChange={(e) => setNewProductSubcat(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Ou Nova Categoria</label>
                    <input
                      type="text"
                      placeholder="Ex: Alta Costura, Macacões..."
                      value={newCustomCatName}
                      onChange={(e) => setNewCustomCatName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Tecido</label>
                    <input
                      type="text"
                      placeholder="Ex: Seda Pura, Linho Cru"
                      value={newProductFabric}
                      onChange={(e) => setNewProductFabric(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Modelagem</label>
                    <input
                      type="text"
                      placeholder="Ex: Fluido, Evasê, Slim"
                      value={newProductModeling}
                      onChange={(e) => setNewProductModeling(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: PREÇOS & CUSTO (CMV) */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" /> 2. Precificação & Custo (CMV)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="489.00"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço Promocional (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={newProductPromoPrice}
                      onChange={(e) => setNewProductPromoPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço de Custo CMV (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 195.00"
                      value={newProductCostPrice}
                      onChange={(e) => setNewProductCostPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Usado para apurar o Lucro Líquido Real.
                    </span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: MÍDIAS & PROVADOR NO CLOUDFLARE R2 */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-600" /> 3. Fotos & Vídeo no Cloudflare R2
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    CDN Global Ativa
                  </span>
                </div>

                {/* Upload de Fotos */}
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Fotos da Peça ({uploadedPhotos.length}/6 enviadas)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                    {uploadedPhotos.map((url, i) => (
                      <div key={i} className="relative aspect-3/4 rounded-lg overflow-hidden border border-slate-300 group shadow-2xs">
                        <Image src={url} alt={`Foto ${i}`} fill className="object-cover" />
                        {coverPhotoIndex === i && (
                          <span className="absolute top-1 left-1 bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Capa
                          </span>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setCoverPhotoIndex(i)}
                            className="p-1 bg-white text-slate-900 rounded text-[10px] font-bold"
                          >
                            Capa
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            className="p-1 bg-rose-600 text-white rounded text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {uploadedPhotos.length < 6 && (
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white aspect-3/4 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center">
                        <Upload className={`w-5 h-5 ${uploadingImage ? 'animate-bounce text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] font-bold text-slate-700">
                          {uploadingImage ? 'Subindo...' : '+ Adicionar Foto'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={handleUploadImageFile}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Upload de Vídeo de Provador */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-slate-700 mb-1 font-bold">
                    Vídeo de Provador (Vertical 9:16)
                  </label>
                  {uploadedVideoUrl ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <Video className="w-5 h-5 text-amber-600 shrink-0" />
                      <span className="text-xs text-slate-800 font-mono truncate flex-1">
                        {uploadedVideoUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedVideoUrl('')}
                        className="text-rose-600 hover:underline text-xs font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Video className={`w-4 h-4 ${uploadingVideo ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
                      <span className="font-bold text-slate-700">
                        {uploadingVideo ? 'Enviando vídeo para o R2...' : 'Subir Vídeo de Provador (9:16 MP4)'}
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        disabled={uploadingVideo}
                        onChange={handleUploadVideoFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* SEÇÃO 4: GRADE DE CORES E TAMANHOS */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" /> 4. Grade de Variações
                  </h4>
                  <button
                    type="button"
                    onClick={addGridVariation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Variação
                  </button>
                </div>

                <div className="space-y-2">
                  {gridVariations.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="color"
                        value={v.cor_hex}
                        onChange={(e) => updateGridVariation(i, 'cor_hex', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="Nome da Cor"
                        value={v.cor_nome}
                        onChange={(e) => updateGridVariation(i, 'cor_nome', e.target.value)}
                        className="w-32 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900"
                      />
                      <select
                        value={v.tamanho}
                        onChange={(e) => updateGridVariation(i, 'tamanho', e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-bold"
                      >
                        <option value="PP">PP</option>
                        <option value="P">P</option>
                        <option value="M">M</option>
                        <option value="G">G</option>
                        <option value="GG">GG</option>
                        <option value="Único">Único</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Estoque"
                        value={v.estoque}
                        onChange={(e) => updateGridVariation(i, 'estoque', Number(e.target.value))}
                        className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeGridVariation(i)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÕES DO MODAL */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm cursor-pointer"
                >
                  {isSubmittingCreate ? 'Salvando no Banco & R2...' : 'Salvar Peça no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO RÁPIDA DE PREÇO E ESTOQUE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Editar Preço & Estoque
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold">{editingProduct.nome}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Preço Promocional (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Vazio para sem promoção"
                  value={editPromoPrice}
                  onChange={(e) => setEditPromoPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Preço de Custo CMV (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Para cálculo do Lucro Real"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Estoque Total</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold"
                />
              </div>

              {/* Tags & Sinalizadores Promocionais */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Tags & Sinalizadores Promocionais:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDestaque}
                      onChange={(e) => setEditDestaque(e.target.checked)}
                      className="accent-amber-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">🌟 Destaque</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editMaisVendido}
                      onChange={(e) => setEditMaisVendido(e.target.checked)}
                      className="accent-purple-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">🔥 Mais Vendido</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editOutlet}
                      onChange={(e) => setEditOutlet(e.target.checked)}
                      className="accent-rose-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">🏷️ Outlet</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUltimasPecas}
                      onChange={(e) => setEditUltimasPecas(e.target.checked)}
                      className="accent-orange-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">⏳ Últimas Peças</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA (CONSOLIDADA & EXCLUSIVA) */}
      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3 shrink-0">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              {selectedProductIds.size}
            </span>
            <span className="text-xs font-semibold hidden sm:inline text-slate-200">
              peça(s) selecionada(s)
            </span>
          </div>

          <button
            onClick={() => handleBulkToggle(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ativar</span>
          </button>

          <button
            onClick={() => handleBulkToggle(false)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Pausar</span>
          </button>

          <button
            onClick={() => setShowBulkDiscountModal(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>% Desconto</span>
          </button>

          <button
            onClick={() => setShowBulkCategoryModal(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mover Categoria</span>
          </button>

          <button
            onClick={handleBulkArchiveAction}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Arquivar</span>
          </button>

          <button
            onClick={() => setSelectedProductIds(new Set())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1 shrink-0"
            title="Cancelar seleção (ou tecle Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar (Esc)</span>
          </button>
        </div>
      )}

      {/* MODAL VISUAL DE EXCLUSÃO / ARQUIVAMENTO COM PROTEÇÃO CONTÁBIL */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                  {productOrdersCount > 0 ? 'Arquivar Peça do Catálogo' : 'Excluir Peça Definitivamente'}
                </h3>
              </div>
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="relative w-14 h-18 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                {deleteModalProduct.foto_principal ? (
                  <Image
                    src={deleteModalProduct.foto_principal}
                    alt={deleteModalProduct.nome}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                    Sem Foto
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  {deleteModalProduct.categoria_nome}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                  {deleteModalProduct.nome}
                </h4>
                <span className="text-xs text-slate-500 block mt-1">
                  Estoque: <strong>{deleteModalProduct.estoque_total} un</strong> • Preço: <strong>{formatCurrency(deleteModalProduct.preco)}</strong>
                </span>
              </div>
            </div>

            {isCheckingOrdersCount ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 mx-auto mb-1" />
                Verificando histórico contábil e de pedidos...
              </div>
            ) : productOrdersCount > 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Peça com {productOrdersCount} pedido(s) registrado(s)</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Esta peça já foi vendida anteriormente. Para proteger a <strong>integridade contábil</strong>, a <strong>apuração de DRE</strong> e o <strong>histórico de pedidos das clientes</strong>, a peça será <strong>arquivada e pausada da vitrine pública</strong> (Soft-Delete). As fotos e registros de vendas permanecerão preservados.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Sem vendas registradas: exclusão física permitida</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Esta peça nunca foi comprada por clientes. Ela será <strong>removida definitivamente</strong> do catálogo e banco de dados, incluindo suas variações de grade e mídias associadas.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalProduct(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingProduct || isCheckingOrdersCount}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer shadow-sm ${
                  productOrdersCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isDeletingProduct
                  ? 'Processando...'
                  : productOrdersCount > 0
                  ? 'Confirmar Arquivamento Seguro'
                  : 'Excluir Peça Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETA DA PEÇA (DOSSIÊ INTEGRAL) */}
      {editingFullProduct && (() => {
        const selectedCat = categoriesList.find((c) => c.id === editFullCatId);
        const catSubs = selectedCat?.subcategorias || [];
        const globalSubs = storeAttributes?.subcategorias || [];
        const categorySubcats = Array.from(new Set([...catSubs, ...globalSubs])).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] animate-fade-in overflow-hidden">
              {/* Cabeçalho do Modal */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 font-serif-luxury truncate">
                        Edição Completa da Peça
                      </h3>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Dossiê Integral
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {editingFullProduct.nome} • Slug: <span className="font-mono text-slate-700">{editingFullProduct.slug}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Botão de Alternância de Modo: Scroll Contínuo vs Abas */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = editViewMode === 'abas' ? 'scroll' : 'abas';
                      setEditViewMode(nextMode);
                      try {
                        localStorage.setItem('admin_product_edit_view_mode', nextMode);
                      } catch {}
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      editViewMode === 'scroll'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title={
                      editViewMode === 'scroll'
                        ? 'Mudar para visualização em Abas separadas'
                        : 'Mudar para visualização em Página Única Contínua (Scroll)'
                    }
                  >
                    {editViewMode === 'scroll' ? (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Modo em Abas</span>
                        <span className="sm:hidden">Abas</span>
                      </>
                    ) : (
                      <>
                        <ScrollText className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Modo Página Única (Scroll)</span>
                        <span className="sm:hidden">Scroll</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingFullProduct(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Fechar janela"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Barra de Navegação: Abas ou Âncoras no Modo Scroll */}
              {editViewMode === 'abas' ? (
                <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
                  {[
                    { id: 'geral', label: '1. Dados Gerais & Estilo', icon: FileText },
                    { id: 'midias', label: '2. Fotos e Vídeos da Peça', icon: Video },
                    { id: 'grade', label: '3. Grade de Cores & Tamanhos', icon: Layers },
                    { id: 'comercial', label: '4. Preços, CMV & Cross-Sell', icon: DollarSign }
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeEditTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveEditTab(tab.id as any)}
                        className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'border-amber-600 text-amber-800 bg-amber-50/40'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-amber-200/80 bg-amber-50/40 overflow-x-auto scrollbar-none text-xs">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                    <ScrollText className="w-3.5 h-3.5 text-amber-600" />
                    Página Única:
                  </span>
                  {[
                    { id: 'dossie-sec-geral', label: '1. Dados Gerais' },
                    { id: 'dossie-sec-midias', label: '2. Fotos e Vídeos' },
                    { id: 'dossie-sec-grade', label: '3. Grade de Estoque' },
                    { id: 'dossie-sec-comercial', label: '4. Preços & Cross-Sell' }
                  ].map((anchor) => (
                    <button
                      key={anchor.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(anchor.id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-amber-800 hover:border-amber-400 font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      {anchor.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Corpo com Scroll */}
              <div id="dossie-scroll-container" className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 scroll-smooth">
                {/* SEÇÃO 1: DADOS GERAIS & ESTILO */}
                {(editViewMode === 'scroll' || activeEditTab === 'geral') && (
                  <div id="dossie-sec-geral" className="space-y-4 scroll-mt-6">
                    {editViewMode === 'scroll' && (
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                          1
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                          Dados Gerais & Estilo
                        </h4>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Nome da Peça *</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                          placeholder="Ex: Conjunto Alfaiataria Nobre"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Slug URL (amigável)</label>
                        <input
                          type="text"
                          value={editFullSlug}
                          onChange={(e) => setEditFullSlug(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                          placeholder="ex: conjunto-alfaiataria-nobre"
                        />
                      </div>
                    </div>

                    {/* Linha de Atributos com Seletores Dinâmicos e Cadastro Inline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Categoria com botão inline para cadastrar nova */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-700 font-bold">Categoria</label>
                          {!isAddingNewCat && (
                            <button
                              type="button"
                              onClick={() => setIsAddingNewCat(true)}
                              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Nova Categoria</span>
                            </button>
                          )}
                        </div>

                        {isAddingNewCat ? (
                          <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 border border-amber-300 rounded-lg">
                            <input
                              type="text"
                              value={newCatInputName}
                              onChange={(e) => setNewCatInputName(e.target.value)}
                              placeholder="Nome da nova categoria..."
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-semibold"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateCategoryInline();
                                if (e.key === 'Escape') setIsAddingNewCat(false);
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCreateCategoryInline}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingNewCat(false);
                                setNewCatInputName('');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={editFullCatId}
                            onChange={(e) => {
                              setEditFullCatId(e.target.value);
                              setEditFullSubcat('');
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Selecione uma categoria...</option>
                            {categoriesList.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Subcategoria */}
                      <AdminCreatableSelect
                        label="Subcategoria"
                        value={editFullSubcat}
                        options={categorySubcats}
                        onChange={(val) => setEditFullSubcat(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('subcategorias', val)}
                        onDeleteOption={(val) => handleDeleteStoreAttribute('subcategorias', val)}
                        placeholder="Selecione ou cadastre..."
                      />

                      {/* Tecido / Composição */}
                      <AdminCreatableSelect
                        label="Tecido / Composição"
                        value={editFullFabric}
                        options={storeAttributes?.tecidos || []}
                        onChange={(val) => setEditFullFabric(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('tecidos', val)}
                        onDeleteOption={(val) => handleDeleteStoreAttribute('tecidos', val)}
                        placeholder="Selecione ou cadastre tecido..."
                      />

                      {/* Modelagem / Caimento */}
                      <AdminCreatableSelect
                        label="Modelagem / Caimento"
                        value={editFullModeling}
                        options={storeAttributes?.modelagens || []}
                        onChange={(val) => setEditFullModeling(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('modelagens', val)}
                        onDeleteOption={(val) => handleDeleteStoreAttribute('modelagens', val)}
                        placeholder="Selecione ou cadastre modelagem..."
                      />

                      {/* Linha / Coleção */}
                      <AdminCreatableSelect
                        label="Linha / Coleção"
                        value={editFullCollection}
                        options={storeAttributes?.colecoes || []}
                        onChange={(val) => setEditFullCollection(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('colecoes', val)}
                        onDeleteOption={(val) => handleDeleteStoreAttribute('colecoes', val)}
                        placeholder="Selecione ou cadastre coleção..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Descrição da Peça</label>
                      <textarea
                        rows={3}
                        value={editFullDesc}
                        onChange={(e) => setEditFullDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                        placeholder="Descreva a elegância, caimento e proposta de estilo desta peça..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">
                        Detalhes & Especificações (1 por linha)
                      </label>
                      <textarea
                        rows={3}
                        value={editFullDetails}
                        onChange={(e) => setEditFullDetails(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white"
                        placeholder="Ex: Forro interno suave&#10;Fechamento por zíper invisível&#10;Acabamento com costura pespontada"
                      />
                    </div>
                  </div>
                )}

                {/* SEÇÃO 2: FOTOS E VÍDEOS DA PEÇA */}
                {(editViewMode === 'scroll' || activeEditTab === 'midias') && (
                  <div id="dossie-sec-midias" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {editViewMode === 'scroll' && (
                            <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                              2
                            </div>
                          )}
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-serif-luxury">
                            Fotos e Vídeos da Peça
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Gerencie a galeria, defina a capa principal e ordene as fotos e vídeos que aparecem no catálogo e provador virtual.
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer text-xs transition-colors shadow-sm shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingEditPhoto ? 'Enviando Mídia...' : 'Adicionar Foto / Vídeo'}</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          disabled={uploadingEditPhoto}
                          onChange={handleUploadEditMedia}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Card Educativo: Orientação Visual 9:16 Vertical */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Smartphone className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-900 text-xs">
                            📐 Formato Recomendado: 9:16 Vertical (1080×1920)
                          </h5>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900">
                            Ideal para Celular
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Para fotos de catálogo e vídeos do provador virtual, prefira a proporção vertical <strong>9:16</strong> (estilo Reels e Stories). Vídeos e fotos verticais ocupam a tela inteira do cliente no smartphone, aumentando o engajamento e a conversão de vendas.
                        </p>
                      </div>
                    </div>

                    {/* Grid de Fotos e Vídeos com Reordenação e Definição de Capa */}
                    {editFullFotos.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                        Nenhuma foto ou vídeo cadastrado. Clique no botão "Adicionar Foto / Vídeo" acima para carregar mídias da peça.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {editFullFotos.map((foto, idx) => {
                          const isCover = editFullCoverIndex === idx || idx === 0;
                          const isVideo = foto.tipo === 'video' || /\.(mp4|mov|webm)$/i.test(foto.url);
                          return (
                            <div
                              key={idx}
                              className={`relative rounded-xl border-2 overflow-hidden bg-slate-100 group transition-all shadow-2xs flex flex-col ${
                                isCover ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200'
                              }`}
                            >
                              <div className="relative aspect-3/4 w-full bg-slate-900">
                                {isVideo ? (
                                  <div className="w-full h-full relative flex items-center justify-center">
                                    <video
                                      src={foto.url}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center pointer-events-none">
                                      <div className="w-8 h-8 rounded-full bg-slate-900/80 text-amber-400 flex items-center justify-center">
                                        <Play className="w-4 h-4 ml-0.5 fill-amber-400" />
                                      </div>
                                    </div>
                                    <span className="absolute bottom-1.5 left-1.5 bg-rose-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                      <Video className="w-2.5 h-2.5" />
                                      Vídeo
                                    </span>
                                  </div>
                                ) : (
                                  <Image
                                    src={foto.url}
                                    alt={`Mídia ${idx + 1}`}
                                    fill
                                    sizes="180px"
                                    className="object-cover"
                                  />
                                )}

                                {/* Badge de Posição / Capa */}
                                {isCover ? (
                                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                                    ⭐ Capa Principal
                                  </span>
                                ) : (
                                  <span className="absolute top-1.5 left-1.5 bg-slate-900/70 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                                    #{idx + 1}
                                  </span>
                                )}
                              </div>

                              {/* Barra de Ações Rápidas: Reordenar e Capa */}
                              <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveEditMedia(idx, 'left')}
                                    className={`p-1 rounded text-slate-600 hover:bg-slate-100 transition-colors ${
                                      idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                    title="Mover para esquerda / frente na exibição"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === editFullFotos.length - 1}
                                    onClick={() => handleMoveEditMedia(idx, 'right')}
                                    className={`p-1 rounded text-slate-600 hover:bg-slate-100 transition-colors ${
                                      idx === editFullFotos.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                    title="Mover para direita / trás na exibição"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetCoverMedia(idx)}
                                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded cursor-pointer transition-colors"
                                      title="Definir esta mídia como capa principal da vitrine"
                                    >
                                      Tornar Capa
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEditPhoto(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Excluir mídia da galeria"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SEÇÃO 3: GRADE DE CORES & TAMANHOS */}
                {(editViewMode === 'scroll' || activeEditTab === 'grade') && (
                  <div id="dossie-sec-grade" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          {editViewMode === 'scroll' && (
                            <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                              3
                            </div>
                          )}
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-serif-luxury">
                            Grade de Cores & Tamanhos
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Altere diretamente o estoque digitando o número desejado ou cadastre novas cores com múltiplos tamanhos de uma só vez.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">
                        Total: {editFullVariacoes.reduce((acc, v) => acc + Number(v.estoque || 0), 0)} unidades
                      </span>
                    </div>

                    {/* Lista de Variações Existentes com Input Numérico Direto */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                      {editFullVariacoes.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          Nenhuma variação cadastrada na grade desta peça.
                        </div>
                      ) : (
                        editFullVariacoes.map((v, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: v.cor_hex || '#111' }}
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs">
                                  {v.tamanho} • {v.cor_nome}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  SKU: {v.sku || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-semibold">Estoque:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.estoque}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setEditFullVariacoes((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, estoque: val } : item))
                                    );
                                  }}
                                  className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                                />
                                <span className="text-[11px] text-slate-400">un</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariationInFullEdit(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Remover esta variação da grade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Construtor Dinâmico Multi-Tamanhos por Cor */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-600" />
                            Cadastrar Nova Cor com Múltiplos Tamanhos e Estoque
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Defina a cor uma vez e configure vários tamanhos (ex: P com 15 un, M com 10 un, G com 5 un).
                          </p>
                        </div>

                        {/* Atalhos Rápidos de Grade */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplySizePreset('pmg')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Carregar grade padrão P, M, G"
                          >
                            ⚡ Grade P, M, G
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySizePreset('numeros')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Carregar grade numerada 36 ao 44"
                          >
                            ⚡ Grade 36 ao 44
                          </button>
                        </div>
                      </div>

                      {/* Dados da Cor */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Nome da Cor</label>
                          <input
                            type="text"
                            value={newVarColorName}
                            onChange={(e) => setNewVarColorName(e.target.value)}
                            placeholder="Ex: Terracota Nobre, Off White, Preto..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Hex da Cor</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newVarColorHex}
                              onChange={(e) => setNewVarColorHex(e.target.value)}
                              className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={newVarColorHex}
                              onChange={(e) => setNewVarColorHex(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lista de Tamanhos e Estoques para esta Cor */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-700 font-bold text-xs">
                            Tamanhos e Quantidades em Estoque para "{newVarColorName || 'esta cor'}":
                          </label>
                          <button
                            type="button"
                            onClick={handleAddMultiSizeRow}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Essa peça tem outro tamanho</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {multiVarSizes.map((row) => (
                            <div
                              key={row.id}
                              className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs"
                            >
                              <div className="flex-1">
                                <AdminCreatableSelect
                                  label=""
                                  value={row.tamanho}
                                  options={storeAttributes?.tamanhos || ['PP', 'P', 'M', 'G', 'GG', 'Tamanho Único', '36', '38', '40', '42', '44']}
                                  onChange={(val) => handleUpdateMultiSizeRow(row.id, 'tamanho', val)}
                                  onCreateOption={(val) => handleCreateStoreAttribute('tamanhos', val)}
                                  onDeleteOption={(val) => handleDeleteStoreAttribute('tamanhos', val)}
                                  placeholder="Tamanho..."
                                />
                              </div>

                              <div className="w-32">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.estoque}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) =>
                                      handleUpdateMultiSizeRow(
                                        row.id,
                                        'estoque',
                                        Math.max(0, parseInt(e.target.value) || 0)
                                      )
                                    }
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900 text-xs focus:bg-white"
                                    placeholder="Qtd..."
                                  />
                                  <span className="text-[11px] text-slate-400 font-semibold">un</span>
                                </div>
                              </div>

                              {multiVarSizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMultiSizeRow(row.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                  title="Remover tamanho"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botão de Concluir Adição da Grade */}
                      <button
                        type="button"
                        onClick={handleFinishColorMultiSizes}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Concluir e Inserir Cor e Tamanhos na Grade da Peça</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* SEÇÃO 4: PREÇOS, CMV & CROSS-SELL */}
                {(editViewMode === 'scroll' || activeEditTab === 'comercial') && (
                  <div id="dossie-sec-comercial" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                    {editViewMode === 'scroll' && (
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                          4
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                          Preços, CMV & Cross-Sell
                        </h4>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Preço de Venda (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFullPrice}
                          onChange={(e) => setEditFullPrice(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-sm focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Preço Promocional (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vazio para sem promoção"
                          value={editFullPromoPrice}
                          onChange={(e) => setEditFullPromoPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Preço de Custo CMV (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Custo real da confecção"
                          value={editFullCostPrice}
                          onChange={(e) => setEditFullCostPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Margem Bruta em Tempo Real */}
                    {editFullPrice > 0 && editFullCostPrice && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Margem Bruta Estimada da Peça:
                          </span>
                          <span className="text-sm font-extrabold text-emerald-950 font-serif-luxury block mt-0.5">
                            {(((editFullPrice - parseFloat(editFullCostPrice)) / editFullPrice) * 100).toFixed(1)}% de Margem
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-800">
                          Lucro Bruto: {formatCurrency(editFullPrice - parseFloat(editFullCostPrice))} / un
                        </span>
                      </div>
                    )}

                    {/* Cross-Sell Visual: "Monte o Look" / Peças Combinadas */}
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-slate-800 font-bold text-xs">
                            👠 "Monte o Look" / Peças Combinadas (Cross-Sell com Fotos)
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Selecione visualmente uma ou mais peças complementares para sugerir na vitrine e elevar o Ticket Médio:
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCrossSellModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{editFullPairedSlugs.length > 0 ? 'Modificar Peças do Look' : '+ Selecionar Peças do Look'}</span>
                        </button>
                      </div>

                      {/* Lista Visual de Peças do Look Selecionadas */}
                      {editFullPairedSlugs.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                          Nenhuma peça complementar vinculada a este produto. Clique no botão acima para escolher com fotos, filtros por categoria e busca.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {editFullPairedSlugs.map((slug) => {
                            const pairedProd = products.find((p) => p.slug === slug || p.id === slug);
                            if (!pairedProd) return null;
                            return (
                              <div
                                key={slug}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 relative group shadow-2xs"
                              >
                                <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  {pairedProd.foto_principal ? (
                                    <Image
                                      src={pairedProd.foto_principal}
                                      alt={pairedProd.nome}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h6 className="font-bold text-slate-900 text-xs truncate">{pairedProd.nome}</h6>
                                  <span className="text-[11px] text-amber-900 font-semibold block">
                                    {formatCurrency(pairedProd.preco)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = editFullPairedSlugs.filter((s) => s !== slug);
                                    setEditFullPairedSlugs(updated);
                                    setEditFullPairedSlug(updated.join(','));
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remover peça do look combinado"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sinalizadores Comerciais na Vitrine (Padrão + Customizados) */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Sinalizadores Comerciais na Vitrine:
                        </span>
                        {!isAddingCustomBadge && (
                          <button
                            type="button"
                            onClick={() => setIsAddingCustomBadge(true)}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Novo Sinalizador</span>
                          </button>
                        )}
                      </div>

                      {/* Mini Formulário Inline de Novo Sinalizador */}
                      {isAddingCustomBadge && (
                        <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                          <h6 className="font-bold text-amber-950 text-xs">Criar Novo Sinalizador Comercial</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={newCustomBadgeName}
                                onChange={(e) => setNewCustomBadgeName(e.target.value)}
                                placeholder="Nome (Ex: Edição Limitada, Peça Exclusiva)..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={newCustomBadgeColor}
                                onChange={(e) => setNewCustomBadgeColor(e.target.value)}
                                className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                              />
                              <input
                                type="text"
                                value={newCustomBadgeIcon}
                                onChange={(e) => setNewCustomBadgeIcon(e.target.value)}
                                placeholder="Emoji (✨)..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-center font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleAddCustomBadge}
                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCustomBadge(false);
                                  setNewCustomBadgeName('');
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grade de Sinalizadores Padrão e Customizados */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFullDestaque}
                            onChange={(e) => setEditFullDestaque(e.target.checked)}
                            className="accent-amber-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">🌟 Destaque</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFullMaisVendido}
                            onChange={(e) => setEditFullMaisVendido(e.target.checked)}
                            className="accent-purple-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">🔥 Mais Vendido</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFullOutlet}
                            onChange={(e) => setEditFullOutlet(e.target.checked)}
                            className="accent-rose-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">🏷️ Outlet</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFullUltimasPecas}
                            onChange={(e) => setEditFullUltimasPecas(e.target.checked)}
                            className="accent-orange-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">⏳ Últimas Peças</span>
                        </label>

                        {/* Sinalizadores Customizados da Loja */}
                        {(storeAttributes?.sinalizadores || []).map((badge) => {
                          const badgeLabel = badge.label || badge.nome || 'Sinalizador';
                          const isSelected = customBadgesSelected.includes(badgeLabel);
                          return (
                            <label
                              key={badge.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-50/60'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCustomBadgesSelected((prev) => [...prev, badgeLabel]);
                                  } else {
                                    setCustomBadgesSelected((prev) => prev.filter((b) => b !== badgeLabel));
                                  }
                                }}
                                className="accent-amber-600 rounded"
                              />
                              <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                                <span>{badge.icon || badge.icone || '✨'}</span>
                                <span className="truncate">{badgeLabel}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal com Ações */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  As alterações serão sincronizadas instantaneamente com o catálogo da boutique sem F5.
                </span>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingFullProduct(null)}
                    disabled={isSavingFullEdit}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFullEdit}
                    disabled={isSavingFullEdit}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingFullEdit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando Peça no Banco...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Salvar Cadastro Completo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal de Seleção Visual de Peças do Look Combinado (Cross-Sell) */}
            {isCrossSellModalOpen && (
              <CrossSellPickerModal
                isOpen={isCrossSellModalOpen}
                onClose={() => setIsCrossSellModalOpen(false)}
                currentProduct={editingFullProduct}
                allProducts={products}
                selectedSlugs={editFullPairedSlugs}
                onConfirm={(newSlugs: string[]) => {
                  setEditFullPairedSlugs(newSlugs);
                  setEditFullPairedSlug(newSlugs.join(','));
                  setIsCrossSellModalOpen(false);
                  showToast(`${newSlugs.length} peça(s) selecionada(s) para o Compre o Look!`);
                }}
              />
            )}
          </div>
        );
      })()}

      

      {/* MINI MODAL: DESCONTO EM MASSA */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
              Aplicar Desconto em {selectedProductIds.size} Peças
            </h4>
            <div>
              <label className="block text-slate-700 text-xs mb-1 font-semibold">
                Percentual de Desconto (% OFF):
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={bulkDiscountValue}
                onChange={(e) => setBulkDiscountValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-center text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkDiscountModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkApplyDiscountAction}
                disabled={isBulkActionRunning}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                {isBulkActionRunning ? 'Aplicando...' : 'Aplicar Desconto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL: MOVER CATEGORIA EM MASSA */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
              Mover {selectedProductIds.size} Peças para Categoria
            </h4>
            <div>
              <label className="block text-slate-700 text-xs mb-1 font-semibold">
                Selecione a Categoria de Destino:
              </label>
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold text-xs"
              >
                <option value="">Selecione...</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkCategoryModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkUpdateCategoryAction}
                disabled={isBulkActionRunning || !bulkCategoryTarget}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 cursor-pointer"
              >
                {isBulkActionRunning ? 'Movendo...' : 'Confirmar Mudança'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESERVA DE PROVADOR (30 MINUTOS) */}
      {selectedFittingProduct && (
        <ProductFittingRoomModal
          isOpen={isFittingModalOpen}
          onClose={() => {
            setIsFittingModalOpen(false);
            setSelectedFittingProduct(null);
          }}
          product={selectedFittingProduct}
          lojaId={tenantId}
          onReservationUpdated={fetchProductsData}
        />
      )}

      {/* MODAL DE FILA DE ESPERA (AVISE-ME QUANDO CHEGAR) */}
      {selectedWaitlistProduct && (
        <ProductWaitlistModal
          isOpen={isWaitlistModalOpen}
          onClose={() => {
            setIsWaitlistModalOpen(false);
            setSelectedWaitlistProduct(null);
          }}
          product={selectedWaitlistProduct}
          lojaId={tenantId}
          onListUpdated={fetchProductsData}
        />
      )}

      {/* MODAL DE IMPORTAÇÃO EM LOTE DE PEÇAS (EXCEL / CSV) */}
      <ProductBatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        lojaId={tenantId}
        categoriesList={categoriesList}
        onSuccess={() => {
          setIsBatchImportOpen(false);
          fetchProductsData();
        }}
      />
    </div>
  );
}
