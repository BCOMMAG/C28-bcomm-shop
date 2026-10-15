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
  ArrowRight
} from 'lucide-react';
import {
  getAdminProducts,
  toggleAdminProductActive,
  updateAdminProductDetails,
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  AdminProductItem,
  CreateProductInput
} from '@/lib/admin';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { PRODUCTS } from '@/data/products';

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; nome: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
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
  const [isSaving, setIsSaving] = useState(false);

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
        getAdminProducts(DEFAULT_TENANT_ID),
        getAdminCategories(DEFAULT_TENANT_ID)
      ]);

      setCategoriesList(catsData || []);

      if (prodsData && prodsData.length > 0) {
        setProducts(prodsData);
      } else {
        // Fallback: Mapeia os 16 produtos oficiais da Leidy Boutique para exibição rica
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
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
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

  // Excluir Peça (Soft-Delete)
  const handleDeleteProduct = async (product: AdminProductItem) => {
    if (!confirm(`Deseja realmente arquivar a peça "${product.nome}"? O histórico de pedidos será preservado.`)) {
      return;
    }

    const res = await deleteAdminProduct(product.id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Peça "${product.nome}" arquivada com sucesso!`);
    } else {
      showToast(res.error || 'Erro ao excluir produto.', 'error');
    }
  };

  // Abrir modal de edição rápida
  const handleOpenEdit = (product: AdminProductItem) => {
    setEditingProduct(product);
    setEditPrice(product.preco);
    setEditPromoPrice(product.preco_promocional ? String(product.preco_promocional) : '');
    setEditCostPrice(product.preco_custo ? String(product.preco_custo) : '');
    setEditStock(product.estoque_total);
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
      costVal
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
                estoque_total: Number(editStock)
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
      const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'produtos');
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
      const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'videos');
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

      const res = await createAdminProduct(payload, DEFAULT_TENANT_ID);
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

  // Filtro de Busca
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todas' && p.categoria_nome !== selectedCategory) {
      return false;
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

        <div className="flex items-center gap-2.5">
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
                  <div className="flex items-center gap-4">
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          {product.categoria_nome}
                        </span>
                        {!product.ativo && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase">
                            Pausada
                          </span>
                        )}
                        {product.destaque && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                            Lançamento
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
                    <div className="flex items-center gap-1.5">
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

                      {/* Editar Rápido */}
                      <button
                        onClick={() => handleOpenEdit(product)}
                        title="Editar Preço e Estoque"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preços</span>
                      </button>

                      {/* Excluir (Soft-Delete) */}
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        title="Arquivar peça"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                            <span
                              className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                                v.estoque > 2
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : v.estoque > 0
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {v.estoque} un
                            </span>
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
