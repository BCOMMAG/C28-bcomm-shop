'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Unlink,
  Server,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronDown,
  Info
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveCustomDomain,
  checkDomainDns
} from '@/lib/admin';
import { getStorefrontUrl } from '@/lib/routes';
import { useAdminI18n } from '@/context/AdminI18nContext';

type ProviderTab = 'registrobr' | 'hostinger' | 'hostgator' | 'cloudflare';

export default function CustomDomainSettingsPage() {
  const { currentTenant, refreshProducts, refreshTenant } = useStore();
  const { t, locale } = useAdminI18n();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderTab>('registrobr');

  // Estados dos dados da loja
  const [slug, setSlug] = useState('');
  const [dominioSalvo, setDominioSalvo] = useState('');
  const [dominioInput, setDominioInput] = useState('');

  // Modal de Desconexão
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Resultado da Verificação de DNS
  const [dnsResult, setDnsResult] = useState<{
    status: 'verified' | 'pending' | 'incorrect' | 'not_found' | 'error';
    cname?: string;
    message: string;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
    showToast('Copiado para a área de transferência!');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStoreSettings(tenantId);
      if (data) {
        const dom = (data.dominioProprio || '').trim();
        setSlug(data.slug || currentTenant?.slug || 'leidy-boutique');
        setDominioSalvo(dom);
        setDominioInput(dom);

        // Se já tiver domínio salvo, faz checagem inicial de DNS silenciosa
        if (dom) {
          checkDnsStatus(dom, false);
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao carregar dados do domínio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const cleanDomainString = (val: string): string => {
    return val
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '')
      .replace(/\s+/g, '');
  };

  const checkDnsStatus = async (domainToCheck: string, showNotification: boolean = true) => {
    const clean = cleanDomainString(domainToCheck);
    if (!clean) {
      if (showNotification) {
        showToast('Informe um domínio válido para testar o DNS.', 'error');
      }
      return;
    }

    setIsCheckingDns(true);
    try {
      const res = await checkDomainDns(clean);
      setDnsResult(res);
      if (showNotification) {
        if (res.status === 'verified') {
          showToast('Excelente! Apontamento DNS verificado e ativo!', 'success');
        } else if (res.status === 'incorrect') {
          showToast('O domínio aponta para outro servidor. Veja as orientações.', 'error');
        } else {
          showToast('Aguardando propagação DNS ou nenhum apontamento encontrado.', 'error');
        }
      }
    } catch (err: any) {
      setDnsResult({
        status: 'error',
        message: 'Não foi possível consultar os servidores DNS no momento.'
      });
    } finally {
      setIsCheckingDns(false);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanDomainString(dominioInput);

    if (!clean) {
      showToast('Digite o endereço do seu domínio antes de salvar.', 'error');
      return;
    }

    // Se o usuário digitou sem www e for domínio de 2 níveis (ex: lojafashion.com.br), sugere www
    let finalDomain = clean;
    if (!finalDomain.startsWith('www.') && !finalDomain.includes('.') === false) {
      const parts = finalDomain.split('.');
      if (parts.length === 2 || (parts.length === 3 && parts[1] === 'com' && parts[2] === 'br')) {
        finalDomain = `www.${finalDomain}`;
        setDominioInput(finalDomain);
      }
    }

    setIsSaving(true);
    try {
      // 1. Chama a API (Pages Function ou Next.js) que conecta autonomamente na Cloudflare for SaaS e salva no Supabase
      const apiRes = await fetch('/api/admin/dominio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          lojaId: tenantId,
          domain: finalDomain
        })
      });

      let apiData: any = {};
      try {
        const text = await apiRes.text();
        apiData = text ? JSON.parse(text) : {};
      } catch {
        apiData = { success: false, error: `Resposta inválida do servidor (HTTP ${apiRes.status})` };
      }

      if (apiRes.ok && apiData.success) {
        setDominioSalvo(finalDomain);
        showToast(`Domínio "${finalDomain}" conectado e autorizado com sucesso na Cloudflare!`, 'success');
        try {
          await refreshProducts();
          if (refreshTenant) await refreshTenant();
        } catch {}
        // Dispara teste de DNS após salvar
        checkDnsStatus(finalDomain, false);
      } else {
        showToast(apiData.error || `Erro ao conectar domínio (HTTP ${apiRes.status}).`, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar domínio.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectDomain = async () => {
    setIsDisconnecting(true);
    try {
      // 2. Chama a API (Pages Function ou Next.js) que remove autonomamente da Cloudflare for SaaS e limpa no Supabase
      const apiRes = await fetch('/api/admin/dominio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          lojaId: tenantId
        })
      });

      let apiData: any = {};
      try {
        const text = await apiRes.text();
        apiData = text ? JSON.parse(text) : {};
      } catch {
        apiData = { success: false, error: `Resposta inválida do servidor (HTTP ${apiRes.status})` };
      }

      if (apiRes.ok && apiData.success) {
        setDominioSalvo('');
        setDominioInput('');
        setDnsResult(null);
        setIsDisconnectModalOpen(false);
        showToast('Domínio desconectado da Cloudflare! A loja voltou ao link padrão.', 'success');
        try {
          await refreshProducts();
          if (refreshTenant) await refreshTenant();
        } catch {}
      } else {
        showToast(apiData.error || `Erro ao desconectar domínio (HTTP ${apiRes.status}).`, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao desconectar domínio.', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const activeStorefrontUrl = dominioSalvo
    ? `https://${dominioSalvo}`
    : `https://bcomm-ag.space/${slug || 'leidy-boutique'}`;

  const defaultFreeUrl = `https://bcomm-ag.space/${slug || 'leidy-boutique'}`;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando configurações de domínio...</span>
      </div>
    );
  }

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

      {/* MODAL DE CONFIRMAÇÃO DE DESCONEXÃO */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Unlink className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {t.storeDomain.disconnectModalTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ao desconectar o domínio <strong className="text-slate-800 font-mono">{dominioSalvo}</strong>, sua vitrine deixará de responder neste endereço.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <span className="font-bold block">🟢 Reversão Imediata Garantida:</span>
              <p>
                Sua loja continuará funcionando normalmente através do link padrão gratuito: <strong className="font-mono text-amber-950">{defaultFreeUrl}</strong>.
                Nenhum produto, pedido, cliente ou configuração será perdido.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDisconnecting}
                onClick={() => setIsDisconnectModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {t.storeDomain.cancelBtn}
              </button>
              <button
                type="button"
                disabled={isDisconnecting}
                onClick={handleDisconnectDomain}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Desconectando...</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>{t.storeDomain.confirmDisconnectBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DA PÁGINA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.storeDomain.pageTitle}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Apresente sua boutique diretamente no seu próprio endereço web exclusivo (ex.: <code className="text-amber-800 font-semibold font-mono">www.sualoja.com.br</code>).
                Compre seu domínio onde preferir e conecte com facilidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                dominioSalvo
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dominioSalvo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {dominioSalvo ? t.storeDomain.statusConnected : t.storeDomain.statusPending}
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 1: ENDEREÇO ATIVO DA SUA VITRINE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-600" />
              {t.storeDomain.statusTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {dominioSalvo
                ? 'Suas clientes finais acessam sua loja exclusivamente neste domínio personalizado.'
                : 'Sua vitrine está operando no subdomínio seguro e gratuito oficial da plataforma BCOMM.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(activeStorefrontUrl, 'active_url')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              {copiedField === 'active_url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <a
              href={activeStorefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Vitrine ↗</span>
            </a>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
              🌐
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                URL Pública da Loja
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 break-all select-all">
                {activeStorefrontUrl}
              </span>
            </div>
          </div>

          {dominioSalvo && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isCheckingDns}
                onClick={() => checkDnsStatus(dominioSalvo, true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer shadow-2xs disabled:opacity-50"
                title="Checar propagação DNS agora"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingDns ? 'animate-spin text-amber-600' : 'text-slate-400'}`} />
                <span>{t.storeDomain.dnsDiagnosticBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer transition-colors"
                title="Desconectar domínio próprio e voltar ao subdomínio gratuito"
              >
                <Unlink className="w-3 h-3" />
                <span>{t.storeDomain.disconnectDomainBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* FEEDBACK DE DIAGNÓSTICO DNS */}
        {dnsResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
              dnsResult.status === 'verified'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : dnsResult.status === 'incorrect'
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {dnsResult.status === 'verified' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : dnsResult.status === 'incorrect' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <span className="font-bold block">
                {dnsResult.status === 'verified'
                  ? 'DNS Propagado e Apontado com Sucesso!'
                  : dnsResult.status === 'incorrect'
                  ? 'Apontamento DNS Incorreto'
                  : 'Aguardando Propagação DNS'}
              </span>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {dnsResult.message}
              </p>
              {dnsResult.cname && (
                <div className="pt-1 font-mono text-[10px]">
                  Destino CNAME detectado: <strong className="font-bold underline">{dnsResult.cname}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 2: FORMULÁRIO DE CONEXÃO OU ALTERAÇÃO DE DOMÍNIO */}
      <form onSubmit={handleSaveDomain} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            {t.storeDomain.formConnectTitle}
          </h2>
          <p className="text-[11px] text-slate-500">
            {t.storeDomain.formConnectDesc}
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-slate-800 text-xs font-bold">
            {t.storeDomain.domainInputLabel}
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3 text-slate-400 font-mono text-xs font-semibold select-none pointer-events-none">
                https://
              </span>
              <input
                type="text"
                required
                value={dominioInput}
                onChange={(e) => setDominioInput(e.target.value)}
                placeholder={t.storeDomain.domainInputPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-16 pr-3 py-2.5 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.storeDomain.connectDomainBtn}</span>
                  </>
                )}
              </button>

              {dominioInput && (
                <button
                  type="button"
                  disabled={isCheckingDns}
                  onClick={() => checkDnsStatus(dominioInput, true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                  title="Testar se este domínio já está apontando para a plataforma"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDns ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
                  <span>Testar DNS</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Recomendamos o uso do prefixo <strong className="font-mono text-slate-700">www</strong> (ex.: <code className="font-mono">www.sualoja.com.br</code>) para compatibilidade universal e estabilidade de DNS.
          </p>
        </div>
      </form>

      {/* BLOCO 3: GUIA PASSO A PASSO OFICIAL POR PROVEDOR DE DOMÍNIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            {t.storeDomain.guideTitle}
          </h2>
          <p className="text-[11px] text-slate-500">
            {t.storeDomain.guideSubtitle}
          </p>
        </div>

        {/* SELETOR DE ABAS DE PROVEDORES */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedProvider('registrobr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedProvider === 'registrobr'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            🇧🇷 Registro.br
          </button>

          <button
            type="button"
            onClick={() => setSelectedProvider('hostinger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedProvider === 'hostinger'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            🟣 Hostinger
          </button>

          <button
            type="button"
            onClick={() => setSelectedProvider('hostgator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedProvider === 'hostgator'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            🐊 HostGator / cPanel
          </button>

          <button
            type="button"
            onClick={() => setSelectedProvider('cloudflare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedProvider === 'cloudflare'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            ☁️ Cloudflare / GoDaddy / Outros
          </button>
        </div>

        {/* CONTEÚDO DA TAB: REGISTRO.BR */}
        {selectedProvider === 'registrobr' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Instruções Passo a Passo para o Registro.br:
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                1. Faça login na sua conta no <a href="https://registro.br" target="_blank" rel="noreferrer" className="underline font-bold">registro.br</a> e clique sobre o seu domínio.<br />
                2. Na seção <strong>DNS</strong>, clique em <strong>Configurar Endereçamento</strong> (ou <em>Editar Zona</em>).<br />
                3. Clique em <strong>Modo Avançado</strong> se você ainda estiver no modo básico.<br />
                4. Clique em <strong>+ Record (Nova Entrada)</strong> e preencha os dados abaixo:
              </p>
            </div>

            {/* TABELA DE CNAME */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Nome / Entrada</th>
                    <th className="p-3">Dados / Destino</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-amber-700">CNAME</td>
                    <td className="p-3 text-slate-900 font-bold">www</td>
                    <td className="p-3 text-slate-900 font-bold">stores.bcomm-ag.space</td>
                    <td className="p-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => copyToClipboard('stores.bcomm-ag.space', 'cname_target')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        {copiedField === 'cname_target' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                        <span>{copiedField === 'cname_target' ? 'Copiado!' : 'Copiar Destino'}</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DICA DO REDIRECIONAMENTO RAIZ */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-950 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                Como resolver o acesso sem &quot;www&quot; no Registro.br:
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Por padrão mundial da internet, o Registro.br não aceita CNAME direto na raiz (sem www). Mas o próprio Registro.br tem uma ferramenta <strong>gratuita e automática</strong>:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1 pl-1">
                <li>No painel do seu domínio no Registro.br, procure a opção <strong>&quot;Redirecionamento de Página&quot;</strong> (fica logo abaixo da zona DNS).</li>
                <li>Ative o redirecionamento e aponte o domínio sem www para: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{`https://www.${dominioSalvo ? cleanDomainString(dominioSalvo).replace(/^www\./, '') : 'sualoja.com.br'}`}</strong></li>
              </ul>
              <p className="text-[11px] text-amber-800 font-medium">
                Dessa forma, se qualquer cliente digitar apenas <code className="font-mono">sualoja.com.br</code> sem o www, ela será direcionada instantaneamente para a sua vitrine!
              </p>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA TAB: HOSTINGER */}
        {selectedProvider === 'hostinger' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-purple-900">
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                Instruções para Hostinger (hPanel):
              </span>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                1. Entre no <strong>hPanel</strong> da Hostinger e vá em <strong>Domínios</strong> &gt; Gerenciar seu domínio.<br />
                2. No menu lateral esquerdo, clique em <strong>DNS / Servidores de Nome</strong>.<br />
                3. Na área <strong>Gerenciar Registros DNS</strong>, adicione a entrada CNAME:
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-slate-50 border-b border-slate-200 gap-2 font-sans font-bold text-slate-700">
                <div>Tipo: CNAME</div>
                <div>Nome: www</div>
                <div>Destino: stores.bcomm-ag.space</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong className="text-slate-900 block font-sans">Redirecionamento do Domínio Raiz na Hostinger:</strong>
              No menu lateral do domínio, vá em <strong>Redirecionamentos</strong> e aponte o domínio raiz (sem www) com código 301 (Permanente) para <code className="font-mono text-amber-900 font-bold">{`https://www.${dominioSalvo ? cleanDomainString(dominioSalvo).replace(/^www\./, '') : 'sualoja.com.br'}`}</code>.
            </div>
          </div>
        )}

        {/* CONTEÚDO DA TAB: HOSTGATOR */}
        {selectedProvider === 'hostgator' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                Instruções para HostGator / cPanel:
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                1. No Portal do Cliente HostGator ou cPanel, acesse a ferramenta <strong>Zone Editor</strong> (Editor de Zona DNS).<br />
                2. Ao lado do seu domínio, clique em <strong>Gerenciar</strong>.<br />
                3. Localize o registro CNAME existente com nome <code className="font-mono">www</code> e altere seu destino para <strong className="font-mono">stores.bcomm-ag.space</strong> (se não existir, clique em <strong>+ Adicionar Registro</strong> e selecione Tipo CNAME).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong className="text-slate-900 block font-sans">Redirecionamento no cPanel:</strong>
              Na página inicial do cPanel, vá em <strong>Redirecionamentos</strong> e configure o domínio raiz para redirecionar para a versão com <code className="font-mono font-bold">www</code> com SSL habilitado.
            </div>
          </div>
        )}

        {/* CONTEÚDO DA TAB: CLOUDFLARE / GODADDY */}
        {selectedProvider === 'cloudflare' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Instruções para Cloudflare / GoDaddy:
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1. No gerenciador de DNS da Cloudflare ou GoDaddy, crie o registro CNAME com Nome <code className="font-mono font-bold">www</code> e Destino <code className="font-mono font-bold">stores.bcomm-ag.space</code>.<br />
                2. Na Cloudflare, se o Proxy (nuvem laranja) estiver ativado, selecione modo <strong>SSL/TLS Completo (Full)</strong>.<br />
                3. Na GoDaddy, use a ferramenta <strong>Encaminhamento de Domínio</strong> para direcionar a raiz (@) para <code className="font-mono">{`https://www.${dominioSalvo ? cleanDomainString(dominioSalvo).replace(/^www\./, '') : 'sualoja.com.br'}`}</code>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 4: PERGUNTAS FREQUENTES & SUPORTE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          {t.storeDomain.faqTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">{t.storeDomain.faqQ1}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.storeDomain.faqA1}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">{t.storeDomain.faqQ2}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.storeDomain.faqA2}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">{t.storeDomain.faqQ3}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.storeDomain.faqA3}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Onde acesso o meu painel administrativo?</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Seu painel administrativo de gestão continua protegido no endereço oficial do sistema (<code className="font-mono">bcomm-shop.pages.dev/admin</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

