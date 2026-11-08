'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Paintbrush,
  Check,
  Save,
  RotateCcw,
  RefreshCw,
  Sliders,
  Type,
  LayoutDashboard,
  Box,
  Columns,
  Sparkles,
  ExternalLink,
  Store,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import {
  useAdminTheme,
  AdminPaletteKey,
  ADMIN_PALETTES,
  getContrastingTextColor,
  getRadiusPixels
} from '@/context/AdminThemeContext';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  AdminCustomThemeConfig,
  DEFAULT_ADMIN_CUSTOM_THEME
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function AdminThemeSettingsPage() {
  const { currentTenant, refreshTenant } = useStore();
  const { t } = useAdminI18n();
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { palette, setPalette, availablePalettes, setCustomTheme } = useAdminTheme();
  const { setIsDirty, registerSaveHandler, setFormName } = useAdminUnsavedChanges();
  const initialSnapshotRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setFormName('Tema do Painel Administrativo');
  }, [setFormName]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // ==========================================
  // ESTADOS DO TEMA DO PAINEL ADMINISTRATIVO
  // ==========================================
  const [adminHeadingFont, setAdminHeadingFont] = useState('Inter');
  const [adminBodyFont, setAdminBodyFont] = useState('Inter');

  const [adminBtnRadius, setAdminBtnRadius] = useState<'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-full'>('rounded-xl');
  const [adminBtnPrimaryBg, setAdminBtnPrimaryBg] = useState('#0F172A');
  const [adminBtnPrimaryText, setAdminBtnPrimaryText] = useState('#FFFFFF');
  const [adminBtnPrimaryHover, setAdminBtnPrimaryHover] = useState('#1E293B');

  const [adminBtnSecondaryBg, setAdminBtnSecondaryBg] = useState('#FFFFFF');
  const [adminBtnSecondaryText, setAdminBtnSecondaryText] = useState('#334155');
  const [adminBtnSecondaryBorder, setAdminBtnSecondaryBorder] = useState('#E2E8F0');

  const [adminCardBg, setAdminCardBg] = useState('#FFFFFF');
  const [adminCardBorder, setAdminCardBorder] = useState('#E2E8F0');

  const [adminSidebarBg, setAdminSidebarBg] = useState('#0B132B');
  const [adminSidebarText, setAdminSidebarText] = useState('#94A3B8');
  const [adminSidebarActive, setAdminSidebarActive] = useState('#F59E0B');

  const [adminAccentColor, setAdminAccentColor] = useState('#C5A059');
  const [adminPageBg, setAdminPageBg] = useState('#F8FAFC');
  const [adminTextColor, setAdminTextColor] = useState('#0F172A');

  // Gerador de Snapshot dos valores atuais (Memoizado para evitar recriação desnecessária)
  const getSnapshot = useCallback(
    () =>
      JSON.stringify({
        palette,
        adminHeadingFont,
        adminBodyFont,
        adminBtnRadius,
        adminBtnPrimaryBg,
        adminBtnPrimaryText,
        adminBtnPrimaryHover,
        adminBtnSecondaryBg,
        adminBtnSecondaryText,
        adminBtnSecondaryBorder,
        adminCardBg,
        adminCardBorder,
        adminSidebarBg,
        adminSidebarText,
        adminSidebarActive,
        adminAccentColor,
        adminPageBg,
        adminTextColor
      }),
    [
      palette,
      adminHeadingFont,
      adminBodyFont,
      adminBtnRadius,
      adminBtnPrimaryBg,
      adminBtnPrimaryText,
      adminBtnPrimaryHover,
      adminBtnSecondaryBg,
      adminBtnSecondaryText,
      adminBtnSecondaryBorder,
      adminCardBg,
      adminCardBorder,
      adminSidebarBg,
      adminSidebarText,
      adminSidebarActive,
      adminAccentColor,
      adminPageBg,
      adminTextColor
    ]
  );

  // Carregar dados salvos no Supabase (Blindado contra loops de re-renderização)
  useEffect(() => {
    if (hasLoadedRef.current) return;

    async function loadThemeSettings() {
      try {
        setLoading(true);
        const data = await getStoreSettings(tenantId);
        if (data?.adminCustom) {
          const ac = data.adminCustom;
          if (ac.typography?.headingFont) setAdminHeadingFont(ac.typography.headingFont);
          if (ac.typography?.bodyFont) setAdminBodyFont(ac.typography.bodyFont);
          if (ac.typography?.textColor) setAdminTextColor(ac.typography.textColor);

          if (ac.buttons?.borderRadius) setAdminBtnRadius(ac.buttons.borderRadius);
          else if (ac.buttonRadius) setAdminBtnRadius(ac.buttonRadius);

          if (ac.buttons?.primaryBg) setAdminBtnPrimaryBg(ac.buttons.primaryBg);
          if (ac.buttons?.primaryText) setAdminBtnPrimaryText(ac.buttons.primaryText);
          if (ac.buttons?.primaryHoverBg) setAdminBtnPrimaryHover(ac.buttons.primaryHoverBg);
          if (ac.buttons?.secondaryBg) setAdminBtnSecondaryBg(ac.buttons.secondaryBg);
          if (ac.buttons?.secondaryText) setAdminBtnSecondaryText(ac.buttons.secondaryText);
          if (ac.buttons?.secondaryBorder) setAdminBtnSecondaryBorder(ac.buttons.secondaryBorder);

          if (ac.cards?.background) setAdminCardBg(ac.cards.background);
          if (ac.cards?.border) setAdminCardBorder(ac.cards.border);

          if (ac.sidebar?.background) setAdminSidebarBg(ac.sidebar.background);
          else if (ac.sidebarBg) setAdminSidebarBg(ac.sidebarBg);

          if (ac.sidebar?.text) setAdminSidebarText(ac.sidebar.text);
          else if (ac.sidebarText) setAdminSidebarText(ac.sidebarText);

          if (ac.sidebar?.activeBorder) setAdminSidebarActive(ac.sidebar.activeBorder);

          if (ac.accents?.primaryAccent) setAdminAccentColor(ac.accents.primaryAccent);
          if (ac.pageBackground) setAdminPageBg(ac.pageBackground);
          else if (ac.pageBgLight) setAdminPageBg(ac.pageBgLight);
        }

        if (data?.adminPalette && ADMIN_PALETTES[data.adminPalette as AdminPaletteKey]) {
          setPalette(data.adminPalette as AdminPaletteKey);
        }
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Erro ao carregar configurações de tema do admin:', err);
      } finally {
        setLoading(false);
      }
    }

    loadThemeSettings();
  }, [tenantId]);

  // Snapshot inicial quando o carregamento termina (Protegido contra sobrescrita acidental)
  useEffect(() => {
    if (!loading && !initialSnapshotRef.current) {
      initialSnapshotRef.current = getSnapshot();
    }
  }, [loading, getSnapshot]);

  // Detecção de Dirty State reativa
  useEffect(() => {
    if (!loading && initialSnapshotRef.current) {
      const current = getSnapshot();
      setIsDirty(current !== initialSnapshotRef.current);
    }
  }, [loading, getSnapshot, setIsDirty]);

  // Aplicação de paleta aos campos do formulário
  const applyPaletteToForm = (key: AdminPaletteKey) => {
    const pal = availablePalettes.find((p) => p.id === key);
    if (!pal) return;

    setPalette(key);
    setAdminSidebarBg(pal.colors.sidebarBg);
    setAdminSidebarText(pal.colors.sidebarText);
    setAdminSidebarActive(pal.colors.sidebarActiveBorder);
    setAdminBtnPrimaryBg(pal.colors.primary);
    setAdminBtnPrimaryHover(pal.colors.primaryHover);
    setAdminBtnPrimaryText(pal.colors.primaryText);
    setAdminAccentColor(pal.colors.accent);
    setAdminPageBg(pal.preview.swatchBg);
  };

  // Restaurar padrões executivos
  const handleResetAdminDefaults = () => {
    const d = DEFAULT_ADMIN_CUSTOM_THEME;
    setPalette('midnight-gold');
    setAdminHeadingFont(d.typography?.headingFont || 'Inter');
    setAdminBodyFont(d.typography?.bodyFont || 'Inter');
    setAdminTextColor(d.typography?.textColor || '#0F172A');
    setAdminBtnRadius(d.buttons?.borderRadius || 'rounded-xl');
    setAdminBtnPrimaryBg(d.buttons?.primaryBg || '#0F172A');
    setAdminBtnPrimaryText(d.buttons?.primaryText || '#FFFFFF');
    setAdminBtnPrimaryHover(d.buttons?.primaryHoverBg || '#1E293B');
    setAdminBtnSecondaryBg(d.buttons?.secondaryBg || '#FFFFFF');
    setAdminBtnSecondaryText(d.buttons?.secondaryText || '#334155');
    setAdminBtnSecondaryBorder(d.buttons?.secondaryBorder || '#E2E8F0');
    setAdminCardBg(d.cards?.background || '#FFFFFF');
    setAdminCardBorder(d.cards?.border || '#E2E8F0');
    setAdminSidebarBg(d.sidebar?.background || '#0B132B');
    setAdminSidebarText(d.sidebar?.text || '#94A3B8');
    setAdminSidebarActive(d.sidebar?.activeBorder || '#F59E0B');
    setAdminAccentColor(d.accents?.primaryAccent || '#C5A059');
    setAdminPageBg(d.pageBackground || '#F8FAFC');
  };

  // Salvar configurações no Supabase
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccessMessage(false);

      const adminCustom: AdminCustomThemeConfig = {
        typography: {
          headingFont: adminHeadingFont,
          bodyFont: adminBodyFont,
          headingWeight: 'font-bold',
          headingColor: adminTextColor,
          textColor: adminTextColor,
          textMutedColor: '#64748B'
        },
        buttons: {
          primaryBg: adminBtnPrimaryBg,
          primaryText: adminBtnPrimaryText,
          primaryHoverBg: adminBtnPrimaryHover,
          secondaryBg: adminBtnSecondaryBg,
          secondaryText: adminBtnSecondaryText,
          secondaryBorder: adminBtnSecondaryBorder,
          borderRadius: adminBtnRadius
        },
        cards: {
          background: adminCardBg,
          border: adminCardBorder,
          borderRadius: adminBtnRadius as any,
          shadow: 'shadow-xs'
        },
        sidebar: {
          background: adminSidebarBg,
          text: adminSidebarText,
          activeBorder: adminSidebarActive,
          activeBackground: 'rgba(255, 255, 255, 0.08)'
        },
        accents: {
          primaryAccent: adminAccentColor,
          softAccent: `${adminAccentColor}20`
        },
        pageBackground: adminPageBg,
        // Retrocompatibilidade
        pageBgLight: adminPageBg,
        fontFamily: adminBodyFont,
        buttonBg: adminBtnPrimaryBg,
        buttonText: adminBtnPrimaryText,
        buttonRadius: adminBtnRadius,
        sidebarBg: adminSidebarBg,
        sidebarText: adminSidebarText
      };

      // Salva preservando atomicamente os dados da vitrine via backend
      await saveStoreGeneralSettings(tenantId, {
        adminCustom,
        adminPalette: palette
      });

      // Atualiza o contexto do tema imediatamente na sessão ativa
      setCustomTheme(adminCustom);

      // Atualiza o snapshot para limpar o dirty state
      initialSnapshotRef.current = getSnapshot();
      setIsDirty(false);

      if (refreshTenant) {
        await refreshTenant();
      }

      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar tema do painel administrativo:', err);
      alert('Ocorreu um erro ao salvar o tema do painel. Verifique a conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Registrar salvamento automático pelo Guardião de Mudanças (Descolado das renderizações frequentes)
  useEffect(() => {
    registerSaveHandler(async () => {
      if (handleSaveRef.current) {
        await handleSaveRef.current();
      }
    });
  }, [registerSaveHandler]);

  if (loading) {
    return (
      <div className="space-y-8 pb-16">
        {/* CABEÇALHO ESTÁVEL DA PÁGINA (Evita saltos visuais de layout) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Equipe & Gestão Interna
              </span>
              <span className="text-xs text-slate-500">• Loja: {tenantSlug}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-amber-600" />
              Tema do Painel Administrativo
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Personalize a identidade visual exclusiva da retaguarda e do sistema da sua equipe.
            </p>
          </div>
        </div>

        {/* CONTAINER DE CARREGAMENTO SUAVE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Carregando configurações do painel...</p>
          <p className="text-xs text-slate-400 mt-1">Carregando paletas executivas e tipografia da loja.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fade-in pb-16">
      {/* =========================================================================
          CABEÇALHO DA PÁGINA COM SEPARAÇÃO EXPLÍCITA
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Equipe & Gestão Interna
            </span>
            <span className="text-xs text-slate-500">• Loja: {tenantSlug}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-600" />
            Tema do Painel Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure a aparência do sistema de administração (ERP) utilizado por você e seus colaboradores. As escolhas feitas aqui padronizam fontes, cores de botões, cards e barra lateral de todas as 25 páginas do sistema.
          </p>
        </div>

        {/* Link Rápido para a Vitrine da Loja */}
        <Link
          href="/admin/loja/aparencia"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <Store className="w-4 h-4 text-indigo-600" />
          <span>Configurações da Loja (Clientes)</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </Link>
      </div>

      {/* BANNER DE AUTONOMIA & AVISO MULTITENANT */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                Isolamento Multitenant Ativo
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Identidade Visual da Equipe & Operação
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Você tem total autonomia para moldar a ergonomia de trabalho da sua equipe. Qualquer alteração feita abaixo afeta instantaneamente <strong>apenas o sistema desta loja ({tenantSlug})</strong>, preservando a identidade das outras lojas da plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetAdminDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 self-start md:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão Executivo</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. PALETAS RÁPIDAS EM 1 CLIQUE
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                1. Paletas Executivas em 1 Clique
              </h3>
              <p className="text-[11px] text-slate-500">
                Carregue instantaneamente uma combinação harmônica profissional desenvolvida para boutiques e e-commerces.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {availablePalettes.map((item) => {
            const isSelected = palette === item.id;
            return (
              <div
                key={item.id}
                onClick={() => applyPaletteToForm(item.id)}
                className={cn(
                  'rounded-xl border-2 p-3.5 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md',
                  isSelected
                    ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-2 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div>
                  <div className="w-full h-14 rounded-lg border border-slate-200 overflow-hidden flex shadow-inner mb-2.5">
                    <div className="w-1/3 h-full p-2 flex flex-col justify-between" style={{ backgroundColor: item.colors.sidebarBg }}>
                      <div className="w-full h-1 rounded bg-white/20" />
                      <div className="w-full h-1 rounded" style={{ backgroundColor: item.colors.accent }} />
                    </div>
                    <div className="w-2/3 h-full bg-[#F8FAFC] p-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-1/2 h-1.5 rounded bg-slate-200" />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.colors.accent }} />
                      </div>
                      <div className="w-full h-3 rounded" style={{ backgroundColor: item.colors.primary }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{item.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Sidebar {item.isDarkSidebar ? 'Escura' : 'Clara'}</span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Check className="w-3.5 h-3.5" /> Ativa
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-slate-700 font-medium">Aplicar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. TIPOGRAFIA DO SISTEMA ADMINISTRATIVO
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              2. Tipografia do Sistema Administrativo
            </h3>
            <p className="text-[11px] text-slate-500">
              Escolha a família tipográfica corporativa utilizada nos títulos, tabelas e menus do painel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fonte dos Títulos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Fonte dos Títulos & Cabeçalhos (H1 a H6)
            </label>
            <select
              value={adminHeadingFont}
              onChange={(e) => setAdminHeadingFont(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="Inter">Inter (Padrão Corporativo Moderno)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Geométrica & Elegante)</option>
              <option value="Poppins">Poppins (Arredondada & Amigável)</option>
              <option value="Montserrat">Montserrat (Alta Densidade & Firmeza)</option>
              <option value="Playfair Display">Playfair Display (Serifada Clássica de Boutique)</option>
              <option value="Cinzel">Cinzel (Editorial de Luxo)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Utilizada nos títulos principais de pedidos, clientes, produtos e faturamento.
            </p>
          </div>

          {/* Fonte do Corpo & Tabelas */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Fonte do Corpo de Texto, Tabelas & Formulários
            </label>
            <select
              value={adminBodyFont}
              onChange={(e) => setAdminBodyFont(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="Inter">Inter (Alta Legibilidade em Tabelas & Dados)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Visual Limpo & Moderno)</option>
              <option value="Poppins">Poppins (Suave & Legível)</option>
              <option value="Montserrat">Montserrat (Estrutura Firme)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Garante clareza cirúrgica para leitura de valores numéricos, SKUs e status de pedidos.
            </p>
          </div>
        </div>

        {/* Amostra Dinâmica da Tipografia */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Amostra da Tipografia em Tempo Real
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span
              className="text-lg font-bold text-slate-900"
              style={{ fontFamily: adminHeadingFont }}
            >
              Painel de Gestão & Pedidos Recentes
            </span>
            <span
              className="text-xs text-slate-600"
              style={{ fontFamily: adminBodyFont }}
            >
              Tabela de dados: 142 pedidos faturados hoje (R$ 48.950,00)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BOTÕES DE AÇÃO PRIMÁRIOS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              3. Botões de Ação Primários (Ações Principais / Salvar / Confirmar)
            </h3>
            <p className="text-[11px] text-slate-500">
              Estilize os botões de ação principal do sistema para criar um fluxo de trabalho intuitivo e padronizado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cor de Fundo Primária */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cor de Fundo Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnPrimaryBg}
                onChange={(e) => {
                  setAdminBtnPrimaryBg(e.target.value);
                  setAdminBtnPrimaryText(getContrastingTextColor(e.target.value));
                }}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnPrimaryBg}
                onChange={(e) => {
                  setAdminBtnPrimaryBg(e.target.value);
                  setAdminBtnPrimaryText(getContrastingTextColor(e.target.value));
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Usado em Salvar, Novo Pedido, Cadastrar Peça.</p>
          </div>

          {/* Cor do Texto Primário */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cor do Texto Primário</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnPrimaryText}
                onChange={(e) => setAdminBtnPrimaryText(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnPrimaryText}
                onChange={(e) => setAdminBtnPrimaryText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Calculado automaticamente com alto contraste.</p>
          </div>

          {/* Hover do Botão Primário */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cor ao Passar o Mouse (Hover)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnPrimaryHover}
                onChange={(e) => setAdminBtnPrimaryHover(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnPrimaryHover}
                onChange={(e) => setAdminBtnPrimaryHover(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Feedback visual ao interagir com o cursor.</p>
          </div>

          {/* Raio dos Botões */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Arredondamento dos Cantos</label>
            <select
              value={adminBtnRadius}
              onChange={(e) => setAdminBtnRadius(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="rounded-none">Reto (0px - Minimalismo Suíço)</option>
              <option value="rounded-lg">Moderno (8px - Padrão Clean)</option>
              <option value="rounded-xl">Arredondado (12px - Suave & Atual)</option>
              <option value="rounded-full">Pílula (Totalmente Redondo)</option>
            </select>
            <p className="text-[10px] text-slate-400">Aplica-se a todos os botões e tags do sistema.</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BOTÕES SECUNDÁRIOS & PERIGO SEMÂNTICO
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
            <Columns className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              4. Botões Secundários & Perigo Semântico
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure as ações complementares (filtros, paginação, cancelar) e entenda as regras de segurança semântica.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Fundo Secundário</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnSecondaryBg}
                onChange={(e) => setAdminBtnSecondaryBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnSecondaryBg}
                onChange={(e) => setAdminBtnSecondaryBg(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Normalmente branco ou cinza claro.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Texto Secundário</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnSecondaryText}
                onChange={(e) => setAdminBtnSecondaryText(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnSecondaryText}
                onChange={(e) => setAdminBtnSecondaryText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Texto de botões como &apos;Filtrar&apos; e &apos;Cancelar&apos;.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Borda Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminBtnSecondaryBorder}
                onChange={(e) => setAdminBtnSecondaryBorder(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminBtnSecondaryBorder}
                onChange={(e) => setAdminBtnSecondaryBorder(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Contorno dos botões neutros do sistema.</p>
          </div>
        </div>

        {/* Nota Semântica de Segurança Operacional */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Proteção Semântica Universal de Ações Críticas:</strong> Botões destrutivos (como <em>Excluir Produto</em>, <em>Cancelar Pedido</em> ou <em>Remover Colaborador</em>) herdam a tipografia e o arredondamento configurados nesta tela, porém preservam intencionalmente o tom vermelho carmesim (<code className="font-mono font-bold text-rose-700">#E11D48</code>). Esse padrão internacional de UX previne cliques acidentais e perda irreversível de dados operacionais por parte da equipe.
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. SUPERFÍCIES, CARDS & TABELAS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              5. Superfícies, Cards & Tabelas
            </h3>
            <p className="text-[11px] text-slate-500">
              Defina o tom de fundo e as linhas divisórias dos cartões de métricas, pedidos e gráficos do sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Fundo dos Cards & Módulos</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminCardBg}
                onChange={(e) => setAdminCardBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminCardBg}
                onChange={(e) => setAdminCardBg(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Recomendado: Branco puro (#FFFFFF) ou Off-white (#F8FAFC).</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Borda & Divisores de Tabelas</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminCardBorder}
                onChange={(e) => setAdminCardBorder(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminCardBorder}
                onChange={(e) => setAdminCardBorder(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Linhas de contorno entre linhas de tabelas e blocos.</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. BARRA LATERAL / SIDEBAR EXECUTIVA
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              6. Barra Lateral / Sidebar Executiva
            </h3>
            <p className="text-[11px] text-slate-500">
              Personalize a tonalidade do menu de navegação vertical principal que acompanha a rotina diária da equipe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Fundo da Barra Lateral</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminSidebarBg}
                onChange={(e) => setAdminSidebarBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminSidebarBg}
                onChange={(e) => setAdminSidebarBg(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Ex: Azul Marinho (#0B132B), Grafite (#09090B), etc.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Texto & Ícones Inativos</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminSidebarText}
                onChange={(e) => setAdminSidebarText(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminSidebarText}
                onChange={(e) => setAdminSidebarText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Cor de ícones e links não selecionados.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Destaque do Item Ativo</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminSidebarActive}
                onChange={(e) => setAdminSidebarActive(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminSidebarActive}
                onChange={(e) => setAdminSidebarActive(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Barra indicadora e cor da página atual.</p>
          </div>
        </div>

        {/* Informação sobre herança de Logo */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-start gap-3">
          <Store className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 leading-relaxed">
            <strong>Logotipo Oficial no Topo da Sidebar:</strong> O painel administrativo herda automaticamente o logotipo oficial da boutique configurado em{' '}
            <Link href="/admin/loja/aparencia" className="font-bold underline text-indigo-700 hover:text-indigo-900">
              Configurações da Loja &gt; Aparência
            </Link>
            . Dessa forma você nunca precisa subir o mesmo arquivo de logo duas vezes.
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. CORES DE DESTAQUE & FUNDO DO SISTEMA
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              7. Cores de Destaque & Fundo do Sistema
            </h3>
            <p className="text-[11px] text-slate-500">
              Defina o tom de acento (badges VIP, anéis de foco, estrelas) e o plano de fundo das telas do admin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cor de Destaque (Accent)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminAccentColor}
                onChange={(e) => setAdminAccentColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminAccentColor}
                onChange={(e) => setAdminAccentColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Badges de status, anéis de foco e destaques de KPI.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Fundo Geral das Telas (Page Bg)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminPageBg}
                onChange={(e) => setAdminPageBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminPageBg}
                onChange={(e) => setAdminPageBg(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Área de fundo atrás dos cards e tabelas.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cor do Texto Principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminTextColor}
                onChange={(e) => setAdminTextColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminTextColor}
                onChange={(e) => setAdminTextColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
              />
            </div>
            <p className="text-[10px] text-slate-400">Títulos de colunas, nomes de clientes e valores.</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          8. PRÉVIA INTERATIVA EM TEMPO REAL DO SISTEMA
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                8. Prévia em Tempo Real da Interface do Admin
              </h3>
              <p className="text-[11px] text-slate-500">
                Visualize exatamente como seus títulos, cards, botões e tabelas aparecerão para a sua equipe.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">
            Live Preview Dinâmico
          </span>
        </div>

        {/* Container que reflete em tempo real o estilo configurado */}
        <div
          className="p-6 rounded-2xl border transition-all space-y-5"
          style={{
            backgroundColor: adminPageBg,
            borderColor: adminCardBorder
          }}
        >
          {/* Card Mockup */}
          <div
            className="p-5 transition-all shadow-xs border"
            style={{
              backgroundColor: adminCardBg,
              borderColor: adminCardBorder,
              borderRadius: getRadiusPixels(adminBtnRadius)
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: adminCardBorder }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Módulo de Demonstração
                </span>
                <h4
                  className="text-base font-bold transition-all"
                  style={{
                    fontFamily: adminHeadingFont,
                    color: adminTextColor
                  }}
                >
                  Visão Geral de Pedidos & Faturamento
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${adminAccentColor}20`,
                    color: adminAccentColor
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: adminAccentColor }} />
                  Destaque VIP
                </span>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p
                className="text-xs leading-relaxed"
                style={{
                  fontFamily: adminBodyFont,
                  color: adminTextColor
                }}
              >
                Este parágrafo de exemplo utiliza a fonte <strong>{adminBodyFont}</strong> e a cor de texto <strong>{adminTextColor}</strong>. Todas as tabelas de pedidos, produtos, clientes e finanças refletirão exatamente essa densidade e clareza para a sua equipe.
              </p>
            </div>

            {/* Ações da Prévia */}
            <div className="pt-4 border-t flex flex-wrap items-center gap-3" style={{ borderColor: adminCardBorder }}>
              {/* Botão Primário */}
              <button
                type="button"
                className="px-4 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: adminBtnPrimaryBg,
                  color: adminBtnPrimaryText,
                  borderRadius: getRadiusPixels(adminBtnRadius),
                  fontFamily: adminBodyFont
                }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Botão Primário (Salvar)</span>
              </button>

              {/* Botão Secundário */}
              <button
                type="button"
                className="px-4 py-2.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border"
                style={{
                  backgroundColor: adminBtnSecondaryBg,
                  color: adminBtnSecondaryText,
                  borderColor: adminBtnSecondaryBorder,
                  borderRadius: getRadiusPixels(adminBtnRadius),
                  fontFamily: adminBodyFont
                }}
              >
                <span>Botão Secundário (Filtros)</span>
              </button>

              {/* Botão de Perigo Semântico */}
              <button
                type="button"
                className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  borderRadius: getRadiusPixels(adminBtnRadius),
                  fontFamily: adminBodyFont
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir (Segurança Semântica)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Tema do Painel Administrativo salvo e aplicado com sucesso em todo o sistema!</span>
        </div>
      )}

      {/* BOTÃO SALVAR */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Aplicando Tema...' : 'Salvar Tema do Painel Administrativo'}</span>
        </button>
      </div>
    </form>
  );
}
