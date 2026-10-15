'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Eye,
  Save,
  Tag
} from 'lucide-react';
import {
  getAdminHeroBanners,
  saveAdminHeroBanner,
  AdminHeroBanner
} from '@/lib/admin';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminHeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Campos do formulário
  const [activeBannerId, setActiveBannerId] = useState<string | undefined>();
  const [titulo, setTitulo] = useState('Curadoria Exclusiva');
  const [subtitulo, setSubtitulo] = useState('Peças em alfaiataria fina e seda pura para mulheres exigentes.');
  const [ctaTexto, setCtaTexto] = useState('Explorar Coleção');
  const [ctaLink, setCtaLink] = useState('/catalogo');
  const [tipoMidia, setTipoMidia] = useState<'video' | 'image'>('video');
  const [desktopMediaUrl, setDesktopMediaUrl] = useState('/images/hero-desktop.mp4');
  const [mobileMediaUrl, setMobileMediaUrl] = useState('/images/hero-mobile.mp4');

  // Barra de aviso
  const [barraAviso, setBarraAviso] = useState('Frete Grátis para todo o Brasil em compras acima de R$ 350');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAdminHeroBanners(DEFAULT_TENANT_ID);
      setBanners(data);
      if (data.length > 0) {
        const b = data[0];
        setActiveBannerId(b.id);
        setTitulo(b.titulo || 'Curadoria Exclusiva');
        setSubtitulo(b.subtitulo || '');
        setCtaTexto(b.cta_texto || 'Explorar Coleção');
        setCtaLink(b.cta_link || '/catalogo');
        setTipoMidia(b.tipo_midia);
        setDesktopMediaUrl(b.desktop_media_url);
        setMobileMediaUrl(b.mobile_media_url);
      }
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Upload Mídia Desktop 16:9 no Cloudflare R2
  const handleUploadDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesktop(true);
    try {
      const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'banners');
      if (res.success && res.url) {
        setDesktopMediaUrl(res.url);
        if (file.type.startsWith('video/')) setTipoMidia('video');
        showToast('Mídia Desktop enviada com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Falha ao enviar mídia desktop', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro no upload desktop', 'error');
    } finally {
      setUploadingDesktop(false);
    }
  };

  // Upload Mídia Mobile 9:16 no Cloudflare R2
  const handleUploadMobile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMobile(true);
    try {
      const res = await uploadBrowserFileToR2(file, 'leidy-boutique', 'banners');
      if (res.success && res.url) {
        setMobileMediaUrl(res.url);
        showToast('Mídia Mobile (9:16) enviada com sucesso para o Cloudflare R2!');
      } else {
        showToast(res.error || 'Falha ao enviar mídia mobile', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro no upload mobile', 'error');
    } finally {
      setUploadingMobile(false);
    }
  };

  // Salvar Banner no Supabase
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveAdminHeroBanner(
        {
          id: activeBannerId,
          titulo,
          subtitulo,
          cta_texto: ctaTexto,
          cta_link: ctaLink,
          tipo_midia: tipoMidia,
          desktop_media_url: desktopMediaUrl,
          mobile_media_url: mobileMediaUrl,
          ativo: true
        },
        DEFAULT_TENANT_ID
      );

      if (res.success) {
        showToast('Banner Hero atualizado e publicado na vitrine da Leidy Boutique!');
      } else {
        showToast(res.error || 'Erro ao salvar banner.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar banner.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-2">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Vitrine & Hero Banners
            </h1>
            <span className="text-[10px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-2 py-0.5 font-bold uppercase tracking-wider">
              Cloudflare R2
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Personalize a experiência de abertura da sua loja: vídeos ou fotos cinematográficas separadas para Desktop (16:9) e Celular (9:16).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/?loja=leidy-boutique"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-[#DFBE76] text-xs border border-[#DFBE76]/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Vitrine Ao Vivo</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>

      <form onSubmit={handleSaveBanner} className="space-y-6 text-xs">
        {/* SEÇÃO 1: MÍDIAS RESPONSIVAS (DESKTOP VS MOBILE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mídia Desktop (16:9) */}
          <div className="bg-[#1A1918] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#DFBE76]" />
                <span>1. Mídia Desktop (16:9 Horizontal)</span>
              </span>
              <span className="text-[10px] text-[#A8A29E]">Recomendado: 1920x1080</span>
            </div>

            {/* Preview Desktop */}
            <div className="relative aspect-video bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
              {tipoMidia === 'video' ? (
                <video
                  src={desktopMediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={desktopMediaUrl}
                  alt="Preview Desktop"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Upload Button */}
            <label className="border border-dashed border-white/15 hover:border-[#DFBE76] bg-black/40 p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors block text-center">
              <Upload className={`w-4 h-4 ${uploadingDesktop ? 'animate-bounce text-[#DFBE76]' : 'text-[#78716C]'}`} />
              <span className="text-white font-medium">
                {uploadingDesktop ? 'Enviando mídia desktop para o R2...' : 'Subir Vídeo ou Foto Desktop'}
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,image/*"
                disabled={uploadingDesktop}
                onChange={handleUploadDesktop}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={desktopMediaUrl}
              onChange={(e) => setDesktopMediaUrl(e.target.value)}
              placeholder="URL da mídia desktop..."
              className="w-full bg-[#121110] border border-white/10 px-2.5 py-1.5 text-white font-mono text-[11px]"
            />
          </div>

          {/* Mídia Mobile (9:16) */}
          <div className="bg-[#1A1918] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#DFBE76]" />
                <span>2. Mídia Mobile (9:16 Vertical)</span>
              </span>
              <span className="text-[10px] text-[#A8A29E]">Recomendado: 1080x1920</span>
            </div>

            {/* Preview Mobile */}
            <div className="relative h-60 w-36 mx-auto bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shadow-md">
              {tipoMidia === 'video' ? (
                <video
                  src={mobileMediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mobileMediaUrl}
                  alt="Preview Mobile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Upload Button */}
            <label className="border border-dashed border-white/15 hover:border-[#DFBE76] bg-black/40 p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors block text-center">
              <Upload className={`w-4 h-4 ${uploadingMobile ? 'animate-bounce text-[#DFBE76]' : 'text-[#78716C]'}`} />
              <span className="text-white font-medium">
                {uploadingMobile ? 'Enviando mídia mobile para o R2...' : 'Subir Vídeo ou Foto Mobile (9:16)'}
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,image/*"
                disabled={uploadingMobile}
                onChange={handleUploadMobile}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={mobileMediaUrl}
              onChange={(e) => setMobileMediaUrl(e.target.value)}
              placeholder="URL da mídia mobile..."
              className="w-full bg-[#121110] border border-white/10 px-2.5 py-1.5 text-white font-mono text-[11px]"
            />
          </div>
        </div>

        {/* SEÇÃO 2: TEXTOS & BOTÃO DE AÇÃO */}
        <div className="bg-[#1A1918] border border-white/10 p-6 space-y-4">
          <h3 className="font-semibold text-[#DFBE76] uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>3. Textos do Banner & Ação</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A8A29E] mb-1 font-medium">Título Principal</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Curadoria Exclusiva 2026"
                className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white font-serif-luxury text-sm"
              />
            </div>

            <div>
              <label className="block text-[#A8A29E] mb-1 font-medium">Texto do Botão (CTA)</label>
              <input
                type="text"
                value={ctaTexto}
                onChange={(e) => setCtaTexto(e.target.value)}
                placeholder="Ex: Explorar Coleção"
                className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#A8A29E] mb-1 font-medium">Subtítulo / Descrição</label>
              <textarea
                rows={2}
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Peças em alfaiataria fina e seda pura para mulheres exigentes."
                className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#A8A29E] mb-1 font-medium">Link de Destino do Botão</label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="Ex: /catalogo"
                className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[#A8A29E] mb-1 font-medium">Tipo de Mídia Principal</label>
              <select
                value={tipoMidia}
                onChange={(e) => setTipoMidia(e.target.value as 'video' | 'image')}
                className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white"
              >
                <option value="video">Vídeo Cinematográfico (Autoplay)</option>
                <option value="image">Imagem Estática</option>
              </select>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: BARRA DE AVISO SUPERIOR */}
        <div className="bg-[#1A1918] border border-white/10 p-6 space-y-4">
          <h3 className="font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>4. Barra de Notificação Superior da Loja</span>
          </h3>
          <div>
            <label className="block text-[#A8A29E] mb-1 font-medium">Mensagem de Destaque no Topo da Vitrine</label>
            <input
              type="text"
              value={barraAviso}
              onChange={(e) => setBarraAviso(e.target.value)}
              placeholder="Ex: Frete Grátis para todo o Brasil em compras acima de R$ 350"
              className="w-full bg-[#121110] border border-white/15 px-3 py-2 text-white font-medium"
            />
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#DFBE76] to-[#C5A059] text-black font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#DFBE76]/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando no Supabase...' : 'Salvar e Publicar Vitrine'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
