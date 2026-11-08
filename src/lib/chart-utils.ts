import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina condicionalmente classes do Tailwind CSS e resolve conflitos de especificidade.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para Moeda (suporta dinamicamente BRL, USD, EUR e outros locales).
 */
export function formatCurrency(
  value: number,
  currency: string = 'BRL',
  locale?: string
): string {
  const normCurrency = (currency || 'BRL').toUpperCase();
  const defaultLocale = normCurrency === 'BRL' ? 'pt-BR' : normCurrency === 'EUR' ? 'es-ES' : 'en-US';
  const targetLocale = locale || defaultLocale;
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: normCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

/**
 * Alias retrocompatível que direciona para formatCurrency respeitando moeda e locale.
 */
export function formatBRL(value: number, currency: string = 'BRL', locale?: string): string {
  return formatCurrency(value, currency, locale);
}

/**
 * Formata um número inteiro ou decimal com separadores de milhar de acordo com o locale.
 */
export function formatNumber(value: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(value || 0);
}

/**
 * Formata números grandes de forma compacta (ex: 1,5k / 24,8k / 1.5k).
 */
export function formatCompactNumber(value: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value || 0);
}
