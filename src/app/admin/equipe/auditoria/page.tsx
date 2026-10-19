'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Package,
  ShoppingBag,
  Tag,
  Key,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { RegistroAuditoria, getStoreAuditLogs } from '@/lib/team';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { useStore } from '@/context/StoreContext';

export default function AdminAuditoriaPage() {
  const { currentTenant } = useStore();
  const lojaId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [logs, setLogs] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntidade, setSelectedEntidade] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiffModal, setActiveDiffModal] = useState<RegistroAuditoria | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const data = await getStoreAuditLogs(lojaId, 100);
        setLogs(data);
      } catch (err) {
        console.error('Erro ao carregar auditoria:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [lojaId]);

  const filteredLogs = logs.filter((log) => {
    const matchesEntidade = selectedEntidade === 'todos' || log.entidade === selectedEntidade;
    const matchesSearch =
      log.colaborador_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.motivo && log.motivo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesEntidade && matchesSearch;
  });

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'ativou_governanca':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">🏛️ Ativação de Governança</span>;
      case 'ajustou_estoque':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">📦 Ajuste de Estoque</span>;
      case 'concedeu_desconto':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">🏷️ Desconto Comercial</span>;
      case 'alterou_preco':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">💲 Alteração de Preço</span>;
      case 'convidou_colaborador':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">👤 Novo Colaborador</span>;
      case 'atualizou_colaborador':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">⚙️ Alteração de Permissões</span>;
      case 'revogou_sessoes':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">🚫 Kill-Switch Sessões</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{acao}</span>;
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Topo / Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/equipe/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Equipe</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold">Trilha de Auditoria</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-luxury text-slate-900 tracking-tight">
            Trilha de Auditoria & Governança da Loja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as ações de colaboradores, aprovações de descontos e ajustes operacionais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>Auditoria Criptografada Ativa</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos os Eventos' },
            { id: 'produtos', label: 'Catálogo & Estoque' },
            { id: 'pedidos', label: 'Pedidos & Vendas' },
            { id: 'equipe', label: 'Equipe & Acessos' },
            { id: 'cupons', label: 'Cupons' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedEntidade(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedEntidade === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por colaborador, ação ou motivo..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Lista Estilo Feed de Eventos de Auditoria */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Carregando trilha de eventos...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nenhum registro de auditoria encontrado para o filtro aplicado.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 mt-0.5">
                    {log.colaborador_nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{log.colaborador_nome}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({log.cargo.toUpperCase()})</span>
                      {getAcaoBadge(log.acao)}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {log.entidade}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      {log.motivo || `Ação ${log.acao} executada sobre ${log.entidade}`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDateTime(log.created_at)}</span>
                      </span>
                      {log.entidade_id && (
                        <span>
                          Alvo: <strong className="text-slate-600 font-mono">{log.entidade_id}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Ver Detalhes / Diffs */}
                {(log.dados_anteriores || log.dados_novos) && (
                  <button
                    onClick={() => setActiveDiffModal(log)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Diffs</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Evento / Diffs */}
      {activeDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detalhes do Evento de Auditoria</h3>
                <p className="text-xs text-slate-500">
                  {activeDiffModal.colaborador_nome} &bull; {formatDateTime(activeDiffModal.created_at)}
                </p>
              </div>
              <button
                onClick={() => setActiveDiffModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Ação:</span> <strong className="text-slate-800">{activeDiffModal.acao}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Entidade:</span> <strong className="text-slate-800">{activeDiffModal.entidade} ({activeDiffModal.entidade_id})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Motivo:</span> <strong className="text-slate-800">{activeDiffModal.motivo}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Dados Anteriores */}
                <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-3">
                  <span className="font-bold text-rose-800 block mb-2">⬅️ Dados Anteriores</span>
                  <pre className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 overflow-x-auto">
                    {JSON.stringify(activeDiffModal.dados_anteriores || {}, null, 2)}
                  </pre>
                </div>

                {/* Dados Novos */}
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3">
                  <span className="font-bold text-emerald-800 block mb-2">➡️ Dados Novos</span>
                  <pre className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-100 overflow-x-auto">
                    {JSON.stringify(activeDiffModal.dados_novos || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right border-t border-slate-100">
              <button
                onClick={() => setActiveDiffModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
