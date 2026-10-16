import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina condicionalmente classes do Tailwind CSS e resolve conflitos de especificidade.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para Moeda Brasileira (BRL - R$).
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

/**
 * Formata um número inteiro ou decimal com separadores de milhar no padrão brasileiro.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

/**
 * Formata números grandes de forma compacta (ex: 1,5k / 24,8k).
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value || 0);
}
