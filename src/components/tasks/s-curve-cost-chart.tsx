
"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  TooltipProps,
} from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SCurveData } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface SCurveCostChartProps {
  data: SCurveData[]
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as SCurveData;
    
    const relevantPayload = payload.filter(p => p.value !== null && p.value !== undefined && p.value > 0);

    const sortedPayload = [...relevantPayload].sort((a, b) => {
        if (a.dataKey === 'planned') return -1;
        if (a.dataKey === 'actual') return -1;
        if (b.dataKey === 'planned') return 1;
        if (b.dataKey === 'actual') return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[300px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
           {sortedPayload.map((p) => {
              const name = p.name as string;
              const value = p.value as number;
              let cumulativeValue: number;

              if (p.dataKey === 'planned') {
                  cumulativeValue = dataPoint.cumulativePlannedValue;
              } else if (p.dataKey === 'actual') {
                  cumulativeValue = dataPoint.cumulativeActualValue;
              } else {
                  cumulativeValue = dataPoint[`${name}_value`] || 0;
              }

              return (
                 <div key={p.dataKey} className="flex justify-between items-center gap-4">
                      <span className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color || p.stroke }} />
                          {name}:
                      </span>
                      <span className="font-mono font-semibold">
                        {`${value.toFixed(2)}%`}
                        {` (${formatCurrency(cumulativeValue, 0)})`}
                      </span>
                  </div>
              )
           })}
        </div>
      </div>
    );
  }
  return null;
};

const providerColors = [
  "hsl(210, 40%, 50%)", 
  "hsl(160, 50%, 45%)", 
  "hsl(262, 45%, 55%)", 
  "hsl(310, 40%, 50%)", 
  "hsl(180, 40%, 40%)", 
  "hsl(230, 50%, 60%)", 
  "hsl(280, 45%, 58%)", 
  "hsl(190, 55%, 50%)", 
];

export const SCurveCostChart = React.forwardRef<HTMLDivElement, SCurveCostChartProps>(
  ({ data }, ref) => {
    const chartId = React.useId();

    const providerKeys = React.useMemo(() => {
        if (!data || data.length === 0) return [];
        const standardKeys = new Set(['date', 'planned', 'cumulativePlannedValue', 'actual', 'cumulativeActualValue', 'deviation']);
        const providers = new Set<string>();
        data.forEach(d => {
            Object.keys(d).forEach(key => {
                if (!standardKeys.has(key) && !key.endsWith('_value')) {
                    providers.add(key);
                }
            })
        });
        return Array.from(providers);
    }, [data]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            planned: {
                label: "Planificado",
                color: "hsl(var(--muted-foreground))",
            },
            actual: {
                label: "Real",
                color: "hsl(var(--primary))",
            },
        };
        providerKeys.forEach((name, index) => {
             config[name] = {
                 label: name,
                 color: providerColors[index % providerColors.length],
             }
         });
        return config;
    }, [providerKeys]);

    const yAxisTicks = Array.from({ length: 11 }, (_, i) => i * 10); 

    return (
      <ChartContainer config={chartConfig} className="min-h-[250px] w-full h-full" ref={ref}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
              ticks={yAxisTicks}
              className="text-xs"
            />
            <defs>
                <linearGradient id={`fill-planned-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig.planned.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartConfig.planned.color} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id={`fill-actual-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig.actual.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartConfig.actual.color} stopOpacity={0.1} />
                </linearGradient>

              {providerKeys.map((key) => {
                 const providerConfig = chartConfig[key] as {label: string, color: string} | undefined;
                 if (!providerConfig) return null;
                 const gradientId = `fill-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${chartId}`;
                 return (
                    <linearGradient
                        key={`gradient-${key}`}
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop offset="5%" stopColor={providerConfig.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={providerConfig.color} stopOpacity={0.1} />
                    </linearGradient>
                 )
              })}
            </defs>
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{paddingTop: '1rem', fontSize: '12px'}}/>
            
            <Area
              dataKey="planned"
              type="monotone"
              fill={`url(#fill-planned-${chartId})`}
              stroke={chartConfig.planned.color}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.planned.label}
              connectNulls
            />
            <Area
              dataKey="actual"
              type="monotone"
              fill={`url(#fill-actual-${chartId})`}
              stroke={chartConfig.actual.color}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.actual.label}
              connectNulls
            />
            {providerKeys.map((key) => {
                const providerConfig = chartConfig[key] as {label: string, color: string} | undefined;
                if (!providerConfig) return null;
                const gradientId = `fill-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${chartId}`;
                return (
                    <Area
                        key={key}
                        dataKey={key}
                        type="monotone"
                        fill={`url(#${gradientId})`}
                        stroke={providerConfig.color}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={false}
                        name={providerConfig.label}
                        connectNulls
                    />
                )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }
);
SCurveCostChart.displayName = 'SCurveCostChart';
