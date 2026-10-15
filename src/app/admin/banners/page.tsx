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
  Tag,
  ArrowRight
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
  const [titulo, setTitulo] = useState('Curadoria Exclusiva & Sofisticada');
  const [subtitulo, setSubtitulo] = useState('Peças em alfaiataria nobre e tricots selecionados para mulheres que valorizam a elegância.');
  const [ctaTexto, setCtaTexto] = useState('Explorar Coleção Completa');
  const [ctaLink, setCtaLink] = useState('/catalogo');
  const [tipoMidia, setTipoMidia] = useState<'video' | 'image'>('video');
  const [desktopMediaUrl, setDesktopMediaUrl] = useState('/images/hero-desktop.mp4');
  const [mobileMediaUrl, setMobileMediaUrl] = useState('/images/hero-mobile.mp4');

  // Barra de aviso superior
  const [barraAviso, setBarraAviso] = useState('Frete Grátis para todo o Brasil em compras acima de R$ 350 | Atendimento VIP via WhatsApp');

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
        setTitulo(b.titulo || 'Curadoria Exclusiva & Sofisticada');
        setSubtitulo(b.subtitulo || '');
        setCtaTexto(b.cta_texto || 'Explorar Coleção Completa');
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
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-500'
              : 'bg-rose-900 text-rose-100 border border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Vitrine & Hero Banners
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Cloudflare R2 Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize a experiência de entrada da sua loja: vídeos ou fotos cinematográficas separadas para Computador (16:9) e Celular (9:16).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/?loja=leidy-boutique"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            <span>Ver Vitrine Ao Vivo</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={handleSaveBanner}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publicando...' : 'Salvar e Publicar'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveBanner} className="space-y-6 text-xs">
        {/* SEÇÃO 1: MÍDIAS RESPONSIVAS (DESKTOP VS MOBILE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mídia Desktop (16:9) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-600" />
                <span>1. Mídia Desktop (16:9 Panorâmica)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                1920x1080
              </span>
            </div>

            {/* Preview Desktop */}
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
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
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 p-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors block text-center">
              <Upload className={`w-4 h-4 ${uploadingDesktop ? 'animate-bounce text-amber-600' : 'text-slate-500'}`} />
              <span className="text-slate-700 font-bold">
                {uploadingDesktop ? 'Enviando mídia desktop para o R2...' : 'Subir Vídeo ou Foto Desktop (16:9)'}
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,image/*"
                disabled={uploadingDesktop}
                onChange={handleUploadDesktop}
                className="hidden"
              />
            </label>

            <span className="text-[11px] text-slate-400 block text-center">
              CDN Cloudflare R2: <strong className="font-mono text-slate-600 truncate">{desktopMediaUrl}</strong>
            </span>
          </div>

          {/* Mídia Mobile (9:16) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>2. Mídia Mobile (9:16 Celular Vertical)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                1080x1920
              </span>
            </div>

            {/* Preview Mobile */}
            <div className="relative h-64 mx-auto aspect-9/16 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-300 shadow-md">
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
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 p-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors block text-center">
              <Upload className={`w-4 h-4 ${uploadingMobile ? 'animate-bounce text-amber-600' : 'text-slate-500'}`} />
              <span className="text-slate-700 font-bold">
                {uploadingMobile ? 'Enviando mídia mobile para o R2...' : 'Subir Vídeo ou Foto Celular (9:16)'}
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,image/*"
                disabled={uploadingMobile}
                onChange={handleUploadMobile}
                className="hidden"
              />
            </label>

            <span className="text-[11px] text-slate-400 block text-center">
              Ideal para Reels / Shorts e provador vertical no smartphone.
            </span>
          </div>
        </div>

        {/* SEÇÃO 2: TEXTOS, CHAMADAS E BOTÃO CTA */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tag className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 uppercase tracking-wider">
              3. Textos da Chamada & Botão Principal da Vitrine
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Título do Banner</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Curadoria Exclusiva"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Texto do Botão (CTA)</label>
              <input
                type="text"
                value={ctaTexto}
                onChange={(e) => setCtaTexto(e.target.value)}
                placeholder="Ex: Ver Coleção"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 mb-1 font-bold">Subtítulo / Descrição</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Peças nobres em alfaiataria fina e seda pura."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: BARRA DE AVISOS NO TOPO DA VITRINE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 uppercase tracking-wider">
              4. Barra de Avisos Fixa no Topo da Loja
            </h3>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Texto de Destaque Superior</label>
            <input
              type="text"
              value={barraAviso}
              onChange={(e) => setBarraAviso(e.target.value)}
              placeholder="Ex: Frete Grátis para todo o Brasil acima de R$ 350"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Preview da barra */}
          <div className="bg-slate-900 text-amber-300 text-center py-2 px-4 rounded-lg text-xs font-semibold shadow-inner">
            {barraAviso || 'Prévia da barra de avisos da loja'}
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Alterações...' : 'Salvar e Publicar na Vitrine'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
