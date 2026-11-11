'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  SupportedLocale,
  getStoredLocale,
  getTranslation
} from '@/lib/i18n';
import { LanguageSelector } from '@/components/common/LanguageSelector';

export default function AdminLoginPage() {
  const router = useRouter();

  // Gerenciamento de Idioma (i18n)
  const [locale, setLocale] = useState<SupportedLocale>('pt');
  const t = getTranslation(locale);

  // Campos de login iniciam 100% vazios para segurança
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  // Estados de Recuperação de Senha por E-mail
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Inicializa o locale e garante o título da aba e o favicon oficial BCOMM sem cache antigo
  useEffect(() => {
    setLocale(getStoredLocale());

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('revoked') === 'true') {
        setRevokedMessage(
          params.get('reason') || 'Sua sessão foi encerrada pela administração da loja ou sua senha foi alterada.'
        );
      }
    }

    if (typeof document !== 'undefined') {
      document.title = 'BCOMM • Painel Administrativo';

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
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = `/admin-favicon/favicon-32x32.png?v=${v}`;
        document.head.appendChild(link);
      }
    }
  }, []);

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryFeedback(null);
    setRecoveryLoading(true);

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRecoveryFeedback({ type: 'error', message: t.forgotModal.invalidEmail });
      setRecoveryLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bcomm-ag.space';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/admin/redefinir-senha`
      });

      if (error) {
        throw error;
      }

      setRecoveryFeedback({
        type: 'success',
        message: t.forgotModal.successMessage(cleanEmail)
      });
    } catch (err: any) {
      setRecoveryFeedback({
        type: 'error',
        message: err?.message || t.forgotModal.genericError
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg(t.login.emptyFields);
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // Função auxiliar para vincular a loja específica do usuário autenticado (Multi-tenant)
      const bindUserTenantSession = async (userEmail: string) => {
        try {
          // 1. Busca em equipe_loja
          const { data: membro } = await supabase
            .from('equipe_loja')
            .select('*')
            .eq('email', userEmail.trim().toLowerCase())
            .eq('ativo', true)
            .maybeSingle();

          let targetLoja = null;
          if (membro?.loja_id) {
            localStorage.setItem('bcomm_admin_colaborador', JSON.stringify(membro));
            localStorage.setItem('leidy_admin_colaborador', JSON.stringify(membro));
            localStorage.setItem('bcomm_token_version', String(membro.token_version || 1));

            const { data: loja } = await supabase
              .from('lojas')
              .select('*')
              .eq('id', membro.loja_id)
              .maybeSingle();
            if (loja) targetLoja = loja;
          }

          // 2. Fallback por e-mail da loja
          if (!targetLoja) {
            const { data: lojaByEmail } = await supabase
              .from('lojas')
              .select('*')
              .eq('email', userEmail.trim().toLowerCase())
              .maybeSingle();
            if (lojaByEmail) targetLoja = lojaByEmail;
          }

          if (targetLoja) {
            localStorage.setItem('bcomm_admin_loja_id', targetLoja.id);
            localStorage.setItem('bcomm_admin_loja_slug', targetLoja.slug);
            localStorage.setItem('bcomm_tenant_last', JSON.stringify(targetLoja));
            localStorage.setItem(`bcomm_tenant_${targetLoja.slug}`, JSON.stringify(targetLoja));
          }
        } catch (e) {
          console.warn('Aviso ao resolver tenant do usuário autenticado:', e);
        }
      };

      // 1. Autenticação estritamente dinâmica via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      // 2. Se autenticar com sucesso
      if (!error && data?.session) {
        await bindUserTenantSession(email);
        localStorage.setItem('bcomm_admin_auth', 'true');
        localStorage.setItem('bcomm_auth_user', email);
        router.push('/admin/');
        return;
      }

      setErrorMsg(t.login.invalidCredentials);
    } catch (err: any) {
      setErrorMsg(err?.message || t.login.invalidCredentials);
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

        {/* Lado Direito: Card Principal de Login */}
        <div className="w-full max-w-md">
          {/* Card Principal BCOMM */}
          <div className="bg-[#100E17] border border-purple-500/20 p-8 shadow-2xl relative rounded-2xl">
            {/* Seletor de Idioma no Topo do Card */}
            <div className="flex justify-end mb-4">
              <LanguageSelector onLocaleChange={setLocale} />
            </div>

            {/* Topo do Card */}
            <div className="text-center mb-8">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {t.login.panelTitle}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                {t.login.panelSubtitle}
              </p>
            </div>

            {/* Alerta de Kill-Switch / Sessão Revogada */}
            {revokedMessage && (
              <div className="mb-6 p-4 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-100">Acesso Encerrado</p>
                  <p className="text-amber-200/90 leading-relaxed">{revokedMessage}</p>
                </div>
              </div>
            )}

            {/* Feedback de Erro */}
            {errorMsg && (
              <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5">
                  {t.login.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t.login.emailPlaceholder}
                    className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-300">
                    {t.login.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryFeedback(null);
                      setRecoveryEmail(email);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    {t.login.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t.login.passwordPlaceholder}
                    className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-500 hover:to-violet-500 text-white font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-900/30 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.login.submittingButton}</span>
                  </>
                ) : (
                  <>
                    <span>{t.login.submitButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Rodapé do Card */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
              <Link href="/" className="hover:text-white transition-colors">
                ← {t.login.backToStore}
              </Link>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.login.secureAccess}</span>
              </div>
            </div>
          </div>

          {/* Rodapé BCOMM */}
          <p className="text-center text-[11px] text-zinc-500 mt-6">
            {t.login.copyright}
          </p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12101B] border border-purple-500/30 w-full max-w-md p-6 sm:p-7 shadow-2xl relative rounded-2xl text-white">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t.forgotModal.title}</h3>
                <p className="text-xs text-zinc-400">{t.forgotModal.subtitle}</p>
              </div>
            </div>

            {/* Feedback de Recuperação */}
            {recoveryFeedback && (
              <div
                className={`p-3.5 mb-4 text-xs rounded-xl flex items-start gap-2 ${
                  recoveryFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border border-rose-500/40 text-rose-200'
                }`}
              >
                {recoveryFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{recoveryFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5">
                  {t.forgotModal.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    placeholder={t.forgotModal.emailPlaceholder}
                    className="w-full bg-black/50 border border-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  {t.forgotModal.helpTextPrefix}{' '}
                  <strong className="text-purple-300">{t.forgotModal.helpTextHighlight}</strong>.
                </p>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-1/3 py-3 border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {t.forgotModal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-2/3 py-3 font-bold uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30"
                >
                  {recoveryLoading ? (
                    <span>{t.forgotModal.sendingButton}</span>
                  ) : (
                    <>
                      <span>{t.forgotModal.sendButton}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
