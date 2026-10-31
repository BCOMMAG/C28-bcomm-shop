'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Palette,
  Check,
  Paintbrush,
  Image as ImageIcon,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Type,
  Share2,
  Sliders,
  Eye,
  Film,
  Layers,
  Layout,
  Sun,
  Moon,
  Trash2,
  MousePointer,
  Columns,
  ToggleLeft,
  ToggleRight,
  Box,
  CheckSquare,
  Megaphone,
  ExternalLink,
  Tag
} from 'lucide-react';
import { AdminSinalizadoresModal } from '@/components/admin/products/AdminSinalizadoresModal';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme, AdminPaletteKey } from '@/context/AdminThemeContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  PlanoFundoMenuConfig,
  PlanoFundoSiteConfig,
  TipografiaMenuConfig,
  SecoesVitrineConfig,
  SecaoEstiloConfig,
  AdminCustomThemeConfig
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AppearanceSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { palette, setPalette, availablePalettes, paletteConfig } = useAdminTheme();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSinalizadoresModalOpen, setIsSinalizadoresModalOpen] = useState(false);

  // Estados de Upload
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDarkLogo, setIsUploadingDarkLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [isUploadingBgImage, setIsUploadingBgImage] = useState(false);

  // Mídias da Marca
  const [logoUrl, setLogoUrl] = useState('');
  const [logoDarkUrl, setLogoDarkUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [slogan, setSlogan] = useState('Moda Feminina Autêntica & Elegância Diária');

  // Plano de Fundo do Site
  const [siteBgTipo, setSiteBgTipo] = useState<'solido' | 'imagem' | 'video'>('solido');
  const [siteBgLight, setSiteBgLight] = useState('#FAF8F5');
  const [siteBgDark, setSiteBgDark] = useState('#121110');
  const [siteBgImageUrl, setSiteBgImageUrl] = useState('');
  const [siteBgCustomUrl, setSiteBgCustomUrl] = useState('');
  const [siteBgVideoUrl, setSiteBgVideoUrl] = useState('');
  const [siteBgOverlay, setSiteBgOverlay] = useState(40);

  // Plano de Fundo do Menu
  const [menuBgTipo, setMenuBgTipo] = useState<'transparente' | 'blur' | 'solido'>('transparente');
  const [menuBgLight, setMenuBgLight] = useState('#FAF8F5');
  const [menuBgDark, setMenuBgDark] = useState('#141312');

  // BLOCO 5: Tipografia & Cores do Menu da Vitrine
  const [menuFontFamily, setMenuFontFamily] = useState('Montserrat');
  const [menuFontSize, setMenuFontSize] = useState('12px');
  const [menuCorTextoLight, setMenuCorTextoLight] = useState('#1A1918');
  const [menuCorTextoDark, setMenuCorTextoDark] = useState('#FAF8F5');
  const [menuCorHoverLight, setMenuCorHoverLight] = useState('#C5A059');
  const [menuCorHoverDark, setMenuCorHoverDark] = useState('#DFBE76');

  // BLOCO 6: Tipografias e Cores por Seção da Vitrine
  const [secoesModoIndependente, setSecoesModoIndependente] = useState(false);
  const [secaoGlobalFont, setSecaoGlobalFont] = useState('Playfair Display');
  const [secaoGlobalBgLight, setSecaoGlobalBgLight] = useState('');
  const [secaoGlobalBgDark, setSecaoGlobalBgDark] = useState('');
  const [secaoGlobalTituloLight, setSecaoGlobalTituloLight] = useState('#FFFFFF');
  const [secaoGlobalTituloDark, setSecaoGlobalTituloDark] = useState('#FFFFFF');
  const [secaoGlobalSubtituloLight, setSecaoGlobalSubtituloLight] = useState('#FAF8F5');
  const [secaoGlobalSubtituloDark, setSecaoGlobalSubtituloDark] = useState('#FAF8F5');

  // Seção Lançamentos
  const [secaoLancamentosAtivo, setSecaoLancamentosAtivo] = useState(false);
  const [secaoLancamentosFont, setSecaoLancamentosFont] = useState('Playfair Display');
  const [secaoLancamentosBgLight, setSecaoLancamentosBgLight] = useState('');
  const [secaoLancamentosBgDark, setSecaoLancamentosBgDark] = useState('');
  const [secaoLancamentosTituloLight, setSecaoLancamentosTituloLight] = useState('#FFFFFF');
  const [secaoLancamentosTituloDark, setSecaoLancamentosTituloDark] = useState('#FFFFFF');
  const [secaoLancamentosSubtituloLight, setSecaoLancamentosSubtituloLight] = useState('#FAF8F5');
  const [secaoLancamentosSubtituloDark, setSecaoLancamentosSubtituloDark] = useState('#FAF8F5');

  // Seção Mais Vendidos
  const [secaoMaisVendidosAtivo, setSecaoMaisVendidosAtivo] = useState(false);
  const [secaoMaisVendidosFont, setSecaoMaisVendidosFont] = useState('Playfair Display');
  const [secaoMaisVendidosBgLight, setSecaoMaisVendidosBgLight] = useState('');
  const [secaoMaisVendidosBgDark, setSecaoMaisVendidosBgDark] = useState('');
  const [secaoMaisVendidosTituloLight, setSecaoMaisVendidosTituloLight] = useState('#FFFFFF');
  const [secaoMaisVendidosTituloDark, setSecaoMaisVendidosTituloDark] = useState('#FFFFFF');
  const [secaoMaisVendidosSubtituloLight, setSecaoMaisVendidosSubtituloLight] = useState('#FAF8F5');
  const [secaoMaisVendidosSubtituloDark, setSecaoMaisVendidosSubtituloDark] = useState('#FAF8F5');

  // Seção OUTLET
  const [secaoOutletAtivo, setSecaoOutletAtivo] = useState(false);
  const [secaoOutletFont, setSecaoOutletFont] = useState('Playfair Display');
  const [secaoOutletBgLight, setSecaoOutletBgLight] = useState('');
  const [secaoOutletBgDark, setSecaoOutletBgDark] = useState('');
  const [secaoOutletTituloLight, setSecaoOutletTituloLight] = useState('#FFFFFF');
  const [secaoOutletTituloDark, setSecaoOutletTituloDark] = useState('#FFFFFF');
  const [secaoOutletSubtituloLight, setSecaoOutletSubtituloLight] = useState('#FAF8F5');
  const [secaoOutletSubtituloDark, setSecaoOutletSubtituloDark] = useState('#FAF8F5');

  // Seção Últimas Peças
  const [secaoUltimasPecasAtivo, setSecaoUltimasPecasAtivo] = useState(false);
  const [secaoUltimasPecasFont, setSecaoUltimasPecasFont] = useState('Playfair Display');
  const [secaoUltimasPecasBgLight, setSecaoUltimasPecasBgLight] = useState('');
  const [secaoUltimasPecasBgDark, setSecaoUltimasPecasBgDark] = useState('');
  const [secaoUltimasPecasTituloLight, setSecaoUltimasPecasTituloLight] = useState('#FFFFFF');
  const [secaoUltimasPecasTituloDark, setSecaoUltimasPecasTituloDark] = useState('#FFFFFF');
  const [secaoUltimasPecasSubtituloLight, setSecaoUltimasPecasSubtituloLight] = useState('#FAF8F5');
  const [secaoUltimasPecasSubtituloDark, setSecaoUltimasPecasSubtituloDark] = useState('#FAF8F5');

  // Configuração Global de Visibilidade de Estoque para o Consumidor
  const [exibirQuantidadeEstoqueConsumidor, setExibirQuantidadeEstoqueConsumidor] = useState(true);

  // BLOCO 7: Customização do Painel Administrativo
  const [adminPageBgLight, setAdminPageBgLight] = useState('#F8FAFC');
  const [adminPageBgDark, setAdminPageBgDark] = useState('#0B132B');
  const [adminFontFamily, setAdminFontFamily] = useState('Inter');
  const [adminSidebarBg, setAdminSidebarBg] = useState('#0B132B');
  const [adminSidebarText, setAdminSidebarText] = useState('#94A3B8');
  const [adminButtonBg, setAdminButtonBg] = useState('#0F172A');
  const [adminButtonText, setAdminButtonText] = useState('#F59E0B');
  const [adminButtonRadius, setAdminButtonRadius] = useState<'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-full'>('rounded-xl');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getStoreSettings(tenantId);
        if (data) {
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.logoDarkUrl) setLogoDarkUrl(data.logoDarkUrl);
          if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
          if (data.ogImageUrl) setOgImageUrl(data.ogImageUrl);
          if (data.slogan) setSlogan(data.slogan);

          if (data.planoFundoSite) {
            setSiteBgTipo(data.planoFundoSite.tipo || 'solido');
            setSiteBgLight(data.planoFundoSite.bg_light || '#FAF8F5');
            setSiteBgDark(data.planoFundoSite.bg_dark || '#121110');
            setSiteBgImageUrl(data.planoFundoSite.imagem_url || '');
            const custom = data.planoFundoSite.imagem_custom_url ||
              (data.planoFundoSite.imagem_url && !data.planoFundoSite.imagem_url.includes('plano-de-fundo') ? data.planoFundoSite.imagem_url : '');
            setSiteBgCustomUrl(custom);
            setSiteBgVideoUrl(data.planoFundoSite.video_url || '');
            setSiteBgOverlay(data.planoFundoSite.overlay_opacidade ?? 50);
          }

          if (data.planoFundoMenu) {
            setMenuBgTipo(data.planoFundoMenu.tipo || 'transparente');
            setMenuBgLight(data.planoFundoMenu.bg_light || '#FAF8F5');
            setMenuBgDark(data.planoFundoMenu.bg_dark || '#141312');
          }

          if (data.tipografiaMenu) {
            setMenuFontFamily(data.tipografiaMenu.fontFamily || 'Montserrat');
            setMenuFontSize(data.tipografiaMenu.fontSize || '12px');
            setMenuCorTextoLight(data.tipografiaMenu.corTextoLight || '#1A1918');
            setMenuCorTextoDark(data.tipografiaMenu.corTextoDark || '#FAF8F5');
            setMenuCorHoverLight(data.tipografiaMenu.corHoverLight || '#C5A059');
            setMenuCorHoverDark(data.tipografiaMenu.corHoverDark || '#DFBE76');
          }

          if (data.secoesVitrine) {
            setSecoesModoIndependente(Boolean(data.secoesVitrine.modoIndependente));
            if (data.secoesVitrine.global) {
              setSecaoGlobalFont(data.secoesVitrine.global.tituloFont || 'Playfair Display');
              setSecaoGlobalBgLight(data.secoesVitrine.global.bgLight || '');
              setSecaoGlobalBgDark(data.secoesVitrine.global.bgDark || '');
              setSecaoGlobalTituloLight(data.secoesVitrine.global.tituloCorLight || '#FFFFFF');
              setSecaoGlobalTituloDark(data.secoesVitrine.global.tituloCorDark || '#FFFFFF');
              setSecaoGlobalSubtituloLight(data.secoesVitrine.global.subtituloCorLight || '#FAF8F5');
              setSecaoGlobalSubtituloDark(data.secoesVitrine.global.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.lancamentos) {
              setSecaoLancamentosAtivo(Boolean(data.secoesVitrine.lancamentos.ativo));
              setSecaoLancamentosFont(data.secoesVitrine.lancamentos.tituloFont || 'Playfair Display');
              setSecaoLancamentosBgLight(data.secoesVitrine.lancamentos.bgLight || '');
              setSecaoLancamentosBgDark(data.secoesVitrine.lancamentos.bgDark || '');
              setSecaoLancamentosTituloLight(data.secoesVitrine.lancamentos.tituloCorLight || '#FFFFFF');
              setSecaoLancamentosTituloDark(data.secoesVitrine.lancamentos.tituloCorDark || '#FFFFFF');
              setSecaoLancamentosSubtituloLight(data.secoesVitrine.lancamentos.subtituloCorLight || '#FAF8F5');
              setSecaoLancamentosSubtituloDark(data.secoesVitrine.lancamentos.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.maisVendidos) {
              setSecaoMaisVendidosAtivo(Boolean(data.secoesVitrine.maisVendidos.ativo));
              setSecaoMaisVendidosFont(data.secoesVitrine.maisVendidos.tituloFont || 'Playfair Display');
              setSecaoMaisVendidosBgLight(data.secoesVitrine.maisVendidos.bgLight || '');
              setSecaoMaisVendidosBgDark(data.secoesVitrine.maisVendidos.bgDark || '');
              setSecaoMaisVendidosTituloLight(data.secoesVitrine.maisVendidos.tituloCorLight || '#FFFFFF');
              setSecaoMaisVendidosTituloDark(data.secoesVitrine.maisVendidos.tituloCorDark || '#FFFFFF');
              setSecaoMaisVendidosSubtituloLight(data.secoesVitrine.maisVendidos.subtituloCorLight || '#FAF8F5');
              setSecaoMaisVendidosSubtituloDark(data.secoesVitrine.maisVendidos.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.outlet) {
              setSecaoOutletAtivo(Boolean(data.secoesVitrine.outlet.ativo));
              setSecaoOutletFont(data.secoesVitrine.outlet.tituloFont || 'Playfair Display');
              setSecaoOutletBgLight(data.secoesVitrine.outlet.bgLight || '');
              setSecaoOutletBgDark(data.secoesVitrine.outlet.bgDark || '');
              setSecaoOutletTituloLight(data.secoesVitrine.outlet.tituloCorLight || '#FFFFFF');
              setSecaoOutletTituloDark(data.secoesVitrine.outlet.tituloCorDark || '#FFFFFF');
              setSecaoOutletSubtituloLight(data.secoesVitrine.outlet.subtituloCorLight || '#FAF8F5');
              setSecaoOutletSubtituloDark(data.secoesVitrine.outlet.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.ultimasPecas) {
              setSecaoUltimasPecasAtivo(Boolean(data.secoesVitrine.ultimasPecas.ativo));
              setSecaoUltimasPecasFont(data.secoesVitrine.ultimasPecas.tituloFont || 'Playfair Display');
              setSecaoUltimasPecasBgLight(data.secoesVitrine.ultimasPecas.bgLight || '');
              setSecaoUltimasPecasBgDark(data.secoesVitrine.ultimasPecas.bgDark || '');
              setSecaoUltimasPecasTituloLight(data.secoesVitrine.ultimasPecas.tituloCorLight || '#FFFFFF');
              setSecaoUltimasPecasTituloDark(data.secoesVitrine.ultimasPecas.tituloCorDark || '#FFFFFF');
              setSecaoUltimasPecasSubtituloLight(data.secoesVitrine.ultimasPecas.subtituloCorLight || '#FAF8F5');
              setSecaoUltimasPecasSubtituloDark(data.secoesVitrine.ultimasPecas.subtituloCorDark || '#FAF8F5');
            }
          }

          if (data.exibirQuantidadeEstoqueConsumidor !== undefined) {
            setExibirQuantidadeEstoqueConsumidor(data.exibirQuantidadeEstoqueConsumidor);
          }

          if (data.adminCustom) {
            setAdminPageBgLight(data.adminCustom.pageBgLight || '#F8FAFC');
            setAdminPageBgDark(data.adminCustom.pageBgDark || '#0B132B');
            setAdminFontFamily(data.adminCustom.fontFamily || 'Inter');
            setAdminSidebarBg(data.adminCustom.sidebarBg || '#0B132B');
            setAdminSidebarText(data.adminCustom.sidebarText || '#94A3B8');
            setAdminButtonBg(data.adminCustom.buttonBg || '#0F172A');
            setAdminButtonText(data.adminCustom.buttonText || '#F59E0B');
            setAdminButtonRadius(data.adminCustom.buttonRadius || 'rounded-xl');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados visuais:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const handleSelectPalette = (key: AdminPaletteKey) => {
    setPalette(key);
    const p = availablePalettes.find((item) => item.id === key);
    showToast(`Tema visual alterado para "${p?.name || key}"!`);
  };

  // Upload no Cloudflare R2
  const handleUploadMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'light' | 'dark' | 'favicon' | 'og' | 'site_bg'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'light') setIsUploadingLogo(true);
    if (type === 'dark') setIsUploadingDarkLogo(true);
    if (type === 'favicon') setIsUploadingFavicon(true);
    if (type === 'og') setIsUploadingOgImage(true);
    if (type === 'site_bg') setIsUploadingBgImage(true);

    try {
      const folder = type === 'og' ? 'og' : type === 'site_bg' ? 'backgrounds' : 'logos';
      const res = await uploadBrowserFileToR2(file, tenantSlug, folder);
      if (res.success && res.url) {
        if (type === 'light') setLogoUrl(res.url);
        if (type === 'dark') setLogoDarkUrl(res.url);
        if (type === 'favicon') setFaviconUrl(res.url);
        if (type === 'og') setOgImageUrl(res.url);
        if (type === 'site_bg') {
          setSiteBgCustomUrl(res.url);
          setSiteBgImageUrl(res.url);
          setSiteBgTipo('imagem');
        }
        showToast('Arquivo enviado com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Erro no upload.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao enviar arquivo.', 'error');
    } finally {
      if (type === 'light') setIsUploadingLogo(false);
      if (type === 'dark') setIsUploadingDarkLogo(false);
      if (type === 'favicon') setIsUploadingFavicon(false);
      if (type === 'og') setIsUploadingOgImage(false);
      if (type === 'site_bg') setIsUploadingBgImage(false);
    }
  };

  const handleRemoveCustomBgImage = () => {
    setSiteBgCustomUrl('');
    if (siteBgImageUrl === siteBgCustomUrl) {
      setSiteBgImageUrl('/images/plano-de-fundo.webp');
    }
    showToast('Imagem personalizada removida. Fundo restaurado para o acervo oficial.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const planoFundoSite: PlanoFundoSiteConfig = {
        tipo: siteBgTipo,
        bg_light: siteBgLight,
        bg_dark: siteBgDark,
        imagem_url: siteBgImageUrl || undefined,
        imagem_custom_url: siteBgCustomUrl || undefined,
        video_url: siteBgVideoUrl || undefined,
        overlay_opacidade: siteBgOverlay
      };

      const planoFundoMenu: PlanoFundoMenuConfig = {
        tipo: menuBgTipo,
        bg_light: menuBgLight,
        bg_dark: menuBgDark
      };

      const tipografiaMenu: TipografiaMenuConfig = {
        fontFamily: menuFontFamily,
        fontSize: menuFontSize,
        corTextoLight: menuCorTextoLight,
        corTextoDark: menuCorTextoDark,
        corHoverLight: menuCorHoverLight,
        corHoverDark: menuCorHoverDark
      };

      const secoesVitrine: SecoesVitrineConfig = {
        modoIndependente: secoesModoIndependente,
        global: {
          ativo: true,
          tituloFont: secaoGlobalFont,
          bgLight: secaoGlobalBgLight || undefined,
          bgDark: secaoGlobalBgDark || undefined,
          tituloCorLight: secaoGlobalTituloLight,
          tituloCorDark: secaoGlobalTituloDark,
          subtituloCorLight: secaoGlobalSubtituloLight,
          subtituloCorDark: secaoGlobalSubtituloDark
        },
        lancamentos: {
          ativo: secaoLancamentosAtivo,
          tituloFont: secaoLancamentosFont,
          bgLight: secaoLancamentosBgLight || undefined,
          bgDark: secaoLancamentosBgDark || undefined,
          tituloCorLight: secaoLancamentosTituloLight,
          tituloCorDark: secaoLancamentosTituloDark,
          subtituloCorLight: secaoLancamentosSubtituloLight,
          subtituloCorDark: secaoLancamentosSubtituloDark
        },
        maisVendidos: {
          ativo: secaoMaisVendidosAtivo,
          tituloFont: secaoMaisVendidosFont,
          bgLight: secaoMaisVendidosBgLight || undefined,
          bgDark: secaoMaisVendidosBgDark || undefined,
          tituloCorLight: secaoMaisVendidosTituloLight,
          tituloCorDark: secaoMaisVendidosTituloDark,
          subtituloCorLight: secaoMaisVendidosSubtituloLight,
          subtituloCorDark: secaoMaisVendidosSubtituloDark
        },
        outlet: {
          ativo: secaoOutletAtivo,
          tituloFont: secaoOutletFont,
          bgLight: secaoOutletBgLight || undefined,
          bgDark: secaoOutletBgDark || undefined,
          tituloCorLight: secaoOutletTituloLight,
          tituloCorDark: secaoOutletTituloDark,
          subtituloCorLight: secaoOutletSubtituloLight,
          subtituloCorDark: secaoOutletSubtituloDark
        },
        ultimasPecas: {
          ativo: secaoUltimasPecasAtivo,
          tituloFont: secaoUltimasPecasFont,
          bgLight: secaoUltimasPecasBgLight || undefined,
          bgDark: secaoUltimasPecasBgDark || undefined,
          tituloCorLight: secaoUltimasPecasTituloLight,
          tituloCorDark: secaoUltimasPecasTituloDark,
          subtituloCorLight: secaoUltimasPecasSubtituloLight,
          subtituloCorDark: secaoUltimasPecasSubtituloDark
        }
      };

      const adminCustom: AdminCustomThemeConfig = {
        pageBgLight: adminPageBgLight,
        pageBgDark: adminPageBgDark,
        fontFamily: adminFontFamily,
        sidebarBg: adminSidebarBg,
        sidebarText: adminSidebarText,
        buttonBg: adminButtonBg,
        buttonText: adminButtonText,
        buttonRadius: adminButtonRadius
      };

      const res = await saveStoreGeneralSettings(tenantId, {
        logoUrl: logoUrl.trim(),
        logoDarkUrl: logoDarkUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        ogImageUrl: ogImageUrl.trim(),
        slogan: slogan.trim(),
        planoFundoSite,
        planoFundoMenu,
        tipografiaMenu,
        secoesVitrine,
        adminCustom,
        exibirQuantidadeEstoqueConsumidor
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Identidade visual, logos e planos de fundo salvos com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando configurações visuais...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* BLOCO 1: LOGOTIPOS, FAVICON & OG IMAGE (CLOUDFLARE R2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              1. Logotipos Oficiais, Favicon & OG Image (Cloudflare R2)
            </h2>
            <p className="text-[11px] text-slate-500">
              Gerencie a imagem principal da boutique para modo claro, modo escuro, aba do navegador e compartilhamento social.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Logo Light */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 bg-white shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Logo Modo Claro</span>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-[10px] text-slate-400 block line-clamp-1">
                Exibido sobre fundos claros da vitrine
              </span>
            </div>

            <div className="w-full h-24 bg-[#FAF8F5] rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2 relative group">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo Principal"
                  width={140}
                  height={50}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Logo padrão</span>
              )}
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-rose-600 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover logo personalizado"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all">
              {isUploadingLogo ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isUploadingLogo ? 'Enviando...' : 'Carregar Imagem'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadMedia(e, 'light')}
                disabled={isUploadingLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Logo Dark */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 bg-white shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Logo Modo Escuro</span>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <span className="text-[10px] text-slate-400 block line-clamp-1">
                Exibido sobre o hero escuro e no tema dark
              </span>
            </div>

            <div className="w-full h-24 bg-[#141312] rounded-lg border border-dashed border-slate-700 flex items-center justify-center overflow-hidden p-2 relative group">
              {logoDarkUrl ? (
                <Image
                  src={logoDarkUrl}
                  alt="Logo Dark"
                  width={140}
                  height={50}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">Mesmo do modo claro</span>
              )}
              {logoDarkUrl && (
                <button
                  type="button"
                  onClick={() => setLogoDarkUrl('')}
                  className="absolute top-1 right-1 p-1 bg-black/90 text-rose-400 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover logo dark"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all">
              {isUploadingDarkLogo ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isUploadingDarkLogo ? 'Enviando...' : 'Carregar Imagem'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadMedia(e, 'dark')}
                disabled={isUploadingDarkLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Favicon */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 bg-white shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Favicon do Navegador</span>
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">32x32</span>
              </div>
              <span className="text-[10px] text-slate-400 block line-clamp-1">
                Ícone dinâmico exibido na aba do navegador
              </span>
            </div>

            <div className="w-full h-24 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2 relative group">
              {faviconUrl ? (
                <Image
                  src={faviconUrl}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Padrão da loja</span>
              )}
              {faviconUrl && (
                <button
                  type="button"
                  onClick={() => setFaviconUrl('')}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-rose-600 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover favicon personalizado"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all">
              {isUploadingFavicon ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isUploadingFavicon ? 'Enviando...' : 'Carregar Ícone'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadMedia(e, 'favicon')}
                disabled={isUploadingFavicon}
                className="hidden"
              />
            </label>
          </div>

          {/* OG Image (Redes Sociais) */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 bg-white shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">OG Image Social</span>
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-[10px] text-slate-400 block line-clamp-1">
                Card para WhatsApp, Instagram e Facebook
              </span>
            </div>

            <div className="w-full h-24 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
              {ogImageUrl ? (
                <Image
                  src={ogImageUrl}
                  alt="OG Image Social"
                  width={160}
                  height={90}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-slate-400 text-center px-2">
                  1200 x 630 px recomendado
                </span>
              )}
              {ogImageUrl && (
                <button
                  type="button"
                  onClick={() => setOgImageUrl('')}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-rose-600 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover OG image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all">
              {isUploadingOgImage ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isUploadingOgImage ? 'Enviando...' : 'Carregar OG (1200x630)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadMedia(e, 'og')}
                disabled={isUploadingOgImage}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Simulador de Card Social (WhatsApp / Instagram) */}
        {ogImageUrl && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              <Image
                src={ogImageUrl}
                alt="Prévia Social"
                width={96}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Prévia do Compartilhamento no WhatsApp
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                Leidy Boutique | Curadoria Exclusiva em Moda Feminina
              </h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {slogan}
              </p>
            </div>
          </div>
        )}

        {/* Slogan da Boutique */}
        <div className="pt-2 text-xs">
          <label className="block text-slate-700 mb-1 font-bold">Slogan Oficial da Boutique</label>
          <div className="relative">
            <Type className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ex: Moda Feminina Autêntica & Elegância Diária"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Frase de impacto exibida no subtítulo da vitrine e nas tags de compartilhamento social.
          </span>
        </div>
      </div>

      {/* BLOCO 2: PLANO DE FUNDO GERAL DO SITE (STOREFRONT ATMOSPHERE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                2. Atmosfera & Plano de Fundo da Loja
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Home & Catálogo
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Selecione o plano de fundo da loja. Ele é aplicado de forma contínua e imersiva na página inicial e no catálogo.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Modo Atual: <strong className="text-slate-900 capitalize">{siteBgTipo === 'solido' ? 'Cor Sólida (Inativo)' : siteBgTipo}</strong>
          </div>
        </div>

        {/* Galeria de Opções de Fundo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Galeria de Fundos Disponíveis
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* OPÇÃO 1: Fundo Oficial Leidy Boutique */}
            <div
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-3 transition-all',
                siteBgTipo === 'imagem' && (siteBgImageUrl === '/images/plano-de-fundo.webp' || siteBgImageUrl === '/images/plano-de-fundo.jpg' || !siteBgImageUrl)
                  ? 'border-amber-600 bg-amber-50/30 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-200/80 mb-3 group">
                <Image
                  src="/images/plano-de-fundo.webp"
                  alt="Plano de Fundo Oficial Leidy Boutique"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/25" />
                <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Oficial Leidy
                </span>
                {siteBgTipo === 'imagem' && (siteBgImageUrl === '/images/plano-de-fundo.webp' || siteBgImageUrl === '/images/plano-de-fundo.jpg' || !siteBgImageUrl) && (
                  <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Boutique & Jardim Vertical</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                    Foto do acervo oficial com jardim verde e espelhos dourados.
                  </p>
                </div>

                <div className="pt-3">
                  {siteBgTipo === 'imagem' && (siteBgImageUrl === '/images/plano-de-fundo.webp' || siteBgImageUrl === '/images/plano-de-fundo.jpg' || !siteBgImageUrl) ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 px-2 bg-amber-600/10 text-amber-800 border border-amber-600/30 text-[11px] font-bold rounded-lg cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      Em Uso na Loja
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSiteBgTipo('imagem');
                        setSiteBgImageUrl('/images/plano-de-fundo.webp');
                        showToast('Plano de fundo oficial da Leidy Boutique ativado!');
                      }}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Ativar Oficial
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* OPÇÃO 2: Vídeo Atmosférico Oficial */}
            <div
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-3 transition-all',
                siteBgTipo === 'video'
                  ? 'border-amber-600 bg-amber-50/30 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 mb-3 flex items-center justify-center group">
                <div className="absolute inset-0 bg-radial from-amber-950/20 to-black/80" />
                <Film className="w-8 h-8 text-amber-400/80 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Film className="w-2.5 h-2.5" /> Vídeo MP4
                </span>
                {siteBgTipo === 'video' && (
                  <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Vídeo Atmosférico</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                    Movimento sutil e suave contínuo em mudo ao fundo.
                  </p>
                </div>

                <div className="pt-3">
                  {siteBgTipo === 'video' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 px-2 bg-amber-600/10 text-amber-800 border border-amber-600/30 text-[11px] font-bold rounded-lg cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      Em Uso na Loja
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSiteBgTipo('video');
                        if (!siteBgVideoUrl) setSiteBgVideoUrl('/video/plano-de-fundo.mp4');
                        showToast('Vídeo atmosférico ativado!');
                      }}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Ativar Vídeo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* OPÇÃO 3: Imagem Personalizada (Upload R2) */}
            <div
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-3 transition-all',
                siteBgTipo === 'imagem' && siteBgCustomUrl && siteBgImageUrl === siteBgCustomUrl
                  ? 'border-amber-600 bg-amber-50/30 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              {siteBgCustomUrl ? (
                <>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 mb-3 group">
                    <Image
                      src={siteBgCustomUrl}
                      alt="Imagem Personalizada"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-sky-400 border border-sky-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      Personalizada R2
                    </span>
                    {siteBgTipo === 'imagem' && siteBgImageUrl === siteBgCustomUrl && (
                      <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Ativo
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Upload Próprio</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        Armazenada na sua nuvem Cloudflare R2.
                      </p>
                    </div>

                    <div className="pt-2 space-y-1.5">
                      {siteBgTipo === 'imagem' && siteBgImageUrl === siteBgCustomUrl ? (
                        <div className="py-1 px-2 bg-amber-600/10 text-amber-800 border border-amber-600/30 text-[11px] font-bold rounded-lg text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 text-amber-600" /> Em Uso
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSiteBgTipo('imagem');
                            setSiteBgImageUrl(siteBgCustomUrl);
                            showToast('Imagem personalizada ativada!');
                          }}
                          className="w-full py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Ativar Esta Imagem
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        <label className="flex-1 py-1 px-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[10px] cursor-pointer text-center flex items-center justify-center gap-1 transition-colors">
                          {isUploadingBgImage ? <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" /> : <Upload className="w-2.5 h-2.5" />}
                          <span>{isUploadingBgImage ? 'Enviando...' : 'Substituir'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadMedia(e, 'site_bg')}
                            disabled={isUploadingBgImage}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveCustomBgImage}
                          title="Excluir imagem personalizada"
                          className="p-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-between items-center text-center p-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mt-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Nova Imagem Própria</h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Envie qualquer foto ou textura (PNG, JPG, WebP) para o R2.
                    </p>
                  </div>
                  <label className="w-full mt-3 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                    {isUploadingBgImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isUploadingBgImage ? 'Enviando...' : 'Carregar Imagem'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadMedia(e, 'site_bg')}
                      disabled={isUploadingBgImage}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* OPÇÃO 4: Cor Sólida / Inativar Imagens */}
            <div
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-3 transition-all',
                siteBgTipo === 'solido'
                  ? 'border-amber-600 bg-amber-50/30 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div
                className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 mb-3 flex items-center justify-center shadow-inner"
                style={{ backgroundColor: siteBgLight }}
              >
                <div className="w-16 h-12 rounded-lg bg-black/5 border border-black/10 flex flex-col items-center justify-center p-1 text-center">
                  <Palette className="w-4 h-4 text-slate-700 mb-0.5" />
                  <span className="text-[8px] font-mono text-slate-600">{siteBgLight}</span>
                </div>
                <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-slate-200 border border-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md">
                  Minimalista
                </span>
                {siteBgTipo === 'solido' && (
                  <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Cor Sólida / Neutro</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                    Inativa fotos e vídeos, exibindo fundo liso minimalista.
                  </p>
                </div>

                <div className="pt-3">
                  {siteBgTipo === 'solido' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 px-2 bg-amber-600/10 text-amber-800 border border-amber-600/30 text-[11px] font-bold rounded-lg cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      Em Uso na Loja
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSiteBgTipo('solido');
                        showToast('Plano de fundo definido para cor sólida.');
                      }}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Inativar Mídias
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Ajustes Avançados de Atmosfera: Overlay de Contraste e Cores Base */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Slider de Opacidade do Overlay (quando imagem ou vídeo) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Contraste & Escurecimento (Overlay)
                </span>
                <span className="text-[11px] text-slate-500">
                  Controla a camada escura sobre a foto/vídeo para máxima legibilidade dos textos e vestidos.
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                {siteBgOverlay}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="80"
              value={siteBgOverlay}
              onChange={(e) => setSiteBgOverlay(Number(e.target.value))}
              disabled={siteBgTipo === 'solido'}
              className="w-full accent-amber-600 cursor-pointer disabled:opacity-40"
            />

            {/* Prévia interativa em tempo real */}
            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-300">
              {siteBgTipo === 'imagem' ? (
                <Image
                  src={siteBgImageUrl || '/images/plano-de-fundo.webp'}
                  alt="Prévia de Fundo"
                  fill
                  className="object-cover"
                />
              ) : siteBgTipo === 'video' ? (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                  <Film className="w-8 h-8 text-amber-400/40" />
                </div>
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: siteBgLight }} />
              )}
              {siteBgTipo !== 'solido' && (
                <div
                  className="absolute inset-0 bg-black backdrop-blur-[0.5px] transition-opacity"
                  style={{ opacity: siteBgOverlay / 100 }}
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-white text-xs font-serif font-bold drop-shadow">
                  LEIDY BOUTIQUE
                </span>
                <span className="text-amber-300 text-[10px] font-sans drop-shadow">
                  Prévia de Legibilidade com {siteBgTipo === 'solido' ? '0' : siteBgOverlay}% de Overlay
                </span>
              </div>
            </div>
          </div>

          {/* Configuração de Cores Base / Sólidas */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Cores Base do Site (Carregamento & Modo Sólido)
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Modo Claro */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-500" /> Claro
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">{siteBgLight}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={siteBgLight}
                    onChange={(e) => setSiteBgLight(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <div className="flex gap-1">
                    {['#FAF8F5', '#FFFFFF', '#F5F2EB'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSiteBgLight(c)}
                        className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modo Escuro */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-500" /> Escuro
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">{siteBgDark}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={siteBgDark}
                    onChange={(e) => setSiteBgDark(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <div className="flex gap-1">
                    {['#121110', '#1A1918', '#0D0C0B'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSiteBgDark(c)}
                        className="w-5 h-5 rounded border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Campo URL do Vídeo (quando tipo vídeo estiver selecionado) */}
            {siteBgTipo === 'video' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block">
                  URL do Vídeo MP4
                </label>
                <input
                  type="text"
                  placeholder="/video/plano-de-fundo.mp4"
                  value={siteBgVideoUrl}
                  onChange={(e) => setSiteBgVideoUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* BLOCO 3: PLANO DE FUNDO DO MENU SUPERIOR (HEADER) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              3. Plano de Fundo do Menu Superior (Header da Vitrine)
            </h2>
            <p className="text-[11px] text-slate-500">
              Personalize o comportamento do cabeçalho da loja sobre o banner e durante a rolagem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMenuBgTipo('transparente')}
            className={cn(
              'p-3.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              menuBgTipo === 'transparente'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <Eye className="w-4 h-4" />
            <span>Transparente Dinâmico</span>
            <span className="text-[10px] font-normal opacity-80">
              Fundo limpo sobre o banner hero
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMenuBgTipo('blur')}
            className={cn(
              'p-3.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              menuBgTipo === 'blur'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Vidro Fosco (Backdrop Blur)</span>
            <span className="text-[10px] font-normal opacity-80">
              Efeito translúcido contemporâneo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMenuBgTipo('solido')}
            className={cn(
              'p-3.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              menuBgTipo === 'solido'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Cor Sólida Personalizada</span>
            <span className="text-[10px] font-normal opacity-80">
              Fundo opaco definido
            </span>
          </button>
        </div>

        {/* Cores do Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Cor do Menu Modo Claro
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={menuBgLight}
                onChange={(e) => setMenuBgLight(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={menuBgLight}
                onChange={(e) => setMenuBgLight(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Cor do Menu Modo Escuro
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={menuBgDark}
                onChange={(e) => setMenuBgDark(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={menuBgDark}
                onChange={(e) => setMenuBgDark(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 4: FAIXA SUPERIOR DE AVISOS (ANNOUNCEMENT BAR) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                4. Faixa Superior de Avisos da Vitrine (Announcement Bar)
              </h2>
              <p className="text-[11px] text-slate-500">
                A faixa de destaque exibida no topo absoluto do site (frete grátis, avisos promocionais e atendimento).
              </p>
            </div>
          </div>

          <Link
            href="/admin/banners#editor-barra-avisos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-xs font-semibold rounded-xl border border-amber-500/30 transition-colors w-fit"
          >
            <span>Personalizar Barra em Banners & Topo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Prévia da Barra Atual */}
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Prévia da Barra Ativa na Vitrine:</span>
            <span className="text-[10px] text-slate-400">Sincronizada em tempo real via Supabase</span>
          </div>

          <div
            className="py-2 px-4 rounded-lg text-center text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
            style={{
              backgroundColor: currentTenant?.configuracoes_visuais?.barra_aviso_estilo?.bg_light || '#1A1918',
              color: currentTenant?.configuracoes_visuais?.barra_aviso_estilo?.text_light || '#ffffff',
              fontFamily: currentTenant?.configuracoes_visuais?.barra_aviso_estilo?.font_family || "'Montserrat', sans-serif"
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {currentTenant?.configuracoes_visuais?.barra_aviso ||
                'Frete Grátis para todo o Brasil acima de R$ 350 | Atendimento VIP via WhatsApp'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            💡 Dica: Você pode alterar a cor de fundo, cor do texto, fonte e escolher entre ícones como caminhão, presente ou coração diretamente no módulo de Banners & Topo.
          </p>
        </div>
      </div>

      {/* BLOCO 5: TIPOGRAFIA & CORES DO MENU DA VITRINE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              5. Tipografia & Cores Usadas no Menu Superior
            </h2>
            <p className="text-[11px] text-slate-500">
              Personalize a fonte tipográfica, tamanho e cores dos links do cabeçalho da vitrine para modo claro e escuro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Família Tipográfica */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Fonte Tipográfica do Menu</span>
            <select
              value={menuFontFamily}
              onChange={(e) => setMenuFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="Montserrat">Montserrat (Moderno & Legível)</option>
              <option value="Playfair Display">Playfair Display (Alta Costura & Serifado)</option>
              <option value="Cinzel">Cinzel (Luxo & Joalheria)</option>
              <option value="Cormorant Garamond">Cormorant Garamond (Clássico Refinado)</option>
              <option value="Inter">Inter (Clean & Minimalista)</option>
              <option value="Poppins">Poppins (Geométrico Contemporâneo)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              Aplica-se à Linha 1, Linha 2 e à Gaveta Lateral Mobile.
            </span>
          </div>

          {/* Tamanho da Fonte */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Tamanho da Fonte</span>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {['11px', '12px', '13px'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setMenuFontSize(sz)}
                  className={cn(
                    'py-2 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer',
                    menuFontSize === sz
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              12px é o padrão ouro de elegância e equilíbrio visual.
            </span>
          </div>

          {/* Cor de Destaque no Hover */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Cor de Destaque no Hover</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={menuCorHoverLight}
                onChange={(e) => setMenuCorHoverLight(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={menuCorHoverLight}
                onChange={(e) => setMenuCorHoverLight(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Cor do link ao passar o mouse ou quando ativo.
            </span>
          </div>
        </div>

        {/* Cores de Texto do Menu Modo Claro e Escuro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Cor dos Links (Modo Claro)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={menuCorTextoLight}
                onChange={(e) => setMenuCorTextoLight(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={menuCorTextoLight}
                onChange={(e) => setMenuCorTextoLight(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              Cor dos Links (Modo Escuro / Hero)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={menuCorTextoDark}
                onChange={(e) => setMenuCorTextoDark(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={menuCorTextoDark}
                onChange={(e) => setMenuCorTextoDark(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
          </div>
        </div>

        {/* Prévia Interativa do Menu */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Prévia em Tempo Real dos Links do Menu
          </span>
          <div
            className="flex items-center gap-6 py-2 overflow-x-auto"
            style={{ fontFamily: menuFontFamily, fontSize: menuFontSize }}
          >
            <span style={{ color: menuCorHoverLight }} className="font-semibold cursor-pointer">
              Lançamentos 2026
            </span>
            <span style={{ color: menuCorTextoDark }} className="opacity-90 hover:opacity-100 cursor-pointer">
              Alfaiataria
            </span>
            <span style={{ color: menuCorTextoDark }} className="opacity-90 hover:opacity-100 cursor-pointer">
              Tricots Nobres
            </span>
            <span style={{ color: menuCorTextoDark }} className="opacity-90 hover:opacity-100 cursor-pointer">
              Linho Puro
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5A059] text-black uppercase">
              BAZAR OFF
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 6: TIPOGRAFIAS E CORES POR SEÇÃO DA VITRINE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                6. Tipografias & Cores Usadas no Site por Seção
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure se todas as seções compartilham o mesmo estilo ou se cada uma terá plano de fundo, fonte e cores exclusivas.
              </p>
            </div>
          </div>

          {/* Toggle de Modo Unificado vs Independente */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSecoesModoIndependente(false)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                !secoesModoIndependente
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Tudo Igual (Unificado)
            </button>
            <button
              type="button"
              onClick={() => setSecoesModoIndependente(true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                secoesModoIndependente
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Diferente por Seção
            </button>
          </div>
        </div>

        {/* Configuração Global / Padrão */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">
              {!secoesModoIndependente
                ? 'Estilo Padrão (Aplicado a Todas as Seções da Home)'
                : 'Estilo Padrão (Fallback Geral)'}
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
              Global
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Fonte dos Títulos</label>
              <select
                value={secaoGlobalFont}
                onChange={(e) => setSecaoGlobalFont(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Playfair Display">Playfair Display (Serifada Luxo)</option>
                <option value="Montserrat">Montserrat (Contemporânea)</option>
                <option value="Cinzel">Cinzel (Clássica Romana)</option>
                <option value="Cormorant Garamond">Cormorant Garamond (Elegante)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cor do Título (Claro)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={secaoGlobalTituloLight}
                  onChange={(e) => setSecaoGlobalTituloLight(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={secaoGlobalTituloLight}
                  onChange={(e) => setSecaoGlobalTituloLight(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cor do Título (Escuro)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={secaoGlobalTituloDark}
                  onChange={(e) => setSecaoGlobalTituloDark(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={secaoGlobalTituloDark}
                  onChange={(e) => setSecaoGlobalTituloDark(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção (Opcional)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={secaoGlobalBgDark || '#121110'}
                  onChange={(e) => setSecaoGlobalBgDark(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSecaoGlobalBgLight('');
                    setSecaoGlobalBgDark('');
                  }}
                  className="text-[10px] text-slate-500 underline cursor-pointer"
                >
                  Transparente
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customização Granular por Seção (se modo independente estiver ativo) */}
        {secoesModoIndependente && (
          <div className="space-y-4 pt-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Personalização Individual das Seções da Home
            </h3>

            {/* 1. Lançamentos Exclusivos */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sec-lanc"
                    checked={secaoLancamentosAtivo}
                    onChange={(e) => setSecaoLancamentosAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="sec-lanc" className="font-bold text-slate-900 cursor-pointer">
                    1. Seção Lançamentos Exclusivos (#lancamentos)
                  </label>
                </div>
                <span className="text-[10px] text-slate-400">
                  {secaoLancamentosAtivo ? 'Customizado' : 'Herdando padrão global'}
                </span>
              </div>

              {secaoLancamentosAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fonte do Título</label>
                    <select
                      value={secaoLancamentosFont}
                      onChange={(e) => setSecaoLancamentosFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Cinzel">Cinzel</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cor do Título</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoLancamentosTituloDark}
                        onChange={(e) => setSecaoLancamentosTituloDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={secaoLancamentosTituloDark}
                        onChange={(e) => setSecaoLancamentosTituloDark(e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoLancamentosBgDark || '#141312'}
                        onChange={(e) => setSecaoLancamentosBgDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSecaoLancamentosBgDark('')}
                        className="text-[10px] text-slate-500 underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Mais Vendidos */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sec-mv"
                    checked={secaoMaisVendidosAtivo}
                    onChange={(e) => setSecaoMaisVendidosAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="sec-mv" className="font-bold text-slate-900 cursor-pointer">
                    2. Seção Mais Vendidos (#mais-vendidos)
                  </label>
                </div>
                <span className="text-[10px] text-slate-400">
                  {secaoMaisVendidosAtivo ? 'Customizado' : 'Herdando padrão global'}
                </span>
              </div>

              {secaoMaisVendidosAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fonte do Título</label>
                    <select
                      value={secaoMaisVendidosFont}
                      onChange={(e) => setSecaoMaisVendidosFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Cinzel">Cinzel</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cor do Título</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoMaisVendidosTituloDark}
                        onChange={(e) => setSecaoMaisVendidosTituloDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={secaoMaisVendidosTituloDark}
                        onChange={(e) => setSecaoMaisVendidosTituloDark(e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoMaisVendidosBgDark || '#141312'}
                        onChange={(e) => setSecaoMaisVendidosBgDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSecaoMaisVendidosBgDark('')}
                        className="text-[10px] text-slate-500 underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. OUTLET */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sec-outlet"
                    checked={secaoOutletAtivo}
                    onChange={(e) => setSecaoOutletAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="sec-outlet" className="font-bold text-slate-900 cursor-pointer">
                    3. Seção OUTLET & BAZAR (#outlet)
                  </label>
                </div>
                <span className="text-[10px] text-slate-400">
                  {secaoOutletAtivo ? 'Customizado' : 'Herdando padrão global'}
                </span>
              </div>

              {secaoOutletAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fonte do Título</label>
                    <select
                      value={secaoOutletFont}
                      onChange={(e) => setSecaoOutletFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Cinzel">Cinzel</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cor do Título</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoOutletTituloDark}
                        onChange={(e) => setSecaoOutletTituloDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={secaoOutletTituloDark}
                        onChange={(e) => setSecaoOutletTituloDark(e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoOutletBgDark || '#141312'}
                        onChange={(e) => setSecaoOutletBgDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSecaoOutletBgDark('')}
                        className="text-[10px] text-slate-500 underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Últimas Peças */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sec-up"
                    checked={secaoUltimasPecasAtivo}
                    onChange={(e) => setSecaoUltimasPecasAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="sec-up" className="font-bold text-slate-900 cursor-pointer">
                    4. Seção Últimas Peças (#ultimas-pecas)
                  </label>
                </div>
                <span className="text-[10px] text-slate-400">
                  {secaoUltimasPecasAtivo ? 'Customizado' : 'Herdando padrão global'}
                </span>
              </div>

              {secaoUltimasPecasAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fonte do Título</label>
                    <select
                      value={secaoUltimasPecasFont}
                      onChange={(e) => setSecaoUltimasPecasFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Cinzel">Cinzel</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cor do Título</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoUltimasPecasTituloDark}
                        onChange={(e) => setSecaoUltimasPecasTituloDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={secaoUltimasPecasTituloDark}
                        onChange={(e) => setSecaoUltimasPecasTituloDark(e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secaoUltimasPecasBgDark || '#141312'}
                        onChange={(e) => setSecaoUltimasPecasBgDark(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSecaoUltimasPecasBgDark('')}
                        className="text-[10px] text-slate-500 underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BLOCO: EXIBIÇÃO DE ESTOQUE PARA O CONSUMIDOR NA VITRINE & MODAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Exibição de Estoque para o Consumidor
                </h2>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Global
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Escolha se o catálogo e o modal de produtos devem expor a quantidade numérica exata de peças restantes aos clientes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExibirQuantidadeEstoqueConsumidor(!exibirQuantidadeEstoqueConsumidor)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer',
              exibirQuantidadeEstoqueConsumidor
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            )}
          >
            {exibirQuantidadeEstoqueConsumidor ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-600" />
                <span>Exibindo Quantidade Exata</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-slate-400" />
                <span>Quantidade Oculta ao Cliente</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">
            {exibirQuantidadeEstoqueConsumidor ? (
              <span className="text-emerald-700">✓ Modo Transparente Ativo:</span>
            ) : (
              <span className="text-slate-700">🔒 Modo Sigilo Comercial Ativo:</span>
            )}
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
            {exibirQuantidadeEstoqueConsumidor ? (
              <>
                <li>Quando restarem 5 peças ou menos no estoque real, o catálogo mostrará: <strong className="text-slate-700">&quot;Restam X peças&quot;</strong> ou <strong className="text-slate-700">&quot;Última peça&quot;</strong>.</li>
                <li>No modal de produto, o cliente verá a contagem precisa da variação selecionada (ex: <strong className="text-slate-700">&quot;Últimas 2 unidades deste tamanho&quot;</strong>).</li>
                <li>Peças com estoque abundante (mais de 5 unidades) não criam falsa urgência e exibem <strong className="text-slate-700">&quot;Disponível em estoque&quot;</strong>.</li>
              </>
            ) : (
              <>
                <li>O sistema <strong className="text-slate-700">nunca expõe números exatos</strong> aos visitantes. Não haverá selos de &quot;Restam 2 peças&quot;.</li>
                <li>Quando a peça estiver com estoque baixo (&le; 5), o selo será apenas <strong className="text-slate-700">&quot;Últimas peças&quot;</strong> sem revelar quantidade.</li>
                <li>No modal, informa com elegância apenas <strong className="text-slate-700">&quot;Disponível em estoque para envio imediato&quot;</strong> ou <strong className="text-slate-700">&quot;Últimas unidades em estoque&quot;</strong>.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* BLOCO 7: CUSTOMIZAÇÃO DO PAINEL ADMINISTRATIVO (PÁGINAS, FONTES, BOTÕES E SIDEBAR) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              7. Customização Avançada do Painel Administrativo
            </h2>
            <p className="text-[11px] text-slate-500">
              Controle o plano de fundo das páginas, tipografia do sistema, formato dos botões e cores da barra lateral.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Fundo das Páginas Admin */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Plano de Fundo das Páginas</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminPageBgLight}
                onChange={(e) => setAdminPageBgLight(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminPageBgLight}
                onChange={(e) => setAdminPageBgLight(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Fundo do corpo do dashboard admin.
            </span>
          </div>

          {/* Tipografia do Admin */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Tipografia do Painel Admin</span>
            <select
              value={adminFontFamily}
              onChange={(e) => setAdminFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="Inter">Inter (Padrão Executivo)</option>
              <option value="Montserrat">Montserrat (Geométrico)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Tech)</option>
              <option value="Poppins">Poppins (Arredondado)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              Fonte de títulos, tabelas e cards do admin.
            </span>
          </div>

          {/* Formato dos Botões Padrão */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Formato dos Botões</span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {[
                { label: 'Quadrado', val: 'rounded-none' },
                { label: 'Médio', val: 'rounded-lg' },
                { label: 'Suave', val: 'rounded-xl' },
                { label: 'Pílula', val: 'rounded-full' }
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setAdminButtonRadius(r.val as any)}
                  className={cn(
                    'py-1.5 px-2 rounded-md border text-[11px] font-bold text-center transition-all cursor-pointer',
                    adminButtonRadius === r.val
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Curvatura dos botões de ação e modais.
            </span>
          </div>

          {/* Fundo do Menu Admin (Sidebar) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-bold text-slate-800 block">Cor Fundo do Menu Admin</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adminSidebarBg}
                onChange={(e) => setAdminSidebarBg(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminSidebarBg}
                onChange={(e) => setAdminSidebarBg(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white uppercase w-28"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Cor customizada da barra lateral esquerda.
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 4: PALETAS DO PAINEL ADMINISTRATIVO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  4. Paleta Visual do Painel Administrativo
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400">
                  {paletteConfig.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                A paleta selecionada altera instantaneamente a barra lateral, destaques e acentos de cor do painel.
              </p>
            </div>
          </div>
        </div>

        {/* Grade de Paletas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePalettes.map((item) => {
            const isSelected = palette === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectPalette(item.id)}
                className={cn(
                  'rounded-2xl border-2 p-4 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md',
                  isSelected
                    ? 'border-slate-900 bg-slate-50/50 shadow-sm ring-2 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-amber-400 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Ativa</span>
                  </div>
                )}

                <div>
                  {/* Amostra Visual */}
                  <div className="w-full h-20 rounded-xl border border-slate-200 overflow-hidden flex shadow-inner mb-3">
                    <div
                      className="w-1/3 h-full p-2 flex flex-col justify-between"
                      style={{ backgroundColor: item.colors.sidebarBg }}
                    >
                      <div className="w-full h-1.5 rounded bg-white/20" />
                      <div
                        className="w-full h-1.5 rounded"
                        style={{ backgroundColor: item.colors.accent }}
                      />
                      <div className="w-2/3 h-1.5 rounded bg-white/20" />
                    </div>
                    <div className="w-2/3 h-full bg-[#F8FAFC] p-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-1/3 h-2 rounded bg-slate-200" />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.colors.accent }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-5 rounded bg-white border border-slate-200" />
                        <div className="h-5 rounded bg-white border border-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      {item.name}
                    </h3>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: item.colors.sidebarBg }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: item.colors.accent }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPalette(item.id);
                    }}
                    className={cn(
                      'text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                      isSelected
                        ? 'bg-slate-900 text-amber-400'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    )}
                  >
                    {isSelected ? 'Em Uso' : 'Aplicar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCO: SINALIZADORES COMERCIAIS DA VITRINE (BADGES) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              Sinalizadores Comerciais da Vitrine (Badges)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize cores oficiais, nomes e emojis das tags que aparecem sobre as fotos das peças na loja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSinalizadoresModalOpen(true)}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-amber-700" />
            <span>Gerenciar Cores & Badges Globais</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600">Badges ativos da boutique:</span>
          {((currentTenant as any)?.configuracoes_visuais?.atributos_pecas?.sinalizadores || []).map((s: any) => (
            <div
              key={s.id}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1"
              style={{ backgroundColor: s.cor || s.color || '#C5A059', color: s.textColor || '#ffffff' }}
            >
              <span>{s.icone || s.icon || '✨'}</span>
              <span>{s.nome || s.label}</span>
            </div>
          ))}
        </div>
      </div>

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
          <span>{isSaving ? 'Salvando...' : 'Salvar Identidade Visual, Tipografias & Seções'}</span>
        </button>
      </div>

      {/* MODAL DE SINALIZADORES */}
      {isSinalizadoresModalOpen && (
        <AdminSinalizadoresModal
          isOpen={isSinalizadoresModalOpen}
          onClose={() => setIsSinalizadoresModalOpen(false)}
          tenantId={tenantId}
          onUpdated={() => {
            refreshProducts();
          }}
        />
      )}
    </form>
  );
}
