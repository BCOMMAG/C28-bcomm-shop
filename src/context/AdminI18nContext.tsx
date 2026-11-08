'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLocale, TranslationDictionary } from '@/lib/i18n/types';
import { getTranslation, getStoredLocale, setStoredLocale as persistLocale } from '@/lib/i18n';
import { useStore } from '@/context/StoreContext';

interface AdminI18nContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  currency: string;
  t: TranslationDictionary;
  formatCurrency: (val: number, overrideCurrency?: string) => string;
  formatDate: (
    date?: string | Date | number | null,
    format?: 'short' | 'medium' | 'long' | Intl.DateTimeFormatOptions
  ) => string;
  formatNumber: (val: number, options?: Intl.NumberFormatOptions) => string;
  formatWhatsAppUrl: (phone: string, message?: string) => string;
}

const AdminI18nContext = createContext<AdminI18nContextType | null>(null);

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const { currentTenant } = useStore();
  const [locale, setLocaleState] = useState<SupportedLocale>('pt');

  // Inicializa a partir do localStorage
  useEffect(() => {
    setLocaleState(getStoredLocale());

    const handleLocaleChange = (e: any) => {
      const target = e?.detail?.locale || e?.detail;
      if (target && (target === 'pt' || target === 'en' || target === 'es')) {
        setLocaleState(target);
      }
    };

    window.addEventListener('bcomm_locale_change', handleLocaleChange as EventListener);
    return () => window.removeEventListener('bcomm_locale_change', handleLocaleChange as EventListener);
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
  };

  const currency = useMemo(() => {
    const fin = (currentTenant as any)?.configuracoes_financeiras;
    return (fin?.moeda || 'BRL').toUpperCase();
  }, [currentTenant]);

  const t = useMemo(() => {
    return getTranslation(locale);
  }, [locale]);

  /**
   * Formata valor monetário respeitando a moeda da loja e o idioma ativo
   */
  const formatCurrency = (val: number, overrideCurrency?: string) => {
    const targetCurrency = (overrideCurrency || currency || 'BRL').toUpperCase();
    const defaultLocale = targetCurrency === 'BRL' ? 'pt-BR' : targetCurrency === 'EUR' ? 'es-ES' : 'en-US';
    const targetLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US';

    try {
      return new Intl.NumberFormat(targetLocale || defaultLocale, {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val || 0);
    } catch {
      return `${targetCurrency} ${(val || 0).toFixed(2)}`;
    }
  };

  /**
   * Formata data respeitando o padrão cultural do idioma selecionado
   */
  const formatDate = (
    date?: string | Date | number | null,
    format: 'short' | 'medium' | 'long' | Intl.DateTimeFormatOptions = 'short'
  ) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const targetLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US';

    if (typeof format === 'object') {
      return d.toLocaleString(targetLocale, format);
    }

    if (format === 'short') {
      return d.toLocaleDateString(targetLocale);
    }

    if (format === 'medium') {
      return d.toLocaleDateString(targetLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    return d.toLocaleDateString(targetLocale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Formata números com separadores corretos e opções flexíveis
   */
  const formatNumber = (val: number, options?: Intl.NumberFormatOptions) => {
    const targetLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(targetLocale, options).format(val || 0);
  };

  /**
   * Normaliza números de telefone internacionais para links wa.me
   * Sem fixar +55 se o número já possuir DDI internacional (EUA, Europa, etc.)
   */
  const formatWhatsAppUrl = (phone: string, message?: string) => {
    if (!phone) return '#';
    let clean = phone.replace(/\D/g, '');

    // Se o número tem 10 ou 11 dígitos e a loja opera no Brasil, adiciona 55
    if ((clean.length === 10 || clean.length === 11) && currency === 'BRL') {
      clean = `55${clean}`;
    }

    const base = `https://wa.me/${clean}`;
    if (!message) return base;
    return `${base}?text=${encodeURIComponent(message)}`;
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      currency,
      t,
      formatCurrency,
      formatDate,
      formatNumber,
      formatWhatsAppUrl
    }),
    [locale, currency, t]
  );

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n(): AdminI18nContextType {
  const context = useContext(AdminI18nContext);
  if (!context) {
    // Fallback defensivo caso chamado fora do provider
    const fallbackLocale = getStoredLocale();
    return {
      locale: fallbackLocale,
      setLocale: persistLocale,
      currency: 'BRL',
      t: getTranslation(fallbackLocale),
      formatCurrency: (val: number) => `R$ ${(val || 0).toFixed(2).replace('.', ',')}`,
      formatDate: (date: any) => new Date(date).toLocaleDateString('pt-BR'),
      formatNumber: (val: number) => String(val || 0),
      formatWhatsAppUrl: (phone: string, msg?: string) => `https://wa.me/${phone.replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`
    };
  }
  return context;
}
