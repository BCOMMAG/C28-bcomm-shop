'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Store,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Copy,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { createStoreExpress, StoreTenant } from '@/lib/super-admin';

export default function SuperAdminNovaLojaPage() {
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [dominioProprio, setDominioProprio] = useState('');
  const [cloneCatalog, setCloneCatalog] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdLoja, setCreatedLoja] = useState<StoreTenant | null>(null);

  // Auto-gera o slug a partir do nome
  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!createdLoja) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!nome.trim() || !slug.trim() || !whatsapp.trim() || !email.trim()) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }

      const res = await createStoreExpress({
        nome,
        slug,
        whatsapp,
        email,
        dominioProprio: dominioProprio.trim() || undefined,
        cloneCatalog
      });

      if (res.success && res.loja) {
        setCreatedLoja(res.loja);
      } else {
        throw new Error(res.error || 'Falha ao criar loja.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao provisionar a loja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* CABEÇALHO */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Provisionar Nova Loja em 60 Segundos
          </h1>
          <span className="text-[10px] bg-sky-950 text-[#38BDF8] border border-sky-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Express Onboarding
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Crie um novo Tenant completo na plataforma SaaS White-Label com banco de dados particionado e catálogo clonado pronto para venda.
        </p>
      </div>

      {/* FEEDBACK DE SUCESSO APÓS CRIAÇÃO */}
      {createdLoja ? (
        <div className="bg-[#11141E] border border-emerald-500/40 rounded-xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Loja Provisionada com 100% de Sucesso!
              </h2>
              <p className="text-xs text-emerald-400">
                O Tenant foi criado no Supabase e já está pronto para receber pedidos e acessos.
              </p>
            </div>
          </div>

          {/* Dados de Acesso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2 text-xs">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Links Canônicos da Loja (URLs Limpas)
              </span>
              <p className="font-mono text-white text-xs">
                Vitrine: <a href={`/${createdLoja.slug}/`} target="_blank" className="text-[#38BDF8] hover:underline">/{createdLoja.slug}/</a>
              </p>
              <p className="font-mono text-white text-xs">
                Central da Cliente: <a href={`/${createdLoja.slug}/cliente/`} target="_blank" className="text-[#38BDF8] hover:underline">/{createdLoja.slug}/cliente/</a>
              </p>
              <p className="font-mono text-white text-xs">
                Favoritos: <a href={`/${createdLoja.slug}/cliente/favoritos/`} target="_blank" className="text-[#38BDF8] hover:underline">/{createdLoja.slug}/cliente/favoritos/</a>
              </p>
              {createdLoja.dominio_proprio && (
                <p className="font-mono text-emerald-400 text-xs">
                  Domínio Próprio: {createdLoja.dominio_proprio}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2 text-xs">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Acesso do Lojista
              </span>
              <p className="text-slate-300">
                <strong>E-mail:</strong> {createdLoja.email}
              </p>
              <p className="text-slate-300">
                <strong>Painel:</strong> /admin
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => {
                setCreatedLoja(null);
                setNome('');
                setSlug('');
                setWhatsapp('');
                setEmail('');
                setDominioProprio('');
              }}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              + Provisionar Outra Loja
            </button>

            <Link
              href="/super-admin/lojas/"
              className="px-5 py-2.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Lista de Lojas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* FORMULÁRIO DE PROVISIONAMENTO */
        <div className="bg-[#11141E] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome da Loja */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                  Nome da Marca / Loja *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  required
                  placeholder="Ex: Aura Privée Boutique"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {/* Slug da Loja */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                  Slug do Tenant (Subdomínio / Rota) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="aura-privee"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs font-mono px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {/* WhatsApp do Lojista */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                  WhatsApp Oficial da Loja *
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {/* E-mail do Lojista */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                  E-mail do Administrador da Loja *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contato@auraprivee.com.br"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            {/* Domínio Customizado (Opcional) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">
                Domínio Próprio do Cliente (Opcional)
              </label>
              <input
                type="text"
                value={dominioProprio}
                onChange={(e) => setDominioProprio(e.target.value)}
                placeholder="Ex: auraprivee.com.br (ou deixe em branco para usar o subdomínio)"
                className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs font-mono px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pode ser configurado depois na aba de Domínios Customizados.
              </p>
            </div>

            {/* Opção de Clonar Catálogo Base */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloneCatalog}
                  onChange={(e) => setCloneCatalog(e.target.checked)}
                  className="w-4 h-4 text-[#38BDF8] rounded border-slate-700 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Clonar Catálogo Base da Loja Modelo (Leidy Boutique)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Cria automaticamente as categorias de moda e 8 peças completas com fotos, provador em vídeo e variações de cor e tamanho.
                  </span>
                </div>
              </label>
            </div>

            {/* Botão de Envio */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-4">
              <Link
                href="/super-admin/"
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black font-bold uppercase tracking-wider text-xs rounded-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Provisionando Loja no Supabase...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Provisionar Loja em 60s</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
