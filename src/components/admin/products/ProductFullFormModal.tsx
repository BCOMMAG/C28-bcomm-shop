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
  Check
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
  UpdateProductInput
} from '@/lib/admin';
import { notifyStockChangeCrossTab } from '@/context/StoreContext';
import { AdminCreatableSelect } from '@/components/admin/products/AdminCreatableSelect';
import { CrossSellPickerModal } from '@/components/admin/products/CrossSellPickerModal';
import { ProductVariationPriceMatrix, PrecoVariavelItem } from '@/components/admin/products/ProductVariationPriceMatrix';
import { ProductMediaGalleryManager, FormMediaItem } from '@/components/admin/products/ProductMediaGalleryManager';
import { ProductCardPreviewDrawer } from '@/components/admin/products/ProductCardPreviewDrawer';
import { BOUTIQUE_OFFICIAL_COLORS } from '@/components/admin/products/ProductBatchImportModal';
import { parseMediaColor } from '@/lib/products';

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

const NOBLE_FABRIC_PILLS = [
  'Crepe Alfaiataria',
  'Linho Puro',
  'Seda Acetinada',
  'Tricot Modal',
  'Algodão Pima',
  'Viscose Sarjada',
  'Tweed Francês',
  'Couro Ecológico Premium'
];

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
  if (!isOpen) return null;

  const isEdit = mode === 'edit' && Boolean(product);

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

  // Criação inline de categoria
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInputName, setNewCatInputName] = useState('');

  // Aba 2: Mídias
  const [mediaList, setMediaList] = useState<FormMediaItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Aba 3: Grade de Estoque & Matriz de Preços
  const [activeGradeTab, setActiveGradeTab] = useState<'estoque' | 'precos'>('estoque');
  const [variacoes, setVariacoes] = useState<
    Array<{ id?: string; cor_nome: string; cor_hex: string; tamanho: string; estoque: number; sku?: string | null }>
  >([]);
  const [precosDiferenciados, setPrecosDiferenciados] = useState<Record<string, PrecoVariavelItem>>({});

  // Construtor Multi-Tamanhos por Cor
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

  // Cross-Sell / Monte o Look
  const [pairedSlugs, setPairedSlugs] = useState<string[]>([]);
  const [isCrossSellPickerOpen, setIsCrossSellPickerOpen] = useState(false);

  // Toast
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast(msg, type === 'info' ? 'success' : type);
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
        }
      }
      setEspecificacoesTexto(specs.join('\n'));
      setCustomBadgesSelected(badges);
      setPrecosDiferenciados(precosDiff);

      // Mídias
      const existingMidias: FormMediaItem[] = (product.midias || []).map((m, idx) => ({
        id: m.id,
        url: m.url,
        tipo: m.tipo || 'image',
        label: m.label || (idx === 0 ? 'Capa Principal' : `Foto ${idx + 1}`),
        display_order: m.display_order ?? idx
      }));

      // Se a foto_principal não estiver na lista de mídias, inclui no início
      if (product.foto_principal && !existingMidias.some((m) => m.url === product.foto_principal)) {
        existingMidias.unshift({
          id: 'capa_inicial',
          url: product.foto_principal,
          tipo: 'image',
          label: 'Capa Principal',
          display_order: 0
        });
      }
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

  // Auto-geração de slug ao digitar nome no modo criação
  const handleNameChange = (val: string) => {
    setNome(val);
    if (!isEdit && (!slug || slug === normalizeSlug(nome))) {
      setSlug(normalizeSlug(val));
    }
  };

  const normalizeSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Cores ativas na grade para alimentar a galeria e previews
  const availableColors = React.useMemo(() => {
    const map = new Map<string, { nome: string; hex?: string }>();
    variacoes.forEach((v) => {
      if (v.cor_nome && !map.has(v.cor_nome)) {
        map.set(v.cor_nome, { nome: v.cor_nome, hex: v.cor_hex });
      }
    });
    // Garante que as cores oficiais da boutique estejam sempre acessíveis para identificação de fotos
    BOUTIQUE_OFFICIAL_COLORS.forEach((c) => {
      if (!map.has(c.nome)) {
        map.set(c.nome, { nome: c.nome, hex: c.hex });
      }
    });
    return Array.from(map.values());
  }, [variacoes]);

  // Tamanhos ativos na grade para alimentar a matriz
  const availableSizes = React.useMemo(() => {
    const set = new Set<string>();
    variacoes.forEach((v) => {
      if (v.tamanho) set.add(v.tamanho);
    });
    return Array.from(set);
  }, [variacoes]);

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

  // Adicionar cor com múltiplos tamanhos
  const handleFinishColorMultiSizes = () => {
    if (!newColorName.trim()) {
      showToast('Digite o nome da cor.', 'error');
      return;
    }
    const corNomeFinal = newColorName.trim();
    const hexFinal = newColorHex || '#111111';

    const newVars: typeof variacoes = [];
    multiSizeRows.forEach((row) => {
      if (!row.tamanho.trim()) return;
      const skuAuto = `${slug || normalizeSlug(nome) || 'PECA'}-${corNomeFinal}-${row.tamanho.trim()}`
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9-]/g, '');

      newVars.push({
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cor_nome: corNomeFinal,
        cor_hex: hexFinal,
        tamanho: row.tamanho.trim(),
        estoque: Number(row.estoque || 0),
        sku: skuAuto
      });
    });

    if (newVars.length === 0) {
      showToast('Adicione ao menos um tamanho para a cor.', 'error');
      return;
    }

    setVariacoes((prev) => [...prev, ...newVars]);
    setNewColorName('');
    setMultiSizeRows([{ id: 'size_1', tamanho: 'M', estoque: 5 }]);
    showToast(`Cor "${corNomeFinal}" com ${newVars.length} tamanhos adicionada à grade!`);
  };

  // Salvar Categoria Inline
  const handleCreateCategoryInline = async () => {
    if (!newCatInputName.trim()) {
      showToast('Digite o nome da categoria.', 'error');
      return;
    }
    try {
      const res = await saveAdminCategory(tenantId, { nome: newCatInputName.trim() });
      if (res.success && res.data) {
        const novaCat = res.data;
        const updatedCats = [...categoriesList, novaCat];
        if (onCategoriesUpdated) onCategoriesUpdated(updatedCats);
        setCategoriaId(novaCat.id);
        setNewCatInputName('');
        setIsAddingNewCat(false);
        showToast(`Categoria "${novaCat.nome}" criada e selecionada!`);
      } else {
        showToast(res.error || 'Erro ao criar categoria.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao criar categoria.', 'error');
    }
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

    // Guarda Anti-Blob: Impede salvar fotos temporárias que ainda estão em upload
    const pendingUploads = mediaList.filter((m) => m.isUploading || m.url.startsWith('blob:'));
    if (pendingUploads.length > 0) {
      showToast('Aguarde a conclusão do envio das fotos para o Cloudflare R2 antes de salvar.', 'error');
      setActiveTab('midias');
      return;
    }

    setIsSaving(true);
    try {
      const finalSlug = slug.trim().toLowerCase() || normalizeSlug(nome);

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

      const detalhesPayload = {
        especificacoes: baseSpecs,
        badges: badgesArray,
        precos_diferenciados: Object.keys(precosDiferenciados).length > 0 ? precosDiferenciados : undefined,
        fotos_por_cor: Object.keys(fotosPorCorMap).length > 0 ? fotosPorCorMap : undefined
      };

      const orderedFotos = [...validMediaList];
      if (coverIndex > 0 && coverIndex < orderedFotos.length) {
        const [coverItem] = orderedFotos.splice(coverIndex, 1);
        orderedFotos.unshift(coverItem);
      }

      const totalEstoqueGrade = variacoes.reduce((acc, v) => acc + (Number(v.estoque) || 0), 0);
      const pairedSlugFinal = pairedSlugs.join(',') || null;
      const firstVideo = orderedFotos.find((f) => f.tipo === 'video');

      if (isEdit && product) {
        // MODO EDIÇÃO
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
          foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : product.foto_principal,
          fotos: orderedFotos,
          video_provador_url: firstVideo ? firstVideo.url : null,
          variacoes: variacoes
        };

        const res = await updateAdminProductFull(updatePayload);
        if (res.success) {
          const catObj = categoriesList.find((c) => c.id === categoriaId);
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
          onClose();
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
          foto_principal: orderedFotos.length > 0 ? orderedFotos[0].url : '',
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
          const catObj = categoriesList.find((c) => c.id === categoriaId);
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
          onClose();
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
                  {isEdit ? 'Edição Completa da Peça' : 'Cadastrar Nova Peça no Catálogo'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {isEdit ? 'Dossiê Integral' : 'Novo Cadastro VIP'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {isEdit ? (
                  <>
                    {product?.nome} • Slug: <span className="font-mono text-slate-700">{slug || product?.slug}</span>
                  </>
                ) : (
                  'Preencha dados, fotos em alta definição, matriz de preços e estoque da boutique.'
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
              title={ativo ? 'Peça ativa e visível na vitrine' : 'Peça oculta/rascunho (invisível para clientes)'}
            >
              <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{ativo ? 'Ativa na Vitrine' : 'Rascunho (Oculta)'}</span>
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
              title={
                viewMode === 'scroll'
                  ? 'Mudar para visualização em Abas separadas'
                  : 'Mudar para visualização em Página Única Contínua (Scroll)'
              }
            >
              {viewMode === 'scroll' ? (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modo em Abas</span>
                </>
              ) : (
                <>
                  <ScrollText className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Página Única (Scroll)</span>
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
              title="Abrir ou fechar o simulador do card da vitrine em tempo real"
            >
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Simulador</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVEGAÇÃO: ABAS OU ÂNCORAS NO MODO SCROLL                      */}
        {/* ============================================================== */}
        {viewMode === 'abas' ? (
          <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
            {[
              { id: 'geral', label: '1. Dados Gerais & Estilo', icon: FileText },
              { id: 'midias', label: `2. Fotos & Vídeos (${mediaList.length})`, icon: Video },
              { id: 'grade', label: `3. Grade & Preços (${variacoes.length} vars)`, icon: Layers },
              { id: 'comercial', label: '4. Comercial & Monte o Look', icon: DollarSign }
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
              Página Única:
            </span>
            {[
              { id: 'sec-form-geral', label: '1. Dados Gerais' },
              { id: 'sec-form-midias', label: '2. Fotos & Vídeos' },
              { id: 'sec-form-grade', label: '3. Grade & Preços' },
              { id: 'sec-form-comercial', label: '4. Comercial & Look' }
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
                      Dados Gerais & Estilo da Peça
                    </h4>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Nome da Peça *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Vestido Midi Seda Acetinada Florença"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Slug URL (amigável)</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                      placeholder="ex: vestido-midi-seda-florenca"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Seletores Dinâmicos de Categoria, Subcategoria, Tecido, Modelagem e Coleção */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Categoria com botão inline para cadastrar nova */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-bold">Categoria</label>
                      {!isAddingNewCat && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewCat(true)}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nova Categoria</span>
                        </button>
                      )}
                    </div>

                    {isAddingNewCat ? (
                      <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 border border-amber-300 rounded-lg">
                        <input
                          type="text"
                          value={newCatInputName}
                          onChange={(e) => setNewCatInputName(e.target.value)}
                          placeholder="Nome da categoria..."
                          className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateCategoryInline();
                            if (e.key === 'Escape') setIsAddingNewCat(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategoryInline}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewCat(false);
                            setNewCatInputName('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={categoriaId}
                        onChange={(e) => {
                          setCategoriaId(e.target.value);
                          setSubcategoria('');
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Selecione uma categoria...</option>
                        {categoriesList.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Subcategoria com Trava de Cadeado quando sem categoria */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Subcategoria</label>
                    {!categoriaId ? (
                      <div
                        className="w-full bg-slate-100 border border-dashed border-slate-300 rounded-lg p-2.5 text-slate-400 text-xs flex items-center gap-1.5 cursor-not-allowed"
                        title="Selecione ou crie uma categoria antes de escolher uma subcategoria."
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>🔒 Requer categoria selecionada</span>
                      </div>
                    ) : (
                      <AdminCreatableSelect
                        label=""
                        value={subcategoria}
                        options={availableSubcats}
                        onChange={(val) => setSubcategoria(val)}
                        onCreateOption={(val) => handleCreateStoreAttribute('subcategorias', val)}
                        placeholder="Selecione ou cadastre..."
                      />
                    )}
                  </div>

                  {/* Tecido com 8 Pílulas Rápidas */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <AdminCreatableSelect
                      label="Tecido / Composição"
                      value={tecido}
                      options={storeAttributes?.tecidos || []}
                      onChange={(val) => setTecido(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('tecidos', val)}
                      placeholder="Selecione tecido..."
                    />
                    {/* 8 Pílulas de Clique Rápido */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {NOBLE_FABRIC_PILLS.map((tec) => (
                        <button
                          key={tec}
                          type="button"
                          onClick={() => setTecido(tec)}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            tecido === tec
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400'
                          }`}
                        >
                          {tec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modelagem */}
                  <div>
                    <AdminCreatableSelect
                      label="Modelagem / Caimento"
                      value={modelagem}
                      options={storeAttributes?.modelagens || []}
                      onChange={(val) => setModelagem(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('modelagens', val)}
                      placeholder="Selecione modelagem..."
                    />
                  </div>

                  {/* Linha / Coleção */}
                  <div>
                    <AdminCreatableSelect
                      label="Linha / Coleção"
                      value={linha}
                      options={storeAttributes?.colecoes || []}
                      onChange={(val) => setLinha(val)}
                      onCreateOption={(val) => handleCreateStoreAttribute('colecoes', val)}
                      placeholder="Selecione coleção..."
                    />
                  </div>
                </div>

                {/* Descrição e Especificações Técnicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Descrição da Peça</label>
                    <textarea
                      rows={3}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                      placeholder="Descreva a elegância, caimento e proposta de estilo desta peça..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">
                      Detalhes & Especificações Técnicas (1 por linha)
                    </label>
                    <textarea
                      rows={3}
                      value={especificacoesTexto}
                      onChange={(e) => setEspecificacoesTexto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: Forro interno suave&#10;Fechamento por zíper invisível&#10;Acabamento com costura pespontada"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: FOTOS E VÍDEOS (CLOUDFLARE R2) */}
            {(viewMode === 'scroll' || activeTab === 'midias') && (
              <div id="sec-form-midias" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      Fotos e Vídeos da Peça (Cloudflare R2)
                    </h4>
                  </div>
                )}

                <ProductMediaGalleryManager
                  mediaList={mediaList}
                  availableColors={availableColors}
                  tenantSlug={tenantSlug}
                  coverIndex={coverIndex}
                  onCoverIndexChange={(idx) => setCoverIndex(idx)}
                  onChange={(updated) => setMediaList(updated)}
                  onToast={showToast}
                />
              </div>
            )}

            {/* SEÇÃO 3: GRADE DE ESTOQUE & MATRIZ DE PREÇOS */}
            {(viewMode === 'scroll' || activeTab === 'grade') && (
              <div id="sec-form-grade" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      Grade de Estoque & Precificação por Variação
                    </h4>
                  </div>
                )}

                {/* Alternador de Abas Internas: Grade de Estoque vs Preços por Variação */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveGradeTab('estoque')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeGradeTab === 'estoque'
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>1. Grade de Estoque ({variacoes.length} vars)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGradeTab('precos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeGradeTab === 'precos'
                          ? 'bg-amber-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>2. Preços por Variação (Cor × Tamanho)</span>
                      {Object.keys(precosDiferenciados).length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoGenerateSKUs}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Gera códigos SKU padronizados para todas as variações da grade"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Auto-gerar SKUs</span>
                    </button>

                    <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">
                      Total: {variacoes.reduce((acc, v) => acc + Number(v.estoque || 0), 0)} un
                    </span>
                  </div>
                </div>

                {activeGradeTab === 'estoque' ? (
                  <div className="space-y-4">
                    {/* Lista de Variações Existentes com Estoque e SKU */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                      {variacoes.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          Nenhuma variação cadastrada na grade desta peça. Adicione cores e tamanhos abaixo.
                        </div>
                      ) : (
                        variacoes.map((v, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: v.cor_hex || '#111' }}
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs">
                                  {v.tamanho} • {v.cor_nome}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">SKU:</span>
                                  <input
                                    type="text"
                                    value={v.sku || ''}
                                    placeholder="SKU..."
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setVariacoes((prev) =>
                                        prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                                      );
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-800 w-36 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-semibold">Estoque:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.estoque}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setVariacoes((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, estoque: val } : item))
                                    );
                                  }}
                                  className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
                                />
                                <span className="text-[11px] text-slate-400">un</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setVariacoes((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Remover variação da grade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Construtor de Nova Cor com Múltiplos Tamanhos */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-600" />
                            Cadastrar Nova Cor com Múltiplos Tamanhos
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Configure a cor uma vez e defina múltiplos tamanhos com seus respectivos estoques.
                          </p>
                        </div>

                        {/* Presets Rápidos */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplySizePreset('pmg')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            ⚡ Grade P, M, G
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySizePreset('numeros')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            ⚡ Grade 36 ao 44
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Nome da Cor</label>
                          <input
                            type="text"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="Ex: Terracota Nobre, Off White, Nude..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 text-[11px] mb-1 font-semibold">Hex da Cor</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newColorHex}
                              onChange={(e) => setNewColorHex(e.target.value)}
                              className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={newColorHex}
                              onChange={(e) => setNewColorHex(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lista de Tamanhos para esta Cor */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-700 font-bold text-xs">
                            Tamanhos e Quantidades para "{newColorName || 'esta cor'}":
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
                            <span>Adicionar Outro Tamanho</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {multiSizeRows.map((row) => (
                            <div
                              key={row.id}
                              className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs"
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

                              <div className="w-32">
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
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center font-bold text-slate-900 text-xs focus:bg-white"
                                    placeholder="Qtd..."
                                  />
                                  <span className="text-[11px] text-slate-400 font-semibold">un</span>
                                </div>
                              </div>

                              {multiSizeRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setMultiSizeRows((prev) => prev.filter((r) => r.id !== row.id))}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                  title="Remover tamanho"
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
                        <span>Concluir e Inserir Cor e Tamanhos na Grade</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Aba Matriz de Precificação por Variação */
                  <ProductVariationPriceMatrix
                    cores={availableColors}
                    tamanhos={availableSizes}
                    basePrice={preco}
                    basePromoPrice={parsedPromo || undefined}
                    precosPorVariacao={precosDiferenciados}
                    onChange={(updated) => setPrecosDiferenciados(updated)}
                    onFeedback={showToast}
                  />
                )}
              </div>
            )}

            {/* SEÇÃO 4: PREÇOS, CMV & MONTE O LOOK */}
            {(viewMode === 'scroll' || activeTab === 'comercial') && (
              <div id="sec-form-comercial" className="space-y-4 scroll-mt-6 pt-4 border-t border-slate-200">
                {viewMode === 'scroll' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
                      Precificação Base, Custo (CMV) & Cross-Sell
                    </h4>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={preco || ''}
                      onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-sm focus:bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço Promocional (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Preço de Custo CMV (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Custo da confecção"
                      value={precoCusto}
                      onChange={(e) => setPrecoCusto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Alerta de Inconsistência de Promoção */}
                {isPromoInconsistent && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Atenção: O preço promocional (R$ {parsedPromo}) deve ser menor que o preço de venda (R$ {preco}).
                    </span>
                  </div>
                )}

                {/* Margem Bruta e Lucro em Tempo Real */}
                {margemBrutaPct && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Margem Bruta Estimada:
                      </span>
                      <span className="text-sm font-extrabold text-emerald-950 font-serif-luxury block mt-0.5">
                        {margemBrutaPct}% de Margem
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">
                      Lucro Bruto: R$ {lucroBrutoReais?.toFixed(2)} / un
                    </span>
                  </div>
                )}

                {/* Sinalizadores Oficiais da Vitrine */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Sinalizadores Comerciais na Vitrine:
                    </span>
                    {!isAddingCustomBadge && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomBadge(true)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Novo Sinalizador</span>
                      </button>
                    )}
                  </div>

                  {/* Formulário Inline de Novo Sinalizador */}
                  {isAddingCustomBadge && (
                    <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                      <h6 className="font-bold text-amber-950 text-xs">Criar Novo Sinalizador Comercial</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={newCustomBadgeName}
                            onChange={(e) => setNewCustomBadgeName(e.target.value)}
                            placeholder="Nome (Ex: Alta Costura, Exclusivo)..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newCustomBadgeColor}
                            onChange={(e) => setNewCustomBadgeColor(e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                          />
                          <input
                            type="text"
                            value={newCustomBadgeIcon}
                            onChange={(e) => setNewCustomBadgeIcon(e.target.value)}
                            placeholder="Emoji (✨)..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-center font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddCustomBadge}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCustomBadge(false);
                              setNewCustomBadgeName('');
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grade de Checkboxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={destaque}
                        onChange={(e) => setDestaque(e.target.checked)}
                        className="accent-amber-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">🌟 Lançamento</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maisVendido}
                        onChange={(e) => setMaisVendido(e.target.checked)}
                        className="accent-purple-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">🔥 Mais Vendido</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={outlet}
                        onChange={(e) => setOutlet(e.target.checked)}
                        className="accent-rose-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">🏷️ Outlet</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ultimasPecas}
                        onChange={(e) => setUltimasPecas(e.target.checked)}
                        className="accent-orange-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">⏳ Últimas Peças</span>
                    </label>

                    {/* Sinalizadores Customizados */}
                    {(storeAttributes?.sinalizadores || []).map((b) => {
                      const bLabel = b.label || b.nome || 'Sinalizador';
                      const isSel = customBadgesSelected.includes(bLabel);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isSel ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={(e) => {
                              if (e.target.checked) setCustomBadgesSelected((prev) => [...prev, bLabel]);
                              else setCustomBadgesSelected((prev) => prev.filter((item) => item !== bLabel));
                            }}
                            className="accent-amber-600 rounded"
                          />
                          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                            <span>{b.icon || b.icone || '✨'}</span>
                            <span className="truncate">{bLabel}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Cross-Sell: Monte o Look */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-slate-800 font-bold text-xs">
                        👠 "Monte o Look" / Peças Combinadas (Cross-Sell)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Selecione peças complementares para sugerir na vitrine e elevar o Ticket Médio:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCrossSellPickerOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{pairedSlugs.length > 0 ? 'Modificar Peças do Look' : '+ Selecionar Peças do Look'}</span>
                    </button>
                  </div>

                  {pairedSlugs.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                      Nenhuma peça complementar vinculada a este produto. Clique no botão acima para escolher com fotos e busca.
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
                                  R$ {pairedProd.preco.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setPairedSlugs((prev) => prev.filter((item) => item !== s))}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remover peça do look"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            💡 Dica: Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono font-bold">Ctrl + Enter</kbd> para salvar rapidamente.
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
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
                  <span>Salvando no Banco & R2...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? 'Salvar Cadastro Completo' : 'Salvar Peça no Catálogo'}</span>
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
    </div>
  );
}
