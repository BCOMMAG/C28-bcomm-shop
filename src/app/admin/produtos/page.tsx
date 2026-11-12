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
  ArrowRightLeft,
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
  FileSpreadsheet,
  Lock,
  Archive,
  ArchiveRestore,
  RotateCcw,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronRight,
  Flame
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProductBatchImportModal } from '@/components/admin/products/ProductBatchImportModal';
import { ProductFullFormModal } from '@/components/admin/products/ProductFullFormModal';
import { AdminSinalizadoresModal } from '@/components/admin/products/AdminSinalizadoresModal';
import { AdminCollectionsManagerModal } from '@/components/admin/products/AdminCollectionsManagerModal';
import {
  getAdminProducts,
  toggleAdminProductActive,
  updateAdminProductDetails,
  updateAdminVariationStock,
  createAdminProduct,
  deleteAdminProduct,
  moveToTrashAdminProduct,
  restoreAdminProduct,
  archiveAdminProduct,
  unarchiveAdminProduct,
  permanentDeleteAdminProduct,
  getAdminCategories,
  getAdminCategoriesFull,
  saveAdminCategory,
  checkProductOrdersCount,
  updateAdminProductFull,
  bulkToggleProductActive,
  bulkApplyDiscount,
  bulkUpdateCategory,
  bulkArchiveProducts,
  bulkMoveToTrashProducts,
  bulkRestoreProducts,
  toggleProductPromotionalFlag,
  bulkUpdatePromotionalFlags,
  bulkUpdateProductCategory,
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
import {
  getStoredActiveMember,
  canManageCatalog,
  canDeleteProduct,
  canChangePrices,
  canAdjustStock,
  isMasterUser,
  MembroEquipe
} from '@/lib/team';
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
import { useAdminI18n } from '@/context/AdminI18nContext';

type ViewMode = 'cards' | 'lista' | 'kanban';
type SortOrder = 'recentes' | 'menor_estoque' | 'maior_estoque' | 'maior_preco' | 'menor_preco' | 'nome';

export default function AdminProdutosPage() {
  const { currentTenant } = useStore();
  const { t, locale, formatCurrency } = useAdminI18n();
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

  // Ciclo de Vida das Peças (Padrão: Apenas Ativas na Vitrine)
  const [lifecycleTab, setLifecycleTab] = useState<'ativas' | 'pausadas' | 'arquivadas' | 'lixeira' | 'todas'>('ativas');

  // RBAC & Permissões da Equipe
  const [activeMember, setActiveMember] = useState<MembroEquipe | null>(null);
  const [isMaster, setIsMaster] = useState(false);

  // Dropdown Consolidado de Ações do Catálogo
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  // Modais de Confirmação: Peça Pausada e Exclusão Permanente
  const [pausedConfirmProduct, setPausedConfirmProduct] = useState<AdminProductItem | null>(null);
  const [permanentDeleteModalProduct, setPermanentDeleteModalProduct] = useState<AdminProductItem | null>(null);

  useEffect(() => {
    setActiveMember(getStoredActiveMember());
    setIsMaster(isMasterUser());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node)) {
        setIsActionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const podeGerenciarCatalogo = canManageCatalog(activeMember, isMaster);
  const podeExcluir = canDeleteProduct(activeMember, isMaster);
  const podeAlterarPrecos = canChangePrices(activeMember, isMaster);
  const podeAjustarEstoque = canAdjustStock(activeMember, isMaster);
  const isDono = isMaster || !activeMember || activeMember.cargo === 'dono';

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

  // Modal de Criação de Produto e Gestão de Vitrines
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);

  // Callback unificado de salvamento (Criação e Edição Completa)
  const handleProductSavedFromFullModal = (savedProduct: AdminProductItem, isNew: boolean) => {
    setProducts((prev) => {
      if (isNew) {
        return [savedProduct, ...prev.filter((p) => p.id !== savedProduct.id)];
      }
      return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
    });
    fetchProductsData();
  };
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

  // Sinalizadores Customizados & Global
  const [isSinalizadoresModalOpen, setIsSinalizadoresModalOpen] = useState(false);
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

  // Alternar ativação na vitrine
  const handleToggleActive = async (product: AdminProductItem) => {
    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para pausar ou ativar peças na vitrine.', 'error');
      return;
    }
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

  // Interceptar solicitação de edição para peças pausadas
  const handleRequestEdit = (product: AdminProductItem) => {
    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para editar peças do catálogo.', 'error');
      return;
    }
    if (!product.ativo && !product.lixeira && !product.arquivado) {
      setPausedConfirmProduct(product);
      return;
    }
    handleOpenFullEdit(product);
  };

  const handleConfirmEditPaused = () => {
    if (!pausedConfirmProduct) return;
    const target = pausedConfirmProduct;
    setPausedConfirmProduct(null);
    handleOpenFullEdit(target);
  };

  // Abrir Modal Visual de Exclusão (Lixeira com Retenção de 30 dias)
  const handleOpenDeleteModal = async (product: AdminProductItem) => {
    if (!podeExcluir) {
      showToast('Perfil sem permissão para excluir peças.', 'error');
      return;
    }
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

  // Confirmar Envio para a Lixeira (30 dias de retenção)
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeletingProduct(true);
    try {
      const userPayload = activeMember
        ? { id: activeMember.id, nome: activeMember.nome, cargo: activeMember.cargo }
        : { nome: 'Administrador', cargo: 'dono' };

      const res = await moveToTrashAdminProduct(deleteModalProduct.id, userPayload);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === deleteModalProduct.id
              ? {
                  ...p,
                  ativo: false,
                  lixeira: true,
                  arquivado: false,
                  excluido_em: new Date().toISOString(),
                  expira_em: res.expiraEm || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  excluido_por: userPayload
                }
              : p
          )
        );
        showToast(`Peça "${deleteModalProduct.nome}" enviada para a Lixeira (30 dias de retenção).`, 'success');
        setDeleteModalProduct(null);
      } else {
        showToast(res.error || 'Erro ao mover para a lixeira.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Restaurar Peça da Lixeira
  const handleRestoreProduct = async (product: AdminProductItem) => {
    if (!podeExcluir) {
      showToast('Perfil sem permissão para restaurar peças.', 'error');
      return;
    }
    try {
      const res = await restoreAdminProduct(product.id);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, lixeira: false, excluido_em: null, expira_em: null, excluido_por: null }
              : p
          )
        );
        showToast(`Peça "${product.nome}" restaurada! Fica em Pausadas para revisão segura.`, 'success');
      } else {
        showToast(res.error || 'Erro ao restaurar peça.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao restaurar.', 'error');
    }
  };

  // Arquivar Peça (Fora de Linha)
  const handleArchiveProduct = async (product: AdminProductItem) => {
    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para arquivar peças.', 'error');
      return;
    }
    try {
      const res = await archiveAdminProduct(product.id);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, arquivado: true, ativo: false, lixeira: false } : p))
        );
        showToast(`Peça "${product.nome}" arquivada com sucesso.`, 'success');
      } else {
        showToast(res.error || 'Erro ao arquivar peça.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao arquivar.', 'error');
    }
  };

  // Desarquivar Peça
  const handleUnarchiveProduct = async (product: AdminProductItem) => {
    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para desarquivar peças.', 'error');
      return;
    }
    try {
      const res = await unarchiveAdminProduct(product.id);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, arquivado: false } : p))
        );
        showToast(`Peça "${product.nome}" desarquivada!`, 'success');
      } else {
        showToast(res.error || 'Erro ao desarquivar.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao desarquivar.', 'error');
    }
  };

  // Exclusão Definitiva (Hard Delete / Expurgo)
  const handlePermanentDelete = async (product: AdminProductItem) => {
    if (!isDono) {
      showToast('Apenas a proprietária pode realizar exclusão definitiva.', 'error');
      return;
    }
    try {
      const res = await permanentDeleteAdminProduct(product.id);
      if (res.success) {
        if (res.action === 'expurgo_fiscal') {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, lixeira: false, arquivado: true, midias: [] } : p))
          );
          showToast(`Peça possui pedidos anteriores: mídias removidas e histórico fiscal preservado.`, 'success');
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== product.id));
          showToast(`Peça "${product.nome}" excluída permanentemente.`, 'success');
        }
        setPermanentDeleteModalProduct(null);
      } else {
        showToast(res.error || 'Erro ao excluir definitivamente.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
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

    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para arquivar peças.', 'error');
      return;
    }

    if (!confirm(`Deseja realmente arquivar as ${ids.length} peças selecionadas? Elas ficarão guardadas fora da vitrine e da lista padrão.`)) {
      return;
    }

    setIsBulkActionRunning(true);
    try {
      const res = await bulkArchiveProducts(ids);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.has(p.id) ? { ...p, ativo: false, arquivado: true, lixeira: false } : p
          )
        );
        showToast(`${res.count} peças arquivadas com segurança!`);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao arquivar peças em massa.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkMoveToTrashAction = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    if (!podeExcluir) {
      showToast('Perfil sem permissão para enviar peças para a lixeira.', 'error');
      return;
    }

    if (!confirm(`Deseja mover as ${ids.length} peças selecionadas para a Lixeira (retenção de 30 dias)?`)) {
      return;
    }

    setIsBulkActionRunning(true);
    try {
      const userPayload = activeMember
        ? { id: activeMember.id, nome: activeMember.nome, cargo: activeMember.cargo }
        : { nome: 'Administrador', cargo: 'dono' };

      const res = await bulkMoveToTrashProducts(ids, userPayload);
      if (res.success) {
        const agora = new Date().toISOString();
        const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.has(p.id)
              ? {
                  ...p,
                  ativo: false,
                  lixeira: true,
                  arquivado: false,
                  excluido_em: agora,
                  expira_em: expiraEm,
                  excluido_por: userPayload
                }
              : p
          )
        );
        showToast(`${res.count} peças enviadas para a Lixeira!`, 'success');
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao enviar para a lixeira em massa.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkRestoreAction = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    if (!podeExcluir) {
      showToast('Perfil sem permissão para restaurar peças.', 'error');
      return;
    }

    setIsBulkActionRunning(true);
    try {
      const res = await bulkRestoreProducts(ids);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.has(p.id)
              ? { ...p, lixeira: false, excluido_em: null, expira_em: null, excluido_por: null }
              : p
          )
        );
        showToast(`${res.count} peças restauradas para o catálogo!`, 'success');
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao restaurar peças em massa.', 'error');
      }
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  // Ações rápidas de Sinalizador Individual (1 clique na tabela/card)
  const handleToggleProductFlag = async (
    productId: string,
    flag: 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas',
    currentValue: boolean
  ) => {
    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para alterar vitrines.', 'error');
      return;
    }
    const newValue = !currentValue;
    // Otimista
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [flag]: newValue } : p))
    );

    const labels: Record<string, string> = {
      destaque: newValue ? 'adicionada a Lançamentos/Destaque' : 'removida de Lançamentos/Destaque',
      mais_vendido: newValue ? 'marcada como Mais Vendido' : 'removida de Mais Vendidos',
      outlet: newValue ? 'adicionada ao Bazar/Outlet' : 'removida do Bazar/Outlet',
      ultimas_pecas: newValue ? 'marcada como Últimas Peças' : 'removida de Últimas Peças',
    };

    const res = await toggleProductPromotionalFlag(productId, flag, newValue);
    if (res.success) {
      showToast(`Peça ${labels[flag]}!`);
    } else {
      showToast(res.error || 'Erro ao alterar vitrine da peça.', 'error');
      fetchProductsData();
    }
  };

  // Ações em massa para vitrines e sinalizadores
  const handleBulkPromotionalFlagAction = async (
    flag: 'destaque' | 'mais_vendido' | 'outlet' | 'ultimas_pecas',
    value: boolean
  ) => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    if (!podeGerenciarCatalogo) {
      showToast('Perfil sem permissão para gerenciar vitrines.', 'error');
      return;
    }

    setIsBulkActionRunning(true);
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, [flag]: value } : p))
    );

    const labels: Record<string, string> = {
      destaque: value ? 'adicionadas a Lançamentos' : 'removidas de Lançamentos',
      mais_vendido: value ? 'adicionadas a Mais Vendidos' : 'removidas de Mais Vendidos',
      outlet: value ? 'adicionadas ao Outlet' : 'removidas do Outlet',
      ultimas_pecas: value ? 'marcadas como Últimas Peças' : 'removidas de Últimas Peças',
    };

    try {
      const res = await bulkUpdatePromotionalFlags(ids, flag, value);
      if (res.success) {
        showToast(`${res.count} peças ${labels[flag]} com sucesso!`);
        setSelectedProductIds(new Set());
      } else {
        showToast(res.error || 'Erro ao atualizar peças.', 'error');
        fetchProductsData();
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
          estoque: v.estoque,
          sku: `${generatedSlug}-${v.cor_nome}-${v.tamanho}`.toUpperCase(),
          preco: product.preco,
          preco_promocional: product.preco_promocional || null
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

  // Contagens dinâmicas para abas de ciclo de vida
  const countAtivas = useMemo(
    () => products.filter((p) => p.ativo && !p.arquivado && !p.lixeira).length,
    [products]
  );
  const countPausadas = useMemo(
    () => products.filter((p) => !p.ativo && !p.arquivado && !p.lixeira).length,
    [products]
  );
  const countArquivadas = useMemo(
    () => products.filter((p) => Boolean(p.arquivado)).length,
    [products]
  );
  const countLixeira = useMemo(
    () => products.filter((p) => Boolean(p.lixeira)).length,
    [products]
  );
  const countTotalCatalogo = useMemo(
    () => countAtivas + countPausadas,
    [countAtivas, countPausadas]
  );
  const countTodasGeral = useMemo(
    () => products.filter((p) => !p.lixeira).length,
    [products]
  );

  // Categorias para filtro (baseado em produtos que não estão na lixeira)
  const categoriesFilter = useMemo(() => [
    'todas',
    ...Array.from(new Set(products.filter((p) => !p.lixeira).map((p) => p.categoria_nome || 'Geral')))
  ], [products]);

  // Filtro de Busca, Ciclo de Vida e Estoque
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Filtro estrito de Ciclo de Vida
      if (lifecycleTab === 'ativas') {
        if (!p.ativo || p.arquivado || p.lixeira) return false;
      } else if (lifecycleTab === 'pausadas') {
        if (p.ativo || p.arquivado || p.lixeira) return false;
      } else if (lifecycleTab === 'arquivadas') {
        if (!p.arquivado) return false;
      } else if (lifecycleTab === 'lixeira') {
        if (!p.lixeira) return false;
      } else if (lifecycleTab === 'todas') {
        // Todas as peças operacionais do catálogo exceto lixeira
        if (p.lixeira) return false;
      }

      // 2. Filtro de Categoria
      if (selectedCategory !== 'todas' && p.categoria_nome !== selectedCategory) {
        return false;
      }

      // 3. Filtro de Estoque / Badges Promocionais
      if (stockFilter === 'criticos') {
        const temCritico = p.estoque_total <= 2 || (p.variacoes && p.variacoes.some((v) => v.estoque <= 2));
        if (!temCritico) return false;
      } else if (stockFilter === 'esgotados') {
        if (p.estoque_total > 0) return false;
      } else if (stockFilter === 'destaques') {
        if (!p.destaque) return false;
      } else if (stockFilter === 'outlet') {
        if (!p.outlet) return false;
      } else if (stockFilter === 'mais_vendidos') {
        if (!p.mais_vendido) return false;
      } else if (stockFilter === 'ultimas_pecas') {
        if (!p.ultimas_pecas) return false;
      }

      // 4. Busca textual (nome, slug ou SKU)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = p.nome.toLowerCase().includes(term);
        const matchSlug = p.slug.toLowerCase().includes(term);
        const matchSku = p.variacoes && p.variacoes.some((v) => v.sku && v.sku.toLowerCase().includes(term));
        return matchName || matchSlug || matchSku;
      }
      return true;
    });
  }, [products, lifecycleTab, selectedCategory, stockFilter, searchTerm]);

  // Produtos operacionais para métricas (exclui lixeira e arquivadas para não distorcer contabilidade)
  const produtosOperacionais = useMemo(() => {
    return products.filter((p) => !p.lixeira && !p.arquivado);
  }, [products]);

  const totalAtivos = countAtivas;
  const totalPausados = countPausadas;
  const estoqueTotalPecas = useMemo(() => {
    return produtosOperacionais.reduce((acc, p) => acc + (p.estoque_total || 0), 0);
  }, [produtosOperacionais]);

  const valorTotalCatalogo = useMemo(() => {
    return produtosOperacionais.reduce((acc, p) => acc + (p.preco * (p.estoque_total || 0)), 0);
  }, [produtosOperacionais]);

  const pecasCriticasCount = useMemo(() => {
    return produtosOperacionais.filter((p) => (p.estoque_total || 0) <= 2).length;
  }, [produtosOperacionais]);

  const taxaAtivas = useMemo(() => {
    if (countTotalCatalogo === 0) return 0;
    return Math.round((totalAtivos / countTotalCatalogo) * 100);
  }, [countTotalCatalogo, totalAtivos]);

  // Busca contextual em outras abas quando a aba atual retorna zero resultados
  const searchResultsInOtherTabs = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();
    const matches = products.filter((p) => {
      const matchName = p.nome.toLowerCase().includes(term);
      const matchSlug = p.slug.toLowerCase().includes(term);
      return matchName || matchSlug;
    });

    if (lifecycleTab === 'ativas' && filteredProducts.length === 0) {
      const pausadas = matches.filter((p) => !p.ativo && !p.arquivado && !p.lixeira).length;
      const arquivadas = matches.filter((p) => p.arquivado).length;
      const lixeira = matches.filter((p) => p.lixeira).length;
      if (pausadas > 0 || arquivadas > 0 || lixeira > 0) {
        return { pausadas, arquivadas, lixeira };
      }
    }
    return null;
  }, [searchTerm, products, lifecycleTab, filteredProducts.length]);

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
    <div className="space-y-6 w-full min-w-0 max-w-full">
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

      {/* 2. CARDS DE MÉTRICAS OPERACIONAIS ESTILO PEDIDOS (INTERATIVOS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          {
            id: 'todas',
            label: t.products.kpis.totalCatalog,
            icon: Package,
            value: countTotalCatalogo,
            unit: t.products.kpis.modelsUnit,
            subValue: formatCurrency(valorTotalCatalogo),
            subLabel: t.products.kpis.inStockLabel,
            bgLight: 'bg-slate-50/70',
            border: 'border-slate-200',
            activeBorder: 'ring-2 ring-slate-700 border-slate-700',
            iconColor: 'text-slate-600',
            isSelected: lifecycleTab === 'todas',
            action: () => {
              setLifecycleTab('todas');
              setSelectedProductIds(new Set());
            }
          },
          {
            id: 'ativas',
            label: t.products.kpis.activeShowcase,
            icon: CheckCircle2,
            value: totalAtivos,
            unit: t.products.kpis.piecesUnit,
            subValue: `${taxaAtivas}%`,
            subLabel: t.products.kpis.ofCatalogLabel,
            bgLight: 'bg-emerald-50/70',
            border: 'border-emerald-200',
            activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
            iconColor: 'text-emerald-600',
            isSelected: lifecycleTab === 'ativas',
            action: () => {
              setLifecycleTab('ativas');
              setSelectedProductIds(new Set());
            }
          },
          {
            id: 'pausadas',
            label: t.products.kpis.paused,
            icon: EyeOff,
            value: totalPausados,
            unit: t.products.kpis.piecesUnit,
            subValue: totalPausados > 0 ? t.products.kpis.outOfShowcase : t.products.kpis.nonePaused,
            subLabel: '',
            bgLight: 'bg-amber-50/70',
            border: 'border-amber-200',
            activeBorder: 'ring-2 ring-amber-500 border-amber-500',
            iconColor: 'text-amber-600',
            isSelected: lifecycleTab === 'pausadas',
            action: () => {
              setLifecycleTab('pausadas');
              setSelectedProductIds(new Set());
            }
          },
          {
            id: 'grade',
            label: t.products.kpis.gridStock,
            icon: Layers,
            value: estoqueTotalPecas,
            unit: t.products.kpis.unitsBadge,
            subValue: pecasCriticasCount > 0 ? t.products.kpis.criticalWarning(pecasCriticasCount) : t.products.kpis.normalStock,
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
              title={t.products.kpis.filterTooltip(kpi.label)}
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

              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-1">
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
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

      {/* 3. NAVEGAÇÃO DE STATUS & CICLO DE VIDA (ABAS DINÂMICAS) */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px scrollbar-none">
        {[
          {
            id: 'ativas',
            label: t.products.lifecycle.active,
            count: countAtivas,
            icon: CheckCircle2,
            activeColor: 'text-emerald-700 border-emerald-500 bg-emerald-50/60 font-bold',
            badgeColor: 'bg-emerald-100 text-emerald-800'
          },
          {
            id: 'pausadas',
            label: t.products.lifecycle.paused,
            count: countPausadas,
            icon: EyeOff,
            activeColor: 'text-rose-700 border-rose-500 bg-rose-50/60 font-bold',
            badgeColor: 'bg-rose-100 text-rose-800'
          },
          {
            id: 'arquivadas',
            label: t.products.lifecycle.archived,
            count: countArquivadas,
            icon: Archive,
            activeColor: 'text-slate-800 border-slate-600 bg-slate-100 font-bold',
            badgeColor: 'bg-slate-200 text-slate-800'
          },
          {
            id: 'lixeira',
            label: t.products.lifecycle.trash30Days,
            count: countLixeira,
            icon: Trash2,
            activeColor: 'text-rose-800 border-rose-600 bg-rose-100/70 font-bold',
            badgeColor: 'bg-rose-200 text-rose-900'
          },
          {
            id: 'todas',
            label: t.products.lifecycle.allPieces,
            count: countTodasGeral,
            icon: Layers,
            activeColor: 'text-slate-900 border-slate-900 bg-slate-50 font-bold',
            badgeColor: 'bg-slate-200 text-slate-700'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = lifecycleTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setLifecycleTab(tab.id as any);
                setSelectedProductIds(new Set());
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-lg ${
                isActive
                  ? tab.activeColor
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50/80 font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${tab.badgeColor}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. TOOLBAR COMPACTA EM LINHA ÚNICA (MENU DE AÇÕES CONSOLIDADO) */}
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
              placeholder={t.products.toolbar.searchPlaceholder}
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
              <span>{t.products.toolbar.filtersBtn}</span>
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
                    {t.products.toolbar.filterCatalogTitle}
                  </span>
                  <button
                    onClick={handleClearAllFilters}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    {t.products.toolbar.clearAll}
                  </button>
                </div>

                {/* Filtro por Categoria */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    {t.products.toolbar.collectionCategory}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {categoriesFilter.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'todas' ? t.products.toolbar.allCollections : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Comercial / Grade */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    {t.products.toolbar.commercialStatusGrade}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'todos', label: t.products.toolbar.statusAll },
                      { id: 'criticos', label: t.products.toolbar.statusRestockCritical },
                      { id: 'destaques', label: t.products.toolbar.statusFeatured },
                      { id: 'mais_vendidos', label: t.products.toolbar.statusBestSellers },
                      { id: 'outlet', label: t.products.toolbar.statusOutlet },
                      { id: 'ultimas_pecas', label: t.products.toolbar.statusLastPieces },
                      { id: 'esgotados', label: t.products.toolbar.statusOutOfStock }
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
                    {t.products.toolbar.sortCatalog}
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="recentes">{t.products.toolbar.sortRecent}</option>
                    <option value="menor_estoque">{t.products.toolbar.sortLowestStock}</option>
                    <option value="maior_estoque">{t.products.toolbar.sortHighestStock}</option>
                    <option value="maior_preco">{t.products.toolbar.sortHighestPrice}</option>
                    <option value="menor_preco">{t.products.toolbar.sortLowestPrice}</option>
                    <option value="nome">{t.products.toolbar.sortNameAZ}</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {t.products.toolbar.piecesFound(sortedProducts.length)}
                  </span>
                  <button
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {t.products.toolbar.viewResults}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Atualizar (Ícone Compacto) */}
          <button
            onClick={fetchProductsData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
            title={t.products.toolbar.refreshTooltip}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
          </button>

          {/* Botão de Destaque: Gestor de Vitrines & Coleções */}
          <button
            onClick={() => setIsCollectionsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer shadow-2xs shrink-0"
            title={t.products.toolbar.collectionsTooltip}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{t.products.toolbar.collectionsAndFeaturesBtn}</span>
            <span className="sm:hidden text-[11px]">Vitrines</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Menu Dropdown Consolidado: + Ações do Catálogo */}
          <div className="relative" ref={actionsDropdownRef}>
            <button
              onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
              className="admin-btn-primary px-3.5 py-2 text-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title={t.products.toolbar.catalogActionsBtn}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.products.toolbar.catalogActionsBtn}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.products.toolbar.catalogToolsHeader}
                  </span>
                </div>

                {/* 0. Vitrines & Destaques (Acesso rápido mobile) */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    setIsCollectionsModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-900 bg-amber-50/60 hover:bg-amber-100 border-b border-amber-100/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div>
                    <span className="font-bold block">{t.products.toolbar.collectionsAndFeaturesBtn}</span>
                    <span className="text-[10px] text-amber-700/80 block">{t.products.toolbar.collectionsTooltip}</span>
                  </div>
                </button>

                {/* 1. Cadastrar Peça */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    if (!podeGerenciarCatalogo) {
                      showToast('Perfil sem permissão para cadastrar peças.', 'error');
                      return;
                    }
                    setIsCreateModalOpen(true);
                  }}
                  disabled={!podeGerenciarCatalogo}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">{t.products.toolbar.actionCreateProduct}</span>
                    <span className="text-[10px] text-slate-400 block">{t.products.toolbar.actionCreateProductDesc}</span>
                  </div>
                </button>

                {/* 2. Importar em Lote */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    if (!podeGerenciarCatalogo) {
                      showToast('Perfil sem permissão para importar peças.', 'error');
                      return;
                    }
                    setIsBatchImportOpen(true);
                  }}
                  disabled={!podeGerenciarCatalogo}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">{t.products.toolbar.actionBatchImport}</span>
                    <span className="text-[10px] text-slate-400 block">{t.products.toolbar.actionBatchImportDesc}</span>
                  </div>
                </button>

                {/* 3. Sinalizadores Comerciais */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    if (!podeGerenciarCatalogo) {
                      showToast('Perfil sem permissão para gerenciar sinalizadores.', 'error');
                      return;
                    }
                    setIsSinalizadoresModalOpen(true);
                  }}
                  disabled={!podeGerenciarCatalogo}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">{t.products.toolbar.actionCommercialFlags}</span>
                    <span className="text-[10px] text-slate-400 block">{t.products.toolbar.actionCommercialFlagsDesc}</span>
                  </div>
                </button>

                {/* 4. Gestor de Vitrines & Destaques */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    if (!podeGerenciarCatalogo) {
                      showToast('Perfil sem permissão para gerenciar vitrines.', 'error');
                      return;
                    }
                    setIsCollectionsModalOpen(true);
                  }}
                  disabled={!podeGerenciarCatalogo}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-900">{t.products.toolbar.actionCuratorShowcase}</span>
                    <span className="text-[10px] text-slate-400 block">{t.products.toolbar.actionCuratorShowcaseDesc}</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* 4. Exportar Excel */}
                <button
                  onClick={() => {
                    setIsActionsDropdownOpen(false);
                    handleExportCatalogXLSX();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">{t.products.toolbar.actionExportExcel}</span>
                    <span className="text-[10px] text-slate-400 block">{t.products.toolbar.actionExportExcelDesc}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

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
              title={t.products.toolbar.viewCardsTooltip}
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
              title={t.products.toolbar.viewListTooltip}
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
              title={t.products.toolbar.viewKanbanTooltip}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerta de Busca Contextual em Outras Abas */}
        {searchResultsInOtherTabs && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {t.products.toolbar.crossSearchNotice(
                  searchResultsInOtherTabs.pausadas,
                  searchResultsInOtherTabs.arquivadas,
                  searchResultsInOtherTabs.lixeira
                )}
              </span>
            </div>
            {searchResultsInOtherTabs.pausadas > 0 && (
              <button
                onClick={() => setLifecycleTab('pausadas')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[11px] cursor-pointer transition-colors shrink-0"
              >
                {t.products.toolbar.viewPausedBtn}
              </button>
            )}
          </div>
        )}

        {/* Chips de Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] px-1 animate-in fade-in duration-150">
            <span className="text-slate-400 font-bold uppercase text-[10px]">{t.products.toolbar.activeFiltersLabel}</span>

            {selectedCategory !== 'todas' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                {t.products.toolbar.filterChipCollection(selectedCategory)}
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
                {t.products.toolbar.filterChipStatus(stockFilter)}
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
                {t.products.toolbar.filterChipSearch(searchTerm)}
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
                {t.products.toolbar.filterChipSort(sortOrder)}
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
              {t.products.toolbar.clearAllFiltersBtn}
            </button>
          </div>
        )}
      </div>

      {/* LISTAGEM DE PRODUTOS NOS 3 MODOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>{t.products.toolbar.loadingCatalog}</span>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">{t.products.toolbar.noPiecesFound}</p>
          <p className="text-xs">{t.products.toolbar.adjustSearchTip}</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {t.products.toolbar.clearFiltersBtn}
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="admin-btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.products.toolbar.createNewPieceBtn}</span>
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
                  ? t.products.card.selectAllFiltered(sortedProducts.length)
                  : t.products.card.selectedCount(selectedProductIds.size, sortedProducts.length)}
              </span>
            </label>

            {selectedProductIds.size > 0 && (
              <button
                onClick={() => setSelectedProductIds(new Set())}
                className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-xs"
              >
                {t.products.card.clearSelection}
              </button>
            )}
          </div>

          {sortedProducts.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const hasPromo = product.preco_promocional && product.preco_promocional > 0;
            const custo = product.preco_custo || product.preco * 0.4;
            const margemBruta = product.preco > 0 ? ((product.preco - custo) / product.preco) * 100 : 0;

            const isPausada = !product.ativo && !product.lixeira && !product.arquivado;
            const isLixeira = Boolean(product.lixeira);
            const isArquivada = Boolean(product.arquivado);
            const diasRestantesLixeira = product.expira_em
              ? Math.max(0, Math.ceil((new Date(product.expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : 30;

            const cardBgClass = isLixeira
              ? 'border-rose-400 bg-rose-50/90 dark:bg-rose-950/35 dark:border-rose-900/80 shadow-xs'
              : isPausada
              ? 'border-rose-300 bg-rose-50/75 dark:bg-rose-950/25 dark:border-rose-900/60 shadow-xs'
              : isArquivada
              ? 'border-slate-300 bg-slate-50/80 dark:bg-slate-900/40 opacity-80 shadow-2xs'
              : 'border-slate-200 hover:border-amber-400 bg-white shadow-xs';

            return (
              <div
                key={product.id}
                className={`border rounded-xl overflow-hidden transition-all ${cardBgClass}`}
              >
                {/* Linha Principal da Peça (Estrutura em 2 Níveis Harmoniosos) */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Nível 1: Identificação da Peça em Largura Total (Zero Colisão) */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
                    {/* Checkbox de Seleção em Massa */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectProduct(product.id)}
                      className="text-slate-400 hover:text-amber-600 transition-colors p-1 shrink-0 cursor-pointer"
                      title={selectedProductIds.has(product.id) ? t.products.card.unselectTooltip : t.products.card.selectTooltip}
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
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          {t.products.card.noPhoto}
                        </div>
                      )}
                      {product.midias && product.midias.some((m) => m.tipo === 'video') && (
                        <span className="absolute bottom-1 right-1 bg-slate-900/90 text-amber-400 px-1 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                          <Video className="w-2.5 h-2.5" /> 9:16
                        </span>
                      )}
                    </div>

                    {/* Informações da Peça */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          {product.categoria_nome}
                        </span>

                        {/* Badges de Ciclo de Vida */}
                        {isPausada && (
                          <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-2xs">
                            {t.products.card.badgePaused}
                          </span>
                        )}
                        {isLixeira && (
                          <span className="text-[10px] bg-rose-700 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> {t.products.card.badgeTrash(diasRestantesLixeira)}
                          </span>
                        )}
                        {isArquivada && (
                          <span className="text-[10px] bg-slate-700 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
                            <Archive className="w-3 h-3" /> {t.products.card.badgeArchived}
                          </span>
                        )}

                        {product.destaque && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProductFlag(product.id, 'destaque', true);
                            }}
                            className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 border border-amber-300 px-2 py-0.5 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.products.card.flagFeaturedTooltip}
                          >
                            <span>{t.products.card.flagFeatured}</span>
                            <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                          </button>
                        )}
                        {product.mais_vendido && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProductFlag(product.id, 'mais_vendido', true);
                            }}
                            className="text-[10px] bg-purple-50 text-purple-800 hover:bg-purple-100 hover:border-purple-300 border border-purple-200 px-2 py-0.5 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.products.card.flagBestSellerTooltip}
                          >
                            <span>{t.products.card.flagBestSeller}</span>
                            <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                          </button>
                        )}
                        {product.outlet && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProductFlag(product.id, 'outlet', true);
                            }}
                            className="text-[10px] bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300 border border-rose-200 px-2 py-0.5 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.products.card.flagOutletTooltip}
                          >
                            <span>{t.products.card.flagOutlet}</span>
                            <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                          </button>
                        )}
                        {product.ultimas_pecas && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProductFlag(product.id, 'ultimas_pecas', true);
                            }}
                            className="text-[10px] bg-orange-50 text-orange-800 hover:bg-orange-100 hover:border-orange-300 border border-orange-200 px-2 py-0.5 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.products.card.flagLastPiecesTooltip}
                          >
                            <span>{t.products.card.flagLastPieces}</span>
                            <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                          </button>
                        )}
                        {reservedStockMap[product.id] > 0 && !isPausada && !isLixeira && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold uppercase animate-pulse flex items-center gap-1">
                            {t.products.card.flagInFittingRoom(reservedStockMap[product.id])}
                          </span>
                        )}
                        {(aviseMeSummary[product.id] || 0) > 0 && !isPausada && !isLixeira && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWaitlistProduct(product);
                              setIsWaitlistModalOpen(true);
                            }}
                            className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title={t.products.card.btnWaitlist(aviseMeSummary[product.id])}
                          >
                            <Bell className="w-3 h-3 text-purple-600" />
                            <span>{t.products.card.flagInWaitlist(aviseMeSummary[product.id])}</span>
                          </button>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate" title={product.nome}>
                        {product.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={`${t.products.card.slugLabel} ${product.slug}${product.tecido ? ` • ${t.products.card.fabricLabel} ${product.tecido}` : ''}`}>
                        {t.products.card.slugLabel} <span className="font-mono text-slate-700">{product.slug}</span>
                        {product.tecido && ` • ${t.products.card.fabricLabel} ${product.tecido}`}
                      </p>
                    </div>
                  </div>

                  {/* Nível 2: Régua Operacional (Métricas Financeiras + Botões de Ação) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
                    {/* Bloco de Métricas Financeiras e Estoque */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 sm:border-0 sm:bg-transparent sm:p-0 sm:flex sm:items-center sm:gap-4 md:gap-6 shrink-0">
                      <div className="w-auto sm:w-28 shrink-0 text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.products.card.salePrice}</span>
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

                      <div className="w-auto sm:w-28 shrink-0 text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.products.card.costCmv}</span>
                        <span className="text-xs font-semibold text-slate-700 block truncate">
                          {product.preco_custo ? formatCurrency(product.preco_custo) : formatCurrency(custo)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 font-mono block">
                          {t.products.card.marginPct(margemBruta.toFixed(0))}
                        </span>
                      </div>

                      <div className="w-auto sm:w-20 shrink-0 text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.products.card.stock}</span>
                        <span
                          className={`text-xs font-extrabold block truncate ${
                            product.estoque_total > 5
                              ? 'text-emerald-700'
                              : product.estoque_total > 0
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {product.estoque_total > 0 ? t.products.card.stockUnits(product.estoque_total) : t.products.card.outOfStockBadge}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    {isLixeira ? (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-start lg:justify-end">
                        <button
                          onClick={() => handleRestoreProduct(product)}
                          title={t.products.card.restoreTooltip}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.products.card.btnRestore}</span>
                        </button>

                        {isDono && (
                          <button
                            onClick={() => setPermanentDeleteModalProduct(product)}
                            title={t.products.card.deletePermanentTooltip}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.products.card.btnDeleteDefinitive}</span>
                          </button>
                        )}
                      </div>
                    ) : isArquivada ? (
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-start lg:justify-end">
                        <button
                          onClick={() => handleUnarchiveProduct(product)}
                          title={t.products.card.unarchiveTooltip}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          <span>{t.products.card.btnUnarchive}</span>
                        </button>

                        <button
                          onClick={() => handleRequestEdit(product)}
                          title={t.products.card.editFullTooltip}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{t.products.card.btnEdit}</span>
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(product)}
                          title={t.products.card.trashTooltip}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-start lg:justify-end">
                        {/* Ver na Vitrine Pública (se ativa) */}
                        <Link
                          href={`/catalogo?categoria=${encodeURIComponent(product.categoria_nome || 'all')}`}
                          target="_blank"
                          title={t.products.card.viewStorefrontTooltip}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Editar Cadastro Completo */}
                        <button
                          onClick={() => handleRequestEdit(product)}
                          title={isPausada ? t.products.card.editPausedTooltip : t.products.card.editFullTooltip}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{t.products.card.btnEdit}</span>
                        </button>

                        {/* Editar Preços Rápido (desabilitado se pausada) */}
                        <button
                          onClick={() => !isPausada && handleOpenEdit(product)}
                          disabled={isPausada}
                          title={isPausada ? t.products.card.editPricesDisabledTooltip : t.products.card.editPricesTooltip}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border shrink-0 ${
                            isPausada
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">{t.products.card.btnPrices}</span>
                        </button>

                        {/* Botão Provador / Reserva (30 min) (desabilitado se pausada) */}
                        <button
                          onClick={() => {
                            if (isPausada) return;
                            setSelectedFittingProduct(product);
                            setIsFittingModalOpen(true);
                          }}
                          disabled={isPausada}
                          title={isPausada ? t.products.card.fittingDisabledTooltip : t.products.card.fittingTooltip}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border shrink-0 ${
                            isPausada
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : (reservedStockMap[product.id] || 0) > 0
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold cursor-pointer'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">
                            {(reservedStockMap[product.id] || 0) > 0
                              ? t.products.card.flagInFittingRoom(reservedStockMap[product.id])
                              : t.products.card.btnFittingRoom}
                          </span>
                        </button>

                        {/* Fila de Espera */}
                        {(aviseMeSummary[product.id] || 0) > 0 && !isPausada && (
                          <button
                            onClick={() => {
                              setSelectedWaitlistProduct(product);
                              setIsWaitlistModalOpen(true);
                            }}
                            title={t.products.card.btnWaitlist(aviseMeSummary[product.id])}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 shadow-2xs shrink-0"
                          >
                            <Bell className="w-3.5 h-3.5 text-purple-600" />
                            <span className="hidden sm:inline">{t.products.card.btnWaitlist(aviseMeSummary[product.id])}</span>
                          </button>
                        )}

                        {/* Pausar / Ativar */}
                        <button
                          onClick={() => handleToggleActive(product)}
                          title={product.ativo ? t.products.card.pauseTooltip : t.products.card.activateTooltip}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                            product.ativo
                              ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                          }`}
                        >
                          {product.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{product.ativo ? t.products.card.btnPause : t.products.card.btnActivate}</span>
                        </button>

                        {/* Duplicar Peça */}
                        <button
                          onClick={() => handleDuplicateProduct(product)}
                          disabled={duplicatingId === product.id}
                          title={t.products.card.duplicateTooltip}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Copy className={`w-3.5 h-3.5 ${duplicatingId === product.id ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">{t.products.card.btnDuplicate}</span>
                        </button>

                        {/* Arquivar Peça */}
                        <button
                          onClick={() => handleArchiveProduct(product)}
                          title={t.products.card.unarchiveTooltip}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        {/* Excluir (Mover para Lixeira) */}
                        <button
                          onClick={() => handleOpenDeleteModal(product)}
                          title={t.products.card.trashTooltip}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Expandir Grade */}
                        <button
                          data-testid="btn-expand-product-grid"
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          title={isExpanded ? t.products.card.hideGridBtn : t.products.card.expandGridBtn(product.variacoes?.length || 0)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade de Variações Expandida */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        {t.products.matrix.title}
                      </span>
                    </div>

                    {product.variacoes && product.variacoes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
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
                                title="-1"
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
                                />
                              </div>
                              <button
                                onClick={() => handleQuickVariationStockChange(v.id, product.id, 1)}
                                disabled={updatingVarId === v.id}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
                                title="+1"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {t.products.matrix.subtitle}
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
        <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all duration-200 ${selectedProductIds.size > 0 ? 'mb-32' : 'mb-6'} w-full min-w-0 max-w-full`}>
          {/* Indicador de rolagem lateral para telas menores / zoom */}
          <div className="xl:hidden flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{locale === 'en' ? 'Scroll horizontally to view visibility & actions' : locale === 'es' ? 'Deslice horizontalmente para ver visibilidad y acciones' : 'Deslize horizontalmente para ver visibilidade e ações'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest shrink-0">← →</span>
          </div>

          <div className="overflow-x-auto table-scrollbar w-full">
            <table className="w-full min-w-[980px] text-left border-collapse text-xs">
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
                  <th className="p-3 w-14">{t.products.table.thPhoto}</th>
                  <th className="p-3 min-w-[200px]">{t.products.table.thProductSku}</th>
                  <th className="p-3 min-w-[100px]">{t.products.table.thSalePrice}</th>
                  <th className="p-3 min-w-[120px]">{t.products.table.thCostCmv} / {t.products.table.thMargin}</th>
                  <th className="p-3 min-w-[110px]">{t.products.table.thStock}</th>
                  <th className="p-3 min-w-[110px] text-center">{t.products.table.thVisibility}</th>
                  <th className="p-3 min-w-[160px] text-right">{t.products.table.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  const hasPromo = product.preco_promocional && product.preco_promocional > 0;
                  const custo = product.preco_custo || product.preco * 0.4;
                  const margemBruta = product.preco > 0 ? ((product.preco - custo) / product.preco) * 100 : 0;

                  const isPausada = !product.ativo && !product.lixeira && !product.arquivado;
                  const isLixeira = Boolean(product.lixeira);
                  const isArquivada = Boolean(product.arquivado);
                  const diasRestantesLixeira = product.expira_em
                    ? Math.max(0, Math.ceil((new Date(product.expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 30;

                  const rowClass = isSelected
                    ? 'bg-amber-50/50'
                    : isLixeira
                    ? 'bg-rose-50/90 text-rose-950 border-l-4 border-rose-600'
                    : isPausada
                    ? 'bg-rose-50/70 dark:bg-rose-950/25 text-rose-950 border-l-4 border-rose-500'
                    : isArquivada
                    ? 'bg-slate-50/70 opacity-75'
                    : 'hover:bg-slate-50/80';

                  return (
                    <tr key={product.id} className={`transition-colors ${rowClass}`}>
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
                            onClick={() => handleRequestEdit(product)}
                            title={isPausada ? t.products.card.editPausedTooltip : t.products.card.editFullTooltip}
                          >
                            {product.nome}
                          </span>
                          {isPausada && (
                            <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black uppercase">
                              {t.products.lifecycle.paused}
                            </span>
                          )}
                          {isLixeira && (
                            <span className="text-[9px] bg-rose-700 text-white px-1.5 py-0.2 rounded font-black uppercase">
                              {t.products.card.badgeTrash(diasRestantesLixeira)}
                            </span>
                          )}
                          {isArquivada && (
                            <span className="text-[9px] bg-slate-700 text-white px-1.5 py-0.2 rounded font-black uppercase">
                              {t.products.lifecycle.archived}
                            </span>
                          )}
                          {product.destaque && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProductFlag(product.id, 'destaque', true);
                              }}
                              className="text-[9px] bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 border border-amber-300 px-1.5 py-0.2 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title={t.products.card.flagFeaturedTooltip}
                            >
                              <span>{t.products.card.flagFeatured}</span>
                              <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                            </button>
                          )}
                          {product.mais_vendido && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProductFlag(product.id, 'mais_vendido', true);
                              }}
                              className="text-[9px] bg-purple-50 text-purple-800 hover:bg-purple-100 hover:border-purple-300 border border-purple-200 px-1.5 py-0.2 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title={t.products.card.flagBestSellerTooltip}
                            >
                              <span>{t.products.card.flagBestSeller}</span>
                              <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                            </button>
                          )}
                          {product.outlet && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProductFlag(product.id, 'outlet', true);
                              }}
                              className="text-[9px] bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300 border border-rose-200 px-1.5 py-0.2 rounded font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title={t.products.card.flagOutletTooltip}
                            >
                              <span>{t.products.card.flagOutlet}</span>
                              <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                            </button>
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
                          {t.products.card.marginPct(margemBruta.toFixed(1))}
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
                            {t.products.card.stockUnits(product.estoque_total)}
                          </span>
                          {product.variacoes && product.variacoes.length > 0 && (
                            <span className="text-[10px] text-slate-400" title={`${product.variacoes.length} variações`}>
                              ({product.variacoes.length} vars)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status com Toggle Direto */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {isLixeira ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Trash2 className="w-3 h-3" /> {t.products.card.badgeTrash(diasRestantesLixeira)}
                          </span>
                        ) : isArquivada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                            <Archive className="w-3 h-3" /> {t.products.lifecycle.archived}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              product.ativo
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                            title={product.ativo ? t.products.card.pauseTooltip : t.products.card.activateTooltip}
                          >
                            {product.ativo ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-600" />
                                <span>{t.products.lifecycle.active}</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-rose-600" />
                                <span>{t.products.lifecycle.paused}</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isLixeira ? (
                            <>
                              <button
                                onClick={() => handleRestoreProduct(product)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title={t.products.card.restoreTooltip}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              {isDono && (
                                <button
                                  onClick={() => setPermanentDeleteModalProduct(product)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={t.products.card.deletePermanentTooltip}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : isArquivada ? (
                            <>
                              <button
                                onClick={() => handleUnarchiveProduct(product)}
                                className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title={t.products.card.unarchiveTooltip}
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRequestEdit(product)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={t.products.card.editFullTooltip}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title={t.products.card.trashTooltip}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => !isPausada && handleOpenEdit(product)}
                                disabled={isPausada}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isPausada
                                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                                }`}
                                title={isPausada ? t.products.card.editPricesDisabledTooltip : t.products.card.editPricesTooltip}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRequestEdit(product)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-800 transition-colors cursor-pointer"
                                title={isPausada ? t.products.card.editPausedTooltip : t.products.card.editFullTooltip}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDuplicateProduct(product)}
                                disabled={duplicatingId === product.id}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                                title={t.products.card.duplicateTooltip}
                              >
                                <Copy className={`w-3.5 h-3.5 ${duplicatingId === product.id ? 'animate-spin' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleArchiveProduct(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                                title={t.products.card.unarchiveTooltip}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenDeleteModal(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title={t.products.card.trashTooltip}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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
              label: t.products.kanbanCatalog.colActive,
              filter: (p: AdminProductItem) => p.ativo,
              color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900',
              badgeColor: 'bg-emerald-100 text-emerald-800'
            },
            {
              id: 'pausadas',
              label: t.products.kanbanCatalog.colPaused,
              filter: (p: AdminProductItem) => !p.ativo,
              color: 'border-amber-400 bg-amber-50/40 text-amber-900',
              badgeColor: 'bg-amber-100 text-amber-800'
            },
            {
              id: 'criticas',
              label: t.products.kanbanCatalog.colCritical,
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
                      {formatCurrency(colValor)} {t.products.kpis.inStockLabel}
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
                      {t.products.kanbanCatalog.emptyCol}
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
                              {t.products.card.stockUnits(product.estoque_total)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleActive(product)}
                                className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title={product.ativo ? t.products.card.pauseTooltip : t.products.card.activateTooltip}
                              >
                                {product.ativo ? t.products.card.btnPause : t.products.card.btnActivate}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={t.products.card.editPricesTooltip}
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
        <ProductFullFormModal
          isOpen={isCreateModalOpen}
          mode="create"
          categoriesList={categoriesList}
          allProducts={products}
          storeAttributes={storeAttributes}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          onClose={() => setIsCreateModalOpen(false)}
          onSaved={handleProductSavedFromFullModal}
          onToast={showToast}
          onCategoriesUpdated={(updated) => setCategoriesList(updated)}
          onStoreAttributesUpdated={(updated) => setStoreAttributes(updated)}
        />
      )}

      {/* MODAL DE EDIÇÃO RÁPIDA DE PREÇO E ESTOQUE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                {t.products.quickPriceModal.title}
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
                <label className="block text-slate-700 mb-1 font-bold">{t.products.quickPriceModal.salePriceLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">{t.products.quickPriceModal.promoPriceLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t.products.quickPriceModal.promoPlaceholder}
                  value={editPromoPrice}
                  onChange={(e) => setEditPromoPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">{t.products.quickPriceModal.costPriceLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t.products.quickPriceModal.costPlaceholder}
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">{t.products.quickPriceModal.totalStockLabel}</label>
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
                  {t.products.quickPriceModal.flagsSectionTitle}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDestaque}
                      onChange={(e) => setEditDestaque(e.target.checked)}
                      className="accent-amber-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">{t.products.quickPriceModal.flagFeaturedLabel}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editMaisVendido}
                      onChange={(e) => setEditMaisVendido(e.target.checked)}
                      className="accent-purple-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">{t.products.quickPriceModal.flagBestSellerLabel}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editOutlet}
                      onChange={(e) => setEditOutlet(e.target.checked)}
                      className="accent-rose-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">{t.products.quickPriceModal.flagOutletLabel}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUltimasPecas}
                      onChange={(e) => setEditUltimasPecas(e.target.checked)}
                      className="accent-orange-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">{t.products.quickPriceModal.flagLastPiecesLabel}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t.products.quickPriceModal.cancelBtn}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
              >
                {isSaving ? t.products.quickPriceModal.savingBtn : t.products.quickPriceModal.saveBtn}
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
              {t.products.bulkActions.selectedCount(selectedProductIds.size)}
            </span>
          </div>

          {lifecycleTab === 'lixeira' ? (
            <>
              <button
                onClick={handleBulkRestoreAction}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.products.bulkActions.btnRestore}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleBulkToggle(true)}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.products.bulkActions.btnActivate}</span>
              </button>

              <button
                onClick={() => handleBulkToggle(false)}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{t.products.bulkActions.btnPause}</span>
              </button>

              <button
                onClick={() => setShowBulkDiscountModal(true)}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{t.products.bulkActions.btnDiscount}</span>
              </button>

              <button
                onClick={() => setShowBulkCategoryModal(true)}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.products.bulkActions.btnChangeCategory}</span>
              </button>

              <button
                onClick={handleBulkArchiveAction}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Archive className="w-3.5 h-3.5 text-slate-300" />
                <span>{t.products.bulkActions.btnArchive}</span>
              </button>

              <button
                onClick={handleBulkMoveToTrashAction}
                disabled={isBulkActionRunning}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.products.bulkActions.btnTrash}</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

              <button
                onClick={() => handleBulkPromotionalFlagAction('destaque', true)}
                disabled={isBulkActionRunning}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="🌟"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.products.bulkActions.btnAddFeatured}</span>
              </button>

              <button
                onClick={() => handleBulkPromotionalFlagAction('mais_vendido', true)}
                disabled={isBulkActionRunning}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="🔥"
              >
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.products.bulkActions.btnAddBestSeller}</span>
              </button>

              <button
                onClick={() => handleBulkPromotionalFlagAction('outlet', true)}
                disabled={isBulkActionRunning}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="🏷️"
              >
                <Tag className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.products.bulkActions.btnAddOutlet}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setSelectedProductIds(new Set())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1 shrink-0"
            title="Esc"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.products.bulkActions.btnClearSelection}</span>
          </button>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: EDIÇÃO DE PEÇA PAUSADA */}
      {pausedConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
              {t.products.confirmModals.pausedModalTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {t.products.confirmModals.pausedModalDesc(pausedConfirmProduct.nome)}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPausedConfirmProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                {t.products.confirmModals.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmEditPaused}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                {t.products.confirmModals.continuePausedBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO DEFINITIVA (HARD DELETE NA LIXEIRA) */}
      {permanentDeleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
              {t.products.confirmModals.permanentDeleteTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {t.products.confirmModals.permanentDeleteDesc(permanentDeleteModalProduct.nome)}
            </p>
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
              {t.products.confirmModals.permanentDeleteWarning}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPermanentDeleteModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                {t.products.confirmModals.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handlePermanentDelete(permanentDeleteModalProduct)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                {t.products.confirmModals.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUAL DE ENVIO PARA A LIXEIRA (30 DIAS DE RETENÇÃO) */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                  {t.products.confirmModals.moveToTrashTitle}
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
                    {t.products.card.noPhoto}
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
                  {t.products.card.stock}: <strong>{t.products.card.stockUnits(deleteModalProduct.estoque_total)}</strong> • {t.products.card.salePrice}: <strong>{formatCurrency(deleteModalProduct.preco)}</strong>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t.products.confirmModals.moveToTrashRetention}</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {t.products.confirmModals.moveToTrashDesc}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalProduct(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.products.confirmModals.cancelBtn}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
              >
                {isDeletingProduct ? t.products.confirmModals.moveToTrashMovingBtn : t.products.confirmModals.moveToTrashBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETA DA PEÇA (DOSSIÊ INTEGRAL) */}
      {editingFullProduct && (
        <ProductFullFormModal
          isOpen={Boolean(editingFullProduct)}
          mode="edit"
          product={editingFullProduct}
          categoriesList={categoriesList}
          allProducts={products}
          storeAttributes={storeAttributes}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          onClose={() => setEditingFullProduct(null)}
          onSaved={handleProductSavedFromFullModal}
          onToast={showToast}
          onCategoriesUpdated={(updated) => setCategoriesList(updated)}
          onStoreAttributesUpdated={(updated) => setStoreAttributes(updated)}
        />
      )}

      {/* MINI MODAL: DESCONTO EM MASSA */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
              {t.products.bulkActions.discountModalTitle(selectedProductIds.size)}
            </h4>
            <div>
              <label className="block text-slate-700 text-xs mb-1 font-semibold">
                {t.products.bulkActions.discountInputLabel}
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={bulkDiscountValue}
                onChange={(e) => setBulkDiscountValue(e.target.value)}
                placeholder={t.products.bulkActions.discountPlaceholder}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-center text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkDiscountModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t.products.bulkActions.cancelBtn}
              </button>
              <button
                onClick={handleBulkApplyDiscountAction}
                disabled={isBulkActionRunning}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                {isBulkActionRunning ? t.products.confirmModals.deletingBtn : t.products.bulkActions.applyDiscountBtn}
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
              {t.products.bulkActions.categoryModalTitle(selectedProductIds.size)}
            </h4>
            <div>
              <label className="block text-slate-700 text-xs mb-1 font-semibold">
                {t.products.bulkActions.selectCategoryLabel}
              </label>
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold text-xs"
              >
                <option value="">{t.products.bulkActions.selectCategoryLabel}</option>
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
                {t.products.bulkActions.cancelBtn}
              </button>
              <button
                onClick={handleBulkUpdateCategoryAction}
                disabled={isBulkActionRunning || !bulkCategoryTarget}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 cursor-pointer"
              >
                {isBulkActionRunning ? t.products.confirmModals.deletingBtn : t.products.bulkActions.applyCategoryBtn}
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
        tenantSlug={tenantSlug}
        categoriesList={categoriesList}
        existingProducts={products}
        onSuccess={() => {
          setIsBatchImportOpen(false);
          fetchProductsData();
        }}
      />

      {/* MODAL DE GERENCIAMENTO GLOBAL DE SINALIZADORES (BADGES) */}
      {isSinalizadoresModalOpen && (
        <AdminSinalizadoresModal
          isOpen={isSinalizadoresModalOpen}
          onClose={() => setIsSinalizadoresModalOpen(false)}
          tenantId={tenantId}
          initialSinalizadores={storeAttributes?.sinalizadores || []}
          onUpdated={(updatedList) => {
            setStoreAttributes((prev) => ({ ...prev, sinalizadores: updatedList }));
            fetchProductsData();
            showToast('Sinalizadores comerciais da loja atualizados com sucesso!');
          }}
          onToast={showToast}
        />
      )}

      {/* MODAL DE GESTÃO DE VITRINES, DESTAQUES E COLEÇÕES */}
      {isCollectionsModalOpen && (
        <AdminCollectionsManagerModal
          isOpen={isCollectionsModalOpen}
          onClose={() => setIsCollectionsModalOpen(false)}
          products={products}
          categoriesList={categoriesList}
          onUpdated={() => {
            fetchProductsData();
            showToast('Vitrines e coleções atualizadas com sucesso!');
          }}
          onToast={showToast}
        />
      )}
    </div>
  );
}
