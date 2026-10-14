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
  Plus
} from 'lucide-react';
import {
  getAdminProducts,
  toggleAdminProductActive,
  updateAdminProductDetails,
  AdminProductItem
} from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal de Edição
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPromoPrice, setEditPromoPrice] = useState<string>('');
  const [editStock, setEditStock] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts(DEFAULT_TENANT_ID);
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

  // Abrir modal de edição
  const handleOpenEdit = (product: AdminProductItem) => {
    setEditingProduct(product);
    setEditPrice(product.preco);
    setEditPromoPrice(product.preco_promocional ? String(product.preco_promocional) : '');
    setEditStock(product.estoque_total);
  };

  // Salvar Edição
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);

    const promoVal = editPromoPrice.trim() ? Number(editPromoPrice) : null;
    const res = await updateAdminProductDetails(
      editingProduct.id,
      Number(editPrice),
      promoVal,
      Number(editStock)
    );

    if (res.success) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                preco: Number(editPrice),
                preco_promocional: promoVal,
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

  // Extrair categorias únicas
  const categories = ['todas', ...Array.from(new Set(products.map((p) => p.categoria_nome || 'Geral')))];

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
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Catálogo & Estoque de Peças
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            Controle de visibilidade, variações de grade, fotos de provador e preços das peças de luxo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors w-fit cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
            <span>Atualizar Catálogo</span>
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
          <span className="text-[11px] text-[#DFBE76] block">Estoque em Grade</span>
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
            placeholder="Buscar peça por nome ou referência..."
            className="w-full bg-[#1A1918] border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
          />
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
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
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5 space-y-2">
          <Package className="w-8 h-8 text-[#78716C] mx-auto opacity-30" />
          <p className="text-sm font-semibold text-white">Nenhum produto encontrado</p>
          <p className="text-[11px]">Tente ajustar os filtros ou o termo de busca.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const hasPromo = product.preco_promocional && product.preco_promocional > 0;

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
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {product.nome}
                      </h3>
                      <p className="text-[11px] text-[#78716C]">
                        Slug: <span className="font-mono text-[#A8A29E]">{product.slug}</span>
                      </p>
                      {product.tecido && (
                        <p className="text-[11px] text-[#A8A29E] mt-0.5">
                          Tecido: {product.tecido}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preço e Estoque */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase text-[#78716C] block">Preço</span>
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
                          ? `${product.estoque_total} peças`
                          : 'Esgotado'}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      {/* Pausar / Ativar */}
                      <button
                        onClick={() => handleToggleActive(product)}
                        title={product.ativo ? 'Pausar da vitrine' : 'Ativar na vitrine'}
                        className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          product.ativo
                            ? 'bg-white/5 hover:bg-rose-950/40 text-[#A8A29E] hover:text-rose-300 border-white/10 hover:border-rose-500/30'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {product.ativo ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pausar</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ativar</span>
                          </>
                        )}
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="px-3 py-1.5 text-xs bg-[#DFBE76]/10 hover:bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Ver na loja */}
                      <Link
                        href={`/catalogo?produto=${product.slug}`}
                        target="_blank"
                        className="p-1.5 text-[#78716C] hover:text-[#DFBE76] transition-colors"
                        title="Ver peça na loja"
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
                        Nenhuma variação individual registrada no banco.
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
                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: v.cor_hex || '#FFFFFF' }}
                              />
                              <span className="font-medium text-white truncate">
                                {v.cor_nome}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#A8A29E]">
                              <span>Tam: <strong>{v.tamanho}</strong></span>
                              <span className="font-mono text-[#DFBE76]">{v.estoque} un</span>
                            </div>
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

      {/* MODAL: EDITAR PREÇO E ESTOQUE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Editar Detalhes da Peça
                </h3>
                <span className="text-xs text-[#DFBE76] font-semibold">
                  {editingProduct.nome}
                </span>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-[#78716C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold block mb-1">
                  Preço Original (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#DFBE76]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold block mb-1">
                  Preço Promocional (R$) <span className="text-[#78716C]">(Deixe vazio se não houver)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPromoPrice}
                  onChange={(e) => setEditPromoPrice(e.target.value)}
                  placeholder="Ex: 249.90"
                  className="w-full bg-black/40 border border-white/10 text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#DFBE76]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold block mb-1">
                  Estoque Total Geral (peças)
                </label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#DFBE76]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs text-[#A8A29E] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
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
