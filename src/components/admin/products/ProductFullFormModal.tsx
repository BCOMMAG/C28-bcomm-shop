'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Sliders,
  Tag,
  DollarSign,
  Upload,
  Video,
  Layers,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  FileText,
  Star,
  Palette,
  Eye,
  Lock,
  Sparkles,
  ScrollText,
  AlertCircle,
  Package,
  Check,
  Settings,
  Truck,
  FolderTree,
  Search,
  RotateCcw,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  AdminProductItem,
  AdminCategoryFull,
  StoreCustomAttributes,
  createAdminProduct,
  updateAdminProductFull,
  saveAdminCategory,
  saveStoreCustomAttribute,
  CreateProductInput,
  UpdateProductInput,
  ColecaoLojaItem,
  getColecoesLoja,
  bulkUpdateProdutosColecao,
  CategoriaNode,
  getCategoriaTree,
  saveCategoriaNode,
  checkOrAcquireProductLock,
  heartbeatProductLock,
  releaseProductLock,
  forceAcquireProductLock,
  requestUnlockProduct,
  ProductLockInfo
} from '@/lib/admin';
import { getStoredActiveMember } from '@/lib/team';
import { notifyStockChangeCrossTab } from '@/context/StoreContext';
import { AdminCreatableSelect } from '@/components/admin/products/AdminCreatableSelect';
import { AdminCategorySearchSelect } from '@/components/admin/products/AdminCategorySearchSelect';
import { AdminColorSearchSelect } from '@/components/admin/products/AdminColorSearchSelect';
import { CrossSellPickerModal } from '@/components/admin/products/CrossSellPickerModal';
import { ProductVariationPriceMatrix, PrecoVariavelItem } from '@/components/admin/products/ProductVariationPriceMatrix';
import { ProductMediaGalleryManager, FormMediaItem } from '@/components/admin/products/ProductMediaGalleryManager';
import { ProductCardPreviewDrawer } from '@/components/admin/products/ProductCardPreviewDrawer';
import { AdminSinalizadoresModal } from '@/components/admin/products/AdminSinalizadoresModal';
import { BOUTIQUE_OFFICIAL_COLORS } from '@/components/admin/products/ProductBatchImportModal';
import { parseMediaColor, isVideoUrl, detectMediaType } from '@/lib/products';
import { useAdminI18n } from '@/context/AdminI18nContext';

export interface ProductFullFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  product?: AdminProductItem | null;
  categoriesList: AdminCategoryFull[];
  allProducts?: AdminProductItem[];
  storeAttributes: StoreCustomAttributes;
  tenantId: string;
  tenantSlug?: string;
  onClose: () => void;
  onSaved: (savedProduct: AdminProductItem, isNew: boolean) => void;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
  onCategoriesUpdated?: (updated: AdminCategoryFull[]) => void;
  onStoreAttributesUpdated?: (updated: StoreCustomAttributes) => void;
}

export function ProductFullFormModal({
  isOpen,
  mode,
  product,
  categoriesList,
  allProducts = [],
  storeAttributes,
  tenantId,
  tenantSlug = 'leidy-boutique',
  onClose,
  onSaved,
  onToast,
  onCategoriesUpdated,
  onStoreAttributesUpdated
}: ProductFullFormModalProps) {
  const isEdit = mode === 'edit' && Boolean(product);
  const { t, currency, formatCurrency } = useAdminI18n();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

  // Controle de Visualização: Abas vs Página Única (Scroll)
  const [viewMode, setViewMode] = useState<'abas' | 'scroll'>('abas');
  const [activeTab, setActiveTab] = useState<'geral' | 'midias' | 'grade' | 'comercial'>('geral');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Aba 1: Dados Gerais & Estilo
  const [nome, setNome] = useState(product?.nome || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [ativo, setAtivo] = useState<boolean>(product ? Boolean(product.ativo) : true);
  const [categoriaId, setCategoriaId] = useState(product?.categoria_id || '');
  const [subcategoria, setSubcategoria] = useState(product?.subcategoria || '');
  const [tecido, setTecido] = useState(product?.tecido || 'Crepe Alfaiataria');
  const [modelagem, setModelagem] = useState(product?.modelagem || 'Fluido');
  const [linha, setLinha] = useState(product?.linha || 'Alto Verão');
  const [descricao, setDescricao] = useState(product?.descricao || '');
  const [especificacoesTexto, setEspecificacoesTexto] = useState('');

  // Aba 2: Mídias
  const [mediaList, setMediaList] = useState<FormMediaItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Aba 3: Grade de Estoque Físico & Aba 4: Precificação
  const [variacoes, setVariacoes] = useState<
    Array<{ id?: string; cor_nome: string; cor_hex: string; tamanho: string; estoque: number; sku?: string | null }>
  >([]);
  const [precosDiferenciados, setPrecosDiferenciados] = useState<Record<string, PrecoVariavelItem>>({});

  // Organização e Performance da Grade de Estoque (Aba 3)
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockViewMode, setStockViewMode] = useState<'grouped' | 'list'>('grouped');

  // Construtor Multi-Tamanhos por Cor
  const [selectedColorPreset, setSelectedColorPreset] = useState<string>('custom');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111111');
  const [multiSizeRows, setMultiSizeRows] = useState<Array<{ id: string; tamanho: string; estoque: number }>>([
    { id: 'size_1', tamanho: 'M', estoque: 5 }
  ]);

  // Aba 4: Comercial, CMV & Look Combinado
  const [preco, setPreco] = useState<number>(product?.preco || 0);
  const [precoPromocional, setPrecoPromocional] = useState<string>(
    product?.preco_promocional ? String(product.preco_promocional) : ''
  );
  const [precoCusto, setPrecoCusto] = useState<string>(product?.preco_custo ? String(product.preco_custo) : '');
  const [destaque, setDestaque] = useState(Boolean(product?.destaque));
  const [maisVendido, setMaisVendido] = useState(Boolean(product?.mais_vendido));
  const [outlet, setOutlet] = useState(Boolean(product?.outlet));
  const [ultimasPecas, setUltimasPecas] = useState(Boolean(product?.ultimas_pecas));
  const [customBadgesSelected, setCustomBadgesSelected] = useState<string[]>([]);

  // Criação inline de Badge
  const [isAddingCustomBadge, setIsAddingCustomBadge] = useState(false);
  const [newCustomBadgeName, setNewCustomBadgeName] = useState('');
  const [newCustomBadgeColor, setNewCustomBadgeColor] = useState('#d97706');
  const [newCustomBadgeIcon, setNewCustomBadgeIcon] = useState('✨');

  // Coleções e Cápsulas da Loja
  const [colecoesLoja, setColecoesLoja] = useState<ColecaoLojaItem[]>([]);
  const [selectedColecaoIds, setSelectedColecaoIds] = useState<string[]>([]);

  // Árvore Hierárquica de Categorias da Loja
  const [categoryTree, setCategoryTree] = useState<CategoriaNode[]>([]);

  // Sinalizadores Globais
  const [isSinalizadoresModalOpen, setIsSinalizadoresModalOpen] = useState(false);

  // Dimensões e Peso para Envio (Opcional - Piloto Automático se vazio)
  const [pesoKg, setPesoKg] = useState<string>('');
  const [alturaCm, setAlturaCm] = useState<string>('');
  const [larguraCm, setLarguraCm] = useState<string>('');
  const [comprimentoCm, setComprimentoCm] = useState<string>('');

  // Cross-Sell / Monte o Look
  const [pairedSlugs, setPairedSlugs] = useState<string[]>([]);
  const [isCrossSellPickerOpen, setIsCrossSellPickerOpen] = useState(false);

  // Alerta de Alta Densidade (200+ Variações)
  const [showHighDensityWarning, setShowHighDensityWarning] = useState(false);
  const [hasConfirmedHighDensity, setHasConfirmedHighDensity] = useState(false);

  // Toast
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast(msg, type === 'info' ? 'success' : type);
  };

  // Estados de Bloqueio de Concorrência & Presença em Tempo Real
  const [productLock, setProductLock] = useState<ProductLockInfo | null>(null);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [lockRequestSent, setLockRequestSent] = useState(false);
  const [incomingUnlockRequest, setIncomingUnlockRequest] = useState<{
    solicitante_nome: string;
    solicitado_em: string;
  } | null>(null);

  // Helper para contraste em cores claras
  const isLightColor = (hex: string) => {
    const clean = (hex || '').replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 210;
  };

  // Gerenciamento de Presença & Lock de Edição
  useEffect(() => {
    if (!isOpen || !product?.id || mode !== 'edit') {
      setIsLockedByOther(false);
      setIsReadOnlyMode(false);
      setProductLock(null);
      setLockRequestSent(false);
      return;
    }

    const member = getStoredActiveMember();
    const currentUser = {
      id: member?.id || 'admin_local',
      nome: member?.nome || 'Operador da Loja',
      email: member?.email || undefined
    };

    let heartbeatTimer: any = null;

    async function initLock() {
      if (!product?.id) return;
      const res = await checkOrAcquireProductLock(product.id, tenantId, currentUser);
      if (res.lockedByOther && res.lockInfo) {
        setProductLock(res.lockInfo);
        setIsLockedByOther(true);
      } else {
        setIsLockedByOther(false);
        setIsReadOnlyMode(false);
        setProductLock(res.lockInfo || null);

        // Inicia heartbeat a cada 20 segundos
        heartbeatTimer = setInterval(async () => {
          if (!product?.id) return;
          const hbRes = await heartbeatProductLock(product.id, currentUser.id);
          if (hbRes.solicitacaoLiberacao) {
            setIncomingUnlockRequest(hbRes.solicitacaoLiberacao);
          }
        }, 20000);
      }
    }

    initLock();

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (product?.id) {
        releaseProductLock(product.id, currentUser.id);
      }
    };
  }, [isOpen, product?.id, mode, tenantId]);

  const handleCloseModal = () => {
    if (product?.id && mode === 'edit') {
      const member = getStoredActiveMember();
      const userId = member?.id || 'admin_local';
      releaseProductLock(product.id, userId);
    }
    setIsLockedByOther(false);
    setIsReadOnlyMode(false);
    onClose();
  };

  // Carrega preferência de visualização do localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('admin_product_form_view_mode');
      if (savedMode === 'abas' || savedMode === 'scroll') {
        setViewMode(savedMode);
      }
    } catch {}
  }, []);

  // Inicialização do estado baseado no produto (edição) ou padrão (criação)
  useEffect(() => {
    if (isEdit && product) {
      setNome(product.nome);
      setSlug(product.slug);
      setAtivo(product.ativo !== undefined ? Boolean(product.ativo) : true);
      setCategoriaId(product.categoria_id || '');
      setSubcategoria(product.subcategoria || '');
      setTecido(product.tecido || 'Crepe Alfaiataria');
      setModelagem(product.modelagem || 'Fluido');
      setLinha(product.linha || 'Alto Verão');
      setDescricao(product.descricao || '');
      setPreco(product.preco || 0);
      setPrecoPromocional(product.preco_promocional ? String(product.preco_promocional) : '');
      setPrecoCusto(product.preco_custo ? String(product.preco_custo) : '');
      setDestaque(Boolean(product.destaque));
      setMaisVendido(Boolean(product.mais_vendido));
      setOutlet(Boolean(product.outlet));
      setUltimasPecas(Boolean(product.ultimas_pecas));

      // Paired slugs (Cross-Sell)
      const pList = product.paired_with_slug
        ? product.paired_with_slug.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setPairedSlugs(pList);

      // Detalhes JSONB: Especificações, Badges, Preços Diferenciados
      let specs: string[] = [];
      let badges: string[] = [];
      let precosDiff: Record<string, PrecoVariavelItem> = {};

      if (product.detalhes) {
        if (Array.isArray(product.detalhes)) {
          product.detalhes.forEach((d) => {
            if (typeof d === 'string' && d.startsWith('[Badge] ')) {
              badges.push(d.replace('[Badge] ', '').trim());
            } else if (typeof d === 'string') {
              specs.push(d);
            }
          });
        } else if (typeof product.detalhes === 'object') {
          if (Array.isArray(product.detalhes.especificacoes)) {
            specs = product.detalhes.especificacoes;
          }
          if (Array.isArray(product.detalhes.badges)) {
            product.detalhes.badges.forEach((b: string) => {
              badges.push(b.replace('[Badge] ', '').trim());
            });
          }
          if (product.detalhes.precos_diferenciados) {
            precosDiff = product.detalhes.precos_diferenciados;
          }
          if (product.detalhes.dimensoes_frete) {
            const df = product.detalhes.dimensoes_frete;
            setPesoKg(df.peso_kg !== undefined && df.peso_kg !== null ? String(df.peso_kg) : '');
            setAlturaCm(df.altura_cm !== undefined && df.altura_cm !== null ? String(df.altura_cm) : '');
            setLarguraCm(df.largura_cm !== undefined && df.largura_cm !== null ? String(df.largura_cm) : '');
            setComprimentoCm(df.comprimento_cm !== undefined && df.comprimento_cm !== null ? String(df.comprimento_cm) : '');
          } else {
            setPesoKg('');
            setAlturaCm('');
            setLarguraCm('');
            setComprimentoCm('');
          }
        }
      }
      setEspecificacoesTexto(specs.join('\n'));
      // Remove tags do sistema do array de badges customizados para evitar duplicidade
      const coreLabels = ['Lançamento', 'Destaque', 'Mais Vendido', 'Outlet', 'Últimas Peças', 'destaque', 'mais_vendido', 'outlet', 'ultimas_pecas'];
      setCustomBadgesSelected(badges.filter((b) => !coreLabels.includes(b)));
      setPrecosDiferenciados(precosDiff);

      // Mídias
      let existingMidias: FormMediaItem[] = (product.midias || [])
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((m, idx) => {
          const isVid = detectMediaType(m.tipo, m.url) === 'video';
          return {
            id: m.id,
            url: m.url,
            tipo: isVid ? 'video' : 'image',
            label: m.label || (isVid ? 'Vídeo do Produto' : (idx === 0 ? 'Capa Principal' : `Foto ${idx + 1}`)),
            display_order: m.display_order ?? idx
          };
        });

      // Se a foto_principal não estiver na lista de mídias e não for vídeo, inclui no início
      if (product.foto_principal && !isVideoUrl(product.foto_principal) && !existingMidias.some((m) => m.url === product.foto_principal)) {
        existingMidias.unshift({
          id: 'capa_inicial',
          url: product.foto_principal,
          tipo: 'image',
          label: 'Capa Principal',
          display_order: 0
        });
      }

      // Regra de Ouro: Garante que um vídeo NUNCA fique como Capa Principal (posição 0)
      if (existingMidias.length > 0 && existingMidias[0].tipo === 'video') {
        const firstPhotoIdx = existingMidias.findIndex((m) => m.tipo === 'image' && !isVideoUrl(m.url));
        if (firstPhotoIdx > 0) {
          const [photo] = existingMidias.splice(firstPhotoIdx, 1);
          existingMidias.unshift(photo);
        }
      }

      existingMidias = existingMidias.map((m, idx) => ({ ...m, display_order: idx }));
      setMediaList(existingMidias);
      setCoverIndex(0);

      // Variações
      const existingVars = (product.variacoes || []).map((v) => ({
        id: v.id,
        cor_nome: v.cor_nome,
        cor_hex: v.cor_hex,
        tamanho: v.tamanho,
        estoque: v.estoque,
        sku: v.sku || ''
      }));
      setVariacoes(existingVars);
    } else {
      // Modo Criação do zero
      setNome('');
      setSlug('');
      setAtivo(true);
      setCategoriaId('');
      setSubcategoria('');
      setTecido('Crepe Alfaiataria');
      setModelagem('Fluido');
      setLinha('Alto Verão');
      setDescricao('');
      setEspecificacoesTexto('');
      setPreco(0);
      setPrecoPromocional('');
      setPrecoCusto('');
      setDestaque(true);
      setMaisVendido(false);
      setOutlet(false);
      setUltimasPecas(false);
      setCustomBadgesSelected([]);
      setPairedSlugs([]);
      setPrecosDiferenciados({});
      setPesoKg('');
      setAlturaCm('');
      setLarguraCm('');
      setComprimentoCm('');
      setMediaList([]);
      setCoverIndex(0);

      // Grade inicial amigável (Preto P e M, Terracota P e M)
      setVariacoes([
        { cor_nome: 'Preto', cor_hex: '#111111', tamanho: 'P', estoque: 3, sku: '' },
        { cor_nome: 'Preto', cor_hex: '#111111', tamanho: 'M', estoque: 5, sku: '' },
        { cor_nome: 'Terracota Nobre', cor_hex: '#C05A46', tamanho: 'P', estoque: 2, sku: '' },
        { cor_nome: 'Terracota Nobre', cor_hex: '#C05A46', tamanho: 'M', estoque: 4, sku: '' }
      ]);
    }
  }, [isEdit, product, isOpen]);

  // Carrega coleções disponíveis na loja e identifica quais contêm esta peça
  useEffect(() => {
    let isMounted = true;
    getColecoesLoja(tenantId).then((cols) => {
      if (!isMounted) return;
      setColecoesLoja(cols);
      if (product) {
        const matchingIds: string[] = [];
        cols.forEach((c) => {
          const inCol = Array.isArray(c.produto_ids) && (c.produto_ids.includes(product.id) || (product.slug && c.produto_ids.includes(product.slug)));
          const inLegacy =
            (c.id === 'base-lancamentos' && product.destaque) ||
            (c.id === 'base-mais-vendidos' && product.mais_vendido) ||
            (c.id === 'base-outlet' && product.outlet) ||
            (c.id === 'base-ultimas-pecas' && product.ultimas_pecas);
          if (inCol || inLegacy) {
            matchingIds.push(c.id);
          }
        });
        setSelectedColecaoIds(matchingIds);
      } else {
        // No modo criação, marca Lançamento por padrão se existir
        const lancamentoCol = cols.find((c) => c.id === 'base-lancamentos' || c.slug === 'lancamentos-2026');
        if (lancamentoCol) {
          setSelectedColecaoIds([lancamentoCol.id]);
        }
      }
    }).catch((err) => {
      console.error('Erro ao carregar coleções no modal de produto:', err);
    });

    getCategoriaTree(tenantId).then((nodes) => {
      if (!isMounted) return;
      setCategoryTree(nodes);
    }).catch((err) => {
      console.error('Erro ao carregar árvore de categorias no modal de produto:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [tenantId, product, isOpen]);

  // Auto-geração e padronização contínua do slug do sistema
  const handleNameChange = (val: string) => {
    setNome(val);
    if (!isEdit || !slug) {
      setSlug(normalizeSlug(val));
    }
  };

  const normalizeSlug = (text: string) => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Cores cadastradas estritamente na grade física desta peça (deduplicadas case-insensitive e ordenadas A-Z)
  const gradeColors = React.useMemo(() => {
    const map = new Map<string, { nome: string; hex?: string }>();
    variacoes.forEach((v) => {
      const trimmed = (v.cor_nome || '').trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!map.has(lower)) {
        const canonical = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        map.set(lower, { nome: canonical, hex: v.cor_hex || '#111' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [variacoes]);

  // Variações agrupadas por Cor para exibição limpa e ultrarrápida na Seção 3
  const groupedVariations = React.useMemo(() => {
    const map = new Map<string, { cor_nome: string; cor_hex: string; items: typeof variacoes }>();
    variacoes.forEach((v) => {
      const trimmed = (v.cor_nome || '').trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!map.has(lower)) {
        const canonical = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        map.set(lower, { cor_nome: canonical, cor_hex: v.cor_hex || '#111', items: [] });
      }
      map.get(lower)!.items.push(v);
    });

    let groups = Array.from(map.values());
    groups.sort((a, b) => a.cor_nome.localeCompare(b.cor_nome));

    if (stockSearchTerm.trim()) {
      const q = stockSearchTerm.trim().toLowerCase();
      groups = groups
        .map((g) => {
          const matchColor = g.cor_nome.toLowerCase().includes(q);
          const filteredItems = g.items.filter(
            (item) => item.tamanho.toLowerCase().includes(q) || (item.sku && item.sku.toLowerCase().includes(q))
          );
          if (matchColor) return g;
          if (filteredItems.length > 0) return { ...g, items: filteredItems };
          return null;
        })
        .filter(Boolean) as typeof groups;
    }

    return groups;
  }, [variacoes, stockSearchTerm]);

  // Variações em lista plana ordenadas por Cor (A-Z) e Tamanho para a visão lista
  const sortedFlatVariations = React.useMemo(() => {
    let list = [...variacoes];
    list.sort((a, b) => {
      const corComp = (a.cor_nome || '').localeCompare(b.cor_nome || '');
      if (corComp !== 0) return corComp;
      return (a.tamanho || '').localeCompare(b.tamanho || '');
    });

    if (stockSearchTerm.trim()) {
      const q = stockSearchTerm.trim().toLowerCase();
      list = list.filter(
        (v) =>
          (v.cor_nome || '').toLowerCase().includes(q) ||
          (v.tamanho || '').toLowerCase().includes(q) ||
          (v.sku || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [variacoes, stockSearchTerm]);

  // Cores ativas na grade somadas com cores de fotos e paleta da boutique para alimentar a galeria de mídias sem perder nenhuma cor
  const availableColorsForMedia = React.useMemo(() => {
    const map = new Map<string, { nome: string; hex?: string }>();
    const register = (nome?: string | null, hex?: string | null) => {
      const clean = (nome || '').trim();
      if (!clean) return;
      const lower = clean.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { nome: clean, hex: hex || '#111' });
      }
    };

    // 1. Cores na grade física
    variacoes.forEach((v) => register(v.cor_nome, v.cor_hex));

    // 2. Cores já etiquetadas nas mídias do produto
    mediaList.forEach((m) => {
      const p = parseMediaColor(m.label || undefined);
      if (p.colorName) register(p.colorName);
    });

    // 3. Cores em fotos_por_cor do dossiê
    const fotosPorCor = (product?.detalhes as any)?.fotos_por_cor;
    if (fotosPorCor && typeof fotosPorCor === 'object') {
      Object.keys(fotosPorCor).forEach((cor) => register(cor));
    }

    // 4. Cores nos atributos da loja
    if (storeAttributes?.cores && Array.isArray(storeAttributes.cores)) {
      storeAttributes.cores.forEach((c: any) => {
        if (typeof c === 'string') register(c);
        else if (c && c.nome) register(c.nome, c.hex);
      });
    }

    // 5. Paleta oficial da boutique
    BOUTIQUE_OFFICIAL_COLORS.forEach((c) => register(c.nome, c.hex));

    return Array.from(map.values());
  }, [variacoes, mediaList, product, storeAttributes]);

  // Alias para retrocompatibilidade
  const availableColors = gradeColors;

  // Ordem customizada dos tamanhos definida pelo lojista na matriz
  const [customSizeOrder, setCustomSizeOrder] = useState<string[] | null>(null);

  // Tamanhos ativos na grade para alimentar a matriz, respeitando a ordem do lojista
  const availableSizes = React.useMemo(() => {
    const set = new Set<string>();
    variacoes.forEach((v) => {
      if (v.tamanho) set.add(v.tamanho);
    });
    const rawSizes = Array.from(set);
    if (!customSizeOrder || customSizeOrder.length === 0) return rawSizes;

    return [...rawSizes].sort((a, b) => {
      const iA = customSizeOrder.indexOf(a);
      const iB = customSizeOrder.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return 0;
    });
  }, [variacoes, customSizeOrder]);

  // Reordenação dinâmica das variações quando o lojista move as colunas na matriz
  const handleReorderSizes = (newOrder: string[]) => {
    setCustomSizeOrder(newOrder);
    setVariacoes((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const iA = newOrder.indexOf(a.tamanho);
        const iB = newOrder.indexOf(b.tamanho);
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return 0;
      });
      return sorted;
    });
  };

  // Adição direta de tamanho em uma cor na grade ou na matriz
  const handleAddTamanhoNaCor = (corNome: string, tamanho: string, estoqueInicial: number = 0) => {
    const cleanTam = tamanho.trim().toUpperCase();
    if (!cleanTam) return;

    const exists = variacoes.some(
      (v) =>
        v.cor_nome.toLowerCase() === corNome.toLowerCase() &&
        v.tamanho.toUpperCase() === cleanTam
    );
    if (exists) {
      showToast(`O tamanho ${cleanTam} já existe para a cor ${corNome}.`, 'error');
      return;
    }

    const foundCor = availableColors.find(
      (c) => c.nome.toLowerCase() === corNome.toLowerCase()
    );
    const corHex = foundCor?.hex || '#1A1918';

    const newVar = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cor_nome: corNome,
      cor_hex: corHex,
      tamanho: cleanTam,
      estoque: estoqueInicial,
      sku: `${slug || product?.slug || 'item'}-${corNome}-${cleanTam}`.toUpperCase()
    };

    setVariacoes((prev) => [...prev, newVar]);
    if (customSizeOrder && !customSizeOrder.includes(cleanTam)) {
      setCustomSizeOrder((prev) => (prev ? [...prev, cleanTam] : [cleanTam]));
    }
    showToast(`Tamanho ${cleanTam} adicionado com sucesso em ${corNome}!`, 'success');
  };

  // Alteração direta de estoque de variação (chamado pela Seção 3 ou Seção 4)
  const handleUpdateEstoqueVariacao = (corNome: string, tamanho: string, novoEstoque: number) => {
    const cleanTam = tamanho.trim();
    const cleanCor = corNome.trim();
    if (!cleanTam || !cleanCor) return;

    setVariacoes((prev) => {
      const idx = prev.findIndex(
        (v) =>
          (v.cor_nome || '').trim().toLowerCase() === cleanCor.toLowerCase() &&
          (v.tamanho || '').trim().toUpperCase() === cleanTam.toUpperCase()
      );
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, estoque: Math.max(0, novoEstoque) } : item
        );
      } else {
        if (novoEstoque <= 0) return prev;
        const foundCor = availableColors.find(
          (c) => (c.nome || '').trim().toLowerCase() === cleanCor.toLowerCase()
        );
        const corHex = foundCor?.hex || '#1A1918';
        const baseSlug = slug || normalizeSlug(nome) || 'PECA';
        const genSku = `${baseSlug}-${cleanCor}-${cleanTam}`
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9-]/g, '');

        const newVar = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          cor_nome: cleanCor,
          cor_hex: corHex,
          tamanho: cleanTam,
          estoque: Math.max(0, novoEstoque),
          sku: genSku
        };
        return [...prev, newVar];
      }
    });
  };

  // Exclusão completa da cor e de todas as suas unidades
  const handleDeleteCorVariacoes = (corNome: string) => {
    const cleanCor = corNome.trim().toLowerCase();
    setVariacoes((prev) =>
      prev.filter((v) => (v.cor_nome || '').trim().toLowerCase() !== cleanCor)
    );
    setPrecosDiferenciados((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.toLowerCase().startsWith(`${cleanCor}_`)) {
          delete updated[k];
        }
      });
      return updated;
    });
    showToast(`Cor "${corNome}" e suas variações foram removidas.`);
  };

  // Zerar estoque de todos os tamanhos da cor
  const handleZerarEstoqueCor = (corNome: string) => {
    const cleanCor = corNome.trim().toLowerCase();
    setVariacoes((prev) =>
      prev.map((v) =>
        (v.cor_nome || '').trim().toLowerCase() === cleanCor ? { ...v, estoque: 0 } : v
      )
    );
    showToast(`Estoque de todos os tamanhos da cor "${corNome}" foi zerado com sucesso!`);
  };

  // Cálculos em tempo real
  const parsedPromo = precoPromocional ? parseFloat(precoPromocional) : null;
  const parsedCost = precoCusto ? parseFloat(precoCusto) : null;
  const isPromoInconsistent = parsedPromo !== null && parsedPromo >= preco && preco > 0;
  const margemBrutaPct = preco > 0 && parsedCost ? (((preco - parsedCost) / preco) * 100).toFixed(1) : null;
  const lucroBrutoReais = preco > 0 && parsedCost ? preco - parsedCost : null;

  // Auto-geração de SKUs
  const handleAutoGenerateSKUs = () => {
    const baseSlug = slug || normalizeSlug(nome) || 'PECA';
    setVariacoes((prev) =>
      prev.map((v) => {
        const genSku = `${baseSlug}-${v.cor_nome}-${v.tamanho}`
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9-]/g, '');
        return { ...v, sku: genSku };
      })
    );
    showToast('Códigos SKU gerados automaticamente para todas as variações!');
  };

  // Presets de grade
  const handleApplySizePreset = (preset: 'pmg' | 'numeros') => {
    const presetSizes = preset === 'pmg' ? ['P', 'M', 'G'] : ['36', '38', '40', '42', '44'];
    setMultiSizeRows(presetSizes.map((t, idx) => ({ id: `size_preset_${idx}`, tamanho: t, estoque: 5 })));
    showToast(`Grade pré-definida ${preset === 'pmg' ? 'P, M, G' : '36 ao 44'} carregada no construtor!`);
  };

  // Adicionar cor com múltiplos tamanhos com proteção anti-duplicação
  const handleFinishColorMultiSizes = () => {
    if (!newColorName.trim()) {
      showToast('Digite o nome da cor.', 'error');
      return;
    }
    const rawCorNome = newColorName.trim();
    // Verifica se já existe uma cor cadastrada com grafia equivalente (case-insensitive)
    const existingCor = variacoes.find(
      (v) => (v.cor_nome || '').trim().toLowerCase() === rawCorNome.toLowerCase()
    );
    const corNomeFinal = existingCor
      ? existingCor.cor_nome
      : rawCorNome.charAt(0).toUpperCase() + rawCorNome.slice(1);
    const hexFinal = existingCor ? (existingCor.cor_hex || newColorHex || '#111111') : (newColorHex || '#111111');

    setVariacoes((prev) => {
      const nextVars = [...prev];
      multiSizeRows.forEach((row) => {
        const cleanTam = row.tamanho.trim();
        if (!cleanTam) return;
        const estNum = Number(row.estoque || 0);

        const existingVarIdx = nextVars.findIndex(
          (v) =>
            (v.cor_nome || '').trim().toLowerCase() === corNomeFinal.toLowerCase() &&
            (v.tamanho || '').trim().toUpperCase() === cleanTam.toUpperCase()
        );

        if (existingVarIdx !== -1) {
          nextVars[existingVarIdx] = {
            ...nextVars[existingVarIdx],
            estoque: nextVars[existingVarIdx].estoque + estNum
          };
        } else {
          const skuAuto = `${slug || normalizeSlug(nome) || 'PECA'}-${corNomeFinal}-${cleanTam}`
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9-]/g, '');

          nextVars.push({
            id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            cor_nome: corNomeFinal,
            cor_hex: hexFinal,
            tamanho: cleanTam,
            estoque: estNum,
            sku: skuAuto
          });
        }
      });
      return nextVars;
    });

    setNewColorName('');
    setSelectedColorPreset('custom');
    setMultiSizeRows([{ id: 'size_1', tamanho: 'M', estoque: 5 }]);
    showToast(`Cor "${corNomeFinal}" processada com sucesso na grade!`);
  };

  // Salvar Novo Atributo Customizado da Loja
  const handleCreateStoreAttribute = async (
    tipo: 'subcategorias' | 'tecidos' | 'modelagens' | 'colecoes' | 'tamanhos',
    novoItem: string
  ) => {
    try {
      const updated = await saveStoreCustomAttribute(tenantId, tipo, novoItem, 'add');
      if (onStoreAttributesUpdated) onStoreAttributesUpdated(updated);
      showToast(`"${novoItem}" cadastrado com sucesso nas opções da boutique!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar novo atributo.', 'error');
    }
  };

  // Criar Sinalizador Customizado
  const handleAddCustomBadge = async () => {
    if (!newCustomBadgeName.trim()) {
      showToast('Digite o nome do sinalizador.', 'error');
      return;
    }
    const badgeLabel = newCustomBadgeName.trim();
    const newBadge = {
      id: `badge_${Date.now()}`,
      nome: badgeLabel,
      cor: newCustomBadgeColor || '#d97706',
      label: badgeLabel,
      color: newCustomBadgeColor || '#d97706',
      icon: newCustomBadgeIcon || '✨',
      icone: newCustomBadgeIcon || '✨'
    };
    try {
      const updated = await saveStoreCustomAttribute(tenantId, 'sinalizadores' as any, newBadge, 'add');
      if (onStoreAttributesUpdated) onStoreAttributesUpdated(updated);
      setCustomBadgesSelected((prev) => [...prev, badgeLabel]);
      setNewCustomBadgeName('');
      setIsAddingCustomBadge(false);
      showToast(`Sinalizador "${badgeLabel}" criado e selecionado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar sinalizador.', 'error');
    }
  };

  // SALVAR FORMULÁRIO (Criação ou Edição)
  const handleExecuteSave = async () => {
    if (isReadOnlyMode) {
      showToast('Esta peça está em modo somente leitura pois outro operador está com ela aberta.', 'error');
      return;
    }
    if (!nome.trim()) {
      showToast('Informe o nome da peça.', 'error');
      setActiveTab('geral');
      return;
    }
    if (preco <= 0) {
      showToast('O preço de venda deve ser maior que zero.', 'error');
      setActiveTab('comercial');
      return;
    }
    if (variacoes.length === 0) {
      showToast('Cadastre ao menos uma variação (cor e tamanho) na grade da peça.', 'error');
      setActiveTab('grade');
      return;
    }

    // Alerta amigável de Alta Densidade (200+ Variações) com autonomia total
    if (variacoes.length >= 200 && !hasConfirmedHighDensity) {
      setShowHighDensityWarning(true);
      return;
    }

    // Guarda Anti-Blob: Impede salvar fotos temporárias que ainda estão em upload
    const pendingUploads = mediaList.filter((m) => m.isUploading || m.url.startsWith('blob:'));
    if (pendingUploads.length > 0) {
      showToast('Aguarde a conclusão do envio das fotos para o Cloudflare R2 antes de salvar.', 'error');
      setActiveTab('midias');
      return;
    }

    setIsSaving(true);
    try {
      const finalSlug = normalizeSlug(slug || nome);

      // Especificações e Badges
      const baseSpecs = especificacoesTexto
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const badgesArray = customBadgesSelected.map((b) => `[Badge] ${b}`);

      // Mapeamento rápido de fotos por cor (apenas fotos reais com upload concluído)
      const validMediaList = mediaList.filter((m) => !m.url.startsWith('blob:'));
      const fotosPorCorMap: Record<string, string[]> = {};
      validMediaList.forEach((m) => {
        const p = parseMediaColor(m.label || undefined);
        if (p.colorName && !p.isHidden) {
          if (!fotosPorCorMap[p.colorName]) fotosPorCorMap[p.colorName] = [];
          if (p.isColorCover) fotosPorCorMap[p.colorName].unshift(m.url);
          else fotosPorCorMap[p.colorName].push(m.url);
        }
      });

      const pesoKgNum = pesoKg.trim() ? parseFloat(pesoKg.replace(',', '.')) : undefined;
      const alturaCmNum = alturaCm.trim() ? parseFloat(alturaCm.replace(',', '.')) : undefined;
      const larguraCmNum = larguraCm.trim() ? parseFloat(larguraCm.replace(',', '.')) : undefined;
      const comprimentoCmNum = comprimentoCm.trim() ? parseFloat(comprimentoCm.replace(',', '.')) : undefined;

      const dimensoesFrete = (pesoKgNum || alturaCmNum || larguraCmNum || comprimentoCmNum) ? {
        peso_kg: pesoKgNum,
        altura_cm: alturaCmNum,
        largura_cm: larguraCmNum,
        comprimento_cm: comprimentoCmNum
      } : undefined;

      const detalhesPayload = {
        especificacoes: baseSpecs,
        badges: badgesArray,
        precos_diferenciados: Object.keys(precosDiferenciados).length > 0 ? precosDiferenciados : undefined,
        fotos_por_cor: Object.keys(fotosPorCorMap).length > 0 ? fotosPorCorMap : undefined,
        dimensoes_frete: dimensoesFrete
      };

      const orderedFotos = [...validMediaList];
      if (coverIndex > 0 && coverIndex < orderedFotos.length) {
        const [coverItem] = orderedFotos.splice(coverIndex, 1);
        orderedFotos.unshift(coverItem);
      }

      const totalEstoqueGrade = variacoes.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
      const pairedSlugFinal = pairedSlugs.join(',') || null;
      const firstVideo = orderedFotos.find((f) => f.tipo === 'video' || isVideoUrl(f.url));
      const firstImage = orderedFotos.find((f) => f.tipo === 'image' && !isVideoUrl(f.url));
      const safeFotoPrincipal = firstImage?.url || (product?.foto_principal && !isVideoUrl(product.foto_principal) ? product.foto_principal : null) || orderedFotos[0]?.url || '';

      if (isEdit && product) {
        // MODO EDIÇÃO
        const variacoesPayload = variacoes.map((v) => {
          const diff = precosDiferenciados[`${v.cor_nome}_${v.tamanho}`];
          const varPreco = diff?.preco !== undefined ? diff.preco : preco;
          const varPromo = diff?.preco_promocional !== undefined ? diff.preco_promocional : parsedPromo;
          return {
            ...v,
            preco: varPreco,
            preco_promocional: varPromo
          };
        });

        const updatePayload: UpdateProductInput = {
          id: product.id,
          loja_id: tenantId,
          nome: nome.trim(),
          slug: finalSlug,
          categoria_id: categoriaId || null,
          subcategoria: subcategoria.trim() || null,
          descricao: descricao.trim() || null,
          preco: preco,
          preco_promocional: parsedPromo,
          preco_custo: parsedCost,
          tecido: tecido || null,
          modelagem: modelagem || null,
          linha: linha || null,
          destaque: destaque,
          mais_vendido: maisVendido,
          outlet: outlet,
          ultimas_pecas: ultimasPecas,
          ativo: ativo,
          paired_with_slug: pairedSlugFinal,
          detalhes: detalhesPayload,
          precos_diferenciados: Object.keys(precosDiferenciados).length > 0 ? precosDiferenciados : null,
          fotos_por_cor: Object.keys(fotosPorCorMap).length > 0 ? fotosPorCorMap : null,
          foto_principal: safeFotoPrincipal,
          fotos: orderedFotos,
          video_provador_url: firstVideo ? firstVideo.url : null,
          variacoes: variacoesPayload
        };

        const res = await updateAdminProductFull(updatePayload);
        if (res.success) {
          // Sincroniza vínculos de coleções
          try {
            const savedId = product.id;
            for (const col of colecoesLoja) {
              const isSelected = selectedColecaoIds.includes(col.id);
              const wasIn = Array.isArray(col.produto_ids) && (col.produto_ids.includes(savedId) || (product.slug && col.produto_ids.includes(product.slug)));
              if (isSelected && !wasIn) {
                await bulkUpdateProdutosColecao(tenantId, col.id, [savedId], 'adicionar');
              } else if (!isSelected && wasIn) {
                await bulkUpdateProdutosColecao(tenantId, col.id, [savedId], 'remover');
              }
            }
          } catch (syncErr) {
            console.error('Erro ao sincronizar coleções da peça:', syncErr);
          }

          const catObj =
            categoryTree.find((c) => c.id === categoriaId) ||
            categoriesList.find((c) => c.id === categoriaId);
          const updatedItem: AdminProductItem = {
            ...product,
            nome: nome.trim(),
            slug: finalSlug,
            ativo: ativo,
            categoria_id: categoriaId || null,
            categoria_nome: catObj ? catObj.nome : product.categoria_nome,
            subcategoria: subcategoria.trim() || null,
            descricao: descricao.trim() || null,
            preco: preco,
            preco_promocional: parsedPromo,
            preco_custo: parsedCost,
            tecido: tecido,
            modelagem: modelagem,
            linha: linha,
            destaque: destaque,
            mais_vendido: maisVendido,
            outlet: outlet,
            ultimas_pecas: ultimasPecas,
            paired_with_slug: pairedSlugFinal,
            detalhes: detalhesPayload,
            foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : product.foto_principal,
            midias: orderedFotos.map((f, i) => ({
              id: f.id || `m_${i}`,
              url: f.url,
              tipo: f.tipo || 'image',
              display_order: i,
              label: f.label || (i === 0 ? 'Capa Principal' : `Foto ${i + 1}`)
            })),
            variacoes: variacoes.map((v, i) => ({
              id: v.id || `v_${i}`,
              cor_nome: v.cor_nome,
              cor_hex: v.cor_hex,
              tamanho: v.tamanho,
              estoque: v.estoque,
              sku: v.sku,
              preco: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco || preco,
              preco_promocional: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco_promocional || parsedPromo
            })),
            estoque_total: totalEstoqueGrade
          };

          notifyStockChangeCrossTab();
          showToast(`Peça "${nome}" atualizada com sucesso!`);
          onSaved(updatedItem, false);
          handleCloseModal();
        } else {
          showToast(res.error || 'Erro ao atualizar produto.', 'error');
        }
      } else {
        // MODO CRIAÇÃO
        const createPayload: CreateProductInput = {
          nome: nome.trim(),
          slug: finalSlug,
          descricao: descricao.trim(),
          preco: preco,
          preco_promocional: parsedPromo,
          preco_custo: parsedCost,
          categoria_id: categoriaId || undefined,
          subcategoria: subcategoria.trim() || undefined,
          tecido: tecido.trim(),
          modelagem: modelagem.trim(),
          linha: linha.trim(),
          destaque: destaque,
          mais_vendido: maisVendido,
          outlet: outlet,
          ultimas_pecas: ultimasPecas,
          estoque_total: totalEstoqueGrade,
          ativo: ativo,
          paired_with_slug: pairedSlugFinal,
          detalhes: detalhesPayload,
          precos_diferenciados: Object.keys(precosDiferenciados).length > 0 ? precosDiferenciados : null,
          fotos_por_cor: Object.keys(fotosPorCorMap).length > 0 ? fotosPorCorMap : null,
          foto_principal: firstImage?.url || orderedFotos[0]?.url || '',
          fotos: orderedFotos,
          video_provador_url: firstVideo ? firstVideo.url : undefined,
          tem_grade: true,
          variacoes: variacoes.map((v) => ({
            cor_nome: v.cor_nome,
            cor_hex: v.cor_hex,
            tamanho: v.tamanho,
            estoque: v.estoque,
            sku: v.sku || `${finalSlug}-${v.cor_nome}-${v.tamanho}`.toUpperCase(),
            preco: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco || preco,
            preco_promocional: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco_promocional || parsedPromo
          }))
        };

        const res = await createAdminProduct(createPayload, tenantId);
        if (res.success && res.product) {
          // Sincroniza vínculos de coleções
          try {
            const savedId = res.product.id;
            for (const col of colecoesLoja) {
              if (selectedColecaoIds.includes(col.id)) {
                await bulkUpdateProdutosColecao(tenantId, col.id, [savedId], 'adicionar');
              }
            }
          } catch (syncErr) {
            console.error('Erro ao vincular nova peça às coleções:', syncErr);
          }

          const catObj =
            categoryTree.find((c) => c.id === categoriaId) ||
            categoriesList.find((c) => c.id === categoriaId);
          const newItem: AdminProductItem = {
            id: res.product.id,
            nome: res.product.nome,
            slug: res.product.slug,
            descricao: res.product.descricao,
            preco: res.product.preco,
            preco_promocional: res.product.preco_promocional,
            preco_custo: res.product.preco_custo,
            tecido: res.product.tecido,
            modelagem: res.product.modelagem,
            linha: res.product.linha,
            destaque: res.product.destaque,
            mais_vendido: res.product.mais_vendido,
            outlet: res.product.outlet,
            ultimas_pecas: res.product.ultimas_pecas,
            estoque_total: totalEstoqueGrade,
            ativo: res.product.ativo,
            foto_principal: res.product.foto_principal,
            categoria_id: res.product.categoria_id,
            categoria_nome: catObj ? catObj.nome : 'Geral',
            subcategoria: res.product.subcategoria,
            paired_with_slug: pairedSlugFinal,
            detalhes: detalhesPayload,
            midias: orderedFotos.map((f, i) => ({
              id: f.id || `m_${i}`,
              url: f.url,
              tipo: f.tipo || 'image',
              display_order: i,
              label: f.label || (i === 0 ? 'Capa Principal' : `Foto ${i + 1}`)
            })),
            variacoes: variacoes.map((v, i) => ({
              id: `v_${i}`,
              cor_nome: v.cor_nome,
              cor_hex: v.cor_hex,
              tamanho: v.tamanho,
              estoque: v.estoque,
              sku: v.sku,
              preco: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco || preco,
              preco_promocional: precosDiferenciados[`${v.cor_nome}_${v.tamanho}`]?.preco_promocional || parsedPromo
            }))
          };

          notifyStockChangeCrossTab();
          showToast(`Peça "${nome}" cadastrada com sucesso no catálogo!`);
          onSaved(newItem, true);
          handleCloseModal();
        } else {
          showToast(res.error || 'Erro ao cadastrar produto.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar peça.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Atalho de teclado: Ctrl + Enter para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nome, preco, variacoes, precosDiferenciados, mediaList, slug, categoriaId, subcategoria]);

  if (!isOpen) return null;

  // Subcategorias disponíveis da categoria selecionada
  const selectedCat = categoriesList.find((c) => c.id === categoriaId);
  const catSubs = selectedCat?.subcategorias || [];
  const globalSubs = storeAttributes?.subcategorias || [];
  const availableSubcats = Array.from(new Set([...catSubs, ...globalSubs])).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] animate-fade-in overflow-hidden">
        {/* ============================================================== */}
        {/* CABEÇALHO DO MODAL                                             */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury truncate">
                  {isEdit ? t.products.fullFormModal.titleEdit : t.products.fullFormModal.titleCreate}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {isEdit ? t.products.fullFormModal.badgeEdit : t.products.fullFormModal.badgeCreate}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {isEdit ? (
                  t.products.fullFormModal.subtitleEdit(product?.nome || '', slug || product?.slug || '')
                ) : (
                  t.products.fullFormModal.subtitleCreate
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Status da Peça: Ativo vs Rascunho */}
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                ativo
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title={ativo ? t.products.fullFormModal.activeShowcaseLabel : t.products.fullFormModal.draftHiddenLabel}
            >
              <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{ativo ? t.products.fullFormModal.activeShowcaseLabel : t.products.fullFormModal.draftHiddenLabel}</span>
            </button>

            {/* Alternador de Modo: Abas vs Scroll */}
            <button
              type="button"
              onClick={() => {
                const next = viewMode === 'abas' ? 'scroll' : 'abas';
                setViewMode(next);
                try {
                  localStorage.setItem('admin_product_form_view_mode', next);
                } catch {}
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                viewMode === 'scroll'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={viewMode === 'scroll' ? t.products.fullFormModal.modeTabsBtn : t.products.fullFormModal.modeScrollBtn}
            >
              {viewMode === 'scroll' ? (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.products.fullFormModal.modeTabsBtn}</span>
                </>
              ) : (
                <>
                  <ScrollText className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">{t.products.fullFormModal.modeScrollBtn}</span>
                </>
              )}
            </button>

            {/* Alternador do Simulador da Vitrine */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showLivePreview
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-black'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={t.products.fullFormModal.simulatorBtn}
            >
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">{t.products.fullFormModal.simulatorBtn}</span>
            </button>

            <button
              onClick={handleCloseModal}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Esc"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Solicitação de Liberação Recebida */}
        {incomingUnlockRequest && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-sm animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <span>
                <strong>{incomingUnlockRequest.solicitante_nome}</strong> solicitou acesso para editar esta peça. Salve ou libere a tela quando possível.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncomingUnlockRequest(null)}
              className="p-1 hover:bg-amber-700 rounded text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Banner de Modo Somente Leitura */}
        {isReadOnlyMode && (
          <div className="bg-slate-900 text-amber-300 px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>MODO SOMENTE LEITURA: Esta peça está em edição por outro operador. Alterações não poderão ser salvas.</span>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="text-white hover:text-amber-200 underline text-[11px] cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* NAVEGAÇÃO: ABAS OU ÂNCORAS NO MODO SCROLL                      */}
        {/* ============================================================== */}
        {viewMode === 'abas' ? (
          <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
            {[
              { id: 'geral', label: t.products.fullFormModal.tab1General, icon: FileText },
              { id: 'midias', label: t.products.fullFormModal.tab2Media(mediaList.length), icon: Video },
              { id: 'grade', label: t.products.fullFormModal.tab3StockGrid(variacoes.length), icon: Layers },
              { id: 'comercial', label: t.products.fullFormModal.tab4Pricing, icon: DollarSign }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-600 text-amber-800 bg-amber-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2 border-b border-amber-200/80 bg-amber-50/40 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <ScrollText className="w-3.5 h-3.5 text-amber-600" />
              {t.products.fullFormModal.singlePageAnchorsTitle}
            </span>
            {[
              { id: 'sec-form-geral', label: t.products.fullFormModal.anchorGeneral },
              { id: 'sec-form-midias', label: t.products.fullFormModal.anchorMedia },
              { id: 'sec-form-grade', label: t.products.fullFormModal.anchorGrid },
              { id: 'sec-form-comercial', label: t.products.fullFormModal.anchorPricing }
            ].map((anchor) => (
              <button
                key={anchor.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(anchor.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-amber-800 hover:border-amber-400 font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                {anchor.label}
              </button>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* CORPO DO FORMULÁRIO COM SIMULADOR LATERAL (OPCIONAL)           */}
        {/* ============================================================== */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 text-xs scroll-smooth">
            {/* SEÇÃO 1: DADOS GERAIS, CATEGORIA & ESTILO */}
            {(viewMode === 'scroll' || activeTab === 'geral') && (
              <div id="sec-form-geral" className="space-y-4 scroll-mt-6">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      {t.products.fullFormModal.secGeneralTitle}
                    </h4>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">{t.products.fullFormModal.nameField}</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t.products.fullFormModal.namePlaceholder}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Seletores Dinâmicos de Categoria, Subcategoria, Tecido, Modelagem e Coleção */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Categoria com Busca em Tempo Real (Combobox Autocomplete) */}
                  <div className="space-y-1.5">
                    <AdminCategorySearchSelect
                      label={t.products.fullFormModal.categoryField}
                      value={categoriaId}
                      subcategoria={subcategoria}
                      tree={categoryTree}
                      fallbackList={categoriesList}
                      placeholder={t.products.fullFormModal.categoryField + '...'}
                      onChange={(catId, catNome, subcatNome) => {
                        setCategoriaId(catId);
                        if (subcatNome) {
                          setSubcategoria(subcatNome);
                        } else if (!catId) {
                          setSubcategoria('');
                        }
                      }}
                      onAddNewCategory={async (name, parentId) => {
                        try {
                          const res = await saveCategoriaNode(tenantId, {
                            nome: name,
                            parent_id: parentId || null
                          });
                          if (res.success && res.data) {
                            const freshTree = await getCategoriaTree(tenantId);
                            setCategoryTree(freshTree);
                            // Garante que categoria_id aponta para o nó raiz na tabela SQL
                            let rootId = res.data.id;
                            let currParent = res.data.parent_id;
                            while (currParent) {
                              const pNode = freshTree.find((n) => n.id === currParent);
                              if (!pNode) break;
                              rootId = pNode.id;
                              currParent = pNode.parent_id;
                            }
                            setCategoriaId(rootId);
                            if (res.data.nivel > 0) {
                              setSubcategoria(res.data.nome);
                            }
                            showToast(`Categoria "${res.data.nome}" criada e selecionada!`);
                          }
                        } catch (err: any) {
                          showToast(err?.message || 'Erro ao criar categoria.', 'error');
                        }
                      }}
                    />

                    {/* Pílula do Caminho Breadcrumb Completo */}
                    {categoriaId && (
                      (() => {
                        const activeNode = categoryTree.find((n) => n.id === categoriaId);
                        if (!activeNode) return null;
                        return (
                          <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium truncate shadow-2xs">
                            <FolderTree className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">
                              <strong>Trilha:</strong> {activeNode.caminho_completo || activeNode.nome}
                            </span>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Subcategoria com Trava de Cadeado quando sem categoria */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">{t.products.fullFormModal.subcategoryField}</label>
                    {!categoriaId ? (
                      <div
                        className="w-full bg-slate-100 border border-dashed border-slate-300 rounded-lg p-2.5 text-slate-400 text-xs flex items-center gap-1.5 cursor-not-allowed"
                        title={t.products.fullFormModal.subcategoryPlaceholder}
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>🔒 {t.products.fullFormModal.subcategoryPlaceholder}</span>
                      </div>
                    ) : (
                      <AdminCreatableSelect
                        label=""
                        value={subcategoria}
                        options={availableSubcats}
                        onChange={(val) => setSubcategoria(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('subcategorias', val)}
                        placeholder={t.products.fullFormModal.subcategoryPlaceholder}
                      />
                    )}
                  </div>

                  {/* Tecido / Composição (Visual Limpo e Otimizado) */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <AdminCreatableSelect
                      label={t.products.fullFormModal.fabricField}
                      value={tecido}
                      options={storeAttributes?.tecidos || []}
                      onChange={(val) => setTecido(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('tecidos', val)}
                      placeholder={t.products.fullFormModal.fabricField}
                    />
                  </div>

                  {/* Modelagem */}
                  <div>
                    <AdminCreatableSelect
                      label={t.products.fullFormModal.fitField}
                      value={modelagem}
                      options={storeAttributes?.modelagens || []}
                      onChange={(val) => setModelagem(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('modelagens', val)}
                      placeholder={t.products.fullFormModal.fitField}
                    />
                  </div>

                  {/* Linha / Coleção */}
                  <div>
                    <AdminCreatableSelect
                      label={t.products.fullFormModal.lineCollectionField}
                      value={linha}
                      options={storeAttributes?.colecoes || []}
                      onChange={(val) => setLinha(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('colecoes', val)}
                      placeholder={t.products.fullFormModal.lineCollectionField}
                    />
                  </div>
                </div>

                {/* Descrição e Especificações Técnicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">{t.products.fullFormModal.descriptionField}</label>
                    <textarea
                      rows={3}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                      placeholder={t.products.fullFormModal.descriptionPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">
                      {t.products.fullFormModal.specsField}
                    </label>
                    <textarea
                      rows={3}
                      value={especificacoesTexto}
                      onChange={(e) => setEspecificacoesTexto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                      placeholder={t.products.fullFormModal.specsPlaceholder}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: FOTOS E VÍDEOS */}
            {(viewMode === 'scroll' || activeTab === 'midias') && (
              <div id="sec-form-midias" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      Fotos e Vídeos da Peça
                    </h4>
                  </div>
                )}

                <ProductMediaGalleryManager
                  mediaList={mediaList}
                  availableColors={availableColorsForMedia}
                  tenantSlug={tenantSlug}
                  coverIndex={coverIndex}
                  onCoverIndexChange={(idx) => setCoverIndex(idx)}
                  onChange={(updated) => setMediaList(updated)}
                  onToast={showToast}
                />
              </div>
            )}

            {/* SEÇÃO 3: GRADE DE ESTOQUE FÍSICO */}
            {(viewMode === 'scroll' || activeTab === 'grade') && (
              <div id="sec-form-grade" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      {t.products.fullFormModal.secStockTitle}
                    </h4>
                  </div>
                )}

                {/* Barra de Ações do Estoque com Busca & Toggle de Visualização */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2.5">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={stockSearchTerm}
                        onChange={(e) => setStockSearchTerm(e.target.value)}
                        placeholder="Filtrar por cor, tamanho ou SKU..."
                        className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-normal"
                      />
                      {stockSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setStockSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle de Visualização: Agrupado por Cor vs Lista Plana */}
                    <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setStockViewMode('grouped')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          stockViewMode === 'grouped'
                            ? 'bg-white text-amber-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Agrupar variações por cor de forma limpa e organizada"
                      >
                        <LayoutGrid className="w-3 h-3 text-amber-600" />
                        <span>Por Cor (A-Z)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockViewMode('list')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          stockViewMode === 'list'
                            ? 'bg-white text-amber-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Ver lista de todas as variações"
                      >
                        <List className="w-3 h-3 text-amber-600" />
                        <span>Lista Plana</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoGenerateSKUs}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                      title={t.products.fullFormModal.autoSkuBtn}
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">{t.products.fullFormModal.autoSkuBtn}</span>
                    </button>

                    <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">
                      Total: {t.products.card.stockUnits(variacoes.reduce((acc, v) => acc + Number(v.estoque || 0), 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Visão 1: Agrupada por Cor (Padrão de Alta Performance e Organização) */}
                  {stockViewMode === 'grouped' ? (
                    groupedVariations.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
                        {stockSearchTerm ? `Nenhuma variação encontrada com "${stockSearchTerm}".` : t.products.fullFormModal.emptyStockGrid}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groupedVariations.map((group) => {
                          const corTotal = group.items.reduce((acc, item) => acc + Number(item.estoque || 0), 0);
                          const isLight = isLightColor(group.cor_hex);

                          return (
                            <div
                              key={group.cor_nome}
                              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-amber-300 transition-all space-y-2.5"
                            >
                              {/* Header do Grupo de Cor */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-7 h-7 rounded-xl border border-black/20 shadow-xs shrink-0 relative overflow-hidden"
                                    style={{ backgroundColor: group.cor_hex }}
                                    title={`${group.cor_nome} (${group.cor_hex})`}
                                  >
                                    {isLight && (
                                      <span className="absolute inset-0 border border-slate-300 rounded-xl pointer-events-none" />
                                    )}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 text-sm truncate">
                                        {group.cor_nome}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                        {group.cor_hex}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {group.items.length} tamanho(s) &bull; Total: <strong>{corTotal} un</strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedColorPreset(group.cor_nome);
                                      setNewColorName(group.cor_nome);
                                      setNewColorHex(group.cor_hex);
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title={`Adicionar novo tamanho para a cor ${group.cor_nome}`}
                                  >
                                    <Plus className="w-3 h-3 text-amber-700" />
                                    <span>+ Tam</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleZerarEstoqueCor(group.cor_nome)}
                                    className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title={`Zerar estoque de todos os tamanhos da cor ${group.cor_nome}`}
                                  >
                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                    <span>Zerar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCorVariacoes(group.cor_nome)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title={`Excluir cor ${group.cor_nome} e todas as suas unidades`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Grade Interna de Tamanhos da Cor */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {group.items.map((item) => (
                                  <div
                                    key={item.id || `${group.cor_nome}_${item.tamanho}`}
                                    className="p-2 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-amber-300 transition-all space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-slate-900 text-xs px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                                        Tam. {item.tamanho}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setVariacoes((prev) =>
                                            prev.filter(
                                              (v) =>
                                                !(
                                                  (v.cor_nome || '').trim().toLowerCase() === group.cor_nome.toLowerCase() &&
                                                  (v.tamanho || '').trim().toUpperCase() === item.tamanho.toUpperCase()
                                                )
                                            )
                                          )
                                        }
                                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                        title={`Remover tamanho ${item.tamanho} de ${group.cor_nome}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500 font-semibold">Qtd:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.estoque}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          handleUpdateEstoqueVariacao(group.cor_nome, item.tamanho, val);
                                        }}
                                        className="w-14 bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-2xs"
                                      />
                                      <span className="text-[10px] text-slate-400 font-medium">un</span>
                                    </div>

                                    <div>
                                      <input
                                        type="text"
                                        value={item.sku || ''}
                                        placeholder="SKU..."
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setVariacoes((prev) =>
                                            prev.map((v) =>
                                              (v.cor_nome || '').trim().toLowerCase() === group.cor_nome.toLowerCase() &&
                                              (v.tamanho || '').trim().toUpperCase() === item.tamanho.toUpperCase()
                                                ? { ...v, sku: val }
                                                : v
                                            )
                                          );
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        title={`SKU de ${group.cor_nome} ${item.tamanho}`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* Visão 2: Lista Plana Ordenada por Cor (A-Z) e Tamanho */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {sortedFlatVariations.length === 0 ? (
                        <div className="col-span-full p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
                          {stockSearchTerm ? `Nenhuma variação encontrada com "${stockSearchTerm}".` : t.products.fullFormModal.emptyStockGrid}
                        </div>
                      ) : (
                        sortedFlatVariations.map((v) => {
                          const isLight = isLightColor(v.cor_hex || '#1A1918');
                          return (
                            <div
                              key={v.id || `${v.cor_nome}_${v.tamanho}`}
                              className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-amber-300 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span
                                  className="w-6 h-6 rounded-lg border border-black/20 shadow-2xs shrink-0 relative overflow-hidden"
                                  style={{ backgroundColor: v.cor_hex || '#1A1918' }}
                                  title={`${v.cor_nome} (${v.cor_hex || '#1A1918'})`}
                                >
                                  {isLight && (
                                    <span className="absolute inset-0 border border-slate-300 rounded-lg pointer-events-none" />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-black text-slate-900 text-xs shrink-0">{v.tamanho}</span>
                                    <span className="text-slate-300 text-[10px]">&bull;</span>
                                    <span className="font-semibold text-slate-700 text-xs truncate" title={v.cor_nome}>
                                      {v.cor_nome}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                      {v.cor_hex || '#1A1918'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">SKU:</span>
                                    <input
                                      type="text"
                                      value={v.sku || ''}
                                      placeholder="SKU..."
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setVariacoes((prev) =>
                                          prev.map((item) =>
                                            (item.cor_nome || '').trim().toLowerCase() === (v.cor_nome || '').trim().toLowerCase() &&
                                            (item.tamanho || '').trim().toUpperCase() === (v.tamanho || '').trim().toUpperCase()
                                              ? { ...item, sku: val }
                                              : item
                                          )
                                        );
                                      }}
                                      className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-800 w-28 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedColorPreset(v.cor_nome);
                                    setNewColorName(v.cor_nome);
                                    setNewColorHex(v.cor_hex || '#1A1918');
                                  }}
                                  className="px-1.5 py-0.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded text-[10px] font-bold transition-colors cursor-pointer"
                                  title={`Selecionar ${v.cor_nome} para adicionar outros tamanhos`}
                                >
                                  + Tam
                                </button>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.estoque}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      handleUpdateEstoqueVariacao(v.cor_nome, v.tamanho, val);
                                    }}
                                    className="w-14 bg-slate-50 border border-slate-300 rounded-lg p-1 text-center font-bold text-slate-900 text-xs focus:bg-white focus:ring-1 focus:ring-amber-500"
                                  />
                                  <span className="text-[10px] text-slate-400 font-medium">un</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setVariacoes((prev) =>
                                      prev.filter(
                                        (item) =>
                                          !(
                                            (item.cor_nome || '').trim().toLowerCase() === (v.cor_nome || '').trim().toLowerCase() &&
                                            (item.tamanho || '').trim().toUpperCase() === (v.tamanho || '').trim().toUpperCase()
                                          )
                                      )
                                    )
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Remover variação"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                  {/* Construtor de Nova Cor com Múltiplos Tamanhos */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-amber-600" />
                          {t.products.fullFormModal.newColorTitle}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {t.products.fullFormModal.newColorSubtitle}
                        </p>
                      </div>

                      {/* Presets Rápidos */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplySizePreset('pmg')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          {t.products.fullFormModal.colorPillPmg}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySizePreset('numeros')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          {t.products.fullFormModal.colorPillNum}
                        </button>
                      </div>
                    </div>

                    {/* Seletor de Cores da Boutique com Busca e Swatches Reais */}
                    <div className="space-y-2.5">
                      <AdminColorSearchSelect
                        label={t.products.fullFormModal.selectColorLabel}
                        selectedColorName={newColorName || (selectedColorPreset !== 'custom' ? selectedColorPreset : '')}
                        selectedColorHex={newColorHex}
                        availableColors={availableColors}
                        onSelectColor={(corNome, corHex) => {
                          setSelectedColorPreset(corNome);
                          setNewColorName(corNome);
                          setNewColorHex(corHex);
                        }}
                      />
                    </div>

                    {/* Lista de Tamanhos para esta Cor */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-700 font-bold text-xs">
                          {t.products.fullFormModal.colorSizesTitle(newColorName || 'esta cor')}
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setMultiSizeRows((prev) => [
                              ...prev,
                              { id: `size_${Date.now()}`, tamanho: 'G', estoque: 5 }
                            ])
                          }
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.products.fullFormModal.addSizeBtn}</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {multiSizeRows.map((row) => (
                          <div
                            key={row.id}
                            className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs"
                          >
                            <div className="flex-1">
                              <AdminCreatableSelect
                                label=""
                                value={row.tamanho}
                                options={storeAttributes?.tamanhos || ['PP', 'P', 'M', 'G', 'GG', 'Tamanho Único', '36', '38', '40', '42', '44']}
                                onChange={(val) =>
                                  setMultiSizeRows((prev) =>
                                    prev.map((r) => (r.id === row.id ? { ...r, tamanho: val } : r))
                                  )
                                }
                                onCreateOption={(val) => handleCreateStoreAttribute('tamanhos', val)}
                                placeholder="Tamanho..."
                              />
                            </div>

                            <div className="w-28">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.estoque}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setMultiSizeRows((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id
                                          ? { ...r, estoque: Math.max(0, parseInt(e.target.value) || 0) }
                                          : r
                                      )
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-900 text-xs focus:bg-white"
                                  placeholder="Qtd..."
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">un</span>
                              </div>
                            </div>

                            {multiSizeRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setMultiSizeRows((prev) => prev.filter((r) => r.id !== row.id))}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinishColorMultiSizes}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>{t.products.fullFormModal.finishColorSizesBtn}</span>
                    </button>
                  </div>
                </div>
            )}

            {/* SEÇÃO 4: PRECIFICAÇÃO BASE, CUSTO (CMV) & VARIAÇÕES */}
            {(viewMode === 'scroll' || activeTab === 'comercial') && (
              <div id="sec-form-comercial" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      {t.products.fullFormModal.secPricingTitle}
                    </h4>
                  </div>
                )}

                {/* Linha Única de 4 Colunas: Venda, Promo, Custo CMV (com margem discreta) e Botão Único */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-slate-700 mb-1 text-xs font-bold">{t.products.fullFormModal.basePriceField} ({currencySymbol}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={preco || ''}
                      onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold text-sm focus:bg-white focus:ring-1 focus:ring-amber-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 text-xs font-bold">{t.products.fullFormModal.basePromoField} ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t.products.fullFormModal.basePromoPlaceholder}
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-sm focus:bg-white focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 text-xs font-bold">{t.products.fullFormModal.baseCostField} ({currencySymbol})</label>
                      {margemBrutaPct && (
                        <span
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                          title={`Lucro estimado: ${currencySymbol} ${lucroBrutoReais?.toFixed(2)}/un`}
                        >
                          ✓ {t.products.card.marginPct(margemBrutaPct)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t.products.fullFormModal.baseCostPlaceholder}
                      value={precoCusto}
                      onChange={(e) => setPrecoCusto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-sm focus:bg-white focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Record<string, PrecoVariavelItem> = {};
                        gradeColors.forEach((c) => {
                          availableSizes.forEach((t) => {
                            const key = `${c.nome}_${t}`;
                            updated[key] = {
                              preco: preco > 0 ? preco : undefined,
                              preco_promocional: parsedPromo && parsedPromo > 0 ? parsedPromo : undefined
                            };
                          });
                        });
                        setPrecosDiferenciados(updated);
                        showToast(`Preço base (${formatCurrency(preco)}) sincronizado com todas as variações da grade!`);
                      }}
                      className="w-full h-[38px] px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                      title={t.products.fullFormModal.replicateBaseBtn}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.products.fullFormModal.replicateBaseBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Alerta de Inconsistência de Promoção Inline */}
                {isPromoInconsistent && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      {t.products.fullFormModal.promoInconsistentAlert(formatCurrency(parsedPromo || 0), formatCurrency(preco))}
                    </span>
                  </div>
                )}

                {/* MATRIZ DE PRECIFICAÇÃO POR VARIAÇÃO (Cor × Tamanho) */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs font-serif-luxury flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      {t.products.fullFormModal.granularPricingTitle}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      {t.products.fullFormModal.granularPricingNotice}
                    </p>
                  </div>

                  <ProductVariationPriceMatrix
                    cores={gradeColors}
                    tamanhos={availableSizes}
                    basePrice={preco}
                    basePromoPrice={parsedPromo || undefined}
                    variacoes={variacoes}
                    precosPorVariacao={precosDiferenciados}
                    onChange={(updated) => setPrecosDiferenciados(updated)}
                    onFeedback={showToast}
                    onReorderTamanhos={handleReorderSizes}
                    onAddTamanhoNaCor={handleAddTamanhoNaCor}
                    onUpdateEstoque={handleUpdateEstoqueVariacao}
                    onDeleteCor={handleDeleteCorVariacoes}
                    onZerarEstoqueCor={handleZerarEstoqueCor}
                  />
                </div>

                {/* Sinalizadores Oficiais da Vitrine */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        {t.products.fullFormModal.showcaseFlagsTitle}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {t.products.fullFormModal.showcaseFlagsNotice}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSinalizadoresModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                      title={t.products.fullFormModal.manageFlagsBtn}
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t.products.fullFormModal.manageFlagsBtn}</span>
                    </button>
                  </div>

                  {/* Grade Única Consolidada de Sinalizadores (Sem Duplicações) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(storeAttributes?.sinalizadores || []).map((s) => {
                      const sNome = s.nome || s.label || s.id;
                      const sIcon = s.icone || s.icon || '✨';
                      const sCor = s.cor || s.color || '#C5A059';

                      // Verifica se está marcado de acordo com a chave identificadora
                      let isChecked = false;
                      if (s.id === 'destaque') isChecked = destaque;
                      else if (s.id === 'mais_vendido') isChecked = maisVendido;
                      else if (s.id === 'outlet') isChecked = outlet;
                      else if (s.id === 'ultimas_pecas') isChecked = ultimasPecas;
                      else isChecked = customBadgesSelected.includes(sNome);

                      const handleToggle = (checked: boolean) => {
                        if (s.id === 'destaque') setDestaque(checked);
                        else if (s.id === 'mais_vendido') setMaisVendido(checked);
                        else if (s.id === 'outlet') setOutlet(checked);
                        else if (s.id === 'ultimas_pecas') setUltimasPecas(checked);
                        else {
                          if (checked) {
                            setCustomBadgesSelected((prev) => [...prev.filter((x) => x !== sNome), sNome]);
                          } else {
                            setCustomBadgesSelected((prev) => prev.filter((x) => x !== sNome));
                          }
                        }
                      };

                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-amber-400 bg-amber-50/70 shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(e.target.checked)}
                            className="accent-amber-600 rounded"
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: sCor }}
                            title={`Cor oficial: ${sCor}`}
                          />
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate">
                            <span>{sIcon}</span>
                            <span className="truncate">{sNome}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Coleções & Cápsulas Temáticas da Boutique */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Coleções & Cápsulas Temáticas
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Marque as coleções e editoriais onde esta peça deve ser exibida no catálogo e vitrines.
                      </p>
                    </div>

                    <a
                      href="/admin/loja/colecoes/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                      title="Gerenciar coleções na área de Loja"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>Gerenciar Coleções ↗</span>
                    </a>
                  </div>

                  {colecoesLoja.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      Nenhuma coleção criada ainda. Você pode gerenciar coleções no menu Configurações da Loja &gt; Coleções.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {colecoesLoja.map((col) => {
                        const isChecked = selectedColecaoIds.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'border-amber-500 bg-amber-50/70 shadow-2xs font-bold text-slate-900'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColecaoIds((prev) => [...prev, col.id]);
                                } else {
                                  setSelectedColecaoIds((prev) => prev.filter((id) => id !== col.id));
                                }
                              }}
                              className="accent-amber-600 rounded"
                            />
                            <div className="min-w-0">
                              <span className="text-xs truncate block">{col.nome}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {col.exibir_na_home ? '⭐ Na Home' : 'Vitrine/Menu'}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cross-Sell: Monte o Look */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-slate-800 font-bold text-xs">
                        {t.products.fullFormModal.crossSellTitle}
                      </label>
                      <p className="text-[11px] text-slate-500">
                        {t.products.fullFormModal.crossSellSubtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCrossSellPickerOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{pairedSlugs.length > 0 ? t.products.fullFormModal.crossSellModifyBtn : t.products.fullFormModal.crossSellChooseBtn}</span>
                    </button>
                  </div>

                  {pairedSlugs.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                      {t.products.fullFormModal.crossSellEmpty}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {pairedSlugs.map((s) => {
                        const pairedProd = allProducts.find((p) => p.slug === s || p.id === s);
                        return (
                          <div
                            key={s}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 relative group shadow-2xs"
                          >
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              {pairedProd?.foto_principal ? (
                                <Image
                                  src={pairedProd.foto_principal}
                                  alt={pairedProd.nome}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="font-bold text-slate-900 text-xs truncate">
                                {pairedProd?.nome || s}
                              </h6>
                              {pairedProd?.preco && (
                                <span className="text-[11px] text-amber-900 font-semibold block">
                                  {formatCurrency(pairedProd.preco)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setPairedSlugs((prev) => prev.filter((item) => item !== s))}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dimensões e Peso para Envio (Opcional - Piloto Automático se vazio) */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div>
                    <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>{t.products.fullFormModal.shippingTitle}</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {t.products.fullFormModal.shippingSubtitle}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.products.fullFormModal.weightKgLabel}
                      </label>
                      <input
                        type="text"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(e.target.value)}
                        placeholder="Ex: 0.850"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.products.fullFormModal.heightCmLabel}
                      </label>
                      <input
                        type="text"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        placeholder="Ex: 8"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.products.fullFormModal.widthCmLabel}
                      </label>
                      <input
                        type="text"
                        value={larguraCm}
                        onChange={(e) => setLarguraCm(e.target.value)}
                        placeholder="Ex: 25"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.products.fullFormModal.lengthCmLabel}
                      </label>
                      <input
                        type="text"
                        value={comprimentoCm}
                        onChange={(e) => setComprimentoCm(e.target.value)}
                        placeholder="Ex: 35"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIMULADOR LATERAL DA VITRINE (OPCIONAL/EXPANSÍVEL) */}
          {showLivePreview && (
            <div className="w-80 border-l border-slate-200 p-4 bg-slate-50/60 overflow-y-auto hidden md:block">
              <ProductCardPreviewDrawer
                nome={nome}
                preco={preco}
                precoPromocional={parsedPromo}
                tecido={tecido}
                categoriaNome={selectedCat?.nome || 'Boutique'}
                destaque={destaque}
                maisVendido={maisVendido}
                outlet={outlet}
                ultimasPecas={ultimasPecas}
                badgesCustomizados={customBadgesSelected}
                fotos={mediaList}
                cores={availableColors}
                precosPorVariacao={precosDiferenciados}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RODAPÉ COM AÇÕES                                               */}
        {/* ============================================================== */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {t.products.fullFormModal.shortcutNotice}
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {t.products.fullFormModal.cancelBtn}
            </button>
            <button
              type="button"
              onClick={handleExecuteSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.products.fullFormModal.savingBtn}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.products.fullFormModal.saveBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Peças do Look Combinado (Cross-Sell) */}
      {isCrossSellPickerOpen && (
        <CrossSellPickerModal
          isOpen={isCrossSellPickerOpen}
          currentProduct={product || { id: 'temp_new', nome, slug, preco, foto_principal: mediaList[0]?.url || null }}
          currentProductId={product?.id}
          allProducts={allProducts}
          selectedSlugs={pairedSlugs}
          onClose={() => setIsCrossSellPickerOpen(false)}
          onConfirm={(slugs) => {
            setPairedSlugs(slugs);
            setIsCrossSellPickerOpen(false);
          }}
        />
      )}

      {/* Modal de Gerenciamento Global de Sinalizadores da Vitrine (Badges) */}
      {isSinalizadoresModalOpen && (
        <AdminSinalizadoresModal
          isOpen={isSinalizadoresModalOpen}
          onClose={() => setIsSinalizadoresModalOpen(false)}
          tenantId={tenantId}
          initialSinalizadores={storeAttributes?.sinalizadores || []}
          onUpdated={(updatedList) => {
            if (onStoreAttributesUpdated) {
              onStoreAttributesUpdated({ ...storeAttributes, sinalizadores: updatedList });
            }
          }}
          onToast={showToast}
        />
      )}

      {/* Pop-up de Aviso de Alta Densidade (+200 Variações) */}
      {showHighDensityWarning && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Grade com Alta Densidade ({variacoes.length} Variações)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta peça possui mais de 200 variações cadastradas. O sistema da Leidy Boutique suporta variações ilimitadas sem interrupções. No entanto, para volumes expressivos acima de 200 combinações, disponibilizamos assessoria técnica direta para otimizações sob medida na vitrine mobile.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">Deseja falar com nossa equipe?</p>
              <p>Você pode entrar em contato para ajustes exclusivos no código ou continuar o salvamento integral imediatamente com total autonomia.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <a
                href="https://wa.me/5541999999999?text=Ol%C3%A1%2C%20estou%20cadastrando%20uma%20pe%C3%A7a%20com%20mais%20de%20200%20varia%C3%A7%C3%B5es%20na%20Leidy%20Boutique%20e%20gostaria%20de%20suporte."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Falar com Suporte (WhatsApp)
              </a>
              <button
                type="button"
                onClick={() => {
                  setHasConfirmedHighDensity(true);
                  setShowHighDensityWarning(false);
                  setTimeout(() => {
                    handleExecuteSave();
                  }, 50);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Continuar e Salvar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflito de Concorrência e Bloqueio de Edição */}
      {isLockedByOther && productLock && (
        <div className="fixed inset-0 z-70 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-400 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Peça em Edição no Momento
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O produto <strong>{product?.nome}</strong> está sendo editado neste momento por{' '}
                  <span className="font-extrabold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {productLock.usuario_nome}
                  </span>
                  {productLock.usuario_email && (
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      ({productLock.usuario_email})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1.5">
              <p className="font-bold">Para evitar sobreposição ou perda de dados:</p>
              <p className="text-slate-600 leading-relaxed">
                Você pode solicitar liberação para que o colega conclua a edição, abrir em modo de consulta para visualizar informações ou assumir a edição conscientemente.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReadOnlyMode(true);
                    setIsLockedByOther(false);
                    showToast('Visualizando em Modo Somente Leitura (alterações não serão salvas).', 'info');
                  }}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  👁️ Modo Consulta
                </button>

                <button
                  type="button"
                  disabled={lockRequestSent}
                  onClick={async () => {
                    if (!product?.id) return;
                    const member = getStoredActiveMember();
                    const reqUser = {
                      id: member?.id || 'admin_local',
                      nome: member?.nome || 'Operador da Loja',
                      email: member?.email || undefined
                    };
                    const res = await requestUnlockProduct(product.id, reqUser);
                    if (res.success) {
                      setLockRequestSent(true);
                      showToast(`Solicitação enviada para ${productLock.usuario_nome}!`, 'success');
                    } else {
                      showToast('Falha ao enviar solicitação.', 'error');
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  {lockRequestSent ? '✓ Solicitado' : '🔔 Avisar Operador'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Fechar Janela
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!product?.id) return;
                    const member = getStoredActiveMember();
                    const reqUser = {
                      id: member?.id || 'admin_local',
                      nome: member?.nome || 'Operador da Loja',
                      email: member?.email || undefined
                    };
                    const forceRes = await forceAcquireProductLock(product.id, tenantId, reqUser);
                    if (forceRes.success) {
                      setIsLockedByOther(false);
                      setIsReadOnlyMode(false);
                      setProductLock(forceRes.lockInfo || null);
                      showToast('Você assumiu a edição da peça.', 'info');
                    }
                  }}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                >
                  Assumir Edição Forçada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
