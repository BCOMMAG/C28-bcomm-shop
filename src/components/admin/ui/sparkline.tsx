'use client';

import * as React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { cn, formatNumber } from '@/lib/chart-utils';

export interface SparklinePoint {
  value: number;
  label?: string;
}

export interface SparklineProps {
  /** Série de valores numéricos ou objetos com valor e rótulo */
  data: number[] | SparklinePoint[];
  /** Altura do sparkline em pixels (padrão: 36) */
  height?: number;
  /** Largura opcional em pixels ou string CSS (padrão: "100%") */
  width?: number | string;
  /** Cor da linha e preenchimento de gradiente (padrão: "#0F172A") */
  color?: string;
  /** Espessura da linha (padrão: 2) */
  strokeWidth?: number;
  /** Habilitar tooltip ao passar o mouse (padrão: false para comportamento quieto) */
  showTooltip?: boolean;
  /** Formatter personalizado para o valor no tooltip */
  valueFormatter?: (value: number) => string;
  /** Classes CSS adicionais para o contêiner */
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  height = 36,
  width = '100%',
  color = '#0F172A',
  strokeWidth = 2,
  showTooltip = false,
  valueFormatter = (val) => formatNumber(val),
  className
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const gradientId = React.useId();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Normaliza o array de entrada para objetos com chave "value"
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => {
      if (typeof item === 'number') {
        return { index, value: item, label: `Ponto ${index + 1}` };
      }
      return { index, value: item.value, label: item.label || `Ponto ${index + 1}` };
    });
  }, [data]);

  if (!isMounted) {
    return (
      <div
        className={cn('bg-slate-50 rounded animate-pulse', className)}
        style={{ height, width }}
      />
    );
  }

  if (chartData.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-[10px] text-slate-300', className)}
        style={{ height, width }}
      >
        —
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <defs>
            <linearGradient id={`sparkline-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0]?.payload as { label: string; value: number };
                return (
                  <div className="bg-slate-900 text-white rounded-md px-2 py-1 text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none">
                    {point.label && <span className="opacity-70 mr-1.5">{point.label}:</span>}
                    <span className="font-bold">{valueFormatter(point.value)}</span>
                  </div>
                );
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#sparkline-grad-${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
