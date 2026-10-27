'use client';

import React, { useState, useRef } from 'react';
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
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

interface ProductBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId?: string;
  onSuccess: () => void;
  categoriesList: { id: string; nome: string; slug: string }[];
}

interface ParsedRow {
  index: number;
  nome: string;
  categoria: string;
  preco: number;
  preco_promocional?: number;
  preco_custo?: number;
  cores: string[];
  tamanhos: string[];
  estoque_por_variacao: number;
  descricao?: string;
  foto_url?: string;
  sku?: string;
  destaque?: boolean;
  outlet?: boolean;
  total_variacoes: number;
  total_estoque: number;
  valido: boolean;
  erros: string[];
}

export function ProductBatchImportModal({
  isOpen,
  onClose,
  lojaId = DEFAULT_TENANT_ID,
  onSuccess,
  categoriesList
}: ProductBatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'somar_estoque' | 'substituir' | 'ignorar'>('somar_estoque');
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [successGlobal, setSuccessGlobal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'previa'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Gerador e Download do Template Oficial Excel (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Nome do Produto': 'Vestido Midi Fluido em Crepe',
          'Categoria': 'Vestidos & Macacões',
          'Preço Venda': 289.90,
          'Preço Promocional': 249.90,
          'Preço Custo': 110.00,
          'Cores (separadas por vírgula)': 'Off-White, Fúcsia, Preto',
          'Tamanhos (separados por vírgula)': 'P, M, G, GG',
          'Estoque Padrão por Variação': 5,
          'Descrição': 'Vestido elegante confeccionado em crepe toque de seda com fenda frontal.',
          'URL da Foto (opcional)': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
          'SKU Referência (opcional)': 'VEST-MIDI-FLP',
          'Destaque (SIM/NAO)': 'SIM'
        },
        {
          'Nome do Produto': 'Blazer Alfaiataria Milão',
          'Categoria': 'Blazers & Alfaiataria',
          'Preço Venda': 399.00,
          'Preço Promocional': 0,
          'Preço Custo': 160.00,
          'Cores (separadas por vírgula)': 'Areia, Preto, Terracota',
          'Tamanhos (separados por vírgula)': '38, 40, 42, 44',
          'Estoque Padrão por Variação': 4,
          'Descrição': 'Blazer estruturado com ombreiras suaves e forro em cetim italiano.',
          'URL da Foto (opcional)': '',
          'SKU Referência (opcional)': 'BLZ-MIL-01',
          'Destaque (SIM/NAO)': 'NAO'
        },
        {
          'Nome do Produto': 'Camisa Seda Pura Botões Ouro',
          'Categoria': 'Camisas',
          'Preço Venda': 219.00,
          'Preço Promocional': 189.90,
          'Preço Custo': 85.00,
          'Cores (separadas por vírgula)': 'Branco Neve, Verde Oliva',
          'Tamanhos (separados por vírgula)': 'P, M, G',
          'Estoque Padrão por Variação': 6,
          'Descrição': 'Camisa clássica atemporal com caimento impecável e toque ultra suave.',
          'URL da Foto (opcional)': '',
          'SKU Referência (opcional)': 'CAM-SD-02',
          'Destaque (SIM/NAO)': 'SIM'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);

      // Largura estilizada das colunas
      ws['!cols'] = [
        { wch: 32 }, // Nome
        { wch: 24 }, // Categoria
        { wch: 14 }, // Preco Venda
        { wch: 18 }, // Preco Promo
        { wch: 14 }, // Preco Custo
        { wch: 30 }, // Cores
        { wch: 28 }, // Tamanhos
        { wch: 24 }, // Estoque Padrão
        { wch: 45 }, // Descrição
        { wch: 35 }, // URL Foto
        { wch: 20 }, // SKU
        { wch: 18 }  // Destaque
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importação');

      // Cria aba de instruções e categorias válidas
      const instData = [
        { 'Como Preencher a Planilha': 'REGRAS E ORIENTAÇÕES PARA O CADASTRO EM LOTE' },
        { 'Como Preencher a Planilha': '1. Cada linha representa 1 MODELO de peça que será cadastrado na vitrine.' },
        { 'Como Preencher a Planilha': '2. As cores e tamanhos podem ser preenchidos separados por vírgula (ex: P, M, G).' },
        { 'Como Preencher a Planilha': '3. O sistema cria automaticamente a grade combinando cada Cor com cada Tamanho.' },
        { 'Como Preencher a Planilha': '4. Caso deixe a foto em branco, a peça é cadastrada e você pode subir as fotos depois pelo celular ou PC.' },
        { 'Como Preencher a Planilha': '5. Categorias cadastradas na sua loja: ' + categoriesList.map(c => c.nome).join(' | ') }
      ];
      const wsInst = XLSX.utils.json_to_sheet(instData);
      wsInst['!cols'] = [{ wch: 85 }];
      XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');

      XLSX.writeFile(wb, 'modelo_cadastro_catalogo_bcomm.xlsx');
    } catch (err: any) {
      setErrorGlobal('Erro ao gerar template: ' + (err.message || err));
    }
  };

  // Processa o arquivo selecionado
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

      const rows: ParsedRow[] = rawData.map((r, idx) => {
        const nome = String(r['Nome do Produto'] || r['Nome'] || r['nome'] || '').trim();
        const categoria = String(r['Categoria'] || r['categoria'] || 'Geral').trim();
        const precoNum = parseFloat(String(r['Preço Venda'] || r['Preco Venda'] || r['Preço'] || r['preco'] || '0').replace(',', '.'));
        const promoNum = parseFloat(String(r['Preço Promocional'] || r['Preco Promocional'] || r['preco_promocional'] || '0').replace(',', '.'));
        const custoNum = parseFloat(String(r['Preço Custo'] || r['Preco Custo'] || r['preco_custo'] || '0').replace(',', '.'));
        const estoquePadrao = parseInt(String(r['Estoque Padrão por Variação'] || r['Estoque'] || r['estoque'] || '5'), 10) || 5;

        // Extrai cores e tamanhos
        const rawCores = String(r['Cores (separadas por vírgula)'] || r['Cores'] || r['cores'] || 'Única');
        const cores = rawCores
          .split(/[,;\/]/)
          .map((c) => c.trim())
          .filter(Boolean);
        if (cores.length === 0) cores.push('Única');

        const rawTamanhos = String(r['Tamanhos (separados por vírgula)'] || r['Tamanhos'] || r['tamanhos'] || 'Único');
        const tamanhos = rawTamanhos
          .split(/[,;\/]/)
          .map((t) => t.trim())
          .filter(Boolean);
        if (tamanhos.length === 0) tamanhos.push('Único');

        const descricao = String(r['Descrição'] || r['Descricao'] || r['descricao'] || '').trim();
        const foto_url = String(r['URL da Foto (opcional)'] || r['Foto'] || r['foto_url'] || '').trim();
        const sku = String(r['SKU Referência (opcional)'] || r['SKU'] || r['sku'] || '').trim();
        const rawDestaque = String(r['Destaque (SIM/NAO)'] || r['Destaque'] || '').toUpperCase();
        const destaque = rawDestaque.includes('SIM') || rawDestaque.includes('S') || rawDestaque.includes('TRUE');

        const total_variacoes = cores.length * tamanhos.length;
        const total_estoque = total_variacoes * estoquePadrao;

        const erros: string[] = [];
        if (!nome) erros.push('Nome da peça é obrigatório');
        if (isNaN(precoNum) || precoNum <= 0) erros.push('Preço de venda inválido');

        return {
          index: idx + 1,
          nome,
          categoria,
          preco: isNaN(precoNum) ? 0 : precoNum,
          preco_promocional: isNaN(promoNum) || promoNum <= 0 ? undefined : promoNum,
          preco_custo: isNaN(custoNum) || custoNum <= 0 ? undefined : custoNum,
          cores,
          tamanhos,
          estoque_por_variacao: estoquePadrao,
          descricao: descricao || undefined,
          foto_url: foto_url || undefined,
          sku: sku || undefined,
          destaque,
          total_variacoes,
          total_estoque,
          valido: erros.length === 0,
          erros
        };
      });

      setParsedRows(rows);
      setActiveTab('previa');
    } catch (err: any) {
      setErrorGlobal(err.message || 'Erro ao ler arquivo da planilha.');
      setParsedRows([]);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Executa a importação das peças no Supabase
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.valido);
    if (validRows.length === 0) {
      setErrorGlobal('Nenhuma linha válida para importar.');
      return;
    }

    setIsImporting(true);
    setErrorGlobal(null);
    setSuccessGlobal(null);

    const supabase = getSupabaseBrowserClient();
    let importadas = 0;
    let atualizadas = 0;

    try {
      // 1. Mapa de categorias existentes
      const catMap = new Map<string, string>();
      categoriesList.forEach((c) => {
        catMap.set(c.nome.toLowerCase().trim(), c.id);
        catMap.set(c.slug.toLowerCase().trim(), c.id);
      });

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress({
          current: i + 1,
          total: validRows.length,
          stage: `Processando: ${row.nome} (${i + 1}/${validRows.length})`
        });

        // Resolve ou cria categoria
        let catId: string | null = catMap.get(row.categoria.toLowerCase().trim()) || null;
        if (!catId && row.categoria) {
          const slugCat = row.categoria
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          const { data: newCat } = await supabase
            .from('categorias')
            .insert([{ nome: row.categoria, slug: slugCat, loja_id: lojaId }])
            .select('id')
            .single();

          if (newCat) {
            catId = newCat.id;
            catMap.set(row.categoria.toLowerCase().trim(), newCat.id);
          }
        }

        const slugProduto = row.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Verifica se já existe por slug ou SKU
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
            const novoEstoque = (existingProd.estoque_total || 0) + row.total_estoque;
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

        // Se for novo produto
        const { data: insertedProd, error: insertError } = await supabase
          .from('produtos')
          .insert([
            {
              loja_id: lojaId,
              nome: row.nome,
              slug: slugProduto + (existingProd ? `-${Date.now().toString().slice(-4)}` : ''),
              categoria_id: catId,
              preco: row.preco,
              preco_promocional: row.preco_promocional || null,
              preco_custo: row.preco_custo || null,
              descricao: row.descricao || null,
              foto_principal: row.foto_url || null,
              destaque: row.destaque || false,
              ativo: true,
              estoque_total: row.total_estoque
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
          row.tamanhos.forEach((tam) => {
            const varSku = row.sku
              ? `${row.sku}-${cor.slice(0, 3).toUpperCase()}-${tam}`
              : `${slugProduto.slice(0, 10).toUpperCase()}-${cor.slice(0, 3).toUpperCase()}-${tam}`;

            variacoesToInsert.push({
              produto_id: produtoId,
              cor_nome: cor,
              cor_hex: cor.toLowerCase().includes('preto') ? '#111827' : cor.toLowerCase().includes('branco') || cor.toLowerCase().includes('off') ? '#F9FAFB' : '#D97706',
              tamanho: tam,
              estoque: row.estoque_por_variacao,
              sku: varSku
            });
          });
        });

        if (variacoesToInsert.length > 0) {
          await supabase.from('variacoes_produto').insert(variacoesToInsert);
        }

        // Se tiver foto, cadastra em midias_produto também
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

      setSuccessGlobal(`Sucesso! ${importadas} novas peças cadastradas e ${atualizadas} atualizadas com grade completa.`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorGlobal('Falha ao processar importação: ' + (err.message || err));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const totalPecasValidas = parsedRows.filter((r) => r.valido).length;
  const totalGradeGerada = parsedRows.filter((r) => r.valido).reduce((acc, r) => acc + r.total_variacoes, 0);
  const totalEstoqueFisico = parsedRows.filter((r) => r.valido).reduce((acc, r) => acc + r.total_estoque, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-300">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Cadastro e Reposição em Lote de Peças</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Importe dezenas de peças de uma vez com grades completas de cor e tamanho.
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

        {/* Abas */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Selecionar Planilha</span>
          </button>

          <button
            onClick={() => setActiveTab('previa')}
            disabled={parsedRows.length === 0}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'previa'
                ? 'border-amber-600 text-amber-900'
                : parsedRows.length === 0
                ? 'border-transparent text-slate-300 cursor-not-allowed'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Prévia & Validação ({parsedRows.length})</span>
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
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

          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {/* Box de Download do Modelo */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">
                      Não tem a planilha pronta? Baixe o modelo oficial preenchido
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    O arquivo vem com exemplos reais de moda feminina e instruções detalhadas de preenchimento.
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
                  {file ? file.name : 'Clique para selecionar ou arraste o arquivo aqui'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou CSV (.csv)
                </p>
              </div>

              {/* Dicas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cores e Tamanhos
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Basta separar por vírgula (ex: P, M, G). O sistema calcula toda a grade automaticamente.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fotos Opcionais
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Pode subir a planilha sem foto e anexar as fotos reais depois com 1 clique pelo celular.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Inteligência de Coleção
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Se a categoria não existir, o sistema cria automaticamente e vincula na vitrine.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* TAB DE PRÉVIA */
            <div className="space-y-4">
              {/* KPIs de Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Modelos Encontrados</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {totalPecasValidas} <span className="text-xs font-normal text-slate-500">peças</span>
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Grade Combinada</span>
                  <span className="text-base font-black text-amber-950 font-mono">
                    {totalGradeGerada} <span className="text-xs font-normal text-amber-800">variações</span>
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Estoque Físico Total</span>
                  <span className="text-base font-black text-emerald-950 font-mono">
                    {totalEstoqueFisico} <span className="text-xs font-normal text-emerald-800">unidades</span>
                  </span>
                </div>
              </div>

              {/* Tratamento de Peças já existentes */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-700">Se a peça já existir no catálogo:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="somar_estoque"
                      checked={duplicateAction === 'somar_estoque'}
                      onChange={() => setDuplicateAction('somar_estoque')}
                      className="accent-amber-600"
                    />
                    <span className="font-semibold text-slate-800">Somar ao estoque (Reposição)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="ignorar"
                      checked={duplicateAction === 'ignorar'}
                      onChange={() => setDuplicateAction('ignorar')}
                      className="accent-amber-600"
                    />
                    <span className="text-slate-600">Ignorar repetidas</span>
                  </label>
                </div>
              </div>

              {/* Tabela de Prévia */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Linha</th>
                      <th className="p-2.5">Produto</th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5">Preço</th>
                      <th className="p-2.5">Cores</th>
                      <th className="p-2.5">Tamanhos</th>
                      <th className="p-2.5">Grade</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr key={row.index} className={row.valido ? 'hover:bg-slate-50/70' : 'bg-rose-50/50'}>
                        <td className="p-2.5 font-mono text-slate-400">#{row.index}</td>
                        <td className="p-2.5 font-bold text-slate-900">{row.nome || <span className="text-rose-500 italic">Sem nome</span>}</td>
                        <td className="p-2.5 text-slate-600">{row.categoria}</td>
                        <td className="p-2.5 font-mono font-semibold text-slate-800">
                          R$ {row.preco.toFixed(2)}
                          {row.preco_promocional && (
                            <span className="text-[10px] text-emerald-600 block">Promo: R$ {row.preco_promocional.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600">{row.cores.join(', ')}</td>
                        <td className="p-2.5 text-slate-600">{row.tamanhos.join(', ')}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-800">
                          {row.total_variacoes} vars ({row.total_estoque} un)
                        </td>
                        <td className="p-2.5 text-center">
                          {row.valido ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Pronto
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]" title={row.erros.join(', ')}>
                              Erro
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (activeTab === 'previa') setActiveTab('upload');
              else onClose();
            }}
            disabled={isImporting}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {activeTab === 'previa' ? 'Voltar para Arquivo' : 'Cancelar'}
          </button>

          {activeTab === 'upload' ? (
            <button
              onClick={() => setActiveTab('previa')}
              disabled={parsedRows.length === 0}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <span>Ver Prévia das Peças</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleExecuteImport}
              disabled={isImporting || totalPecasValidas === 0}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{importProgress?.stage || 'Importando Peças...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Importação de {totalPecasValidas} Peça(s)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
