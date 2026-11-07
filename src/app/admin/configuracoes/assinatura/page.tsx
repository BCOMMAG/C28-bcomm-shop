'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Crown,
  ShieldCheck,
  CreditCard,
  Clock,
  ArrowUpRight,
  Package,
  HardDrive,
  Users,
  Globe,
  MessageCircle,
  Zap,
  Check
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function SubscriptionSettingsPage() {
  const { currentTenant, products } = useStore();
  const lojaNome = currentTenant?.nome || 'Minha Loja';
  const tenantSlug = currentTenant?.slug || '';

  // Métricas do Plano
  const totalProdutos = products.length;
  const limiteProdutos = 150;
  const percentualUso = Math.min(100, Math.round((totalProdutos / limiteProdutos) * 100));

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const planos = [
    {
      nome: 'Boutique Starter',
      preco: 'R$ 97',
      periodo: '/mês',
      descricao: 'Ideal para boutiques iniciantes e consultoras independentes.',
      destaque: false,
      recursos: [
        'Até 40 produtos cadastrados',
        'Atendimento e Reserva via WhatsApp',
        'Galeria Multimídia de Alta Velocidade',
        'Subdomínio exclusivo (nomedaloja.bcomm.shop)',
        '1 usuária administradora',
        'Suporte por e-mail'
      ]
    },
    {
      nome: 'Boutique Pro SaaS',
      preco: 'R$ 197',
      periodo: '/mês',
      descricao: 'Plano atual da sua boutique. Recursos completos de alta conversão.',
      destaque: true,
      badge: 'SEU PLANO ATUAL',
      recursos: [
        'Até 150 produtos cadastrados',
        'Domínio Próprio (.com.br) com SSL Grátis',
        'Galeria de fotos e vídeos de provador em alta definição',
        'Painel Financeiro & DRE com CMV',
        'Até 5 usuárias de equipe com controle de horário',
        'Reservas de estoque com contagem regressiva',
        'Suporte prioritário via WhatsApp'
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl rounded-lg animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif-luxury">
              Plano & Assinatura SaaS
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-600" /> BCOMM Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie o plano da sua loja, cotas de catálogo, faturamento e recursos disponíveis na plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Assinatura Ativa & Em Dia
          </span>
        </div>
      </div>

      {/* CARD DO PLANO ATUAL & COTAS */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                Plano Contratado
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Boutique Pro SaaS
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Loja Licenciada: <strong className="text-white">{lojaNome}</strong> ({tenantSlug})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left md:text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Valor da Assinatura
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                R$ 197,00<span className="text-xs font-normal text-slate-400">/mês</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-700 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Próxima Renovação
              </span>
              <span className="text-sm font-semibold text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> 30 de Novembro, 2026
              </span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE CONSUMO DE RECURSOS */}
        <div className="relative z-10 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cota de Produtos */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-sky-400" /> Catálogo Ativo
              </span>
              <span className="font-bold text-white font-mono">{totalProdutos}/{limiteProdutos}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${percentualUso}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              {percentualUso}% da cota utilizada ({limiteProdutos - totalProdutos} vagas livres)
            </span>
          </div>

          {/* Armazenamento Galeria Multimídia */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Galeria Multimídia Otimizada
              </span>
              <span className="font-bold text-emerald-400 font-mono">Ilimitado</span>
            </div>
            <span className="text-xs text-slate-300 font-medium block">
              32 fotos e vídeos WebP otimizados
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Carregamento ultra-rápido de fotos e vídeos em alta definição
            </span>
          </div>

          {/* Equipe Cadastrada */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" /> Equipe e Vendedoras
              </span>
              <span className="font-bold text-white font-mono">4/5 usuárias</span>
            </div>
            <span className="text-xs text-slate-300 font-medium block">
              Controle de horário de trabalho ativo
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Permissões granulares de balcão
            </span>
          </div>

          {/* Domínio Próprio */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Domínio Customizado
              </span>
              <span className="font-bold text-emerald-400">Ativo</span>
            </div>
            <span className="text-xs text-slate-300 font-medium block truncate" title="leidyboutique.com.br">
              Certificado SSL Seguro (HTTPS) Ativo
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              DNS conectado com sucesso
            </span>
          </div>
        </div>
      </div>

      {/* PLANOS DISPONÍVEIS NA PLATAFORMA */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-serif-luxury">
            Planos BCOMM Platform
          </h3>
          <p className="text-xs text-slate-500">
            Faça upgrade a qualquer momento para desbloquear novas cotas e recursos avançados para o crescimento da sua marca.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {planos.map((plano, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${
                plano.destaque
                  ? 'bg-white border-2 border-amber-500 shadow-xl shadow-amber-500/5 relative'
                  : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {plano.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  {plano.badge}
                </div>
              )}

              <div>
                <h4 className="text-lg font-bold text-slate-900 font-serif-luxury">
                  {plano.nome}
                </h4>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                  {plano.descricao}
                </p>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {plano.preco}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{plano.periodo}</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Recursos Inclusos:
                  </span>
                  {plano.recursos.map((rec, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                {plano.destaque ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Plano Atualmente Ativo</span>
                  </button>
                ) : (
                  <a
                    href="https://wa.me/554197347601?text=Ol%C3%A1!%20Gostaria%20de%20conversar%20sobre%20upgrade%20do%20meu%20plano%20na%20BCOMM%20Platform."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Falar com Consultor BCOMM</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTATO E SUPORTE DA PLATAFORMA */}
      <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 font-serif-luxury">
              Dúvidas sobre faturamento ou customizações exclusivas?
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Nossa equipe de suporte técnico e engenharia BCOMM atende seu time diretamente pelo WhatsApp oficial.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/554197347601?text=Ol%C3%A1!%20Preciso%20de%20suporte%20t%C3%A9cnico%20da%20BCOMM%20Platform."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Suporte VIP WhatsApp</span>
        </a>
      </div>
    </div>
  );
}

