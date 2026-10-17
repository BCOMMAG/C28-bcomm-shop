'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  Star,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Award,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { getAdminClients, AdminClientItem } from '@/lib/admin';
import { DEMO_ADMIN_CLIENTS } from '@/lib/mock-admin-data';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export default function AdminClientesPage() {
  const [clients, setClients] = useState<AdminClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todas');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getAdminClients(DEFAULT_TENANT_ID);
      if (data && data.length > 2) {
        setClients(data);
      } else {
        // Combina com a base de simulação VIP para demonstração completa de CRM
        const combined = [...(data || []), ...DEMO_ADMIN_CLIENTS];
        const unique = combined.filter((v, i, a) => a.findIndex((t) => t.telefone === v.telefone) === i);
        setClients(unique);
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setClients(DEMO_ADMIN_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtragem
  const filteredClients = clients.filter((c) => {
    if (selectedTag === 'vip' && !c.isVIP && c.tag !== 'vip') return false;
    if (selectedTag === 'recorrente' && c.totalPedidos < 2 && c.tag !== 'recorrente') return false;
    if (selectedTag === 'compradora' && c.totalPedidos === 0) return false;
    if (selectedTag === 'lead' && c.totalPedidos > 0) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.nome.toLowerCase().includes(term);
      const matchPhone = c.telefone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      const matchEmail = c.email?.toLowerCase().includes(term);
      const matchCity = c.cidade?.toLowerCase().includes(term);
      return matchName || matchPhone || matchEmail || matchCity;
    }
    return true;
  });

  const totalVIP = clients.filter((c) => c.isVIP).length;
  const totalCompradoras = clients.filter((c) => c.totalPedidos > 0).length;
  const totalGastoGeral = clients.reduce((acc, c) => acc + c.totalGasto, 0);
  const ltvMedio = totalCompradoras > 0 ? totalGastoGeral / totalCompradoras : 0;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
              Clientes & CRM WhatsApp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
              {filteredClients.length} Compradoras
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão do relacionamento e recompra: descubra suas clientes VIP, consulte o LTV acumulado e inicie conversas personalizadas no WhatsApp em 1 clique.
          </p>
        </div>

        <button
          onClick={fetchClients}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Atualizar Clientes</span>
        </button>
      </div>

      {/* CARDS DE KPI CRM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total de Compradoras</span>
          <span className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1 block">
            {clients.length}
          </span>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Clientes VIP (Gasto &gt; R$ 1k)</span>
          <span className="text-2xl font-extrabold text-amber-900 font-serif-luxury mt-1 block">
            {totalVIP}
          </span>
        </div>
        <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider block">LTV Médio por Cliente</span>
          <span className="text-2xl font-extrabold text-purple-900 font-serif-luxury mt-1 block">
            {formatCurrency(ltvMedio)}
          </span>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Total em Vendas da Base</span>
          <span className="text-2xl font-extrabold text-emerald-900 font-serif-luxury mt-1 block">
            {formatCurrency(totalGastoGeral)}
          </span>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, e-mail ou cidade..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Abas de Segmentação */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todas', label: 'Todas as Clientes' },
            { id: 'vip', label: 'Clientes VIP (Alto Valor)' },
            { id: 'recorrente', label: 'Clientes Recorrentes (2+ Compras)' },
            { id: 'compradora', label: 'Novas Compradoras' },
            { id: 'lead', label: 'Leads & Carrinho Abandonado' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTag(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tab.id
                  ? 'bg-slate-900 text-amber-400 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE CLIENTES CRM */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif-luxury">
              Base de Relacionamento & Recompra
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique no botão do WhatsApp para abrir conversa direta no aplicativo ou navegador.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <span>Consultando clientes no banco de dados...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Nenhuma cliente encontrada</p>
            <p className="text-xs">Tente ajustar o termo de busca ou a segmentação selecionada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cliente / Contato</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-center">Compras</th>
                  <th className="py-3 px-4 text-right">LTV (Total Investido)</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredClients.map((client, idx) => {
                  const cleanPhone = client.telefone.replace(/\D/g, '');

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {client.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{client.nome}</span>
                            <span className="block text-[11px] text-slate-500 font-normal">
                              {client.email || client.telefone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {client.cidade ? `${client.cidade} - ${client.estado || 'BR'}` : 'Brasil'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                        {client.totalPedidos}x
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency(client.totalGasto)}
                      </td>

                      <td className="py-3.5 px-4">
                        {client.isVIP ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Star className="w-3 h-3 fill-current text-amber-600" /> VIP
                          </span>
                        ) : client.totalPedidos >= 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <Award className="w-3 h-3 text-emerald-600" /> Recorrente
                          </span>
                        ) : client.totalPedidos === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            Nova Compradora
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Lead / Abandono
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {cleanPhone ? (
                          client.totalPedidos === 0 ? (
                            <a
                              href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                `Olá ${client.nome}! Tudo bem? Aqui é da Leidy Boutique. Vimos que você estava escolhendo peças lindas no nosso site! Ficou alguma dúvida sobre o tamanho ou caimento no corpo? Posso te ajudar a garantir antes que esgote!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors shadow-2xs"
                              title="Recuperar venda abandonada no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Recuperar Carrinho</span>
                            </a>
                          ) : (
                            <a
                              href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                `Olá ${client.nome}! Tudo bem? Aqui é da Leidy Boutique. Estamos com peças exclusivas na nova coleção que têm tudo a ver com o seu estilo!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp VIP</span>
                            </a>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
