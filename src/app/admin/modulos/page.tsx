'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  getStoreModules,
  toggleStoreModule,
  StoreModuleConfig
} from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminModulosPage() {
  const [modules, setModules] = useState<StoreModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await getStoreModules(DEFAULT_TENANT_ID);
      setModules(data);
    } catch (err) {
      console.error('Erro ao carregar módulos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggle = async (module: StoreModuleConfig) => {
    setTogglingKey(module.key);
    const nextState = !module.active;

    const res = await toggleStoreModule(DEFAULT_TENANT_ID, module.key, nextState);
    if (res.success) {
      setModules((prev) =>
        prev.map((m) => (m.key === module.key ? { ...m, active: nextState } : m))
      );
      showToast(
        nextState
          ? `Módulo "${module.title}" ativado com sucesso para esta loja!`
          : `Módulo "${module.title}" desativado.`
      );
    } else {
      showToast(res.error || 'Erro ao atualizar módulo.', 'error');
    }
    setTogglingKey(null);
  };

  const getModuleIcon = (key: string) => {
    switch (key) {
      case 'frete_automatico':
        return <Truck className="w-6 h-6 text-[#DFBE76]" />;
      case 'rastreio_whatsapp':
        return <MessageCircle className="w-6 h-6 text-emerald-400" />;
      case 'recuperacao_carrinho':
        return <ShoppingCart className="w-6 h-6 text-amber-400" />;
      case 'checkout_transparente':
        return <CreditCard className="w-6 h-6 text-sky-400" />;
      default:
        return <Layers className="w-6 h-6 text-[#DFBE76]" />;
    }
  };

  const totalAtivos = modules.filter((m) => m.active).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Loja de Módulos & Recursos
            </h1>
            <span className="text-[10px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-2 py-0.5 font-bold uppercase tracking-wider">
              SaaS White-Label
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Ative recursos sob demanda para a Leidy Boutique com cobrança modular e ativação em tempo real no Supabase.
          </p>
        </div>

        <button
          onClick={fetchModules}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
          <span>Sincronizar Módulos</span>
        </button>
      </div>

      {/* BANNER DE VALOR SAAS */}
      <div className="bg-gradient-to-r from-[#1A1918] via-[#24211D] to-[#1A1918] border border-[#C5A059]/30 p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#DFBE76]">
            <Sparkles className="w-4 h-4" />
            <span>Ecossistema Modular Antifrágil</span>
          </div>
          <h2 className="font-serif-luxury text-xl sm:text-2xl text-white font-bold">
            Recursos ativados sem custo de infraestrutura
          </h2>
          <p className="text-xs text-[#A8A29E] leading-relaxed">
            Cada módulo é isolado e funciona de forma independente. Você pode ativar o cálculo de frete automático para agilizar os envios, conectar o WhatsApp para notificações em tempo real ou habilitar o recuperador de carrinhos para converter vendas perdidas.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> {totalAtivos} de {modules.length} módulos ativos
            </span>
            <span className="text-[#78716C]">•</span>
            <span className="text-[#DFBE76] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Integração Segura com RLS
            </span>
          </div>
        </div>
      </div>

      {/* GRADE DE MÓDULOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#DFBE76] mx-auto mb-2" />
          <span>Carregando módulos contratáveis...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const isToggling = togglingKey === mod.key;

            return (
              <div
                key={mod.key}
                className={`bg-[#1A1918] border p-6 flex flex-col justify-between transition-all ${
                  mod.active
                    ? 'border-[#C5A059]/60 shadow-lg shadow-[#C5A059]/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {getModuleIcon(mod.key)}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#A8A29E] font-semibold block">
                          {mod.categoria}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                          {mod.title}
                        </h3>
                      </div>
                    </div>

                    {mod.badge && (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/30 font-bold shrink-0">
                        {mod.badge}
                      </span>
                    )}
                  </div>

                  {/* Descrição */}
                  <p className="text-xs text-[#A8A29E] leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Rodapé / Switch */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#78716C] uppercase block">
                      Assinatura
                    </span>
                    <span className="font-serif-luxury text-sm font-bold text-white">
                      {mod.mensalidade}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold ${
                        mod.active ? 'text-emerald-400' : 'text-[#78716C]'
                      }`}
                    >
                      {mod.active ? 'Módulo Ativo' : 'Desativado'}
                    </span>

                    {/* Switch Toggle */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggle(mod)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        mod.active ? 'bg-[#DFBE76]' : 'bg-white/10'
                      }`}
                      aria-label={`Alternar módulo ${mod.title}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          mod.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRÉDITOS E INFORMAÇÕES DE FATURAMENTO */}
      <div className="p-6 bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#78716C]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#DFBE76]" />
          <span>Os módulos são faturados via BCOMM Agência Digital com conciliação mensal unificada.</span>
        </div>
        <Link
          href="/admin"
          className="text-[#DFBE76] hover:underline flex items-center gap-1 font-semibold"
        >
          <span>Voltar ao Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
