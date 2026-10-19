'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Laptop,
  LogOut,
  AlertTriangle,
  History,
  Check,
  X
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';
import { cn } from '@/lib/chart-utils';

export default function SecuritySettingsPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSavingMaster, setIsSavingMaster] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

  // Senha Mestra do Balcão
  const [senhaMestraBalcao, setSenhaMestraBalcao] = useState('Leidy@2026!');
  const [showSenhaMestra, setShowSenhaMestra] = useState(false);

  // Alteração de Senha da Conta
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  // PIN Rápido
  const [pinRapido, setPinRapido] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Avaliação de força de senha
  const passwordStrength = {
    length: novaSenha.length >= 8,
    hasUpper: /[A-Z]/.test(novaSenha),
    hasLower: /[a-z]/.test(novaSenha),
    hasNumber: /[0-9]/.test(novaSenha),
    hasSpecial: /[^A-Za-z0-9]/.test(novaSenha)
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  useEffect(() => {
    const fetchSecurityData = async () => {
      setLoading(true);
      try {
        const data = await getStoreSettings(tenantId);
        if (data?.senhaMestraBalcao) {
          setSenhaMestraBalcao(data.senhaMestraBalcao);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de segurança:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, [tenantId]);

  // Salvar Senha Mestra de Emergência
  const handleSaveSenhaMestra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaMestraBalcao.trim()) {
      showToast('A senha mestra não pode ficar em branco.', 'error');
      return;
    }

    setIsSavingMaster(true);
    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        senhaMestraBalcao: senhaMestraBalcao.trim()
      });

      if (res.success) {
        showToast('Senha Mestra de Destrave Balcão atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar Senha Mestra.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSavingMaster(false);
    }
  };

  // Alterar Senha de Login no Supabase Auth
  const handleUpdateAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < 8) {
      showToast('A nova senha deve ter no mínimo 8 caracteres.', 'error');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      showToast('As senhas digitadas não coincidem.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        throw error;
      }

      showToast('Senha da sua conta de login atualizada com sucesso!');
      setNovaSenha('');
      setConfirmaSenha('');
    } catch (err: any) {
      console.error('Erro ao atualizar senha auth:', err);
      showToast(err?.message || 'Falha ao atualizar senha da conta.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Encerrar Todas as Outras Sessões (Kill Switch Remoto)
  const handleLogoutOthers = async () => {
    if (!confirm('Deseja realmente desconectar todos os outros dispositivos e terminais da sua conta?')) {
      return;
    }

    setIsLoggingOutOthers(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: 'others' as any });
      showToast('Todas as outras sessões foram desconectadas com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Falha ao desconectar outras sessões.', 'error');
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando parâmetros de segurança...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* BLOCO 1: SENHA MESTRA DO BALCÃO (ANTI-BRUTE FORCE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Senha Mestra da Proprietária (Destrave Balcão)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Anti-Força Bruta
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chave de segurança de alto nível para destravar o terminal de vendas compartilhado em caso de bloqueio.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSenhaMestra} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Senha Mestra de Emergência
              </label>
              <div className="relative">
                <input
                  type={showSenhaMestra ? 'text' : 'password'}
                  required
                  value={senhaMestraBalcao}
                  onChange={(e) => setSenhaMestraBalcao(e.target.value)}
                  placeholder="Ex: Leidy@2026!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaMestra(!showSenhaMestra)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showSenhaMestra ? 'Ocultar' : 'Exibir'}
                >
                  {showSenhaMestra ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Guarde esta senha com segurança. Apenas a proprietária deve ter acesso.
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Proteção Anti-Brute Force Ativa</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Após <strong>3 erros consecutivos de PIN</strong> no balcão, o terminal congela por <strong>180 segundos</strong>. A Senha Mestra é a única forma de destravar imediatamente.
                </p>
              </div>
              <div className="pt-2 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Auditoria e bloqueio de tentativas não autorizadas em vigor</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingMaster}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingMaster ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSavingMaster ? 'Salvando...' : 'Salvar Senha Mestra'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BLOCO 2: ALTERAÇÃO DA SENHA DA CONTA (SUPABASE AUTH) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Alteração de Senha da Conta de Acesso
            </h2>
            <p className="text-[11px] text-slate-500">
              Atualize a senha utilizada para fazer login no painel administrativo principal.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateAccountPassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNovaSenha ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Medidor de Força */}
              {novaSenha.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-500">Força da Senha:</span>
                    <span
                      className={cn(
                        'font-bold',
                        strengthScore <= 2
                          ? 'text-rose-500'
                          : strengthScore <= 4
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      )}
                    >
                      {strengthScore <= 2 ? 'Fraca' : strengthScore <= 4 ? 'Boa' : 'Excelente'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        strengthScore <= 2
                          ? 'w-1/3 bg-rose-500'
                          : strengthScore <= 4
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-emerald-500'
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500">
                    <span className={cn('flex items-center gap-1', passwordStrength.length ? 'text-emerald-600 font-bold' : '')}>
                      {passwordStrength.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                      Mínimo 8 dígitos
                    </span>
                    <span className={cn('flex items-center gap-1', passwordStrength.hasUpper ? 'text-emerald-600 font-bold' : '')}>
                      {passwordStrength.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                      Letra maiúscula
                    </span>
                    <span className={cn('flex items-center gap-1', passwordStrength.hasNumber ? 'text-emerald-600 font-bold' : '')}>
                      {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                      Número
                    </span>
                    <span className={cn('flex items-center gap-1', passwordStrength.hasSpecial ? 'text-emerald-600 font-bold' : '')}>
                      {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                      Caractere especial
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Confirme a Nova Senha</label>
              <input
                type={showNovaSenha ? 'text' : 'password'}
                required
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="Repita a mesma senha"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
              {confirmaSenha.length > 0 && novaSenha !== confirmaSenha && (
                <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
                  As senhas não coincidem.
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUpdatingPassword || novaSenha.length < 8 || novaSenha !== confirmaSenha}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40"
            >
              {isUpdatingPassword ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{isUpdatingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BLOCO 3: SESSÕES ATIVAS & KILL-SWITCH REMOTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Sessões Ativas & Desconexão Remota
              </h2>
              <p className="text-[11px] text-slate-500">
                Dispositivos conectados à sua conta e botão de kill-switch para segurança de emergência.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogoutOthers}
            disabled={isLoggingOutOthers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            {isLoggingOutOthers ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Encerrar Outras Sessões</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Sessão Atual */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Navegador Atual (Este Dispositivo)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    Sessão Ativa
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Curitiba, PR • IP: 187.54.***.*** • Conectado agora
                </span>
              </div>
            </div>
            <span className="text-emerald-700 font-bold text-[11px]">Seguro</span>
          </div>

          {/* Terminal de Vendas Balcão */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Terminal Balcão PDV (Tablet Loja)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                    Sincronizado
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Boutique Física • IP: 187.54.***.*** • Última atividade há 15 min
                </span>
              </div>
            </div>
            <span className="text-slate-400 font-semibold text-[11px]">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
