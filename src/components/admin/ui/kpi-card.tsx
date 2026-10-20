'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/chart-utils';
import { DeltaBadge, DeltaType } from './delta-badge';

export interface KpiCardProps {
  /** Título ou rótulo do indicador (ex: "Faturamento Bruto") */
  title: string;
  /** Valor principal formatado (ex: "R$ 2.409,40" ou "6 Pedidos") */
  value: string | number;
  /** Ícone exibido no canto superior direito */
  icon?: React.ReactNode;
  /** Variação percentual comprovada por dados reais (opcional) */
  delta?: number;
  /** Texto personalizado para a pílula contextual (ex: "Acumulado", "Hoje") */
  deltaLabel?: string;
  /** Tipo semântico da pílula (opcional) */
  deltaType?: DeltaType;
  /** Texto descritivo no rodapé do card */
  footerText?: React.ReactNode;
  /** Link de destino caso o card seja clicável (ex: "/admin/financas/") */
  href?: string;
  /** Texto do link de ação rápida (ex: "Ver DRE & Lucro") */
  actionText?: string;
  /** Estado de carregamento com skeleton visual */
  loading?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  delta,
  deltaLabel,
  deltaType,
  footerText,
  href,
  actionText,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <div className={cn('bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs animate-pulse h-full min-h-[148px] flex flex-col justify-between', className)}>
        <div className="h-8 flex items-center justify-between">
          <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
          <div className="w-8 h-8 bg-slate-200 rounded-xl shrink-0" />
        </div>
        <div className="h-7 w-28 bg-slate-200 rounded-md my-auto" />
        <div className="h-6 pt-2 border-t border-slate-100 flex items-center">
          <div className="h-3 w-24 bg-slate-100 rounded-md" />
        </div>
      </div>
    );
  }

  // Detecta se o valor é textual longo (ex: "Custo incompleto") para não estourar a coluna estreita
  const isLongTextValue = typeof value === 'string' && value.length > 12 && !value.startsWith('R$');

  const content = (
    <div
      className={cn(
        'bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group h-full min-h-[148px]',
        href && 'hover:shadow-md hover:border-slate-200 cursor-pointer',
        className
      )}
    >
      {/* Zona 1: Topo - Título e Ícone com altura uniforme */}
      <div className="h-8 flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate min-w-0"
          title={title}
        >
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100/90 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Zona 2: Meio - Valor em Destaque e Pílula Contextual */}
      <div className="my-auto py-1 flex items-baseline justify-between gap-1.5 flex-wrap">
        <span
          className={cn(
            'tracking-tight font-sans truncate',
            isLongTextValue
              ? 'text-base sm:text-lg font-bold text-slate-800'
              : 'text-xl sm:text-[22px] xl:text-2xl font-black text-slate-900'
          )}
          title={typeof value === 'string' ? value : undefined}
        >
          {value}
        </span>
        {(delta !== undefined || deltaLabel) && (
          <div className="shrink-0">
            <DeltaBadge
              delta={delta}
              label={deltaLabel}
              type={deltaType}
              showIcon={delta !== undefined}
            />
          </div>
        )}
      </div>

      {/* Zona 3: Rodapé com altura fixa para alinhamento horizontal perfeito */}
      <div className="h-6 mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="min-w-0 truncate text-[11px] font-medium text-slate-500 pr-1">
          {footerText || actionText || <span className="opacity-0 select-none">—</span>}
        </div>
        {href && (
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0 ml-auto" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-2xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};
