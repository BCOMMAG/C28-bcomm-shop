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
      <div className={cn('bg-white border border-slate-100 rounded-2xl p-6 shadow-xs animate-pulse', className)}>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
          <div className="w-9 h-9 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-slate-200 rounded-md mt-4" />
        <div className="h-3 w-44 bg-slate-100 rounded-md mt-4" />
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'bg-white border border-slate-100 rounded-2xl p-6 shadow-xs transition-all duration-200 flex flex-col justify-between group',
        href && 'hover:shadow-md hover:border-slate-200 cursor-pointer',
        className
      )}
    >
      {/* Topo: Título e Ícone */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/90 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Meio: Valor de Destaque e Pílula Contextual */}
      <div className="mt-3.5 flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {value}
        </span>
        {(delta !== undefined || deltaLabel) && (
          <DeltaBadge
            delta={delta}
            label={deltaLabel}
            type={deltaType}
            showIcon={delta !== undefined}
          />
        )}
      </div>

      {/* Rodapé: Ação ou Legenda com divisor suave */}
      {(footerText || actionText || href) && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="min-w-0 truncate">{footerText || actionText}</div>
          {href && (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0 ml-1" />
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
};
