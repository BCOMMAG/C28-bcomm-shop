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
  ArrowRight,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Heart,
  Save,
  ChevronDown,
  Gift,
  UserCheck
} from 'lucide-react';
import { getAdminClients, saveClientInternalNotes, AdminClientItem } from '@/lib/admin';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { useStore } from '@/context/StoreContext';

type SortOption = 'ltv' | 'pedidos' | 'recente' | 'nome';

export default function AdminClientesPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  const [activeColab, setActiveColab] = useState<{ nome: string; codigo?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('leidy_admin_colaborador');
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveColab({
          nome: parsed.nome || 'Equipe',
          codigo: parsed.codigo_vendedora || ''
        });
      }
    } catch {}
  }, []);

  const [clients, setClients] = useState<AdminClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<SortOption>('ltv');

  // Modal de Dossiê VIP da Cliente
  const [selectedClient, setSelectedClient] = useState<AdminClientItem | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingSize, setEditingSize] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Menu de WhatsApp Snippets por Linha
  const [activeWhatsappMenu, setActiveWhatsappMenu] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getAdminClients(tenantId);
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [tenantId]);

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

  // Abrir Dossiê da Cliente
  const handleOpenClientDossier = (client: AdminClientItem) => {
    setSelectedClient(client);
    setEditingNotes(client.notasInternas || '');
    setEditingSize(client.tamanhoHabitual || '');
  };

  // Salvar Notas Internas da Cliente
  const handleSaveNotes = async () => {
    if (!selectedClient?.id) return;

    setIsSavingNotes(true);
    try {
      const res = await saveClientInternalNotes(selectedClient.id, editingNotes, editingSize);
      if (res.success) {
        selectedClient.notasInternas = editingNotes;
        selectedClient.tamanhoHabitual = editingSize;
        showToast('Anotações da cliente atualizadas no Supabase!');
      } else {
        showToast(res.error || 'Erro ao salvar anotações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar notas.', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Montagem de Links de WhatsApp com Snippets Personalizados
  const getWhatsAppLink = (
    client: AdminClientItem,
    type: 'geral' | 'aniversario' | 'lancamento' | 'recuperacao' | 'posvenda'
  ) => {
    const cleanPhone = client.telefone.replace(/\D/g, '');
    let msg = '';

    const vendedoraNome = activeColab?.nome ? activeColab.nome.split(' ')[0] : null;
    const vendedoraCodigo = activeColab?.codigo ? `?v=${encodeURIComponent(activeColab.codigo)}` : '';
    const saudacao = vendedoraNome 
      ? `Olá ${client.nome}! Tudo bem? Aqui é a ${vendedoraNome} da ${lojaNome} 🤍` 
      : `Olá ${client.nome}! Tudo bem? Aqui é da ${lojaNome} 🤍`;

    const assinatura = vendedoraNome 
      ? `\n\nCom carinho,\n*${vendedoraNome}* | ${lojaNome} ✨`
      : `\n\nCom carinho,\nEquipe ${lojaNome} 🤍`;

    switch (type) {
      case 'aniversario':
        msg = `🎉 *Parabéns, ${client.nome}!* ✨\n\nNós da ${lojaNome} desejamos um novo ciclo repleto de realizações, saúde e muita elegância!\n\nPara celebrar o seu dia especial, preparamos um presente exclusivo: use o cupom *VIP15* e ganhe *15% de desconto* em qualquer peça da nossa nova coleção!\n\nConfira as novidades em: https://bcomm-shop.pages.dev/catalogo${vendedoraCodigo}${assinatura}`;
        break;
      case 'lancamento':
        msg = `${saudacao}\n\nAcabaram de chegar peças exclusivas da nova coleção em tecidos nobres (linho e alfaiataria fina)${
          client.tamanhoHabitual ? ` no seu tamanho habitual (*${client.tamanhoHabitual}*)` : ''
        }!\n\nSeparei a curadoria especial para você ver em primeira mão antes de esgotar:\n👉 https://bcomm-shop.pages.dev/catalogo${vendedoraCodigo ? `${vendedoraCodigo}&` : '?'}categoria=alfaiataria\n\nSe quiser que eu reserve alguma no seu provador, é só me avisar aqui! ✨${assinatura}`;
        break;
      case 'recuperacao':
        msg = `${saudacao}\n\nVimos que você começou a escolher peças lindas no nosso site! Ficou alguma dúvida sobre o tamanho ou caimento no corpo? Posso te ajudar a garantir antes que esgote! ✨${assinatura}`;
        break;
      case 'posvenda':
        msg = `${saudacao}\n\nPassando para saber se as peças do seu pedido chegaram perfeitamente e se o caimento ficou lindo no corpo! Ficamos à disposição caso precise de algo e será um prazer te atender novamente! 🤍${assinatura}`;
        break;
      default:
        msg = `${saudacao}\n\nComo posso te ajudar hoje? Posso te apresentar nosso catálogo ou tirar dúvidas sobre qualquer peça: https://bcomm-shop.pages.dev/catalogo${vendedoraCodigo}${assinatura}`;
    }

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Filtragem e Ordenação
  const filteredClients = clients
    .filter((c) => {
      if (selectedTag === 'vip' && !c.isVIP && c.tag !== 'vip') return false;
      if (selectedTag === 'recorrente' && c.totalPedidos < 2 && c.tag !== 'recorrente') return false;
      if (selectedTag === 'compradora' && c.totalPedidos === 0) return false;
      if (selectedTag === 'lead' && c.totalPedidos > 0) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = c.nome.toLowerCase().includes(term);
        const matchPhone = c.telefone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const matchEmail = c.email?.toLowerCase().includes(term);
        const matchCpf = c.cpf?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const matchCity = c.cidade?.toLowerCase().includes(term);
        return matchName || matchPhone || matchEmail || matchCpf || matchCity;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ltv') return b.totalGasto - a.totalGasto;
      if (sortBy === 'pedidos') return b.totalPedidos - a.totalPedidos;
      if (sortBy === 'recente') {
        const dateA = new Date(a.ultimoPedido || a.ultimaCompra || 0).getTime();
        const dateB = new Date(b.ultimoPedido || b.ultimaCompra || 0).getTime();
        return dateB - dateA;
      }
      return a.nome.localeCompare(b.nome);
    });

  const totalVIP = clients.filter((c) => c.isVIP).length;
  const totalCompradoras = clients.filter((c) => c.totalPedidos > 0).length;
  const totalGastoGeral = clients.reduce((acc, c) => acc + c.totalGasto, 0);
  const ltvMedio = totalCompradoras > 0 ? totalGastoGeral / totalCompradoras : 0;

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
              Clientes & CRM WhatsApp VIP
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {filteredClients.length} Filtradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão estratégica de relacionamento e recompra: acompanhe o LTV acumulado, acesse o dossiê de pedidos e acione mensagens exclusivas no WhatsApp em 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeColab && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Atendendo como: <strong className="font-bold text-amber-950">{activeColab.nome}</strong>{' '}
                {activeColab.codigo && (
                  <span className="font-mono text-[11px] text-amber-700 bg-amber-100/70 px-1 py-0.5 rounded">
                    cód: {activeColab.codigo}
                  </span>
                )}
              </span>
            </div>
          )}

          <button
            onClick={fetchClients}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Atualizar Clientes</span>
          </button>
        </div>
      </div>

      {/* CARDS DE KPI CRM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total na Base</span>
          <span className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1 block">
            {clients.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{totalCompradoras} clientes já compraram</span>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Clientes VIP (LTV &gt; R$ 1k)</span>
          <span className="text-2xl font-extrabold text-amber-900 font-serif-luxury mt-1 block">
            {totalVIP}
          </span>
          <span className="text-[11px] text-amber-700/80 mt-0.5 block">Ticket alto e alta fidelidade</span>
        </div>
        <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider block">LTV Médio por Cliente</span>
          <span className="text-2xl font-extrabold text-purple-900 font-serif-luxury mt-1 block">
            {formatCurrency(ltvMedio)}
          </span>
          <span className="text-[11px] text-purple-700/80 mt-0.5 block">Valor médio acumulado</span>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Faturamento da Base</span>
          <span className="text-2xl font-extrabold text-emerald-900 font-serif-luxury mt-1 block">
            {formatCurrency(totalGastoGeral)}
          </span>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Receita total gerada</span>
        </div>
      </div>

      {/* BARRA DE PESQUISA, FILTROS E ORDENAÇÃO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, WhatsApp, e-mail, CPF ou cidade..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs px-3 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ltv">Maior LTV (Total Investido)</option>
              <option value="pedidos">Mais Pedidos Feitos</option>
              <option value="recente">Última Compra Mais Recente</option>
              <option value="nome">Nome Alfabético (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Abas de Segmentação */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: 'todas', label: 'Todas as Clientes' },
            { id: 'vip', label: '⭐ Clientes VIP (Alto Valor)' },
            { id: 'recorrente', label: '🏅 Clientes Recorrentes (2+ Compras)' },
            { id: 'compradora', label: '🛍️ Novas Compradoras' },
            { id: 'lead', label: '⏳ Leads & Carrinho Abandonado' }
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
              Base de Relacionamento & Dossiê VIP
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em <strong>"Ver Dossiê"</strong> para visualizar histórico de pedidos e notas privadas, ou utilize os botões de ação rápida para WhatsApp.
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
                  <th className="py-3 px-4">Perfil & Selo</th>
                  <th className="py-3 px-4 text-right">Ação & WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredClients.map((client, idx) => {
                  const cleanPhone = client.telefone.replace(/\D/g, '');
                  const isMenuOpen = activeWhatsappMenu === (client.id || client.telefone);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cliente */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenClientDossier(client)}
                            className="w-8 h-8 rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                            title="Ver Dossiê VIP"
                          >
                            {client.nome.slice(0, 2).toUpperCase()}
                          </button>
                          <div>
                            <button
                              onClick={() => handleOpenClientDossier(client)}
                              className="font-bold text-slate-900 hover:text-amber-600 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{client.nome}</span>
                              <FileText className="w-3 h-3 text-slate-400 hover:text-amber-600" />
                            </button>
                            <span className="block text-[11px] text-slate-500 font-normal">
                              {client.email || client.telefone}
                            </span>
                            {client.tamanhoHabitual && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5">
                                Veste {client.tamanhoHabitual}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Localização */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {client.cidade ? `${client.cidade} - ${client.estado || 'BR'}` : 'Brasil'}
                          </span>
                        </div>
                      </td>

                      {/* Compras */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                          {client.totalPedidos}x
                        </span>
                      </td>

                      {/* LTV */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency(client.totalGasto)}
                      </td>

                      {/* Perfil & Selo */}
                      <td className="py-3.5 px-4">
                        {client.isVIP ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                            <Star className="w-3 h-3 fill-current text-amber-600" /> VIP Gold
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

                      {/* Ações Rápidas */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <button
                            onClick={() => handleOpenClientDossier(client)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Ver histórico de compras e anotações"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Dossiê</span>
                          </button>

                          {cleanPhone && (
                            <div className="relative">
                              <div className="inline-flex rounded-lg shadow-2xs">
                                <a
                                  href={
                                    client.totalPedidos === 0
                                      ? getWhatsAppLink(client, 'recuperacao')
                                      : getWhatsAppLink(client, 'geral')
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-l-lg border transition-colors ${
                                    client.totalPedidos === 0
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                  title="Iniciar conversa no WhatsApp"
                                >
                                  <MessageCircle className={`w-3.5 h-3.5 ${client.totalPedidos === 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                                  <span>{client.totalPedidos === 0 ? 'Recuperar' : 'WhatsApp'}</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveWhatsappMenu(isMenuOpen ? null : client.id || client.telefone)
                                  }
                                  className={`px-1.5 py-1.5 border-y border-r rounded-r-lg cursor-pointer ${
                                    client.totalPedidos === 0
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                  title="Escolher modelo de mensagem"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Menu Suspenso de Mensagens */}
                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 text-left text-xs animate-fade-in">
                                  <span className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Mensagens Prontas
                                  </span>
                                  <a
                                    href={getWhatsAppLink(client, 'aniversario')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveWhatsappMenu(null)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-slate-800 hover:text-amber-900 transition-colors"
                                  >
                                    <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>🎁 Parabéns + Cupom VIP15</span>
                                  </a>
                                  <a
                                    href={getWhatsAppLink(client, 'lancamento')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveWhatsappMenu(null)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-slate-800 hover:text-purple-900 transition-colors"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span>✨ Lançamentos no Tamanho</span>
                                  </a>
                                  <a
                                    href={getWhatsAppLink(client, 'posvenda')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveWhatsappMenu(null)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 transition-colors"
                                  >
                                    <Heart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>🤍 Pós-Venda Carinhoso</span>
                                  </a>
                                  {client.totalPedidos === 0 && (
                                    <a
                                      href={getWhatsAppLink(client, 'recuperacao')}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => setActiveWhatsappMenu(null)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-slate-800 hover:text-rose-900 transition-colors"
                                    >
                                      <ShoppingBag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      <span>🛒 Recuperação de Sacola</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: DOSSIÊ VIP COMPLETO DA CLIENTE */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Header do Dossiê */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between rounded-t-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-lg flex items-center justify-center shadow-lg">
                  {selectedClient.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-serif-luxury tracking-tight">
                      {selectedClient.nome}
                    </h2>
                    {selectedClient.isVIP && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        ⭐ VIP Gold
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-300 block">
                    {selectedClient.email || 'Sem e-mail informado'} • {selectedClient.telefone}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Dossiê */}
            <div className="p-6 space-y-6 text-xs text-slate-700 flex-1">
              {/* KPIs Comerciais da Cliente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">LTV Total</span>
                  <span className="text-lg font-extrabold text-slate-900 font-serif-luxury mt-0.5 block">
                    {formatCurrency(selectedClient.totalGasto)}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Compras</span>
                  <span className="text-lg font-extrabold text-slate-900 font-serif-luxury mt-0.5 block">
                    {selectedClient.totalPedidos} pedido(s)
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ticket Médio</span>
                  <span className="text-lg font-extrabold text-slate-900 font-serif-luxury mt-0.5 block">
                    {formatCurrency(selectedClient.ticketMedio)}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Última Compra</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {formatDate(selectedClient.ultimaCompra || selectedClient.ultimoPedido)}
                  </span>
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                  Dados de Contato & Localização
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">WhatsApp Oficial:</span>
                    <strong className="text-slate-800">{selectedClient.telefone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">E-mail:</span>
                    <strong className="text-slate-800">{selectedClient.email || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CPF:</span>
                    <strong className="text-slate-800">{selectedClient.cpf || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cidade / UF:</span>
                    <strong className="text-slate-800">
                      {selectedClient.cidade ? `${selectedClient.cidade} - ${selectedClient.estado || 'BR'}` : 'Brasil'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Preferências e Anotações Internas da Boutique */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                      Anotações Privadas & Preferências de Estilo
                    </span>
                  </div>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingNotes ? 'Salvando...' : 'Salvar Notas'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tamanho Habitual (Veste):
                    </label>
                    <input
                      type="text"
                      value={editingSize}
                      onChange={(e) => setEditingSize(e.target.value)}
                      placeholder="Ex: M / 38"
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notas Internas da Equipe:
                    </label>
                    <input
                      type="text"
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Ex: Prefere tons terrosos, linho e alfaiataria. Aniversário em 12 de novembro."
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Histórico Cronológico de Pedidos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Histórico de Pedidos ({selectedClient.pedidos?.length || 0})</span>
                  </span>
                </div>

                {(!selectedClient.pedidos || selectedClient.pedidos.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                    Nenhum pedido finalizado ainda (lead capturada no checkout).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedClient.pedidos.map((order, oIdx) => (
                      <div key={oIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              #{order.numeroPedido}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                order.status === 'entregue'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'enviado'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'pago' || order.status === 'em_separacao'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>

                        {/* Peças Compradas no Pedido */}
                        <div className="border-t border-slate-100 pt-2 space-y-1">
                          {order.itens?.map((it, itIdx) => (
                            <div key={itIdx} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>
                                • <strong>{it.nome}</strong> {it.cor && `(Cor: ${it.cor})`} {it.tamanho && `[Tam: ${it.tamanho}]`}
                              </span>
                              <span className="font-mono text-slate-800 font-semibold">
                                {it.quantidade}x ({formatCurrency(it.preco)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
              <span className="text-[11px] text-slate-400">
                ID da Cliente: <strong className="font-mono">{selectedClient.id || 'N/A'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppLink(selectedClient, 'geral')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Conversar no WhatsApp</span>
                </a>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
