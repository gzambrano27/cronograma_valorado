
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
    
    // Sort payload to have 'Planned' first, then by provider name
    const sortedPayload = [...payload].sort((a, b) => {
        if (a.dataKey === 'planned') return -1;
        if (b.dataKey === 'planned') return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[300px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
           {sortedPayload.map((p) => {
              if (p.value === null || p.value === undefined) return null;
              
              const isPlanned = p.dataKey === 'planned';
              const value = p.value as number;
              const name = p.name as string;
              let cumulativeValue: number;

              if (isPlanned) {
                  cumulativeValue = dataPoint.cumulativePlannedValue;
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

// Paleta de colores cohesiva y profesional
const providerColors = [
  "hsl(210, 40%, 50%)", // Blue
  "hsl(160, 50%, 45%)", // Teal
  "hsl(262, 45%, 55%)", // Indigo
  "hsl(310, 40%, 50%)", // Purple
  "hsl(180, 40%, 40%)", // Cyan
  "hsl(230, 50%, 60%)", // Royal Blue
  "hsl(280, 45%, 58%)", // Violet
  "hsl(190, 55%, 50%)", // Deep Cyan
];

export const SCurveCostChart = React.forwardRef<HTMLDivElement, SCurveCostChartProps>(
  ({ data }, ref) => {
    const chartId = React.useId().replace(/:/g, "");

    const providerKeys = React.useMemo(() => {
        if (!data || data.length === 0) return [];
        const standardKeys = new Set(['date', 'planned', 'actual', 'cumulativePlannedValue', 'cumulativeActualValue', 'deviation', 'providerDistribution']);
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
        };
        providerKeys.forEach((name, index) => {
             config[name] = {
                 label: name,
                 color: providerColors[index % providerColors.length],
             }
         });
        return config;
    }, [providerKeys]);

    const yAxisTicks = Array.from({ length: 11 }, (_, i) => i * 10); // 0, 10, ..., 100

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
              {Object.entries(chartConfig).map(([key, config]) => {
                const color = (config as { color: string }).color;
                if (!color) return null;
                return (
                  <linearGradient
                    key={`fill-${key}`}
                    id={`fill-${key}-${chartId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={color}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                );
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
              fill="transparent"
              stroke={chartConfig.planned.color}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.planned.label}
            />
            {providerKeys.map((key) => {
                const providerConfig = chartConfig[key] as {label: string, color: string};
                if (!providerConfig) return null;
                return (
                    <Area
                        key={key}
                        dataKey={key}
                        type="monotone"
                        fill={`url(#fill-${key}-${chartId})`}
                        stroke={providerConfig.color}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={false}
                        name={providerConfig.label}
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
