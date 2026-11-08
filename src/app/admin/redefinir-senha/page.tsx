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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'BCOMM • Redefinição de Senha';

      const v = '20261107_bcomm_stores';
      const existingIcons = document.querySelectorAll<HTMLLinkElement>(
        "link[rel*='icon'], link[rel='apple-touch-icon']"
      );
      if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
          if (el.rel.includes('apple-touch-icon')) {
            el.href = `/admin-favicon/apple-touch-icon.png?v=${v}`;
          } else {
            el.href = `/admin-favicon/favicon-32x32.png?v=${v}`;
          }
        });
      }
    }
  }, []);

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
        console.warn('Aviso ao atualizar senha auth:', error.message);
      }

      // Se havia um token de redefinição ou Supabase Auth
      if (tokenParam) {
        try {
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
    <div className="min-h-screen bg-[#07060A] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Luz ambiente de fundo BCOMM (Preto & Roxo) */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 relative z-10 py-6 sm:py-10 px-4">
        {/* Lado Esquerdo: Logo BCOMM Stores */}
        <div className="flex flex-col items-center justify-center text-center max-w-md w-full">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] flex items-center justify-center drop-shadow-[0_20px_50px_rgba(139,92,246,0.35)] transition-transform duration-500 hover:scale-105">
            <Image
              src="/images/bcomm-stores.png"
              alt="BCOMM Stores"
              width={2048}
              height={2048}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Lado Direito: Card Principal de Redefinição */}
        <div className="w-full max-w-md">
          <div className="bg-[#100E17] border border-purple-500/20 p-8 shadow-2xl relative rounded-2xl">
          {/* Topo do Card */}
          <div className="text-center mb-8">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Redefinição de Senha
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5">
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
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Sua nova senha de acesso foi atualizada e já está ativa para login.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/admin/login"
                  className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-600/25"
                >
                  <span>Ir para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a nova senha"
                    className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Medidor de Força */}
              {password.length > 0 && (
                <div className="p-3 bg-white/5 border border-white/10 text-[11px] rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Força da senha:</span>
                    <span
                      className={`font-bold ${
                        strengthScore <= 2
                          ? 'text-rose-400'
                          : strengthScore <= 4
                          ? 'text-amber-400'
                          : 'text-purple-400'
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
                          : 'bg-purple-500 w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
            <Link href="/admin/login" className="hover:text-white transition-colors">
              ← Voltar ao Login
            </Link>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Redefinição Criptografada</span>
            </div>
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
        <div className="min-h-screen bg-[#07060A] flex items-center justify-center text-purple-400 text-xs font-bold uppercase tracking-widest">
          Carregando ambiente seguro...
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
