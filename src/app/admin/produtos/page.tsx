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
  Palette
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
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal de Confirmação de Exclusão
  const [deletingProduct, setDeletingProduct] = useState<AdminProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getAdminProducts(DEFAULT_TENANT_ID),
        getAdminCategories(DEFAULT_TENANT_ID)
      ]);
      setProducts(prods);
      setCategoriesList(cats);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
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

  // Alternar ativação (pausar/ativar)
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

  // Abrir modal de edição rápida
  const handleOpenEdit = (product: AdminProductItem) => {
    setEditingProduct(product);
    setEditPrice(product.preco);
    setEditPromoPrice(product.preco_promocional ? String(product.preco_promocional) : '');
    setEditCostPrice(product.preco_custo ? String(product.preco_custo) : '');
    setEditStock(product.estoque_total);
  };

  // Salvar Edição
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSavingEdit(true);

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
    setIsSavingEdit(false);
  };

  // Excluir produto com confirmação
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    const res = await deleteAdminProduct(deletingProduct.id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showToast(`Peça "${deletingProduct.nome}" excluída/arquivada com sucesso!`);
      setDeletingProduct(null);
    } else {
      showToast(res.error || 'Erro ao excluir produto.', 'error');
    }
    setIsDeleting(false);
  };

  // Upload de fotos direto no Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'produtos');
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else {
          showToast(`Erro ao subir ${file.name}: ${res.error || 'Falha no R2'}`, 'error');
        }
      }

      if (uploadedUrls.length > 0) {
        setUploadedPhotos((prev) => [...prev, ...uploadedUrls]);
        showToast(`${uploadedUrls.length} foto(s) enviada(s) com sucesso para o Cloudflare R2!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha no envio de fotos para o R2', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload de vídeo de provador (9:16) no Cloudflare R2
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'produtos');
      if (res.success && res.url) {
        setUploadedVideoUrl(res.url);
        showToast('Vídeo de provador enviado com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Falha ao enviar vídeo para o R2', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha no envio do vídeo', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Adicionar linha de variação na grade
  const handleAddVariation = () => {
    setGridVariations((prev) => [
      ...prev,
      { cor_nome: 'Nova Cor', cor_hex: '#C5A059', tamanho: 'M', estoque: 2 }
    ]);
  };

  // Remover linha de variação
  const handleRemoveVariation = (idx: number) => {
    setGridVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  // Atualizar variação na grade
  const handleUpdateVariation = (
    idx: number,
    field: 'cor_nome' | 'cor_hex' | 'tamanho' | 'estoque',
    value: any
  ) => {
    setGridVariations((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  // Salvar novo produto completo no Supabase
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      showToast('O nome da peça é obrigatório.', 'error');
      return;
    }
    if (!newProductPrice || Number(newProductPrice) <= 0) {
      showToast('Informe um preço de venda válido.', 'error');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const totalStockCalc = newProductHasGrid
        ? gridVariations.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0)
        : Number(newProductStockSimple || 0);

      const coverPhoto =
        uploadedPhotos.length > 0
          ? uploadedPhotos[coverPhotoIndex] || uploadedPhotos[0]
          : '/images/products/vestido-longo-preto-costas-nude.webp';

      const payload: CreateProductInput = {
        nome: newProductName.trim(),
        slug: newProductSlug.trim() || undefined,
        categoria_id: newProductCatId || null,
        nova_categoria_nome: newCustomCatName.trim() || undefined,
        descricao: newProductDesc.trim() || undefined,
        preco: Number(newProductPrice),
        preco_promocional: newProductPromoPrice.trim() ? Number(newProductPromoPrice) : null,
        preco_custo: newProductCostPrice.trim() ? Number(newProductCostPrice) : null,
        tecido: newProductFabric.trim() || undefined,
        modelagem: newProductModeling.trim() || undefined,
        linha: newProductCollection.trim() || undefined,
        destaque: newIsLaunch,
        mais_vendido: newIsBestSeller,
        outlet: newIsOutlet,
        ultimas_pecas: newIsLastPieces,
        estoque_total: totalStockCalc,
        foto_principal: coverPhoto,
        fotos: uploadedPhotos,
        video_provador_url: uploadedVideoUrl || undefined,
        tem_grade: newProductHasGrid,
        variacoes: newProductHasGrid ? gridVariations : []
      };

      const res = await createAdminProduct(payload, DEFAULT_TENANT_ID);
      if (res.success) {
        showToast(`Peça "${newProductName}" cadastrada e publicada com sucesso!`);
        setIsCreateModalOpen(false);
        // Reset form
        setNewProductName('');
        setNewProductPrice('');
        setNewProductPromoPrice('');
        setNewProductCostPrice('');
        setNewProductDesc('');
        setUploadedPhotos([]);
        setUploadedVideoUrl('');
        // Recarrega lista
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

  // Extrair categorias para filtro
  const categoriesFilter = [
    'todas',
    ...Array.from(new Set(products.map((p) => p.categoria_nome || 'Geral')))
  ];

  // Filtro
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-3">
            <span>Catálogo & Peças de Luxo</span>
            <span className="text-[10px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-2 py-0.5 font-sans font-bold uppercase tracking-wider">
              Cloudflare R2 Ativo
            </span>
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            Cadastre peças novas com fotos e vídeos de provador, controle estoque por grade de cor e tamanho e acompanhe a margem de lucro real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProductsData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors w-fit cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#DFBE76]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Peça</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DO CATÁLOGO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1A1918] border border-white/10 p-4">
          <span className="text-[11px] text-[#A8A29E] block">Total de Peças</span>
          <span className="text-xl font-bold font-serif-luxury text-white mt-1 block">
            {products.length}
          </span>
        </div>
        <div className="bg-[#1A1918] border border-emerald-500/20 p-4">
          <span className="text-[11px] text-emerald-300 block">Ativas na Vitrine</span>
          <span className="text-xl font-bold font-serif-luxury text-white mt-1 block">
            {totalAtivos}
          </span>
        </div>
        <div className="bg-[#1A1918] border border-amber-500/20 p-4">
          <span className="text-[11px] text-amber-300 block">Pausadas</span>
          <span className="text-xl font-bold font-serif-luxury text-white mt-1 block">
            {totalPausados}
          </span>
        </div>
        <div className="bg-[#1A1918] border border-[#DFBE76]/20 p-4">
          <span className="text-[11px] text-[#DFBE76] block">Estoque Total</span>
          <span className="text-xl font-bold font-serif-luxury text-white mt-1 block">
            {estoqueTotalPecas} un
          </span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar peça por nome, categoria ou referência..."
            className="w-full bg-[#1A1918] border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
          />
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriesFilter.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black'
                  : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
              }`}
            >
              {cat === 'todas' ? 'Todas as Coleções' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE PRODUTOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#DFBE76] mx-auto mb-2" />
          <span>Carregando catálogo completo do Supabase...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5 space-y-3">
          <Package className="w-10 h-10 text-[#78716C] mx-auto opacity-30" />
          <p className="text-sm font-semibold text-white">Nenhuma peça encontrada</p>
          <p className="text-[11px]">Clique em &ldquo;Cadastrar Nova Peça&rdquo; para adicionar produtos ao catálogo.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-[#DFBE76] text-black text-xs font-bold uppercase tracking-wider mx-auto inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Primeira Peça</span>
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
                className={`bg-[#1A1918] border transition-colors ${
                  product.ativo ? 'border-white/10 hover:border-[#DFBE76]/40' : 'border-rose-900/30 opacity-70'
                }`}
              >
                {/* Linha Principal */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Foto da Peça */}
                    <div className="relative w-16 h-20 bg-black/60 shrink-0 border border-white/10 overflow-hidden">
                      {product.foto_principal ? (
                        <Image
                          src={product.foto_principal}
                          alt={product.nome}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#78716C]">
                          Sem Foto
                        </div>
                      )}
                      {product.midias && product.midias.some((m) => m.tipo === 'video') && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[#DFBE76] p-0.5 rounded text-[9px]">
                          <Video className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Informações da Peça */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#DFBE76] uppercase tracking-wider font-semibold">
                          {product.categoria_nome}
                        </span>
                        {!product.ativo && (
                          <span className="text-[9px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 font-bold uppercase">
                            Pausado
                          </span>
                        )}
                        {product.destaque && (
                          <span className="text-[9px] bg-[#DFBE76]/10 text-[#DFBE76] border border-[#DFBE76]/30 px-1.5 py-0.5 font-bold uppercase">
                            Lançamento
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {product.nome}
                      </h3>
                      <p className="text-[11px] text-[#78716C]">
                        Slug: <span className="font-mono text-[#A8A29E]">{product.slug}</span>
                        {product.tecido && ` • Tecido: ${product.tecido}`}
                      </p>
                    </div>
                  </div>

                  {/* Preço, Custo e Estoque */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase text-[#78716C] block">Preço Venda</span>
                      {hasPromo ? (
                        <div>
                          <span className="text-xs line-through text-[#78716C] block">
                            {formatCurrency(product.preco)}
                          </span>
                          <span className="text-sm font-bold text-[#DFBE76] font-serif-luxury block">
                            {formatCurrency(product.preco_promocional!)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-white font-serif-luxury block">
                          {formatCurrency(product.preco)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-[#78716C] block">Custo (CMV)</span>
                      <span className="text-xs font-semibold text-slate-300 block">
                        {product.preco_custo ? formatCurrency(product.preco_custo) : formatCurrency(custo)}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono block">
                        {margemBruta.toFixed(0)}% margem
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-[#78716C] block">Estoque</span>
                      <span
                        className={`text-xs font-bold block ${
                          product.estoque_total > 5
                            ? 'text-emerald-400'
                            : product.estoque_total > 0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {product.estoque_total > 0
                          ? `${product.estoque_total} un`
                          : 'Esgotado'}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1.5">
                      {/* Pausar / Ativar */}
                      <button
                        onClick={() => handleToggleActive(product)}
                        title={product.ativo ? 'Pausar da vitrine' : 'Ativar na vitrine'}
                        className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                          product.ativo
                            ? 'bg-white/5 hover:bg-rose-950/40 text-[#A8A29E] hover:text-rose-300 border-white/10 hover:border-rose-500/30'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {product.ativo ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline text-[11px]">Pausar</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Ativar</span>
                          </>
                        )}
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="px-2.5 py-1.5 text-xs bg-[#DFBE76]/10 hover:bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Editar preços e estoque"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">Editar</span>
                      </button>

                      {/* Excluir / Arquivar */}
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Excluir ou arquivar peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Ver na loja */}
                      <Link
                        href={`/catalogo?produto=${product.slug}`}
                        target="_blank"
                        className="p-1.5 text-[#78716C] hover:text-[#DFBE76] transition-colors"
                        title="Ver peça na loja ao vivo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Expandir Variações */}
                      <button
                        onClick={() =>
                          setExpandedProductId(isExpanded ? null : product.id)
                        }
                        className="p-1.5 text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
                        title="Ver grade de tamanhos e cores"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PAINEL EXPANSÍVEL: GRADE DE CORES E TAMANHOS */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/30 p-4 sm:p-5 space-y-3 animate-fade-in">
                    <h4 className="text-xs uppercase font-semibold text-[#DFBE76] tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Grade de Variações ({product.variacoes?.length || 0})</span>
                    </h4>

                    {!product.variacoes || product.variacoes.length === 0 ? (
                      <p className="text-xs text-[#78716C]">
                        Produto em tamanho único sem grade cadastrada.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {product.variacoes.map((v) => (
                          <div
                            key={v.id}
                            className="p-2.5 bg-white/5 border border-white/5 text-xs space-y-1"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-white/20 inline-block shrink-0"
                                style={{ backgroundColor: v.cor_hex || '#FFFFFF' }}
                              />
                              <span className="font-semibold text-white truncate">
                                {v.cor_nome}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#A8A29E]">
                              <span>Tam: <strong className="text-white">{v.tamanho}</strong></span>
                              <span className="text-emerald-400 font-semibold">{v.estoque} un</span>
                            </div>
                            {v.sku && (
                              <span className="text-[9px] text-[#78716C] font-mono block truncate">
                                SKU: {v.sku}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE CADASTRO COMPLETO DE NOVO PRODUTO (COM CLOUDFLARE R2) */}
      {/* ============================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 w-full max-w-3xl max-h-[90vh] overflow-y-auto my-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-white tracking-wide">
                  Cadastrar Nova Peça no Catálogo
                </h3>
                <p className="text-xs text-[#A8A29E] mt-0.5">
                  Preencha os dados da peça, suba fotos em alta definição e vídeo de provador para o Cloudflare R2.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-[#78716C] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-6 text-xs">
              {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
              <div className="space-y-4 bg-black/20 p-4 border border-white/5">
                <h4 className="font-semibold text-[#DFBE76] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> 1. Informações Básicas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[#A8A29E] mb-1 font-medium">Nome da Peça *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vestido Longo Alfaiataria Nude"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Categoria</label>
                    <select
                      value={newProductCatId}
                      onChange={(e) => setNewProductCatId(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#DFBE76]"
                    >
                      <option value="">Selecione ou digite abaixo...</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Ou Nova Categoria</label>
                    <input
                      type="text"
                      placeholder="Ex: Alta Costura, Macacões..."
                      value={newCustomCatName}
                      onChange={(e) => setNewCustomCatName(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Tecido</label>
                    <input
                      type="text"
                      placeholder="Ex: Seda Pura, Linho Cru"
                      value={newProductFabric}
                      onChange={(e) => setNewProductFabric(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Modelagem</label>
                    <input
                      type="text"
                      placeholder="Ex: Fluido, Evasê, Slim"
                      value={newProductModeling}
                      onChange={(e) => setNewProductModeling(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: PREÇO & CUSTO (DRE FINANCEIRO) */}
              <div className="space-y-4 bg-black/20 p-4 border border-white/5">
                <h4 className="font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> 2. Precificação & Custo (DRE)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 289.90"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white font-mono focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Preço Promocional (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 249.90"
                      value={newProductPromoPrice}
                      onChange={(e) => setNewProductPromoPrice(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-[#DFBE76] font-mono focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Preço de Custo / CMV (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 110.00"
                      value={newProductCostPrice}
                      onChange={(e) => setNewProductCostPrice(e.target.value)}
                      className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-[#DFBE76]"
                    />
                  </div>
                </div>

                {newProductPrice && newProductCostPrice && Number(newProductPrice) > 0 && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                    <span>Lucro Bruto por Peça: <strong>{formatCurrency(Number(newProductPrice) - Number(newProductCostPrice))}</strong></span>
                    <span>Margem Bruta Estimada: <strong>{(((Number(newProductPrice) - Number(newProductCostPrice)) / Number(newProductPrice)) * 100).toFixed(1)}%</strong></span>
                  </div>
                )}
              </div>

              {/* SEÇÃO 3: MÍDIAS NO CLOUDFLARE R2 */}
              <div className="space-y-4 bg-black/20 p-4 border border-white/5">
                <h4 className="font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> 3. Mídias no Cloudflare R2 (Fotos e Vídeo 9:16)
                </h4>

                {/* Upload de Fotos */}
                <div>
                  <label className="block text-[#A8A29E] mb-1 font-medium">
                    Fotos da Peça (Suba direto para o Cloudflare R2)
                  </label>
                  <label className="border-2 border-dashed border-white/15 hover:border-[#DFBE76] bg-black/40 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors block text-center">
                    <Upload className={`w-6 h-6 ${uploadingImage ? 'animate-bounce text-[#DFBE76]' : 'text-[#78716C]'}`} />
                    <span className="text-white font-medium">
                      {uploadingImage ? 'Enviando foto para o Cloudflare R2...' : 'Clique para selecionar fotos de alta resolução'}
                    </span>
                    <span className="text-[10px] text-[#A8A29E]">Aceita WebP, PNG, JPEG (Taxa zero de tráfego)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Prévia das fotos */}
                  {uploadedPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {uploadedPhotos.map((url, idx) => (
                        <div key={url} className="relative group border border-white/20 aspect-[3/4] bg-black">
                          <Image src={url} alt="Foto enviada" fill className="object-cover" />
                          {coverPhotoIndex === idx && (
                            <span className="absolute top-1 left-1 bg-[#DFBE76] text-black text-[9px] font-bold px-1 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" /> Capa
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setCoverPhotoIndex(idx)}
                              title="Tornar Capa"
                              className="p-1 bg-[#DFBE76] text-black rounded"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                              title="Remover Foto"
                              className="p-1 bg-rose-600 text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload de Vídeo de Provador */}
                <div className="pt-2 border-t border-white/5">
                  <label className="block text-[#A8A29E] mb-1 font-medium">
                    Vídeo de Provador Vertical (9:16)
                  </label>
                  <label className="border border-dashed border-white/15 hover:border-sky-400 bg-black/40 p-3 flex items-center gap-3 cursor-pointer transition-colors">
                    <Video className={`w-5 h-5 ${uploadingVideo ? 'animate-spin text-sky-400' : 'text-[#78716C]'}`} />
                    <div className="flex-1">
                      <span className="text-white block font-medium">
                        {uploadingVideo ? 'Enviando vídeo para o R2...' : uploadedVideoUrl ? 'Vídeo Carregado com Sucesso!' : 'Selecionar Vídeo de Provador (MP4)'}
                      </span>
                      <span className="text-[10px] text-[#A8A29E] block">
                        Exibido no card da vitrine e modal da peça
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={uploadingVideo}
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadedVideoUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-black/40 p-2 border border-sky-500/30">
                      <video src={uploadedVideoUrl} controls className="h-20 w-12 object-cover rounded" />
                      <div className="flex-1">
                        <span className="text-emerald-400 font-semibold block text-[11px]">Vídeo ativo no R2</span>
                        <span className="text-[10px] text-[#78716C] font-mono truncate block max-w-xs">{uploadedVideoUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedVideoUrl('')}
                        className="text-rose-400 hover:text-rose-200 text-xs p-1"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 4: GRADE DE CORES E TAMANHOS */}
              <div className="space-y-4 bg-black/20 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#DFBE76] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> 4. Estoque & Grade
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProductHasGrid}
                      onChange={(e) => setNewProductHasGrid(e.target.checked)}
                      className="accent-[#DFBE76]"
                    />
                    <span className="text-white text-xs">Produto com Grade (Cor x Tamanho)</span>
                  </label>
                </div>

                {newProductHasGrid ? (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {gridVariations.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#121110] p-2 border border-white/10">
                          <input
                            type="color"
                            value={v.cor_hex}
                            onChange={(e) => handleUpdateVariation(idx, 'cor_hex', e.target.value)}
                            className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                            title="Seletor de Cor"
                          />
                          <input
                            type="text"
                            placeholder="Nome Cor"
                            value={v.cor_nome}
                            onChange={(e) => handleUpdateVariation(idx, 'cor_nome', e.target.value)}
                            className="w-24 bg-transparent border-b border-white/20 px-1 py-0.5 text-white"
                          />
                          <select
                            value={v.tamanho}
                            onChange={(e) => handleUpdateVariation(idx, 'tamanho', e.target.value)}
                            className="w-16 bg-[#1A1918] border border-white/20 text-white px-1 py-0.5"
                          >
                            <option value="PP">PP</option>
                            <option value="P">P</option>
                            <option value="M">M</option>
                            <option value="G">G</option>
                            <option value="GG">GG</option>
                            <option value="U">Único</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Qtd"
                            value={v.estoque}
                            onChange={(e) => handleUpdateVariation(idx, 'estoque', Number(e.target.value))}
                            className="w-16 bg-transparent border-b border-white/20 px-1 py-0.5 text-emerald-400 font-mono text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(idx)}
                            className="text-rose-400 hover:text-rose-200 ml-auto p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Variação de Grade</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[#A8A29E] mb-1 font-medium">Estoque Total de Unidades</label>
                    <input
                      type="number"
                      value={newProductStockSimple}
                      onChange={(e) => setNewProductStockSimple(e.target.value)}
                      className="w-32 bg-[#121110] border border-white/15 px-3 py-2 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 5: DESTAQUES NA VITRINE */}
              <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsLaunch}
                    onChange={(e) => setNewIsLaunch(e.target.checked)}
                    className="accent-[#DFBE76]"
                  />
                  <span className="text-white text-xs">Marcar como Lançamento</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsBestSeller}
                    onChange={(e) => setNewIsBestSeller(e.target.checked)}
                    className="accent-[#DFBE76]"
                  />
                  <span className="text-white text-xs">Marcar como Mais Vendido</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOutlet}
                    onChange={(e) => setNewIsOutlet(e.target.checked)}
                    className="accent-[#DFBE76]"
                  />
                  <span className="text-white text-xs">Outlet</span>
                </label>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#DFBE76]/20"
                >
                  {isSubmittingCreate ? 'Salvando no Supabase...' : 'Salvar & Publicar na Vitrine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE EDIÇÃO RÁPIDA DE PREÇO, CUSTO E ESTOQUE */}
      {/* ============================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif-luxury text-base font-bold text-white tracking-wide">
                Editar {editingProduct.nome}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-[#78716C] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A8A29E] mb-1">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-[#121110] border border-white/10 px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A8A29E] mb-1">Preço Promocional (R$ - opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPromoPrice}
                  onChange={(e) => setEditPromoPrice(e.target.value)}
                  placeholder="Vazio para desativar promoção"
                  className="w-full bg-[#121110] border border-white/10 px-3 py-2 text-[#DFBE76] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A8A29E] mb-1">Preço de Custo / CMV (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  placeholder="Ex: 95.00"
                  className="w-full bg-[#121110] border border-white/10 px-3 py-2 text-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A8A29E] mb-1">Estoque Total</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-[#121110] border border-white/10 px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-3 py-1.5 text-xs text-[#A8A29E] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-2 bg-[#DFBE76] text-black text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO / ARQUIVAMENTO */}
      {/* ============================================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1918] border border-rose-500/40 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Excluir Peça</h3>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Tem certeza que deseja excluir <strong>{deletingProduct.nome}</strong>?
              Se já houver pedidos de clientes com esta peça, ela será arquivada e desativada da vitrine para proteger seu histórico contábil.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 text-xs text-[#A8A29E] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
