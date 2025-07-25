
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
    const relevantPayload = payload.filter(p => p.dataKey && p.dataKey !== 'planned' && p.value && p.value > 0);

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[300px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
          {/* Línea para el Planificado */}
          <div className="flex justify-between items-center gap-4">
              <span className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
                  Planificado:
              </span>
              <span className="font-mono font-semibold">
                {`${(data.planned || 0).toFixed(2)}%`} ({formatCurrency(data.cumulativePlannedValue || 0, 0)})
              </span>
          </div>
          
          {relevantPayload.length > 0 && <div className="border-t my-2" />}

          {/* Líneas para los proveedores */}
           {relevantPayload.map((p) => {
              const name = p.name as string;
              const color = p.color || p.stroke;
              const providerDistribution = data.providerDistribution || {};
              const providerPercentage = providerDistribution[name] || 0;
              const providerCumulative = (data.cumulativeProviders || {})[name] || 0;

              return (
                  <div key={name} className="flex justify-between items-center gap-4">
                      <span className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
                          {name}:
                      </span>
                      <span className="font-mono font-semibold">
                        {`${(providerPercentage).toFixed(2)}%`} ({formatCurrency(providerCumulative, 0)})
                      </span>
                  </div>
              )
           })}

           <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t">
                <span className="font-semibold">Desviación (Costo):</span>
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
        const standardKeys = new Set(['date', 'planned', 'actual', 'cumulativePlannedValue', 'cumulativeActualValue', 'deviation', 'cumulativeProviders', 'providerDistribution']);
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
                <stop offset="5%" stopColor={chartConfig.planned.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartConfig.planned.color} stopOpacity={0.1} />
              </linearGradient>
              {providerKeys.map((key) => {
                 const color = chartConfig[key]?.color;
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


