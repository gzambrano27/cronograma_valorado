
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
    const data = payload[0].payload as SCurveData;
    
    const relevantPayload = payload.filter(p => p.value && p.value > 0);

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[300px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
           {relevantPayload.map((p, index) => {
              const name = p.name as string;
              const value = p.value as number;
              const color = p.color || p.stroke;
              
              return (
                  <div key={index} className="flex justify-between items-center gap-4">
                      <span className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
                          {name}:
                      </span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(value, 0)}
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
        const standardKeys = new Set(['date', 'planned', 'cumulativePlannedValue', 'cumulativeActualValue', 'deviation', 'cumulativeProviders', 'providerDistribution']);
        const providers = new Set<string>();
        data.forEach(d => {
            Object.keys(d).forEach(key => {
                if (!standardKeys.has(key) && d[key] > 0) { // Solo añadir si el proveedor tiene valor
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

    const maxCost = React.useMemo(() => {
        if (!data || data.length === 0) return 0;
        const lastDataPoint = data[data.length - 1];
        return Math.max(lastDataPoint.cumulativePlannedValue, lastDataPoint.cumulativeActualValue);
    }, [data]);


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
              tickFormatter={(value) => `$${Number(value).toLocaleString('es-ES', { notation: 'compact' })}`}
              domain={[0, maxCost > 0 ? 'auto' : 100]}
              className="text-xs"
            />
            <defs>
              <linearGradient id={`fill-planned-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
              </linearGradient>
              {providerKeys.map((key) => {
                 const color = (chartConfig[key] as {color: string})?.color;
                 if (!color) return null;
                 return (
                    <linearGradient key={`fill-${key}`} id={`fill-${key}-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
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
              stackId="a"
              yAxisId={0}
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
                        stackId="providers"
                        yAxisId={0}
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



