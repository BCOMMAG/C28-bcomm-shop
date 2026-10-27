'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Globe,
  Smartphone,
  Lock,
  ChevronRight,
  PlusCircle,
  Database,
  CloudLightning
} from 'lucide-react';

export function PlatformPortal() {
  return (
    <div className="min-h-screen bg-[#0C0E14] text-[#FAF8F5] relative overflow-x-hidden selection:bg-[#C5A059]/30 selection:text-white">
      {/* Luzes atmosféricas de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#C5A059]/15 via-[#38BDF8]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Corporativo BCOMM */}
      <header className="relative z-20 border-b border-white/10 bg-[#0C0E14]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#DFBE76] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#C5A059]/20">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-white font-serif-luxury">
                  BCOMM PLATFORM
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold bg-[#C5A059]/20 text-[#DFBE76] border border-[#C5A059]/40 rounded-full">
                  SaaS White-Label
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Motor de E-commerce Multi-Tenant de Alta Performance</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/admin/login/"
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer rounded-none inline-flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">Painel do</span> Lojista
            </Link>

            <Link
              href="/super-admin/login/"
              className="px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#C5A059] to-[#DFBE76] text-black hover:opacity-95 transition-all shadow-md shadow-[#C5A059]/20 cursor-pointer rounded-none inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Super Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#DFBE76] font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Infraestrutura Edge 100% Serverless Cloudflare & Supabase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 font-serif-luxury leading-tight">
            Hub de Lojas Virtuais & Gestão Multi-Tenant
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8">
            Cada cliente possui sua própria loja isolada, com catálogo dinâmico, provador em vídeo,
            mídia em Cloudflare R2 e checkout via WhatsApp. Apresente propostas instantâneas e escale suas vendas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/super-admin/login/"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#DFBE76] text-black font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20 cursor-pointer"
            >
              <span>Gerenciar Plataforma (Super Admin)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/login/"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#141822] hover:bg-[#1A202E] text-white border border-white/15 font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#C5A059]" />
              <span>Login do Lojista (Tenant)</span>
            </Link>
          </div>
        </div>

        {/* Seção Vitrine de Lojas Ativas / Demonstrações */}
        <section className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-[#C5A059]">
                Portfólio & Demonstrações
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury mt-1">
                Lojas em Operação & Vitrines Prontas
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Acesse as vitrines personalizadas geradas para cada cliente. Cada URL carrega exclusivamente o catálogo e identidade visual daquela loja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Loja 1: Leidy Boutique */}
            <div className="bg-[#12151E] border border-[#C5A059]/40 p-6 flex flex-col justify-between group hover:border-[#C5A059] transition-all relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/10 rounded-full blur-2xl group-hover:bg-[#C5A059]/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tenant #1 Ativo
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">slug: leidy-boutique</span>
                </div>

                <h3 className="text-xl font-bold text-white font-serif-luxury mb-2 group-hover:text-[#DFBE76] transition-colors">
                  Leidy Boutique
                </h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Curadoria Exclusiva em Moda Feminina de Alto Padrão. Alfaiataria nobre, tricots Biamar, provador em vídeo e checkout otimizado via WhatsApp.
                </p>

                <div className="space-y-2 mb-6 text-xs text-zinc-300">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">Endereço da Vitrine:</span>
                    <span className="font-mono text-zinc-200">bcomm-shop.pages.dev/leidyboutique</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">Link Demonstração:</span>
                    <span className="font-mono text-[#DFBE76]">/leidyboutique/</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-500">Status:</span>
                    <span className="text-emerald-400 font-medium">100% Operacional</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Link
                  href="/leidyboutique/"
                  className="w-full py-2.5 px-4 bg-[#C5A059] hover:bg-[#DFBE76] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Abrir Loja Leidy Boutique</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/admin/login/"
                  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#C5A059]" />
                  <span>Painel do Lojista (Leidy)</span>
                </Link>
              </div>
            </div>

            {/* Card Loja 2: Modelo Demonstrativo para Novos Clientes */}
            <div className="bg-[#12151E] border border-white/15 p-6 flex flex-col justify-between group hover:border-[#38BDF8]/60 transition-all relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#38BDF8]/10 rounded-full blur-2xl group-hover:bg-[#38BDF8]/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 rounded-full inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Demonstração / Prospecção
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">slug: aura-privee</span>
                </div>

                <h3 className="text-xl font-bold text-white font-serif-luxury mb-2 group-hover:text-[#38BDF8] transition-colors">
                  Aura Privée (Modelo #2)
                </h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Loja de demonstração para novos lojistas. Ideal para enviar no WhatsApp durante a prospecção e mostrar como a loja do cliente ficará.
                </p>

                <div className="space-y-2 mb-6 text-xs text-zinc-300">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">Domínio Próprio:</span>
                    <span className="font-mono text-zinc-400">auraprivee.com.br (Ao fechar)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">Link Apresentação:</span>
                    <span className="font-mono text-[#38BDF8]">/auraprivee/</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-500">Ativação:</span>
                    <span className="text-zinc-300 font-medium">Instantânea (60s)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Link
                  href="/auraprivee/"
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-[#38BDF8] hover:text-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Ver Demonstração da Loja</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/super-admin/login/"
                  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3 text-[#38BDF8]" />
                  <span>Cadastrar no Super Admin</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Como Criar & Prospecção Rápida */}
            <div className="bg-gradient-to-br from-[#12151E] to-[#181D2A] border border-dashed border-[#C5A059]/40 p-6 flex flex-col justify-between relative shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#DFBE76] mb-4">
                  <PlusCircle className="w-6 h-6 stroke-[1.8]" />
                </div>

                <h3 className="text-xl font-bold text-white font-serif-luxury mb-2">
                  Novo Cliente / Lead?
                </h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Passo a passo rápido para fechar uma nova loja:
                </p>

                <ol className="space-y-3 text-xs text-zinc-300 mb-6 list-decimal list-inside leading-relaxed">
                  <li>
                    Acesse o <strong className="text-white">Super Admin</strong> e clique em <em>+ Nova Loja</em>.
                  </li>
                  <li>
                    Insira o nome da loja, telefone WhatsApp e salve.
                  </li>
                  <li>
                    Envie o link <code className="text-[#DFBE76] bg-black/40 px-1 py-0.5">bcomm-shop.pages.dev/?loja=novo-slug</code> para o cliente no WhatsApp.
                  </li>
                  <li>
                    Quando fechar, aponte o domínio próprio do lojista sem mexer em código!
                  </li>
                </ol>
              </div>

              <Link
                href="/super-admin/login/"
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-[#C5A059] hover:text-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Criar Novo Lojista Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pilares Tecnológicos */}
        <section className="bg-[#12151E]/60 border border-white/10 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury mb-3">
              Engenharia Moderna de E-commerce
            </h3>
            <p className="text-xs text-zinc-400">
              Desenhado para velocidade extrema, custo operacional zero até a primeira venda e suporte a centenas de lojas simultâneas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-white/5 border border-white/5 rounded-none">
              <CloudLightning className="w-6 h-6 text-[#DFBE76] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Cloudflare Pages</h4>
              <p className="text-xs text-zinc-400">Distribuição estática global em mais de 300 data centers com tempo de resposta quase instantâneo.</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-none">
              <Database className="w-6 h-6 text-[#38BDF8] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Supabase Multi-Tenant</h4>
              <p className="text-xs text-zinc-400">Isolamento de lojas com Row Level Security (RLS) e sincronização de dados em tempo real.</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-none">
              <Layers className="w-6 h-6 text-[#DFBE76] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Cloudflare R2</h4>
              <p className="text-xs text-zinc-400">Armazenamento de imagens e vídeos de alta definição com zero custo de tráfego de saída (zero egress).</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-none">
              <Globe className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Domínios Customizados</h4>
              <p className="text-xs text-zinc-400">Cada lojista pode usar seu domínio próprio (.com.br) ou o link de demonstração da plataforma.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer BCOMM */}
      <footer className="border-t border-white/10 bg-[#08090D] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BCOMM Platform • Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/admin/login/" className="hover:text-zinc-300 transition-colors">
              Painel Lojista
            </Link>
            <Link href="/super-admin/login/" className="hover:text-zinc-300 transition-colors">
              Painel Master (Super Admin)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
