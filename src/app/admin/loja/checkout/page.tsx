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
  CreditCard,
  Clock,
  ShieldCheck,
  Timer,
  Archive,
  UserX,
  MessageSquareX
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

  // Reserva Provisória de Estoque (WhatsApp & Balcão)
  const [reservaEstoqueAtiva, setReservaEstoqueAtiva] = useState(true);
  const [tempoReservaMinutos, setTempoReservaMinutos] = useState(20);
  const [exibirQuantidadeEstoqueConsumidor, setExibirQuantidadeEstoqueConsumidor] = useState(true);

  // Limpeza de Pedidos Inativos no WhatsApp
  const [autoDescartarInativosWhatsapp, setAutoDescartarInativosWhatsapp] = useState(true);
  const [prazoInatividadeWhatsappDias, setPrazoInatividadeWhatsappDias] = useState(7);
  const [destinoInativosWhatsapp, setDestinoInativosWhatsapp] = useState<'cancelado' | 'coluna_inativos'>('cancelado');

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
          if (data.reservaEstoqueAtiva !== undefined) setReservaEstoqueAtiva(data.reservaEstoqueAtiva);
          if (data.tempoReservaMinutos !== undefined) setTempoReservaMinutos(data.tempoReservaMinutos);
          if (data.exibirQuantidadeEstoqueConsumidor !== undefined) setExibirQuantidadeEstoqueConsumidor(data.exibirQuantidadeEstoqueConsumidor);
          if (data.autoDescartarInativosWhatsapp !== undefined) setAutoDescartarInativosWhatsapp(data.autoDescartarInativosWhatsapp);
          if (data.prazoInatividadeWhatsappDias !== undefined) setPrazoInatividadeWhatsappDias(data.prazoInatividadeWhatsappDias);
          if (data.destinoInativosWhatsapp !== undefined) setDestinoInativosWhatsapp(data.destinoInativosWhatsapp);
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
        pedidoMinimoValor: Number(pedidoMinimoValor),
        reservaEstoqueAtiva,
        tempoReservaMinutos: Number(tempoReservaMinutos),
        exibirQuantidadeEstoqueConsumidor,
        autoDescartarInativosWhatsapp,
        prazoInatividadeWhatsappDias: Number(prazoInatividadeWhatsappDias),
        destinoInativosWhatsapp
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

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif-luxury">
              Checkout, Sacola & Regras de Pedido
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-800 border border-pink-200 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-pink-600" /> Operação & Conversão
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize a experiência do consumidor final na sacola, taxas de presente, valor mínimo e proteção de estoque contra venda dupla no WhatsApp.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="admin-btn-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Salvando...' : 'Salvar Regras'}</span>
        </button>
      </div>

      {/* DASHBOARD PANORÂMICO DE 2 COLUNAS TEMÁTICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* =========================================================================
            COLUNA 1: EXPERIÊNCIA DA SACOLA & CONSUMIDOR FINAL
            ========================================================================= */}
        <div className="space-y-6">
          {/* CARD 1: EMBALAGEM PARA PRESENTE & DEDICATÓRIA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center font-bold">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Embalagem Especial para Presente
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                      Encantamento
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ofereça caixas com laço de cetim e dedicatória no checkout.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-[11px]">Taxa da Embalagem (R$)</label>
                    <div className="relative">
                      <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={taxaPresente}
                        onChange={(e) => setTaxaPresente(Number(e.target.value))}
                        placeholder="12.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white text-xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      R$ 0 para cortesia da boutique.
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={permitirMensagemPresente}
                        onChange={(e) => setPermitirMensagemPresente(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Permitir Dedicatória</span>
                        <span className="text-[10px] text-slate-500">
                          Campo de texto na sacola para recado especial
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Simulação Visual da Sacola */}
                <div className="bg-pink-50/50 border border-pink-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-pink-950 block text-xs">
                        Prévia na Sacola da Cliente:
                      </span>
                      <span className="text-[10px] text-pink-800">
                        &quot;É presente? Adicione caixa com laço por R$ {Number(taxaPresente).toFixed(2).replace('.', ',')}&quot;
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-700 bg-white px-2 py-0.5 rounded-md border border-pink-300 shrink-0">
                    Ativo
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Embalagem especial desativada. As compras serão enviadas na embalagem padrão da loja.
              </div>
            )}
          </div>

          {/* CARD 2: PEDIDO MÍNIMO & VALIDAÇÃO DE CARRINHO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  2. Pedido Mínimo & Validação de Carrinho
                </h2>
                <p className="text-[11px] text-slate-500">
                  Estabeleça um valor mínimo de compras para liberar o checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-[11px]">Valor Mínimo (R$)</label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={pedidoMinimoValor}
                    onChange={(e) => setPedidoMinimoValor(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Deixe 0 para permitir compras sem valor mínimo.
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center text-[11px] text-slate-600">
                <span>
                  {pedidoMinimoValor > 0 ? (
                    <>
                      Pedidos com subtotal inferior a <strong>R$ {Number(pedidoMinimoValor).toFixed(2).replace('.', ',')}</strong> serão bloqueados até atingir a meta.
                    </>
                  ) : (
                    'Sem restrição de valor mínimo. A cliente pode comprar qualquer peça individualmente.'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: VISIBILIDADE DE QUANTIDADE DE ESTOQUE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    3. Exibição de Estoque para o Consumidor
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Controle de sigilo comercial na vitrine e modal de peças.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={exibirQuantidadeEstoqueConsumidor}
                  onChange={(e) => setExibirQuantidadeEstoqueConsumidor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {exibirQuantidadeEstoqueConsumidor ? (
                <span className="text-emerald-700 font-medium">
                  ✓ <strong>Modo Transparente:</strong> Exibe o número real de unidades quando o estoque for &le; 5 peças (ex: &quot;Restam 2 peças&quot;). Acima de 5 unidades, exibe apenas &quot;Disponível em estoque&quot;.
                </span>
              ) : (
                <span className="text-slate-600 font-medium">
                  🔒 <strong>Sigilo Comercial:</strong> Oculta contagens e avisos de escassez. Informa com total elegância apenas &quot;Disponível em estoque para envio imediato!&quot; sem expor os níveis do estoque físico.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUNA 2: OPERAÇÃO, WHATSAPP & PROTEÇÃO DE VENDAS
            ========================================================================= */}
        <div className="space-y-6">
          {/* CARD 4: RESERVA TEMPORÁRIA ANTI-VENDA DUPLA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    4. Reserva Temporária Anti-Venda Dupla
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Bloqueia a peça na vitrine enquanto o lead finaliza no WhatsApp.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={reservaEstoqueAtiva}
                  onChange={(e) => setReservaEstoqueAtiva(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            {reservaEstoqueAtiva ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[11px]">
                    Tempo de Retenção na Reserva (Minutos)
                  </label>

                  {/* Botões Rápidos de Minutos */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {[10, 15, 20, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTempoReservaMinutos(mins)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          tempoReservaMinutos === mins
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  <div className="max-w-xs relative">
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={tempoReservaMinutos}
                      onChange={(e) => setTempoReservaMinutos(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[11px]">
                      minutos
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Se o pagamento não for registrado no prazo, a peça volta à vitrine.
                  </span>
                </div>

                {/* Banner de Prévia no WhatsApp */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gatilho de Urgência no WhatsApp do Cliente:</span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-mono bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    &quot;⏱️ *Reserva Provisória:* Peças retidas por <strong>{tempoReservaMinutos} minutos</strong> para seu atendimento!&quot;
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Reserva temporária desativada. As peças não serão retidas provisoriamente durante o atendimento.
              </div>
            )}
          </div>

          {/* CARD 5: LIMPEZA DE PEDIDOS INATIVOS NO WHATSAPP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    5. Limpeza de Pedidos Inativos no WhatsApp
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Organização automática de sacolas não pagas no Kanban.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoDescartarInativosWhatsapp}
                  onChange={(e) => setAutoDescartarInativosWhatsapp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            {autoDescartarInativosWhatsapp ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[11px]">
                    Prazo de Inatividade (Dias sem Pagamento)
                  </label>

                  {/* Botões Rápidos de Dias */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {[
                      { dias: 1, label: '24h (1d)' },
                      { dias: 2, label: '48h (2d)' },
                      { dias: 3, label: '3 dias' },
                      { dias: 7, label: '7 dias' },
                      { dias: 15, label: '15 dias' },
                      { dias: 30, label: '30 dias' }
                    ].map((item) => (
                      <button
                        key={item.dias}
                        type="button"
                        onClick={() => setPrazoInatividadeWhatsappDias(item.dias)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          prazoInatividadeWhatsappDias === item.dias
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="max-w-xs relative">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={prazoInatividadeWhatsappDias}
                      onChange={(e) => setPrazoInatividadeWhatsappDias(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[11px]">
                      dias corridos
                    </span>
                  </div>
                </div>

                {/* Destino do Pedido Inativo */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-slate-700 font-bold text-[11px]">
                    Destino no Funil de Pedidos
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      destinoInativosWhatsapp === 'cancelado'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-950'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="destinoInativos"
                        value="cancelado"
                        checked={destinoInativosWhatsapp === 'cancelado'}
                        onChange={() => setDestinoInativosWhatsapp('cancelado')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs block">Coluna Cancelados</span>
                        <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">
                          Etiqueta &quot;⏱️ Inativo&quot; e vai para Cancelados
                        </span>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      destinoInativosWhatsapp === 'coluna_inativos'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-950'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="destinoInativos"
                        value="coluna_inativos"
                        checked={destinoInativosWhatsapp === 'coluna_inativos'}
                        onChange={() => setDestinoInativosWhatsapp('coluna_inativos')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs block">Coluna Não Finalizados</span>
                        <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">
                          Coluna exclusiva para leads abandonados
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Blindagem VIP */}
                <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 flex items-start gap-2 text-sky-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] leading-relaxed">
                    <strong>Blindagem VIP:</strong> Reservas pausadas/congeladas pela atendente ficam 100% protegidas contra descarte automático.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Limpeza de inativos desativada. Todos os pedidos permanecerão na coluna pendente indefinidamente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTÃO SALVAR NO RODAPÉ */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
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
