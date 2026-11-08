'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  SupportedLocale,
  getStoredLocale,
  getTranslation
} from '@/lib/i18n';
import { LanguageSelector } from '@/components/common/LanguageSelector';

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Gerenciamento de Idioma (i18n)
  const [locale, setLocale] = useState<SupportedLocale>('pt');
  const t = getTranslation(locale);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);

  // Inicializa o locale e trata sessão de recuperação e PKCE (?code=)
  useEffect(() => {
    setLocale(getStoredLocale());

    if (typeof document !== 'undefined') {
      document.title = t.resetPassword.pageTitle;

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

    const initAuthRecovery = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const code = searchParams.get('code');

        // Se veio no fluxo PKCE do Supabase
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('Código de recuperação inválido ou expirado:', error.message);
            setIsLinkInvalid(true);
            return;
          }
        }

        // Verifica se há sessão ativa ou token no hash da URL (#access_token=...)
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setIsSessionReady(true);
        } else if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          setIsSessionReady(true);
        } else if (!code && !searchParams.get('token')) {
          // Acessou a página diretamente sem token ou código
          setIsLinkInvalid(true);
        } else {
          setIsSessionReady(true);
        }
      } catch (e) {
        console.warn('Erro ao inicializar verificação de recuperação:', e);
      }
    };

    initAuthRecovery();
  }, [searchParams, t.resetPassword.pageTitle]);

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
      setErrorMsg(t.resetPassword.errorMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t.resetPassword.errorMismatch);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Atualiza a senha no Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      try {
        localStorage.setItem('bcomm_last_password_reset', new Date().toISOString());
      } catch {}

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || t.resetPassword.errorExpired);
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
            {/* Seletor de Idioma */}
            <div className="flex justify-end mb-4">
              <LanguageSelector onLocaleChange={setLocale} />
            </div>

            {/* Topo do Card */}
            <div className="text-center mb-8">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {t.resetPassword.heading}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                {t.resetPassword.subheading}
              </p>
            </div>

            {isLinkInvalid ? (
              <div className="space-y-5 text-center py-4">
                <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                  <span className="leading-relaxed">{t.resetPassword.errorExpired}</span>
                </div>
                <Link
                  href="/admin/login"
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-900/30"
                >
                  <span>{t.resetPassword.requestNewLink}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : success ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{t.resetPassword.successTitle}</h2>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    {t.resetPassword.successMessage}
                  </p>
                </div>

                <div className="pt-3">
                  <Link
                    href="/admin/login"
                    className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-600/25"
                  >
                    <span>{t.resetPassword.goToLogin}</span>
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
                    {t.resetPassword.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={t.resetPassword.newPasswordPlaceholder}
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
                    {t.resetPassword.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder={t.resetPassword.confirmPasswordPlaceholder}
                      className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Medidor de Força */}
                {password.length > 0 && (
                  <div className="p-3 bg-white/5 border border-white/10 text-[11px] rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{t.resetPassword.strengthLabel}</span>
                      <span
                        className={`font-bold ${
                          strengthScore <= 2
                            ? 'text-rose-400'
                            : strengthScore <= 4
                            ? 'text-amber-400'
                            : 'text-purple-400'
                        }`}
                      >
                        {strengthScore <= 2
                          ? t.resetPassword.strengthWeak
                          : strengthScore <= 4
                          ? t.resetPassword.strengthMedium
                          : t.resetPassword.strengthStrong}
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
                      <span>{t.resetPassword.submittingButton}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.resetPassword.submitButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Rodapé */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
              <Link href="/admin/login" className="hover:text-white transition-colors">
                {t.resetPassword.backToLogin}
              </Link>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.resetPassword.encrypted}</span>
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
