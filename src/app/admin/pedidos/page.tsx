'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
  Copy,
  Edit3,
  X,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Download,
  Gift,
  Heart,
  LayoutGrid,
  List,
  Kanban,
  SlidersHorizontal,
  Layers,
  ShieldAlert,
  Lock,
  EyeOff,
  Eye,
  HelpCircle,
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react';
import {
  getAdminOrders,
  updateAdminOrderStatusWithStock,
  updateAdminOrderTracking
} from '@/lib/admin';
import { CustomerOrder, isOrderGift, getOrderGiftDetails } from '@/lib/orders';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { exportOrdersToCsv } from '@/lib/export';
import { useStore } from '@/context/StoreContext';
import { MembroEquipe, logStoreAuditAction } from '@/lib/team';

type ViewMode = 'cards' | 'lista' | 'kanban';
type PeriodFilter = 'todos' | 'hoje' | 'ontem' | '7d' | '30d' | 'mes_atual' | 'custom';
type PaymentFilter = 'todos' | 'pix' | 'cartao';
type SortOrder = 'recentes' | 'antigos' | 'maior_valor' | 'menor_valor';

export default function AdminPedidosPage() {
  const { currentTenant } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';
  const chavePix = currentTenant?.configuracoes_financeiras?.chave_pix || currentTenant?.whatsapp || '554197347601';
  const bancoPix = currentTenant?.configuracoes_financeiras?.pix_banco || 'Nu Pagamentos S.A. (Nubank)';
  const titularPix = currentTenant?.configuracoes_financeiras?.pix_titular || lojaNome;
  const tipoChavePix = currentTenant?.configuracoes_financeiras?.tipo_chave_pix || 'telefone';

  // Dados dos Pedidos
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Colaborador Ativo & Governança (RBAC)
  const [activeMember, setActiveMember] = useState<MembroEquipe | null>(null);

  // Visualização (Cards, Lista ou Kanban)
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Filtros Avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('todos');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('todos');
  const [onlyGifts, setOnlyGifts] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recentes');

  // Controle de Popovers
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Seleção em Massa (Bulk Actions)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<CustomerOrder['status']>('em_separacao');
  const [isUpdatingBulkStatus, setIsUpdatingBulkStatus] = useState(false);

  // Estados de Expansão (Modo Cards)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modais Individuais
  const [statusModalOrder, setStatusModalOrder] = useState<CustomerOrder | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<CustomerOrder['status']>('pendente');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  const [printModalOrder, setPrintModalOrder] = useState<CustomerOrder | null>(null);
  const [printType, setPrintType] = useState<'declaracao' | 'romaneio'>('declaracao');

  const [snippetMenuOrderId, setSnippetMenuOrderId] = useState<string | null>(null);

  // Toast de Notificação
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Carrega Colaborador Logado do LocalStorage para RBAC
  useEffect(() => {
    try {
      const savedColab = typeof window !== 'undefined' ? localStorage.getItem('leidy_admin_colaborador') : null;
      if (savedColab) {
        const parsed = JSON.parse(savedColab);
        setActiveMember(parsed);
      }
    } catch {
      setActiveMember(null);
    }
  }, []);

  // Permissões de Governança
  const canViewFinanceiro = useMemo(() => {
    if (!activeMember) return true; // Dono/admin padrão
    if (activeMember.cargo === 'dono') return true;
    return Boolean(activeMember.permissoes?.ver_financeiro);
  }, [activeMember]);

  const canExportOrders = useMemo(() => {
    if (!activeMember) return true;
    if (activeMember.cargo === 'dono' || activeMember.cargo === 'gerente') return true;
    return Boolean(activeMember.permissoes?.exportar_clientes);
  }, [activeMember]);

  const canCancelOrders = useMemo(() => {
    if (!activeMember) return true;
    return activeMember.cargo === 'dono' || activeMember.cargo === 'gerente';
  }, [activeMember]);

  // Recupera modo de visualização salvo
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('leidy_admin_pedidos_view_mode') as ViewMode | null;
      if (savedMode && ['cards', 'lista', 'kanban'].includes(savedMode)) {
        setViewMode(savedMode);
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('leidy_admin_pedidos_view_mode', mode);
    } catch {
      // Ignora erro
    }
  };

  // Carrega Pedidos do Supabase
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders(tenantId);
      setOrders(data || []);
      setSelectedOrderIds([]);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tenantId]);

  // Fechar popovers ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalhos Rápidos de Teclado (Power Users)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '1') {
        handleChangeViewMode('cards');
      } else if (e.key === '2') {
        handleChangeViewMode('lista');
      } else if (e.key === '3') {
        handleChangeViewMode('kanban');
      } else if (e.key === 'Escape') {
        setIsFilterPopoverOpen(false);
        setIsPeriodDropdownOpen(false);
        setSnippetMenuOrderId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Formatadores
  const formatCurrency = (val: number) => {
    if (!canViewFinanceiro) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificação de SLA de Atraso
  const getOrderSlaAlert = (order: CustomerOrder) => {
    if (!order.created_at) return null;
    if (order.status === 'entregue' || order.status === 'cancelado') return null;

    const createdTime = new Date(order.created_at).getTime();
    const now = Date.now();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);

    if (order.status === 'pendente' && diffHours > 24) {
      return {
        label: `${Math.floor(diffHours / 24)}d no WhatsApp`,
        severity: 'warning'
      };
    }

    if ((order.status === 'pago' || order.status === 'em_separacao') && diffHours > 48) {
      return {
        label: `${Math.floor(diffHours / 24)}d sem envio`,
        severity: 'danger'
      };
    }

    return null;
  };

  // Badge de Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entregue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600" /> Enviado
          </span>
        );
      case 'em_separacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Package className="w-3 h-3 text-sky-600" /> Em Separação
          </span>
        );
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pago
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Aguardando WhatsApp
          </span>
        );
    }
  };

  // Cálculo dos 6 KPIs Operacionais no Topo
  const kpis = useMemo(() => {
    const counts = {
      pendente: { count: 0, total: 0 },
      pago: { count: 0, total: 0 },
      em_separacao: { count: 0, total: 0 },
      enviado: { count: 0, total: 0 },
      entregue: { count: 0, total: 0 },
      cancelado: { count: 0, total: 0 }
    };

    orders.forEach((o) => {
      const st = o.status as keyof typeof counts;
      if (counts[st]) {
        counts[st].count += 1;
        counts[st].total += Number(o.total || 0);
      }
    });

    return counts;
  }, [orders]);

  // Alternar Status na Multi-seleção
  const toggleStatusFilter = (statusId: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(statusId)) {
        return prev.filter((s) => s !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  // Clique no Card de KPI: se já for o único selecionado, limpa; senão filtra apenas ele
  const handleKpiCardClick = (statusId: string) => {
    if (selectedStatuses.length === 1 && selectedStatuses[0] === statusId) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([statusId]);
    }
  };

  // Selecionar Apenas Operacionais (Pagos + Em Separação)
  const handleSelectOperacionais = () => {
    setSelectedStatuses(['pago', 'em_separacao']);
    setIsFilterPopoverOpen(false);
  };

  // Limpar Todos os Filtros
  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setSearchTerm('');
    setPeriodFilter('todos');
    setCustomStartDate('');
    setCustomEndDate('');
    setPaymentFilter('todos');
    setOnlyGifts(false);
    setIsFilterPopoverOpen(false);
  };

  // Contagem de Filtros Ativos
  const activeFiltersCount = useMemo(() => {
    let count = selectedStatuses.length;
    if (periodFilter !== 'todos') count += 1;
    if (paymentFilter !== 'todos') count += 1;
    if (onlyGifts) count += 1;
    return count;
  }, [selectedStatuses, periodFilter, paymentFilter, onlyGifts]);

  // Filtragem dos Pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Multi-seleção de Status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(o.status)) {
        return false;
      }

      // 2. Busca por Texto (Número, Cliente, Telefone, Rastreio ou Itens)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNum = o.numero_pedido?.toLowerCase().includes(term);
        const matchName = o.cliente_nome?.toLowerCase().includes(term);
        const matchPhone = o.cliente_telefone?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const matchTracking = o.codigo_rastreio?.toLowerCase().includes(term);
        const matchItems = (o.itens_pedido || []).some((item) =>
          item.nome_produto?.toLowerCase().includes(term)
        );
        if (!matchNum && !matchName && !matchPhone && !matchTracking && !matchItems) {
          return false;
        }
      }

      // 3. Filtro por Método de Pagamento
      if (paymentFilter !== 'todos' && o.metodo_pagamento !== paymentFilter) {
        return false;
      }

      // 4. Filtro por Presentes VIP
      if (onlyGifts && !isOrderGift(o)) {
        return false;
      }

      // 5. Filtro por Período
      if (periodFilter !== 'todos' && o.created_at) {
        const orderDate = new Date(o.created_at);
        const now = new Date();

        if (periodFilter === 'hoje') {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (periodFilter === 'ontem') {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            orderDate.getDate() === yesterday.getDate() &&
            orderDate.getMonth() === yesterday.getMonth() &&
            orderDate.getFullYear() === yesterday.getFullYear();
          if (!isYesterday) return false;
        } else if (periodFilter === '7d') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < sevenDaysAgo) return false;
        } else if (periodFilter === '30d') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < thirtyDaysAgo) return false;
        } else if (periodFilter === 'mes_atual') {
          const isThisMonth =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        } else if (periodFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(`${customStartDate}T00:00:00`);
            if (orderDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(`${customEndDate}T23:59:59`);
            if (orderDate > end) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // Ordenação
      if (sortOrder === 'recentes') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      if (sortOrder === 'antigos') {
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      }
      if (sortOrder === 'maior_valor') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (sortOrder === 'menor_valor') {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      return 0;
    });
  }, [orders, selectedStatuses, searchTerm, paymentFilter, onlyGifts, periodFilter, customStartDate, customEndDate, sortOrder]);

  // Gestão de Seleção em Massa (Checkboxes)
  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Alteração Individual de Status com Estoque & Auditoria
  const handleSaveStatus = async () => {
    if (!statusModalOrder || !selectedNewStatus) return;

    if (selectedNewStatus === 'cancelado' && !canCancelOrders) {
      showToast('Apenas administradores e gerentes podem cancelar vendas.', 'error');
      return;
    }

    setIsUpdatingStatus(true);
    const oldStatus = statusModalOrder.status;

    try {
      const res = await updateAdminOrderStatusWithStock(statusModalOrder.id, selectedNewStatus, tenantId);
      if (res.success) {
        showToast(`Status do pedido #${statusModalOrder.numero_pedido} atualizado para "${selectedNewStatus}"!`);
        setOrders((prev) =>
          prev.map((ord) =>
            ord.id === statusModalOrder.id ? { ...ord, status: selectedNewStatus } : ord
          )
        );

        // Registro de Auditoria
        await logStoreAuditAction(tenantId, {
          colaborador_id: activeMember?.id,
          colaborador_nome: activeMember?.nome || 'Admin',
          cargo: activeMember?.cargo || 'dono',
          acao: 'alterou_status_pedido',
          entidade: 'pedidos',
          entidade_id: statusModalOrder.id,
          motivo: `Status do pedido #${statusModalOrder.numero_pedido} alterado de ${oldStatus} para ${selectedNewStatus}`
        }).catch(() => {});

        setStatusModalOrder(null);
      } else {
        showToast(res.error || 'Erro ao alterar status.', 'error');
      }
    } catch {
      showToast('Falha na comunicação com o servidor ao atualizar status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Alteração Rápida Direta de Status (ex: na Linha da Tabela ou Avanço no Kanban)
  const handleQuickStatusChange = async (order: CustomerOrder, newStatus: CustomerOrder['status']) => {
    if (order.status === newStatus) return;

    if (newStatus === 'cancelado' && !canCancelOrders) {
      showToast('Apenas administradores e gerentes podem cancelar vendas.', 'error');
      return;
    }

    const oldStatus = order.status;
    const res = await updateAdminOrderStatusWithStock(order.id, newStatus, tenantId);

    if (res.success) {
      showToast(`Pedido #${order.numero_pedido} avançou para "${newStatus}"!`);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === order.id ? { ...ord, status: newStatus } : ord))
      );

      // Auditoria
      await logStoreAuditAction(tenantId, {
        colaborador_id: activeMember?.id,
        colaborador_nome: activeMember?.nome || 'Admin',
        cargo: activeMember?.cargo || 'dono',
        acao: 'alterou_status_pedido',
        entidade: 'pedidos',
        entidade_id: order.id,
        motivo: `Status rápido do pedido #${order.numero_pedido} alterado de ${oldStatus} para ${newStatus}`
      }).catch(() => {});
    } else {
      showToast(res.error || 'Erro ao atualizar status.', 'error');
    }
  };

  // Alteração de Status em Lote (Bulk Update)
  const handleSaveBulkStatus = async () => {
    if (selectedOrderIds.length === 0 || !bulkNewStatus) return;

    if (bulkNewStatus === 'cancelado' && !canCancelOrders) {
      showToast('Apenas administradores e gerentes podem cancelar vendas em lote.', 'error');
      return;
    }

    setIsUpdatingBulkStatus(true);
    let successCount = 0;

    for (const orderId of selectedOrderIds) {
      try {
        const res = await updateAdminOrderStatusWithStock(orderId, bulkNewStatus, tenantId);
        if (res.success) {
          successCount++;
        }
      } catch {
        // Continua os demais
      }
    }

    setOrders((prev) =>
      prev.map((ord) =>
        selectedOrderIds.includes(ord.id) ? { ...ord, status: bulkNewStatus } : ord
      )
    );

    // Auditoria do lote
    await logStoreAuditAction(tenantId, {
      colaborador_id: activeMember?.id,
      colaborador_nome: activeMember?.nome || 'Admin',
      cargo: activeMember?.cargo || 'dono',
      acao: 'alterou_status_lote',
      entidade: 'pedidos',
      motivo: `${successCount} pedido(s) alterado(s) em lote para status "${bulkNewStatus}"`
    }).catch(() => {});

    showToast(`${successCount} pedido(s) atualizado(s) em lote com sucesso!`);
    setIsUpdatingBulkStatus(false);
    setBulkStatusModalOpen(false);
    setSelectedOrderIds([]);
  };

  // Salvar Código de Rastreio dos Correios
  const handleSaveTracking = async () => {
    if (!trackingModalOrder) return;
    setIsUpdatingTracking(true);

    const code = trackingInput.trim().toUpperCase();
    const res = await updateAdminOrderTracking(trackingModalOrder.id, code);

    if (res.success) {
      showToast(`Código de rastreio ${code} registrado e pedido marcado como Enviado!`);
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === trackingModalOrder.id
            ? {
                ...ord,
                codigo_rastreio: code || undefined,
                status: code ? 'enviado' : 'em_separacao'
              }
            : ord
        )
      );

      // Auditoria
      await logStoreAuditAction(tenantId, {
        colaborador_id: activeMember?.id,
        colaborador_nome: activeMember?.nome || 'Admin',
        cargo: activeMember?.cargo || 'dono',
        acao: 'atualizou_rastreio_pedido',
        entidade: 'pedidos',
        entidade_id: trackingModalOrder.id,
        motivo: `Rastreio do pedido #${trackingModalOrder.numero_pedido} atualizado para ${code}`
      }).catch(() => {});

      setTrackingModalOrder(null);
    } else {
      showToast(res.error || 'Erro ao salvar código de rastreamento.', 'error');
    }
    setIsUpdatingTracking(false);
  };

  // Exportar Pedidos Filtrados em Planilha CSV (Excel)
  const handleExportOrdersCsv = () => {
    if (!canExportOrders) {
      showToast('Seu perfil de acesso não possui permissão para exportar dados de clientes.', 'error');
      return;
    }

    const ordersToExport = selectedOrderIds.length > 0
      ? filteredOrders.filter((o) => selectedOrderIds.includes(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      showToast('Nenhum pedido para exportar no filtro atual.', 'warning');
      return;
    }

    const fileName = `pedidos_${lojaNome.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportOrdersToCsv(ordersToExport, fileName);
    showToast(`${ordersToExport.length} pedido(s) exportado(s) para CSV com sucesso!`);
  };

  // Copiar Texto para Área de Transferência
  const copyToClipboard = (text: string, msg: string = 'Copiado para a área de transferência!') => {
    navigator.clipboard.writeText(text);
    showToast(msg);
  };

  return (
    <div className="space-y-4">
      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl animate-fade-in border ${
            feedbackToast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-slate-700'
              : feedbackToast.type === 'warning'
              ? 'bg-amber-900 text-amber-200 border-amber-600'
              : 'bg-rose-900 text-rose-200 border-rose-600'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : feedbackToast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* 1. CARDS DE REFERÊNCIA OPERACIONAL NO TOPO (KPIS INTERATIVOS COM SIGILO RBAC) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            id: 'pendente',
            label: 'Aguardando WhatsApp',
            icon: Clock,
            count: kpis.pendente.count,
            total: kpis.pendente.total,
            bgLight: 'bg-amber-50/70',
            border: 'border-amber-200',
            activeBorder: 'ring-2 ring-amber-500 border-amber-500',
            text: 'text-amber-800',
            iconColor: 'text-amber-600'
          },
          {
            id: 'pago',
            label: 'Pagos Confirmados',
            icon: CheckCircle2,
            count: kpis.pago.count,
            total: kpis.pago.total,
            bgLight: 'bg-emerald-50/70',
            border: 'border-emerald-200',
            activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
            text: 'text-emerald-800',
            iconColor: 'text-emerald-600'
          },
          {
            id: 'em_separacao',
            label: 'Em Separação',
            icon: Package,
            count: kpis.em_separacao.count,
            total: kpis.em_separacao.total,
            bgLight: 'bg-sky-50/70',
            border: 'border-sky-200',
            activeBorder: 'ring-2 ring-sky-500 border-sky-500',
            text: 'text-sky-800',
            iconColor: 'text-sky-600'
          },
          {
            id: 'enviado',
            label: 'Enviados (Correios)',
            icon: Truck,
            count: kpis.enviado.count,
            total: kpis.enviado.total,
            bgLight: 'bg-indigo-50/70',
            border: 'border-indigo-200',
            activeBorder: 'ring-2 ring-indigo-500 border-indigo-500',
            text: 'text-indigo-800',
            iconColor: 'text-indigo-600'
          },
          {
            id: 'entregue',
            label: 'Entregues',
            icon: CheckCircle2,
            count: kpis.entregue.count,
            total: kpis.entregue.total,
            bgLight: 'bg-teal-50/70',
            border: 'border-teal-200',
            activeBorder: 'ring-2 ring-teal-500 border-teal-500',
            text: 'text-teal-800',
            iconColor: 'text-teal-600'
          },
          {
            id: 'cancelado',
            label: 'Cancelados',
            icon: AlertCircle,
            count: kpis.cancelado.count,
            total: kpis.cancelado.total,
            bgLight: 'bg-rose-50/70',
            border: 'border-rose-200',
            activeBorder: 'ring-2 ring-rose-500 border-rose-500',
            text: 'text-rose-800',
            iconColor: 'text-rose-600'
          }
        ].map((kpi) => {
          const isSelected = selectedStatuses.includes(kpi.id);
          const Icon = kpi.icon;

          return (
            <button
              key={kpi.id}
              onClick={() => handleKpiCardClick(kpi.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs relative ${
                kpi.bgLight
              } ${isSelected ? kpi.activeBorder : `${kpi.border} hover:border-slate-400`}`}
              title={`Filtrar apenas ${kpi.label}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              )}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${kpi.iconColor}`} />
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {kpi.count}
                </span>
                <span className="text-[11px] font-bold text-slate-600 truncate">
                  {formatCurrency(kpi.total)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. BARRA DE FERRAMENTAS COMPACTA EM LINHA ÚNICA (SINGLE-LINE TOOLBAR) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        {/* Campo de Busca Rápida */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pedido (#LB-2026), cliente, telefone, rastreio ou peça... (Tecle /)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-8 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botão Popover de Filtros Avançados (Multi-seleção de Status, Pagamento e Presentes) */}
        <div className="relative" ref={filterPopoverRef}>
          <button
            onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Popover Deslizante de Filtros */}
          {isFilterPopoverOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-40 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  Filtrar Pedidos
                </span>
                <button
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Limpar Todos
                </button>
              </div>

              {/* Status Multi-seleção */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Status do Pedido ({selectedStatuses.length > 0 ? selectedStatuses.length : 'Todos'})
                  </label>
                  <button
                    onClick={handleSelectOperacionais}
                    className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Apenas Operacionais
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'pendente', label: 'Aguardando WhatsApp' },
                    { id: 'pago', label: 'Pagos' },
                    { id: 'em_separacao', label: 'Em Separação' },
                    { id: 'enviado', label: 'Enviados' },
                    { id: 'entregue', label: 'Entregues' },
                    { id: 'cancelado', label: 'Cancelados' }
                  ].map((st) => {
                    const checked = selectedStatuses.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        onClick={() => toggleStatusFilter(st.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                          checked
                            ? 'bg-amber-50 border-amber-400 font-bold text-amber-950'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{st.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filtro por Método de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  {[
                    { id: 'todos', label: 'Todas' },
                    { id: 'pix', label: 'PIX' },
                    { id: 'cartao', label: 'Cartão' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPaymentFilter(p.id as PaymentFilter)}
                      className={`py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        paymentFilter === p.id
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Exclusivo de Presentes VIP */}
              <div className="pt-2 border-t border-slate-100">
                <label
                  onClick={() => setOnlyGifts(!onlyGifts)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    onlyGifts
                      ? 'bg-amber-50 border-amber-400 font-bold text-amber-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <span className="block font-bold">Apenas Presentes VIP 🎁</span>
                    <span className="text-[10px] text-slate-500 block">
                      Pedidos com embalagem nobre e dedicatória
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyGifts}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {filteredOrders.length} pedido(s) encontrado(s)
                </span>
                <button
                  onClick={() => setIsFilterPopoverOpen(false)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Ver Resultados
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown de Filtro por Período */}
        <div className="relative" ref={periodDropdownRef}>
          <button
            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              periodFilter !== 'todos'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {periodFilter === 'todos' && 'Todo Período'}
              {periodFilter === 'hoje' && 'Hoje'}
              {periodFilter === 'ontem' && 'Ontem'}
              {periodFilter === '7d' && 'Últimos 7 dias'}
              {periodFilter === '30d' && 'Últimos 30 dias'}
              {periodFilter === 'mes_atual' && 'Este Mês'}
              {periodFilter === 'custom' && 'Personalizado'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Menu Dropdown de Períodos */}
          {isPeriodDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {[
                { id: 'todos', label: 'Todo o Histórico' },
                { id: 'hoje', label: 'Hoje' },
                { id: 'ontem', label: 'Ontem' },
                { id: '7d', label: 'Últimos 7 dias' },
                { id: '30d', label: 'Últimos 30 dias' },
                { id: 'mes_atual', label: 'Este Mês' },
                { id: 'custom', label: 'Período Personalizado...' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPeriodFilter(p.id as PeriodFilter);
                    if (p.id !== 'custom') setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    periodFilter === p.id
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{p.label}</span>
                  {periodFilter === p.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}

              {/* Campos de Data Customizada */}
              {periodFilter === 'custom' && (
                <div className="pt-2 border-t border-slate-100 p-2 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setIsPeriodDropdownOpen(false)}
                    className="w-full mt-1 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
                  >
                    Aplicar Datas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chip Rápido de Presentes VIP */}
        <button
          onClick={() => setOnlyGifts(!onlyGifts)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            onlyGifts
              ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-2xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Filtrar pedidos com embalagem para presente VIP"
        >
          <Gift className={`w-3.5 h-3.5 ${onlyGifts ? 'text-amber-700' : 'text-slate-400'}`} />
          <span className="hidden md:inline">Presentes VIP</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Botão Exportar Planilha (CSV) */}
        <button
          onClick={handleExportOrdersCsv}
          disabled={!canExportOrders}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
            canExportOrders
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title={
            canExportOrders
              ? 'Exportar pedidos filtrados para planilha CSV compatível com Excel'
              : 'Seu perfil de acesso não possui permissão para exportar dados'
          }
        >
          {canExportOrders ? (
            <Download className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden md:inline">Exportar CSV</span>
          <span className="md:hidden">CSV</span>
        </button>

        {/* Botão Atualizar Pedidos */}
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          title="Atualizar listagem de pedidos do Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
          <span className="hidden md:inline">Atualizar</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Alternador de Modos de Visualização (Cards, Lista e Kanban) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto shrink-0">
          <button
            onClick={() => handleChangeViewMode('cards')}
            className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Modo Cards Detalhados (Atalho 1)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleChangeViewMode('lista')}
            className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'lista'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Modo Tabela / Lista Compacta (Atalho 2)"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleChangeViewMode('kanban')}
            className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Modo Kanban de Expedição (Atalho 3)"
          >
            <Kanban className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAGS DE FILTROS ATIVOS (SE HOUVER) */}
      {(selectedStatuses.length > 0 || periodFilter !== 'todos' || paymentFilter !== 'todos' || onlyGifts || searchTerm) && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtros:</span>

          {selectedStatuses.map((st) => (
            <span
              key={st}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-[11px]"
            >
              Status: {st}
              <button
                onClick={() => toggleStatusFilter(st)}
                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {periodFilter !== 'todos' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px]">
              Período: {periodFilter}
              <button
                onClick={() => setPeriodFilter('todos')}
                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {paymentFilter !== 'todos' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px]">
              Pagamento: {paymentFilter.toUpperCase()}
              <button
                onClick={() => setPaymentFilter('todos')}
                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {onlyGifts && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
              🎁 Presentes VIP
              <button
                onClick={() => setOnlyGifts(false)}
                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearAllFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline ml-2 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* 4. CONTEÚDO PRINCIPAL (MODO CARDS, LISTA OU KANBAN) */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
          <span>Consultando base de pedidos no Supabase...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Nenhum pedido encontrado</p>
          <p className="text-xs">Tente ajustar a busca ou remover os filtros de status selecionados.</p>
          <button
            onClick={handleClearAllFilters}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ======================================================== */
        /* MODO 1: CARDS DETALHADOS (VISUAL RICO & EXPANDIDO)        */
        /* ======================================================== */
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
            const items = order.itens_pedido || [];
            const giftDetails = getOrderGiftDetails(order);
            const slaAlert = getOrderSlaAlert(order);
            const isSelected = selectedOrderIds.includes(order.id);

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-2xs hover:border-amber-400 transition-all ${
                  isSelected ? 'ring-2 ring-amber-500 border-amber-500' : giftDetails.isGift ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                {/* Linha Resumo do Card */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Checkbox de Seleção em Massa */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOrder(order.id)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-sm font-extrabold text-amber-800 tracking-wide block">
                          #{order.numero_pedido}
                        </span>
                        {giftDetails.isGift && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <Gift className="w-2.5 h-2.5 text-amber-700" /> Presente VIP
                          </span>
                        )}
                        {slaAlert && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slaAlert.severity === 'danger'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <Clock className="w-2.5 h-2.5" /> {slaAlert.label}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {order.cliente_nome || 'Cliente'}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {order.cliente_telefone || '-'}
                      </span>
                    </div>

                    <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatCurrency(Number(order.total || 0))}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {order.metodo_pagamento === 'pix' ? 'PIX Instantâneo' : 'Cartão de Crédito'}
                      </span>
                    </div>

                    <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Ações Rápidas do Card */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botão de WhatsApp com Snippets Rápidos */}
                    {cleanPhone && (
                      <div className="relative">
                        <button
                          onClick={() => setSnippetMenuOrderId(snippetMenuOrderId === order.id ? null : order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                          title="Opções de mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                          <ChevronDown className="w-3 h-3 text-emerald-600" />
                        </button>

                        {/* Dropdown de Snippets */}
                        {snippetMenuOrderId === order.id && (
                          <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-30 space-y-1 animate-fade-in text-left">
                            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                              Mensagens Rápidas no WhatsApp
                            </span>
                            <a
                              href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                `Olá ${order.cliente_nome}! Aqui é da ${lojaNome} referente ao seu pedido #${order.numero_pedido}. Como podemos te ajudar?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setSnippetMenuOrderId(null)}
                              className="block p-2 text-xs rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                            >
                              <strong className="block text-slate-900">1. Atendimento Geral</strong>
                              <span className="text-[11px] text-slate-500">Tirar dúvidas e suporte</span>
                            </a>
                            <a
                              href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                `Olá ${order.cliente_nome}! Confirmamos o pagamento do seu pedido #${order.numero_pedido} na ${lojaNome}. Suas peças já estão em separação no estoque!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setSnippetMenuOrderId(null)}
                              className="block p-2 text-xs rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                            >
                              <strong className="block text-slate-900">2. Confirmar Pagamento</strong>
                              <span className="text-[11px] text-slate-500">Avisar que o PIX foi validado</span>
                            </a>
                            {order.codigo_rastreio && (
                              <a
                                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                  `Olá ${order.cliente_nome}! Sua encomenda da ${lojaNome} foi postada! Código de rastreamento dos Correios: ${order.codigo_rastreio}. Acompanhe pelo link: https://rastreamento.correios.com.br/app/index.php?codigo=${order.codigo_rastreio}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setSnippetMenuOrderId(null)}
                                className="block p-2 text-xs rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                              >
                                <strong className="block text-slate-900">3. Enviar Rastreio Correios</strong>
                                <span className="text-[11px] text-slate-500">Código {order.codigo_rastreio}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botão de Expedição / Impressão */}
                    <button
                      onClick={() => {
                        setPrintModalOrder(order);
                        setPrintType('declaracao');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Imprimir Declaração de Conteúdo ou Romaneio de Separação"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Expedição</span>
                    </button>

                    {/* Botão Alterar Status */}
                    <button
                      onClick={() => {
                        setStatusModalOrder(order);
                        setSelectedNewStatus(order.status);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Status</span>
                    </button>

                    {/* Botão Expandir Detalhes */}
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                      title={isExpanded ? 'Recolher detalhes' : 'Ver itens e entrega'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Área Expandida (Detalhes dos Itens, Entrega e Rastreio) */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Coluna 1: Peças Compradas */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Peças no Pedido ({items.length})
                        </span>
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200"
                            >
                              <div className="relative w-12 h-14 bg-slate-100 rounded overflow-hidden shrink-0">
                                {item.imagem_url ? (
                                  <Image
                                    src={item.imagem_url}
                                    alt={item.nome_produto}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                    Peça
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-900 block truncate">
                                  {item.nome_produto}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Tam: <strong className="text-slate-700">{item.tamanho}</strong> &bull; Cor: <strong className="text-slate-700">{item.cor}</strong> &bull; Qtd: <strong className="text-slate-700">{item.quantidade}x</strong>
                                </span>
                              </div>
                              <span className="text-xs font-extrabold text-slate-900">
                                {formatCurrency(item.preco_unitario * item.quantidade)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coluna 2: Dados de Entrega e Rastreio */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Endereço de Envio & Logística
                        </span>

                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-800">
                                {order.endereco_entrega?.logradouro}, {order.endereco_entrega?.numero}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {order.endereco_entrega?.bairro} &bull; {order.endereco_entrega?.cidade} - {order.endereco_entrega?.uf || 'BR'}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500">
                                CEP: {order.endereco_entrega?.cep}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Rastreamento Correios */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Código de Rastreio (Correios / Melhor Envio)
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {order.codigo_rastreio || 'Ainda não informado'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setTrackingModalOrder(order);
                              setTrackingInput(order.codigo_rastreio || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            {order.codigo_rastreio ? 'Alterar Código' : '+ Adicionar Rastreio'}
                          </button>
                        </div>

                        {/* Card de Embalagem para Presente VIP */}
                        {giftDetails.isGift && (
                          <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5">
                                <Gift className="w-4 h-4 text-amber-700" />
                                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                                  Embalagem para Presente VIP
                                </span>
                                {giftDetails.fee !== undefined && giftDetails.fee > 0 && (
                                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                    + {formatCurrency(giftDetails.fee)}
                                  </span>
                                )}
                              </div>

                              {giftDetails.message && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(giftDetails.message || '', 'Dedicatória copiada!')}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-white px-2.5 py-1 bg-amber-200/80 hover:bg-amber-800 rounded transition-colors cursor-pointer"
                                  title="Copiar mensagem para transcrever no cartão"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar Dedicatória</span>
                                </button>
                              )}
                            </div>

                            {giftDetails.message ? (
                              <div className="bg-white/90 p-2.5 rounded border border-amber-200">
                                <span className="text-[10px] text-amber-800 font-bold uppercase block mb-1">
                                  Mensagem do Cartão Personalizado:
                                </span>
                                <p className="text-xs italic text-slate-800 font-serif leading-relaxed">
                                  &ldquo;{giftDetails.message}&rdquo;
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-800 italic">
                                A cliente solicitou a embalagem luxuosa de presente sem mensagem de dedicatória escrita.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Observações Gerais */}
                        {order.observacoes && !order.observacoes.startsWith('🎁') && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                            <strong className="text-slate-900 text-[10px] uppercase font-bold block">
                              Observações do Pedido:
                            </strong>
                            <p className="whitespace-pre-line text-[11px]">{order.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'lista' ? (
        /* ======================================================== */
        /* MODO 2: LISTA / TABELA COMPACTA (ALTA DENSIDADE)          */
        /* ======================================================== */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Peças</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rastreamento</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
                  const items = order.itens_pedido || [];
                  const giftDetails = getOrderGiftDetails(order);
                  const firstItem = items[0];
                  const slaAlert = getOrderSlaAlert(order);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Pedido */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-900">
                            #{order.numero_pedido}
                          </span>
                          {giftDetails.isGift && (
                            <span title="Pedido para Presente VIP" className="text-amber-600">
                              <Gift className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {slaAlert && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            slaAlert.severity === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {slaAlert.label}
                          </span>
                        )}
                      </td>

                      {/* Data / Hora */}
                      <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Cliente + WhatsApp Direto */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                          {order.cliente_nome || 'Cliente VIP'}
                        </span>
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>{order.cliente_telefone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Peças / Itens */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {firstItem?.imagem_url ? (
                            <div className="relative w-8 h-9 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <Image
                                src={firstItem.imagem_url}
                                alt={firstItem.nome_produto}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">
                              Peça
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                              {items.length === 1 ? firstItem?.nome_produto : `${firstItem?.nome_produto || 'Peças'} +${items.length - 1}`}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {items.reduce((acc, i) => acc + (i.quantidade || 1), 0)} un.
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {formatCurrency(Number(order.total || 0))}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          {order.metodo_pagamento === 'pix' ? 'PIX' : 'Cartão'}
                        </span>
                      </td>

                      {/* Status com Dropdown Inline */}
                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleQuickStatusChange(order, e.target.value as CustomerOrder['status'])
                          }
                          className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold p-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="pendente">Aguardando WhatsApp</option>
                          <option value="pago">Pago</option>
                          <option value="em_separacao">Em Separação</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregue">Entregue</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Rastreamento */}
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        {order.codigo_rastreio ? (
                          <a
                            href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.codigo_rastreio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center gap-1"
                            title="Acompanhar no site dos Correios"
                          >
                            <span>{order.codigo_rastreio}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              setTrackingModalOrder(order);
                              setTrackingInput('');
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer"
                          >
                            + Rastreio
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPrintModalOrder(order);
                              setPrintType('declaracao');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Imprimir Expedição / Romaneio"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setStatusModalOrder(order);
                              setSelectedNewStatus(order.status);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Alterar Status Completo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* MODO 3: KANBAN OPERACIONAL (ESTEIRA POR COLUNAS)          */
        /* ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {[
            { id: 'pendente', label: 'Aguardando WhatsApp', next: 'pago', color: 'border-amber-400 bg-amber-50/40 text-amber-900' },
            { id: 'pago', label: 'Pagos Confirmados', next: 'em_separacao', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900' },
            { id: 'em_separacao', label: 'Em Separação', next: 'enviado', color: 'border-sky-400 bg-sky-50/40 text-sky-900' },
            { id: 'enviado', label: 'Enviados (Correios)', next: 'entregue', color: 'border-indigo-400 bg-indigo-50/40 text-indigo-900' },
            { id: 'entregue', label: 'Entregues', next: null, color: 'border-teal-400 bg-teal-50/40 text-teal-900' }
          ].map((column) => {
            const columnOrders = filteredOrders.filter((o) => o.status === column.id);
            const columnTotal = columnOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

            return (
              <div
                key={column.id}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col min-h-[480px] shadow-2xs"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {column.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700">
                      {columnOrders.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {formatCurrency(columnTotal)}
                  </span>
                </div>

                {/* Cards na Coluna */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[650px] pr-0.5">
                  {columnOrders.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl">
                      Nenhum pedido nesta fase
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const cleanPhone = (order.cliente_telefone || '').replace(/\D/g, '');
                      const items = order.itens_pedido || [];
                      const giftDetails = getOrderGiftDetails(order);

                      return (
                        <div
                          key={order.id}
                          className={`bg-white border rounded-xl p-3 shadow-2xs space-y-2 hover:border-amber-400 transition-all ${
                            giftDetails.isGift ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                          }`}
                        >
                          {/* Topo do mini-card */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-extrabold text-amber-800">
                              #{order.numero_pedido}
                            </span>
                            {giftDetails.isGift && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                <Gift className="w-2.5 h-2.5 text-amber-700" /> Presente
                              </span>
                            )}
                          </div>

                          {/* Cliente e Valor */}
                          <div>
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {order.cliente_nome || 'Cliente VIP'}
                            </span>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className="font-extrabold text-slate-900 font-mono">
                                {formatCurrency(Number(order.total || 0))}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {items.reduce((acc, i) => acc + (i.quantidade || 1), 0)} pçs
                              </span>
                            </div>
                          </div>

                          {/* Ações do Mini Card */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/55${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}

                            {/* Botão de Avanço Rápido */}
                            {column.next && (
                              <button
                                onClick={() =>
                                  handleQuickStatusChange(
                                    order,
                                    column.next as CustomerOrder['status']
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[10px] cursor-pointer transition-colors"
                                title={`Avançar pedido para ${column.next}`}
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. BARRA FLUTUANTE DE AÇÕES EM MASSA (BULK ACTIONS TOOLBAR) */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 text-xs font-black flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200">
              {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          <button
            onClick={() => setBulkStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Alterar Status em Lote</span>
          </button>

          <button
            onClick={handleExportOrdersCsv}
            disabled={!canExportOrders}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              canExportOrders
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Selecionados</span>
          </button>

          <button
            onClick={() => setSelectedOrderIds([])}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* MODAL ALTERAR STATUS INDIVIDUAL */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Atualizar Pedido #{statusModalOrder.numero_pedido}
              </h3>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o novo status da venda. Se você marcar como <strong>&ldquo;Pago&rdquo;</strong>, o sistema dará baixa automática nas peças no estoque.
            </p>

            <div className="space-y-2">
              {[
                { id: 'pendente', label: 'Aguardando WhatsApp' },
                { id: 'pago', label: 'Pago (Confirmação Automática de Estoque)' },
                { id: 'em_separacao', label: 'Em Separação no Provador/Estoque' },
                { id: 'enviado', label: 'Enviado aos Correios / Transportadora' },
                { id: 'entregue', label: 'Entregue com Sucesso' },
                { id: 'cancelado', label: 'Cancelado (Estorno de Estoque Automático)' }
              ].map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedNewStatus === s.id
                      ? 'border-amber-500 bg-amber-50/50 font-bold text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={selectedNewStatus === s.id}
                    onChange={() => setSelectedNewStatus(s.id as CustomerOrder['status'])}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
              >
                {isUpdatingStatus ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR STATUS EM LOTE (BULK STATUS MODAL) */}
      {bulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Atualizar {selectedOrderIds.length} Pedidos em Lote
              </h3>
              <button
                onClick={() => setBulkStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o novo status que será aplicado simultaneamente para todos os {selectedOrderIds.length} pedidos selecionados:
            </p>

            <div className="space-y-2">
              {[
                { id: 'pago', label: 'Marcar como Pagos' },
                { id: 'em_separacao', label: 'Marcar como Em Separação' },
                { id: 'enviado', label: 'Marcar como Enviados aos Correios' },
                { id: 'entregue', label: 'Marcar como Entregues' },
                { id: 'cancelado', label: 'Cancelar Pedidos Selecionados' }
              ].map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    bulkNewStatus === s.id
                      ? 'border-amber-500 bg-amber-50/50 font-bold text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulkStatus"
                    checked={bulkNewStatus === s.id}
                    onChange={() => setBulkNewStatus(s.id as CustomerOrder['status'])}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBulkStatusModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBulkStatus}
                disabled={isUpdatingBulkStatus}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
              >
                {isUpdatingBulkStatus ? 'Atualizando...' : 'Confirmar em Lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CÓDIGO DE RASTREIO */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Rastreamento Correios #{trackingModalOrder.numero_pedido}
              </h3>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Código de Rastreamento (ex: QD123456789BR)
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Insira o código dos Correios..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTracking}
                disabled={isUpdatingTracking}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
              >
                {isUpdatingTracking ? 'Salvando...' : 'Salvar Código & Marcar Enviado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPEDIÇÃO & IMPRESSÃO (DECLARAÇÃO DE CONTEÚDO CORREIOS / ROMANEIO) */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-600" />
                  Expedição do Pedido #{printModalOrder.numero_pedido}
                </h3>
                <p className="text-xs text-slate-500">
                  Gere a Declaração de Conteúdo oficial dos Correios ou o Romaneio de Separação para embalagem.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Agora (A4)</span>
                </button>

                <button
                  onClick={() => setPrintModalOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SELETOR DE MODELO DE IMPRESSÃO */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPrintType('declaracao')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  printType === 'declaracao'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 Declaração de Conteúdo Oficial (Correios)
              </button>
              <button
                onClick={() => setPrintType('romaneio')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  printType === 'romaneio'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 Romaneio de Separação & Embalagem
              </button>
            </div>

            {/* DOCUMENTO PRÉ-VISUALIZAÇÃO / IMPRESSÃO */}
            <div className="border border-slate-300 rounded-xl p-6 bg-white text-slate-900 font-sans text-xs space-y-4 max-h-[60vh] overflow-y-auto">
              {printType === 'declaracao' ? (
                /* MODELO OFICIAL DE DECLARAÇÃO DE CONTEÚDO DOS CORREIOS */
                <div className="space-y-4 font-mono">
                  <div className="text-center border-b border-slate-300 pb-3">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider">
                      DECLARAÇÃO DE CONTEÚDO
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Conforme Portaria dos Correios & Legislação Postal Brasileira
                    </p>
                  </div>

                  {/* REMETENTE E DESTINATÁRIO */}
                  <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3 text-[11px]">
                    <div className="space-y-1">
                      <strong className="block text-slate-900 uppercase">REMETENTE:</strong>
                      <p><strong>Nome/Razão:</strong> {lojaNome} Moda Feminina</p>
                      <p><strong>Chave / Identificador:</strong> {chavePix}</p>
                      <p><strong>Atendimento:</strong> {currentTenant?.whatsapp || '(41) 97347-601'}</p>
                      <p><strong>Cidade/UF:</strong> Curitiba - PR | CEP: 80000-000</p>
                    </div>

                    <div className="space-y-1 border-l border-slate-200 pl-4">
                      <strong className="block text-slate-900 uppercase">DESTINATÁRIO:</strong>
                      <p><strong>Nome:</strong> {printModalOrder.cliente_nome}</p>
                      <p><strong>Telefone:</strong> {printModalOrder.cliente_telefone || '-'}</p>
                      <p>
                        <strong>Endereço:</strong> {printModalOrder.endereco_entrega?.logradouro},{' '}
                        {printModalOrder.endereco_entrega?.numero}{' '}
                        {printModalOrder.endereco_entrega?.complemento || ''}
                      </p>
                      <p>
                        <strong>Bairro/Cidade:</strong> {printModalOrder.endereco_entrega?.bairro} -{' '}
                        {printModalOrder.endereco_entrega?.cidade}/{printModalOrder.endereco_entrega?.uf || 'BR'}
                      </p>
                      <p><strong>CEP:</strong> {printModalOrder.endereco_entrega?.cep}</p>
                    </div>
                  </div>

                  {/* DISCRIMINAÇÃO DOS ITENS */}
                  <div className="space-y-2">
                    <strong className="block text-[11px] uppercase">DISCRIMINAÇÃO DO CONTEÚDO:</strong>
                    <table className="w-full border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-left">
                          <th className="p-1.5 border-r border-slate-300">Item</th>
                          <th className="p-1.5 border-r border-slate-300">Conteúdo</th>
                          <th className="p-1.5 border-r border-slate-300">Grade / Cor</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Qtd</th>
                          <th className="p-1.5 text-right">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(printModalOrder.itens_pedido || []).map((it, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="p-1.5 border-r border-slate-300 font-bold">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-300">{it.nome_produto}</td>
                            <td className="p-1.5 border-r border-slate-300">{it.tamanho} / {it.cor}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center">{it.quantidade}</td>
                            <td className="p-1.5 text-right font-bold">
                              {formatCurrency(it.preco_unitario * it.quantidade)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan={3} className="p-1.5 text-right border-r border-slate-300">
                            TOTAL DAS MERCADORIAS:
                          </td>
                          <td className="p-1.5 text-center border-r border-slate-300">
                            {(printModalOrder.itens_pedido || []).reduce((acc, i) => acc + (i.quantidade || 1), 0)}
                          </td>
                          <td className="p-1.5 text-right">
                            {formatCurrency(Number(printModalOrder.total || 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* DECLARAÇÃO LEGAL */}
                  <div className="text-[9px] text-slate-600 border border-slate-300 p-2 leading-relaxed">
                    Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, não realizando com habitualidade ou em volume que caracterize intuito comercial operações de circulação de mercadorias. Sob as penas da lei, declaro que as informações acima são a expressão da verdade.
                  </div>

                  <div className="flex items-center justify-between pt-4 text-[10px]">
                    <span>Data: ____/____/2026</span>
                    <span>Assinatura do Emitente: ____________________________________</span>
                  </div>
                </div>
              ) : (
                /* MODELO DE ROMANEIO DE SEPARAÇÃO (PACKING LIST) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        ROMANEIO DE SEPARAÇÃO & EXPEDIÇÃO
                      </h2>
                      <span className="text-xs text-amber-700 font-bold">
                        Pedido #{printModalOrder.numero_pedido} &bull; Cliente: {printModalOrder.cliente_nome}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                      {getStatusBadge(printModalOrder.status)}
                    </span>
                  </div>

                  {/* CHECKLIST DE ITENS */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Peças a Separar no Estoque:
                    </span>
                    <div className="space-y-2">
                      {(printModalOrder.itens_pedido || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {it.nome_produto}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Cor: <strong className="text-slate-800">{it.cor}</strong> &bull; Tamanho: <strong className="text-slate-800">{it.tamanho}</strong> &bull; Qtd: <strong className="text-amber-800 font-bold">{it.quantidade} unidade(s)</strong>
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-mono font-bold text-slate-700">
                            {formatCurrency(it.preco_unitario * it.quantidade)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CHECKLIST DE QUALIDADE */}
                  <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 text-xs space-y-1.5">
                    <strong className="text-amber-900 block font-bold">
                      Checklist de Embalagem Boutique:
                    </strong>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="rounded text-amber-600" />
                        <span>Peças passadas e sem fiapos</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="rounded text-amber-600" />
                        <span>Perfume característico da boutique</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="rounded text-amber-600" />
                        <span>Cartão de agradecimento assinado</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="rounded text-amber-600" />
                        <span>Fita de cetim e papel seda</span>
                      </label>
                    </div>
                  </div>

                  {/* ALERTA DE EMBALAGEM PARA PRESENTE VIP */}
                  {isOrderGift(printModalOrder) && (
                    <div className="border-2 border-amber-400 bg-amber-50 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase">
                        <Gift className="w-4 h-4 text-amber-700" />
                        <span>Atenção Expedição: Pedido para Presente VIP!</span>
                      </div>
                      <div className="text-xs text-amber-950 space-y-1.5">
                        <p>• Utilizar caixa rígida exclusiva da boutique com papel de seda e laço de cetim dourado.</p>
                        {getOrderGiftDetails(printModalOrder).message ? (
                          <div className="bg-white p-2.5 rounded border border-amber-300">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">
                              Dedicatória a ser transcrita no cartão:
                            </span>
                            <p className="font-serif italic text-xs text-slate-800 leading-relaxed">
                              &ldquo;{getOrderGiftDetails(printModalOrder).message}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <p className="italic text-[11px] text-amber-800">
                            • Incluir cartão especial em branco no envelope para a cliente preencher.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ENDEREÇO DE ENVIO */}
                  <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                    <strong className="text-slate-800 block">Endereço de Destino:</strong>
                    <p className="text-slate-600">
                      {printModalOrder.cliente_nome} &bull; Tel: {printModalOrder.cliente_telefone || '-'}
                    </p>
                    <p className="text-slate-600">
                      {printModalOrder.endereco_entrega?.logradouro}, {printModalOrder.endereco_entrega?.numero}{' '}
                      {printModalOrder.endereco_entrega?.complemento || ''} &bull;{' '}
                      {printModalOrder.endereco_entrega?.bairro} &bull;{' '}
                      {printModalOrder.endereco_entrega?.cidade}/{printModalOrder.endereco_entrega?.uf || 'BR'}
                    </p>
                    <p className="font-mono text-slate-800 font-bold">
                      CEP: {printModalOrder.endereco_entrega?.cep}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setPrintModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
