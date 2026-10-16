'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { cn, formatNumber } from '@/lib/chart-utils';

export interface DonutSegment {
  /** Nome ou rótulo do segmento (ex: "Vestidos", "Conjuntos") */
  name: string;
  /** Valor numérico (quantidade ou financeiro) */
  value: number;
  /** Cor específica para esta fatia (opcional) */
  color?: string;
  /** Valor formatado para tooltip e legenda (ex: "R$ 1.250,00" ou "12 un") */
  formattedValue?: string;
}

export interface DonutChartProps {
  /** Lista de segmentos a serem renderizados */
  data: DonutSegment[];
  /** Título do gráfico (ex: "Mix de Categorias") */
  title?: string;
  /** Subtítulo descritivo */
  subtitle?: string;
  /** Valor exibido no centro da rosca (ex: "48" ou "R$ 8.900") */
  centerValue?: string | number;
  /** Rótulo abaixo do valor central (ex: "Peças Cadastradas") */
  centerLabel?: string;
  /** Altura do gráfico em pixels (padrão: 220) */
  height?: number;
  /** Raio interno da rosca (padrão: "68%") */
  innerRadius?: number | string;
  /** Raio externo da rosca (padrão: "88%") */
  outerRadius?: number | string;
  /** Paleta padrão de cores quando não informada no segmento */
  colors?: string[];
  /** Função customizada para formatar valores caso formattedValue não exista */
  valueFormatter?: (value: number) => string;
  /** Classes CSS adicionais */
  className?: string;
}

const DEFAULT_PALETTE = [
  '#0F172A', // Slate 900
  '#334155', // Slate 700
  '#64748B', // Slate 500
  '#94A3B8', // Slate 400
  '#CBD5E1', // Slate 300
  '#E2E8F0'  // Slate 200
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data = [],
  title,
  subtitle,
  centerValue,
  centerLabel,
  height = 220,
  innerRadius = '68%',
  outerRadius = '88%',
  colors = DEFAULT_PALETTE,
  valueFormatter = (val) => formatNumber(val),
  className
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filtra dados válidos e calcula o total
  const validData = (data || []).filter((item) => item.value > 0);
  const totalValue = validData.reduce((acc, curr) => acc + curr.value, 0);
  const hasData = validData.length > 0 && totalValue > 0;

  // Valor a ser exibido no centro
  const displayCenterValue =
    centerValue !== undefined ? centerValue : hasData ? valueFormatter(totalValue) : '0';

  return (
    <div className={cn('bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between', className)}>
      {/* Cabeçalho */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Área do Gráfico */}
      <div className="relative w-full" style={{ height }}>
        {!isMounted ? (
          <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" />
        ) : !hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">
              Nenhuma distribuição disponível
            </span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Cadastre peças com categorias ou aguarde novos pedidos para visualizar a proporção.
            </span>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={validData}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {validData.map((entry, index) => {
                    const sliceColor = entry.color || colors[index % colors.length];
                    return <Cell key={`cell-${index}`} fill={sliceColor} />;
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload as DonutSegment;
                    const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[150px]">
                        <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100 mb-2">
                          {item.name}
                        </span>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Volume:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {item.formattedValue || valueFormatter(item.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 mt-1">
                          <span>Participação:</span>
                          <span className="font-semibold text-slate-800">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Centro Rotulado com Tipografia Premium */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {displayCenterValue}
              </span>
              {centerLabel && (
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                  {centerLabel}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Legendas com Badges e Participação Percentual */}
      {hasData && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          {validData.map((item, index) => {
            const sliceColor = item.color || colors[index % colors.length];
            const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : '0';
            return (
              <div key={item.name} className="flex items-center justify-between gap-1.5 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sliceColor }}
                  />
                  <span className="text-slate-600 truncate text-[11px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="text-slate-900 font-bold font-mono text-[11px] shrink-0">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
