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
  ArrowRight,
  Truck,
  Gift,
  Heart,
  Sun,
  Moon,
  Type,
  Palette
} from 'lucide-react';
import {
  getAdminHeroBanners,
  saveAdminHeroBanner,
  saveStoreAnnouncementBar,
  AdminHeroBanner
} from '@/lib/admin';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useStore } from '@/context/StoreContext';
import { BarraAvisoEstilo } from '@/types/database';

export default function AdminBannersPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  const [banners, setBanners] = useState<AdminHeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Campos do formulário (inicializados com a curadoria real da loja)
  const [activeBannerId, setActiveBannerId] = useState<string | undefined>();
  const [titulo, setTitulo] = useState('Coleção Elegance & Alfaiataria');
  const [subtitulo, setSubtitulo] = useState('Curadoria Exclusiva em Moda Feminina');
  const [ctaTexto, setCtaTexto] = useState('Conhecer Coleção');
  const [ctaLink, setCtaLink] = useState('#lancamentos');
  const [tipoMidia, setTipoMidia] = useState<'video' | 'image'>('video');
  const [desktopMediaUrl, setDesktopMediaUrl] = useState('/video/header_video.mp4');
  const [mobileMediaUrl, setMobileMediaUrl] = useState('/video/header_video.mp4');

  // Barra de aviso superior
  const [barraAviso, setBarraAviso] = useState('Frete Grátis para todo o Brasil acima de R$ 350 | Atendimento VIP via WhatsApp');
  const [barraAvisoAtiva, setBarraAvisoAtiva] = useState(true);
  const [barraAvisoModo, setBarraAvisoModo] = useState<'unificado' | 'independente'>('unificado');
  const [barraAvisoBgLight, setBarraAvisoBgLight] = useState('#1A1918');
  const [barraAvisoTextLight, setBarraAvisoTextLight] = useState('#DFBE76');
  const [barraAvisoBgDark, setBarraAvisoBgDark] = useState('#0D0C0B');
  const [barraAvisoTextDark, setBarraAvisoTextDark] = useState('#EED59B');
  const [barraAvisoFont, setBarraAvisoFont] = useState("'Montserrat', sans-serif");
  const [barraAvisoIcone, setBarraAvisoIcone] = useState<'sparkles' | 'truck' | 'gift' | 'heart' | 'tag' | 'none'>('sparkles');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAdminHeroBanners(tenantId);
      setBanners(data);
      if (data.length > 0) {
        const b = data[0];
        setActiveBannerId(b.id);
        setTitulo(b.titulo || 'Coleção Elegance & Alfaiataria');
        setSubtitulo(b.subtitulo || '');
        setCtaTexto(b.cta_texto || 'Conhecer Coleção');
        setCtaLink(b.cta_link || '#lancamentos');
        setTipoMidia(b.tipo_midia);
        setDesktopMediaUrl(b.desktop_media_url);
        setMobileMediaUrl(b.mobile_media_url);
      }

      // Carrega preferências da barra de avisos do Supabase
      const supabase = getSupabaseBrowserClient();
      const { data: loja } = await supabase
        .from('lojas')
        .select('configuracoes_visuais')
        .eq('id', tenantId)
        .maybeSingle();

      if (loja?.configuracoes_visuais) {
        const vis = loja.configuracoes_visuais as any;
        if (vis.barra_aviso) {
          setBarraAviso(vis.barra_aviso);
        }
        if (vis.barra_aviso_ativa !== undefined) {
          setBarraAvisoAtiva(Boolean(vis.barra_aviso_ativa));
        }
        if (vis.barra_aviso_estilo) {
          const est = vis.barra_aviso_estilo;
          if (est.modo) setBarraAvisoModo(est.modo);
          if (est.bg_light) setBarraAvisoBgLight(est.bg_light);
          if (est.text_light) setBarraAvisoTextLight(est.text_light);
          if (est.bg_dark) setBarraAvisoBgDark(est.bg_dark);
          if (est.text_dark) setBarraAvisoTextDark(est.text_dark);
          if (est.font_family) setBarraAvisoFont(est.font_family);
          if (est.icone) setBarraAvisoIcone(est.icone);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [tenantId]);

  // Upload Mídia Desktop 16:9 no Cloudflare R2
  const handleUploadDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesktop(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'banners');
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
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'banners');
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

  // Salvar Banner e Barra de Avisos no Supabase
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const estilo: BarraAvisoEstilo = {
        modo: barraAvisoModo,
        bg_light: barraAvisoBgLight,
        text_light: barraAvisoTextLight,
        bg_dark: barraAvisoBgDark,
        text_dark: barraAvisoTextDark,
        font_family: barraAvisoFont,
        icone: barraAvisoIcone
      };

      const [resBanner, resBarra] = await Promise.all([
        saveAdminHeroBanner(
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
          tenantId
        ),
        saveStoreAnnouncementBar(tenantId, barraAviso, barraAvisoAtiva, estilo)
      ]);

      if (resBanner.success && resBarra.success) {
        if (resBanner.id && !activeBannerId) {
          setActiveBannerId(resBanner.id);
        }
        await fetchBanners();
        showToast(`Banner Hero e Barra Superior atualizados e publicados na vitrine da ${lojaNome}!`);
      } else {
        showToast(resBanner.error || resBarra.error || 'Erro ao salvar alterações.', 'error');
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
            href={tenantSlug ? `/${tenantSlug}/` : '/'}
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                  4. Barra de Avisos Fixa no Topo da Loja
                </h3>
                <p className="text-[11px] text-slate-500">
                  Defina o texto, ícone, tipografia e comportamento de cores para os modos claro e escuro.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={barraAvisoAtiva}
                  onChange={(e) => setBarraAvisoAtiva(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700">
                  {barraAvisoAtiva ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      🟢 Ativa na Vitrine
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      ⏸️ Pausada (Oculta)
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Texto de Mensagem */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold text-xs">Texto do Aviso Superior</label>
            <input
              type="text"
              value={barraAviso}
              onChange={(e) => setBarraAviso(e.target.value)}
              placeholder="Ex: Frete Grátis para todo o Brasil em compras acima de R$ 350 | Atendimento VIP via WhatsApp"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Recomendamos frases concisas com condições de frete grátis, cupons ou canais de atendimento VIP.
            </span>
          </div>

          {/* Ícone & Tipografia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 mb-1.5 font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Ícone Decorativo</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sparkles', label: 'Brilho', Icon: Sparkles },
                  { id: 'truck', label: 'Frete', Icon: Truck },
                  { id: 'gift', label: 'Presente', Icon: Gift },
                  { id: 'heart', label: 'Afeto', Icon: Heart },
                  { id: 'tag', label: 'Oferta', Icon: Tag },
                  { id: 'none', label: 'Nenhum', Icon: Eye }
                ].map((item) => {
                  const isSelected = barraAvisoIcone === item.id;
                  const IconComp = item.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBarraAvisoIcone(item.id as any)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs ring-1 ring-amber-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-bold text-xs flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-600" />
                <span>Família Tipográfica</span>
              </label>
              <select
                value={barraAvisoFont}
                onChange={(e) => setBarraAvisoFont(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="'Montserrat', sans-serif">Montserrat (Moderna & Sofisticada)</option>
                <option value="'Inter', sans-serif">Inter (Minimalista & Ultra-Legível)</option>
                <option value="'Playfair Display', serif">Playfair Display (Serifada Clássica de Luxo)</option>
                <option value="'Cormorant Garamond', serif">Cormorant Garamond (Alta Costura Nobre)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                A fonte é carregada dinamicamente mantendo harmonia com o tema da loja.
              </span>
            </div>
          </div>

          {/* Comportamento de Modo de Cor */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>Comportamento de Cores no Modo Claro e Escuro</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBarraAvisoModo('unificado')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    barraAvisoModo === 'unificado'
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Modo Unificado (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setBarraAvisoModo('independente')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    barraAvisoModo === 'independente'
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Modo Independente
                </button>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Paletas Rápidas de Luxo (1 Clique)
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Ônix & Dourado Champagne', bg: '#1A1918', text: '#DFBE76' },
                  { name: 'Creme Nobre & Preto Puro', bg: '#FAF8F5', text: '#18181B' },
                  { name: 'Rosé Gold & Carvão', bg: '#221C1D', text: '#E0A99A' },
                  { name: 'Terracota & Dourado Suave', bg: '#4A1D16', text: '#FEF3C7' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBarraAvisoBgLight(preset.bg);
                      setBarraAvisoTextLight(preset.text);
                      if (barraAvisoModo === 'independente') {
                        setBarraAvisoBgDark(preset.bg);
                        setBarraAvisoTextDark(preset.text);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: preset.bg }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: preset.text }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Cores */}
            {barraAvisoModo === 'unificado' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Cor de Fundo da Barra</span>
                    <span className="text-[10px] text-slate-400">Exibida em todos os temas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={barraAvisoBgLight}
                      onChange={(e) => setBarraAvisoBgLight(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={barraAvisoBgLight}
                      onChange={(e) => setBarraAvisoBgLight(e.target.value)}
                      className="w-20 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800 uppercase"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Cor do Texto e Ícone</span>
                    <span className="text-[10px] text-slate-400">Contraste sobre o fundo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={barraAvisoTextLight}
                      onChange={(e) => setBarraAvisoTextLight(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={barraAvisoTextLight}
                      onChange={(e) => setBarraAvisoTextLight(e.target.value)}
                      className="w-20 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800 uppercase"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Claro */}
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tema Claro da Vitrine</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Cor de Fundo:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={barraAvisoBgLight}
                        onChange={(e) => setBarraAvisoBgLight(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={barraAvisoBgLight}
                        onChange={(e) => setBarraAvisoBgLight(e.target.value)}
                        className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Cor do Texto:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={barraAvisoTextLight}
                        onChange={(e) => setBarraAvisoTextLight(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={barraAvisoTextLight}
                        onChange={(e) => setBarraAvisoTextLight(e.target.value)}
                        className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Escuro */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Moon className="w-3.5 h-3.5" />
                    <span>Tema Escuro da Vitrine</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Cor de Fundo:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={barraAvisoBgDark}
                        onChange={(e) => setBarraAvisoBgDark(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-600 cursor-pointer p-0.5 bg-slate-800"
                      />
                      <input
                        type="text"
                        value={barraAvisoBgDark}
                        onChange={(e) => setBarraAvisoBgDark(e.target.value)}
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Cor do Texto:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={barraAvisoTextDark}
                        onChange={(e) => setBarraAvisoTextDark(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-600 cursor-pointer p-0.5 bg-slate-800"
                      />
                      <input
                        type="text"
                        value={barraAvisoTextDark}
                        onChange={(e) => setBarraAvisoTextDark(e.target.value)}
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PRÉVIA AO VIVO COM TOGGLE CLARO / ESCURO */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Prévia em Tempo Real no Topo da Loja:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    previewTheme === 'light'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-600" />
                  <span>Modo Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    previewTheme === 'dark'
                      ? 'bg-slate-900 text-amber-400 border border-slate-700'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Modo Escuro</span>
                </button>
              </div>
            </div>

            {barraAvisoAtiva ? (
              (() => {
                const isDark = previewTheme === 'dark';
                const currentBg =
                  barraAvisoModo === 'independente' && isDark
                    ? barraAvisoBgDark
                    : barraAvisoBgLight;
                const currentText =
                  barraAvisoModo === 'independente' && isDark
                    ? barraAvisoTextDark
                    : barraAvisoTextLight;

                return (
                  <div
                    className="p-3 rounded-xl border text-center text-xs font-medium tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: currentBg,
                      color: currentText,
                      borderColor: `${currentText}30`,
                      fontFamily: barraAvisoFont
                    }}
                  >
                    {barraAvisoIcone === 'sparkles' && (
                      <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" style={{ color: currentText }} />
                    )}
                    {barraAvisoIcone === 'truck' && (
                      <Truck className="w-3.5 h-3.5 shrink-0" style={{ color: currentText }} />
                    )}
                    {barraAvisoIcone === 'gift' && (
                      <Gift className="w-3.5 h-3.5 shrink-0" style={{ color: currentText }} />
                    )}
                    {barraAvisoIcone === 'heart' && (
                      <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: currentText }} />
                    )}
                    {barraAvisoIcone === 'tag' && (
                      <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: currentText }} />
                    )}
                    <span className="truncate max-w-[90vw]">
                      {barraAviso || 'Frete Grátis para todo o Brasil | Atendimento VIP'}
                    </span>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-100 text-slate-400 text-center py-3 px-4 rounded-xl text-xs font-semibold border border-dashed border-slate-300">
                ⏸️ Barra de avisos pausada — nenhum banner superior será exibido aos clientes no momento.
              </div>
            )}
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
