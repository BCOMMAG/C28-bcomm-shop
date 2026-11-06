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
  EyeOff,
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
  Tag,
  Store,
  RotateCcw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  GripVertical,
  Clock,
  Flame,
  FolderOpen,
  X
} from 'lucide-react';
import { AdminSinalizadoresModal } from '@/components/admin/products/AdminSinalizadoresModal';
import { AdminCollectionsManagerModal } from '@/components/admin/products/AdminCollectionsManagerModal';
import { useStore } from '@/context/StoreContext';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  getAdminProducts,
  getAdminCategoriesFull,
  AdminProductItem,
  AdminCategoryFull,
  PlanoFundoMenuConfig,
  PlanoFundoSiteConfig,
  TipografiaMenuConfig,
  SecoesVitrineConfig,
  SecaoEstiloConfig,
  SecaoHomeItem,
  SECOES_VITRINE_PADRAO,
  normalizarSecoesVitrine
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function AppearanceSettingsPage() {
  const { currentTenant, refreshProducts, refreshTenant } = useStore();
  const tenantSlug = currentTenant?.slug || 'leidy-boutique';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { setIsDirty, registerSaveHandler, setFormName } = useAdminUnsavedChanges();
  const initialSnapshotRef = React.useRef<string>('');

  useEffect(() => {
    setFormName('Aparência da Loja Virtual');
  }, [setFormName]);

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
  const [secaoLancamentosAtivo, setSecaoLancamentosAtivo] = useState(true);
  const [secaoLancamentosCustomizado, setSecaoLancamentosCustomizado] = useState(false);
  const [secaoLancamentosFont, setSecaoLancamentosFont] = useState('Playfair Display');
  const [secaoLancamentosBgLight, setSecaoLancamentosBgLight] = useState('');
  const [secaoLancamentosBgDark, setSecaoLancamentosBgDark] = useState('');
  const [secaoLancamentosTituloLight, setSecaoLancamentosTituloLight] = useState('#FFFFFF');
  const [secaoLancamentosTituloDark, setSecaoLancamentosTituloDark] = useState('#FFFFFF');
  const [secaoLancamentosSubtituloLight, setSecaoLancamentosSubtituloLight] = useState('#FAF8F5');
  const [secaoLancamentosSubtituloDark, setSecaoLancamentosSubtituloDark] = useState('#FAF8F5');
  const [secaoLancamentosTitulo, setSecaoLancamentosTitulo] = useState('Lançamentos Exclusivos');
  const [secaoLancamentosSubtitulo, setSecaoLancamentosSubtitulo] = useState('As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.');

  // Seção Mais Vendidos
  const [secaoMaisVendidosAtivo, setSecaoMaisVendidosAtivo] = useState(true);
  const [secaoMaisVendidosCustomizado, setSecaoMaisVendidosCustomizado] = useState(false);
  const [secaoMaisVendidosFont, setSecaoMaisVendidosFont] = useState('Playfair Display');
  const [secaoMaisVendidosBgLight, setSecaoMaisVendidosBgLight] = useState('');
  const [secaoMaisVendidosBgDark, setSecaoMaisVendidosBgDark] = useState('');
  const [secaoMaisVendidosTituloLight, setSecaoMaisVendidosTituloLight] = useState('#FFFFFF');
  const [secaoMaisVendidosTituloDark, setSecaoMaisVendidosTituloDark] = useState('#FFFFFF');
  const [secaoMaisVendidosSubtituloLight, setSecaoMaisVendidosSubtituloLight] = useState('#FAF8F5');
  const [secaoMaisVendidosSubtituloDark, setSecaoMaisVendidosSubtituloDark] = useState('#FAF8F5');
  const [secaoMaisVendidosTitulo, setSecaoMaisVendidosTitulo] = useState('Mais Vendidos & Queridinhos');
  const [secaoMaisVendidosSubtitulo, setSecaoMaisVendidosSubtitulo] = useState('As criações favoritas e mais desejadas pelas nossas clientes.');

  // Seção OUTLET
  const [secaoOutletAtivo, setSecaoOutletAtivo] = useState(true);
  const [secaoOutletCustomizado, setSecaoOutletCustomizado] = useState(false);
  const [secaoOutletFont, setSecaoOutletFont] = useState('Playfair Display');
  const [secaoOutletBgLight, setSecaoOutletBgLight] = useState('');
  const [secaoOutletBgDark, setSecaoOutletBgDark] = useState('');
  const [secaoOutletTituloLight, setSecaoOutletTituloLight] = useState('#FFFFFF');
  const [secaoOutletTituloDark, setSecaoOutletTituloDark] = useState('#FFFFFF');
  const [secaoOutletSubtituloLight, setSecaoOutletSubtituloLight] = useState('#FAF8F5');
  const [secaoOutletSubtituloDark, setSecaoOutletSubtituloDark] = useState('#FAF8F5');
  const [secaoOutletTitulo, setSecaoOutletTitulo] = useState('Bazar & Oportunidades');
  const [secaoOutletSubtitulo, setSecaoOutletSubtitulo] = useState('Peças selecionadas com condições especiais por tempo limitado.');

  // Seção Últimas Peças
  const [secaoUltimasPecasAtivo, setSecaoUltimasPecasAtivo] = useState(true);
  const [secaoUltimasPecasCustomizado, setSecaoUltimasPecasCustomizado] = useState(false);
  const [secaoUltimasPecasFont, setSecaoUltimasPecasFont] = useState('Playfair Display');
  const [secaoUltimasPecasBgLight, setSecaoUltimasPecasBgLight] = useState('');
  const [secaoUltimasPecasBgDark, setSecaoUltimasPecasBgDark] = useState('');
  const [secaoUltimasPecasTituloLight, setSecaoUltimasPecasTituloLight] = useState('#FFFFFF');
  const [secaoUltimasPecasTituloDark, setSecaoUltimasPecasTituloDark] = useState('#FFFFFF');
  const [secaoUltimasPecasSubtituloLight, setSecaoUltimasPecasSubtituloLight] = useState('#FAF8F5');
  const [secaoUltimasPecasSubtituloDark, setSecaoUltimasPecasSubtituloDark] = useState('#FAF8F5');
  const [secaoUltimasPecasTitulo, setSecaoUltimasPecasTitulo] = useState('Últimas Peças');
  const [secaoUltimasPecasSubtitulo, setSecaoUltimasPecasSubtitulo] = useState('Poucas unidades restantes em estoque. Garanta a sua antes que esgote definitivamente.');

  // Seção Todas as Peças (Catálogo Geral da Vitrine)
  const [secaoTodasAsPecasAtivo, setSecaoTodasAsPecasAtivo] = useState(true);
  const [secaoTodasAsPecasCustomizado, setSecaoTodasAsPecasCustomizado] = useState(false);
  const [secaoTodasAsPecasTitulo, setSecaoTodasAsPecasTitulo] = useState('Todas as Peças');
  const [secaoTodasAsPecasSubtitulo, setSecaoTodasAsPecasSubtitulo] = useState('Conheça todas as criações e modelos exclusivos disponíveis na boutique.');
  const [secaoTodasAsPecasFont, setSecaoTodasAsPecasFont] = useState('Playfair Display');
  const [secaoTodasAsPecasBgLight, setSecaoTodasAsPecasBgLight] = useState('');
  const [secaoTodasAsPecasBgDark, setSecaoTodasAsPecasBgDark] = useState('');
  const [secaoTodasAsPecasTituloLight, setSecaoTodasAsPecasTituloLight] = useState('#FFFFFF');
  const [secaoTodasAsPecasTituloDark, setSecaoTodasAsPecasTituloDark] = useState('#FFFFFF');
  const [secaoTodasAsPecasSubtituloLight, setSecaoTodasAsPecasSubtituloLight] = useState('#FAF8F5');
  const [secaoTodasAsPecasSubtituloDark, setSecaoTodasAsPecasSubtituloDark] = useState('#FAF8F5');

  // Configuração Global de Visibilidade de Estoque para o Consumidor
  const [exibirQuantidadeEstoqueConsumidor, setExibirQuantidadeEstoqueConsumidor] = useState(true);

  // Configuração Global de Visibilidade de Badges e Escassez sobre as Fotos na Vitrine
  const [exibirBadgesNaVitrine, setExibirBadgesNaVitrine] = useState(false);
  const [exibirSeloEscassezFoto, setExibirSeloEscassezFoto] = useState(false);

  // Gestão Dinâmica de Seções da Home (Bloco 7)
  const [secoesLista, setSecoesLista] = useState<SecaoHomeItem[]>(SECOES_VITRINE_PADRAO);
  const [catalogProducts, setCatalogProducts] = useState<AdminProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<AdminCategoryFull[]>([]);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState<'categoria' | 'custom_curadoria' | 'restaurar_nativa'>('categoria');
  const [selectedNewCatId, setSelectedNewCatId] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [curatingSection, setCuratingSection] = useState<SecaoHomeItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshCatalogData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getAdminProducts(tenantId),
        getAdminCategoriesFull(tenantId)
      ]);
      setCatalogProducts(prodsRes);
      setCategoriesList(catsRes);
      if (catsRes.length > 0 && !selectedNewCatId) {
        setSelectedNewCatId(catsRes[0].id);
      }
    } catch (e) {
      console.warn('Erro ao carregar catálogo para aparência:', e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [data, prodsRes, catsRes] = await Promise.all([
          getStoreSettings(tenantId),
          getAdminProducts(tenantId).catch(() => []),
          getAdminCategoriesFull(tenantId).catch(() => [])
        ]);

        setCatalogProducts(prodsRes);
        setCategoriesList(catsRes);
        if (catsRes.length > 0) {
          setSelectedNewCatId(catsRes[0].id);
        }

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
            if (data.secoesVitrine.secoesLista && data.secoesVitrine.secoesLista.length > 0) {
              setSecoesLista(data.secoesVitrine.secoesLista);
            }
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
              setSecaoLancamentosAtivo(data.secoesVitrine.lancamentos.ativo !== false);
              setSecaoLancamentosTitulo(data.secoesVitrine.lancamentos.titulo || 'Lançamentos Exclusivos');
              setSecaoLancamentosSubtitulo(data.secoesVitrine.lancamentos.subtitulo || 'As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.');
              setSecaoLancamentosCustomizado(Boolean(data.secoesVitrine.lancamentos.customizado || (data.secoesVitrine.modoIndependente && data.secoesVitrine.lancamentos.ativo)));
              setSecaoLancamentosFont(data.secoesVitrine.lancamentos.tituloFont || 'Playfair Display');
              setSecaoLancamentosBgLight(data.secoesVitrine.lancamentos.bgLight || '');
              setSecaoLancamentosBgDark(data.secoesVitrine.lancamentos.bgDark || '');
              setSecaoLancamentosTituloLight(data.secoesVitrine.lancamentos.tituloCorLight || '#FFFFFF');
              setSecaoLancamentosTituloDark(data.secoesVitrine.lancamentos.tituloCorDark || '#FFFFFF');
              setSecaoLancamentosSubtituloLight(data.secoesVitrine.lancamentos.subtituloCorLight || '#FAF8F5');
              setSecaoLancamentosSubtituloDark(data.secoesVitrine.lancamentos.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.maisVendidos) {
              setSecaoMaisVendidosAtivo(data.secoesVitrine.maisVendidos.ativo !== false);
              setSecaoMaisVendidosTitulo(data.secoesVitrine.maisVendidos.titulo || 'Mais Vendidos & Queridinhos');
              setSecaoMaisVendidosSubtitulo(data.secoesVitrine.maisVendidos.subtitulo || 'As criações favoritas e mais desejadas pelas nossas clientes.');
              setSecaoMaisVendidosCustomizado(Boolean(data.secoesVitrine.maisVendidos.customizado || (data.secoesVitrine.modoIndependente && data.secoesVitrine.maisVendidos.ativo)));
              setSecaoMaisVendidosFont(data.secoesVitrine.maisVendidos.tituloFont || 'Playfair Display');
              setSecaoMaisVendidosBgLight(data.secoesVitrine.maisVendidos.bgLight || '');
              setSecaoMaisVendidosBgDark(data.secoesVitrine.maisVendidos.bgDark || '');
              setSecaoMaisVendidosTituloLight(data.secoesVitrine.maisVendidos.tituloCorLight || '#FFFFFF');
              setSecaoMaisVendidosTituloDark(data.secoesVitrine.maisVendidos.tituloCorDark || '#FFFFFF');
              setSecaoMaisVendidosSubtituloLight(data.secoesVitrine.maisVendidos.subtituloCorLight || '#FAF8F5');
              setSecaoMaisVendidosSubtituloDark(data.secoesVitrine.maisVendidos.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.outlet) {
              setSecaoOutletAtivo(data.secoesVitrine.outlet.ativo !== false);
              setSecaoOutletTitulo(data.secoesVitrine.outlet.titulo || 'Bazar & Oportunidades');
              setSecaoOutletSubtitulo(data.secoesVitrine.outlet.subtitulo || 'Peças selecionadas com condições especiais por tempo limitado.');
              setSecaoOutletCustomizado(Boolean(data.secoesVitrine.outlet.customizado || (data.secoesVitrine.modoIndependente && data.secoesVitrine.outlet.ativo)));
              setSecaoOutletFont(data.secoesVitrine.outlet.tituloFont || 'Playfair Display');
              setSecaoOutletBgLight(data.secoesVitrine.outlet.bgLight || '');
              setSecaoOutletBgDark(data.secoesVitrine.outlet.bgDark || '');
              setSecaoOutletTituloLight(data.secoesVitrine.outlet.tituloCorLight || '#FFFFFF');
              setSecaoOutletTituloDark(data.secoesVitrine.outlet.tituloCorDark || '#FFFFFF');
              setSecaoOutletSubtituloLight(data.secoesVitrine.outlet.subtituloCorLight || '#FAF8F5');
              setSecaoOutletSubtituloDark(data.secoesVitrine.outlet.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.ultimasPecas) {
              setSecaoUltimasPecasAtivo(data.secoesVitrine.ultimasPecas.ativo !== false);
              setSecaoUltimasPecasTitulo(data.secoesVitrine.ultimasPecas.titulo || 'Últimas Peças');
              setSecaoUltimasPecasSubtitulo(data.secoesVitrine.ultimasPecas.subtitulo || 'Poucas unidades restantes em estoque. Garanta a sua antes que esgote definitivamente.');
              setSecaoUltimasPecasCustomizado(Boolean(data.secoesVitrine.ultimasPecas.customizado || (data.secoesVitrine.modoIndependente && data.secoesVitrine.ultimasPecas.ativo)));
              setSecaoUltimasPecasFont(data.secoesVitrine.ultimasPecas.tituloFont || 'Playfair Display');
              setSecaoUltimasPecasBgLight(data.secoesVitrine.ultimasPecas.bgLight || '');
              setSecaoUltimasPecasBgDark(data.secoesVitrine.ultimasPecas.bgDark || '');
              setSecaoUltimasPecasTituloLight(data.secoesVitrine.ultimasPecas.tituloCorLight || '#FFFFFF');
              setSecaoUltimasPecasTituloDark(data.secoesVitrine.ultimasPecas.tituloCorDark || '#FFFFFF');
              setSecaoUltimasPecasSubtituloLight(data.secoesVitrine.ultimasPecas.subtituloCorLight || '#FAF8F5');
              setSecaoUltimasPecasSubtituloDark(data.secoesVitrine.ultimasPecas.subtituloCorDark || '#FAF8F5');
            }
            if (data.secoesVitrine.todasAsPecas) {
              setSecaoTodasAsPecasAtivo(data.secoesVitrine.todasAsPecas.ativo !== false);
              setSecaoTodasAsPecasCustomizado(Boolean(data.secoesVitrine.todasAsPecas.customizado));
              setSecaoTodasAsPecasTitulo(data.secoesVitrine.todasAsPecas.titulo || 'Todas as Peças');
              setSecaoTodasAsPecasSubtitulo(data.secoesVitrine.todasAsPecas.subtitulo || 'Conheça todas as criações e modelos exclusivos disponíveis na boutique.');
              setSecaoTodasAsPecasFont(data.secoesVitrine.todasAsPecas.tituloFont || 'Playfair Display');
              setSecaoTodasAsPecasBgLight(data.secoesVitrine.todasAsPecas.bgLight || '');
              setSecaoTodasAsPecasBgDark(data.secoesVitrine.todasAsPecas.bgDark || '');
              setSecaoTodasAsPecasTituloLight(data.secoesVitrine.todasAsPecas.tituloCorLight || '#FFFFFF');
              setSecaoTodasAsPecasTituloDark(data.secoesVitrine.todasAsPecas.tituloCorDark || '#FFFFFF');
              setSecaoTodasAsPecasSubtituloLight(data.secoesVitrine.todasAsPecas.subtituloCorLight || '#FAF8F5');
              setSecaoTodasAsPecasSubtituloDark(data.secoesVitrine.todasAsPecas.subtituloCorDark || '#FAF8F5');
            }
          }

          if (data.exibirQuantidadeEstoqueConsumidor !== undefined) {
            setExibirQuantidadeEstoqueConsumidor(data.exibirQuantidadeEstoqueConsumidor);
          }
          if (data.exibirBadgesNaVitrine !== undefined) {
            setExibirBadgesNaVitrine(data.exibirBadgesNaVitrine);
          }
          if (data.exibirSeloEscassezFoto !== undefined) {
            setExibirSeloEscassezFoto(data.exibirSeloEscassezFoto);
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

  const getCurrentSnapshot = React.useCallback(() => {
    return JSON.stringify({
      logoUrl, logoDarkUrl, faviconUrl, ogImageUrl, slogan,
      siteBgTipo, siteBgLight, siteBgDark, siteBgImageUrl, siteBgCustomUrl, siteBgVideoUrl, siteBgOverlay,
      menuBgTipo, menuBgLight, menuBgDark,
      menuFontFamily, menuFontSize, menuCorTextoLight, menuCorTextoDark, menuCorHoverLight, menuCorHoverDark,
      secoesModoIndependente, secaoGlobalFont, secaoGlobalBgLight, secaoGlobalBgDark,
      secaoGlobalTituloLight, secaoGlobalTituloDark, secaoGlobalSubtituloLight, secaoGlobalSubtituloDark,
      secaoLancamentosAtivo, secaoLancamentosCustomizado, secaoLancamentosFont, secaoLancamentosBgLight, secaoLancamentosBgDark,
      secaoLancamentosTituloLight, secaoLancamentosTituloDark, secaoLancamentosSubtituloLight, secaoLancamentosSubtituloDark,
      secaoMaisVendidosAtivo, secaoMaisVendidosCustomizado, secaoMaisVendidosFont, secaoMaisVendidosBgLight, secaoMaisVendidosBgDark,
      secaoMaisVendidosTituloLight, secaoMaisVendidosTituloDark, secaoMaisVendidosSubtituloLight, secaoMaisVendidosSubtituloDark,
      secaoOutletAtivo, secaoOutletCustomizado, secaoOutletFont, secaoOutletBgLight, secaoOutletBgDark,
      secaoOutletTituloLight, secaoOutletTituloDark, secaoOutletSubtituloLight, secaoOutletSubtituloDark,
      secaoUltimasPecasAtivo, secaoUltimasPecasCustomizado, secaoUltimasPecasFont, secaoUltimasPecasBgLight, secaoUltimasPecasBgDark,
      secaoUltimasPecasTituloLight, secaoUltimasPecasTituloDark, secaoUltimasPecasSubtituloLight, secaoUltimasPecasSubtituloDark,
      secaoTodasAsPecasAtivo, secaoTodasAsPecasCustomizado, secaoTodasAsPecasTitulo, secaoTodasAsPecasSubtitulo, secaoTodasAsPecasFont,
      secaoTodasAsPecasBgLight, secaoTodasAsPecasBgDark, secaoTodasAsPecasTituloLight, secaoTodasAsPecasTituloDark,
      secaoTodasAsPecasSubtituloLight, secaoTodasAsPecasSubtituloDark,
      exibirQuantidadeEstoqueConsumidor,
      exibirBadgesNaVitrine,
      exibirSeloEscassezFoto,
      secoesLista
    });
  }, [
    logoUrl, logoDarkUrl, faviconUrl, ogImageUrl, slogan,
    siteBgTipo, siteBgLight, siteBgDark, siteBgImageUrl, siteBgCustomUrl, siteBgVideoUrl, siteBgOverlay,
    menuBgTipo, menuBgLight, menuBgDark,
    menuFontFamily, menuFontSize, menuCorTextoLight, menuCorTextoDark, menuCorHoverLight, menuCorHoverDark,
    secoesModoIndependente, secaoGlobalFont, secaoGlobalBgLight, secaoGlobalBgDark,
    secaoGlobalTituloLight, secaoGlobalTituloDark, secaoGlobalSubtituloLight, secaoGlobalSubtituloDark,
    secaoLancamentosAtivo, secaoLancamentosCustomizado, secaoLancamentosFont, secaoLancamentosBgLight, secaoLancamentosBgDark,
    secaoLancamentosTituloLight, secaoLancamentosTituloDark, secaoLancamentosSubtituloLight, secaoLancamentosSubtituloDark,
    secaoMaisVendidosAtivo, secaoMaisVendidosCustomizado, secaoMaisVendidosFont, secaoMaisVendidosBgLight, secaoMaisVendidosBgDark,
    secaoMaisVendidosTituloLight, secaoMaisVendidosTituloDark, secaoMaisVendidosSubtituloLight, secaoMaisVendidosSubtituloDark,
    secaoOutletAtivo, secaoOutletCustomizado, secaoOutletFont, secaoOutletBgLight, secaoOutletBgDark,
    secaoOutletTituloLight, secaoOutletTituloDark, secaoOutletSubtituloLight, secaoOutletSubtituloDark,
    secaoUltimasPecasAtivo, secaoUltimasPecasCustomizado, secaoUltimasPecasFont, secaoUltimasPecasBgLight, secaoUltimasPecasBgDark,
    secaoUltimasPecasTituloLight, secaoUltimasPecasTituloDark, secaoUltimasPecasSubtituloLight, secaoUltimasPecasSubtituloDark,
    secaoTodasAsPecasAtivo, secaoTodasAsPecasCustomizado, secaoTodasAsPecasTitulo, secaoTodasAsPecasSubtitulo, secaoTodasAsPecasFont,
    secaoTodasAsPecasBgLight, secaoTodasAsPecasBgDark, secaoTodasAsPecasTituloLight, secaoTodasAsPecasTituloDark,
    secaoTodasAsPecasSubtituloLight, secaoTodasAsPecasSubtituloDark,
    exibirQuantidadeEstoqueConsumidor,
    exibirBadgesNaVitrine,
    exibirSeloEscassezFoto,
    secoesLista
  ]);

  // Carrega o snapshot inicial assim que os dados terminam de carregar
  useEffect(() => {
    if (!loading && !initialSnapshotRef.current) {
      initialSnapshotRef.current = getCurrentSnapshot();
    }
  }, [loading, getCurrentSnapshot]);

  // Monitora alterações pendentes e atualiza o estado dirty
  useEffect(() => {
    if (!loading && initialSnapshotRef.current) {
      const current = getCurrentSnapshot();
      const isChanged = current !== initialSnapshotRef.current;
      setIsDirty(isChanged);
    }
  }, [loading, getCurrentSnapshot, setIsDirty]);

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
        showToast('Arquivo enviado com sucesso!');
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

  const executeSave = async (): Promise<boolean> => {
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
        secoesLista,
        lancamentos: {
          ativo: secaoLancamentosAtivo,
          titulo: secaoLancamentosTitulo.trim() || 'Lançamentos Exclusivos',
          subtitulo: secaoLancamentosSubtitulo.trim() || 'As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.',
          tituloFont: secaoLancamentosCustomizado ? secaoLancamentosFont : secaoGlobalFont,
          bgLight: (secaoLancamentosCustomizado ? secaoLancamentosBgLight : secaoGlobalBgLight) || undefined,
          bgDark: (secaoLancamentosCustomizado ? secaoLancamentosBgDark : secaoGlobalBgDark) || undefined,
          tituloCorLight: secaoLancamentosCustomizado ? secaoLancamentosTituloLight : secaoGlobalTituloLight,
          tituloCorDark: secaoLancamentosCustomizado ? secaoLancamentosTituloDark : secaoGlobalTituloDark,
          subtituloCorLight: secaoLancamentosCustomizado ? secaoLancamentosSubtituloLight : secaoGlobalSubtituloLight,
          subtituloCorDark: secaoLancamentosCustomizado ? secaoLancamentosSubtituloDark : secaoGlobalSubtituloDark
        },
        maisVendidos: {
          ativo: secaoMaisVendidosAtivo,
          titulo: secaoMaisVendidosTitulo.trim() || 'Mais Vendidos & Queridinhos',
          subtitulo: secaoMaisVendidosSubtitulo.trim() || 'As criações favoritas e mais desejadas pelas nossas clientes.',
          tituloFont: secaoMaisVendidosCustomizado ? secaoMaisVendidosFont : secaoGlobalFont,
          bgLight: (secaoMaisVendidosCustomizado ? secaoMaisVendidosBgLight : secaoGlobalBgLight) || undefined,
          bgDark: (secaoMaisVendidosCustomizado ? secaoMaisVendidosBgDark : secaoGlobalBgDark) || undefined,
          tituloCorLight: secaoMaisVendidosCustomizado ? secaoMaisVendidosTituloLight : secaoGlobalTituloLight,
          tituloCorDark: secaoMaisVendidosCustomizado ? secaoMaisVendidosTituloDark : secaoGlobalTituloDark,
          subtituloCorLight: secaoMaisVendidosCustomizado ? secaoMaisVendidosSubtituloLight : secaoGlobalSubtituloLight,
          subtituloCorDark: secaoMaisVendidosCustomizado ? secaoMaisVendidosSubtituloDark : secaoGlobalSubtituloDark
        },
        outlet: {
          ativo: secaoOutletAtivo,
          titulo: secaoOutletTitulo.trim() || 'Bazar & Oportunidades',
          subtitulo: secaoOutletSubtitulo.trim() || 'Peças selecionadas com condições especiais por tempo limitado.',
          tituloFont: secaoOutletCustomizado ? secaoOutletFont : secaoGlobalFont,
          bgLight: (secaoOutletCustomizado ? secaoOutletBgLight : secaoGlobalBgLight) || undefined,
          bgDark: (secaoOutletCustomizado ? secaoOutletBgDark : secaoGlobalBgDark) || undefined,
          tituloCorLight: secaoOutletCustomizado ? secaoOutletTituloLight : secaoGlobalTituloLight,
          tituloCorDark: secaoOutletCustomizado ? secaoOutletTituloDark : secaoGlobalTituloDark,
          subtituloCorLight: secaoOutletCustomizado ? secaoOutletSubtituloLight : secaoGlobalSubtituloLight,
          subtituloCorDark: secaoOutletCustomizado ? secaoOutletSubtituloDark : secaoGlobalSubtituloDark
        },
        ultimasPecas: {
          ativo: secaoUltimasPecasAtivo,
          titulo: secaoUltimasPecasTitulo.trim() || 'Últimas Peças',
          subtitulo: secaoUltimasPecasSubtitulo.trim() || 'Poucas unidades restantes em estoque. Garanta a sua antes que esgote definitivamente.',
          tituloFont: secaoUltimasPecasCustomizado ? secaoUltimasPecasFont : secaoGlobalFont,
          bgLight: (secaoUltimasPecasCustomizado ? secaoUltimasPecasBgLight : secaoGlobalBgLight) || undefined,
          bgDark: (secaoUltimasPecasCustomizado ? secaoUltimasPecasBgDark : secaoGlobalBgDark) || undefined,
          tituloCorLight: secaoUltimasPecasCustomizado ? secaoUltimasPecasTituloLight : secaoGlobalTituloLight,
          tituloCorDark: secaoUltimasPecasCustomizado ? secaoUltimasPecasTituloDark : secaoGlobalTituloDark,
          subtituloCorLight: secaoUltimasPecasCustomizado ? secaoUltimasPecasSubtituloLight : secaoGlobalSubtituloLight,
          subtituloCorDark: secaoUltimasPecasCustomizado ? secaoUltimasPecasSubtituloDark : secaoGlobalSubtituloDark
        },
        todasAsPecas: {
          ativo: secaoTodasAsPecasAtivo,
          titulo: secaoTodasAsPecasTitulo.trim() || 'Todas as Peças',
          subtitulo: secaoTodasAsPecasSubtitulo.trim() || 'Conheça todas as criações e modelos exclusivos disponíveis na boutique.',
          tituloFont: secaoTodasAsPecasCustomizado ? secaoTodasAsPecasFont : secaoGlobalFont,
          bgLight: (secaoTodasAsPecasCustomizado ? secaoTodasAsPecasBgLight : secaoGlobalBgLight) || undefined,
          bgDark: (secaoTodasAsPecasCustomizado ? secaoTodasAsPecasBgDark : secaoGlobalBgDark) || undefined,
          tituloCorLight: secaoTodasAsPecasCustomizado ? secaoTodasAsPecasTituloLight : secaoGlobalTituloLight,
          tituloCorDark: secaoTodasAsPecasCustomizado ? secaoTodasAsPecasTituloDark : secaoGlobalTituloDark,
          subtituloCorLight: secaoTodasAsPecasCustomizado ? secaoTodasAsPecasSubtituloLight : secaoGlobalSubtituloLight,
          subtituloCorDark: secaoTodasAsPecasCustomizado ? secaoTodasAsPecasSubtituloDark : secaoGlobalSubtituloDark
        }
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
        exibirQuantidadeEstoqueConsumidor,
        exibirBadgesNaVitrine,
        exibirSeloEscassezFoto
      });

      if (res.success) {
        initialSnapshotRef.current = getCurrentSnapshot();
        setIsDirty(false);
        try {
          await refreshProducts();
          await refreshTenant(tenantId);
        } catch { }
        showToast('Aparência e identidade da vitrine salvas com sucesso!');
        return true;
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSave();
  };

  // --- MÉTODOS DA GESTÃO DE SEÇÕES DA VITRINE (BLOCO 7) ---
  const getSectionProductCount = (sec: SecaoHomeItem): number => {
    if (sec.tipo === 'nativa_lancamentos') {
      return catalogProducts.filter((p) => Boolean(p.destaque) && !p.lixeira && !p.arquivado).length;
    }
    if (sec.tipo === 'nativa_mais_vendidos') {
      return catalogProducts.filter((p) => Boolean(p.mais_vendido) && !p.lixeira && !p.arquivado).length;
    }
    if (sec.tipo === 'nativa_outlet') {
      return catalogProducts.filter((p) => Boolean(p.outlet) && !p.lixeira && !p.arquivado).length;
    }
    if (sec.tipo === 'nativa_ultimas_pecas') {
      return catalogProducts.filter(
        (p) => (Boolean(p.ultimas_pecas) || (p.estoque_total > 0 && p.estoque_total <= 5)) && !p.lixeira && !p.arquivado
      ).length;
    }
    if (sec.tipo === 'nativa_todas_pecas') {
      return catalogProducts.filter((p) => !p.lixeira && !p.arquivado).length;
    }
    if (sec.tipo === 'categoria' && sec.categoriaId) {
      return catalogProducts.filter((p) => p.categoria_id === sec.categoriaId && !p.lixeira && !p.arquivado).length;
    }
    if (sec.tipo === 'custom_curadoria' && sec.produtoIds) {
      const idSet = new Set(sec.produtoIds);
      return catalogProducts.filter((p) => idSet.has(p.id) && !p.lixeira && !p.arquivado).length;
    }
    return 0;
  };

  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    setSecoesLista((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((s, idx) => ({ ...s, ordem: idx }));
    });
  };

  const handleMoveSectionDown = (index: number) => {
    if (index >= secoesLista.length - 1) return;
    setSecoesLista((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((s, idx) => ({ ...s, ordem: idx }));
    });
  };

  const handleToggleSectionActive = (id: string) => {
    setSecoesLista((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s))
    );
  };

  const handleDeleteSection = (id: string) => {
    const sec = secoesLista.find((s) => s.id === id);
    if (!sec) return;
    const confirmMsg = sec.tipo.startsWith('nativa_')
      ? `Deseja remover a seção "${sec.titulo}" da vitrine da Home? Você poderá restaurá-la a qualquer momento em "+ Nova Seção".`
      : `Deseja realmente excluir a seção personalizada "${sec.titulo}" da Home? As peças continuarão normalmente no catálogo.`;

    if (!confirm(confirmMsg)) return;

    setSecoesLista((prev) => prev.filter((s) => s.id !== id).map((s, idx) => ({ ...s, ordem: idx })));
    if (editingSectionId === id) setEditingSectionId(null);
    showToast(`Seção "${sec.titulo}" removida da vitrine.`);
  };

  const handleUpdateSectionField = (id: string, field: keyof SecaoHomeItem, value: any) => {
    setSecoesLista((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleCreateNewSection = () => {
    if (newSectionType === 'categoria') {
      const cat = categoriesList.find((c) => c.id === selectedNewCatId);
      if (!cat) {
        showToast('Selecione uma categoria válida.', 'error');
        return;
      }
      const existing = secoesLista.find((s) => s.categoriaId === cat.id);
      if (existing) {
        showToast(`A categoria "${cat.nome}" já possui uma vitrine configurada.`, 'error');
        return;
      }

      const novaSecao: SecaoHomeItem = {
        id: `sec_cat_${cat.id}`,
        tipo: 'categoria',
        titulo: newSectionTitle.trim() || cat.nome,
        subtitulo: newSectionSubtitle.trim() || `Confira as peças exclusivas da categoria ${cat.nome}.`,
        ativo: true,
        ordem: secoesLista.length,
        categoriaId: cat.id,
        categoriaNome: cat.nome
      };

      setSecoesLista((prev) => [...prev, novaSecao]);
      showToast(`Vitrine da categoria "${cat.nome}" adicionada à Home!`);
    } else if (newSectionType === 'custom_curadoria') {
      if (!newSectionTitle.trim()) {
        showToast('Informe um título para a seção personalizada.', 'error');
        return;
      }
      const novaSecao: SecaoHomeItem = {
        id: `sec_custom_${Date.now()}`,
        tipo: 'custom_curadoria',
        titulo: newSectionTitle.trim(),
        subtitulo: newSectionSubtitle.trim() || 'Seleção especial com modelos selecionados pela boutique.',
        ativo: true,
        ordem: secoesLista.length,
        produtoIds: []
      };

      setSecoesLista((prev) => [...prev, novaSecao]);
      showToast(`Nova seção "${newSectionTitle}" criada! Clique em "Gerenciar Peças" para compor os produtos.`);
    }

    // Reset modal
    setIsAddSectionModalOpen(false);
    setNewSectionTitle('');
    setNewSectionSubtitle('');
  };

  const handleRestoreNativeSection = (nativaId: string) => {
    const padrao = SECOES_VITRINE_PADRAO.find((s) => s.id === nativaId);
    if (!padrao) return;

    if (secoesLista.some((s) => s.id === nativaId)) {
      showToast('Esta seção já está presente na sua vitrine.', 'error');
      return;
    }

    const restaurada: SecaoHomeItem = {
      ...padrao,
      ordem: secoesLista.length
    };

    setSecoesLista((prev) => [...prev, restaurada]);
    showToast(`Seção "${padrao.titulo}" restaurada com sucesso!`);
    setIsAddSectionModalOpen(false);
  };

  useEffect(() => {
    registerSaveHandler(async () => {
      await executeSave();
    });
  }, [registerSaveHandler]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando configurações visuais da vitrine...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
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

      {/* BLOCO 1: LOGOTIPOS, FAVICON & OG IMAGE DA BOUTIQUE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              1. Logotipos Oficiais, Favicon & OG Image da Boutique
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
              {currentTenant?.nome || 'Minha Boutique'} | Curadoria Exclusiva
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
                      Armazenada com entrega de alta velocidade na nuvem da boutique.
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
          href="/admin/loja/banners#editor-barra-avisos"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-lanc-ativo"
                  checked={secaoLancamentosAtivo}
                  onChange={(e) => setSecaoLancamentosAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-lanc-ativo" className="font-bold text-slate-900 cursor-pointer">
                  1. Seção Lançamentos Exclusivos (#lancamentos)
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${secaoLancamentosAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {secaoLancamentosAtivo ? 'Ativa na Vitrine' : 'Oculta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="sec-lanc-cust"
                  checked={secaoLancamentosCustomizado}
                  onChange={(e) => setSecaoLancamentosCustomizado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-lanc-cust" className="text-[11px] text-slate-600 cursor-pointer">
                  Personalizar fontes e cores
                </label>
              </div>
            </div>

            {secaoLancamentosCustomizado && (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-mv-ativo"
                  checked={secaoMaisVendidosAtivo}
                  onChange={(e) => setSecaoMaisVendidosAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-mv-ativo" className="font-bold text-slate-900 cursor-pointer">
                  2. Seção Mais Vendidos (#mais-vendidos)
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${secaoMaisVendidosAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {secaoMaisVendidosAtivo ? 'Ativa na Vitrine' : 'Oculta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="sec-mv-cust"
                  checked={secaoMaisVendidosCustomizado}
                  onChange={(e) => setSecaoMaisVendidosCustomizado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-mv-cust" className="text-[11px] text-slate-600 cursor-pointer">
                  Personalizar fontes e cores
                </label>
              </div>
            </div>

            {secaoMaisVendidosCustomizado && (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-outlet-ativo"
                  checked={secaoOutletAtivo}
                  onChange={(e) => setSecaoOutletAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-outlet-ativo" className="font-bold text-slate-900 cursor-pointer">
                  3. Seção OUTLET & BAZAR (#outlet)
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${secaoOutletAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {secaoOutletAtivo ? 'Ativa na Vitrine' : 'Oculta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="sec-outlet-cust"
                  checked={secaoOutletCustomizado}
                  onChange={(e) => setSecaoOutletCustomizado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-outlet-cust" className="text-[11px] text-slate-600 cursor-pointer">
                  Personalizar fontes e cores
                </label>
              </div>
            </div>

            {secaoOutletCustomizado && (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-up-ativo"
                  checked={secaoUltimasPecasAtivo}
                  onChange={(e) => setSecaoUltimasPecasAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-up-ativo" className="font-bold text-slate-900 cursor-pointer">
                  4. Seção Últimas Peças (#ultimas-pecas)
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${secaoUltimasPecasAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {secaoUltimasPecasAtivo ? 'Ativa na Vitrine' : 'Oculta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="sec-up-cust"
                  checked={secaoUltimasPecasCustomizado}
                  onChange={(e) => setSecaoUltimasPecasCustomizado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-up-cust" className="text-[11px] text-slate-600 cursor-pointer">
                  Personalizar fontes e cores
                </label>
              </div>
            </div>

            {secaoUltimasPecasCustomizado && (
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

          {/* 5. Todas as Peças (Catálogo Geral da Vitrine) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-todas-ativo"
                  checked={secaoTodasAsPecasAtivo}
                  onChange={(e) => setSecaoTodasAsPecasAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-todas-ativo" className="font-bold text-slate-900 cursor-pointer">
                  5. Seção Todas as Peças (#todas-as-pecas)
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${secaoTodasAsPecasAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {secaoTodasAsPecasAtivo ? 'Ativa na Vitrine' : 'Oculta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="sec-todas-cust"
                  checked={secaoTodasAsPecasCustomizado}
                  onChange={(e) => setSecaoTodasAsPecasCustomizado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sec-todas-cust" className="text-[11px] text-slate-600 cursor-pointer">
                  Personalizar fontes e cores
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Título da Seção</label>
                <input
                  type="text"
                  value={secaoTodasAsPecasTitulo}
                  onChange={(e) => setSecaoTodasAsPecasTitulo(e.target.value)}
                  placeholder="Ex: Todas as Peças ou Coleção Completa"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subtítulo Explicativo</label>
                <input
                  type="text"
                  value={secaoTodasAsPecasSubtitulo}
                  onChange={(e) => setSecaoTodasAsPecasSubtitulo(e.target.value)}
                  placeholder="Ex: Conheça todas as criações exclusivas disponíveis..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {secaoTodasAsPecasCustomizado && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fonte do Título</label>
                  <select
                    value={secaoTodasAsPecasFont}
                    onChange={(e) => setSecaoTodasAsPecasFont(e.target.value)}
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
                      value={secaoTodasAsPecasTituloDark}
                      onChange={(e) => setSecaoTodasAsPecasTituloDark(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={secaoTodasAsPecasTituloDark}
                      onChange={(e) => setSecaoTodasAsPecasTituloDark(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono uppercase rounded border border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fundo da Seção</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={secaoTodasAsPecasBgDark || '#141312'}
                      onChange={(e) => setSecaoTodasAsPecasBgDark(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setSecaoTodasAsPecasBgDark('')}
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

    {/* BLOCO 7: SEÇÕES DA PÁGINA INICIAL (VITRINE HOME) */}
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shrink-0">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                7. Seções da Página Inicial (Vitrine Home)
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {secoesLista.filter((s) => s.ativo).length} ativas / {secoesLista.length} no total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Personalize a ordem de exibição, visibilidade, títulos e gerencie diretamente as peças de cada vitrine.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddSectionModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Seção na Home</span>
        </button>
      </div>

      {/* Lista Compacta de Seções (Luxury Studio Density) */}
      <div className="space-y-2">
        {secoesLista.map((secao, index) => {
          const count = getSectionProductCount(secao);
          const isExpanded = editingSectionId === secao.id;

          let badgeIcon = <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
          let badgeLabel = '🌟 Lançamento';
          let badgeClass = 'bg-amber-50 text-amber-900 border-amber-200';

          if (secao.tipo === 'nativa_mais_vendidos') {
            badgeIcon = <Flame className="w-3.5 h-3.5 text-purple-600" />;
            badgeLabel = '🔥 Mais Vendido';
            badgeClass = 'bg-purple-50 text-purple-900 border-purple-200';
          } else if (secao.tipo === 'nativa_outlet') {
            badgeIcon = <Tag className="w-3.5 h-3.5 text-rose-600" />;
            badgeLabel = '🏷️ Outlet';
            badgeClass = 'bg-rose-50 text-rose-900 border-rose-200';
          } else if (secao.tipo === 'nativa_ultimas_pecas') {
            badgeIcon = <Clock className="w-3.5 h-3.5 text-orange-600" />;
            badgeLabel = '⏳ Últimas Peças';
            badgeClass = 'bg-orange-50 text-orange-900 border-orange-200';
          } else if (secao.tipo === 'nativa_todas_pecas') {
            badgeIcon = <Layers className="w-3.5 h-3.5 text-slate-600" />;
            badgeLabel = '📁 Catálogo Geral';
            badgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
          } else if (secao.tipo === 'categoria') {
            badgeIcon = <FolderOpen className="w-3.5 h-3.5 text-sky-600" />;
            badgeLabel = `📁 Categoria: ${secao.categoriaNome || 'Geral'}`;
            badgeClass = 'bg-sky-50 text-sky-900 border-sky-200';
          } else if (secao.tipo === 'custom_curadoria') {
            badgeIcon = <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
            badgeLabel = '✨ Curadoria Especial';
            badgeClass = 'bg-amber-100/60 text-amber-950 border-amber-300';
          }

          return (
            <div
              key={secao.id}
              className={cn(
                'border rounded-xl transition-all duration-150',
                secao.ativo
                  ? 'border-slate-200 bg-white hover:border-slate-300'
                  : 'border-slate-200/60 bg-slate-50/60 opacity-75'
              )}
            >
              {/* Linha Principal da Seção (Horizontal Compacta ~52px) */}
              <div className="p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Lado Esquerdo: Controles de Posição, Ícone e Título */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Botões de Subir / Descer Ordem */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSectionUp(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para cima na vitrine"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === secoesLista.length - 1}
                      onClick={() => handleMoveSectionDown(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para baixo na vitrine"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {secao.titulo}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          badgeClass
                        )}
                      >
                        {badgeIcon}
                        <span>{badgeLabel}</span>
                      </span>
                    </div>
                    {secao.subtitulo && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 hidden sm:block">
                        {secao.subtitulo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Contagem de Peças, Ações e Toggle */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end shrink-0">
                  {/* Badge de Contagem de Peças em Tempo Real */}
                  <span
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-lg font-mono font-semibold flex items-center gap-1',
                      count > 0
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    )}
                    title={
                      count === 0
                        ? 'Atenção: como esta seção possui 0 peças qualificadas em estoque, a vitrine da Home oculta a seção automaticamente para evitar espaços em branco.'
                        : `${count} peças prontas para exibição nesta vitrine`
                    }
                  >
                    <span>{count} peça(s)</span>
                    {count === 0 && <span className="text-[10px] font-sans font-bold text-amber-700 hidden sm:inline">(Oculta)</span>}
                  </span>

                  {/* Botão Gerenciar Peças da Seção */}
                  <button
                    type="button"
                    onClick={() => setCuratingSection(secao)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Adicionar ou remover peças desta seção com 1 clique"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gerenciar Peças</span>
                  </button>

                  {/* Botão Editar Textos & Visual Inline */}
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(isExpanded ? null : secao.id)}
                    className={cn(
                      'p-1.5 rounded-lg text-xs transition-colors cursor-pointer border',
                      isExpanded
                        ? 'bg-slate-900 text-amber-400 border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                    )}
                    title={isExpanded ? 'Fechar edição' : 'Editar título e subtítulo'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Switch Ativa / Oculta */}
                  <button
                    type="button"
                    onClick={() => handleToggleSectionActive(secao.id)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                      secao.ativo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    )}
                    title={secao.ativo ? 'Clique para ocultar da Home' : 'Clique para exibir na Home'}
                  >
                    {secao.ativo ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Ativa</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Oculta</span>
                      </>
                    )}
                  </button>

                  {/* Botão Excluir */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(secao.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remover seção da vitrine da Home"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Gaveta de Edição de Textos e Cores (Inline Expansível) */}
              {isExpanded && (
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 rounded-b-xl space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Título Exibido na Vitrine:
                      </label>
                      <input
                        type="text"
                        value={secao.titulo}
                        onChange={(e) => handleUpdateSectionField(secao.id, 'titulo', e.target.value)}
                        placeholder="Ex: Lançamentos Exclusivos"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subtítulo / Descrição de Apoio:
                      </label>
                      <input
                        type="text"
                        value={secao.subtitulo || ''}
                        onChange={(e) => handleUpdateSectionField(secao.id, 'subtitulo', e.target.value)}
                        placeholder="Ex: As últimas novidades que acabaram de chegar..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      ID interno da seção: <code className="font-mono text-slate-700">#{secao.id}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingSectionId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
                    >
                      Fechar Edição
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* BLOCO 8: EXIBIÇÃO DE ESTOQUE PARA O CONSUMIDOR NA VITRINE & MODAL */}
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                8. Exibição de Estoque para o Consumidor
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

    {/* BLOCO 9: SINALIZADORES COMERCIAIS DA VITRINE (BADGES) */}
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                9. Sinalizadores Comerciais da Vitrine (Badges)
              </h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${exibirBadgesNaVitrine ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {exibirBadgesNaVitrine ? 'Badges Ativos na Vitrine' : 'Visual Limpo (Minimal Luxury)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Escolha se as fotos das peças na vitrine pública devem exibir selos sobrepostos (ex: Lançamento, Mais Vendido, Outlet) ou manter as imagens 100% limpas.
            </p>
          </div>
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

      {/* Interruptores de Exibição de Selos sobre as Fotos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Interruptor 1: Badges Comerciais Gerais */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Exibir Selos Comerciais nas Fotos
              </span>
              <span className="text-[10px] text-slate-500">
                (Mais Vendido, Lançamento, Outlet, Badges Personalizados)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExibirBadgesNaVitrine(!exibirBadgesNaVitrine)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs',
                exibirBadgesNaVitrine
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              )}
            >
              {exibirBadgesNaVitrine ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                  <span>Exibindo</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Ocultos (Foto Limpa)</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {exibirBadgesNaVitrine
              ? '✓ Os sinalizadores que você configurar aparecerão sobre a foto das peças no catálogo (com inteligência de contexto para não repetir selo na própria seção).'
              : '🔒 As imagens das peças na loja ficam 100% livres de selos flutuantes, valorizando o ensaio fotográfico e o acabamento nobre.'}
          </p>
        </div>

        {/* Interruptor 2: Selo de Escassez na Foto */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Exibir Selo de Escassez na Foto
              </span>
              <span className="text-[10px] text-slate-500">
                (Adesivo &quot;Restam X peças&quot; ou &quot;Última peça&quot; sobreposto à foto)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExibirSeloEscassezFoto(!exibirSeloEscassezFoto)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs',
                exibirSeloEscassezFoto
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              )}
            >
              {exibirSeloEscassezFoto ? (
                <>
                  <ToggleRight className="w-4 h-4 text-amber-600" />
                  <span>Exibindo Selo</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Foto Sem Selo</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {exibirSeloEscassezFoto
              ? '✓ Peças com estoque baixo (&le; 5 unidades) colarão um selo marrom de urgência sobre a imagem.'
              : '🔒 A escassez será comunicada apenas no modal e no botão de sacola, mantendo o card da vitrine visualmente elegante.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
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
        <span>{isSaving ? 'Salvando Vitrine...' : 'Salvar Aparência da Loja Virtual'}</span>
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

    {/* MODAL PARA ADICIONAR NOVA SEÇÃO NA HOME */}
    {isAddSectionModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Adicionar Seção na Página Inicial
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddSectionModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Abas do Tipo de Seção */}
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setNewSectionType('categoria')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center',
                newSectionType === 'categoria'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Por Categoria
            </button>
            <button
              type="button"
              onClick={() => setNewSectionType('custom_curadoria')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center',
                newSectionType === 'custom_curadoria'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Curadoria Manual
            </button>
            <button
              type="button"
              onClick={() => setNewSectionType('restaurar_nativa')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center',
                newSectionType === 'restaurar_nativa'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Restaurar Seção
            </button>
          </div>

          {/* Conteúdo da Modalidade 1: Por Categoria */}
          {newSectionType === 'categoria' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Selecione a Categoria da Loja:
                </label>
                <select
                  value={selectedNewCatId}
                  onChange={(e) => {
                    setSelectedNewCatId(e.target.value);
                    const cat = categoriesList.find((c) => c.id === e.target.value);
                    if (cat && !newSectionTitle) {
                      setNewSectionTitle(cat.nome);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} ({catalogProducts.filter((p) => p.categoria_id === cat.id).length} peças)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Título da Seção na Vitrine:
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Ex: Vestidos & Macacões Nobres"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Subtítulo / Descrição de Apoio:
                </label>
                <input
                  type="text"
                  value={newSectionSubtitle}
                  onChange={(e) => setNewSectionSubtitle(e.target.value)}
                  placeholder="Ex: As peças com maior elegância e caimento impecável..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Conteúdo da Modalidade 2: Curadoria Manual */}
          {newSectionType === 'custom_curadoria' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Título da Coleção / Vitrine:
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Ex: Coleção Réveillon 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Subtítulo / Frase de Efeito:
                </label>
                <input
                  type="text"
                  value={newSectionSubtitle}
                  onChange={(e) => setNewSectionSubtitle(e.target.value)}
                  placeholder="Ex: Seleção especial de peças para comemorar os melhores momentos..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                💡 <strong>Dica:</strong> Após criar esta seção, utilize o botão <strong>"Gerenciar Peças"</strong> na lista para selecionar exatamente quais modelos farão parte dela.
              </div>
            </div>
          )}

          {/* Conteúdo da Modalidade 3: Restaurar Seção Nativa */}
          {newSectionType === 'restaurar_nativa' && (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-500 text-[11px]">
                Se você excluiu alguma das seções comerciais padrão da vitrine, clique para restaurá-la:
              </p>

              {SECOES_VITRINE_PADRAO.filter((p) => !secoesLista.some((s) => s.id === p.id)).length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  Todas as seções padrão já estão presentes na sua vitrine.
                </div>
              ) : (
                <div className="space-y-2">
                  {SECOES_VITRINE_PADRAO.filter((p) => !secoesLista.some((s) => s.id === p.id)).map((padrao) => (
                    <div
                      key={padrao.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{padrao.titulo}</span>
                        <span className="text-[11px] text-slate-500 block">{padrao.subtitulo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreNativeSection(padrao.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botões do Rodapé do Modal */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSectionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            {newSectionType !== 'restaurar_nativa' && (
              <button
                type="button"
                onClick={handleCreateNewSection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-2xs cursor-pointer"
              >
                Adicionar à Vitrine
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* MODAL DE CURADORIA DE PEÇAS DA SEÇÃO */}
    {curatingSection && (
      <AdminCollectionsManagerModal
        isOpen={Boolean(curatingSection)}
        onClose={() => setCuratingSection(null)}
        products={catalogProducts}
        categoriesList={categoriesList}
        tenantId={tenantId}
        initialTab={
          curatingSection.tipo === 'nativa_lancamentos'
            ? 'destaque'
            : curatingSection.tipo === 'nativa_mais_vendidos'
            ? 'mais_vendido'
            : curatingSection.tipo === 'nativa_outlet'
            ? 'outlet'
            : curatingSection.tipo === 'nativa_ultimas_pecas'
            ? 'ultimas_pecas'
            : curatingSection.tipo === 'categoria'
            ? 'categorias'
            : 'destaque'
        }
        initialCategoryId={curatingSection.categoriaId}
        onProductsUpdated={(updated) => {
          setCatalogProducts(updated);
        }}
        onUpdated={async () => {
          await refreshCatalogData();
          try {
            await refreshProducts();
          } catch { }
          showToast(`Peças da seção "${curatingSection.titulo}" atualizadas com sucesso!`);
        }}
        onToast={showToast}
      />
    )}
  </form>
);
}
