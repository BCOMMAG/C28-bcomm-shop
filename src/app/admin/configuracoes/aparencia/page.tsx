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
  Type
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme, AdminPaletteKey } from '@/context/AdminThemeContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AppearanceSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { palette, setPalette, availablePalettes, paletteConfig } = useAdminTheme();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDarkLogo, setIsUploadingDarkLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  // Mídias da Marca
  const [logoUrl, setLogoUrl] = useState('');
  const [logoDarkUrl, setLogoDarkUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [slogan, setSlogan] = useState('Moda Feminina Autêntica & Elegância Diária');

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
          if (data.slogan) setSlogan(data.slogan);
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

  // Upload de Logotipo
  const handleUploadLogo = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'light' | 'dark' | 'favicon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'light') setIsUploadingLogo(true);
    if (type === 'dark') setIsUploadingDarkLogo(true);
    if (type === 'favicon') setIsUploadingFavicon(true);

    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'logos');
      if (res.success && res.url) {
        if (type === 'light') setLogoUrl(res.url);
        if (type === 'dark') setLogoDarkUrl(res.url);
        if (type === 'favicon') setFaviconUrl(res.url);
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        logoUrl,
        logoDarkUrl,
        faviconUrl,
        slogan: slogan.trim()
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Identidade visual e mídias salvas com sucesso!');
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

      {/* BLOCO 1: SELETOR DE TEMAS VISUAIS DO PAINEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Paleta Visual do Painel Administrativo
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

      {/* BLOCO 2: LOGOTIPOS & FAVICON (CLOUDFLARE R2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Logotipos Oficiais & Favicon (Armazenamento Cloudflare R2)
            </h2>
            <p className="text-[11px] text-slate-500">
              Arquivos de imagem da marca distribuídos via CDN de ultra-velocidade global com taxa zero de saída.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Logo Light */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">Logotipo Principal (Fundo Claro)</span>
              <span className="text-[10px] text-slate-400">Exibido no cabeçalho da vitrine (PNG/SVG transparente)</span>
            </div>

            <div className="w-full h-24 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo Principal"
                  width={140}
                  height={50}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Nenhum logo carregado</span>
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
                onChange={(e) => handleUploadLogo(e, 'light')}
                disabled={isUploadingLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Logo Dark */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">Logotipo Versão Dark (Fundo Escuro)</span>
              <span className="text-[10px] text-slate-400">Exibido na tela de bloqueio e rodapé escuro</span>
            </div>

            <div className="w-full h-24 bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center overflow-hidden p-2">
              {logoDarkUrl ? (
                <Image
                  src={logoDarkUrl}
                  alt="Logo Dark"
                  width={140}
                  height={50}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">Nenhum logo dark</span>
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
                onChange={(e) => handleUploadLogo(e, 'dark')}
                disabled={isUploadingDarkLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Favicon */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">Favicon da Aba</span>
              <span className="text-[10px] text-slate-400">Ícone de 32x32 exibido na aba do navegador</span>
            </div>

            <div className="w-full h-24 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2">
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
                onChange={(e) => handleUploadLogo(e, 'favicon')}
                disabled={isUploadingFavicon}
                className="hidden"
              />
            </label>
          </div>
        </div>

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
          <span>{isSaving ? 'Salvando...' : 'Salvar Identidade Visual'}</span>
        </button>
      </div>
    </form>
  );
}
