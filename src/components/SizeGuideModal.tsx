'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Ruler,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Check,
  ChevronRight,
  Info,
  Sliders,
  Scissors
} from 'lucide-react';
import { STORE_INFO } from '@/data/products';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_STORE_SIZE_GUIDE, LojaGuiaMedidas, TabelaMedidasLinha } from '@/lib/admin';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSelectSize?: (size: string) => void;
}

type TabType = 'tabela' | 'provador' | 'comomedir';

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectSize
}) => {
  const { currentTenant } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('tabela');

  // Recupera as configurações dinâmicas do Guia de Medidas da loja
  const guiaMedidas: LojaGuiaMedidas = useMemo(() => {
    const custom = (currentTenant?.configuracoes_visuais as any)?.guia_medidas;
    if (custom && Array.isArray(custom.linhas) && custom.linhas.length > 0) {
      return {
        ativo: custom.ativo !== false,
        titulo: custom.titulo || DEFAULT_STORE_SIZE_GUIDE.titulo,
        subtitulo: custom.subtitulo || DEFAULT_STORE_SIZE_GUIDE.subtitulo,
        dica_caimento: custom.dica_caimento || DEFAULT_STORE_SIZE_GUIDE.dica_caimento,
        provador_virtual_ativo: custom.provador_virtual_ativo !== false,
        whatsapp_duvidas_ativo: custom.whatsapp_duvidas_ativo !== false,
        linhas: custom.linhas
      };
    }
    return DEFAULT_STORE_SIZE_GUIDE;
  }, [currentTenant]);

  // Estados da Calculadora / Provador Virtual
  const [busto, setBusto] = useState<number>(90);
  const [cintura, setCintura] = useState<number>(72);
  const [quadril, setQuadril] = useState<number>(98);
  const [manequimSelecionado, setManequimSelecionado] = useState<string>('40');

  // Cálculo do tamanho recomendado baseado nas faixas cadastradas pelo lojista
  const recomendacao = useMemo(() => {
    // 1. Caso especial: Peça com modelagem de Tamanho Único
    const isPecaUnica = product?.sizes?.some((s) => s.toLowerCase().includes('único')) ||
      (product?.sizes?.length === 1 && product.sizes[0].toLowerCase().includes('único'));

    if (isPecaUnica) {
      const adaptavel = guiaMedidas.linhas.find((l) => l.is_adaptavel || l.tamanho.toLowerCase().includes('único'));
      return {
        tamanho: adaptavel?.tamanho || 'Tamanho Único',
        motivo: adaptavel?.busto || 'Peça desenvolvida com modelagem inteligente que se adapta confortavelmente ao corpo.'
      };
    }

    // 2. Busca entre as linhas cadastradas que possuem faixas numéricas de calibração
    const linhasCalibradas = guiaMedidas.linhas.filter((l) => !l.is_adaptavel);

    // Tenta encontrar correspondência direta por faixa
    for (const linha of linhasCalibradas) {
      const bMin = linha.busto_min ?? 0;
      const bMax = linha.busto_max ?? 999;
      const cMin = linha.cintura_min ?? 0;
      const cMax = linha.cintura_max ?? 999;
      const qMin = linha.quadril_min ?? 0;
      const qMax = linha.quadril_max ?? 999;

      if (busto >= bMin && busto <= bMax && cintura >= cMin && cintura <= cMax && quadril >= qMin && quadril <= qMax) {
        return {
          tamanho: linha.tamanho,
          motivo: `Caimento equilibrado ideal para manequim ${linha.manequim || linha.tamanho}`
        };
      }
    }

    // Se não encontrou por faixa restrita de 3 variáveis, busca pelo tamanho com menor desvio das medidas médias
    let melhorLinha = linhasCalibradas[0] || guiaMedidas.linhas[0];
    let menorDistancia = Infinity;

    for (const linha of linhasCalibradas) {
      const bMedio = linha.busto_min && linha.busto_max ? (linha.busto_min + linha.busto_max) / 2 : 90;
      const cMedio = linha.cintura_min && linha.cintura_max ? (linha.cintura_min + linha.cintura_max) / 2 : 72;
      const qMedio = linha.quadril_min && linha.quadril_max ? (linha.quadril_min + linha.quadril_max) / 2 : 98;

      const dist = Math.abs(busto - bMedio) * 1.2 + Math.abs(cintura - cMedio) + Math.abs(quadril - qMedio);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        melhorLinha = linha;
      }
    }

    return {
      tamanho: melhorLinha?.tamanho || 'M',
      motivo: `Caimento recomendado proporcional para suas medidas (manequim aproximado: ${melhorLinha?.manequim || melhorLinha?.tamanho || 'padrão'})`
    };
  }, [busto, cintura, quadril, product, guiaMedidas]);

  if (!isOpen) return null;

  const handleApplySize = (tam: string) => {
    if (onSelectSize) {
      onSelectSize(tam);
    }
    onClose();
  };

  const handleSelectManequim = (manequim: string) => {
    setManequimSelecionado(manequim);
    if (manequim === '36') {
      setBusto(82);
      setCintura(64);
      setQuadril(90);
    } else if (manequim === '38') {
      setBusto(86);
      setCintura(68);
      setQuadril(94);
    } else if (manequim === '40') {
      setBusto(92);
      setCintura(74);
      setQuadril(100);
    } else if (manequim === '42') {
      setBusto(98);
      setCintura(80);
      setQuadril(106);
    } else if (manequim === '44') {
      setBusto(104);
      setCintura(86);
      setQuadril(112);
    } else if (manequim === '46') {
      setBusto(110);
      setCintura(92);
      setQuadril(118);
    }
  };

  const storeWhatsapp = currentTenant?.whatsapp?.replace(/\D/g, '') || STORE_INFO.whatsapp;
  const storeName = currentTenant?.nome || 'Leidy Boutique';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#1A1918] rounded-none shadow-2xl border border-[#C5A059]/40 p-5 sm:p-7 text-[#1A1918] dark:text-[#FAF8F5] max-h-[92vh] overflow-y-auto">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#57534E] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white rounded-none hover:bg-white dark:hover:bg-[#252220] transition-colors cursor-pointer"
          aria-label="Fechar Guia"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título & Identidade do Guia */}
        <div className="flex items-center gap-2.5 mb-2 pr-8">
          <div className="p-2 rounded-none bg-[#C5A059]/15 text-[#C5A059] shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-medium text-[#1A1918] dark:text-[#FAF8F5]">
              {guiaMedidas.titulo || 'Guia de Medidas & Caimento Interativo'}
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
              {product ? `Modelagem de referência para ${product.name}` : (guiaMedidas.subtitulo || 'Encontre o tamanho ideal com caimento impecável para seu biotipo')}
            </p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-[#C5A059]/30 mt-4 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('tabela')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tabela'
                ? 'border-[#C5A059] text-[#C5A059] font-extrabold bg-[#C5A059]/5'
                : 'border-transparent text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Tabela em Centímetros</span>
          </button>

          {guiaMedidas.provador_virtual_ativo !== false && (
            <button
              type="button"
              onClick={() => setActiveTab('provador')}
              className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'provador'
                  ? 'border-[#C5A059] text-[#C5A059] font-extrabold bg-[#C5A059]/5'
                  : 'border-transparent text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Provador Virtual &bull; Recomendador</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('comomedir')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 hidden sm:flex ${
              activeTab === 'comomedir'
                ? 'border-[#C5A059] text-[#C5A059] font-extrabold bg-[#C5A059]/5'
                : 'border-transparent text-[#78716C] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Como se Medir</span>
          </button>
        </div>

        {/* ABA 1: TABELA DE MEDIDAS (CM) DINÂMICA */}
        {activeTab === 'tabela' && (
          <div className="space-y-4 pt-4 animate-fadeIn">
            <div className="overflow-x-auto rounded-none border border-[#C5A059]/30 bg-white dark:bg-[#1E1B19]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F3EB] dark:bg-[#252220] text-[#1A1918] dark:text-[#FAF8F5] uppercase tracking-wider font-semibold border-b border-[#C5A059]/20">
                  <tr>
                    <th className="py-3 px-3.5">Tamanho</th>
                    <th className="py-3 px-3.5">Manequim</th>
                    <th className="py-3 px-3.5">Busto (cm)</th>
                    <th className="py-3 px-3.5">Cintura (cm)</th>
                    <th className="py-3 px-3.5">Quadril (cm)</th>
                    <th className="py-3 px-3.5 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5A059]/15 text-[#57534E] dark:text-[#D6D3D1]">
                  {guiaMedidas.linhas.map((row) => {
                    const isSelectedInProduct = product?.sizes?.includes(row.tamanho);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#FAF8F5] dark:hover:bg-[#22201E] transition-colors ${
                          row.is_adaptavel ? 'bg-[#FAF8F5] dark:bg-[#22201E] font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-[#1A1918] dark:text-[#FAF8F5]">
                          <span className={row.tamanho.toLowerCase().includes('único') ? 'text-[#C5A059] dark:text-[#DFBE76]' : ''}>
                            {row.tamanho}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">{row.manequim}</td>
                        {row.is_adaptavel ? (
                          <td className="py-3 px-3.5" colSpan={3}>
                            {row.busto}
                          </td>
                        ) : (
                          <>
                            <td className="py-3 px-3.5">{row.busto}</td>
                            <td className="py-3 px-3.5">{row.cintura}</td>
                            <td className="py-3 px-3.5">{row.quadril}</td>
                          </>
                        )}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleApplySize(row.tamanho)}
                            className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                          >
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {guiaMedidas.dica_caimento && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-[#C5A059]/30 text-xs text-[#57534E] dark:text-[#D6D3D1] flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>
                  <strong>Dica de Caimento:</strong> {guiaMedidas.dica_caimento}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: PROVADOR VIRTUAL (CALCULADORA DE MEDIDAS) */}
        {activeTab === 'provador' && guiaMedidas.provador_virtual_ativo !== false && (
          <div className="space-y-5 pt-4 animate-fadeIn">
            {/* Seletor Rápido de Manequim */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#1A1918] dark:text-white mb-2">
                1. Qual manequim você costuma vestir?
              </span>
              <div className="grid grid-cols-6 gap-2">
                {['36', '38', '40', '42', '44', '46'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelectManequim(num)}
                    className={`py-2 text-xs font-bold border transition-all cursor-pointer ${
                      manequimSelecionado === num
                        ? 'bg-[#1A1918] dark:bg-white text-white dark:text-[#1A1918] border-[#1A1918] dark:border-white shadow-xs'
                        : 'bg-white dark:bg-[#252220] text-[#57534E] dark:text-[#D6D3D1] border-[#C5A059]/30 hover:border-[#C5A059]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Ajuste fino em Centímetros */}
            <div className="bg-white dark:bg-[#1E1B19] p-4 border border-[#C5A059]/30 space-y-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#1A1918] dark:text-white">
                2. Ajuste fino com suas medidas aproximadas:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Busto */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Busto:</label>
                    <strong className="text-[#C5A059] font-mono">{busto} cm</strong>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="125"
                    value={busto}
                    onChange={(e) => setBusto(Number(e.target.value))}
                    className="w-full accent-[#C5A059] cursor-pointer"
                  />
                </div>

                {/* Cintura */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Cintura:</label>
                    <strong className="text-[#C5A059] font-mono">{cintura} cm</strong>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="115"
                    value={cintura}
                    onChange={(e) => setCintura(Number(e.target.value))}
                    className="w-full accent-[#C5A059] cursor-pointer"
                  />
                </div>

                {/* Quadril */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Quadril:</label>
                    <strong className="text-[#C5A059] font-mono">{quadril} cm</strong>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="135"
                    value={quadril}
                    onChange={(e) => setQuadril(Number(e.target.value))}
                    className="w-full accent-[#C5A059] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Card com o Resultado da Recomendação */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FAF8F5] to-[#F2EDE4] dark:from-[#252220] dark:to-[#1E1B19] border-2 border-[#C5A059] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Recomendação do Provador Virtual
                </span>
                <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                  Confiança do caimento: <strong>98%</strong>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#57534E] dark:text-[#D6D3D1]">Seu tamanho ideal:</span>
                    <span className="text-3xl font-extrabold font-serif-luxury text-[#1A1918] dark:text-white">
                      TAMANHO {recomendacao.tamanho}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    {recomendacao.motivo}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplySize(recomendacao.tamanho)}
                  className="px-5 py-3 bg-[#1A1918] dark:bg-[#C5A059] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Escolher Tamanho {recomendacao.tamanho}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: COMO SE MEDIR */}
        {activeTab === 'comomedir' && (
          <div className="pt-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#57534E] dark:text-[#D6D3D1]">
              <div className="p-3.5 bg-white dark:bg-[#1E1B19] border border-[#C5A059]/20 space-y-1">
                <div className="w-6 h-6 rounded-full bg-[#C5A059]/15 text-[#C5A059] font-bold flex items-center justify-center mb-1 text-xs">
                  1
                </div>
                <h5 className="font-bold text-[#1A1918] dark:text-[#FAF8F5]">Busto</h5>
                <p className="text-[11px] leading-relaxed">
                  Passe a fita métrica sobre a parte mais saliente do busto, mantendo a fita reta e na horizontal pelas costas. Não aperte.
                </p>
              </div>

              <div className="p-3.5 bg-white dark:bg-[#1E1B19] border border-[#C5A059]/20 space-y-1">
                <div className="w-6 h-6 rounded-full bg-[#C5A059]/15 text-[#C5A059] font-bold flex items-center justify-center mb-1 text-xs">
                  2
                </div>
                <h5 className="font-bold text-[#1A1918] dark:text-[#FAF8F5]">Cintura Alta</h5>
                <p className="text-[11px] leading-relaxed">
                  Contorne a parte mais fina da cintura, geralmente cerca de 2 a 3 dedos acima do umbigo, mantendo a postura natural.
                </p>
              </div>

              <div className="p-3.5 bg-white dark:bg-[#1E1B19] border border-[#C5A059]/20 space-y-1">
                <div className="w-6 h-6 rounded-full bg-[#C5A059]/15 text-[#C5A059] font-bold flex items-center justify-center mb-1 text-xs">
                  3
                </div>
                <h5 className="font-bold text-[#1A1918] dark:text-[#FAF8F5]">Quadril</h5>
                <p className="text-[11px] leading-relaxed">
                  Contorne a parte mais volumosa dos glúteos com as pernas unidas. A fita deve deslizar confortavelmente sem apertar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suporte Direto no WhatsApp */}
        {guiaMedidas.whatsapp_duvidas_ativo !== false && (
          <div className="mt-6 p-4 rounded-none bg-[#F7F3EB] dark:bg-[#1E1B19] border border-[#C5A059]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <HelpCircle className="w-5 h-5 text-[#C5A059] shrink-0" />
              <p className="text-xs text-[#57534E] dark:text-[#D6D3D1]">
                Ainda tem dúvidas sobre o caimento no seu corpo? Fale com uma consultora da {storeName}!
              </p>
            </div>
            <a
              href={`https://wa.me/${storeWhatsapp}?text=Ol%C3%A1!%20Fiquei%20com%20d%C3%BAvida%20sobre%20as%20minhas%20medidas%20para%20o%20${encodeURIComponent(product?.name || 'look')}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white rounded-none text-xs font-semibold hover:bg-[#25D366] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Consultar Consultora no WhatsApp</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
