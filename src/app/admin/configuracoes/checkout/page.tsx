'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Gift,
  FileText,
  DollarSign,
  Heart,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';

export default function CheckoutSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Presente & Experiência
  const [presenteAtivo, setPresenteAtivo] = useState(true);
  const [taxaPresente, setTaxaPresente] = useState(12.00);
  const [permitirMensagemPresente, setPermitirMensagemPresente] = useState(true);

  // Pedido Mínimo
  const [pedidoMinimoValor, setPedidoMinimoValor] = useState(0);

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
          if (data.presenteAtivo !== undefined) setPresenteAtivo(data.presenteAtivo);
          if (data.taxaPresente !== undefined) setTaxaPresente(data.taxaPresente);
          if (data.permitirMensagemPresente !== undefined) setPermitirMensagemPresente(data.permitirMensagemPresente);
          if (data.pedidoMinimoValor !== undefined) setPedidoMinimoValor(data.pedidoMinimoValor);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de checkout:', err);
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
        presenteAtivo,
        taxaPresente: Number(taxaPresente),
        permitirMensagemPresente,
        pedidoMinimoValor: Number(pedidoMinimoValor)
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Configurações de checkout e presente salvas com sucesso!');
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
        <span className="text-xs font-medium">Carregando parâmetros de checkout...</span>
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

      {/* BLOCO 1: EMBALAGEM PARA PRESENTE & DEDICATÓRIA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Embalagem Especial para Presente
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                  Encantamento
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ofereça caixas com laço de cetim e cartão personalizado com dedicatória durante o checkout.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={presenteAtivo}
              onChange={(e) => setPresenteAtivo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
          </label>
        </div>

        {presenteAtivo ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Taxa da Embalagem de Presente (R$)</label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxaPresente}
                    onChange={(e) => setTaxaPresente(Number(e.target.value))}
                    placeholder="12.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cobre o custo de caixa rígida, fita de cetim e papel perfumado (ou R$ 0 para cortesia).
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={permitirMensagemPresente}
                    onChange={(e) => setPermitirMensagemPresente(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Permitir Mensagem no Cartão</span>
                    <span className="text-[11px] text-slate-500">
                      Abre um campo de texto no checkout para o cliente escrever uma dedicatória
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Simulação Visual da Sacola */}
            <div className="bg-pink-50/50 border border-pink-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-pink-950 block">
                    Prévia na Sacola: &quot;É um presente para alguém especial?&quot;
                  </span>
                  <span className="text-[11px] text-pink-800">
                    Acrescente embalagem de luxo e cartão por apenas R$ {Number(taxaPresente).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-pink-700 bg-white px-2.5 py-1 rounded-lg border border-pink-300">
                Ativo na Loja
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            A opção de embalagem especial para presente está atualmente desativada. As compras serão enviadas na embalagem padrão da loja.
          </div>
        )}
      </div>

      {/* BLOCO 2: PEDIDO MÍNIMO & REGRAS COMERCIAIS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Pedido Mínimo & Validação de Carrinho
            </h2>
            <p className="text-[11px] text-slate-500">
              Estabeleça um valor mínimo para finalização de compras (útil para atacado ou campanhas especiais).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Valor Mínimo do Pedido (R$)</label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={pedidoMinimoValor}
                onChange={(e) => setPedidoMinimoValor(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Deixe 0 (zero) para permitir qualquer valor sem restrição mínima.
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center text-[11px] text-slate-600">
            <span>
              {pedidoMinimoValor > 0 ? (
                <>
                  Pedidos com valor inferior a <strong>R$ {Number(pedidoMinimoValor).toFixed(2).replace('.', ',')}</strong> não poderão avançar para a tela de pagamento.
                </>
              ) : (
                'Sem restrição de valor mínimo. A cliente pode comprar qualquer peça individualmente.'
              )}
            </span>
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
          <span>{isSaving ? 'Salvando...' : 'Salvar Regras de Checkout'}</span>
        </button>
      </div>
    </form>
  );
}
