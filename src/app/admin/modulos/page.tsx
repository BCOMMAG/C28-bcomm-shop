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
import { useStore } from '@/context/StoreContext';

export default function AdminModulosPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

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
      const data = await getStoreModules(tenantId);
      setModules(data);
    } catch (err) {
      console.error('Erro ao carregar módulos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [tenantId]);

  const handleToggle = async (module: StoreModuleConfig) => {
    setTogglingKey(module.key);
    const nextState = !module.active;

    const res = await toggleStoreModule(tenantId, module.key, nextState);
    if (res.success) {
      setModules((prev) =>
        prev.map((m) => (m.key === module.key ? { ...m, active: nextState } : m))
      );
      try {
        await refreshProducts();
      } catch {}
      showToast(
        nextState
          ? `Módulo "${module.title}" ativado com sucesso para ${lojaNome}!`
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
        return <Truck className="w-6 h-6 text-amber-600" />;
      case 'rastreio_whatsapp':
        return <MessageCircle className="w-6 h-6 text-emerald-600" />;
      case 'recuperacao_carrinho':
        return <ShoppingCart className="w-6 h-6 text-purple-600" />;
      case 'checkout_transparente':
        return <CreditCard className="w-6 h-6 text-sky-600" />;
      default:
        return <Layers className="w-6 h-6 text-amber-600" />;
    }
  };

  const totalAtivos = modules.filter((m) => m.active).length;

  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-500'
              : 'bg-rose-900 text-rose-100 border border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Loja de Módulos & Recursos SaaS
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SaaS White-Label
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ative recursos sob demanda para a {lojaNome} com ativação instantânea no Supabase.
          </p>
        </div>

        <button
          onClick={fetchModules}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Sincronizar Módulos</span>
        </button>
      </div>

      {/* BANNER DE VALOR SAAS */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Ecossistema Modular Antifrágil</span>
          </div>
          <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
            Recursos ativados sem custo de infraestrutura
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cada módulo é isolado e funciona de forma independente. Você pode ativar o cálculo de frete automático para agilizar os envios, conectar o WhatsApp para notificações em tempo real ou habilitar o recuperador de carrinhos para converter vendas perdidas.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> {totalAtivos} de {modules.length} módulos ativos
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Isolamento Multi-Tenant Garantido
            </span>
          </div>
        </div>
      </div>

      {/* GRADE DE MÓDULOS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Carregando módulos contratáveis...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const isToggling = togglingKey === mod.key;

            return (
              <div
                key={mod.key}
                className={`bg-white border rounded-xl p-6 flex flex-col justify-between transition-all shadow-xs ${
                  mod.active
                    ? 'border-amber-400 shadow-md ring-1 ring-amber-400/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        {getModuleIcon(mod.key)}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                          {mod.categoria}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {mod.title}
                        </h3>
                      </div>
                    </div>

                    {mod.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-full shrink-0">
                        {mod.badge}
                      </span>
                    )}
                  </div>

                  {/* Descrição */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Rodapé / Switch */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Assinatura
                    </span>
                    <span className="font-serif-luxury text-sm font-extrabold text-slate-900">
                      {mod.mensalidade}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggle(mod)}
                    disabled={isToggling}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      mod.active
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                    }`}
                  >
                    {isToggling ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : mod.active ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{mod.active ? 'Módulo Ativo' : 'Ativar Módulo'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
