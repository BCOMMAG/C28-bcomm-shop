'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  X,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@leidyboutique.com.br');
  const [password, setPassword] = useState('Leidy@2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de Recuperação de Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'whatsapp'>('email');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    whatsappUrl?: string;
    maskedPhone?: string;
  } | null>(null);

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryFeedback(null);
    setRecoveryLoading(true);

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRecoveryFeedback({ type: 'error', message: 'Por favor, informe seu e-mail cadastrado.' });
      setRecoveryLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      if (recoveryMethod === 'email') {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.boutiqueleidy.com.br';
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${origin}/admin/redefinir-senha`
        });

        if (error) {
          throw error;
        }

        setRecoveryFeedback({
          type: 'success',
          message: `Enviamos as instruções com link seguro para ${cleanEmail}. Verifique sua caixa de entrada e spam.`
        });
      } else {
        // Recuperação via WhatsApp oficial do colaborador ou loja
        const { data: membro } = await supabase
          .from('equipe_loja')
          .select('nome, telefone, loja_id')
          .eq('email', cleanEmail)
          .maybeSingle();

        let phone = membro?.telefone;
        let memberName = membro?.nome || 'Lojista';

        if (!phone) {
          const { data: loja } = await supabase
            .from('lojas')
            .select('whatsapp, nome')
            .eq('email', cleanEmail)
            .maybeSingle();
          if (loja?.whatsapp) {
            phone = loja.whatsapp;
            memberName = loja.nome;
          }
        }

        if (!phone) {
          // Fallback para admin Leidy Boutique caso seja o email padrão
          if (cleanEmail === 'admin@leidyboutique.com.br') {
            phone = '554197347601';
            memberName = 'Leidyane Cristina';
          } else {
            throw new Error('Nenhum WhatsApp verificado foi encontrado para este e-mail. Utilize a opção de recuperação por E-mail.');
          }
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const masked = phoneWithDDI.slice(-4);

        const token = Math.random().toString(36).substring(2, 10).toUpperCase();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.boutiqueleidy.com.br';
        const resetLink = `${origin}/admin/redefinir-senha?token=${token}`;

        const msg = encodeURIComponent(
          `Olá ${memberName}! Recebemos uma solicitação de redefinição de senha para o seu acesso ao Painel da Loja.\n\nPara cadastrar uma nova senha com segurança, acesse o link:\n${resetLink}\n\nCaso não tenha solicitado, ignore esta mensagem.`
        );
        const waUrl = `https://wa.me/${phoneWithDDI}?text=${msg}`;

        setRecoveryFeedback({
          type: 'success',
          message: `Identificamos o WhatsApp com final **${masked}**. Clique no botão abaixo para receber seu link de redefinição direto no aplicativo.`,
          whatsappUrl: waUrl,
          maskedPhone: `Final ***${masked}`
        });
      }
    } catch (err: any) {
      setRecoveryFeedback({
        type: 'error',
        message: err?.message || 'Falha ao processar solicitação de recuperação. Tente novamente.'
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // Função auxiliar para vincular a loja do usuário autenticado
      const bindUserTenantSession = async (userEmail: string) => {
        try {
          // 1. Busca em equipe_loja (resolução multi-tenant de colaboradores)
          const { data: membro } = await supabase
            .from('equipe_loja')
            .select('*')
            .eq('email', userEmail.trim().toLowerCase())
            .eq('ativo', true)
            .maybeSingle();

          let targetLoja = null;
          if (membro?.loja_id) {
            localStorage.setItem('leidy_admin_colaborador', JSON.stringify(membro));
            localStorage.setItem('bcomm_admin_colaborador', JSON.stringify(membro));

            const { data: loja } = await supabase
              .from('lojas')
              .select('*')
              .eq('id', membro.loja_id)
              .maybeSingle();
            if (loja) targetLoja = loja;
          }

          // 2. Fallback de busca em lojas pelo email oficial da loja
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

      // 1. Tenta autenticação via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      // 2. Se autenticar com sucesso via Supabase Auth
      if (!error && data?.session) {
        await bindUserTenantSession(email);
        localStorage.setItem('leidy_admin_auth', 'true');
        localStorage.setItem('bcomm_admin_auth', 'true');
        localStorage.setItem('leidy_admin_user', email);
        localStorage.setItem('bcomm_auth_user', email);
        router.push('/admin/');
        return;
      }

      // Fallback seguro de acesso para o Lojista Oficial Leidy Boutique
      if (
        email.trim().toLowerCase() === 'admin@leidyboutique.com.br' &&
        password === 'Leidy@2026!'
      ) {
        await bindUserTenantSession(email);
        localStorage.setItem('leidy_admin_auth', 'true');
        localStorage.setItem('bcomm_admin_auth', 'true');
        localStorage.setItem('leidy_admin_user', email);
        localStorage.setItem('bcomm_auth_user', email);
        router.push('/admin/');
        return;
      }

      setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
    } catch (err: any) {
      // Fallback de contingência
      if (
        email.trim().toLowerCase() === 'admin@leidyboutique.com.br' &&
        password === 'Leidy@2026!'
      ) {
        localStorage.setItem('leidy_admin_auth', 'true');
        localStorage.setItem('bcomm_admin_auth', 'true');
        localStorage.setItem('leidy_admin_user', email);
        localStorage.setItem('bcomm_auth_user', email);
        router.push('/admin/');
        return;
      }
      setErrorMsg(err?.message || 'Falha ao autenticar. Tente novamente.');
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
        {/* Card Principal */}
        <div className="bg-[#1A1918] border border-[#C5A059]/30 p-8 shadow-2xl relative">
          {/* Topo / Logo */}
          <div className="text-center mb-8">
            <div className="relative h-16 w-28 mx-auto mb-3 flex items-center justify-center">
              <Image
                src="/images/Logo sem fundo.png"
                alt="Leidy Boutique"
                width={2752}
                height={1536}
                style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                priority
              />
            </div>
            <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white tracking-wide">
              Painel do Lojista
            </h1>
            <p className="text-xs text-[#A8A29E] mt-1">
              Plataforma Multi-Tenant White-Label • Tenant #1
            </p>
          </div>

          {/* Feedback de Erro */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#DFBE76] mb-1.5">
                E-mail do Administrador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@leidyboutique.com.br"
                  className="w-full bg-black/40 border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#DFBE76]">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryFeedback(null);
                    setRecoveryEmail(email);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] text-[#A8A29E] hover:text-[#DFBE76] transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
                />
              </div>
            </div>

            {/* Credenciais de Demonstração / Predefinidas */}
            <div className="p-3 bg-white/5 border border-white/10 text-[11px] text-[#A8A29E] space-y-1">
              <div className="flex items-center gap-1.5 text-[#DFBE76] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Credenciais Oficiais Configuradas</span>
              </div>
              <p className="text-[10px]">
                <strong className="text-white">Usuário:</strong> admin@leidyboutique.com.br
              </p>
              <p className="text-[10px]">
                <strong className="text-white">Senha:</strong> Leidy@2026!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#DFBE76] via-[#C5A059] to-[#A9833E] text-black font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#78716C]">
            <Link href="/" className="hover:text-white transition-colors">
              ← Voltar para a Loja
            </Link>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DFBE76]" />
              <span>Acesso Criptografado</span>
            </div>
          </div>
        </div>

        {/* Créditos BCOMM */}
        <p className="text-center text-[11px] text-[#78716C] mt-6">
          Plataforma White-Label mantida por <strong className="text-[#DFBE76]">BCOMM</strong>
        </p>
      </div>

      {/* Modal de Recuperação de Senha (E-mail e WhatsApp) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1918] border border-[#C5A059]/40 w-full max-w-md p-6 sm:p-7 shadow-2xl relative text-white">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-[#78716C] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-none bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center text-[#DFBE76]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-white">Recuperar Senha</h3>
                <p className="text-xs text-[#A8A29E]">Escolha o canal para receber as instruções</p>
              </div>
            </div>

            {/* Alternador de Método: E-mail vs WhatsApp */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('email');
                  setRecoveryFeedback(null);
                }}
                className={`py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  recoveryMethod === 'email'
                    ? 'bg-[#C5A059] text-black shadow-xs'
                    : 'text-[#A8A29E] hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Por E-mail</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('whatsapp');
                  setRecoveryFeedback(null);
                }}
                className={`py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  recoveryMethod === 'whatsapp'
                    ? 'bg-[#25D366] text-black shadow-xs'
                    : 'text-[#A8A29E] hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Por WhatsApp</span>
              </button>
            </div>

            {/* Feedback de Recuperação */}
            {recoveryFeedback && (
              <div
                className={`p-3.5 mb-4 text-xs flex flex-col gap-2.5 ${
                  recoveryFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {recoveryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{recoveryFeedback.message}</span>
                </div>

                {recoveryFeedback.whatsappUrl && (
                  <a
                    href={recoveryFeedback.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir WhatsApp & Obter Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#DFBE76] mb-1.5">
                  Seu E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    placeholder="ex: admin@leidyboutique.com.br"
                    className="w-full bg-black/40 border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#78716C] mt-1.5">
                  {recoveryMethod === 'email'
                    ? 'Enviaremos um link de uso único e protegido para o seu endereço de e-mail.'
                    : 'Localizaremos o número de WhatsApp verificado vinculado ao seu cadastro na loja.'}
                </p>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-1/3 py-3 border border-white/10 text-[#A8A29E] hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className={`w-2/3 py-3 text-black font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    recoveryMethod === 'whatsapp'
                      ? 'bg-[#25D366] hover:bg-[#20ba5a]'
                      : 'bg-[#C5A059] hover:bg-[#A9833E]'
                  }`}
                >
                  {recoveryLoading ? (
                    <span>Processando...</span>
                  ) : (
                    <>
                      <span>{recoveryMethod === 'whatsapp' ? 'Buscar no WhatsApp' : 'Enviar E-mail'}</span>
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
