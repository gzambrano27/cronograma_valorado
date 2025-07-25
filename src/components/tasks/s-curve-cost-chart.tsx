
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
import { ArrowUp, ArrowDown } from "lucide-react"

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
    
    // Filtrar proveedores que no tienen valor en este punto para no saturar el tooltip
    const relevantPayload = payload.filter(p => p.value && p.value > 0);

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[250px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
           {relevantPayload.map((p, index) => {
              const name = p.name as string;
              let value: string | number = p.value as number;
              const color = p.color || p.stroke;
              let cumulativeValue: number | undefined = undefined;
              
              if (name === 'Planificado') {
                  cumulativeValue = data.cumulativePlannedValue;
                  value = `${(p.value as number || 0).toFixed(2)}%`;
              } else if (name === 'Real') {
                  cumulativeValue = data.cumulativeActualValue;
                   value = `${(p.value as number || 0).toFixed(2)}%`;
              } else if (data.cumulativeProviders && name !== 'Planificado' && name !== 'Real') {
                  const providerCumulative = Object.entries(data.cumulativeProviders).find(([providerName]) => providerName === name);
                  if (providerCumulative) {
                      cumulativeValue = providerCumulative[1];
                  }
                  // En la gráfica de costos, los proveedores ya son un % del total, por lo que no se muestra %
                  value = formatCurrency(cumulativeValue || 0, 0); 
              }

              if (name !== "Real" && cumulativeValue === undefined) return null;

              return (
                  <div key={index} className="flex justify-between items-center gap-4">
                      <span className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
                          {name}:
                      </span>
                      <span className="font-mono font-semibold">
                        {value}
                        {(name === 'Planificado' || name === 'Real') && ` (${formatCurrency(cumulativeValue || 0, 0)})`}
                      </span>
                  </div>
              )
           }).filter(Boolean)}
           <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t">
                <span className="font-semibold">Desviación:</span>
                <span className={`font-mono font-bold flex items-center ${data.deviation < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {data.deviation > 0 && <ArrowUp className="h-4 w-4 mr-1" />}
                  {data.deviation < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                  {`${data.deviation.toFixed(2)}%`}
                </span>
            </div>
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
        const standardKeys = new Set(['date', 'planned', 'actual', 'cumulativePlannedValue', 'cumulativeActualValue', 'deviation', 'cumulativeProviders']);
        const providers = new Set<string>();
        data.forEach(d => {
            Object.keys(d).forEach(key => {
                if (!standardKeys.has(key)) {
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

    const yAxisTicks = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, ..., 100

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
              domain={[0, 100]}
              ticks={yAxisTicks}
              className="text-xs"
            />
            <defs>
              <linearGradient id={`fill-planned-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-planned)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-planned)" stopOpacity={0.1} />
              </linearGradient>
              {providerKeys.map((key) => {
                 const color = chartConfig[key]?.color;
                 if (!color) return null;
                 return (
                    <linearGradient key={`fill-${key}`} id={`fill-${key}-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
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
              stroke="var(--color-planned)"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.planned.label}
            />
             <Area
              dataKey="actual"
              type="monotone"
              fill="transparent"
              stroke="var(--color-actual)"
              strokeWidth={2}
              strokeDasharray="5 5"
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.actual.label}
            />
            {providerKeys.map((key) => {
                const providerConfig = chartConfig[key];
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
                        name={providerConfig.label as string}
                        stackId="providers"
                        yAxisId={0} // Ensure it uses the primary Y-axis
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
