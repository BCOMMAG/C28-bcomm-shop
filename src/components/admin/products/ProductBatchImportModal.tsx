'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ArrowRight,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  Plus,
  Copy,
  Trash2,
  DollarSign,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  Lock,
  ArrowUpRight,
  SlidersHorizontal,
  Search,
  Image as ImageIcon,
  Tag,
  Eye,
  LayoutGrid,
  List,
  TrendingUp,
  Percent,
  CheckSquare,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { AdminProductItem } from '@/lib/admin';

export interface BatchCategoryOption {
  id: string;
  nome: string;
  slug: string;
}

interface ProductBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId?: string;
  onSuccess: () => void;
  categoriesList: BatchCategoryOption[];
  existingProducts?: AdminProductItem[];
}

export interface PrecoVariavelItem {
  preco: number;
  preco_promocional?: number;
  preco_custo?: number;
}

export interface GridRowItem {
  id: string;
  tipo: 'nova' | 'reposicao';
  produto_existente_id?: string;
  nome: string;
  categoria_id: string;
  subcategoria: string;
  cores: string[];
  tamanhos: string[];
  preco: number;
  preco_promocional?: number;
  preco_custo?: number;

  // Quantidade total da remessa estipulada pelo usuário (ex: 40 peças)
  quantidade_total_lote: number;

  // Matriz de Estoque: [cor_nome][tamanho] -> quantidade a adicionar
  matriz_estoque: Record<string, Record<string, number>>;

  foto_url?: string | null;

  // Modo de exibição do seletor: simples (dropdown) ou detalhado (card visual com foto)
  modo_seletor?: 'simples' | 'detalhado';

  // Precificação diferenciada por variação (cor/tamanho)
  tem_precos_diferenciados?: boolean;
  precos_por_variacao?: Record<string, PrecoVariavelItem>; // chave: "cor_tamanho"

  // Aba ativa na matriz: 'estoque' ou 'precos'
  aba_matriz?: 'estoque' | 'precos';
}

export const BOUTIQUE_OFFICIAL_COLORS = [
  { nome: 'Preto Clássico', hex: '#1A1918' },
  { nome: 'Branco Off-White', hex: '#FAF9F6' },
  { nome: 'Rosa Quartz', hex: '#E8A598' },
  { nome: 'Dourado Champagne', hex: '#DFBE76' },
  { nome: 'Bege Areia Nobre', hex: '#E2D3B8' },
  { nome: 'Marrom Caramelo', hex: '#8B5A2B' },
  { nome: 'Prata Acetinado', hex: '#D1D5DB' }
];

export const BOUTIQUE_OFFICIAL_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Tamanho Único', '36', '38', '40', '42', '44'];

export const BOUTIQUE_SUBCATEGORIES = [
  'Alfaiataria',
  'Casual Chic',
  'Vestidos & Macacões',
  'Conjuntos Nobres',
  'Blazers & Casacos',
  'Calças & Bermudas',
  'Blusas & Camisas',
  'Saias',
  'Acessórios Nobres'
];

interface LimitModalState {
  isOpen: boolean;
  rowId: string;
  corTentada: string;
  totalLote: number;
  totalAlocado: number;
  coresAlocadas: { cor: string; total: number }[];
}

/**
 * Helper de alta performance: extrai estritamente fotos e imagens válidas,
 * descartando QUALQUER arquivo de vídeo (.mp4, .webm, tipo video) ou links externos lentos.
 */
export function getSafeProductThumbnail(
  fotoPrincipal?: string | null,
  midias?: { tipo?: string; url?: string }[]
): string | null {
  const isVideo = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.avi') ||
      lower.includes('/video')
    );
  };

  // 1. Testa a foto_principal
  if (fotoPrincipal && !isVideo(fotoPrincipal)) {
    return fotoPrincipal;
  }

  // 2. Se for nula ou vídeo, busca no array de mídias por imagem válida
  if (midias && Array.isArray(midias)) {
    const imgMedia = midias.find((m) => {
      const url = m.url || '';
      return (
        m.tipo !== 'video' &&
        !isVideo(url) &&
        (url.endsWith('.jpg') ||
          url.endsWith('.jpeg') ||
          url.endsWith('.png') ||
          url.endsWith('.webp') ||
          url.startsWith('/') ||
          url.startsWith('http'))
      );
    });
    if (imgMedia?.url && !isVideo(imgMedia.url)) {
      return imgMedia.url;
    }
  }

  return null;
}

export function ProductBatchImportModal({
  isOpen,
  onClose,
  lojaId = DEFAULT_TENANT_ID,
  onSuccess,
  categoriesList,
  existingProducts = []
}: ProductBatchImportModalProps) {
  const [activeTab, setActiveTab] = useState<'grade' | 'excel'>('grade');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'somar_estoque' | 'substituir' | 'ignorar'>('somar_estoque');
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [successGlobal, setSuccessGlobal] = useState<string | null>(null);
  const [limitModalState, setLimitModalState] = useState<LimitModalState | null>(null);

  // Estado para o Catálogo Visual Picker (Vitrine de Seleção para Reposição)
  const [catalogPickerRowId, setCatalogPickerRowId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterCategory, setCatalogFilterCategory] = useState<string>('all');
  const [catalogFilterOnlyLowStock, setCatalogFilterOnlyLowStock] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa as linhas da Grade Rápida com opções
  const [gridRows, setGridRows] = useState<GridRowItem[]>(() => {
    const defaultCat = categoriesList[0]?.id || '';
    const initialList: GridRowItem[] = [];

    // Linha 1: Opção de Cadastrar Nova Peça
    const row1Matriz: Record<string, Record<string, number>> = {
      'Branco Off-White': { P: 5, M: 5, G: 5 },
      'Preto Clássico': { P: 5, M: 5, G: 5 }
    };

    initialList.push({
      id: 'row-1',
      tipo: 'nova',
      nome: 'Vestido Midi Fluido em Crepe',
      categoria_id: defaultCat,
      subcategoria: 'Vestidos & Macacões',
      cores: ['Branco Off-White', 'Preto Clássico'],
      tamanhos: ['P', 'M', 'G'],
      preco: 289.9,
      preco_promocional: 249.9,
      preco_custo: 110.0,
      quantidade_total_lote: 30,
      matriz_estoque: row1Matriz,
      modo_seletor: 'simples',
      foto_url: '/products/03-conjunto-cetim/prata.jpg',
      aba_matriz: 'estoque'
    });

    // Se houver produtos já cadastrados, coloca a 2ª linha como exemplo de reposição
    if (existingProducts.length > 0) {
      const p = existingProducts[0];
      const pCores = Array.from(new Set((p.variacoes || []).map((v) => v.cor_nome))).filter(Boolean);
      const pTamanhos = Array.from(new Set((p.variacoes || []).map((v) => v.tamanho))).filter(Boolean);

      const activeCores = pCores.length > 0 ? pCores.slice(0, 2) : ['Preto Clássico'];
      const activeTams = pTamanhos.length > 0 ? pTamanhos.slice(0, 3) : ['P', 'M', 'G'];

      const row2Matriz: Record<string, Record<string, number>> = {};
      let totalLoteInicial = 0;
      activeCores.forEach((c) => {
        row2Matriz[c] = {};
        activeTams.forEach((t) => {
          row2Matriz[c][t] = 5;
          totalLoteInicial += 5;
        });
      });

      const safeFoto = getSafeProductThumbnail(p.foto_principal, p.midias) || '/products/01-casaco-tricot/marrom.jpg';

      initialList.push({
        id: 'row-2',
        tipo: 'reposicao',
        produto_existente_id: p.id,
        nome: p.nome,
        categoria_id: p.categoria_id || defaultCat,
        subcategoria: p.subcategoria || BOUTIQUE_SUBCATEGORIES[0],
        cores: activeCores,
        tamanhos: activeTams,
        preco: p.preco,
        preco_promocional: p.preco_promocional || 0,
        preco_custo: p.preco_custo || 0,
        quantidade_total_lote: totalLoteInicial,
        matriz_estoque: row2Matriz,
        modo_seletor: 'detalhado',
        foto_url: safeFoto,
        aba_matriz: 'estoque'
      });
    }

    return initialList;
  });

  // Atualiza categorias se carregadas posteriormente
  useEffect(() => {
    if (categoriesList.length > 0) {
      setGridRows((prev) =>
        prev.map((r) => (!r.categoria_id ? { ...r, categoria_id: categoriesList[0].id } : r))
      );
    }
  }, [categoriesList]);

  // Filtro de produtos para o Catálogo Visual Picker (sempre executado antes de qualquer return condicional)
  const filteredCatalogProducts = useMemo(() => {
    return existingProducts.filter((p) => {
      const matchSearch =
        !catalogSearch ||
        p.nome.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(catalogSearch.toLowerCase());

      const matchCategory =
        catalogFilterCategory === 'all' || p.categoria_id === catalogFilterCategory;

      const matchLowStock = !catalogFilterOnlyLowStock || p.estoque_total <= 3;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [existingProducts, catalogSearch, catalogFilterCategory, catalogFilterOnlyLowStock]);

  if (!isOpen) return null;

  // Helper de formatação BRL
  const formatBRL = (valor: number): string => {
    if (isNaN(valor) || valor === null || valor === undefined) return '0,00';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper para buscar o estoque atual de uma variação cadastrada no banco
  const getEstoqueAtualVariacao = (produtoId?: string, corNome?: string, tamanho?: string): number => {
    if (!produtoId || !corNome || !tamanho) return 0;
    const prod = existingProducts.find((p) => p.id === produtoId);
    if (!prod || !prod.variacoes) return 0;
    const v = prod.variacoes.find(
      (item) =>
        item.cor_nome?.toLowerCase().trim() === corNome.toLowerCase().trim() &&
        item.tamanho?.toLowerCase().trim() === tamanho.toLowerCase().trim()
    );
    return v?.estoque || 0;
  };

  // Cálculos de totais de uma linha
  const getRowMetrics = (row: GridRowItem) => {
    const totalAlocado = (row.cores || []).reduce((accCor, cor) => {
      return (
        accCor +
        (row.tamanhos || []).reduce((accTam, tam) => {
          return accTam + (row.matriz_estoque[cor]?.[tam] || 0);
        }, 0)
      );
    }, 0);

    const totalLote = row.quantidade_total_lote || 0;
    const saldoRestante = totalLote - totalAlocado;
    const isLoteCompleto = totalLote > 0 && totalAlocado === totalLote;
    const isLoteExcedido = totalLote > 0 && totalAlocado > totalLote;
    const isLoteIncompleto = totalLote > 0 && totalAlocado < totalLote;

    return {
      totalAlocado,
      totalLote,
      saldoRestante,
      isLoteCompleto,
      isLoteExcedido,
      isLoteIncompleto
    };
  };

  // Adicionar Nova Peça na Grade
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    const defaultCat = categoriesList[0]?.id || '';
    const initialMatriz: Record<string, Record<string, number>> = {
      'Preto Clássico': { P: 5, M: 5, G: 5 }
    };

    setGridRows((prev) => [
      ...prev,
      {
        id: newId,
        tipo: 'nova',
        nome: '',
        categoria_id: defaultCat,
        subcategoria: BOUTIQUE_SUBCATEGORIES[0],
        cores: ['Preto Clássico'],
        tamanhos: ['P', 'M', 'G'],
        preco: 199.9,
        preco_promocional: 0,
        preco_custo: 80.0,
        quantidade_total_lote: 15,
        matriz_estoque: initialMatriz,
        modo_seletor: 'simples',
        aba_matriz: 'estoque'
      }
    ]);
  };

  // Carrega uma peça selecionada (via dropdown ou via Catálogo Visual Picker)
  const handleApplySelectedProduct = (rowId: string, prodId: string) => {
    if (prodId === '__NOVA__') {
      setGridRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const defaultMatriz: Record<string, Record<string, number>> = {};
          r.cores.forEach((c) => {
            defaultMatriz[c] = {};
            r.tamanhos.forEach((t) => {
              defaultMatriz[c][t] = 5;
            });
          });
          return {
            ...r,
            tipo: 'nova',
            produto_existente_id: undefined,
            nome: r.tipo === 'reposicao' ? '' : r.nome,
            quantidade_total_lote: r.cores.length * r.tamanhos.length * 5,
            matriz_estoque: defaultMatriz,
            modo_seletor: 'simples'
          };
        })
      );
      return;
    }

    const prod = existingProducts.find((p) => p.id === prodId);
    if (!prod) return;

    const prodCores = Array.from(new Set((prod.variacoes || []).map((v) => v.cor_nome))).filter(Boolean);
    const prodTamanhos = Array.from(new Set((prod.variacoes || []).map((v) => v.tamanho))).filter(Boolean);

    const activeCores = prodCores.length > 0 ? prodCores : ['Preto Clássico'];
    const activeTams = prodTamanhos.length > 0 ? prodTamanhos : ['P', 'M', 'G'];

    // Monta matriz inicial para a peça existente
    const newMatriz: Record<string, Record<string, number>> = {};
    let totalInicial = 0;
    activeCores.forEach((c) => {
      newMatriz[c] = {};
      activeTams.forEach((t) => {
        newMatriz[c][t] = 5;
        totalInicial += 5;
      });
    });

    const safeFoto = getSafeProductThumbnail(prod.foto_principal, prod.midias) || '/products/01-casaco-tricot/marrom.jpg';

    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          tipo: 'reposicao',
          produto_existente_id: prod.id,
          nome: prod.nome,
          categoria_id: prod.categoria_id || categoriesList[0]?.id || '',
          subcategoria: prod.subcategoria || BOUTIQUE_SUBCATEGORIES[0],
          cores: activeCores,
          tamanhos: activeTams,
          preco: prod.preco,
          preco_promocional: prod.preco_promocional || 0,
          preco_custo: prod.preco_custo || 0,
          quantidade_total_lote: totalInicial,
          matriz_estoque: newMatriz,
          foto_url: safeFoto,
          modo_seletor: 'detalhado'
        };
      })
    );
  };

  // Botão Mágico: DUPLICAR PEÇA COM 1 CLIQUE
  const handleDuplicateRow = (index: number) => {
    const itemToClone = gridRows[index];
    if (!itemToClone) return;

    const clonedItem: GridRowItem = {
      ...itemToClone,
      id: `clone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: itemToClone.tipo === 'nova' && itemToClone.nome ? `${itemToClone.nome} (Cópia)` : itemToClone.nome,
      matriz_estoque: JSON.parse(JSON.stringify(itemToClone.matriz_estoque || {})),
      precos_por_variacao: JSON.parse(JSON.stringify(itemToClone.precos_por_variacao || {}))
    };

    const updated = [...gridRows];
    updated.splice(index + 1, 0, clonedItem);
    setGridRows(updated);
  };

  // Remover Peça da Grade
  const handleRemoveRow = (id: string) => {
    if (gridRows.length <= 1) {
      setErrorGlobal('A grade precisa ter ao menos uma linha.');
      setTimeout(() => setErrorGlobal(null), 3000);
      return;
    }
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Atualizar campo genérico
  const handleUpdateRow = (id: string, field: keyof GridRowItem, value: any) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Atalho Rápido de Margem (ex: +100%, +150% do custo)
  const handleApplyMarginQuick = (rowId: string, marginFactor: number) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const custo = r.preco_custo || 0;
        if (custo <= 0) {
          setErrorGlobal('Preencha o Preço de Custo primeiro para calcular a margem.');
          setTimeout(() => setErrorGlobal(null), 3000);
          return r;
        }
        const precoSugerido = Number((custo * (1 + marginFactor)).toFixed(2));
        return {
          ...r,
          preco: precoSugerido
        };
      })
    );
  };

  // Atualizar célula específica na matriz de estoque
  const handleUpdateCellStock = (rowId: string, corNome: string, tamanho: string, valor: number) => {
    const v = Math.max(0, isNaN(valor) ? 0 : valor);
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newMatriz = { ...r.matriz_estoque };
        newMatriz[corNome] = { ...(newMatriz[corNome] || {}) };
        newMatriz[corNome][tamanho] = v;
        return {
          ...r,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Atualizar preço diferenciado de uma variação (cor/tamanho)
  const handleUpdateCellPrice = (
    rowId: string,
    corNome: string,
    tamanho: string,
    field: 'preco' | 'preco_promocional',
    valor: number
  ) => {
    const v = Math.max(0, isNaN(valor) ? 0 : valor);
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const key = `${corNome}_${tamanho}`;
        const prevPrecos = r.precos_por_variacao || {};
        const currentItem = prevPrecos[key] || {
          preco: r.preco,
          preco_promocional: r.preco_promocional,
          preco_custo: r.preco_custo
        };

        return {
          ...r,
          tem_precos_diferenciados: true,
          precos_por_variacao: {
            ...prevPrecos,
            [key]: {
              ...currentItem,
              [field]: v > 0 ? v : undefined
            }
          }
        };
      })
    );
  };

  // Alternar Cor com Validação de Teto do Lote
  const handleToggleColor = (rowId: string, corNome: string) => {
    const row = gridRows.find((r) => r.id === rowId);
    if (!row) return;

    const isSelected = row.cores.includes(corNome);
    if (isSelected) {
      if (row.cores.length <= 1) {
        setErrorGlobal('A peça precisa ter ao menos uma cor selecionada.');
        setTimeout(() => setErrorGlobal(null), 3000);
        return;
      }
      setGridRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const newCores = r.cores.filter((c) => c !== corNome);
          const newMatriz = { ...r.matriz_estoque };
          delete newMatriz[corNome];
          return {
            ...r,
            cores: newCores,
            matriz_estoque: newMatriz
          };
        })
      );
    } else {
      const totalAlocado = (row.cores || []).reduce((accCor, cor) => {
        return (
          accCor +
          (row.tamanhos || []).reduce((accTam, tam) => {
            return accTam + (row.matriz_estoque[cor]?.[tam] || 0);
          }, 0)
        );
      }, 0);

      const totalLote = row.quantidade_total_lote;

      if (totalLote > 0 && totalAlocado >= totalLote) {
        const coresAlocadas = row.cores
          .map((c) => ({
            cor: c,
            total: (row.tamanhos || []).reduce((acc, tam) => acc + (row.matriz_estoque[c]?.[tam] || 0), 0)
          }))
          .filter((item) => item.total > 0);

        setLimitModalState({
          isOpen: true,
          rowId: row.id,
          corTentada: corNome,
          totalLote,
          totalAlocado,
          coresAlocadas
        });
        return;
      }

      setGridRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const newCores = [...r.cores, corNome];
          const newMatriz = { ...r.matriz_estoque };
          newMatriz[corNome] = {};
          r.tamanhos.forEach((tam) => {
            newMatriz[corNome][tam] = 0;
          });
          return {
            ...r,
            cores: newCores,
            matriz_estoque: newMatriz
          };
        })
      );
    }
  };

  // Ação Rápida do Pop-up de Limite
  const handleAumentarLoteEAdicionarCor = (rowId: string, corTentada: string, acrescimo: number = 10) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const novoTotalLote = r.quantidade_total_lote + acrescimo;
        const newCores = r.cores.includes(corTentada) ? r.cores : [...r.cores, corTentada];
        const newMatriz = { ...r.matriz_estoque };
        if (!newMatriz[corTentada]) {
          newMatriz[corTentada] = {};
          const tams = r.tamanhos.length > 0 ? r.tamanhos : ['Único'];
          const porTam = Math.floor(acrescimo / tams.length);
          const resto = acrescimo % tams.length;
          tams.forEach((tam, idx) => {
            newMatriz[corTentada][tam] = porTam + (idx === 0 ? resto : 0);
          });
        }
        return {
          ...r,
          quantidade_total_lote: novoTotalLote,
          cores: newCores,
          matriz_estoque: newMatriz
        };
      })
    );
    setLimitModalState(null);
    setSuccessGlobal(`Total do lote aumentado para ${acrescimo} un e cor ${corTentada} adicionada!`);
    setTimeout(() => setSuccessGlobal(null), 3500);
  };

  // Alternar Tamanho na Peça
  const handleToggleSize = (rowId: string, tamanho: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const exists = r.tamanhos.includes(tamanho);
        if (exists && r.tamanhos.length <= 1) {
          setErrorGlobal('A peça precisa ter ao menos um tamanho selecionado.');
          setTimeout(() => setErrorGlobal(null), 3000);
          return r;
        }

        const newTamanhos = exists ? r.tamanhos.filter((t) => t !== tamanho) : [...r.tamanhos, tamanho];
        const newMatriz = { ...r.matriz_estoque };

        r.cores.forEach((cor) => {
          if (!newMatriz[cor]) newMatriz[cor] = {};
          if (exists) {
            delete newMatriz[cor][tamanho];
          } else {
            newMatriz[cor][tamanho] = 0;
          }
        });

        return {
          ...r,
          tamanhos: newTamanhos,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Atalho: Grade P ao GG
  const handleQuickGradePMG = (rowId: string) => {
    const targetSizes = ['P', 'M', 'G', 'GG'];
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newMatriz = { ...r.matriz_estoque };
        r.cores.forEach((cor) => {
          if (!newMatriz[cor]) newMatriz[cor] = {};
          targetSizes.forEach((tam) => {
            if (newMatriz[cor][tam] === undefined) {
              newMatriz[cor][tam] = 0;
            }
          });
        });
        return {
          ...r,
          tamanhos: targetSizes,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Atalho: Grade Numérica 36 ao 44
  const handleQuickGradeNumeric = (rowId: string) => {
    const targetSizes = ['36', '38', '40', '42', '44'];
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newMatriz = { ...r.matriz_estoque };
        r.cores.forEach((cor) => {
          if (!newMatriz[cor]) newMatriz[cor] = {};
          targetSizes.forEach((tam) => {
            if (newMatriz[cor][tam] === undefined) {
              newMatriz[cor][tam] = 0;
            }
          });
        });
        return {
          ...r,
          tamanhos: targetSizes,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Atalho: Dividir Igualmente
  const handleDividirIgualmenteCor = (rowId: string, corNome: string, totalAlvo?: number) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const tams = r.tamanhos;
        if (tams.length === 0) return r;

        const currentTotalCor = (tams || []).reduce(
          (acc, t) => acc + (r.matriz_estoque[corNome]?.[t] || 0),
          0
        );
        const target = totalAlvo !== undefined ? totalAlvo : (currentTotalCor > 0 ? currentTotalCor : 10);
        const porTam = Math.floor(target / tams.length);
        const resto = target % tams.length;

        const newMatriz = { ...r.matriz_estoque };
        newMatriz[corNome] = { ...(newMatriz[corNome] || {}) };
        tams.forEach((tam, idx) => {
          newMatriz[corNome][tam] = porTam + (idx === 0 ? resto : 0);
        });

        return {
          ...r,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Sincronizar Total do Lote com a Soma Real da Matriz
  const handleSyncTotalWithGrid = (rowId: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const somaReal = (r.cores || []).reduce((accCor, cor) => {
          return (
            accCor +
            (r.tamanhos || []).reduce((accTam, tam) => {
              return accTam + (r.matriz_estoque[cor]?.[tam] || 0);
            }, 0)
          );
        }, 0);
        return {
          ...r,
          quantidade_total_lote: somaReal
        };
      })
    );
    setSuccessGlobal('Total da remessa sincronizado com a soma das células da grade!');
    setTimeout(() => setSuccessGlobal(null), 3000);
  };

  // Distribuir Total da Remessa igualmente entre as células ativas da grade
  const handleDistributeTotalAcrossGrid = (rowId: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const totalAlocar = r.quantidade_total_lote || 0;
        const cores = r.cores || [];
        const tamanhos = r.tamanhos || [];
        const totalCelulas = cores.length * tamanhos.length;

        if (totalAlocar <= 0) {
          setErrorGlobal('Defina uma quantidade no Total da Remessa antes de distribuir!');
          setTimeout(() => setErrorGlobal(null), 3500);
          return r;
        }

        if (totalCelulas === 0) {
          setErrorGlobal('Selecione ao menos 1 cor e 1 tamanho para distribuir!');
          setTimeout(() => setErrorGlobal(null), 3500);
          return r;
        }

        const base = Math.floor(totalAlocar / totalCelulas);
        let resto = totalAlocar % totalCelulas;

        const newMatriz: Record<string, Record<string, number>> = {};
        cores.forEach((cor) => {
          newMatriz[cor] = { ...(r.matriz_estoque[cor] || {}) };
          tamanhos.forEach((tam) => {
            const add = resto > 0 ? 1 : 0;
            if (resto > 0) resto--;
            newMatriz[cor][tam] = base + add;
          });
        });

        return {
          ...r,
          matriz_estoque: newMatriz
        };
      })
    );
    setSuccessGlobal('Total da remessa distribuído uniformemente na grade!');
    setTimeout(() => setSuccessGlobal(null), 3000);
  };

  // Zerar unidades de uma cor
  const handleZerarCor = (rowId: string, corNome: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newMatriz = { ...r.matriz_estoque };
        if (newMatriz[corNome]) {
          r.tamanhos.forEach((tam) => {
            newMatriz[corNome][tam] = 0;
          });
        }
        return {
          ...r,
          matriz_estoque: newMatriz
        };
      })
    );
  };

  // Métricas Totais da Grade
  const totalModelos = gridRows.filter((r) => r.nome.trim() !== '').length;
  const totalNovas = gridRows.filter((r) => r.tipo === 'nova' && r.nome.trim() !== '').length;
  const totalReposicoes = gridRows.filter((r) => r.tipo === 'reposicao').length;

  const totalVariacoes = gridRows.reduce((acc, r) => {
    let varsComEstoque = 0;
    (r.cores || []).forEach((c) => {
      (r.tamanhos || []).forEach((t) => {
        if ((r.matriz_estoque[c]?.[t] || 0) > 0) {
          varsComEstoque++;
        }
      });
    });
    return acc + (varsComEstoque > 0 ? varsComEstoque : r.cores.length * r.tamanhos.length);
  }, 0);

  const totalEstoqueFisico = gridRows.reduce((acc, r) => {
    return (
      acc +
      (r.cores || []).reduce((accCor, c) => {
        return (
          accCor +
          (r.tamanhos || []).reduce((accTam, t) => {
            return accTam + (r.matriz_estoque[c]?.[t] || 0);
          }, 0)
        );
      }, 0)
    );
  }, 0);


  // Gravação Atômica de Todos os Produtos da Grade no Supabase
  const handleExecuteSave = async () => {
    const validRows = gridRows.filter((r) => r.nome.trim() !== '');
    if (validRows.length === 0) {
      setErrorGlobal('Preencha ou selecione o nome de pelo menos uma peça antes de salvar.');
      return;
    }

    setIsImporting(true);
    setErrorGlobal(null);
    setSuccessGlobal(null);

    const supabase = getSupabaseBrowserClient();
    let novasCriadas = 0;
    let reposicoesFeitas = 0;

    try {
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress({
          current: i + 1,
          total: validRows.length,
          stage: `Processando: ${row.nome} (${i + 1}/${validRows.length})`
        });

        const slugProduto = row.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // CASO 1: REPOSIÇÃO DE PEÇA JÁ EXISTENTE
        if (row.tipo === 'reposicao' && row.produto_existente_id) {
          const prodId = row.produto_existente_id;

          // Busca variações atuais do produto no banco
          const { data: currentVars } = await supabase
            .from('variacoes_produto')
            .select('id, cor_nome, tamanho, estoque')
            .eq('produto_id', prodId);

          const varsMap = new Map<string, { id: string; estoque: number }>();
          (currentVars || []).forEach((v) => {
            varsMap.set(`${v.cor_nome?.toLowerCase().trim()}_${v.tamanho?.toLowerCase().trim()}`, {
              id: v.id,
              estoque: v.estoque || 0
            });
          });

          let addedStock = 0;
          for (const cor of row.cores) {
            const matchedColor = BOUTIQUE_OFFICIAL_COLORS.find(
              (c) => c.nome.toLowerCase() === cor.toLowerCase()
            );
            const hex = matchedColor ? matchedColor.hex : '#1A1918';

            for (const tam of row.tamanhos) {
              const qtd = row.matriz_estoque[cor]?.[tam] || 0;
              if (qtd <= 0) continue;

              const key = `${cor.toLowerCase().trim()}_${tam.toLowerCase().trim()}`;
              const existingVar = varsMap.get(key);

              if (existingVar) {
                await supabase
                  .from('variacoes_produto')
                  .update({
                    estoque: existingVar.estoque + qtd
                  })
                  .eq('id', existingVar.id);
              } else {
                const varSku = `${slugProduto.slice(0, 10).toUpperCase()}-${cor.slice(0, 3).toUpperCase()}-${tam}`;
                await supabase.from('variacoes_produto').insert({
                  loja_id: lojaId,
                  produto_id: prodId,
                  cor_nome: cor,
                  cor_hex: hex,
                  tamanho: tam,
                  estoque: qtd,
                  sku: varSku
                });
              }
              addedStock += qtd;
            }
          }

          // Atualiza total de estoque, preços e detalhes
          const { data: prodCurrent } = await supabase
            .from('produtos')
            .select('estoque_total, detalhes')
            .eq('id', prodId)
            .single();

          const novoTotal = (prodCurrent?.estoque_total || 0) + addedStock;
          const updatedDetalhes = {
            ...(prodCurrent?.detalhes || {}),
            precos_diferenciados: row.tem_precos_diferenciados ? row.precos_por_variacao : null
          };

          await supabase
            .from('produtos')
            .update({
              estoque_total: novoTotal,
              preco: row.preco,
              preco_promocional: row.preco_promocional || null,
              preco_custo: row.preco_custo || null,
              detalhes: updatedDetalhes
            })
            .eq('id', prodId);

          reposicoesFeitas++;
          continue;
        }

        // CASO 2: CADASTRO DE NOVA PEÇA
        const { data: existingProd } = await supabase
          .from('produtos')
          .select('id, estoque_total')
          .eq('loja_id', lojaId)
          .eq('slug', slugProduto)
          .maybeSingle();

        let produtoId = existingProd?.id;

        let totalEstoqueNovaPeca = 0;
        row.cores.forEach((c) => {
          row.tamanhos.forEach((t) => {
            totalEstoqueNovaPeca += row.matriz_estoque[c]?.[t] || 0;
          });
        });

        if (!produtoId) {
          const { data: newProd, error: prodErr } = await supabase
            .from('produtos')
            .insert({
              loja_id: lojaId,
              nome: row.nome,
              slug: slugProduto,
              categoria_id: row.categoria_id,
              subcategoria: row.subcategoria,
              preco: row.preco,
              preco_promocional: row.preco_promocional || null,
              preco_custo: row.preco_custo || null,
              estoque_total: totalEstoqueNovaPeca,
              ativo: true,
              detalhes: row.tem_precos_diferenciados ? { precos_diferenciados: row.precos_por_variacao } : {},
              foto_principal:
                row.foto_url ||
                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
            })
            .select('id')
            .single();

          if (prodErr || !newProd) {
            throw new Error(`Falha ao cadastrar produto ${row.nome}: ${prodErr?.message}`);
          }
          produtoId = newProd.id;
          novasCriadas++;
        }

        // Insere as variações da nova peça
        const variacoesToInsert: any[] = [];
        row.cores.forEach((cor) => {
          const matchedColor = BOUTIQUE_OFFICIAL_COLORS.find(
            (c) => c.nome.toLowerCase() === cor.toLowerCase()
          );
          const hex = matchedColor ? matchedColor.hex : '#1A1918';

          row.tamanhos.forEach((tam) => {
            const qtd = row.matriz_estoque[cor]?.[tam] || 0;
            const varSku = `${slugProduto.slice(0, 10).toUpperCase()}-${cor.slice(0, 3).toUpperCase()}-${tam}`;
            variacoesToInsert.push({
              loja_id: lojaId,
              produto_id: produtoId,
              cor_nome: cor,
              cor_hex: hex,
              tamanho: tam,
              estoque: qtd,
              sku: varSku
            });
          });
        });

        if (variacoesToInsert.length > 0) {
          await supabase.from('variacoes_produto').insert(variacoesToInsert);
        }
      }

      setSuccessGlobal(
        `Operação concluída com sucesso! ${novasCriadas} nova(s) peça(s) cadastrada(s) e ${reposicoesFeitas} reposição(ões) de estoque atualizada(s).`
      );
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Erro na gravação:', err);
      setErrorGlobal(err.message || 'Erro durante a gravação das peças.');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Cadastro e Reposição em Lote de Peças
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Alta Produtividade
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Selecione uma peça cadastrada para repor estoque com grade personalizada ou cadastre novas peças com facilidade.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores & Atalhos */}
        <div className="px-5 pt-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('grade')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'grade'
                  ? 'border-amber-600 text-amber-900 bg-amber-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>1. Grade Rápida no Sistema (Recomendado)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                {gridRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'excel'
                  ? 'border-amber-600 text-amber-900 bg-amber-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>2. Importar Planilha Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Mensagens Globais de Sucesso ou Erro */}
        {errorGlobal && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorGlobal}</span>
            </div>
            <button onClick={() => setErrorGlobal(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successGlobal && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successGlobal}</span>
            </div>
            <button onClick={() => setSuccessGlobal(null)} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'grade' ? (
            <div className="space-y-4">
              {/* Barra de Ações Rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Peça na Grade</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Dica:</span>
                  <span>
                    Escolha uma peça para <strong>Reposição</strong> (via dropdown ou Catálogo Visual) ou cadastre novas peças com facilidade!
                  </span>
                </div>
              </div>

              {/* Lista Estruturada de Peças (Cards de Alta Produtividade) */}
              <div className="space-y-4">
                {gridRows.map((row, index) => {
                  const isReposicao = row.tipo === 'reposicao' && row.produto_existente_id;
                  const metrics = getRowMetrics(row);
                  const categoriaNome = categoriesList.find((c) => c.id === row.categoria_id)?.nome || 'Sem categoria';
                  const prodOriginal = existingProducts.find((p) => p.id === row.produto_existente_id);

                  // Cálculos financeiros com precisão
                  const margemPct =
                    row.preco > 0 && row.preco_custo
                      ? Math.round(((row.preco - row.preco_custo) / row.preco) * 100)
                      : 0;
                  const lucroUnitario =
                    row.preco > 0 && row.preco_custo ? Math.max(0, row.preco - row.preco_custo) : 0;

                  const descontoPct =
                    row.preco > 0 && row.preco_promocional && row.preco_promocional < row.preco
                      ? Math.round(((row.preco - row.preco_promocional) / row.preco) * 100)
                      : 0;
                  const economiaCliente =
                    row.preco > 0 && row.preco_promocional && row.preco_promocional < row.preco
                      ? row.preco - row.preco_promocional
                      : 0;

                  const safeThumb = getSafeProductThumbnail(
                    row.foto_url || prodOriginal?.foto_principal,
                    prodOriginal?.midias
                  );

                  return (
                    <div
                      key={row.id}
                      className="border border-slate-200 hover:border-slate-300 rounded-2xl bg-white shadow-xs overflow-hidden transition-all divide-y divide-slate-100"
                    >
                      {/* NÍVEL 1: IDENTIFICAÇÃO DA PEÇA, MODO OPERACIONAL E CATEGORIAS (100% DA LARGURA) */}
                      <div className="p-3.5 sm:p-4 bg-slate-50/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          {/* Número da Linha */}
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            {index + 1}
                          </div>

                          {/* Seletor Semântico de Modo: Nova Peça vs Reposição */}
                          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplySelectedProduct(row.id, '__NOVA__')}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                row.tipo === 'nova'
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Cadastrar uma nova peça do zero"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>Nova Peça</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (row.tipo !== 'reposicao') {
                                  if (existingProducts.length > 0) {
                                    handleApplySelectedProduct(row.id, existingProducts[0].id);
                                  } else {
                                    handleUpdateRow(row.id, 'tipo', 'reposicao');
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                row.tipo === 'reposicao'
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Repor estoque de uma peça já cadastrada no catálogo"
                            >
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reposição de Estoque</span>
                            </button>
                          </div>

                          {/* Se for Nova Peça: Campo amplo de nome */}
                          {row.tipo === 'nova' ? (
                            <div className="flex-1 min-w-[200px]">
                              <input
                                type="text"
                                required
                                value={row.nome}
                                onChange={(e) => handleUpdateRow(row.id, 'nome', e.target.value)}
                                placeholder="Digite o nome da nova peça..."
                                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs shadow-2xs"
                              />
                            </div>
                          ) : (
                            /* Se for Reposição: Card da Peça Selecionada com Foto, Nome, Estoque e Botão Catálogo */
                            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2.5 bg-white p-2 border border-slate-200 rounded-xl shadow-2xs">
                              {/* Foto em miniatura (48x48px) com filtro estrito de vídeo */}
                              <div
                                className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                                title={prodOriginal ? `${prodOriginal.nome} · SKU: ${prodOriginal.id.slice(0, 8)} · Clique para ver no catálogo` : row.nome}
                                onClick={() => {
                                  setCatalogPickerRowId(row.id);
                                  setCatalogSearch('');
                                }}
                              >
                                {safeThumb ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={safeThumb}
                                    alt={row.nome}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-slate-400" />
                                )}
                              </div>

                              {/* Nome e Estoque Atual */}
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <strong
                                    className="text-xs font-bold text-slate-900 truncate block"
                                    title={prodOriginal ? `${prodOriginal.nome} · Categoria: ${categoriaNome} · SKU: ${prodOriginal.id.slice(0, 8)}` : row.nome}
                                  >
                                    {row.nome || 'Selecione uma peça...'}
                                  </strong>
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold shrink-0 border border-emerald-200">
                                    Reposição
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  {prodOriginal ? (
                                    <span className="font-mono font-semibold text-slate-700">
                                      Estoque atual: <strong>{prodOriginal.estoque_total} un</strong>
                                    </span>
                                  ) : null}
                                  <span>•</span>
                                  <span className="font-mono">R$ {formatBRL(row.preco)}</span>
                                </div>
                              </div>

                              {/* Seletor dropdown rápido e Catálogo Visual */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <select
                                  value={row.produto_existente_id || ''}
                                  onChange={(e) => handleApplySelectedProduct(row.id, e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-slate-700 max-w-[150px] sm:max-w-[180px] truncate focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                >
                                  {existingProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nome} ({p.estoque_total} un)
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCatalogPickerRowId(row.id);
                                    setCatalogSearch('');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                                  title="Abrir vitrine com fotos para escolher a peça do catálogo"
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                  <span>Catálogo Visual</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Categorias (Lado Direito do Nível 1) e Ações de Linha */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Categorias: Bloqueadas com cadeado na Reposição, Editáveis na Nova Peça */}
                          <div className="flex items-center gap-2">
                            {/* Categoria Oficial */}
                            <div className="space-y-0.5 min-w-[110px] max-w-[140px]">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                {isReposicao && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                <span>Categoria</span>
                              </label>
                              {isReposicao ? (
                                <div
                                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 truncate cursor-not-allowed flex items-center justify-between"
                                  title="Categoria vinculada ao produto. Alterações devem ser feitas na edição do produto no catálogo."
                                >
                                  <span className="truncate">{categoriaNome}</span>
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                </div>
                              ) : (
                                <select
                                  value={row.categoria_id}
                                  onChange={(e) => handleUpdateRow(row.id, 'categoria_id', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs truncate"
                                >
                                  {categoriesList.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.nome}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Subcategoria */}
                            <div className="space-y-0.5 min-w-[110px] max-w-[140px]">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                {isReposicao && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                <span>Subcategoria</span>
                              </label>
                              {isReposicao ? (
                                <div
                                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 truncate cursor-not-allowed flex items-center justify-between"
                                  title="Subcategoria vinculada ao produto. Alterações devem ser feitas na edição do produto no catálogo."
                                >
                                  <span className="truncate">{row.subcategoria}</span>
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                </div>
                              ) : (
                                <select
                                  value={row.subcategoria}
                                  onChange={(e) => handleUpdateRow(row.id, 'subcategoria', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs truncate"
                                >
                                  {BOUTIQUE_SUBCATEGORIES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* Ações da Linha: Duplicar e Excluir */}
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(index)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Duplicar esta peça"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover peça da grade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* NÍVEL 2: PAINEL FINANCEIRO & CENTRAL DE CONFERÊNCIA DA REMESSA (GRID DE 4 COLUNAS PADRONIZADAS) */}
                      <div className="p-3.5 sm:p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
                        {/* Coluna 1: Preço de Venda */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:shadow-xs flex flex-col justify-between h-full space-y-2">
                          {/* Header (h-6) */}
                          <div className="flex items-center justify-between gap-1 h-6 shrink-0">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate">
                              Preço de Venda
                            </label>
                            <span className="text-[10px] font-mono font-semibold text-slate-500 shrink-0">
                              R$ {formatBRL(row.preco)}
                            </span>
                          </div>

                          {/* Input (h-10) */}
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.preco || ''}
                              onChange={(e) => handleUpdateRow(row.id, 'preco', parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-3 h-10 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs"
                              placeholder="0,00"
                            />
                          </div>

                          {/* Rodapé padronizado em 2 linhas (h-10) */}
                          <div className="pt-1.5 border-t border-slate-200/60 flex flex-col justify-between text-[10px] leading-tight space-y-0.5 shrink-0">
                            <span className="text-slate-600 block truncate">Valor oficial da vitrine</span>
                            {isReposicao && prodOriginal && prodOriginal.preco !== row.preco ? (
                              <span
                                className="text-amber-700 font-semibold truncate"
                                title={`Preço original no catálogo: R$ ${formatBRL(prodOriginal.preco)}`}
                              >
                                Diverge da loja (era R$ {formatBRL(prodOriginal.preco)})
                              </span>
                            ) : (
                              <span className="text-slate-400 block truncate">Preço base de vitrine</span>
                            )}
                          </div>
                        </div>

                        {/* Coluna 2: Preço Promocional (Opcional) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:shadow-xs flex flex-col justify-between h-full space-y-2">
                          {/* Header (h-6) */}
                          <div className="flex items-center justify-between gap-1 h-6 shrink-0">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate">
                              Promoção (Opcional)
                            </label>
                            {descontoPct > 0 ? (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                                -{descontoPct}% OFF
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 shrink-0">Opcional</span>
                            )}
                          </div>

                          {/* Input (h-10) */}
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.preco_promocional || ''}
                              onChange={(e) =>
                                handleUpdateRow(row.id, 'preco_promocional', parseFloat(e.target.value) || 0)
                              }
                              className="w-full pl-8 pr-3 h-10 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs"
                              placeholder="Opcional"
                            />
                          </div>

                          {/* Rodapé padronizado em 2 linhas (h-10) */}
                          <div className="pt-1.5 border-t border-slate-200/60 flex flex-col justify-between text-[10px] leading-tight space-y-0.5 shrink-0">
                            {descontoPct > 0 ? (
                              <>
                                <span className="font-mono font-medium text-slate-700 block truncate">
                                  Economia de R$ {formatBRL(economiaCliente)}
                                </span>
                                <span className="text-emerald-700 font-semibold block truncate">
                                  ✓ Tag OFERTA ativa na vitrine
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-400 block truncate">Sem desconto ativo</span>
                                <span className="text-slate-400 block truncate">Preço cheio na vitrine</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Coluna 3: Preço de Custo (Opcional) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:shadow-xs flex flex-col justify-between h-full space-y-2">
                          {/* Header (h-6) */}
                          <div className="flex items-center justify-between gap-1 h-6 shrink-0">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate">
                              Preço de Custo
                            </label>
                            {margemPct > 0 ? (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                                {margemPct}% margem
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 shrink-0">Opcional</span>
                            )}
                          </div>

                          {/* Input (h-10) */}
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.preco_custo || ''}
                              onChange={(e) => handleUpdateRow(row.id, 'preco_custo', parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-3 h-10 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs"
                              placeholder="Opcional"
                            />
                          </div>

                          {/* Rodapé padronizado em 2 linhas (h-10) */}
                          <div className="pt-1.5 border-t border-slate-200/60 flex flex-col justify-between text-[10px] leading-tight space-y-0.5 shrink-0">
                            {lucroUnitario > 0 ? (
                              <>
                                <span className="font-mono text-slate-700 block truncate">
                                  Lucro: R$ {formatBRL(lucroUnitario)}/un
                                </span>
                                <span className="font-mono text-slate-500 block truncate">
                                  Markup: {row.preco_custo && row.preco_custo > 0 ? (row.preco / row.preco_custo).toFixed(1) : 0}x sobre custo
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-400 block truncate">Sem custo informado</span>
                                <span className="text-slate-400 block truncate">Margem calculada no input</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Coluna 4: Central de Conferência da Remessa */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:shadow-xs flex flex-col justify-between h-full space-y-2">
                          {/* Header (h-6) com botões Auto e Distribuir */}
                          <div className="flex items-center justify-between gap-1 h-6 shrink-0">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate">
                              Total da Remessa
                            </label>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDistributeTotalAcrossGrid(row.id)}
                                className="text-[10px] font-semibold text-slate-600 hover:text-amber-800 hover:border-amber-300 cursor-pointer flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs transition-colors"
                                title="Distribuir total da remessa igualmente entre as células da grade"
                              >
                                <Zap className="w-2.5 h-2.5 text-amber-600" />
                                <span>Distribuir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSyncTotalWithGrid(row.id)}
                                className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs transition-colors"
                                title="Ajustar o total da remessa automaticamente pela soma da grade"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Auto</span>
                              </button>
                            </div>
                          </div>

                          {/* Input (h-10) */}
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={row.quantidade_total_lote}
                              onChange={(e) =>
                                handleUpdateRow(row.id, 'quantidade_total_lote', parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full pl-3 pr-8 h-10 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              un
                            </span>
                          </div>

                          {/* Rodapé padronizado em 2 linhas (h-10) */}
                          <div className="pt-1.5 border-t border-slate-200/60 flex flex-col justify-between text-[10px] leading-tight space-y-1.5 shrink-0">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-600 font-semibold truncate">
                                Alocado: {metrics.totalAlocado} / {metrics.totalLote} un
                              </span>
                              <span
                                className={`font-semibold shrink-0 ml-1 ${
                                  metrics.isLoteCompleto
                                    ? 'text-emerald-700'
                                    : metrics.isLoteExcedido
                                    ? 'text-rose-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {metrics.isLoteCompleto
                                  ? '✓ 100% OK'
                                  : metrics.isLoteExcedido
                                  ? `+${Math.abs(metrics.saldoRestante)} un`
                                  : `Falta ${metrics.saldoRestante} un`}
                              </span>
                            </div>

                            {/* Barra gráfica nivelada */}
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  metrics.isLoteCompleto
                                    ? 'bg-emerald-600'
                                    : metrics.isLoteExcedido
                                    ? 'bg-rose-600'
                                    : 'bg-amber-500'
                                }`}
                                style={{
                                  width: `${
                                    metrics.totalLote > 0
                                      ? Math.min(100, Math.round((metrics.totalAlocado / metrics.totalLote) * 100))
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notificação de Promoção Prévia no Catálogo */}
                      {isReposicao && prodOriginal?.preco_promocional && prodOriginal.preco_promocional > 0 && (
                        <div className="px-4 py-2 bg-amber-50/80 border-y border-amber-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-amber-950">
                            <Tag className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>
                              <strong>Promoção ativa no catálogo:</strong> De R$ {formatBRL(prodOriginal.preco)} por{' '}
                              <strong className="text-rose-600 font-mono">
                                R$ {formatBRL(prodOriginal.preco_promocional)}
                              </strong>
                              . O preço promocional digitado acima será aplicado nesta nova remessa.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateRow(row.id, 'preco_promocional', 0)}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            Encerrar Promoção (Voltar ao Preço Normal)
                          </button>
                        </div>
                      )}

                      {/* Nível 2: Distribuidor Autônomo de Cores & Matriz de Tamanhos */}
                      <div className="p-4 bg-white space-y-3.5">
                        {/* Seletor de Cores & Tamanhos da Grade */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          {/* Cores Ativas */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                <Palette className="w-3 h-3 text-amber-600" />
                                <span>Cores da Remessa:</span>
                              </span>
                              <span className="text-[10px] text-slate-400">(Clique para ativar/desativar)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {BOUTIQUE_OFFICIAL_COLORS.map((cor) => {
                                const isSelected = row.cores.includes(cor.nome);
                                const totalCor = (row.tamanhos || []).reduce(
                                  (acc, tam) => acc + (row.matriz_estoque[cor.nome]?.[tam] || 0),
                                  0
                                );

                                return (
                                  <button
                                    key={cor.nome}
                                    type="button"
                                    onClick={() => handleToggleColor(row.id, cor.nome)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400/30'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 opacity-60'
                                    }`}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                      style={{ backgroundColor: cor.hex }}
                                    />
                                    <span>{cor.nome.split(' ')[0]}</span>
                                    {isSelected && (
                                      <span className="px-1 py-0.2 rounded bg-amber-200/80 text-amber-900 text-[10px] font-mono">
                                        {totalCor} un
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Tamanhos da Grade & Atalhos */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Tamanhos Ativos:
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                <span>Atalhos:</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickGradePMG(row.id)}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  P ao GG
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickGradeNumeric(row.id)}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                >
                                  36 ao 44
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {BOUTIQUE_OFFICIAL_SIZES.map((tam) => {
                                const isSelected = row.tamanhos.includes(tam);
                                return (
                                  <button
                                    key={tam}
                                    type="button"
                                    onClick={() => handleToggleSize(row.id, tam)}
                                    className={`px-2 py-0.8 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                                  >
                                    {tam === 'Tamanho Único' ? 'Único' : tam}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Abas da Matriz: Estoque (Qtd) vs Precificação Diferenciada por Variação */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateRow(row.id, 'aba_matriz', 'estoque')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                (row.aba_matriz || 'estoque') === 'estoque'
                                  ? 'bg-slate-900 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>1. Matriz de Quantidades (Estoque)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateRow(row.id, 'aba_matriz', 'precos');
                                handleUpdateRow(row.id, 'tem_precos_diferenciados', true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                row.aba_matriz === 'precos'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>2. Preços & Promoções por Variação</span>
                              {row.tem_precos_diferenciados && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              )}
                            </button>
                          </div>

                          {row.aba_matriz === 'precos' && (
                            <span className="text-[11px] text-amber-800 font-semibold">
                              💡 Permite definir preço de venda ou promoção exclusivo para uma cor/tamanho específico!
                            </span>
                          )}
                        </div>

                        {/* Visão 1: Matriz de Quantidades (Estoque) */}
                        {(row.aba_matriz || 'estoque') === 'estoque' ? (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/40">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5 min-w-[140px]">Cor Selecionada</th>
                                  {row.tamanhos.map((tam) => (
                                    <th key={tam} className="p-2.5 text-center min-w-[70px]">
                                      Tam. {tam === 'Tamanho Único' ? 'Único' : tam}
                                    </th>
                                  ))}
                                  <th className="p-2.5 text-center min-w-[100px]">Total Cor</th>
                                  <th className="p-2.5 text-center min-w-[110px]">Ações da Linha</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {row.cores.map((corNome) => {
                                  const matchedColor = BOUTIQUE_OFFICIAL_COLORS.find(
                                    (c) => c.nome.toLowerCase() === corNome.toLowerCase()
                                  );
                                  const hex = matchedColor ? matchedColor.hex : '#1A1918';
                                  const totalLinhaCor = row.tamanhos.reduce(
                                    (acc, tam) => acc + (row.matriz_estoque[corNome]?.[tam] || 0),
                                    0
                                  );

                                  return (
                                    <tr key={corNome} className="hover:bg-slate-50/80 transition-colors">
                                      {/* Nome da Cor */}
                                      <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                                        <span
                                          className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: hex }}
                                        />
                                        <span className="truncate">{corNome}</span>
                                      </td>

                                      {/* Células por Tamanho */}
                                      {row.tamanhos.map((tam) => {
                                        const qtdAtualBanco = isReposicao
                                          ? getEstoqueAtualVariacao(row.produto_existente_id, corNome, tam)
                                          : 0;
                                        const qtdAdicionando = row.matriz_estoque[corNome]?.[tam] || 0;
                                        const novoTotalProjetado = qtdAtualBanco + qtdAdicionando;

                                        return (
                                          <td key={tam} className="p-2 text-center">
                                            <div className="flex flex-col items-center">
                                              <input
                                                type="number"
                                                min="0"
                                                value={qtdAdicionando}
                                                onChange={(e) =>
                                                  handleUpdateCellStock(
                                                    row.id,
                                                    corNome,
                                                    tam,
                                                    parseInt(e.target.value, 10) || 0
                                                  )
                                                }
                                                className="w-14 py-1.5 px-1 bg-white border border-slate-200 focus:border-amber-500 rounded-lg text-center font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                                              />
                                              {isReposicao && (
                                                <span
                                                  className="text-[9px] text-slate-400 font-mono mt-0.5"
                                                  title={`Atual: ${qtdAtualBanco} + Novo: ${qtdAdicionando} = ${novoTotalProjetado}`}
                                                >
                                                  Atual: {qtdAtualBanco}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}

                                      {/* Total da Cor */}
                                      <td className="p-2.5 text-center font-mono font-bold text-xs text-slate-900">
                                        <span className="px-2 py-1 bg-slate-100 rounded-md">
                                          {totalLinhaCor} un
                                        </span>
                                      </td>

                                      {/* Ações da Cor */}
                                      <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleDividirIgualmenteCor(row.id, corNome)}
                                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold cursor-pointer transition-colors"
                                            title="Dividir igualmente o total da cor entre os tamanhos selecionados"
                                          >
                                            ⚡ Dividir
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleZerarCor(row.id, corNome)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                            title="Zerar unidades desta cor"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>

                              {/* Rodapé da Matriz: Totais por Tamanho & Status do Lote */}
                              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-[11px] text-slate-700">
                                <tr>
                                  <td className="p-2.5 text-slate-500 uppercase tracking-wider">
                                    Total por Tamanho:
                                  </td>
                                  {row.tamanhos.map((tam) => {
                                    const totalColunaTam = row.cores.reduce(
                                      (acc, cor) => acc + (row.matriz_estoque[cor]?.[tam] || 0),
                                      0
                                    );
                                    return (
                                      <td key={tam} className="p-2.5 text-center font-mono text-slate-900">
                                        {totalColunaTam}
                                      </td>
                                    );
                                  })}
                                  <td colSpan={2} className="p-2.5 text-right font-mono">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-slate-500 font-sans text-xs">Total Distribuído:</span>
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                          metrics.isLoteCompleto
                                            ? 'bg-emerald-100 text-emerald-950'
                                            : metrics.isLoteExcedido
                                            ? 'bg-rose-100 text-rose-950'
                                            : 'bg-amber-100 text-amber-950'
                                        }`}
                                      >
                                        {metrics.totalAlocado} / {metrics.totalLote} un
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          /* Visão 2: Matriz de Precificação Diferenciada por Variação */
                          <div className="overflow-x-auto border border-amber-200 rounded-xl bg-amber-50/20">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-amber-100/60 text-amber-950 font-bold uppercase text-[10px] border-b border-amber-200">
                                <tr>
                                  <th className="p-2.5 min-w-[140px]">Cor</th>
                                  {row.tamanhos.map((tam) => (
                                    <th key={tam} className="p-2.5 text-center min-w-[120px]">
                                      Tam. {tam === 'Tamanho Único' ? 'Único' : tam} (R$)
                                    </th>
                                  ))}
                                  <th className="p-2.5 text-center min-w-[140px]">Ação Rápida</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100 bg-white">
                                {row.cores.map((corNome) => {
                                  const matchedColor = BOUTIQUE_OFFICIAL_COLORS.find(
                                    (c) => c.nome.toLowerCase() === corNome.toLowerCase()
                                  );
                                  const hex = matchedColor ? matchedColor.hex : '#1A1918';

                                  return (
                                    <tr key={corNome} className="hover:bg-amber-50/40 transition-colors">
                                      <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                                        <span
                                          className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: hex }}
                                        />
                                        <span>{corNome}</span>
                                      </td>

                                      {row.tamanhos.map((tam) => {
                                        const key = `${corNome}_${tam}`;
                                        const customItem = row.precos_por_variacao?.[key];
                                        const precoVendaAtual = customItem?.preco !== undefined ? customItem.preco : row.preco;
                                        const promoAtual = customItem?.preco_promocional !== undefined ? customItem.preco_promocional : (row.preco_promocional || 0);

                                        return (
                                          <td key={tam} className="p-2 text-center">
                                            <div className="space-y-1">
                                              {/* Preço de Venda do Tamanho */}
                                              <div className="relative">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">R$</span>
                                                <input
                                                  type="number"
                                                  step="0.01"
                                                  min="0"
                                                  value={precoVendaAtual || ''}
                                                  onChange={(e) =>
                                                    handleUpdateCellPrice(
                                                      row.id,
                                                      corNome,
                                                      tam,
                                                      'preco',
                                                      parseFloat(e.target.value) || 0
                                                    )
                                                  }
                                                  className="w-24 pl-5 pr-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                  title="Preço de venda específico para esta combinação"
                                                />
                                              </div>

                                              {/* Promoção Específica */}
                                              <div className="relative">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-rose-400">R$</span>
                                                <input
                                                  type="number"
                                                  step="0.01"
                                                  min="0"
                                                  value={promoAtual || ''}
                                                  onChange={(e) =>
                                                    handleUpdateCellPrice(
                                                      row.id,
                                                      corNome,
                                                      tam,
                                                      'preco_promocional',
                                                      parseFloat(e.target.value) || 0
                                                    )
                                                  }
                                                  placeholder="Promoção"
                                                  className="w-24 pl-5 pr-1.5 py-1 bg-rose-50/40 border border-rose-200 rounded-md text-[11px] font-mono font-bold text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                  title="Preço promocional exclusivo para esta combinação"
                                                />
                                              </div>
                                            </div>
                                          </td>
                                        );
                                      })}

                                      <td className="p-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Aplica os preços base para todos os tamanhos desta cor
                                            row.tamanhos.forEach((tam) => {
                                              handleUpdateCellPrice(row.id, corNome, tam, 'preco', row.preco);
                                              handleUpdateCellPrice(row.id, corNome, tam, 'preco_promocional', row.preco_promocional || 0);
                                            });
                                            setSuccessGlobal(`Preços base redefinidos para a cor ${corNome}`);
                                            setTimeout(() => setSuccessGlobal(null), 2500);
                                          }}
                                          className="text-[10px] text-amber-800 hover:underline font-semibold cursor-pointer"
                                        >
                                          Resetar cor para preço base
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Barra de Status e Validação da Peça */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            {metrics.isLoteCompleto ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Lote 100% distribuído com sucesso ({metrics.totalAlocado} peças prontas para salvar).</span>
                              </span>
                            ) : metrics.isLoteExcedido ? (
                              <span className="text-rose-700 font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>
                                  Atenção: A grade excedeu o lote em {Math.abs(metrics.saldoRestante)} unidades! Ajuste as células ou aumente o lote.
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-amber-600" />
                                <span>
                                  Restam {metrics.saldoRestante} unidades para completar o lote de {metrics.totalLote} peças.
                                </span>
                              </span>
                            )}
                          </div>

                          {metrics.isLoteIncompleto && (
                            <button
                              type="button"
                              onClick={() => handleSyncTotalWithGrid(row.id)}
                              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                            >
                              Ajustar Total do Lote para {metrics.totalAlocado} un
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tratamento para peças repetidas */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-700">Comportamento de reposição:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      checked={duplicateAction === 'somar_estoque'}
                      onChange={() => setDuplicateAction('somar_estoque')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-800 font-medium">Somar ao estoque existente (Reposição)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      checked={duplicateAction === 'ignorar'}
                      onChange={() => setDuplicateAction('ignorar')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-600">Ignorar repetidas</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Aba 2: Upload de Planilha Excel */
            <div className="space-y-6 max-w-2xl mx-auto py-6">
              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-slate-900">Importação por Planilha Excel (.xlsx)</h3>
                <p className="text-xs text-slate-500">
                  Preencha nosso modelo oficial e suba aqui. O sistema identificará automaticamente peças existentes para reposição e novas peças.
                </p>
              </div>

              {/* Card de Download do Template */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">Baixar Modelo Oficial (.xlsx)</h4>
                    <p className="text-[11px] text-amber-800/80">
                      Inclui colunas oficiais de cores, tamanhos, categorias e estoque total.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const templateData = [
                      {
                        'Nome do Produto': 'Vestido Midi Fluido em Crepe',
                        Categoria: categoriesList[0]?.nome || 'Vestidos & Macacões',
                        Subcategoria: 'Vestidos & Macacões',
                        'Preço Venda': 289.9,
                        'Preço Promocional': 249.9,
                        'Preço Custo': 110.0,
                        'Cores (separadas por vírgula)': 'Branco Off-White, Preto Clássico',
                        'Tamanhos (separados por vírgula)': 'P, M, G, GG',
                        'Estoque Total do Lote': 40,
                        'URL da Foto (opcional)': '',
                        'Destaque (SIM/NAO)': 'SIM'
                      }
                    ];
                    const ws = XLSX.utils.json_to_sheet(templateData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importação');
                    XLSX.writeFile(wb, 'modelo_cadastro_catalogo_bcomm.xlsx');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo</span>
                </button>
              </div>

              {/* Área de Drop de Arquivo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                  <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {file ? file.name : 'Clique para selecionar a planilha Excel (.xlsx)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Suporta arquivos padrão Excel com abas de categorias e cores
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={async (e) => {
                    const selected = e.target.files?.[0];
                    if (!selected) return;
                    setFile(selected);
                    setIsProcessingFile(true);
                    try {
                      const buffer = await selected.arrayBuffer();
                      const wb = XLSX.read(buffer, { type: 'array' });
                      const worksheet = wb.Sheets[wb.SheetNames[0]];
                      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                      if (rawData.length === 0) throw new Error('Planilha vazia.');
                      setSuccessGlobal(`${rawData.length} produto(s) identificados na planilha!`);
                    } catch (err: any) {
                      setErrorGlobal(err.message || 'Erro ao ler arquivo.');
                    } finally {
                      setIsProcessingFile(false);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Dinâmico com Indicadores e Gravação */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* KPIs da Grade */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold text-slate-800">
              <span className="text-slate-400">Total:</span>
              <strong className="text-slate-900 font-mono">{totalModelos}</strong>
            </div>

            {totalNovas > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold text-amber-950">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="text-amber-700">Novas:</span>
                <strong className="text-amber-900 font-mono">{totalNovas}</strong>
              </div>
            )}

            {totalReposicoes > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold text-emerald-950">
                <Package className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Reposições:</span>
                <strong className="text-emerald-900 font-mono">{totalReposicoes}</strong>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold text-slate-800">
              <span className="text-slate-500">Grade:</span>
              <strong className="text-slate-900 font-mono">{totalVariacoes} vars</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg shadow-2xs font-semibold text-emerald-950">
              <span className="text-emerald-700">Estoque Físico:</span>
              <strong className="text-emerald-900 font-mono">+{totalEstoqueFisico} un</strong>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleExecuteSave}
              disabled={isImporting || totalModelos === 0}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{importProgress?.stage || 'Publicando Peças...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gravar e Atualizar Catálogo ({totalModelos})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: CATÁLOGO VISUAL PICKER (Vitrine Rica de Produtos para Reposição) */}
      {catalogPickerRowId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
            {/* Cabeçalho da Vitrine */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-2xs">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Catálogo Visual de Peças para Reposição
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clique em um produto da vitrine para carregá-lo instantaneamente na grade de reposição.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatalogPickerRowId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros e Busca Rápida na Vitrine */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Campo de Busca com Lupa */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Buscar por nome da peça, categoria ou código..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtro Prioritário de Esgotados / Baixo Estoque */}
                <button
                  type="button"
                  onClick={() => setCatalogFilterOnlyLowStock((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    catalogFilterOnlyLowStock
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Somente Esgotados / Baixo Estoque (≤ 3 un)</span>
                </button>
              </div>

              {/* Pílulas de Filtro por Categoria */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCatalogFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    catalogFilterCategory === 'all'
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas as Categorias ({existingProducts.length})
                </button>
                {categoriesList.map((cat) => {
                  const countInCat = existingProducts.filter((p) => p.categoria_id === cat.id).length;
                  if (countInCat === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatalogFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        catalogFilterCategory === cat.id
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.nome} ({countInCat})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Visual de Produtos */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {filteredCatalogProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">Nenhuma peça encontrada para os filtros selecionados.</p>
                  <p className="text-xs">Tente limpar os termos de busca ou mudar a categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCatalogProducts.map((p) => {
                    const isEsgotado = p.estoque_total === 0;
                    const isBaixoEstoque = p.estoque_total > 0 && p.estoque_total <= 3;
                    const catNome = categoriesList.find((c) => c.id === p.categoria_id)?.nome || 'Geral';

                    // Resumo das cores da peça
                    const coresList = Array.from(new Set((p.variacoes || []).map((v) => v.cor_nome))).filter(Boolean);
                    const safeCatalogThumb = getSafeProductThumbnail(p.foto_principal, p.midias);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleApplySelectedProduct(catalogPickerRowId, p.id);
                          setCatalogPickerRowId(null);
                        }}
                        className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          {/* Foto e Badges (Filtro Estrito: Zero Vídeos + Lazy Load) */}
                          <div className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-100">
                            {safeCatalogThumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={safeCatalogThumb}
                                alt={p.nome}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                            )}

                            {/* Badge de Categoria */}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs">
                              {catNome}
                            </span>

                            {/* Badge de Estoque */}
                            <span
                              className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                                isEsgotado
                                  ? 'bg-rose-600 text-white'
                                  : isBaixoEstoque
                                  ? 'bg-amber-500 text-slate-950 font-mono'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isEsgotado ? 'Esgotado (0)' : `${p.estoque_total} un`}
                            </span>
                          </div>

                          {/* Título e Preços */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                              {p.nome}
                            </h4>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-900">
                                R$ {formatBRL(p.preco)}
                              </span>
                              {p.preco_promocional && p.preco_promocional > 0 && (
                                <span className="font-mono font-bold text-rose-600 text-[11px] bg-rose-50 px-1 rounded">
                                  R$ {formatBRL(p.preco_promocional)}
                                </span>
                              )}
                            </div>

                            {/* Cores Existentes */}
                            {coresList.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {coresList.slice(0, 3).map((cor) => (
                                  <span
                                    key={cor}
                                    className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-semibold text-slate-600"
                                  >
                                    {cor.split(' ')[0]}
                                  </span>
                                ))}
                                {coresList.length > 3 && (
                                  <span className="text-[9px] text-slate-400">+{coresList.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botão de Seleção */}
                        <div className="pt-3 border-t border-slate-100 mt-3">
                          <div className="w-full py-1.5 px-3 bg-slate-50 group-hover:bg-amber-600 group-hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                            <span>Repor Esta Peça</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POP-UP INTERATIVO DE LIMITE DE REPOSIÇÃO ATINGIDO */}
      {limitModalState && limitModalState.isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Limite do Lote Atingido ({limitModalState.totalLote} Unidades)
                </h3>
                <p className="text-xs text-slate-500">
                  Você já distribuiu todas as <strong>{limitModalState.totalLote} peças</strong> desta remessa entre as cores selecionadas:
                </p>
              </div>
            </div>

            {/* Lista das cores já distribuídas */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              {limitModalState.coresAlocadas.map((c) => (
                <div key={c.cor} className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">• {c.cor}:</span>
                  <span className="font-mono font-bold text-slate-900">{c.total} un</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600">
              Para incluir a cor <strong>{limitModalState.corTentada}</strong> ou adicionar mais peças, aumente a quantidade do lote ou diminua de alguma cor já preenchida.
            </p>

            {/* Ações do Pop-up */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleAumentarLoteEAdicionarCor(
                    limitModalState.rowId,
                    limitModalState.corTentada,
                    10
                  )
                }
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Aumentar Total para {limitModalState.totalLote + 10} un e Ativar {limitModalState.corTentada.split(' ')[0]}</span>
              </button>

              <button
                type="button"
                onClick={() => setLimitModalState(null)}
                className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Entendi, vou ajustar as unidades manualmente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
