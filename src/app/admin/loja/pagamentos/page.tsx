'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Building,
  Sparkles,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Percent,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function PaymentSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const { t, locale } = useAdminI18n();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // PIX e Dados Bancários
  const [tipoChavePix, setTipoChavePix] = useState<'telefone' | 'cnpj' | 'email' | 'aleatoria'>('telefone');
  const [chavePix, setChavePix] = useState('');
  const [pixTitular, setPixTitular] = useState('');
  const [pixBanco, setPixBanco] = useState('');
  const [pixDescontoPercent, setPixDescontoPercent] = useState(5);
  const [pixExpiracaoMinutos, setPixExpiracaoMinutos] = useState(30);
  const [pixWhatsappComprovante, setPixWhatsappComprovante] = useState('');

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
          if (data.tipoChavePix) setTipoChavePix(data.tipoChavePix);
          if (data.chavePix) setChavePix(data.chavePix);
          if (data.pixTitular) setPixTitular(data.pixTitular);
          if (data.pixBanco) setPixBanco(data.pixBanco);
          if (data.pixDescontoPercent !== undefined) setPixDescontoPercent(data.pixDescontoPercent);
          if (data.pixExpiracaoMinutos !== undefined) setPixExpiracaoMinutos(data.pixExpiracaoMinutos);
          if (data.pixWhatsappComprovante) setPixWhatsappComprovante(data.pixWhatsappComprovante);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de pagamento:', err);
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
        tipoChavePix,
        chavePix: chavePix.trim(),
        pixTitular: pixTitular.trim(),
        pixBanco: pixBanco.trim(),
        pixDescontoPercent: Number(pixDescontoPercent),
        pixExpiracaoMinutos: Number(pixExpiracaoMinutos),
        pixWhatsappComprovante: pixWhatsappComprovante.replace(/\D/g, '')
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast(t.storePayments.toastSuccess);
      } else {
        showToast(res.error || t.storePayments.toastError, 'error');
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
        <span className="text-xs font-medium">{t.common?.loading}</span>
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

      {/* BLOCO 1: CHAVE PIX OFICIAL DA BOUTIQUE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t.storePayments.pixTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {t.storePayments.instantSettlement}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t.storePayments.pixDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixKeyTypeLabel}</label>
            <select
              value={tipoChavePix}
              onChange={(e) => setTipoChavePix(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="telefone">Celular / Telefone</option>
              <option value="cnpj">CNPJ / CPF</option>
              <option value="email">E-mail</option>
              <option value="aleatoria">{t.storePayments.pixKeyTypeRandom}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixKeyLabel}</label>
            <input
              type="text"
              required
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder={t.storePayments.pixKeyPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixBeneficiaryLabel}</label>
            <input
              type="text"
              required
              value={pixTitular}
              onChange={(e) => setPixTitular(e.target.value)}
              placeholder={t.storePayments.pixBeneficiaryPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixBankLabel}</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={pixBanco}
                onChange={(e) => setPixBanco(e.target.value)}
                placeholder={t.storePayments.pixBankPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* REGRAS COMERCIAIS DO PIX */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixDiscountLabel}</label>
            <div className="relative">
              <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                max="25"
                step="0.5"
                value={pixDescontoPercent}
                onChange={(e) => setPixDescontoPercent(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {t.storePayments.pixDiscountHint}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.storePayments.pixExpiryLabel}</label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={pixExpiracaoMinutos}
                onChange={(e) => setPixExpiracaoMinutos(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {t.storePayments.pixExpiryHint}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">WhatsApp do Comprovante</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pixWhatsappComprovante}
                onChange={(e) => setPixWhatsappComprovante(e.target.value)}
                placeholder="554197347601"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {t.storePayments.pixWhatsappDesc}
            </span>
          </div>
        </div>

        {/* PRÉVIA INTERATIVA DO CHECKOUT */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">
                {t.storePayments.pixPreviewTitleWithKey(chavePix)}
              </span>
              <span className="text-[11px] text-emerald-800">
                Favorecido: {pixTitular} • Banco: {pixBanco}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs">
              {pixDescontoPercent}% OFF no PIX
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 2: GATEWAYS DE CARTÃO DE CRÉDITO & PARCELAMENTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t.storePayments.gatewaysTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.storePayments.gatewaysDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Mercado Pago */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Mercado Pago</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Conectado
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.storePayments.mpDesc}
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>{t.storePayments.modeProduction}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Ativo
              </span>
            </div>
          </div>

          {/* Asaas */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Asaas</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {t.storePayments.badgeSecondary}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.storePayments.asaasDesc}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Backup</span>
              <span className="text-slate-400 font-semibold">Standby</span>
            </div>
          </div>

          {/* Pagar.me */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Pagar.me / Stone</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  Opcional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.storePayments.pagarmeDesc}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>{t.storePayments.badgeAvailable}</span>
              <span className="text-slate-400 font-semibold">{t.storePayments.badgeConfigurable}</span>
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
          <span>{isSaving ? t.storePayments.savingBtn : t.storePayments.saveBtn}</span>
        </button>
      </div>
    </form>
  );
}
