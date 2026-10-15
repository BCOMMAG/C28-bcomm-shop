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
  Award
} from 'lucide-react';
import { getAdminClients, AdminClientItem } from '@/lib/admin';
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
      setClients(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
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
    if (selectedTag !== 'todas' && c.tag !== selectedTag) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.nome.toLowerCase().includes(term);
      const matchPhone = c.telefone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      const matchEmail = c.email?.toLowerCase().includes(term);
      return matchName || matchPhone || matchEmail;
    }
    return true;
  });

  const totalVIP = clients.filter((c) => c.tag === 'vip').length;
  const totalCompradoras = clients.filter((c) => c.totalPedidos > 0).length;
  const totalGastoGeral = clients.reduce((acc, c) => acc + c.totalGasto, 0);
  const ltvMedio = totalCompradoras > 0 ? totalGastoGeral / totalCompradoras : 0;

  const getTagBadge = (tag: AdminClientItem['tag']) => {
    switch (tag) {
      case 'vip':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#DFBE76]/20 text-[#DFBE76] border border-[#DFBE76]/40 flex items-center gap-1 w-fit">
            <Star className="w-3 h-3 fill-current" /> Cliente VIP
          </span>
        );
      case 'recorrente':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <Award className="w-3 h-3" /> Recorrente
          </span>
        );
      case 'compradora':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/30 flex items-center gap-1 w-fit">
            <ShoppingBag className="w-3 h-3" /> Compradora
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3" /> Lead Carrinho
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Clientes & Leads (CRM VIP)
            </h1>
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 font-bold uppercase tracking-wider">
              WhatsApp First
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Base inteligente de clientes capturados pelo WhatsApp e checkout. Histórico de compras, valor total gasto (LTV) e canal direto de atendimento em 1 clique.
          </p>
        </div>

        <button
          onClick={fetchClients}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#DFBE76]' : ''}`} />
          <span>Sincronizar CRM</span>
        </button>
      </div>

      {/* CARDS DE RESUMO DO CRM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1A1918] border border-white/10 p-4">
          <span className="text-[11px] text-[#A8A29E] block">Total de Contatos</span>
          <span className="text-2xl font-bold font-serif-luxury text-white mt-1 block">
            {clients.length}
          </span>
        </div>

        <div className="bg-[#1A1918] border border-[#C5A059]/30 p-4">
          <span className="text-[11px] text-[#DFBE76] block">Clientes VIP (LTV &gt; R$ 500)</span>
          <span className="text-2xl font-bold font-serif-luxury text-[#DFBE76] mt-1 block">
            {totalVIP}
          </span>
        </div>

        <div className="bg-[#1A1918] border border-emerald-500/20 p-4">
          <span className="text-[11px] text-emerald-300 block">Compradoras Ativas</span>
          <span className="text-2xl font-bold font-serif-luxury text-white mt-1 block">
            {totalCompradoras}
          </span>
        </div>

        <div className="bg-[#1A1918] border border-sky-500/20 p-4">
          <span className="text-[11px] text-sky-300 block">LTV Médio por Cliente</span>
          <span className="text-2xl font-bold font-serif-luxury text-white mt-1 block">
            {formatCurrency(ltvMedio)}
          </span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            className="w-full bg-[#1A1918] border border-white/10 text-white text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-[#DFBE76] transition-colors"
          />
        </div>

        {/* Tags de Segmentação */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTag('todas')}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'todas'
                ? 'bg-[#DFBE76] text-black'
                : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
            }`}
          >
            Todas as Clientes ({clients.length})
          </button>
          <button
            onClick={() => setSelectedTag('vip')}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'vip'
                ? 'bg-[#DFBE76] text-black'
                : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
            }`}
          >
            💎 VIP ({clients.filter((c) => c.tag === 'vip').length})
          </button>
          <button
            onClick={() => setSelectedTag('recorrente')}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'recorrente'
                ? 'bg-[#DFBE76] text-black'
                : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
            }`}
          >
            🛍️ Recorrentes ({clients.filter((c) => c.tag === 'recorrente').length})
          </button>
          <button
            onClick={() => setSelectedTag('compradora')}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'compradora'
                ? 'bg-[#DFBE76] text-black'
                : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
            }`}
          >
            Primeira Compra ({clients.filter((c) => c.tag === 'compradora').length})
          </button>
          <button
            onClick={() => setSelectedTag('lead')}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'lead'
                ? 'bg-[#DFBE76] text-black'
                : 'bg-[#1A1918] text-[#A8A29E] hover:text-white border border-white/5'
            }`}
          >
            ⏳ Leads de Carrinho ({clients.filter((c) => c.tag === 'lead').length})
          </button>
        </div>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#DFBE76] mx-auto mb-2" />
          <span>Carregando contatos e histórico do Supabase...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#A8A29E] bg-[#1A1918] border border-white/5 space-y-2">
          <Users className="w-10 h-10 text-[#78716C] mx-auto opacity-30" />
          <p className="text-sm font-semibold text-white">Nenhum cliente encontrado</p>
          <p className="text-[11px]">As clientes aparecerão automaticamente conforme gerarem carrinhos ou compras no WhatsApp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const cleanPhone = client.telefone ? client.telefone.replace(/\D/g, '') : '';
            const initials = client.nome
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={client.id}
                className="bg-[#1A1918] border border-white/10 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#DFBE76]/40 transition-colors"
              >
                {/* Dados da Cliente */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A9833E] to-[#DFBE76] flex items-center justify-center font-bold text-xs text-black shadow-md shrink-0">
                    {initials || 'LB'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        {client.nome}
                      </h3>
                      {getTagBadge(client.tag)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A8A29E] mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#DFBE76]" />
                        {client.telefone}
                      </span>
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#78716C]" />
                          {client.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#78716C]">
                        <Calendar className="w-3 h-3" />
                        Última atividade: {formatDate(client.ultimaCompra)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas da Cliente & Ação WhatsApp */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase text-[#78716C] block">Total de Compras</span>
                    <span className="text-xs font-semibold text-white block">
                      {client.totalPedidos} pedidos
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase text-[#78716C] block">LTV (Total Gasto)</span>
                    <span className="text-sm font-bold font-serif-luxury text-[#DFBE76] block">
                      {formatCurrency(client.totalGasto)}
                    </span>
                  </div>

                  {/* Botão de WhatsApp Direto */}
                  {cleanPhone ? (
                    <a
                      href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                        `Olá ${client.nome}! Tudo bem? Aqui é da Leidy Boutique. Estamos com novidades exclusivas na nossa nova coleção que combinam muito com seu estilo!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir WhatsApp da cliente"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Conversar</span>
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
