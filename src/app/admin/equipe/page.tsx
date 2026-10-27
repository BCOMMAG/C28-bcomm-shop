'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Clock,
  Percent,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Lock,
  Unlock,
  Key,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  PowerOff,
  History,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
  Ban
} from 'lucide-react';
import {
  MembroEquipe,
  CargoColaborador,
  getTeamMembers,
  toggleTeamMemberActive,
  revokeAllSessions,
  checkWorkingHoursAccess
} from '@/lib/team';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { useStore } from '@/context/StoreContext';
import { InviteMemberModal } from '@/components/admin/team/InviteMemberModal';
import { EditMemberModal } from '@/components/admin/team/EditMemberModal';
import { LockScreenModal } from '@/components/admin/team/LockScreenModal';

export default function AdminEquipePage() {
  const { currentTenant } = useStore();
  const lojaId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [members, setMembers] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCargo, setFilterCargo] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLockScreenOpen, setIsLockScreenOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MembroEquipe | null>(null);

  // Feedbacks
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembers(lojaId);
      setMembers(data);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [lojaId]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleToggleActive = async (member: MembroEquipe) => {
    const newStatus = !member.ativo;
    const ok = await toggleTeamMemberActive(lojaId, member.id, newStatus, 'Leidyane Cristina');
    if (ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, ativo: newStatus } : m))
      );
      showFeedback(
        'success',
        newStatus ? `Acesso de ${member.nome} reativado.` : `Acesso de ${member.nome} suspenso e sessões revogadas.`
      );
    } else {
      showFeedback('error', 'Falha ao alterar status do colaborador.');
    }
  };

  const handleRevokeSessions = async (member: MembroEquipe) => {
    const ok = await revokeAllSessions(lojaId, member.id, 'Leidyane Cristina');
    if (ok) {
      showFeedback('success', `Kill-Switch acionado! Todas as sessões ativas de ${member.nome} foram desconectadas.`);
    } else {
      showFeedback('error', 'Falha ao revogar sessões.');
    }
  };

  const getWhatsAppInviteUrl = (member: MembroEquipe) => {
    const cleanPhone = member.telefone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const primeiroNome = member.nome.split(' ')[0];
    const panelUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : 'https://bcomm-shop.pages.dev/admin/login';
    const msg = encodeURIComponent(
      `Olá ${primeiroNome}! Seu acesso ao Painel da Leidy Boutique está configurado como ${member.cargo.toUpperCase()}.\n\nSeu PIN rápido de balcão é: *${member.pin_hash}*\n\nLink do painel: ${panelUrl}`
    );
    return `https://wa.me/${phoneWithDDI}?text=${msg}`;
  };

  // Filtros
  const filteredMembers = members.filter((m) => {
    const matchesCargo = filterCargo === 'todos' || m.cargo === filterCargo;
    const matchesSearch =
      m.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.codigo_vendedora && m.codigo_vendedora.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCargo && matchesSearch;
  });

  // Métricas agregadas
  const totalMembrosAtivos = members.filter((m) => m.ativo).length;
  const totalVendasMes = members.reduce((acc, m) => acc + (m.total_vendas_mes || 0), 0);
  const totalComissoesMes = members.reduce((acc, m) => acc + (m.comissao_acumulada_mes || 0), 0);

  const getCargoBadge = (cargo: CargoColaborador) => {
    switch (cargo) {
      case 'dono':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
            👑 Proprietário
          </span>
        );
      case 'gerente':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
            👔 Gerente
          </span>
        );
      case 'atendente':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
            💬 Atendente / Vendas
          </span>
        );
      case 'estoquista':
        return (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-900 border border-orange-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
            📦 Estoque & Expedição
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Alerta de Feedback Flutuante */}
      {actionFeedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
              : 'bg-rose-950 text-rose-100 border-rose-500/50'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Topo / Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Governança & Controle de Acesso (RBAC)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-luxury text-slate-900 tracking-tight">
            Gestão de Equipe & Colaboradores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina alçadas de desconto comercial, horários de expediente legal (CLT) e comissões individuais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Bloquear Balcão */}
          <button
            type="button"
            onClick={() => setIsLockScreenOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Bloquear a tela e alternar colaboradora via PIN"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Balcão (PIN)</span>
          </button>

          {/* Botão Ver Trilha de Auditoria */}
          <Link
            href="/admin/equipe/auditoria/"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors shadow-2xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Trilha de Auditoria</span>
          </Link>

          {/* Botão Gerenciar Senha Mestra */}
          <Link
            href="/admin/configuracoes/"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs rounded-xl transition-colors shadow-2xs"
            title="Gerenciar a Senha Mestra da Dona para destrave de emergência do balcão"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Senha Mestra</span>
          </Link>

          {/* Botão Convidar Colaborador */}
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Convidar Colaborador</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Indicadores da Equipe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Membros Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Colaboradores Ativos</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalMembrosAtivos}</span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{members.length} membros cadastrados</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Vendas Atribuídas no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Vendas Atribuídas à Equipe</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendasMes)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Em pedidos vinculados a vendedoras
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Comissões Acumuladas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Comissões Acumuladas (Mês)</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComissoesMes)}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              Com abatimento de devoluções
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Governança Trabalhista & CLT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Segurança Jurídica CLT</span>
            <span className="text-base font-bold text-slate-900 mt-1 block text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Art. 244 Ativado</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Bloqueio automático fora do turno
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Abas de Cargos */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'dono', label: 'Proprietários' },
            { id: 'gerente', label: 'Gerência' },
            { id: 'atendente', label: 'Atendentes' },
            { id: 'estoquista', label: 'Estoque' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCargo(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCargo === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email ou código..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-600"
          />
        </div>
      </div>

      {/* Tabela de Membros da Equipe */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Carregando membros da equipe...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nenhum colaborador encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Cargo & Alçada</th>
                  <th className="py-3.5 px-4">Vendas & Metas</th>
                  <th className="py-3.5 px-4">Horário / CLT</th>
                  <th className="py-3.5 px-4">PIN Balcão</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.map((member) => {
                  const hoursCheck = checkWorkingHoursAccess(member);
                  const metaAtingida =
                    member.meta_vendas_mensal > 0
                      ? Math.min(100, Math.round(((member.total_vendas_mes || 0) / member.meta_vendas_mensal) * 100))
                      : 0;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Colaborador */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                            {member.nome.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{member.nome}</span>
                            <span className="text-[11px] text-slate-500 block truncate">{member.email}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>{member.telefone}</span>
                              {member.codigo_vendedora && (
                                <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded">
                                  ref={member.codigo_vendedora}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Cargo & Alçada */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {getCargoBadge(member.cargo)}
                          <div className="text-[11px] text-slate-600">
                            Desconto Máx:{' '}
                            <strong className="text-emerald-700">
                              {member.alcada_desconto_percentual >= 100
                                ? 'Irrestrito'
                                : `Até ${member.alcada_desconto_percentual}%`}
                            </strong>
                          </div>
                          {member.comissao_percentual > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Comissão: <strong>{member.comissao_percentual}%</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Vendas & Metas */}
                      <td className="py-4 px-4">
                        {member.cargo === 'atendente' || member.cargo === 'gerente' ? (
                          <div className="space-y-1 min-w-[150px]">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-slate-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  member.total_vendas_mes || 0
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">{metaAtingida}% da meta</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${metaAtingida}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(member.meta_vendas_mensal)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 4. Horário / CLT */}
                      <td className="py-4 px-4">
                        {member.horario_restrito ? (
                          <div className="space-y-1">
                            <span className="font-mono text-[11px] text-slate-700 block">
                              {member.horario_inicio?.substring(0, 5)} às {member.horario_fim?.substring(0, 5)}
                            </span>
                            {hoursCheck.permitido ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>No Expediente</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span>Fora de Turno (CLT)</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Horário Livre</span>
                          </span>
                        )}
                      </td>

                      {/* 5. PIN Balcão */}
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg text-xs tracking-widest border border-amber-200">
                          {member.pin_hash || '••••'}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="py-4 px-4">
                        {member.ativo ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                            <Ban className="w-3 h-3" />
                            <span>Suspenso</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Ações */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Enviar WhatsApp */}
                          <a
                            href={getWhatsAppInviteUrl(member)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Disparar dados de acesso no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {/* Editar Permissões */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar permissões e alçada"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Kill Switch (Desconectar Sessões) */}
                          <button
                            type="button"
                            onClick={() => handleRevokeSessions(member)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Desconectar todas as sessões ativas (Kill-Switch)"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>

                          {/* Suspender / Reativar */}
                          {member.cargo !== 'dono' && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(member)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                member.ativo
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={member.ativo ? 'Suspender acesso' : 'Reativar acesso'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais Integrados */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        lojaId={lojaId}
        onMemberCreated={(newMember) => {
          setMembers((prev) => [...prev, newMember]);
          showFeedback('success', `Colaborador ${newMember.nome} cadastrado com sucesso!`);
        }}
      />

      {selectedMember && (
        <EditMemberModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedMember(null);
          }}
          lojaId={lojaId}
          member={selectedMember}
          onMemberUpdated={(updated) => {
            setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            showFeedback('success', `Permissões de ${updated.nome} atualizadas.`);
          }}
        />
      )}

      <LockScreenModal
        isOpen={isLockScreenOpen}
        onClose={() => setIsLockScreenOpen(false)}
        members={members}
        lojaId={lojaId}
        onUserSwitched={(switchedMember) => {
          showFeedback('success', `Atendimento balcão alternado para ${switchedMember.nome}!`);
        }}
        onFullLogout={() => {
          localStorage.removeItem('leidy_admin_auth');
          localStorage.removeItem('leidy_admin_user');
          localStorage.removeItem('leidy_admin_colaborador');
          window.location.href = '/admin/login/';
        }}
      />
    </div>
  );
}
