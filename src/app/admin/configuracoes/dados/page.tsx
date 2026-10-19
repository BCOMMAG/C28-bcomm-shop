'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Package,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAdminClients } from '@/lib/admin';

export default function DataExportSettingsPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isExportingSales, setIsExportingSales] = useState(false);
  const [isExportingProducts, setIsExportingProducts] = useState(false);
  const [isExportingCustomers, setIsExportingCustomers] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper para disparar download de arquivo CSV no navegador
  const downloadCsv = (content: string, filename: string) => {
    // BOM UTF-8 para compatibilidade nativa com Microsoft Excel
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Exportação de Vendas / Contabilidade
  const handleExportSales = async () => {
    setIsExportingSales(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!pedidos || pedidos.length === 0) {
        showToast(`Nenhum pedido encontrado no período ${month}/${year}.`, 'error');
        return;
      }

      // Monta as linhas do CSV
      const headers = [
        'Numero Pedido',
        'Data',
        'Cliente Nome',
        'Cliente Telefone',
        'Forma Pagamento',
        'Subtotal (R$)',
        'Frete (R$)',
        'Desconto (R$)',
        'Total (R$)',
        'Status'
      ];

      const rows = pedidos.map((p: any) => [
        `"${p.numero_pedido || p.id?.slice(0, 8)}"`,
        `"${new Date(p.created_at).toLocaleDateString('pt-BR')}"`,
        `"${p.cliente_nome || 'Cliente'}"`,
        `"${p.cliente_telefone || ''}"`,
        `"${p.forma_pagamento || 'PIX'}"`,
        `"${Number(p.subtotal || 0).toFixed(2).replace('.', ',')}"`,
        `"${Number(p.valor_frete || 0).toFixed(2).replace('.', ',')}"`,
        `"${Number(p.desconto || 0).toFixed(2).replace('.', ',')}"`,
        `"${Number(p.total || 0).toFixed(2).replace('.', ',')}"`,
        `"${p.status || 'pendente'}"`
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      downloadCsv(csvContent, `vendas_contabilidade_${selectedMonth}.csv`);
      showToast(`Exportadas ${pedidos.length} vendas de ${month}/${year} com sucesso!`);
    } catch (err: any) {
      console.error('Erro na exportação de vendas:', err);
      showToast(err?.message || 'Falha ao exportar vendas.', 'error');
    } finally {
      setIsExportingSales(false);
    }
  };

  // 2. Exportação do Catálogo de Produtos
  const handleExportProducts = async () => {
    setIsExportingProducts(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', tenantId)
        .order('nome', { ascending: true });

      if (error) throw error;

      if (!produtos || produtos.length === 0) {
        showToast('Nenhum produto cadastrado para exportação.', 'error');
        return;
      }

      const headers = [
        'ID',
        'Nome do Produto',
        'Slug',
        'Preco Venda (R$)',
        'Preco Promocional (R$)',
        'Preco Custo (R$)',
        'Estoque Total',
        'Tecido',
        'Linha',
        'Status Ativo'
      ];

      const rows = produtos.map((p: any) => [
        `"${p.id}"`,
        `"${p.nome}"`,
        `"${p.slug}"`,
        `"${Number(p.preco || 0).toFixed(2).replace('.', ',')}"`,
        `"${p.preco_promocional ? Number(p.preco_promocional).toFixed(2).replace('.', ',') : ''}"`,
        `"${p.preco_custo ? Number(p.preco_custo).toFixed(2).replace('.', ',') : ''}"`,
        `"${p.estoque_total ?? 0}"`,
        `"${p.tecido || ''}"`,
        `"${p.linha || ''}"`,
        `"${p.ativo ? 'Ativo' : 'Inativo'}"`
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      downloadCsv(csvContent, `catalogo_produtos_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast(`Catálogo com ${produtos.length} produtos exportado com sucesso!`);
    } catch (err: any) {
      showToast(err?.message || 'Falha ao exportar catálogo.', 'error');
    } finally {
      setIsExportingProducts(false);
    }
  };

  // 3. Exportação da Base de Clientes / CRM
  const handleExportCustomers = async () => {
    setIsExportingCustomers(true);
    try {
      const clientes = await getAdminClients(tenantId);

      if (!clientes || clientes.length === 0) {
        showToast('Nenhum cliente cadastrado no momento.', 'error');
        return;
      }

      const headers = [
        'Nome',
        'Telefone WhatsApp',
        'Email',
        'Cidade',
        'Total Pedidos',
        'Total Gasto LTV (R$)',
        'Ticket Medio (R$)',
        'Data Cadastro'
      ];

      const rows = clientes.map((c: any) => [
        `"${c.nome || ''}"`,
        `"${c.telefone || ''}"`,
        `"${c.email || ''}"`,
        `"${c.cidade || ''}"`,
        `"${c.total_pedidos ?? 0}"`,
        `"${Number(c.total_gasto || 0).toFixed(2).replace('.', ',')}"`,
        `"${Number(c.ticket_medio || 0).toFixed(2).replace('.', ',')}"`,
        `"${c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''}"`
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      downloadCsv(csvContent, `base_clientes_crm_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast(`Base com ${clientes.length} clientes exportada com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao exportar clientes:', err);
      showToast(err?.message || 'Falha ao exportar clientes.', 'error');
    } finally {
      setIsExportingCustomers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* BLOCO 1: EXPORTAÇÃO CONTÁBIL MENSAL DE VENDAS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Relatório Contábil Mensal de Vendas (CSV)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Contabilidade
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Arquivo estruturado com todos os pedidos do mês para envio direto à assessoria contábil e apuração fiscal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Mês de Referência</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-start sm:justify-end">
            <button
              type="button"
              onClick={handleExportSales}
              disabled={isExportingSales}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingSales ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingSales ? 'Gerando Planilha...' : 'Baixar Planilha Contábil (CSV)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BLOCO 2: BACKUPS DO CATÁLOGO E BASE DE CLIENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Catálogo de Produtos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Backup do Catálogo de Produtos
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Exporta todos os produtos, preços de venda e de custo, saldo de estoque por variação e tecidos cadastrados.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportProducts}
            disabled={isExportingProducts}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isExportingProducts ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Download className="w-4 h-4 text-amber-400" />
            )}
            <span>{isExportingProducts ? 'Exportando...' : 'Exportar Catálogo em CSV'}</span>
          </button>
        </div>

        {/* Base de Clientes / CRM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Base de Clientes & CRM
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Planilha com nomes, telefones de WhatsApp, e-mails e localidade das clientes para campanhas de remarketing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCustomers}
            disabled={isExportingCustomers}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isExportingCustomers ? (
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            ) : (
              <Download className="w-4 h-4 text-sky-400" />
            )}
            <span>{isExportingCustomers ? 'Exportando...' : 'Exportar Base de Clientes em CSV'}</span>
          </button>
        </div>
      </div>

      {/* AVISO DE CONFORMIDADE LGPD */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800">Conformidade e Sigilo com a LGPD:</span>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            As planilhas exportadas contêm dados pessoais de clientes da Leidy Boutique. Certifique-se de armazená-las com segurança e utilizá-las exclusivamente para fins fiscais e de atendimento consentido.
          </p>
        </div>
      </div>
    </div>
  );
}
