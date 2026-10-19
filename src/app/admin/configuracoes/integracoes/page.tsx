'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Share2,
  TrendingUp,
  Search,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';

export default function IntegrationsSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Marketing & SEO
  const [metaPixelId, setMetaPixelId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [metaTitlePadrao, setMetaTitlePadrao] = useState('Leidy Boutique | Moda Feminina Exclusiva');
  const [metaDescriptionPadrao, setMetaDescriptionPadrao] = useState(
    'Encontre vestidos, conjuntos, alfaiataria e moda feminina contemporânea com entrega rápida para todo o Brasil.'
  );
  const [ogImageUrl, setOgImageUrl] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getStoreSettings(tenantId);
        if (data) {
          if (data.metaPixelId) setMetaPixelId(data.metaPixelId);
          if (data.googleAnalyticsId) setGoogleAnalyticsId(data.googleAnalyticsId);
          if (data.metaTitlePadrao) setMetaTitlePadrao(data.metaTitlePadrao);
          if (data.metaDescriptionPadrao) setMetaDescriptionPadrao(data.metaDescriptionPadrao);
          if (data.ogImageUrl) setOgImageUrl(data.ogImageUrl);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de integração:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        metaPixelId: metaPixelId.trim(),
        googleAnalyticsId: googleAnalyticsId.trim(),
        metaTitlePadrao: metaTitlePadrao.trim(),
        metaDescriptionPadrao: metaDescriptionPadrao.trim(),
        ogImageUrl: ogImageUrl.trim()
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Parâmetros de rastreamento e SEO salvos com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando integrações de marketing...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
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

      {/* BLOCO 1: RASTREAMENTO & PIXELS DE ANÚNCIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Pixels de Rastreamento (Meta Ads & Google)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Tráfego Pago
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Conecte seus identificadores de marketing para medir retorno de investimento (ROAS) de anúncios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Meta Pixel */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                Pixel da Meta (Facebook / Instagram)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Meta Ads
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dispara eventos de <em>PageView</em>, <em>ViewContent</em>, <em>AddToCart</em>, <em>InitiateCheckout</em> e <em>Purchase</em>.
            </p>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">ID do Pixel da Meta</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="Ex: 1234567890123456"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Google Analytics 4 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                Google Analytics 4 (GA4)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Métricas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Acompanhe visitantes em tempo real, canais de aquisição e funil de abandono de carrinho.
            </p>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">ID de Medição do GA4</label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="Ex: G-XXXXXXXXXX"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: SEO & COMPARTILHAMENTO EM REDES SOCIAIS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. SEO & Compartilhamento Social (OpenGraph)
            </h2>
            <p className="text-[11px] text-slate-500">
              Como sua loja é encontrada no Google e visualizada ao compartilhar o link no WhatsApp e redes sociais.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Título da Página (Meta Title)</label>
            <input
              type="text"
              value={metaTitlePadrao}
              onChange={(e) => setMetaTitlePadrao(e.target.value)}
              placeholder="Ex: Leidy Boutique | Moda Feminina Exclusiva"
              maxLength={70}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Ideal: entre 50 e 60 caracteres</span>
              <span>{metaTitlePadrao.length}/70</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Descrição da Loja (Meta Description)</label>
            <textarea
              rows={2}
              value={metaDescriptionPadrao}
              onChange={(e) => setMetaDescriptionPadrao(e.target.value)}
              placeholder="Resumo atraente da proposta da loja..."
              maxLength={160}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Ideal: até 160 caracteres para o snippet do Google</span>
              <span>{metaDescriptionPadrao.length}/160</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">URL da Imagem de Compartilhamento (OpenGraph Image)</label>
            <input
              type="url"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Imagem exibida ao enviar o link da boutique no WhatsApp, Telegram e feed do Facebook (1200x630px recomendado).
            </span>
          </div>

          {/* Prévia no Google Snippet */}
          <div className="pt-2">
            <span className="block text-slate-700 mb-2 font-bold text-[11px]">Prévia nos Resultados de Busca (Google)</span>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 max-w-xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>https://leidyboutique.com.br</span>
                <span>› vitrine</span>
              </div>
              <h4 className="text-sm font-bold text-blue-700 hover:underline cursor-pointer truncate">
                {metaTitlePadrao || 'Leidy Boutique | Moda Feminina'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {metaDescriptionPadrao || 'Encontre vestidos, conjuntos e alfaiataria premium...'}
              </p>
            </div>
          </div>
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
          <span>{isSaving ? 'Salvando...' : 'Salvar Parâmetros de SEO & Pixels'}</span>
        </button>
      </div>
    </form>
  );
}
