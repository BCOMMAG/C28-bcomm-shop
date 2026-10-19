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
  const [activeTab, setActiveTab] = useState<TabType>('tabela');

  // Estados da Calculadora / Provador Virtual
  const [busto, setBusto] = useState<number>(90);
  const [cintura, setCintura] = useState<number>(72);
  const [quadril, setQuadril] = useState<number>(98);
  const [manequimSelecionado, setManequimSelecionado] = useState<string>('40');

  // Cálculo do tamanho recomendado baseado nas medidas
  const recomendacao = useMemo(() => {
    let tam = 'M';
    let motivo = 'Caimento equilibrado no busto e cintura';

    if (busto <= 86 && cintura <= 68 && quadril <= 94) {
      tam = 'P';
      motivo = 'Caimento ajustado e proporcional para biotipo 36-38';
    } else if (busto <= 94 && cintura <= 76 && quadril <= 102) {
      tam = 'M';
      motivo = 'Caimento clássico e confortável para manequim 40';
    } else if (busto <= 102 && cintura <= 84 && quadril <= 110) {
      tam = 'G';
      motivo = 'Caimento fluido com conforto em busto e quadril (42-44)';
    } else {
      tam = 'GG';
      motivo = 'Modelagem com maior folga de vestibilidade (46)';
    }

    // Se a peça for tamanho único
    if (product?.sizes?.length === 1 && product.sizes[0].toLowerCase().includes('único')) {
      tam = 'Tamanho Único';
      motivo = 'Peça desenvolvida com modelagem fluida que veste perfeitamente do 38 ao 44';
    }

    return { tamanho: tam, motivo };
  }, [busto, cintura, quadril, product]);

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
              Guia de Medidas & Caimento Interativo
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
              {product ? `Modelagem de referência para ${product.name}` : 'Encontre o tamanho ideal com caimento impecável para seu biotipo'}
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

        {/* ABA 1: TABELA DE MEDIDAS (CM) */}
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
                  <tr className="hover:bg-[#FAF8F5] dark:hover:bg-[#22201E]">
                    <td className="py-3 px-3.5 font-bold text-[#1A1918] dark:text-[#FAF8F5]">PP</td>
                    <td className="py-3 px-3.5">34 - 36</td>
                    <td className="py-3 px-3.5">80 - 84 cm</td>
                    <td className="py-3 px-3.5">62 - 66 cm</td>
                    <td className="py-3 px-3.5">88 - 92 cm</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('PP')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F5] dark:hover:bg-[#22201E]">
                    <td className="py-3 px-3.5 font-bold text-[#1A1918] dark:text-[#FAF8F5]">P</td>
                    <td className="py-3 px-3.5">36 - 38</td>
                    <td className="py-3 px-3.5">84 - 88 cm</td>
                    <td className="py-3 px-3.5">66 - 70 cm</td>
                    <td className="py-3 px-3.5">92 - 96 cm</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('P')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F5] dark:hover:bg-[#22201E] bg-[#C5A059]/5">
                    <td className="py-3 px-3.5 font-bold text-[#C5A059] dark:text-[#DFBE76]">M</td>
                    <td className="py-3 px-3.5 font-semibold">40</td>
                    <td className="py-3 px-3.5">90 - 94 cm</td>
                    <td className="py-3 px-3.5">72 - 76 cm</td>
                    <td className="py-3 px-3.5">98 - 102 cm</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('M')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F5] dark:hover:bg-[#22201E]">
                    <td className="py-3 px-3.5 font-bold text-[#1A1918] dark:text-[#FAF8F5]">G</td>
                    <td className="py-3 px-3.5">42 - 44</td>
                    <td className="py-3 px-3.5">96 - 102 cm</td>
                    <td className="py-3 px-3.5">78 - 84 cm</td>
                    <td className="py-3 px-3.5">104 - 110 cm</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('G')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF8F5] dark:hover:bg-[#22201E]">
                    <td className="py-3 px-3.5 font-bold text-[#1A1918] dark:text-[#FAF8F5]">GG</td>
                    <td className="py-3 px-3.5">46</td>
                    <td className="py-3 px-3.5">104 - 110 cm</td>
                    <td className="py-3 px-3.5">86 - 92 cm</td>
                    <td className="py-3 px-3.5">112 - 118 cm</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('GG')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                  <tr className="bg-[#FAF8F5] dark:bg-[#22201E] font-semibold text-[#1A1918] dark:text-[#FAF8F5]">
                    <td className="py-3 px-3.5 text-[#C5A059] dark:text-[#DFBE76]">Tamanho Único</td>
                    <td className="py-3 px-3.5">38 ao 44</td>
                    <td className="py-3 px-3.5" colSpan={3}>
                      Modelagem inteligente com elasticidade e caimento adaptável
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplySize('Tamanho Único')}
                        className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-[#C5A059]/30 text-xs text-[#57534E] dark:text-[#D6D3D1] flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>
                <strong>Dica de Caimento:</strong> Se suas medidas ficarem entre dois tamanhos, recomendamos escolher o tamanho maior para tecidos planos (linho e alfaiataria), ou o menor para tecidos canelados com elastano.
              </span>
            </div>
          </div>
        )}

        {/* ABA 2: PROVADOR VIRTUAL (CALCULADORA DE MEDIDAS) */}
        {activeTab === 'provador' && (
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
                    max="120"
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
                    max="105"
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
                    max="130"
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
        <div className="mt-6 p-4 rounded-none bg-[#F7F3EB] dark:bg-[#1E1B19] border border-[#C5A059]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-[#C5A059] shrink-0" />
            <p className="text-xs text-[#57534E] dark:text-[#D6D3D1]">
              Ainda tem dúvidas sobre o caimento no seu corpo? Fale com uma consultora da Leidy Boutique!
            </p>
          </div>
          <a
            href={`https://wa.me/${STORE_INFO.whatsapp}?text=Ol%C3%A1%20Leidy!%20Fiquei%20com%20d%C3%BAvida%20sobre%20as%20minhas%20medidas%20para%20o%20${encodeURIComponent(product?.name || 'look')}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white rounded-none text-xs font-semibold hover:bg-[#25D366] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Consultar Consultora no WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};
