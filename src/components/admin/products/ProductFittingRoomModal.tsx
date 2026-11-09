'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Clock, Check, AlertCircle, ShoppingBag, User, Phone, Sparkles, Trash2, ArrowRight, ExternalLink } from 'lucide-react';
import {
  ReservaEstoque,
  createReservation,
  createFittingRoomOrderAndReservation,
  cancelReservation,
  convertReservationToSale,
  getActiveReservations
} from '@/lib/reservas';
import { AdminProductItem } from '@/lib/admin';
import { useAdminI18n } from '@/context/AdminI18nContext';

interface ProductFittingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProductItem;
  lojaId: string;
  onReservationUpdated?: () => void;
}

export function ProductFittingRoomModal({
  isOpen,
  onClose,
  product,
  lojaId,
  onReservationUpdated
}: ProductFittingRoomModalProps) {
  const { t } = useAdminI18n();
  const [activeReservations, setActiveReservations] = useState<ReservaEstoque[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');
  const [duracaoMinutos, setDuracaoMinutos] = useState(30);
  const [motivo, setMotivo] = useState<'provador' | 'whatsapp_pix' | 'condicional'>('provador');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastCreatedOrderNum, setLastCreatedOrderNum] = useState<string | null>(null);

  // Identifica vendedora ativa
  const getActiveColab = () => {
    if (typeof window === 'undefined') return { id: undefined, nome: 'Vendedora' };
    try {
      const saved = localStorage.getItem('leidy_admin_colaborador');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { id: parsed.id, nome: parsed.nome };
      }
    } catch {}
    return { id: undefined, nome: 'Vendedora Balcão' };
  };

  const loadReservations = async () => {
    try {
      const list = await getActiveReservations(lojaId);
      const filtered = list.filter((r) => r.produto_id === product.id);
      setActiveReservations(filtered);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReservations();
      setErrorMsg('');
      setSuccessMsg('');
      if (product.variacoes && product.variacoes.length > 0) {
        setSelectedVariationId(product.variacoes[0].id);
      }
    }
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const colab = getActiveColab();
    const selectedVar = product.variacoes?.find((v) => v.id === selectedVariationId);

    const res = await createFittingRoomOrderAndReservation(lojaId, {
      produto_id: product.id,
      produto_nome: product.nome,
      preco: product.preco,
      foto_url: product.foto_principal || undefined,
      variacao_id: selectedVariationId || undefined,
      tamanho: selectedVar?.tamanho || undefined,
      cor: selectedVar?.cor_nome || undefined,
      quantidade: 1,
      vendedora_id: colab.id,
      vendedora_nome: colab.nome,
      cliente_nome: clienteNome.trim() || undefined,
      cliente_telefone: clienteTelefone.trim() || undefined,
      duracaoMinutos
    });

    setLoading(false);

    if (res.success) {
      setSuccessMsg('Peça reservada no provador com sucesso! Atendimento criado na Central de Pedidos.');
      setLastCreatedOrderNum(res.numeroPedido || null);
      setClienteNome('');
      setClienteTelefone('');
      await loadReservations();
      if (onReservationUpdated) onReservationUpdated();
    } else {
      setErrorMsg(res.error || 'Erro ao criar reserva.');
    }
  };

  const handleCancelReservation = async (id: string) => {
    const colab = getActiveColab();
    const ok = await cancelReservation(lojaId, id, colab.nome);
    if (ok) {
      setSuccessMsg('Reserva liberada! Peça devolvida para a vitrine online.');
      await loadReservations();
      if (onReservationUpdated) onReservationUpdated();
    }
  };

  const handleConvertToSale = async (id: string) => {
    const colab = getActiveColab();
    const ok = await convertReservationToSale(lojaId, id, colab.nome);
    if (ok) {
      setSuccessMsg('Venda registrada no balcão com sucesso!');
      await loadReservations();
      if (onReservationUpdated) onReservationUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.products.fittingRoomModal.title}</h2>
              <p className="text-xs text-slate-500 truncate max-w-[300px]">{product.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMsg}</span>
              </div>
              {lastCreatedOrderNum && (
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-emerald-950">
                    {t.products.fittingRoomModal.orderCreatedLabel(lastCreatedOrderNum)}
                  </span>
                  <Link
                    href="/admin/pedidos"
                    className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                  >
                    <span>{t.products.fittingRoomModal.viewInKanbanBtn}</span>
                    <ArrowRight className="w-3 h-3 text-amber-700" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Reservas Ativas no Momento */}
          {activeReservations.length > 0 && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  <span>{t.products.fittingRoomModal.activeRoomsTitle(activeReservations.length)}</span>
                </span>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  {t.products.fittingRoomModal.lockedOnSiteBadge}
                </span>
              </div>

              <div className="space-y-1.5">
                {activeReservations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {r.tamanho ? `Tam: ${r.tamanho}` : ''} {r.cor ? `• ${r.cor}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {t.products.fittingRoomModal.bySeller(r.vendedora_nome)} &bull;{' '}
                        <span className="text-amber-800 font-bold">
                          {t.products.fittingRoomModal.remainingMin(r.minutos_restantes || 0)}
                        </span>
                        {r.cliente_nome ? ` (${t.products.fittingRoomModal.customerLabel(r.cliente_nome)})` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleConvertToSale(r.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md transition-colors"
                        title={t.products.fittingRoomModal.sellBtn}
                      >
                        {t.products.fittingRoomModal.sellBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(r.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-[10px] rounded-md transition-colors"
                        title={t.products.fittingRoomModal.releaseBtn}
                      >
                        {t.products.fittingRoomModal.releaseBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de Nova Reserva */}
          <form onSubmit={handleCreateReservation} className="space-y-4">
            <span className="text-xs font-bold text-slate-800 block">
              {t.products.fittingRoomModal.newReservationTitle}
            </span>

            {/* Variação (Tamanho / Cor) */}
            {product.variacoes && product.variacoes.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {t.products.fittingRoomModal.selectVariation}
                </label>
                <select
                  value={selectedVariationId}
                  onChange={(e) => setSelectedVariationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold"
                >
                  {product.variacoes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.tamanho} &bull; {v.cor_nome} {t.products.fittingRoomModal.physicalStockBadge(v.estoque)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tempo de Duração */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 15, label: t.products.fittingRoomModal.duration15m, desc: t.products.fittingRoomModal.duration15mDesc },
                { min: 30, label: t.products.fittingRoomModal.duration30m, desc: t.products.fittingRoomModal.duration30mDesc },
                { min: 60, label: t.products.fittingRoomModal.duration60m, desc: t.products.fittingRoomModal.duration60mDesc }
              ].map((tItem) => (
                <button
                  key={tItem.min}
                  type="button"
                  onClick={() => setDuracaoMinutos(tItem.min)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    duracaoMinutos === tItem.min
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs block">{tItem.label}</span>
                  <span className="text-[9px] text-slate-400">{tItem.desc}</span>
                </button>
              ))}
            </div>

            {/* Motivo da Reserva */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.products.fittingRoomModal.reasonLabel}</label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              >
                <option value="provador">{t.products.fittingRoomModal.reasonStoreFitting}</option>
                <option value="whatsapp_pix">{t.products.fittingRoomModal.reasonWhatsappPix}</option>
                <option value="condicional">{t.products.fittingRoomModal.reasonVipConditional}</option>
              </select>
            </div>

            {/* Dados da Cliente (Opcional) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">{t.products.fittingRoomModal.customerNameLabel}</label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder={t.products.fittingRoomModal.customerNamePlaceholder}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">{t.products.fittingRoomModal.customerWhatsappLabel}</label>
                <input
                  type="text"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder={t.products.fittingRoomModal.customerWhatsappPlaceholder}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.products.fittingRoomModal.closeBtn}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{loading ? t.products.fittingRoomModal.lockingBtn : t.products.fittingRoomModal.reserveBtn(duracaoMinutos)}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
