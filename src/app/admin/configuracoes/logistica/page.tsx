'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  DollarSign,
  Info
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';

export default function ShippingSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Logística
  const [freteGratisValor, setFreteGratisValor] = useState(350);
  const [prazoManuseioDias, setPrazoManuseioDias] = useState(1);

  // Retirada na Boutique
  const [retiradaBoutiqueAtiva, setRetiradaBoutiqueAtiva] = useState(true);
  const [instrucoesRetirada, setInstrucoesRetirada] = useState(
    'Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.'
  );

  // Entrega Local / Motoboy
  const [entregaLocalAtiva, setEntregaLocalAtiva] = useState(true);
  const [entregaLocalTaxa, setEntregaLocalTaxa] = useState(18.00);
  const [entregaLocalBairros, setEntregaLocalBairros] = useState(
    'Curitiba e Região Metropolitana (São José dos Pinhais, Colombo, Pinhais)'
  );

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
          if (data.freteGratisValor !== undefined) setFreteGratisValor(data.freteGratisValor);
          if (data.prazoManuseioDias !== undefined) setPrazoManuseioDias(data.prazoManuseioDias);
          if (data.retiradaBoutiqueAtiva !== undefined) setRetiradaBoutiqueAtiva(data.retiradaBoutiqueAtiva);
          if (data.instrucoesRetirada) setInstrucoesRetirada(data.instrucoesRetirada);
          if (data.entregaLocalAtiva !== undefined) setEntregaLocalAtiva(data.entregaLocalAtiva);
          if (data.entregaLocalTaxa !== undefined) setEntregaLocalTaxa(data.entregaLocalTaxa);
          if (data.entregaLocalBairros) setEntregaLocalBairros(data.entregaLocalBairros);
        }
      } catch (err) {
        console.error('Erro ao buscar parâmetros de envio:', err);
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
        freteGratisValor: Number(freteGratisValor),
        prazoManuseioDias: Number(prazoManuseioDias),
        retiradaBoutiqueAtiva,
        instrucoesRetirada,
        entregaLocalAtiva,
        entregaLocalTaxa: Number(entregaLocalTaxa),
        entregaLocalBairros
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Parâmetros de frete e logística salvos com sucesso!');
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
        <span className="text-xs font-medium">Carregando parâmetros logísticos...</span>
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

      {/* BLOCO 1: FRETE GRÁTIS & PRAZO DE DESPACHO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Política de Frete Grátis & Preparação
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Conversão Nacional
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Valor mínimo de compras para frete gratuito e tempo operacional de separação.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Valor Mínimo para Frete Grátis (R$)
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={freteGratisValor}
                onChange={(e) => setFreteGratisValor(Number(e.target.value))}
                placeholder="350"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Refletido na barra de progresso da sacola (&quot;Faltam R$ X para frete grátis&quot;).
            </span>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Prazo Adicional de Preparação / Manuseio
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                max="10"
                value={prazoManuseioDias}
                onChange={(e) => setPrazoManuseioDias(Number(e.target.value))}
                placeholder="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dias úteis somados ao prazo de transporte dos Correios para embalar o look.
            </span>
          </div>
        </div>

        {/* Prévia da régua de frete grátis */}
        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Prévia da Sacola: Meta de R$ {Number(freteGratisValor).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] font-bold text-sky-700">75% alcançado</span>
          </div>
          <div className="h-2 w-full bg-sky-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-sky-600 rounded-full w-3/4" />
          </div>
          <span className="text-[11px] text-sky-800 block">
            Exibição: <em>&quot;Adicione mais R$ 87,50 para desbloquear Frete Grátis para todo o Brasil!&quot;</em>
          </span>
        </div>
      </div>

      {/* BLOCO 2: MODALIDADES DE ENTREGA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Modalidades de Envio Ativas
            </h2>
            <p className="text-[11px] text-slate-500">
              Opções selecionáveis pelo cliente durante a etapa de entrega no checkout.
            </p>
          </div>
        </div>

        {/* Correios */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Correios (PAC & SEDEX)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Ativo Padrão
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cálculo em tempo real de prazo e tarifa a partir do CEP de destino da cliente.
              </p>
            </div>
          </div>
          <span className="text-slate-400 font-semibold text-[11px]">Sempre habilitado</span>
        </div>

        {/* Entrega Local / Motoboy */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Entrega Expressa via Motoboy</span>
                <span className="text-[11px] text-slate-500">Entrega no mesmo dia para pedidos locais</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={entregaLocalAtiva}
                onChange={(e) => setEntregaLocalAtiva(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {entregaLocalAtiva && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Taxa Fixa do Motoboy (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={entregaLocalTaxa}
                  onChange={(e) => setEntregaLocalTaxa(Number(e.target.value))}
                  placeholder="18.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-bold">Bairros e Cidades Atendidas</label>
                <input
                  type="text"
                  value={entregaLocalBairros}
                  onChange={(e) => setEntregaLocalBairros(e.target.value)}
                  placeholder="Ex: Curitiba e Região Metropolitana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Retirada na Boutique Física */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Retirada na Boutique Física</span>
                <span className="text-[11px] text-slate-500">A cliente compra online e retira no balcão sem pagar frete</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={retiradaBoutiqueAtiva}
                onChange={(e) => setRetiradaBoutiqueAtiva(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
            </label>
          </div>

          {retiradaBoutiqueAtiva && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-700 mb-1 font-bold">Instruções para Retirada Presencial</label>
              <textarea
                rows={2}
                value={instrucoesRetirada}
                onChange={(e) => setInstrucoesRetirada(e.target.value)}
                placeholder="Ex: Disponível para retirada em até 2 horas úteis..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs"
              />
            </div>
          )}
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
          <span>{isSaving ? 'Salvando...' : 'Salvar Parâmetros de Logística'}</span>
        </button>
      </div>
    </form>
  );
}
