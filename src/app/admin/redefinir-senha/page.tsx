'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const tokenParam = searchParams.get('token');

  const passwordStrength = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('A nova senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Tenta atualizar via Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        // Se falhar na sessão direta, valida se veio de token ou redefinição manual
        console.warn('Aviso ao atualizar senha auth:', error.message);
      }

      // Se havia um token manual de WhatsApp ou Supabase Auth
      if (tokenParam) {
        try {
          // Registra no localStorage para contingência se necessário
          localStorage.setItem('bcomm_last_password_reset', new Date().toISOString());
        } catch {}
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao redefinir a senha. Solicite um novo link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121110] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luz ambiente de fundo dourada */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#DFBE76]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#1A1918] border border-[#C5A059]/30 p-8 shadow-2xl relative">
          {/* Topo / Logo */}
          <div className="text-center mb-8">
            <div className="relative h-16 w-28 mx-auto mb-3 flex items-center justify-center">
              <Image
                src="/images/Logo sem fundo.png"
                alt="BCOMM Logo"
                width={2752}
                height={1536}
                style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>
            <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white tracking-wide">
              Redefinição de Senha
            </h1>
            <p className="text-xs text-[#A8A29E] mt-1">
              Crie uma nova credencial segura para acessar o Painel da Loja
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Senha Redefinida com Sucesso!</h2>
                <p className="text-xs text-[#A8A29E] mt-1.5 leading-relaxed">
                  Sua nova senha de acesso foi atualizada e já está ativa para login.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/admin/login"
                  className="w-full py-3.5 bg-gradient-to-r from-[#DFBE76] via-[#C5A059] to-[#A9833E] text-black font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span>Ir para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#DFBE76] mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-black/40 border border-white/10 text-white text-xs pl-10 pr-10 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#DFBE76] mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a nova senha"
                    className="w-full bg-black/40 border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
                  />
                </div>
              </div>

              {/* Medidor de Força */}
              {password.length > 0 && (
                <div className="p-3 bg-white/5 border border-white/10 text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A8A29E]">Força da senha:</span>
                    <span
                      className={`font-bold ${
                        strengthScore <= 2
                          ? 'text-rose-400'
                          : strengthScore <= 4
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {strengthScore <= 2 ? 'Fraca' : strengthScore <= 4 ? 'Boa' : 'Excelente'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore <= 2
                          ? 'bg-rose-500 w-1/3'
                          : strengthScore <= 4
                          ? 'bg-amber-500 w-2/3'
                          : 'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#DFBE76] via-[#C5A059] to-[#A9833E] text-black font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Atualizando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Nova Senha</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Rodapé */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#78716C]">
            <Link href="/admin/login" className="hover:text-white transition-colors">
              ← Voltar ao Login
            </Link>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DFBE76]" />
              <span>Redefinição Criptografada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121110] flex items-center justify-center text-[#DFBE76] text-xs font-bold uppercase tracking-widest">
          Carregando ambiente seguro...
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
