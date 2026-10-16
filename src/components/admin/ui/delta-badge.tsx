'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/chart-utils';

export type DeltaType = 'positive' | 'negative' | 'neutral' | 'warning';

export interface DeltaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Valor percentual (ex: 12.5 para +12,5%) ou indefinido se for apenas texto contextual */
  delta?: number;
  /** Rótulo personalizado caso queira exibir um texto específico (ex: "Acumulado" ou "Ao Vivo") */
  label?: string;
  /** Tipo semântico de cor (sobrescreve cálculo automático de delta) */
  type?: DeltaType;
  /** Inverte a semântica: queda é positiva e alta é negativa (ex: despesas, taxa de cancelamento) */
  invert?: boolean;
  /** Exibe ou oculta o ícone de tendência */
  showIcon?: boolean;
  /** Variante visual de preenchimento */
  variant?: 'soft' | 'outline';
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({
  delta,
  label,
  type,
  invert = false,
  showIcon = true,
  variant = 'soft',
  className,
  ...props
}) => {
  // Determina a direção e semântica a partir do delta quando o tipo não for fixado
  let resolvedType: DeltaType = type || 'neutral';
  let formattedText = label;

  if (delta !== undefined && delta !== null && !type) {
    if (delta > 0) {
      resolvedType = invert ? 'negative' : 'positive';
      formattedText = formattedText || `+${delta.toFixed(delta % 1 === 0 ? 0 : 1)}%`;
    } else if (delta < 0) {
      resolvedType = invert ? 'positive' : 'negative';
      formattedText = formattedText || `${delta.toFixed(delta % 1 === 0 ? 0 : 1)}%`;
    } else {
      resolvedType = 'neutral';
      formattedText = formattedText || '0%';
    }
  }

  // Determina se deve renderizar o ícone de tendência:
  // Só exibe se showIcon for true E houver variação real comprovada (positive/negative ou delta numérico)
  const isTrendDirection = resolvedType === 'positive' || resolvedType === 'negative';
  const hasNumericDelta = delta !== undefined && delta !== null;
  const shouldRenderIcon = showIcon && (isTrendDirection || (hasNumericDelta && !label));

  const IconComponent =
    resolvedType === 'positive'
      ? TrendingUp
      : resolvedType === 'negative'
      ? TrendingDown
      : Minus;

  const colorStyles: Record<DeltaType, string> = {
    positive:
      variant === 'soft'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
        : 'border-emerald-500 text-emerald-700 bg-transparent',
    negative:
      variant === 'soft'
        ? 'bg-rose-50 text-rose-700 border-rose-200/70'
        : 'border-rose-500 text-rose-700 bg-transparent',
    warning:
      variant === 'soft'
        ? 'bg-amber-50 text-amber-800 border-amber-200/70'
        : 'border-amber-500 text-amber-800 bg-transparent',
    neutral:
      variant === 'soft'
        ? 'bg-slate-100 text-slate-600 border-slate-200/70'
        : 'border-slate-300 text-slate-600 bg-transparent'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors select-none tracking-tight',
        colorStyles[resolvedType],
        className
      )}
      {...props}
    >
      {shouldRenderIcon && <IconComponent className="w-3 h-3 shrink-0 stroke-[2.2]" />}
      <span>{formattedText}</span>
    </span>
  );
};
