'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  Store,
  Check,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Eye,
  CheckCircle2,
  Sliders,
  Paintbrush
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme, AdminPaletteKey } from '@/context/AdminThemeContext';
import { cn } from '@/lib/chart-utils';

export default function AdminSettingsPage() {
  const { currentTenant } = useStore();
  const { palette, setPalette, availablePalettes, paletteConfig } = useAdminTheme();
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const lojaNome = currentTenant?.nome || 'Loja Parceira';
  const lojaSlug = currentTenant?.slug || '';

  const handleSelectPalette = (key: AdminPaletteKey) => {
    setPalette(key);
    const p = availablePalettes.find((item) => item.id === key);
    setSaveToast(`Paleta visual alterada para "${p?.name || key}" com sucesso!`);
    setTimeout(() => {
      setSaveToast(null);
    }, 3500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast flutuante de sucesso */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{saveToast}</span>
        </div>
      )}

      {/* =========================================================================
          CABEÇALHO DA PÁGINA DE CONFIGURAÇÕES
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Sliders className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Configurações do Painel
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Personalize a estética, paleta de cores e preferências operacionais de {lojaNome}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/?loja=${lojaSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 1: SELETOR DE PALETA DE CORES (PROMINENTE & VISUAL)
      ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Paleta de Cores do Layout
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Escolha a identidade visual do painel. A seleção atualiza instantaneamente a barra lateral, botões, ícones e destaques.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Paleta ativa:</span>
            <span className="font-bold text-slate-900">{paletteConfig.name}</span>
          </div>
        </div>

        {/* Grade de Paletas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {availablePalettes.map((item) => {
            const isSelected = palette === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectPalette(item.id)}
                className={cn(
                  'rounded-2xl border-2 p-4 sm:p-5 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md',
                  isSelected
                    ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                {/* Tag de Ativa */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Ativa</span>
                  </div>
                )}

                <div>
                  {/* Amostra Visual (Mini Preview da Sidebar + Acento) */}
                  <div className="w-full h-24 rounded-xl border border-slate-200/90 overflow-hidden flex shadow-inner mb-4">
                    {/* Barra lateral simulada */}
                    <div
                      className="w-1/3 h-full p-2 flex flex-col justify-between"
                      style={{ backgroundColor: item.colors.sidebarBg }}
                    >
                      <div className="w-full h-2 rounded-sm bg-white/20" />
                      <div className="space-y-1">
                        <div
                          className="w-full h-1.5 rounded-sm"
                          style={{ backgroundColor: item.colors.accent }}
                        />
                        <div className="w-3/4 h-1.5 rounded-sm bg-white/20" />
                        <div className="w-2/3 h-1.5 rounded-sm bg-white/10" />
                      </div>
                      <div className="w-1/2 h-1.5 rounded-sm bg-white/20" />
                    </div>

                    {/* Conteúdo simulado */}
                    <div className="w-2/3 h-full bg-[#F8FAFC] p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-1/3 h-2 rounded bg-slate-200" />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.colors.accent }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="h-6 rounded bg-white border border-slate-200" />
                        <div className="h-6 rounded bg-white border border-slate-200" />
                      </div>
                      <div className="w-full h-3 rounded bg-white border border-slate-200" />
                    </div>
                  </div>

                  {/* Nome e Categoria */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Botão de Seleção */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: item.colors.sidebarBg }}
                      title="Cor da Barra Lateral"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: item.colors.accent }}
                      title="Cor de Destaque / Acentos"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs bg-[#F8FAFC]"
                      title="Fundo do Canvas"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPalette(item.id);
                    }}
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-lg transition-all',
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    )}
                  >
                    {isSelected ? 'Aplicada' : 'Usar Tema'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 2: IDENTIDADE & DADOS DA LOJA
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Dados do Estabelecimento */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Identidade do Lojista</h2>
              <p className="text-[11px] text-slate-500">Parâmetros de identificação da marca</p>
            </div>
          </div>

          <div className="mt-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Nome Oficial:</span>
              <span className="font-bold text-slate-900">{lojaNome}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Slug da Loja:</span>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {lojaSlug || 'leidy-boutique'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Acesso via URL:</span>
              <span className="font-mono text-slate-700 truncate max-w-[200px]">
                {`/?loja=${lojaSlug}`}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Atendimento WhatsApp:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Conectado
              </span>
            </div>
          </div>
        </div>

        {/* Card: Atalhos Operacionais do Painel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Atalhos do Sistema</h2>
              <p className="text-[11px] text-slate-500">Navegação ágil para módulos essenciais</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/admin/produtos/"
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between group"
            >
              <span className="font-bold text-slate-800 group-hover:text-amber-800">
                Catálogo & Estoque
              </span>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Gerenciar produtos</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              href="/admin/pedidos/"
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between group"
            >
              <span className="font-bold text-slate-800 group-hover:text-amber-800">
                Central de Pedidos
              </span>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Ver pedidos</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              href="/admin/financas/"
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between group"
            >
              <span className="font-bold text-slate-800 group-hover:text-amber-800">
                Finanças & Lucro
              </span>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Relatórios DRE</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              href="/admin/banners/"
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between group"
            >
              <span className="font-bold text-slate-800 group-hover:text-amber-800">
                Banners & Vitrine
              </span>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Fotos da vitrine</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
