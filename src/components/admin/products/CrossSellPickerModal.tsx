'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, X, Check, Plus, Sparkles, ShoppingBag, Layers } from 'lucide-react';
import { AdminProductItem } from '@/lib/admin';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export interface CrossSellPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: AdminProductItem | { id: string; nome?: string; slug?: string; preco?: number };
  currentProductId?: string;
  allProducts: AdminProductItem[];
  selectedSlugs: string[];
  onSave?: (slugs: string[]) => void;
  onConfirm?: (slugs: string[]) => void;
}

export const CrossSellPickerModal: React.FC<CrossSellPickerModalProps> = ({
  isOpen,
  onClose,
  currentProduct,
  currentProductId,
  allProducts,
  selectedSlugs,
  onSave,
  onConfirm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [tempSelectedSlugs, setTempSelectedSlugs] = useState<string[]>(selectedSlugs);

  const activeCurrentId = currentProduct?.id || currentProductId;
  const activeCurrentSlug = currentProduct?.slug || '';
  const activeCurrentPreco = currentProduct?.preco || 0;

  // Sincroniza sempre que abre
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedSlugs(selectedSlugs);
      setSearchTerm('');
      setCategoryFilter('todas');
    }
  }, [isOpen, selectedSlugs]);

  if (!isOpen) return null;

  // Lista de categorias distintas para filtro rápido
  const categories = Array.from(
    new Set(allProducts.map((p) => p.categoria_nome).filter(Boolean))
  ) as string[];

  // Produtos disponíveis para vincular (exceto o próprio produto atual)
  const availableCandidates = allProducts.filter((p) => p.id !== activeCurrentId && p.slug !== activeCurrentSlug);

  // Produtos filtrados por busca e categoria
  const filteredProducts = availableCandidates.filter((p) => {
    const matchCat = categoryFilter === 'todas' || p.categoria_nome === categoryFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      p.nome.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term) ||
      (p.categoria_nome && p.categoria_nome.toLowerCase().includes(term)) ||
      (p.tecido && p.tecido.toLowerCase().includes(term));
    return matchCat && matchSearch;
  });

  // Produtos atualmente selecionados no look montado
  const selectedProducts = availableCandidates.filter((p) => tempSelectedSlugs.includes(p.slug));

  // Preço total estimado do look completo
  const totalLookPrice = activeCurrentPreco + selectedProducts.reduce((acc, p) => acc + p.preco, 0);

  const toggleProduct = (slug: string) => {
    setTempSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(tempSelectedSlugs);
    } else if (onSave) {
      onSave(tempSelectedSlugs);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-fade-in overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                &quot;Monte o Look&quot; / Peças Combinadas (Cross-Sell)
              </h3>
              <p className="text-xs text-slate-500">
                Selecione as peças que combinam com <b>{currentProduct.nome}</b> para elevar o Ticket Médio na vitrine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulador Visual do Look Montado */}
        <div className="p-4 bg-amber-50/40 border-b border-amber-100/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Composição Visual do Look Completo ({selectedProducts.length + 1} itens):
            </span>
            <span className="text-xs font-extrabold text-amber-950">
              Valor do Look Combinado: {formatCurrency(totalLookPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Peça Principal */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 shadow-2xs shrink-0">
              <div className="relative w-8 h-10 rounded overflow-hidden bg-slate-100 shrink-0">
                {currentProduct.foto_principal ? (
                  <Image src={currentProduct.foto_principal} alt={currentProduct.nome} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Foto</div>
                )}
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-amber-700 block leading-tight">Peça Principal</span>
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[130px]">{currentProduct.nome}</span>
                <span className="text-[10px] font-semibold text-slate-500">{formatCurrency(currentProduct.preco)}</span>
              </div>
            </div>

            {/* Peças Complementares Conectadas */}
            {selectedProducts.map((p) => (
              <React.Fragment key={p.id}>
                <span className="text-amber-500 font-bold text-sm shrink-0">+</span>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 group">
                  <div className="relative w-8 h-10 rounded overflow-hidden bg-slate-100 shrink-0">
                    {p.foto_principal ? (
                      <Image src={p.foto_principal} alt={p.nome} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Foto</div>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">{p.nome}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{formatCurrency(p.preco)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProduct(p.slug)}
                    title="Remover peça do look"
                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </React.Fragment>
            ))}

            {selectedProducts.length === 0 && (
              <span className="text-xs text-slate-400 italic pl-2">
                Nenhuma peça combinada selecionada ainda. Marque os produtos abaixo para compor o look!
              </span>
            )}
          </div>
        </div>

        {/* Barra de Filtro e Busca */}
        <div className="p-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar peça por nome, categoria ou tecido..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setCategoryFilter('todas')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'todas'
                  ? 'bg-slate-900 text-amber-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-amber-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Produtos Selecionáveis com Fotos Reais */}
        <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50/50">
          {filteredProducts.map((p) => {
            const isSelected = tempSelectedSlugs.includes(p.slug);
            return (
              <div
                key={p.id}
                onClick={() => toggleProduct(p.slug)}
                className={`relative rounded-xl border-2 p-2.5 bg-white transition-all cursor-pointer flex flex-col justify-between shadow-2xs group hover:border-amber-400 ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200'
                }`}
              >
                {/* Imagem */}
                <div className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                  {p.foto_principal ? (
                    <Image src={p.foto_principal} alt={p.nome} fill sizes="180px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Sem Foto</div>
                  )}

                  {/* Badge de Seleção */}
                  <div
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'bg-black/40 text-white/70 backdrop-blur-xs'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                  </div>
                </div>

                {/* Dados da Peça */}
                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight truncate">
                    {p.categoria_nome || 'Sem Categoria'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {p.nome}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-extrabold text-amber-700">{formatCurrency(p.preco)}</span>
                    <span className="text-[10px] text-slate-400">{p.estoque_total} un</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-400 italic">
              Nenhuma peça encontrada para os filtros aplicados.
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {tempSelectedSlugs.length} {tempSelectedSlugs.length === 1 ? 'peça combinada' : 'peças combinadas'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Concluir Seleção do Look</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
