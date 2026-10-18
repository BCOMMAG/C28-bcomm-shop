'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Palette,
  Store,
  Check,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Eye,
  CheckCircle2,
  Sliders,
  Paintbrush,
  Save,
  QrCode,
  CreditCard,
  Phone,
  Mail,
  Building,
  Truck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminTheme, AdminPaletteKey } from '@/context/AdminThemeContext';
import { cn } from '@/lib/chart-utils';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  StoreSettingsData
} from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const { palette, setPalette, availablePalettes, paletteConfig } = useAdminTheme();

  // Estados dos formulários gerais
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nomeLoja, setNomeLoja] = useState(currentTenant?.nome || 'Leidy Boutique');
  const [slugLoja, setSlugLoja] = useState(currentTenant?.slug || 'leidy-boutique');
  const [whatsappLoja, setWhatsappLoja] = useState(currentTenant?.whatsapp || '554197347601');
  const [emailLoja, setEmailLoja] = useState(currentTenant?.email || 'contato@leidyboutique.com.br');
  const [freteGratis, setFreteGratis] = useState(350);

  // PIX e Dados Bancários Oficiais
  const [tipoChavePix, setTipoChavePix] = useState<'telefone' | 'cnpj' | 'email' | 'aleatoria'>('telefone');
  const [chavePix, setChavePix] = useState('554197347601');
  const [pixTitular, setPixTitular] = useState('Leidyane Cristina da Silva');
  const [pixBanco, setPixBanco] = useState('Nu Pagamentos S.A. (Nubank)');

  // Toast
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setSaveToast({ message, type });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Carrega configurações do Supabase na inicialização
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getStoreSettings(tenantId);
      if (data) {
        setNomeLoja(data.nome);
        setSlugLoja(data.slug);
        setWhatsappLoja(data.whatsapp);
        setEmailLoja(data.email);
        setFreteGratis(data.freteGratisValor);
        setTipoChavePix(data.tipoChavePix);
        setChavePix(data.chavePix);
        setPixTitular(data.pixTitular);
        setPixBanco(data.pixBanco);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [tenantId]);

  const handleSelectPalette = (key: AdminPaletteKey) => {
    setPalette(key);
    const p = availablePalettes.find((item) => item.id === key);
    showToast(`Paleta visual alterada para "${p?.name || key}" com sucesso!`);
  };

  // Salvar Configurações Gerais no Supabase
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        nome: nomeLoja,
        whatsapp: whatsappLoja,
        email: emailLoja,
        freteGratisValor: Number(freteGratis),
        chavePix,
        tipoChavePix,
        pixTitular,
        pixBanco
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast(`Configurações salvas e publicadas com sucesso para ${nomeLoja}!`);
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast flutuante de sucesso */}
      {saveToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            saveToast.type === 'success'
              ? 'bg-slate-900 border-slate-700'
              : 'bg-rose-900 border-rose-700'
          }`}
        >
          {saveToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{saveToast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Sliders className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Configurações da Loja
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Gerencie os dados operacionais, chave PIX para recebimento, frete grátis e temas de {nomeLoja}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/?loja=${slugLoja}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Carregando configurações da boutique...</span>
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-8">
          {/* SEÇÃO 1: DADOS OPERACIONAIS & ATENDIMENTO */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Identificação & Contato de Atendimento
                </h2>
                <p className="text-[11px] text-slate-500">
                  Informações visíveis aos clientes e utilizadas no redirecionamento do WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Nome Oficial da Boutique</label>
                <input
                  type="text"
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                  placeholder="Ex: Leidy Boutique"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">WhatsApp Oficial (com DDD)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsappLoja}
                    onChange={(e) => setWhatsappLoja(e.target.value)}
                    placeholder="Ex: 554197347601"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Número que recebe as finalizações de pedidos e mensagens do checkout.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailLoja}
                    onChange={(e) => setEmailLoja(e.target.value)}
                    placeholder="Ex: contato@leidyboutique.com.br"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS BANCÁRIOS & CHAVE PIX OFICIAL */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  2. Recebimento de Vendas via PIX
                </h2>
                <p className="text-[11px] text-slate-500">
                  A chave PIX cadastrada aqui é exibida no checkout e copiada automaticamente pelas clientes com 5% de desconto.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Tipo da Chave</label>
                <select
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="telefone">Celular / Telefone</option>
                  <option value="cnpj">CNPJ / CPF</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Chave PIX Oficial</label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder="Ex: 554197347601 ou CNPJ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Titular da Conta (Beneficiário)</label>
                <input
                  type="text"
                  value={pixTitular}
                  onChange={(e) => setPixTitular(e.target.value)}
                  placeholder="Ex: Leidyane Cristina ME"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Instituição Bancária</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pixBanco}
                    onChange={(e) => setPixBanco(e.target.value)}
                    placeholder="Ex: Nubank, Inter, Itaú"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Preview da Chave Pix */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-900 font-medium">
                  Prévia no Checkout: <strong>{chavePix}</strong> ({pixTitular} - {pixBanco})
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                5% Desconto Ativo
              </span>
            </div>
          </div>

          {/* SEÇÃO 3: REGRAS COMERCIAIS & LOGÍSTICA */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  3. Política de Frete Grátis
                </h2>
                <p className="text-[11px] text-slate-500">
                  Defina o valor mínimo da sacola para conceder envio gratuito às clientes em todo o Brasil.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Valor Mínimo para Frete Grátis (R$)</label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={freteGratis}
                    onChange={(e) => setFreteGratis(Number(e.target.value))}
                    placeholder="350"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center text-[11px] text-slate-500">
                <span>
                  O valor de <strong>R$ {Number(freteGratis || 0).toFixed(2).replace('.', ',')}</strong> será refletido automaticamente na barra superior de avisos, na sacola lateral e na escolha de opções dos Correios no checkout.
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: PALETA DE CORES DO LAYOUT */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-amber-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    4. Paleta de Cores do Painel
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Escolha a identidade visual do painel. A seleção atualiza instantaneamente a barra lateral, botões, ícones e destaques.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>Paleta ativa:</span>
                <span className="font-bold text-slate-900">{paletteConfig.name}</span>
              </div>
            </div>

            {/* Grade de Paletas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {availablePalettes.map((item) => {
                const isSelected = palette === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPalette(item.id)}
                    className={cn(
                      'rounded-2xl border-2 p-4 sm:p-5 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md',
                      isSelected
                        ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    {/* Tag de Ativa */}
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Ativa</span>
                      </div>
                    )}

                    <div>
                      {/* Amostra Visual (Mini Preview da Sidebar + Acento) */}
                      <div className="w-full h-24 rounded-xl border border-slate-200/90 overflow-hidden flex shadow-inner mb-4">
                        {/* Barra lateral simulada */}
                        <div
                          className="w-1/3 h-full p-2 flex flex-col justify-between"
                          style={{ backgroundColor: item.colors.sidebarBg }}
                        >
                          <div className="w-full h-2 rounded-sm bg-white/20" />
                          <div className="space-y-1">
                            <div
                              className="w-full h-1.5 rounded-sm"
                              style={{ backgroundColor: item.colors.accent }}
                            />
                            <div className="w-3/4 h-1.5 rounded-sm bg-white/20" />
                            <div className="w-2/3 h-1.5 rounded-sm bg-white/10" />
                          </div>
                          <div className="w-1/2 h-1.5 rounded-sm bg-white/20" />
                        </div>

                        {/* Conteúdo simulado */}
                        <div className="w-2/3 h-full bg-[#F8FAFC] p-2.5 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="w-1/3 h-2 rounded bg-slate-200" />
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.colors.accent }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="h-6 rounded bg-white border border-slate-200" />
                            <div className="h-6 rounded bg-white border border-slate-200" />
                          </div>
                          <div className="w-full h-3 rounded bg-white border border-slate-200" />
                        </div>
                      </div>

                      {/* Nome e Categoria */}
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Botão de Seleção */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: item.colors.sidebarBg }}
                          title="Cor da Barra Lateral"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: item.colors.accent }}
                          title="Cor de Destaque / Acentos"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs bg-[#F8FAFC]"
                          title="Fundo do Canvas"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPalette(item.id);
                        }}
                        className={cn(
                          'text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer',
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        )}
                      >
                        {isSelected ? 'Aplicada' : 'Usar Tema'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTÃO SALVAR GERAL */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
