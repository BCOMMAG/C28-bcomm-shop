'use client';

import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { MembroEquipe, adminResetMemberPassword } from '@/lib/team';

interface ResetMemberPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MembroEquipe;
  lojaId: string;
  operadorEmail: string;
  operadorCargo?: string;
  isMaster?: boolean;
  onSuccess?: () => void;
}

export function ResetMemberPasswordModal({
  isOpen,
  onClose,
  member,
  lojaId,
  operadorEmail,
  operadorCargo = 'dono',
  isMaster = false,
  onSuccess
}: ResetMemberPasswordModalProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  if (!isOpen) return null;

  // Validação de Hierarquia & Imunidade
  const isTargetOwner = member.cargo === 'dono';
  const isOperatorOwnerOrMaster = isMaster || operadorCargo.toLowerCase() === 'dono';
  const isSelfManager = operadorCargo.toLowerCase() === 'gerente' && operadorEmail.toLowerCase() === member.email.toLowerCase();

  // Imunidade absoluta: Gerente ou atendente NÃO pode redefinir senha do dono
  const isBlockedByOwnerImmunity = isTargetOwner && !isOperatorOwnerOrMaster;

  // Gerente não pode redefinir sua própria senha diretamente (apenas recuperação por e-mail)
  const isBlockedSelfManager = isSelfManager;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNovaSenha(pwd);
    setShowPassword(true);
  };

  const handleCopy = (text: string, isCurrent: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isCurrent) {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlockedByOwnerImmunity || isBlockedSelfManager) return;

    if (!novaSenha || novaSenha.trim().length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await adminResetMemberPassword(
        lojaId,
        member.id,
        novaSenha.trim(),
        operadorEmail
      );

      if (res.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'Erro ao redefinir a senha do colaborador.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200/70">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Gerenciar Senha de Acesso</h2>
              <p className="text-xs text-slate-500">Alteração administrativa direta com Kill-Switch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações do Colaborador */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {member.nome.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{member.nome}</span>
                {member.cargo === 'dono' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Proprietária
                  </span>
                )}
                {member.cargo === 'gerente' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                    Gerente
                  </span>
                )}
                {member.cargo === 'atendente' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    Atendente
                  </span>
                )}
                {member.cargo === 'estoquista' && (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                    Estoquista
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
            </div>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Senha Alterada com Sucesso!</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                A nova senha foi cadastrada no sistema. O Kill-Switch encerrou automaticamente todas as sessões anteriores de <strong>{member.nome}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>E-mail:</span>
                <strong className="text-slate-900">{member.email}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Nova Senha:</span>
                <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded text-sm select-all">
                  {novaSenha}
                </strong>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `Credenciais atualizadas do painel:\nE-mail: ${member.email}\nSenha: ${novaSenha}\nAcesse em: https://bcomm-ag.space/admin/login`
                  )
                }
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado para Área de Transferência!' : 'Copiar Credenciais'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Alteração */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Alerta de Imunidade Absoluta da Proprietária */}
            {isBlockedByOwnerImmunity && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-950">Imunidade da Proprietária</p>
                  <p className="mt-0.5 text-amber-800">
                    O acesso da Proprietária possui proteção máxima no sistema. Gerentes e outros colaboradores não possuem autorização para alterar a senha da dona.
                  </p>
                </div>
              </div>
            )}

            {/* Alerta de Restrição do Gerente para si próprio */}
            {isBlockedSelfManager && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-blue-950">Segurança de Acesso do Gerente</p>
                  <p className="mt-0.5 text-blue-800">
                    Por conformidade de segurança contra alterações locais não autorizadas, a sua própria senha de gerente deve ser redefinida mediante a recuperação segura por e-mail na tela de login.
                  </p>
                </div>
              </div>
            )}

            {/* SEÇÃO EXCLUSIVA DE VISUALIZAÇÃO DE SENHA ATUAL: Proprietário e Dono do Sistema (Master) */}
            {isOperatorOwnerOrMaster && !isBlockedByOwnerImmunity && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Senha de Acesso Atual</span>
                    <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Visível apenas para Proprietária & Master
                    </span>
                  </div>
                  {member.senha_acesso && (
                    <button
                      type="button"
                      onClick={() => handleCopy(member.senha_acesso!, true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCurrent ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCurrent ? 'Copiada!' : 'Copiar'}</span>
                    </button>
                  )}
                </div>

                {member.senha_acesso ? (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-mono text-xs font-bold text-slate-900 select-all tracking-wider">
                      {showCurrentPassword ? member.senha_acesso : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors p-1"
                      title={showCurrentPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Nenhuma senha foi gravada anteriormente para este colaborador. Defina uma nova senha abaixo.
                  </p>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isBlockedByOwnerImmunity && !isBlockedSelfManager && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Nova Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Gerar Senha Segura
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O colaborador usará esta senha junto ao e-mail para fazer login no painel administrativo.
                  </p>
                </div>

                {/* Kill Switch Warning Callout */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 leading-relaxed">
                    <strong className="font-bold">Kill-Switch Instantâneo Ativado:</strong> Ao salvar, qualquer sessão ativa em navegadores ou celulares deste colaborador será imediatamente encerrada, impedindo novos acessos com a senha antiga.
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !novaSenha || novaSenha.length < 6}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando & Encerrando Sessões...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Salvar Senha & Derrubar Sessões</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {(isBlockedByOwnerImmunity || isBlockedSelfManager) && (
              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
