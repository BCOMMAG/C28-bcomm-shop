'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { cn, formatBRL } from '@/lib/chart-utils';

export interface BarChartDataPoint {
  /** Rótulo no eixo X (ex: "Seg", "Ter", "01/10") */
  label: string;
  /** Valor principal da barra primária (ex: Receita Bruta) */
  primaryValue: number;
  /** Valor secundário para barra de custo ou comparação (opcional) */
  secondaryValue?: number;
}

export interface BarChartProps {
  /** Série de dados para renderização */
  data: BarChartDataPoint[];
  /** Título do gráfico (ex: "Receita vs. Custo das Peças") */
  title?: string;
  /** Subtítulo contextual */
  subtitle?: string;
  /** Rótulo da série primária (ex: "Receita Operacional") */
  primaryLabel?: string;
  /** Rótulo da série secundária (ex: "Custo CMV das Peças") */
  secondaryLabel?: string;
  /** Cor da barra primária (padrão: preto executivo #1E293B) */
  primaryColor?: string;
  /** Altura do contêiner do gráfico em pixels */
  height?: number;
  /** Classes CSS adicionais */
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data = [],
  title,
  subtitle,
  primaryLabel = 'Receita',
  secondaryLabel = 'Custo dos Produtos (CMV)',
  primaryColor = '#0F172A',
  height = 240,
  className
}) => {
  // Previne mismatch de hidratação no export estático da Cloudflare Pages
  const [isMounted, setIsMounted] = React.useState(false);
  const patternId = React.useId();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasData = data && data.length > 0 && data.some((d) => d.primaryValue > 0 || (d.secondaryValue || 0) > 0);
  const isSingleDay = hasData && data.length === 1;

  return (
    <div className={cn('bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between', className)}>
      {/* Cabeçalho do Gráfico & Legenda */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
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

          {/* Legenda Visual Inspirada na Ecomora */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: primaryColor }}
              />
              <span>{primaryLabel}</span>
            </div>
            {data.some((d) => d.secondaryValue !== undefined) && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block border border-slate-400/50" />
                <span>{secondaryLabel}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área do Gráfico */}
      <div className="w-full relative min-h-[240px]" style={{ height: `${height}px`, minHeight: `${height}px` }}>
        {!isMounted ? (
          <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" />
        ) : !hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">
              Nenhuma movimentação de vendas no período
            </span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-xs">
              As barras serão renderizadas automaticamente conforme novos pedidos forem confirmados.
            </span>
          </div>
        ) : isSingleDay ? (
          <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita Registrada &bull; {data[0].label}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5">
              {formatBRL(data[0].primaryValue)}
            </span>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Histórico em consolidação (1 data com vendas)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              O comparativo diário em barras será exibido automaticamente assim que mais dias acumularem pedidos.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={height}>
            <RechartsBarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              {/* Definição de Padrão Hachurado 45° SVG (Estilo Ecomora) */}
              <defs>
                <pattern
                  id={`striped-bar-${patternId}`}
                  width={8}
                  height={8}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width={8} height={8} fill="#CBD5E1" opacity={0.6} />
                  <rect width={4} height={8} fill="#F8FAFC" opacity={0.9} />
                </pattern>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                dy={6}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(val) => `R$ ${val}`}
              />

              <Tooltip
                cursor={{ fill: '#F8FAFC', opacity: 0.6 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0]?.payload as BarChartDataPoint;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
                      <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100 mb-2">
                        {item.label}
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                            {primaryLabel}:
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatBRL(item.primaryValue)}
                          </span>
                        </div>
                        {item.secondaryValue !== undefined && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              {secondaryLabel}:
                            </span>
                            <span className="font-mono font-semibold text-slate-700">
                              {formatBRL(item.secondaryValue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Barra Secundária (Custo/CMV com preenchimento hachurado 45°) */}
              {data.some((d) => d.secondaryValue !== undefined) && (
                <Bar
                  dataKey="secondaryValue"
                  name={secondaryLabel}
                  fill={`url(#striped-bar-${patternId})`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
              )}

              {/* Barra Primária (Receita sólida) */}
              <Bar
                dataKey="primaryValue"
                name={primaryLabel}
                fill={primaryColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                isAnimationActive={false}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
