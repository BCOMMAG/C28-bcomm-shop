'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  Eye,
  EyeOff,
  X,
  Copy,
  ArrowRight
} from 'lucide-react';
import {
  getAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponActive,
  deleteAdminCoupon,
  CouponItem,
  CreateCouponInput
} from '@/lib/coupons';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { useStore } from '@/context/StoreContext';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function AdminCuponsPage() {
  const { currentTenant } = useStore();
  const { t, locale, formatCurrency, currency } = useAdminI18n();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;
  const lojaNome = currentTenant?.nome || 'Minha Loja';

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'pausados'>('todos');

  // Modal de Criação de Cupom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'porcentagem' | 'fixo'>('porcentagem');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newMinOrderValue, setNewMinOrderValue] = useState('');
  const [newUsageLimit, setNewUsageLimit] = useState('500');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await getAdminCoupons(tenantId);
      setCoupons(data);
    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [tenantId]);

  const handleToggleActive = async (coupon: CouponItem) => {
    const nextState = !coupon.ativo;
    const res = await toggleAdminCouponActive(coupon.id, nextState);
    if (res.success) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, ativo: nextState } : c))
      );
      showToast(
        nextState
          ? `Cupom "${coupon.codigo}" ativado no checkout!`
          : `Cupom "${coupon.codigo}" pausado temporariamente.`
      );
    } else {
      showToast(res.error || 'Erro ao alterar status do cupom.', 'error');
    }
  };

  const handleDelete = async (coupon: CouponItem) => {
    if (!confirm(`Deseja realmente excluir o cupom "${coupon.codigo}"?`)) {
      return;
    }
    const res = await deleteAdminCoupon(coupon.id);
    if (res.success) {
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      showToast(`Cupom "${coupon.codigo}" excluído com sucesso!`);
    } else {
      showToast(res.error || 'Erro ao excluir cupom.', 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      showToast('Informe o código do cupom.', 'error');
      return;
    }
    if (!newDiscountValue.trim() || Number(newDiscountValue) <= 0) {
      showToast('Informe um valor de desconto válido.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCouponInput = {
        codigo: newCode.trim().toUpperCase(),
        tipo_desconto: newDiscountType,
        valor_desconto: Number(newDiscountValue),
        valor_minimo: newMinOrderValue.trim() ? Number(newMinOrderValue) : 0,
        limite_usos: newUsageLimit.trim() ? Number(newUsageLimit) : 1000,
        ativo: true
      };

      const res = await createAdminCoupon(payload, tenantId);
      if (res.success) {
        showToast(`Cupom "${payload.codigo}" criado com sucesso!`);
        setIsModalOpen(false);
        setNewCode('');
        setNewDiscountValue('');
        setNewMinOrderValue('');
        setNewUsageLimit('500');
        fetchCoupons();
      } else {
        showToast(res.error || 'Erro ao cadastrar cupom.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar cupom.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Código "${text}" copiado!`);
  };

  // Filtros
  const filteredCoupons = coupons.filter((c) => {
    if (statusFilter === 'ativos' && !c.ativo) return false;
    if (statusFilter === 'pausados' && c.ativo) return false;

    if (searchTerm.trim()) {
      return c.codigo.toLowerCase().includes(searchTerm.toLowerCase().trim());
    }
    return true;
  });

  const totalAtivos = coupons.filter((c) => c.ativo).length;
  const totalUsos = coupons.reduce((acc, c) => acc + (c.usos_atuais || 0), 0);

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
            <h1 className="admin-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              {locale === 'en' ? 'Coupons & Promotional Discounts' : locale === 'es' ? 'Cupones y Descuentos Promocionales' : 'Cupons & Campanhas Promocionais'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {locale === 'en' ? 'Real-time Validation' : locale === 'es' ? 'Validación en Tiempo Real' : 'Validação em Tempo Real'}
            </span>
          </div>
          <p className="admin-body text-xs text-slate-500 mt-1">
            {locale === 'en'
              ? `Create percentage or fixed discount codes (${currencySymbol}), set minimum order values and usage limits to boost checkout conversions.`
              : locale === 'es'
              ? `Crea códigos de descuento porcentuales o de valor fijo (${currencySymbol}), define valor mínimo de pedido y límites de uso.`
              : `Crie códigos de desconto percentuais ou em valor fixo (${currencySymbol}), defina valor mínimo de pedido e limite de utilização para impulsionar conversões.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="admin-btn-secondary px-3 py-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>{t.orders.toolbar.refresh}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="admin-btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'en' ? 'New Coupon' : locale === 'es' ? 'Nuevo Cupón' : 'Novo Cupom'}</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {locale === 'en' ? 'Total Coupons Created' : locale === 'es' ? 'Total de Cupones' : 'Total de Cupons Criados'}
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1 block">
            {coupons.length}
          </span>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            {locale === 'en' ? 'Active at Checkout' : locale === 'es' ? 'Activos en Checkout' : 'Cupons Ativos no Checkout'}
          </span>
          <span className="text-2xl font-extrabold text-emerald-900 font-serif-luxury mt-1 block">
            {totalAtivos}
          </span>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
            {locale === 'en' ? 'Total Redemptions' : locale === 'es' ? 'Total de Usos' : 'Total de Utilizações'}
          </span>
          <span className="text-2xl font-extrabold text-amber-900 font-serif-luxury mt-1 block">
            {totalUsos} {locale === 'en' ? 'uses' : locale === 'es' ? 'usos' : 'resgates'}
          </span>
        </div>
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={locale === 'en' ? 'Search by coupon code (e.g. WELCOME10, VIP15)...' : locale === 'es' ? 'Buscar por código de cupón (ej: BIENVENIDO10)...' : 'Buscar por código de cupom (ex: BEMVINDA10, VIP15)...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all uppercase"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'todos', label: locale === 'en' ? 'All Coupons' : locale === 'es' ? 'Todos los Cupones' : 'Todos os Cupons' },
            { id: 'ativos', label: locale === 'en' ? 'Active Only' : locale === 'es' ? 'Solo Activos' : 'Apenas Ativos' },
            { id: 'pausados', label: locale === 'en' ? 'Paused' : locale === 'es' ? 'Pausados' : 'Pausados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-amber-400 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE CUPONS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <span>{locale === 'en' ? 'Loading coupons...' : locale === 'es' ? 'Cargando cupones...' : 'Consultando cupons no Supabase...'}</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-2">
            <Tag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{locale === 'en' ? 'No coupons found' : locale === 'es' ? 'No se encontraron cupones' : 'Nenhum cupom encontrado'}</p>
            <p className="text-xs">{locale === 'en' ? 'Click "New Coupon" to create your first promotion.' : locale === 'es' ? 'Haga clic en "Nuevo Cupón" para crear su primera promoción.' : 'Clique no botão "Novo Cupom" para criar sua primeira campanha promocional.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">{locale === 'en' ? 'Coupon Code' : locale === 'es' ? 'Código de Cupón' : 'Código do Cupom'}</th>
                  <th className="py-3 px-4">{locale === 'en' ? 'Type & Discount' : locale === 'es' ? 'Tipo y Descuento' : 'Tipo & Desconto'}</th>
                  <th className="py-3 px-4">{locale === 'en' ? 'Minimum Order' : locale === 'es' ? 'Pedido Mínimo' : 'Pedido Mínimo'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'en' ? 'Uses / Limit' : locale === 'es' ? 'Usos / Límite' : 'Usos / Limite'}</th>
                  <th className="py-3 px-4">{locale === 'en' ? 'Status' : locale === 'es' ? 'Estado' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{locale === 'en' ? 'Actions' : locale === 'es' ? 'Acciones' : 'Ações'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded font-mono font-extrabold tracking-wider">
                          {coupon.codigo}
                        </span>
                        <button
                          onClick={() => copyToClipboard(coupon.codigo)}
                          title="Copiar código"
                          className="text-slate-400 hover:text-slate-700 p-1 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {coupon.tipo_desconto === 'porcentagem' ? (
                        <span className="font-extrabold text-emerald-700 text-xs">
                          {coupon.valor_desconto}% OFF
                        </span>
                      ) : (
                        <span className="font-extrabold text-emerald-700 text-xs">
                          {formatCurrency(coupon.valor_desconto)} OFF
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {coupon.valor_minimo > 0 ? (
                        <span className="font-medium">{formatCurrency(coupon.valor_minimo)}</span>
                      ) : (
                        <span className="text-slate-400 italic">Sem valor mínimo</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {coupon.usos_atuais} / {coupon.limite_usos > 0 ? coupon.limite_usos : '∞'}
                    </td>

                    <td className="py-3.5 px-4">
                      {coupon.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo no Checkout
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Pausado
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          title={coupon.ativo ? 'Pausar cupom' : 'Ativar cupom'}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            coupon.ativo
                              ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {coupon.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDelete(coupon)}
                          title="Excluir cupom"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NOVO CUPOM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                Criar Novo Cupom de Desconto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Código Promocional (Sem espaços)
                </label>
                <input
                  type="text"
                  placeholder="EX: BEMVINDA15, BLACKFRIDAY"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {locale === 'en' ? 'Discount Type' : locale === 'es' ? 'Tipo de Descuento' : 'Tipo de Desconto'}
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold"
                  >
                    <option value="porcentagem">{locale === 'en' ? 'Percentage (%)' : locale === 'es' ? 'Porcentaje (%)' : 'Porcentagem (%)'}</option>
                    <option value="fixo">{locale === 'en' ? `Fixed Amount (${currencySymbol})` : locale === 'es' ? `Monto Fijo (${currencySymbol})` : `Valor Fixo (${currencySymbol})`}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {newDiscountType === 'porcentagem'
                      ? (locale === 'en' ? 'Percentage (%)' : locale === 'es' ? 'Porcentaje (%)' : 'Porcentagem (%)')
                      : (locale === 'en' ? `Amount (${currencySymbol})` : locale === 'es' ? `Monto (${currencySymbol})` : `Valor (${currencySymbol})`)}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder={newDiscountType === 'porcentagem' ? '15' : '50.00'}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {locale === 'en' ? `Minimum Order (${currencySymbol})` : locale === 'es' ? `Pedido Mínimo (${currencySymbol})` : `Pedido Mínimo (${currencySymbol})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={locale === 'en' ? '0 = No minimum' : locale === 'es' ? '0 = Sin mínimo' : '0 = Sem mínimo'}
                    value={newMinOrderValue}
                    onChange={(e) => setNewMinOrderValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Limite de Utilizações
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="500"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Salvando no Banco...' : 'Criar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
