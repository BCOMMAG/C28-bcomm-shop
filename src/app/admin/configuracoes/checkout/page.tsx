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

      {/* BLOCO 3: RESERVA TEMPORÁRIA DE ESTOQUE (WHATSAPP & ANTI-VENDA DUPLA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Reserva Temporária de Estoque & Proteção Anti-Venda Dupla
              </h2>
              <p className="text-[11px] text-slate-500">
                Retém a peça no banco de dados enquanto o cliente finaliza o pedido via WhatsApp, evitando que outro comprador leve a mesma peça.
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
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">
                Tempo de Retenção da Peça na Reserva (Minutos)
              </label>

              {/* Botões Rápidos de Minutos */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTempoReservaMinutos(mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tempoReservaMinutos === mins
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {mins} min
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                  minutos
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Recomendado: 15 a 30 minutos. Se o cliente não efetuar o pagamento dentro desse prazo, a reserva expira automaticamente e a peça volta à vitrine.
              </span>
            </div>

            {/* Banner de Prévia da Mensagem do WhatsApp */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Timer className="w-4 h-4 text-amber-600" />
                <span>Gatilho de Urgência Real no WhatsApp do Cliente</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-mono bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                &quot;⏱️ *Reserva Provisória:* Suas peças estão reservadas por <strong>{tempoReservaMinutos} minutos</strong> para a conclusão do seu atendimento!&quot;
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enquanto a reserva estiver ativa, o sistema bloqueia tentativas de outros compradores na vitrine.</span>
              </div>
            </div>

            {/* Configuração de Exibição de Quantidade de Estoque ao Consumidor */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Exibir Quantidade de Estoque para o Consumidor</span>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">
                      Vitrine &amp; Modal
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Define se os clientes verão o número exato de peças restantes (ex: &quot;Restam 2 peças&quot;) ou se os números permanecerão ocultos.
                  </p>
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

              <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {exibirQuantidadeEstoqueConsumidor ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Transparente: Exibe o número real de unidades quando o estoque for &le; 5 peças. Peças com mais de 5 unidades exibem apenas &quot;Disponível em estoque&quot;.
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    🔒 Sigilo comercial: Oculta a quantidade exata. Quando o estoque for baixo, informa apenas &quot;Últimas unidades&quot; sem expor números.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            A reserva temporária está desativada. As peças não serão retidas provisoriamente ao direcionar clientes para o WhatsApp.
          </div>
        )}
      </div>

      {/* BLOCO 4: LIMPEZA DE PEDIDOS INATIVOS NO WHATSAPP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Limpeza de Pedidos Inativos no WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                Retira sacolas não pagas e abandonadas da coluna operacional ativa para manter a página rápida e sem poluição visual.
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
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">
                Prazo de Inatividade (Dias sem Pagamento)
              </label>

              {/* Botões Rápidos de Dias */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { dias: 1, label: '24 horas (1 dia)' },
                  { dias: 2, label: '48 horas (2 dias)' },
                  { dias: 3, label: '3 dias' },
                  { dias: 7, label: '7 dias (Padrão)' },
                  { dias: 15, label: '15 dias' },
                  { dias: 30, label: '30 dias' }
                ].map((item) => (
                  <button
                    key={item.dias}
                    type="button"
                    onClick={() => setPrazoInatividadeWhatsappDias(item.dias)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                  dias corridos
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pedidos com mais de {prazoInatividadeWhatsappDias} {prazoInatividadeWhatsappDias === 1 ? 'dia' : 'dias'} no status &quot;Aguardando WhatsApp&quot; sem confirmação de pagamento serão tratados como inativos.
              </span>
            </div>

            {/* Destino do Pedido Inativo */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-slate-700 font-bold">
                Destino dos Pedidos Inativos
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
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
                    <span className="font-bold text-xs block">Mover para Coluna Cancelados (Recomendado)</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Ganha a etiqueta &quot;⏱️ Inativo&quot; e vai para a coluna de Cancelados, mantendo o Kanban perfeito com 5 colunas por tela.
                    </span>
                  </div>
                </label>

                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
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
                    <span className="font-bold text-xs block">Coluna Separada &quot;Não Finalizados&quot;</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Cria uma coluna exclusiva no Kanban para pedidos abandonados, que pode ser ocultada ou exibida a qualquer momento.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Blindagem de Reservas Congeladas */}
            <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 flex items-start gap-2.5 text-sky-900">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block font-bold">Blindagem Inteligente de Clientes VIP:</strong>
                <span>Pedidos que possuem reserva pausada ou congelada pela atendente ficam <strong>100% protegidos</strong> e nunca são descartados automaticamente por inatividade.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            A limpeza automática de pedidos inativos está desativada. Todos os pedidos do WhatsApp permanecerão na coluna pendente indefinidamente.
          </div>
        )}
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
