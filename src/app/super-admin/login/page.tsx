'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Server } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@bcomm.com.br');
  const [password, setPassword] = useState('SuperAdmin@2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Tenta autenticação via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (!error && data?.session) {
        localStorage.setItem('bcomm_super_admin_auth', 'true');
        localStorage.setItem('bcomm_super_admin_user', email);
        router.push('/super-admin');
        return;
      }

      // 2. Fallback de autoridade Master do Dono da Plataforma
      if (
        email.trim().toLowerCase() === 'superadmin@bcomm.com.br' &&
        password === 'SuperAdmin@2026!'
      ) {
        localStorage.setItem('bcomm_super_admin_auth', 'true');
        localStorage.setItem('bcomm_super_admin_user', email);
        router.push('/super-admin');
        return;
      }

      setErrorMsg('Credenciais de Super Administrador incorretas.');
    } catch (err: any) {
      if (
        email.trim().toLowerCase() === 'superadmin@bcomm.com.br' &&
        password === 'SuperAdmin@2026!'
      ) {
        localStorage.setItem('bcomm_super_admin_auth', 'true');
        localStorage.setItem('bcomm_super_admin_user', email);
        router.push('/super-admin');
        return;
      }
      setErrorMsg(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0E14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#0284C7]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#11141E] border border-slate-800 p-8 rounded-xl shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0284C7] via-[#38BDF8] to-indigo-500 mx-auto mb-4 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-sky-500/25">
              BC
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              BCOMM Platform
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Console Central do Dono da Plataforma SaaS Multi-Tenant
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                E-mail de Operador Master
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="superadmin@bcomm.com.br"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                Chave de Acesso Master
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-[#38BDF8] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Credenciais do Administrador BCOMM</span>
              </div>
              <p className="text-[10px]">
                <strong className="text-white">Operador:</strong> superadmin@bcomm.com.br
              </p>
              <p className="text-[10px]">
                <strong className="text-white">Chave:</strong> SuperAdmin@2026!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black font-bold uppercase tracking-wider text-xs rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando Plataforma...</span>
                </>
              ) : (
                <>
                  <span>Acessar Console Master</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              ← Vitrine da Loja
            </Link>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Multi-Tenant Auth</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6 flex items-center justify-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span>Infraestrutura Distribuída Cloudflare + PostgreSQL</span>
        </p>
      </div>
    </div>
  );
}
