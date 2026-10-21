'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Trash2
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme, AdminPaletteKey } from '@/context/AdminThemeContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  PlanoFundoMenuConfig,
  PlanoFundoSiteConfig
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AppearanceSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { palette, setPalette, availablePalettes, paletteConfig } = useAdminTheme();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
  const [siteBgVideoUrl, setSiteBgVideoUrl] = useState('');
  const [siteBgOverlay, setSiteBgOverlay] = useState(40);

  // Plano de Fundo do Menu
  const [menuBgTipo, setMenuBgTipo] = useState<'transparente' | 'blur' | 'solido'>('transparente');
  const [menuBgLight, setMenuBgLight] = useState('#FAF8F5');
  const [menuBgDark, setMenuBgDark] = useState('#141312');

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
            setSiteBgVideoUrl(data.planoFundoSite.video_url || '');
            setSiteBgOverlay(data.planoFundoSite.overlay_opacidade ?? 40);
          }

          if (data.planoFundoMenu) {
            setMenuBgTipo(data.planoFundoMenu.tipo || 'transparente');
            setMenuBgLight(data.planoFundoMenu.bg_light || '#FAF8F5');
            setMenuBgDark(data.planoFundoMenu.bg_dark || '#141312');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const planoFundoSite: PlanoFundoSiteConfig = {
        tipo: siteBgTipo,
        bg_light: siteBgLight,
        bg_dark: siteBgDark,
        imagem_url: siteBgImageUrl || undefined,
        video_url: siteBgVideoUrl || undefined,
        overlay_opacidade: siteBgOverlay
      };

      const planoFundoMenu: PlanoFundoMenuConfig = {
        tipo: menuBgTipo,
        bg_light: menuBgLight,
        bg_dark: menuBgDark
      };

      const res = await saveStoreGeneralSettings(tenantId, {
        logoUrl: logoUrl.trim(),
        logoDarkUrl: logoDarkUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        ogImageUrl: ogImageUrl.trim(),
        slogan: slogan.trim(),
        planoFundoSite,
        planoFundoMenu
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Plano de Fundo Geral do Site
            </h2>
            <p className="text-[11px] text-slate-500">
              Escolha entre cor sólida nobre, textura fotográfica ou atmosfera em vídeo leve para o fundo da boutique.
            </p>
          </div>
        </div>

        {/* Seleção do Tipo de Fundo */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSiteBgTipo('solido')}
            className={cn(
              'p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              siteBgTipo === 'solido'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Sólido / Gradiente</span>
          </button>

          <button
            type="button"
            onClick={() => setSiteBgTipo('imagem')}
            className={cn(
              'p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              siteBgTipo === 'imagem'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagem / Textura</span>
          </button>

          <button
            type="button"
            onClick={() => setSiteBgTipo('video')}
            className={cn(
              'p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
              siteBgTipo === 'video'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
            )}
          >
            <Film className="w-4 h-4" />
            <span>Vídeo Atmosférico</span>
          </button>
        </div>

        {/* Opções de Cor Sólida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Cor Fundo Modo Claro
              </span>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {siteBgLight}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={siteBgLight}
                onChange={(e) => setSiteBgLight(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <div className="flex gap-1.5 flex-wrap">
                {['#FAF8F5', '#FFFFFF', '#F5F2EB', '#FDFBF7'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSiteBgLight(c)}
                    className="w-7 h-7 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                Cor Fundo Modo Escuro
              </span>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {siteBgDark}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={siteBgDark}
                onChange={(e) => setSiteBgDark(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <div className="flex gap-1.5 flex-wrap">
                {['#121110', '#1A1918', '#0D0C0B', '#181716'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSiteBgDark(c)}
                    className="w-7 h-7 rounded-md border border-slate-700 shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload de Imagem de Fundo se o tipo for imagem */}
        {siteBgTipo === 'imagem' && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Imagem / Fotografia de Fundo (Cloudflare R2)
                </span>
                <span className="text-[11px] text-slate-500">
                  Ideal textura de linho, mármore ou foto suave da boutique física.
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all">
                {isUploadingBgImage ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-3 h-3 text-amber-400" />
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

            {siteBgImageUrl && (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-300">
                <Image
                  src={siteBgImageUrl}
                  alt="Plano de Fundo da Loja"
                  fill
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: siteBgOverlay / 100 }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">
                  Prévia com Overlay de {siteBgOverlay}%
                </div>
              </div>
            )}

            {/* Slider de Opacidade do Overlay */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Escurecimento / Contraste do Overlay</span>
                <span>{siteBgOverlay}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={siteBgOverlay}
                onChange={(e) => setSiteBgOverlay(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Vídeo de Fundo */}
        {siteBgTipo === 'video' && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
            <label className="block text-slate-800 font-bold">
              URL do Vídeo MP4 Atmosférico
            </label>
            <input
              type="text"
              placeholder="Ex: https://pub-xxx.r2.dev/video-atmosfera.mp4"
              value={siteBgVideoUrl}
              onChange={(e) => setSiteBgVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
            />
            <span className="text-[10px] text-slate-500">
              O vídeo será reproduzido em mudo contínuo ao fundo, transmitindo requinte boutique.
            </span>
          </div>
        )}
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
          <span>{isSaving ? 'Salvando...' : 'Salvar Identidade Visual & Planos de Fundo'}</span>
        </button>
      </div>
    </form>
  );
}
