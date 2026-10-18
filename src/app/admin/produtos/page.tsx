'use client';

import React, { useState, useEffect } from 'react';
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
  Scissors
} from 'lucide-react';
import {
  getAdminProducts,
  toggleAdminProductActive,
  updateAdminProductDetails,
  updateAdminVariationStock,
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  checkProductOrdersCount,
  updateAdminProductFull,
  bulkToggleProductActive,
  bulkApplyDiscount,
  bulkUpdateCategory,
  bulkArchiveProducts,
  AdminProductItem,
  CreateProductInput,
  UpdateProductInput
} from '@/lib/admin';
import { uploadBrowserFileToR2, deleteFromR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { PRODUCTS } from '@/data/products';
import { useStore } from '@/context/StoreContext';

export default function AdminProdutosPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';

  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; nome: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [stockFilter, setStockFilter] = useState<
    'todos' | 'criticos' | 'esgotados' | 'ativos' | 'pausados' | 'destaques' | 'outlet' | 'mais_vendidos' | 'ultimas_pecas'
  >('todos');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal de Criação de Produto
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Estado do formulário de novo produto
  const [newProductName, setNewProductName] = useState('');
  const [newProductSlug, setNewProductSlug] = useState('');
  const [newProductCatId, setNewProductCatId] = useState('');
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
  const [editFullDesc, setEditFullDesc] = useState('');
  const [editFullFabric, setEditFullFabric] = useState('');
  const [editFullModeling, setEditFullModeling] = useState('');
  const [editFullCollection, setEditFullCollection] = useState('');
  const [editFullPairedSlug, setEditFullPairedSlug] = useState('');
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
      const [prodsData, catsData] = await Promise.all([
        getAdminProducts(tenantId),
        getAdminCategories(tenantId)
      ]);

      setCategoriesList(catsData || []);

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
    setEditFullDesc(product.descricao || '');
    setEditFullFabric(product.tecido || '');
    setEditFullModeling(product.modelagem || '');
    setEditFullCollection(product.linha || '');
    setEditFullPairedSlug(product.paired_with_slug || '');
    setEditFullDetails(Array.isArray(product.detalhes) ? product.detalhes.join('\n') : '');
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
      label: m.label || (idx === 0 ? 'Capa Principal' : `Foto ${idx + 1}`),
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

      const detailsArray = editFullDetails
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      // Reordena fotos com base no coverIndex
      const orderedFotos = [...editFullFotos];
      if (editFullCoverIndex > 0 && editFullCoverIndex < orderedFotos.length) {
        const [coverItem] = orderedFotos.splice(editFullCoverIndex, 1);
        orderedFotos.unshift(coverItem);
      }

      const payload: UpdateProductInput = {
        id: editingFullProduct.id,
        loja_id: tenantId,
        nome: editFullName.trim(),
        slug: editFullSlug.trim().toLowerCase() || editingFullProduct.slug,
        categoria_id: editFullCatId || null,
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
        paired_with_slug: editFullPairedSlug || null,
        detalhes: detailsArray.length > 0 ? detailsArray : null,
        foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : editingFullProduct.foto_principal,
        fotos: orderedFotos,
        video_provador_url: editFullVideoProvador.trim() || null,
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
              paired_with_slug: editFullPairedSlug || null,
              detalhes: detailsArray,
              foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : p.foto_principal,
              midias: orderedFotos.map((f, i) => ({
                id: f.id || `m_${i}`,
                url: f.url,
                tipo: f.tipo || 'image',
                display_order: i,
                label: i === 0 ? 'Capa Principal' : `Foto ${i + 1}`
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

  // Upload de Foto na Edição Completa para o Cloudflare R2
  const handleUploadEditPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditPhoto(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'produtos');
      if (res.success && res.url) {
        setEditFullFotos((prev) => [
          ...prev,
          {
            id: `r2_${Date.now()}`,
            url: res.url,
            tipo: 'image',
            label: `Foto ${prev.length + 1}`,
            display_order: prev.length
          }
        ]);
        showToast('Foto enviada com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Erro ao enviar foto para o R2.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha no upload da foto.', 'error');
    } finally {
      setUploadingEditPhoto(false);
      e.target.value = '';
    }
  };

  // Excluir Foto na Edição Completa
  const handleDeleteEditPhoto = async (index: number) => {
    const photo = editFullFotos[index];
    if (!photo) return;

    // Tenta remover do Cloudflare R2 em background
    if (photo.url && photo.url.includes('.r2.dev')) {
      deleteFromR2(photo.url).catch(console.warn);
    }

    setEditFullFotos((prev) => prev.filter((_, idx) => idx !== index));
    if (editFullCoverIndex === index) {
      setEditFullCoverIndex(0);
    } else if (editFullCoverIndex > index) {
      setEditFullCoverIndex((prev) => prev - 1);
    }
    showToast('Foto removida da galeria.');
  };

  // Adicionar Variação na Grade da Edição Completa
  const handleAddVariationInFullEdit = () => {
    if (!newVarColorName.trim() || !newVarSize.trim()) {
      showToast('Informe o nome da cor e o tamanho da nova variação.', 'error');
      return;
    }

    const est = parseInt(newVarStock) || 0;
    const generatedSku = newVarSku.trim() || `${editFullSlug || 'peca'}-${newVarColorName.trim()}-${newVarSize.trim()}`.toUpperCase();

    setEditFullVariacoes((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        cor_nome: newVarColorName.trim(),
        cor_hex: newVarColorHex,
        tamanho: newVarSize.trim(),
        estoque: est,
        sku: generatedSku
      }
    ]);

    setNewVarStock('5');
    setNewVarSku('');
    showToast(`Variação ${newVarColorName} (${newVarSize}) adicionada à grade!`);
  };

  // Remover Variação na Grade da Edição Completa
  const handleRemoveVariationInFullEdit = (index: number) => {
    setEditFullVariacoes((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Variação removida da grade.');
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
      showToast('Erro ao exportar planilha do catálogo.', 'error');
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
        showToast(`Estoque de ${variation.tamanho} (${variation.cor_nome}) atualizado para ${novoEstoque} un!`);
      } else {
        showToast(res.error || 'Erro ao atualizar estoque da variação.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar estoque.', 'error');
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

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Catálogo de Peças de Luxo
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Cloudflare R2 Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre peças novas com fotos e vídeos de provador no R2, controle grade de cor e tamanho e acompanhe a margem de lucro real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCatalogCSV}
            title="Exportar planilha completa do catálogo com estoque e CMV"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={fetchProductsData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Peça</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DO CATÁLOGO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total de Peças</span>
          <span className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1 block">
            {products.length}
          </span>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Ativas na Vitrine</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-serif-luxury mt-1 block">
            {totalAtivos}
          </span>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Pausadas</span>
          <span className="text-2xl font-extrabold text-amber-800 font-serif-luxury mt-1 block">
            {totalPausados}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Estoque em Grade</span>
          <span className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1 block">
            {estoqueTotalPecas} un
          </span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar peça por nome, categoria ou referência..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesFilter.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-amber-400 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'todas' ? 'Todas as Coleções' : cat}
            </button>
          ))}
        </div>

        {/* Abas de Estoque & Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status / Grade:
          </span>
          {[
            { id: 'todos', label: 'Todas as Peças' },
            { id: 'criticos', label: '⚠️ Reposição Urgente (≤ 2 un)' },
            { id: 'destaques', label: '🌟 Destaques' },
            { id: 'mais_vendidos', label: '🔥 Mais Vendidos' },
            { id: 'outlet', label: '🏷️ Outlet' },
            { id: 'ultimas_pecas', label: '⏳ Últimas Peças' },
            { id: 'esgotados', label: '⛔ Esgotados' },
            { id: 'ativos', label: '✅ Ativas na Vitrine' },
            { id: 'pausados', label: '⏸️ Pausadas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockFilter === tab.id
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE PRODUTOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Carregando catálogo de peças...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Nenhuma peça encontrada</p>
          <p className="text-xs">Tente ajustar o termo digitado ou a coleção selecionada.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-amber-400 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm mx-auto inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Nova Peça</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de Seleção em Massa */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
              <input
                type="checkbox"
                checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                onChange={() => handleSelectAllFiltered(filteredProducts.map((p) => p.id))}
                className="accent-amber-600 rounded cursor-pointer"
              />
              <span>
                {selectedProductIds.size === 0
                  ? `Selecionar todas as ${filteredProducts.length} peças filtradas`
                  : `${selectedProductIds.size} de ${filteredProducts.length} peças selecionadas para ação em lote`}
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

          {filteredProducts.map((product) => {
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
                        title="Editar Cadastro Completo: Fotos R2, Descrição, Grade e Estilo"
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
                              <span
                                className={`text-xs font-extrabold px-1.5 py-0.5 rounded min-w-[28px] text-center ${
                                  v.estoque > 2
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : v.estoque > 0
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                {v.estoque}
                              </span>
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
                      onChange={(e) => setNewProductCatId(e.target.value)}
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

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA */}
      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in flex-wrap max-w-[95vw]">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              {selectedProductIds.size}
            </span>
            <span className="text-xs font-semibold hidden sm:inline">peças selecionadas</span>
          </div>

          <button
            onClick={() => handleBulkToggle(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ativar</span>
          </button>

          <button
            onClick={() => handleBulkToggle(false)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Pausar</span>
          </button>

          <button
            onClick={() => setShowBulkDiscountModal(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>% Desconto</span>
          </button>

          <button
            onClick={() => setShowBulkCategoryModal(true)}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mover Categoria</span>
          </button>

          <button
            onClick={handleBulkArchiveAction}
            disabled={isBulkActionRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Arquivar</span>
          </button>

          <button
            onClick={() => setSelectedProductIds(new Set())}
            className="text-xs text-slate-400 hover:text-white underline pl-2 cursor-pointer"
          >
            Cancelar
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
      {editingFullProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-fade-in overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                    Edição Completa da Peça
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingFullProduct.nome} • Slug: <span className="font-mono">{editingFullProduct.slug}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingFullProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
              {[
                { id: 'geral', label: '1. Dados Gerais & Estilo', icon: FileText },
                { id: 'midias', label: '2. Galeria R2 & Reels 9:16', icon: Video },
                { id: 'grade', label: '3. Grade de Cores & Tamanhos', icon: Layers },
                { id: 'comercial', label: '4. Preços, CMV & Cross-Sell', icon: DollarSign }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeEditTab === tab.id;
                return (
                  <button
                    key={tab.id}
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

            {/* Corpo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* ABA 1: DADOS GERAIS */}
              {activeEditTab === 'geral' && (
                <div className="space-y-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Categoria</label>
                      <select
                        value={editFullCatId}
                        onChange={(e) => setEditFullCatId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
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
                      <label className="block text-slate-700 mb-1 font-bold">Tecido / Composição</label>
                      <input
                        type="text"
                        value={editFullFabric}
                        onChange={(e) => setEditFullFabric(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                        placeholder="Ex: Crepe Alfaiataria / Tricot"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Modelagem / Caimento</label>
                      <input
                        type="text"
                        value={editFullModeling}
                        onChange={(e) => setEditFullModeling(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                        placeholder="Ex: Alfaiataria Estruturada / Fluida"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Linha / Coleção</label>
                    <input
                      type="text"
                      value={editFullCollection}
                      onChange={(e) => setEditFullCollection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                      placeholder="Ex: Trabalho & Alfaiataria / Festa & Noite"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Descrição Comercial da Peça</label>
                    <textarea
                      rows={3}
                      value={editFullDesc}
                      onChange={(e) => setEditFullDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                      placeholder="Descreva a elegância, o caimento e as ocasiões de uso da peça..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">
                      Detalhes, Tabela de Medidas & Cuidados (1 por linha)
                    </label>
                    <textarea
                      rows={3}
                      value={editFullDetails}
                      onChange={(e) => setEditFullDetails(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-[11px] focus:bg-white"
                      placeholder="Modelo veste tamanho P (altura 1,72m)&#10;Composição: 97% Crepe Premium, 3% Elastano&#10;Lavagem delicada à mão para proteger o tecido"
                    />
                  </div>
                </div>
              )}

              {/* ABA 2: MÍDIAS & R2 */}
              {activeEditTab === 'midias' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Galeria de Fotos da Peça</h4>
                      <p className="text-[11px] text-slate-500">
                        Defina a capa principal da vitrine ou envie novas fotos diretamente para o Cloudflare R2 da loja.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer text-xs transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingEditPhoto ? 'Enviando...' : 'Adicionar Foto no R2'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingEditPhoto}
                        onChange={handleUploadEditPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Grid de Fotos */}
                  {editFullFotos.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                      Nenhuma foto cadastrada. Faça upload de imagens no Cloudflare R2 acima.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {editFullFotos.map((foto, idx) => {
                        const isCover = editFullCoverIndex === idx;
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl border-2 overflow-hidden bg-slate-100 group transition-all shadow-2xs ${
                              isCover ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200'
                            }`}
                          >
                            <div className="relative aspect-3/4 w-full">
                              <Image
                                src={foto.url}
                                alt={`Foto ${idx + 1}`}
                                fill
                                sizes="160px"
                                className="object-cover"
                              />
                            </div>

                            {/* Badge Capa */}
                            {isCover && (
                              <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                                Capa Principal
                              </span>
                            )}

                            {/* Ações da Foto */}
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => setEditFullCoverIndex(idx)}
                                  className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-colors"
                                >
                                  Tornar Capa
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteEditPhoto(idx)}
                                className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded cursor-pointer transition-colors flex items-center justify-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vídeo de Provador Vertical (9:16) */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-slate-700 font-bold">
                      Vídeo de Provador Virtual (Reels / 9:16)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Cole a URL do vídeo vertical (.mp4) hospedado no Cloudflare R2 ou na vitrine para exibição interativa.
                    </p>
                    <input
                      type="text"
                      value={editFullVideoProvador}
                      onChange={(e) => setEditFullVideoProvador(e.target.value)}
                      placeholder="Ex: /video/header_video.mp4 ou URL R2"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* ABA 3: GRADE DE CORES & TAMANHOS */}
              {activeEditTab === 'grade' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Variações de Grade Ativas</h4>
                      <p className="text-[11px] text-slate-500">
                        Adicione novas cores e tamanhos ou remova variações que não são mais fabricadas.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                      Total: {editFullVariacoes.reduce((acc, v) => acc + Number(v.estoque || 0), 0)} unidades
                    </span>
                  </div>

                  {/* Lista de Variações Existentes */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {editFullVariacoes.map((v, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
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
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditFullVariacoes((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, estoque: val } : item))
                                );
                              }}
                              className="w-16 bg-slate-50 border border-slate-300 rounded p-1 text-center font-bold text-slate-900 text-xs"
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
                    ))}
                  </div>

                  {/* Formulário para Adicionar Nova Variação */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      Adicionar Nova Variação à Grade
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Nome da Cor</label>
                        <input
                          type="text"
                          value={newVarColorName}
                          onChange={(e) => setNewVarColorName(e.target.value)}
                          placeholder="Ex: Areia Nobre"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Hex da Cor</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newVarColorHex}
                            onChange={(e) => setNewVarColorHex(e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={newVarColorHex}
                            onChange={(e) => setNewVarColorHex(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Tamanho</label>
                        <select
                          value={newVarSize}
                          onChange={(e) => setNewVarSize(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                        >
                          {['PP', 'P', 'M', 'G', 'GG', 'Tamanho Único', '36', '38', '40', '42', '44'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Estoque Inicial</label>
                        <input
                          type="number"
                          min="0"
                          value={newVarStock}
                          onChange={(e) => setNewVarStock(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold text-center"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddVariationInFullEdit}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: PREÇOS, CMV & CROSS-SELL */}
              {activeEditTab === 'comercial' && (
                <div className="space-y-4">
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

                  {/* Cross-Sell / Monte o Look */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      👠 "Monte o Look" / Peça Combinada (Cross-Sell)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Selecione uma peça complementar que combina perfeitamente com esta para sugerir na vitrine e elevar o Ticket Médio:
                    </p>
                    <select
                      value={editFullPairedSlug}
                      onChange={(e) => setEditFullPairedSlug(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="">Sem sugestão de look combinado</option>
                      {products
                        .filter((p) => p.id !== editingFullProduct.id)
                        .map((p) => (
                          <option key={p.id} value={p.slug}>
                            {p.nome} ({formatCurrency(p.preco)})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Tags Comerciais */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Sinalizadores Comerciais na Vitrine:
                    </span>
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
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal com Ações */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                As alterações serão refletidas instantaneamente na vitrine pública.
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
        </div>
      )}

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
    </div>
  );
}
