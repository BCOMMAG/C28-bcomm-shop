'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, Sparkles, Tag, Package, Star } from 'lucide-react';
import { FormMediaItem } from './ProductMediaGalleryManager';
import { parseMediaColor } from '@/lib/products';

export interface ProductCardPreviewProps {
  nome: string;
  preco: number;
  precoPromocional?: number | null;
  tecido?: string;
  categoriaNome?: string;
  destaque?: boolean;
  maisVendido?: boolean;
  outlet?: boolean;
  ultimasPecas?: boolean;
  badgesCustomizados?: string[];
  fotos: FormMediaItem[];
  cores: Array<{ nome: string; hex?: string }>;
  precosPorVariacao?: Record<string, { preco?: number; preco_promocional?: number }>;
}

export function ProductCardPreviewDrawer({
  nome,
  preco,
  precoPromocional,
  tecido,
  categoriaNome,
  destaque,
  maisVendido,
  outlet,
  ultimasPecas,
  badgesCustomizados = [],
  fotos,
  cores,
  precosPorVariacao = {}
}: ProductCardPreviewProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const formatBRL = (v: number) => {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Determina se há preços divergentes entre variações
  const precosValores = Object.values(precosPorVariacao)
    .map((p) => p.preco)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  const menorPrecoVariacao = precosValores.length > 0 ? Math.min(...precosValores, preco || 999999) : preco;
  const temDivergencia = precosValores.some((p) => p !== preco);

  // Calcula desconto percentual
  const temPromo = precoPromocional && precoPromocional > 0 && precoPromocional < preco;
  const pctOff = temPromo ? Math.round(((preco - precoPromocional!) / preco) * 100) : 0;

  // Foto de exibição (prioriza foto da cor hovered ou capa principal)
  const activeColor = hoveredColor || (cores.length > 0 ? cores[0].nome : null);
  let displayPhotoUrl = fotos.length > 0 ? fotos[0].url : null;

  if (activeColor) {
    const fotoCor = fotos.find((f) => {
      const p = parseMediaColor(f.label || undefined);
      return !p.isHidden && p.colorName?.toLowerCase() === activeColor.toLowerCase() && p.isColorCover;
    }) || fotos.find((f) => {
      const p = parseMediaColor(f.label || undefined);
      return !p.isHidden && p.colorName?.toLowerCase() === activeColor.toLowerCase();
    });

    if (fotoCor) {
      displayPhotoUrl = fotoCor.url;
    }
  }

  return (
    <div className="bg-gradient-to-b from-amber-50/70 to-slate-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
          <Eye className="w-4 h-4 text-amber-700" />
          <span>Simulador da Vitrine (Card Live Preview)</span>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
          Em Tempo Real
        </span>
      </div>

      <div className="max-w-[280px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all hover:shadow-lg">
        {/* Foto do Card */}
        <div className="relative aspect-3/4 w-full bg-slate-100 overflow-hidden">
          {displayPhotoUrl ? (
            <Image
              src={displayPhotoUrl}
              alt={nome || 'Preview do Produto'}
              fill
              sizes="280px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1 p-4 text-center">
              <Package className="w-8 h-8 text-slate-300" />
              <span className="text-[11px] text-slate-400 font-medium">Sem foto de capa</span>
            </div>
          )}

          {/* Badges Superiores */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {destaque && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                🌟 Lançamento
              </span>
            )}
            {maisVendido && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                🔥 Mais Vendido
              </span>
            )}
            {outlet && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                🏷️ Outlet
              </span>
            )}
            {ultimasPecas && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                ⏳ Últimas Peças
              </span>
            )}
            {temPromo && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                -{pctOff}% OFF
              </span>
            )}
            {badgesCustomizados.map((b) => (
              <span
                key={b}
                className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/90 text-amber-300 shadow-xs"
              >
                ✨ {b}
              </span>
            ))}
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-3.5 space-y-2">
          {/* Categoria & Tecido */}
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-bold uppercase tracking-wider truncate">
              {categoriaNome || 'Categoria'}
            </span>
            {tecido && (
              <span className="text-[9px] font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 truncate">
                {tecido}
              </span>
            )}
          </div>

          {/* Título da Peça */}
          <h5 className="font-bold text-slate-900 text-xs line-clamp-1 font-serif-luxury" title={nome}>
            {nome || 'Nome da Nova Peça'}
          </h5>

          {/* Cores Disponíveis (Hover interativo para testar troca de foto) */}
          {cores.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {cores.slice(0, 6).map((c) => (
                <button
                  key={c.nome}
                  type="button"
                  onMouseEnter={() => setHoveredColor(c.nome)}
                  onMouseLeave={() => setHoveredColor(null)}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    hoveredColor === c.nome
                      ? 'ring-2 ring-amber-500 scale-110'
                      : 'border-black/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex || '#1A1918' }}
                  title={`Ver foto da cor: ${c.nome}`}
                />
              ))}
              {cores.length > 6 && (
                <span className="text-[10px] text-slate-400 font-bold">+{cores.length - 6}</span>
              )}
            </div>
          )}

          {/* Preços e Parcelamento */}
          <div className="pt-1 border-t border-slate-100">
            {temDivergencia && (
              <span className="text-[10px] text-slate-500 block">A partir de</span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-slate-900 text-sm font-mono">
                {formatBRL(temPromo ? precoPromocional! : menorPrecoVariacao)}
              </span>
              {temPromo && (
                <span className="text-[11px] text-slate-400 line-through font-mono">
                  {formatBRL(preco)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
              ou até 6x de {formatBRL((temPromo ? precoPromocional! : menorPrecoVariacao) / 6)} sem juros
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
