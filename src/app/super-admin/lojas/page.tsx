'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Edit2
} from 'lucide-react';
import { getAllStores, toggleStoreStatus, StoreTenant } from '@/lib/super-admin';

export default function SuperAdminLojasPage() {
  const [stores, setStores] = useState<StoreTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await getAllStores();
      setStores(data);
    } catch (err) {
      console.error('Erro ao buscar lojas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const handleToggle = async (store: StoreTenant) => {
    const nextState = !store.ativo;
    const res = await toggleStoreStatus(store.id, nextState);
    if (res.success) {
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, ativo: nextState } : s))
      );
      showToast(
        nextState
          ? `Loja "${store.nome}" ativada e operando online!`
          : `Loja "${store.nome}" pausada na rede.`
      );
    } else {
      showToast(res.error || 'Erro ao alterar status da loja.', 'error');
    }
  };

  const filteredStores = stores.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nome.toLowerCase().includes(term) ||
      s.slug.toLowerCase().includes(term) ||
      s.whatsapp.includes(term) ||
      (s.dominio_proprio && s.dominio_proprio.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border text-xs flex items-center gap-2 shadow-2xl rounded-lg animate-fade-in ${
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Gestão de Lojas & Tenants
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisione todos os clientes da plataforma SaaS White-Label com controle de status e faturamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStores}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38BDF8]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/super-admin/nova-loja/"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Criar Nova Loja</span>
          </Link>
        </div>
      </div>

      {/* BUSCA */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar loja por nome, slug, domínio ou WhatsApp..."
          className="w-full bg-[#11141E] border border-slate-800 text-white text-xs pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors"
        />
      </div>

      {/* LISTAGEM DE LOJAS */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#11141E] border border-slate-800 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-[#38BDF8] mx-auto mb-2" />
          <span>Consultando base de lojas no Supabase...</span>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#11141E] border border-slate-800 rounded-xl space-y-2">
          <Store className="w-8 h-8 text-slate-600 mx-auto opacity-30" />
          <p className="text-sm font-semibold text-white">Nenhuma loja encontrada</p>
          <p className="text-[11px]">Crie sua primeira loja através do assistente de provisionamento em 60s.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStores.map((store) => {
            const modules = store.modulos_ativos || {};

            return (
              <div
                key={store.id}
                className="bg-[#11141E] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações da Loja */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-white">
                        {store.nome}
                      </h3>
                      {store.slug === 'leidy-boutique' ? (
                        <span className="text-[9px] bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 px-2 py-0.5 rounded font-bold uppercase">
                          Loja Modelo #1
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                          TENANT
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        Slug: <strong className="text-slate-200 font-mono">/{store.slug}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        WhatsApp: <strong className="text-slate-200">{store.whatsapp}</strong>
                      </span>
                      {store.email && (
                        <>
                          <span>•</span>
                          <span>E-mail: {store.email}</span>
                        </>
                      )}
                      {store.dominio_proprio && (
                        <>
                          <span>•</span>
                          <span className="text-[#38BDF8] font-mono">
                            Domínio: {store.dominio_proprio}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Módulos Ativos */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Módulos:
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          modules.frete_automatico
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50'
                        }`}
                      >
                        <Truck className="w-3 h-3" /> Frete Correios
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          modules.rastreio_whatsapp
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50'
                        }`}
                      >
                        <MessageCircle className="w-3 h-3" /> Rastreio WhatsApp
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          modules.recuperacao_carrinho
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3" /> Carrinho Abandonado
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          modules.checkout_transparente
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" /> Checkout Transparente
                      </span>
                    </div>
                  </div>

                  {/* Faturamento e Ações */}
                  <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase text-slate-500 block">
                        Faturamento
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-400 block">
                        {formatCurrency(store.total_faturamento || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {store.total_pedidos || 0} pedidos
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Alternar Status Online/Pausado */}
                      <button
                        onClick={() => handleToggle(store)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          store.ativo
                            ? 'bg-emerald-950/80 hover:bg-rose-950/60 text-emerald-300 hover:text-rose-300 border-emerald-800 hover:border-rose-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-emerald-950/60 hover:text-emerald-300'
                        }`}
                      >
                        {store.ativo ? '● Online' : '○ Pausada'}
                      </button>

                      <Link
                        href="/admin/"
                        className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                      >
                        Acessar Painel
                      </Link>

                      <Link
                        href={store.dominio_proprio ? `https://${store.dominio_proprio}` : `/${store.slug}/`}
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-[#38BDF8] transition-colors"
                        title="Ver vitrine pública"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
