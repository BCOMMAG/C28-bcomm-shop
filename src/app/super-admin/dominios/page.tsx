'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Link2,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Edit2,
  X,
  Copy
} from 'lucide-react';
import { getAllStores, updateStoreDomain, StoreTenant } from '@/lib/super-admin';

export default function SuperAdminDominiosPage() {
  const [stores, setStores] = useState<StoreTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Edição de Domínio
  const [editingStore, setEditingStore] = useState<StoreTenant | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast
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

  const handleOpenEdit = (store: StoreTenant) => {
    setEditingStore(store);
    setDomainInput(store.dominio_proprio || '');
  };

  const handleSaveDomain = async () => {
    if (!editingStore) return;
    setIsSaving(true);

    const cleanDomain = domainInput.trim() ? domainInput.trim().toLowerCase() : null;
    const res = await updateStoreDomain(editingStore.id, cleanDomain);

    if (res.success) {
      setStores((prev) =>
        prev.map((s) =>
          s.id === editingStore.id ? { ...s, dominio_proprio: cleanDomain } : s
        )
      );
      showToast(
        cleanDomain
          ? `Domínio "${cleanDomain}" vinculado à loja "${editingStore.nome}"!`
          : `Domínio customizado removido da loja "${editingStore.nome}".`
      );
      setEditingStore(null);
    } else {
      showToast(res.error || 'Erro ao salvar domínio.', 'error');
    }
    setIsSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Instrução de DNS copiada!');
  };

  const filteredStores = stores.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nome.toLowerCase().includes(term) ||
      s.slug.toLowerCase().includes(term) ||
      (s.dominio_proprio && s.dominio_proprio.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Gestão de Domínios Customizados
            </h1>
            <span className="text-[10px] bg-sky-950 text-[#38BDF8] border border-sky-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              DNS & Host Routing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vincule domínios próprios (`.com.br` ou `.com`) aos lojistas com resolução dinâmica via Middleware e Cloudflare Pages.
          </p>
        </div>

        <button
          onClick={fetchStores}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38BDF8]' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* GUIA DE APONTAMENTO DNS CLOUDFLARE */}
      <div className="bg-[#11141E] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
          <Server className="w-4 h-4" />
          <span>Instruções de Apontamento DNS para Lojistas com Domínio Próprio</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Para que o domínio do cliente aponte para a plataforma, basta adicionar uma entrada <strong>CNAME</strong> na zona DNS do cliente (ex: Registro.br, GoDaddy ou Cloudflare):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Tipo de Registro</span>
            <span className="font-mono text-white font-bold">CNAME</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Nome / Host</span>
            <span className="font-mono text-white font-bold">@ ou www</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Destino / Valor</span>
              <span className="font-mono text-[#38BDF8] font-bold">c28-leidyboutique.pages.dev</span>
            </div>
            <button
              onClick={() => copyToClipboard('c28-leidyboutique.pages.dev')}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Copiar valor"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BUSCA */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por loja, slug ou domínio..."
          className="w-full bg-[#11141E] border border-slate-800 text-white text-xs pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors"
        />
      </div>

      {/* TABELA DE DOMÍNIOS */}
      <div className="bg-[#11141E] border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Carregando domínios...
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nenhuma loja encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Loja / Marca</th>
                  <th className="py-3 px-4">Subdomínio Padrão</th>
                  <th className="py-3 px-4">Domínio Próprio Vinculado</th>
                  <th className="py-3 px-4">Status de Roteamento</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {store.nome}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      /{store.slug}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {store.dominio_proprio ? (
                        <span className="text-[#38BDF8] font-bold">
                          {store.dominio_proprio}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Nenhum (usa rota padrão)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {store.dominio_proprio ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Mapeado no Middleware
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800 rounded">
                          Rota Interna
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(store)}
                        className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-[#38BDF8]" />
                        <span>{store.dominio_proprio ? 'Alterar' : '+ Vincular'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: EDITAR DOMÍNIO */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141E] border border-slate-700 max-w-md w-full p-6 rounded-xl space-y-5 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Vincular Domínio Próprio
                  </h3>
                  <span className="text-xs text-slate-400">
                    {editingStore.nome} (/{editingStore.slug})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingStore(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold block">
                Nome do Domínio (sem http:// ou https://)
              </label>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Ex: minhaloja.com.br"
                className="w-full bg-slate-950/80 border border-slate-800 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#38BDF8]"
              />
              <p className="text-[11px] text-slate-500">
                Deixe em branco para remover o domínio próprio e utilizar apenas a rota padrão.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDomain}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Domínio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
