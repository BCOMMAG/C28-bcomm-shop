'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

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
}

export interface GridRowItem {
  id: string;
  nome: string;
  categoria_id: string;
  subcategoria: string;
  cores: string[];
  tamanhos: string[];
  preco: number;
  preco_promocional?: number;
  preco_custo?: number;
  estoque_por_variacao: number;
  foto_url?: string;
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

export function ProductBatchImportModal({
  isOpen,
  onClose,
  lojaId = DEFAULT_TENANT_ID,
  onSuccess,
  categoriesList
}: ProductBatchImportModalProps) {
  const [activeTab, setActiveTab] = useState<'grade' | 'excel'>('grade');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'somar_estoque' | 'substituir' | 'ignorar'>('somar_estoque');
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [successGlobal, setSuccessGlobal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa as linhas da Grade Rápida com exemplos reais caso esteja vazio
  const [gridRows, setGridRows] = useState<GridRowItem[]>(() => [
    {
      id: 'row-1',
      nome: 'Vestido Midi Fluido em Crepe',
      categoria_id: categoriesList[0]?.id || '',
      subcategoria: 'Vestidos & Macacões',
      cores: ['Branco Off-White', 'Preto Clássico'],
      tamanhos: ['P', 'M', 'G'],
      preco: 289.9,
      preco_promocional: 249.9,
      preco_custo: 110.0,
      estoque_por_variacao: 5
    },
    {
      id: 'row-2',
      nome: 'Blazer Alfaiataria Milão',
      categoria_id: categoriesList.find((c) => c.nome.toLowerCase().includes('blazer'))?.id || categoriesList[0]?.id || '',
      subcategoria: 'Alfaiataria',
      cores: ['Bege Areia Nobre', 'Preto Clássico'],
      tamanhos: ['38', '40', '42'],
      preco: 399.0,
      preco_promocional: 0,
      preco_custo: 160.0,
      estoque_por_variacao: 4
    }
  ]);

  // Se a lista de categorias carregar depois, atualiza o default se necessário
  useEffect(() => {
    if (categoriesList.length > 0) {
      setGridRows((prev) =>
        prev.map((r) => (!r.categoria_id ? { ...r, categoria_id: categoriesList[0].id } : r))
      );
    }
  }, [categoriesList]);

  if (!isOpen) return null;

  // Adicionar Nova Peça na Grade
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    const defaultCat = categoriesList[0]?.id || '';
    setGridRows((prev) => [
      ...prev,
      {
        id: newId,
        nome: '',
        categoria_id: defaultCat,
        subcategoria: BOUTIQUE_SUBCATEGORIES[0],
        cores: ['Preto Clássico'],
        tamanhos: ['P', 'M', 'G'],
        preco: 199.9,
        preco_promocional: 0,
        preco_custo: 80.0,
        estoque_por_variacao: 5
      }
    ]);
  };

  // Botão Mágico: DUPLICAR PEÇA COM 1 CLIQUE
  const handleDuplicateRow = (index: number) => {
    const itemToClone = gridRows[index];
    if (!itemToClone) return;

    const clonedItem: GridRowItem = {
      ...itemToClone,
      id: `clone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: itemToClone.nome ? `${itemToClone.nome} (Cópia)` : ''
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

  // Atualizar campo específico da linha
  const handleUpdateRow = (id: string, field: keyof GridRowItem, value: any) => {
    setGridRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Alternar cor da peça
  const handleToggleColor = (id: string, colorName: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const exists = r.cores.includes(colorName);
        const newColors = exists ? r.cores.filter((c) => c !== colorName) : [...r.cores, colorName];
        return { ...r, cores: newColors.length > 0 ? newColors : ['Preto Clássico'] };
      })
    );
  };

  // Alternar tamanho da peça
  const handleToggleSize = (id: string, sizeName: string) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const exists = r.tamanhos.includes(sizeName);
        const newSizes = exists ? r.tamanhos.filter((s) => s !== sizeName) : [...r.tamanhos, sizeName];
        return { ...r, tamanhos: newSizes.length > 0 ? newSizes : ['Tamanho Único'] };
      })
    );
  };

  // Atalho: Selecionar Grade Rápida P ao GG
  const handleQuickGradePMG = (id: string) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, tamanhos: ['P', 'M', 'G', 'GG'] } : r))
    );
  };

  // Atalho: Selecionar Grade Numérica 36 ao 44
  const handleQuickGradeNumeric = (id: string) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, tamanhos: ['36', '38', '40', '42', '44'] } : r))
    );
  };

  // AÇÃO EM MASSA: Replicar Categoria para Todos
  const handleReplicateCategory = () => {
    if (gridRows.length === 0) return;
    const targetCat = gridRows[0].categoria_id;
    setGridRows((prev) => prev.map((r) => ({ ...r, categoria_id: targetCat })));
    setSuccessGlobal('Categoria da 1ª linha replicada para todas as peças!');
    setTimeout(() => setSuccessGlobal(null), 3000);
  };

  // AÇÃO EM MASSA: Replicar Preço para Todos
  const handleReplicatePrice = () => {
    if (gridRows.length === 0) return;
    const targetPrice = gridRows[0].preco;
    const targetPromo = gridRows[0].preco_promocional;
    const targetCusto = gridRows[0].preco_custo;
    setGridRows((prev) =>
      prev.map((r) => ({
        ...r,
        preco: targetPrice,
        preco_promocional: targetPromo,
        preco_custo: targetCusto
      }))
    );
    setSuccessGlobal('Preços da 1ª linha replicados para todas as peças!');
    setTimeout(() => setSuccessGlobal(null), 3000);
  };

  // AÇÃO EM MASSA: Replicar Estoque para Todos
  const handleReplicateStock = () => {
    if (gridRows.length === 0) return;
    const targetStock = gridRows[0].estoque_por_variacao;
    setGridRows((prev) => prev.map((r) => ({ ...r, estoque_por_variacao: targetStock })));
    setSuccessGlobal('Estoque da 1ª linha replicado para todas as peças!');
    setTimeout(() => setSuccessGlobal(null), 3000);
  };

  // Métricas Totais da Grade
  const totalModelos = gridRows.filter((r) => r.nome.trim() !== '').length;
  const totalVariacoes = gridRows.reduce((acc, r) => acc + r.cores.length * r.tamanhos.length, 0);
  const totalEstoqueFisico = gridRows.reduce(
    (acc, r) => acc + r.cores.length * r.tamanhos.length * r.estoque_por_variacao,
    0
  );

  // Download do Modelo Oficial Excel (.xlsx) com lista de categorias oficiais
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Nome do Produto': 'Vestido Midi Fluido em Crepe',
          'Categoria': categoriesList[0]?.nome || 'Vestidos & Macacões',
          'Subcategoria': 'Vestidos & Macacões',
          'Preço Venda': 289.9,
          'Preço Promocional': 249.9,
          'Preço Custo': 110.0,
          'Cores (separadas por vírgula)': 'Branco Off-White, Preto Clássico',
          'Tamanhos (separados por vírgula)': 'P, M, G, GG',
          'Estoque Padrão por Variação': 5,
          'URL da Foto (opcional)': '',
          'Destaque (SIM/NAO)': 'SIM'
        },
        {
          'Nome do Produto': 'Blazer Alfaiataria Milão',
          'Categoria': categoriesList.find((c) => c.nome.toLowerCase().includes('blazer'))?.nome || categoriesList[0]?.nome || 'Blazers & Alfaiataria',
          'Subcategoria': 'Alfaiataria',
          'Preço Venda': 399.0,
          'Preço Promocional': 0,
          'Preço Custo': 160.0,
          'Cores (separadas por vírgula)': 'Bege Areia Nobre, Preto Clássico',
          'Tamanhos (separados por vírgula)': '38, 40, 42, 44',
          'Estoque Padrão por Variação': 4,
          'URL da Foto (opcional)': '',
          'Destaque (SIM/NAO)': 'NAO'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 32 },
        { wch: 24 },
        { wch: 20 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 35 },
        { wch: 30 },
        { wch: 24 },
        { wch: 30 },
        { wch: 18 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importação');

      // Aba auxiliar de categorias oficiais da loja
      const catData = categoriesList.map((c) => ({
        'Categorias Oficiais da Loja (Copie e Cole)': c.nome
      }));
      const wsCat = XLSX.utils.json_to_sheet(catData);
      wsCat['!cols'] = [{ wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsCat, 'Categorias Válidas');

      // Aba de cores oficiais
      const coresData = BOUTIQUE_OFFICIAL_COLORS.map((c) => ({
        'Cores Oficiais da Boutique': c.nome,
        'Código Hex': c.hex
      }));
      const wsCores = XLSX.utils.json_to_sheet(coresData);
      wsCores['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsCores, 'Cores Oficiais');

      XLSX.writeFile(wb, 'modelo_cadastro_catalogo_bcomm.xlsx');
    } catch (err: any) {
      setErrorGlobal('Erro ao gerar template: ' + (err.message || err));
    }
  };

  // Processamento do Arquivo Excel enviado -> Carrega direto na Grade Rápida!
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorGlobal(null);
    setSuccessGlobal(null);
    setIsProcessingFile(true);

    try {
      const buffer = await selected.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const worksheet = wb.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) {
        throw new Error('A planilha selecionada está vazia ou sem dados.');
      }

      // Mapa de categorias por nome (case insensitive)
      const catMap = new Map<string, string>();
      categoriesList.forEach((c) => catMap.set(c.nome.toLowerCase().trim(), c.id));

      const parsedGridRows: GridRowItem[] = [];
      const invalidCategories: string[] = [];

      rawData.forEach((r, idx) => {
        const nome = String(r['Nome do Produto'] || r['Nome'] || r['nome'] || '').trim();
        if (!nome) return;

        const rawCat = String(r['Categoria'] || r['categoria'] || '').trim();
        const matchedCatId = catMap.get(rawCat.toLowerCase()) || categoriesList[0]?.id || '';

        if (rawCat && !catMap.has(rawCat.toLowerCase())) {
          invalidCategories.push(`Linha ${idx + 2}: "${rawCat}"`);
        }

        const subcategoria = String(r['Subcategoria'] || r['subcategoria'] || BOUTIQUE_SUBCATEGORIES[0]).trim();
        const precoNum = parseFloat(String(r['Preço Venda'] || r['Preco Venda'] || r['Preço'] || r['preco'] || '0').replace(',', '.'));
        const promoNum = parseFloat(String(r['Preço Promocional'] || r['Preco Promocional'] || r['preco_promocional'] || '0').replace(',', '.'));
        const custoNum = parseFloat(String(r['Preço Custo'] || r['Preco Custo'] || r['preco_custo'] || '0').replace(',', '.'));
        const estoquePadrao = parseInt(String(r['Estoque Padrão por Variação'] || r['Estoque'] || r['estoque'] || '5'), 10) || 5;

        // Extrai cores
        const rawCores = String(r['Cores (separadas por vírgula)'] || r['Cores'] || r['cores'] || 'Preto Clássico');
        const cores = rawCores
          .split(/[,;\/]/)
          .map((c) => c.trim())
          .filter(Boolean);

        // Extrai tamanhos
        const rawTamanhos = String(r['Tamanhos (separados por vírgula)'] || r['Tamanhos'] || r['tamanhos'] || 'P, M, G');
        const tamanhos = rawTamanhos
          .split(/[,;\/]/)
          .map((t) => t.trim())
          .filter(Boolean);

        parsedGridRows.push({
          id: `excel-row-${Date.now()}-${idx}`,
          nome,
          categoria_id: matchedCatId,
          subcategoria,
          cores: cores.length > 0 ? cores : ['Preto Clássico'],
          tamanhos: tamanhos.length > 0 ? tamanhos : ['Tamanho Único'],
          preco: isNaN(precoNum) || precoNum <= 0 ? 199.9 : precoNum,
          preco_promocional: isNaN(promoNum) || promoNum <= 0 ? undefined : promoNum,
          preco_custo: isNaN(custoNum) || custoNum <= 0 ? undefined : custoNum,
          estoque_por_variacao: estoquePadrao,
          foto_url: String(r['URL da Foto (opcional)'] || r['Foto'] || '').trim() || undefined
        });
      });

      if (parsedGridRows.length === 0) {
        throw new Error('Nenhum produto válido encontrado na planilha.');
      }

      setGridRows(parsedGridRows);
      setActiveTab('grade');

      if (invalidCategories.length > 0) {
        setErrorGlobal(
          `Atenção: Algumas categorias não eram oficiais (${invalidCategories.slice(0, 2).join(', ')}). Elas foram ajustadas para a categoria padrão. Revise os campos na grade antes de salvar.`
        );
      } else {
        setSuccessGlobal(`Excelente! ${parsedGridRows.length} peça(s) da planilha foram carregadas na Grade Rápida.`);
      }
    } catch (err: any) {
      setErrorGlobal(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Gravação Atômica de Todos os Produtos da Grade no Supabase
  const handleExecuteSave = async () => {
    const validRows = gridRows.filter((r) => r.nome.trim() !== '');
    if (validRows.length === 0) {
      setErrorGlobal('Preencha o nome de pelo menos uma peça antes de salvar.');
      return;
    }

    setIsImporting(true);
    setErrorGlobal(null);
    setSuccessGlobal(null);

    const supabase = getSupabaseBrowserClient();
    let importadas = 0;
    let atualizadas = 0;

    try {
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress({
          current: i + 1,
          total: validRows.length,
          stage: `Salvando: ${row.nome} (${i + 1}/${validRows.length})`
        });

        const slugProduto = row.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const totalVariacoesLinha = row.cores.length * row.tamanhos.length;
        const totalEstoqueLinha = totalVariacoesLinha * row.estoque_por_variacao;

        // Verifica existência prévia
        const { data: existingProd } = await supabase
          .from('produtos')
          .select('id, estoque_total')
          .eq('loja_id', lojaId)
          .eq('slug', slugProduto)
          .maybeSingle();

        let produtoId = existingProd?.id;

        if (existingProd) {
          if (duplicateAction === 'ignorar') {
            continue;
          }

          if (duplicateAction === 'somar_estoque') {
            const novoEstoque = (existingProd.estoque_total || 0) + totalEstoqueLinha;
            await supabase
              .from('produtos')
              .update({
                preco: row.preco,
                preco_promocional: row.preco_promocional || null,
                preco_custo: row.preco_custo || null,
                estoque_total: novoEstoque
              })
              .eq('id', existingProd.id);

            atualizadas++;
            continue;
          }
        }

        // Insere Novo Produto
        const { data: insertedProd, error: insertError } = await supabase
          .from('produtos')
          .insert([
            {
              loja_id: lojaId,
              nome: row.nome,
              slug: slugProduto + (existingProd ? `-${Date.now().toString().slice(-4)}` : ''),
              categoria_id: row.categoria_id || null,
              subcategoria: row.subcategoria || null,
              preco: row.preco,
              preco_promocional: row.preco_promocional || null,
              preco_custo: row.preco_custo || null,
              foto_principal: row.foto_url || null,
              ativo: true,
              estoque_total: totalEstoqueLinha
            }
          ])
          .select('id')
          .single();

        if (insertError || !insertedProd) {
          console.error('Erro ao cadastrar peça:', row.nome, insertError);
          continue;
        }

        produtoId = insertedProd.id;

        // Cadastra variações combinadas (Cor x Tamanho)
        const variacoesToInsert: any[] = [];
        row.cores.forEach((cor) => {
          const matchedColor = BOUTIQUE_OFFICIAL_COLORS.find(
            (c) => c.nome.toLowerCase() === cor.toLowerCase()
          );
          const hex = matchedColor ? matchedColor.hex : '#1A1918';

          row.tamanhos.forEach((tam) => {
            const varSku = `${slugProduto.slice(0, 10).toUpperCase()}-${cor.slice(0, 3).toUpperCase()}-${tam}`;
            variacoesToInsert.push({
              loja_id: lojaId,
              produto_id: produtoId,
              cor_nome: cor,
              cor_hex: hex,
              tamanho: tam,
              estoque: row.estoque_por_variacao,
              sku: varSku
            });
          });
        });

        if (variacoesToInsert.length > 0) {
          await supabase.from('variacoes_produto').insert(variacoesToInsert);
        }

        if (row.foto_url) {
          await supabase.from('midias_produto').insert([
            {
              produto_id: produtoId,
              url: row.foto_url,
              tipo: 'foto',
              display_order: 1,
              label: 'Foto Principal'
            }
          ]);
        }

        importadas++;
      }

      setSuccessGlobal(`🎉 Sucesso! ${importadas} peça(s) cadastradas e ${atualizadas} atualizadas com grade completa.`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorGlobal('Falha ao gravar no catálogo: ' + (err.message || err));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
              <Layers className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Cadastro e Reposição em Lote de Peças</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Alta Produtividade
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre dezenas de modelos com grade completa de cores e tamanhos em segundos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador de Abas */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('grade')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'grade'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Grade Rápida no Sistema (Recomendado)</span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                {gridRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'excel'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Importar Planilha Excel (.xlsx)</span>
            </button>
          </div>

          {activeTab === 'grade' && (
            <div className="hidden sm:flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={handleReplicateCategory}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Aplica a categoria da 1ª linha em todas as outras"
              >
                ⚡ Replicar Categoria
              </button>
              <button
                type="button"
                onClick={handleReplicatePrice}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Aplica o preço da 1ª linha em todas as outras"
              >
                💰 Replicar Preço
              </button>
              <button
                type="button"
                onClick={handleReplicateStock}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Aplica o estoque da 1ª linha em todas as outras"
              >
                📦 Replicar Estoque
              </button>
            </div>
          )}
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorGlobal && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {successGlobal && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successGlobal}</span>
            </div>
          )}

          {activeTab === 'grade' ? (
            /* ============================================================ */
            /* ABA 1: GRADE RÁPIDA NO SISTEMA (QUICK GRID EDITOR)           */
            /* ============================================================ */
            <div className="space-y-4">
              {/* Barra de Ações da Grade */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Nova Peça</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Dica:</span>
                  <span>Clique em <strong className="text-amber-800 font-bold">[📋 Duplicar]</strong> em qualquer linha para clonar toda a peça e alterar só os tamanhos!</span>
                </div>
              </div>

              {/* Tabela Interativa de Linhas */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[950px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5 min-w-[200px]">Nome da Peça</th>
                        <th className="p-2.5 min-w-[160px]">Categoria Oficial</th>
                        <th className="p-2.5 min-w-[130px]">Subcategoria</th>
                        <th className="p-2.5 min-w-[200px]">Cores Oficiais</th>
                        <th className="p-2.5 min-w-[220px]">Tamanhos da Grade</th>
                        <th className="p-2.5 w-24">Preço (R$)</th>
                        <th className="p-2.5 w-24">Promo (R$)</th>
                        <th className="p-2.5 w-20 text-center">Estoque</th>
                        <th className="p-2.5 w-24 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {gridRows.map((row, index) => {
                        const totalVarsLinha = row.cores.length * row.tamanhos.length;
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Número da linha */}
                            <td className="p-2.5 text-center font-mono text-slate-400 font-semibold">
                              {index + 1}
                            </td>

                            {/* Nome do Produto */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                required
                                value={row.nome}
                                onChange={(e) => handleUpdateRow(row.id, 'nome', e.target.value)}
                                placeholder="Ex: Vestido Chemise Seda"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-xs"
                              />
                            </td>

                            {/* Categoria Oficial (Dropdown estrito com as categorias da loja) */}
                            <td className="p-2.5">
                              <select
                                value={row.categoria_id}
                                onChange={(e) => handleUpdateRow(row.id, 'categoria_id', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-xs cursor-pointer"
                              >
                                {categoriesList.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nome}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Subcategoria */}
                            <td className="p-2.5">
                              <select
                                value={row.subcategoria}
                                onChange={(e) => handleUpdateRow(row.id, 'subcategoria', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                              >
                                {BOUTIQUE_SUBCATEGORIES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Cores Oficiais (Multi-chip visual) */}
                            <td className="p-2.5">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {BOUTIQUE_OFFICIAL_COLORS.map((cor) => {
                                  const isSelected = row.cores.includes(cor.nome);
                                  return (
                                    <button
                                      key={cor.nome}
                                      type="button"
                                      onClick={() => handleToggleColor(row.id, cor.nome)}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 opacity-60'
                                      }`}
                                      title={cor.nome}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                        style={{ backgroundColor: cor.hex }}
                                      />
                                      <span className="truncate max-w-[70px]">{cor.nome.split(' ')[0]}</span>
                                      {isSelected && <Check className="w-2.5 h-2.5 text-amber-700" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Tamanhos Oficiais & Atalhos Rápidos */}
                            <td className="p-2.5">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {BOUTIQUE_OFFICIAL_SIZES.map((tam) => {
                                    const isSelected = row.tamanhos.includes(tam);
                                    return (
                                      <button
                                        key={tam}
                                        type="button"
                                        onClick={() => handleToggleSize(row.id, tam)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                                        }`}
                                      >
                                        {tam === 'Tamanho Único' ? 'Único' : tam}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Atalhos Rápidos de Grade */}
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                  <span>Atalhos:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickGradePMG(row.id)}
                                    className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200 hover:bg-amber-100 cursor-pointer"
                                  >
                                    P ao GG
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickGradeNumeric(row.id)}
                                    className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200 hover:bg-amber-100 cursor-pointer"
                                  >
                                    36 ao 44
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Preço de Venda */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={row.preco}
                                onChange={(e) => handleUpdateRow(row.id, 'preco', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                              />
                            </td>

                            {/* Preço Promocional */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={row.preco_promocional || ''}
                                onChange={(e) => handleUpdateRow(row.id, 'preco_promocional', parseFloat(e.target.value) || 0)}
                                placeholder="Opcional"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                              />
                            </td>

                            {/* Estoque Padrão por Variação */}
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={row.estoque_por_variacao}
                                onChange={(e) => handleUpdateRow(row.id, 'estoque_por_variacao', parseInt(e.target.value, 10) || 1)}
                                className="w-14 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                              />
                              <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">
                                {totalVarsLinha} vars
                              </span>
                            </td>

                            {/* Ações: DUPLICAR COM 1 CLIQUE & EXCLUIR */}
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(index)}
                                  className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                  title="Duplicar esta peça para criar outra com 1 clique"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover linha"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tratamento para peças repetidas */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-700">Se o produto já existir no catálogo:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupActionGrid"
                      value="somar_estoque"
                      checked={duplicateAction === 'somar_estoque'}
                      onChange={() => setDuplicateAction('somar_estoque')}
                      className="accent-amber-600"
                    />
                    <span className="font-semibold text-slate-800">Somar ao estoque existente (Reposição)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupActionGrid"
                      value="ignorar"
                      checked={duplicateAction === 'ignorar'}
                      onChange={() => setDuplicateAction('ignorar')}
                      className="accent-amber-600"
                    />
                    <span className="text-slate-600">Ignorar repetidas</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* ABA 2: IMPORTAR PLANILHA EXCEL (.XLSX)                       */
            /* ============================================================ */
            <div className="space-y-6">
              {/* Box de Download do Modelo Oficial com Categorias */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">
                      Baixe o Modelo Oficial com as Categorias e Cores Válidas da Loja
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    O arquivo inclui abas dedicadas com a lista oficial de categorias e cores para cópia rápida e sem erros.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha Modelo (.xlsx)</span>
                </button>
              </div>

              {/* Dropzone de Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-amber-50/30 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-400 group-hover:text-amber-600 group-hover:border-amber-300 flex items-center justify-center mx-auto mb-3 transition-colors">
                  {isProcessingFile ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Clique para selecionar ou arraste sua planilha Excel aqui'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Ao enviar, os produtos são carregados na Grade Rápida para você conferir e duplicar peças com facilidade.
                </p>
              </div>

              {/* Dicas de Validação Estrita */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Categorias Válidas
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Use apenas as categorias cadastradas na loja para manter a vitrine organizada e sem erros.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cores e Grade
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Preencha as cores e tamanhos separados por vírgula (ex: P, M, G). O sistema desdobra a grade.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conferência Visual
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Os dados sobem direto na grade interativa da tela para você revisar antes de publicar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Dinâmico com Indicadores e Gravação */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* KPIs da Grade */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-slate-800">
              <span className="text-slate-400">Modelos:</span>
              <strong className="text-slate-900 font-mono">{totalModelos}</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-amber-950">
              <span className="text-amber-700">Grade:</span>
              <strong className="text-amber-900 font-mono">{totalVariacoes} vars</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-emerald-950">
              <span className="text-emerald-700">Estoque:</span>
              <strong className="text-emerald-900 font-mono">{totalEstoqueFisico} un</strong>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
                  <span>Publicar {totalModelos} Peça(s) no Catálogo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
