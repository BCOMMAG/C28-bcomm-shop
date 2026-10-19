'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  MessageCircle,
  CheckCircle2,
  Clock,
  User,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AdminProductItem } from '@/lib/admin';
import {
  AviseMeLead,
  getAviseMeLeads,
  markAviseMeLeadNotified,
  deleteAviseMeLead
} from '@/lib/aviseme';

interface ProductWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProductItem | null;
  lojaId: string;
  onListUpdated?: () => void;
}

export function ProductWaitlistModal({
  isOpen,
  onClose,
  product,
  lojaId,
  onListUpdated
}: ProductWaitlistModalProps) {
  const [leads, setLeads] = useState<AviseMeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pendente' | 'notificado' | 'todos'>('pendente');

  const fetchLeads = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const all = await getAviseMeLeads(lojaId, filterStatus);
      const filtered = all.filter((l) => l.produto_id === product.id);
      setLeads(filtered);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchLeads();
    }
  }, [isOpen, product, filterStatus]);

  if (!isOpen || !product) return null;

  const handleMarkNotified = async (leadId: string) => {
    const ok = await markAviseMeLeadNotified(leadId);
    if (ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: 'notificado' } : l))
      );
      if (onListUpdated) onListUpdated();
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Deseja remover esta cliente da fila de espera?')) return;
    const ok = await deleteAviseMeLead(leadId);
    if (ok) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (onListUpdated) onListUpdated();
    }
  };

  const getWhatsAppNotifyUrl = (lead: AviseMeLead) => {
    const cleanPhone = lead.cliente_telefone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const primeiroNome = lead.cliente_nome.split(' ')[0];

    const msg = encodeURIComponent(
      `✨ Olá, ${primeiroNome}! Tudo bem com você? 🤍\n\n` +
      `Aqui é da Leidy Boutique! Temos uma ótima notícia: a peça *${product.nome}* no tamanho *${lead.variacao_tamanho}*${lead.variacao_cor ? ` (Cor: ${lead.variacao_cor})` : ''} que você estava aguardando acabou de ser reposta no nosso estoque!\n\n` +
      `Como temos poucas unidades neste lote, separei o link em primeira mão para você garantir antes que esgote:\n` +
      `👉 https://bcomm-shop.pages.dev/catalogo?produto=${product.id}\n\n` +
      `Se preferir que eu reserve para você ou queira tirar dúvidas de medidas, é só me avisar aqui! ✨`
    );

    return `https://wa.me/${phoneWithDDI}?text=${msg}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Fila de Espera: {product.nome}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {leads.length} Cadastrada(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Clientes que solicitaram aviso automático para reposição de tamanho
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('pendente')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'pendente'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Aguardando Reposição
            </button>
            <button
              onClick={() => setFilterStatus('notificado')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'notificado'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Já Notificadas
            </button>
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'todos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
          </div>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
              <span>Carregando fila de espera...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
              Nenhuma solicitação encontrada com o filtro selecionado.
            </div>
          ) : (
            leads.map((lead) => {
              const isNotified = lead.status === 'notificado';

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isNotified
                      ? 'bg-slate-50/70 border-slate-200 opacity-75'
                      : 'bg-white border-purple-200 shadow-2xs hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {lead.cliente_nome}
                      </span>
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                        Tam: {lead.variacao_tamanho}
                      </span>
                      {lead.variacao_cor && (
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.variacao_cor}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>WhatsApp: <strong className="text-slate-700">{lead.cliente_telefone}</strong></span>
                      {lead.cliente_email && <span>&bull; {lead.cliente_email}</span>}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Cadastrada em {formatDate(lead.created_at)}</span>
                      {isNotified && (
                        <span className="text-emerald-700 font-bold ml-2">
                          ✓ Notificada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={getWhatsAppNotifyUrl(lead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkNotified(lead.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Enviar mensagem personalizada avisando da reposição no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Avisar no WhatsApp</span>
                    </a>

                    {!isNotified && (
                      <button
                        type="button"
                        onClick={() => handleMarkNotified(lead.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Marcar como notificada manualmente"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            💡 Dica: Ao acionar a cliente pelo WhatsApp, o status é alterado automaticamente para &quot;Notificado&quot;.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
