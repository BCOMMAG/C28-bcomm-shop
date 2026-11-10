'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Crown,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  Lock,
  ShieldAlert
} from 'lucide-react';
import {
  SuperAdminUser,
  getAllSuperAdminUsers,
  createSuperAdminUser,
  updateSuperAdminUser,
  deleteSuperAdminUser,
  toggleSuperAdminStatus,
  SUPER_ADMIN_ROOT_EMAIL
} from '@/lib/super-admin-users';

export default function SuperAdminAcessosPage() {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SuperAdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SuperAdminUser | null>(null);

  // Formulário de Criação
  const [createNome, setCreateNome] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createSenha, setCreateSenha] = useState('');
  const [createCargo, setCreateCargo] = useState('super_admin');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Formulário de Edição
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editCargo, setEditCargo] = useState('super_admin');
  const [editAtivo, setEditAtivo] = useState(true);
  const [showEditPass, setShowEditPass] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllSuperAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenEdit = (user: SuperAdminUser) => {
    setUserToEdit(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditCargo(user.cargo);
    setEditAtivo(user.ativo);
    setEditSenha('');
    setShowEditPass(false);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNome.trim() || !createEmail.trim() || !createSenha.trim()) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (createSenha.length < 6) {
      showToast('A senha deve conter no mínimo 6 caracteres.', 'error');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await createSuperAdminUser({
        nome: createNome,
        email: createEmail,
        senha: createSenha,
        cargo: createCargo
      });

      if (res.success && res.data) {
        showToast(`Administrador "${res.data.nome}" criado com sucesso!`);
        setIsCreateOpen(false);
        setCreateNome('');
        setCreateEmail('');
        setCreateSenha('');
        setCreateCargo('super_admin');
        await loadUsers();
      } else {
        showToast(res.error || 'Erro ao criar usuário.', 'error');
      }
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setSubmittingEdit(true);
    try {
      const res = await updateSuperAdminUser(userToEdit.id, {
        nome: editNome,
        email: editEmail,
        cargo: editCargo,
        ativo: editAtivo,
        senha: editSenha.trim() ? editSenha.trim() : undefined
      });

      if (res.success) {
        showToast(`Dados de "${editNome}" atualizados com sucesso!`);
        setIsEditOpen(false);
        setUserToEdit(null);
        await loadUsers();
      } else {
        showToast(res.error || 'Erro ao atualizar usuário.', 'error');
      }
    } catch {
      showToast('Falha ao atualizar dados.', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (user: SuperAdminUser) => {
    if (user.is_root) {
      showToast('O acesso Master Root do Dono não pode ser desativado.', 'error');
      return;
    }

    const nextState = !user.ativo;
    const res = await toggleSuperAdminStatus(user.id, nextState);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ativo: nextState } : u))
      );
      showToast(
        nextState
          ? `Acesso de "${user.nome}" ativado com sucesso!`
          : `Acesso de "${user.nome}" pausado.`
      );
    } else {
      showToast(res.error || 'Erro ao alterar status.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await deleteSuperAdminUser(userToDelete.id);
      if (res.success) {
        showToast(`Acesso de "${userToDelete.nome}" removido do Super Admin.`);
        setUserToDelete(null);
        await loadUsers();
      } else {
        showToast(res.error || 'Erro ao excluir usuário.', 'error');
      }
    } catch {
      showToast('Falha ao excluir.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.cargo.toLowerCase().includes(term)
    );
  });

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'super_admin':
        return 'Super Administrador';
      case 'suporte':
        return 'Operador de Suporte';
      case 'tecnico':
        return 'Engenharia / Infra';
      case 'financeiro':
        return 'Auditoria Financeira';
      default:
        return cargo;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOAST FLUTUANTE */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl rounded-lg animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gestão de Acessos Super Admin
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Gerenciamento central de operadores, suporte técnico e credenciais com acesso total à infraestrutura SaaS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Acesso Super Admin</span>
        </button>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11141E] p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total de Administradores
          </span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">
            {users.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Credenciais cadastradas na plataforma
          </span>
        </div>

        <div className="bg-[#11141E] p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Acessos Ativos
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
            {users.filter((u) => u.ativo).length}
          </span>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            Com permissão de login no console
          </span>
        </div>

        <div className="bg-[#11141E] p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Acessos Pausados
          </span>
          <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
            {users.filter((u) => !u.ativo).length}
          </span>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            Bloqueados temporariamente
          </span>
        </div>

        <div className="bg-[#11141E] p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-[#11141E] to-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Dono Master Root
            </span>
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-mono font-bold text-white mt-1 block truncate">
            {SUPER_ADMIN_ROOT_EMAIL}
          </span>
          <span className="text-[10px] text-amber-300/80 mt-1 block">
            Acesso permanente e intocável
          </span>
        </div>
      </div>

      {/* BARRA DE FILTRO E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#11141E] p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo..."
            className="w-full bg-[#0C0E14] text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500 font-sans"
          />
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
          title="Recarregar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* LISTAGEM DE USUÁRIOS */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs">Carregando acessos do Super Admin...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-[#11141E] rounded-2xl border border-slate-800">
          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Nenhum administrador encontrado.</p>
          <p className="text-xs text-slate-600 mt-1">Refine o termo de busca ou adicione um novo operador.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isRoot = user.is_root || user.email === SUPER_ADMIN_ROOT_EMAIL;

            return (
              <div
                key={user.id}
                className={`bg-[#11141E] p-4 sm:p-5 rounded-xl border transition-all ${
                  isRoot
                    ? 'border-amber-500/40 shadow-sm shadow-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Identidade e Informações do Operador */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                        isRoot
                          ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-sky-300 border border-slate-700'
                      }`}
                    >
                      {isRoot ? <Crown className="w-5 h-5 text-slate-950" /> : user.nome.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {user.nome}
                        </span>

                        {isRoot ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Master Root (Dono)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800">
                            {getCargoLabel(user.cargo)}
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            user.ativo
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {user.ativo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {user.ativo ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-3 mt-1 text-xs text-slate-400">
                        <span className="font-mono text-slate-300">{user.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {user.ultimo_acesso
                            ? `Último acesso: ${new Date(user.ultimo_acesso).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : 'Nunca acessou'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    {/* Botão de Toggle Ativo / Pausado */}
                    {!isRoot && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          user.ativo
                            ? 'bg-emerald-950/40 hover:bg-rose-950/60 text-emerald-300 hover:text-rose-300 border-emerald-800 hover:border-rose-800'
                            : 'bg-rose-950/60 hover:bg-emerald-950/60 text-rose-300 hover:text-emerald-300 border-rose-800 hover:border-emerald-800'
                        }`}
                        title={user.ativo ? 'Pausar acesso deste operador' : 'Ativar acesso deste operador'}
                      >
                        {user.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    )}

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={isRoot ? 'Alterar senha do Master Root' : 'Editar dados e senha'}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isRoot ? 'Redefinir Senha' : 'Editar'}</span>
                    </button>

                    {/* Botão Excluir */}
                    {!isRoot && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900"
                        title="Excluir operador permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR NOVO ADMINISTRADOR */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11141E] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Criar Novo Acesso Super Admin</h3>
                <p className="text-xs text-slate-400">Cadastre um operador com privilégios de plataforma.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Operador:
                </label>
                <input
                  type="text"
                  required
                  value={createNome}
                  onChange={(e) => setCreateNome(e.target.value)}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Login:
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="carlos@bcomm.shop"
                  className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha Inicial de Acesso:
                </label>
                <div className="relative">
                  <input
                    type={showCreatePass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={createSenha}
                    onChange={(e) => setCreateSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#0C0E14] text-xs text-white pl-3 pr-9 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass(!showCreatePass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCreatePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nível / Função do Acesso:
                </label>
                <select
                  value={createCargo}
                  onChange={(e) => setCreateCargo(e.target.value)}
                  className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="super_admin">Super Administrador (Acesso Total)</option>
                  <option value="suporte">Operador de Suporte SaaS</option>
                  <option value="tecnico">Engenharia & Infraestrutura</option>
                  <option value="financeiro">Auditoria Financeira SaaS</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{submittingCreate ? 'Criando...' : 'Salvar Acesso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ADMINISTRADOR */}
      {isEditOpen && userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11141E] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Edit2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">
                  {userToEdit.is_root ? 'Gerenciar Master Root' : 'Editar Acesso Super Admin'}
                </h3>
                <p className="text-xs text-slate-400">
                  {userToEdit.is_root ? 'Redefina a senha oficial do Dono da Plataforma.' : 'Altere informações ou redefina a senha.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Operador:
                </label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Login:
                </label>
                <input
                  type="email"
                  required
                  disabled={userToEdit.is_root}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 font-sans disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {userToEdit.is_root && (
                  <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    O e-mail Master Root é fixo no sistema.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nova Senha (opcional):
                </label>
                <div className="relative">
                  <input
                    type={showEditPass ? 'text' : 'password'}
                    minLength={6}
                    value={editSenha}
                    onChange={(e) => setEditSenha(e.target.value)}
                    placeholder="Deixe em branco para manter a atual"
                    className="w-full bg-[#0C0E14] text-xs text-white pl-3 pr-9 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!userToEdit.is_root && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nível / Função:
                    </label>
                    <select
                      value={editCargo}
                      onChange={(e) => setEditCargo(e.target.value)}
                      className="w-full bg-[#0C0E14] text-xs text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      <option value="super_admin">Super Administrador (Acesso Total)</option>
                      <option value="suporte">Operador de Suporte SaaS</option>
                      <option value="tecnico">Engenharia & Infraestrutura</option>
                      <option value="financeiro">Auditoria Financeira SaaS</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editAtivoCheckbox"
                      checked={editAtivo}
                      onChange={(e) => setEditAtivo(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 bg-[#0C0E14] border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="editAtivoCheckbox" className="text-xs text-slate-300 cursor-pointer select-none">
                      Acesso liberado (Operador ativo no console)
                    </label>
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>{submittingEdit ? 'Salvando...' : 'Atualizar Dados'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11141E] border border-rose-800/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">Excluir Acesso Super Admin</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Tem certeza que deseja revogar permanentemente o acesso de{' '}
              <strong className="text-white">{userToDelete.nome}</strong> ({userToDelete.email})?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

