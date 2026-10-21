'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Palette,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Play,
  Search,
  Grid,
  Layers,
  Link2,
  PackageCheck,
  Check
} from 'lucide-react';
import {
  getAdminHeroBanners,
  saveAdminHeroBanner,
  deleteAdminHeroBanner,
  toggleAdminHeroBannerStatus,
  reorderAdminHeroBanners,
  saveStoreAnnouncementBar,
  getAdminCategories,
  getAdminProducts,
  AdminHeroBanner,
  AdminProductItem
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
  const [categories, setCategories] = useState<Array<{ id: string; nome: string; slug: string }>>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Modo de formulário: 'novo' ou 'editando'
  const [activeBannerId, setActiveBannerId] = useState<string | undefined>();
  const [titulo, setTitulo] = useState('Coleção Elegance & Alfaiataria');
  const [subtitulo, setSubtitulo] = useState('Curadoria Exclusiva em Moda Feminina');
  const [ctaTexto, setCtaTexto] = useState('Conhecer Coleção');
  const [ctaLink, setCtaLink] = useState('#lancamentos');
  const [tipoMidia, setTipoMidia] = useState<'video' | 'image'>('video');
  const [desktopMediaUrl, setDesktopMediaUrl] = useState('/video/header_video.mp4');
  const [mobileMediaUrl, setMobileMediaUrl] = useState('/video/header_video.mp4');

  // Estado do Construtor Inteligente de Links (Link Picker)
  const [linkPickerType, setLinkPickerType] = useState<'colecao' | 'categoria' | 'produto' | 'custom' | 'none'>('colecao');
  const [productSearchQuery, setProductSearchQuery] = useState('');

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

  const fetchBannersAndCatalog = async () => {
    setLoading(true);
    try {
      const [bannersData, catsData, prodsData] = await Promise.all([
        getAdminHeroBanners(tenantId),
        getAdminCategories(tenantId),
        getAdminProducts(tenantId)
      ]);

      setBanners(bannersData);
      setCategories(catsData);
      setProducts(prodsData);

      if (bannersData.length > 0 && !activeBannerId) {
        selectBannerForEdit(bannersData[0]);
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
      console.error('Erro ao carregar dados da vitrine:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersAndCatalog();
  }, [tenantId]);

  // Carrega os dados de um banner existente para edição
  const selectBannerForEdit = (banner: AdminHeroBanner) => {
    setActiveBannerId(banner.id);
    setTitulo(banner.titulo || '');
    setSubtitulo(banner.subtitulo || '');
    setCtaTexto(banner.cta_texto || 'Conhecer Coleção');
    setCtaLink(banner.cta_link || '#lancamentos');
    setTipoMidia(banner.tipo_midia || 'video');
    setDesktopMediaUrl(banner.desktop_media_url);
    setMobileMediaUrl(banner.mobile_media_url);

    // Identifica o tipo do link
    const link = banner.cta_link || '';
    if (link === '' || link === '#') {
      setLinkPickerType('none');
    } else if (link.startsWith('#')) {
      setLinkPickerType('colecao');
    } else if (link.includes('categoria=')) {
      setLinkPickerType('categoria');
    } else if (link.includes('produto=')) {
      setLinkPickerType('produto');
    } else {
      setLinkPickerType('custom');
    }
  };

  // Prepara formulário para cadastrar um novo banner
  const handleAddNewBanner = () => {
    setActiveBannerId(undefined);
    setTitulo('Nova Coleção');
    setSubtitulo('Destaques Exclusivos com Modelagem Impecável');
    setCtaTexto('Explorar Agora');
    setCtaLink('#lancamentos');
    setTipoMidia('image');
    setDesktopMediaUrl('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop');
    setMobileMediaUrl('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1080&auto=format&fit=crop');
    setLinkPickerType('colecao');

    // Rola suavemente até o editor
    const el = document.getElementById('editor-banner-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Formulário pronto para cadastrar novo banner!');
  };

  // Alternar status ativo/pausado do banner
  const handleToggleBanner = async (banner: AdminHeroBanner, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !banner.ativo;
    const res = await toggleAdminHeroBannerStatus(banner.id, newStatus);
    if (res.success) {
      showToast(newStatus ? 'Banner ativado na vitrine!' : 'Banner pausado com sucesso!');
      await fetchBannersAndCatalog();
    } else {
      showToast(res.error || 'Erro ao alterar status', 'error');
    }
  };

  // Excluir um banner
  const handleDeleteBanner = async (bannerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este banner da vitrine?')) {
      return;
    }
    const res = await deleteAdminHeroBanner(bannerId);
    if (res.success) {
      showToast('Banner removido com sucesso!');
      if (activeBannerId === bannerId) {
        setActiveBannerId(undefined);
      }
      await fetchBannersAndCatalog();
    } else {
      showToast(res.error || 'Erro ao excluir banner', 'error');
    }
  };

  // Reordenar banners (subir ou descer na sequência)
  const handleMoveBanner = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const reordered = [...banners];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Atualiza display_order sequencial
    const payload = reordered.map((b, i) => ({ id: b.id, display_order: i }));
    setBanners(reordered);

    const res = await reorderAdminHeroBanners(payload);
    if (res.success) {
      showToast('Ordem dos banners atualizada!');
    } else {
      showToast(res.error || 'Erro ao salvar reordenação', 'error');
      await fetchBannersAndCatalog();
    }
  };

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
        else if (file.type.startsWith('image/')) setTipoMidia('image');
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
        await fetchBannersAndCatalog();
        showToast(`Banner e Barra Superior salvos e publicados na vitrine da ${lojaNome}!`);
      } else {
        showToast(resBanner.error || resBarra.error || 'Erro ao salvar alterações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar banner.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    (p.nome || '').toLowerCase().includes(productSearchQuery.toLowerCase())
  );

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

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Vitrine & Hero Banners Multi-Rotativos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Cloudflare R2 Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie múltiplos banners com rotação automática em looping (6s), pausa inteligente na interação e links inteligentes para coleções, categorias ou peças únicas.
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
            type="button"
            onClick={handleAddNewBanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Banner</span>
          </button>

          <button
            onClick={handleSaveBanner}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publicando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: GRADE / LISTAGEM DOS BANNERS CADASTRADOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
              1. Banners Cadastrados na Vitrine ({banners.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Looping contínuo a cada 6s • Pausa inteligente de 5s após qualquer clique ou toque
          </span>
        </div>

        {banners.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Nenhum banner cadastrado ainda.</p>
            <button
              type="button"
              onClick={handleAddNewBanner}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Banner</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {banners.map((banner, index) => {
              const isSelected = activeBannerId === banner.id;
              const isBannerVideo = banner.tipo_midia === 'video';

              return (
                <div
                  key={banner.id}
                  onClick={() => selectBannerForEdit(banner)}
                  className={`border-2 rounded-2xl p-4 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/30 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Topo do Card: Ordem e Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-amber-400">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {isBannerVideo ? 'Vídeo MP4' : 'Foto'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleBanner(banner, e)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        banner.ativo
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {banner.ativo ? '🟢 Ativo' : '⏸️ Pausado'}
                    </button>
                  </div>

                  {/* Prévia da Mídia */}
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mb-3 flex items-center justify-center">
                    {isBannerVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <video
                          src={banner.desktop_media_url}
                          muted
                          playsInline
                          className="w-full h-full object-cover opacity-85"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-7 h-7 text-white fill-white/80" />
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={banner.desktop_media_url || '/video/header_poster.jpg'}
                        alt={banner.titulo || 'Banner'}
                        fill
                        className="object-cover"
                      />
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-600 text-white p-1 rounded-full shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Informações de Texto */}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-bold text-slate-900 text-xs truncate">
                      {banner.titulo || 'Sem título'}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {banner.subtitulo || 'Sem subtítulo'}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-semibold text-slate-600 truncate">
                      <Link2 className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{banner.cta_link || 'Sem link'}</span>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-slate-500">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => handleMoveBanner(index, 'up', e)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === banners.length - 1}
                        onClick={(e) => handleMoveBanner(index, 'down', e)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectBannerForEdit(banner)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteBanner(banner.id, e)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                        title="Excluir banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: FORMULÁRIO DO BANNER ATIVO / NOVO BANNER */}
      <form id="editor-banner-form" onSubmit={handleSaveBanner} className="space-y-6 text-xs">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                  {activeBannerId ? '2. Editando Banner Selecionado' : '2. Cadastrando Novo Banner'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Faça o upload das versões para Computador (16:9) e Celular (9:16) e configure o destino do clique.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Tipo de Mídia:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 font-bold text-[11px]">
                <button
                  type="button"
                  onClick={() => setTipoMidia('video')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    tipoMidia === 'video'
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vídeo MP4
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMidia('image')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    tipoMidia === 'image'
                      ? 'bg-slate-900 text-amber-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Imagem
                </button>
              </div>
            </div>
          </div>

          {/* UPLOAD DUPLO (DESKTOP VS MOBILE) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desktop 16:9 */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-amber-600" />
                  <span>Mídia Desktop (16:9 Panorâmica)</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">1920x1080</span>
              </div>

              <div className="w-full aspect-[16/9] bg-slate-900 rounded-lg overflow-hidden border border-slate-300 relative flex items-center justify-center">
                {tipoMidia === 'video' ? (
                  <video
                    src={desktopMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={desktopMediaUrl || '/video/header_poster.jpg'}
                    alt="Preview Desktop"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-all">
                  {uploadingDesktop ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{uploadingDesktop ? 'Enviando...' : 'Subir Arquivo Desktop (R2)'}</span>
                  <input
                    type="file"
                    accept={tipoMidia === 'video' ? 'video/mp4,video/*' : 'image/*'}
                    onChange={handleUploadDesktop}
                    disabled={uploadingDesktop}
                    className="hidden"
                  />
                </label>
              </div>
              <input
                type="text"
                value={desktopMediaUrl}
                onChange={(e) => setDesktopMediaUrl(e.target.value)}
                placeholder="URL direta da mídia desktop"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-600"
              />
            </div>

            {/* Mobile 9:16 */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Mídia Celular (9:16 Vertical Tela Cheia)</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">1080x1920</span>
              </div>

              <div className="w-full aspect-[16/9] sm:h-52 bg-slate-900 rounded-lg overflow-hidden border border-slate-300 relative flex items-center justify-center">
                {tipoMidia === 'video' ? (
                  <video
                    src={mobileMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-auto h-full max-w-full object-contain"
                  />
                ) : (
                  <Image
                    src={mobileMediaUrl || '/video/header_poster.jpg'}
                    alt="Preview Mobile"
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-all">
                  {uploadingMobile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{uploadingMobile ? 'Enviando...' : 'Subir Arquivo Mobile (R2)'}</span>
                  <input
                    type="file"
                    accept={tipoMidia === 'video' ? 'video/mp4,video/*' : 'image/*'}
                    onChange={handleUploadMobile}
                    disabled={uploadingMobile}
                    className="hidden"
                  />
                </label>
              </div>
              <input
                type="text"
                value={mobileMediaUrl}
                onChange={(e) => setMobileMediaUrl(e.target.value)}
                placeholder="URL direta da mídia mobile"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-600"
              />
            </div>
          </div>

          {/* TEXTOS DA CHAMADA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Título Principal do Banner</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Coleção Elegance & Alfaiataria"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Texto do Botão (CTA)</label>
              <input
                type="text"
                value={ctaTexto}
                onChange={(e) => setCtaTexto(e.target.value)}
                placeholder="Ex: Conhecer Coleção"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 mb-1 font-bold">Subtítulo / Descrição de Impacto</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Curadoria Exclusiva em Moda Feminina com tecidos nobres e acabamento de alfaiataria."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* CONSTRUTOR INTELIGENTE DE LINKS (LINK PICKER) */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Link2 className="w-4 h-4 text-amber-600" />
                  <span>3. Destino do Clique (Botão CTA e Clique no Banner Inteiro)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  O cliente será direcionado para este link ao clicar no botão CTA ou diretamente sobre o banner.
                </span>
              </div>

              <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
                <span className="text-slate-400">Link Atual:</span>
                <span className="text-amber-700">{ctaLink || '#lancamentos'}</span>
              </div>
            </div>

            {/* Abas do Link Picker */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'colecao', label: 'Coleção / Seção da Home', icon: Layers },
                { id: 'categoria', label: 'Categoria do Catálogo', icon: Grid },
                { id: 'produto', label: 'Peça Única (Produto)', icon: PackageCheck },
                { id: 'custom', label: 'Link Personalizado', icon: ExternalLink },
                { id: 'none', label: 'Apenas Rolagem Suave', icon: ArrowDown }
              ].map((tab) => {
                const isCurrentTab = linkPickerType === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setLinkPickerType(tab.id as any);
                      if (tab.id === 'none') setCtaLink('#lancamentos');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrentTab
                        ? 'bg-slate-900 text-amber-400 shadow-sm ring-1 ring-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da Aba 1: Coleção / Status */}
            {linkPickerType === 'colecao' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">
                  Escolha a Coleção / Seção de Destaque da Loja:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Lançamentos 2026', link: '#lancamentos', desc: 'Rola para a vitrine de novidades' },
                    { label: 'Mais Vendidos', link: '#mais-vendidos', desc: 'Peças com maior procura' },
                    { label: 'OUTLET / Bazar', link: '#outlet', desc: 'Ofertas com descontos especiais' },
                    { label: 'Últimas Peças', link: '#ultimas-pecas', desc: 'Estoque final e urgência' }
                  ].map((col) => (
                    <button
                      key={col.link}
                      type="button"
                      onClick={() => setCtaLink(col.link)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        ctaLink === col.link
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold block text-xs">{col.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{col.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 2: Categoria do Catálogo */}
            {linkPickerType === 'categoria' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block">
                  Filtrar o Catálogo por Categoria Específica:
                </span>
                {categories.length === 0 ? (
                  <p className="text-slate-400">Nenhuma categoria cadastrada.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {categories.map((cat) => {
                      const catPath = `/catalogo?categoria=${cat.slug}`;
                      const isCatSelected = ctaLink === catPath;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCtaLink(catPath)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isCatSelected
                              ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-bold block text-xs">{cat.nome}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                            /{cat.slug}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba 3: Peça Única / Produto Específico */}
            {linkPickerType === 'produto' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700 block">
                    Vincular a uma Peça Específica da Boutique:
                  </span>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Buscar peça por nome..."
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredProducts.slice(0, 8).map((p) => {
                    const prodLink = `/catalogo?produto=${p.slug}`;
                    const isProdSelected = ctaLink === prodLink;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setCtaLink(prodLink);
                          setCtaTexto(`Ver ${p.nome}`);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isProdSelected
                            ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-2xs ring-1 ring-amber-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                            {p.foto_principal ? (
                              <Image
                                src={p.foto_principal}
                                alt={p.nome}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs block truncate">{p.nome}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Slug: {p.slug}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-xs text-amber-700">
                            R$ {Number(p.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isProdSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isProdSelected ? 'Selecionado' : 'Selecionar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 4: Link Customizado */}
            {linkPickerType === 'custom' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">
                  Digite o Link de Destino Personalizado (Interno ou Externo):
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="Ex: /leidyboutique/cliente/ ou https://wa.me/554197347601"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 3: BARRA DE AVISOS NO TOPO DA VITRINE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
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

        {/* BOTÃO SALVAR RODAPÉ */}
        <div className="flex justify-end pt-2 pb-6">
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
            <span>{isSaving ? 'Salvando Alterações...' : 'Salvar e Publicar na Vitrine'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
