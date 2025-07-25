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

interface SCurveChartProps {
  data: SCurveData[]
  showCostBreakdown?: boolean
}


const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SCurveData;
    const isCostView = 'cumulativeProviders' in data;

    const tooltipItems = payload.map((p, index) => {
        const name = p.name as string;
        const value = p.value as number;
        const color = p.color || p.stroke;

        let cumulativeValue = 0;
        if(name === 'Planificado') cumulativeValue = data.cumulativePlannedValue;
        else if(name === 'Real') cumulativeValue = data.cumulativeActualValue;

        if (isCostView && data.cumulativeProviders && name !== 'Planificado' && name !== 'Real') {
             const providerCumulative = Object.entries(data.cumulativeProviders).find(([providerName]) => providerName === name);
             if (providerCumulative) {
                 cumulativeValue = providerCumulative[1];
             }
        }
        
        if (isCostView && !value && name !== 'Planificado' && name !== 'Real') return null;

        return (
            <div key={index} className="flex justify-between items-center gap-4">
                <span className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
                    {name}:
                </span>
                <span className="font-mono font-semibold">{`${(value || 0).toFixed(2)}%`}
                 {(isCostView && cumulativeValue > 0) && ` (${formatCurrency(cumulativeValue, 0)})`}
                </span>
            </div>
        )
    }).filter(Boolean);

    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[250px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
           {tooltipItems}
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

const providerColors = [
  "hsl(262.1 83.3% 57.8%)",
  "hsl(221.2 83.2% 53.3%)",
  "hsl(172.2 68.5% 42.4%)",
  "hsl(314.3 86.8% 54.3%)",
  "hsl(24.6 95% 53.1%)",
  "hsl(142.1 76.2% 36.3%)",
  "hsl(210, 40%, 50%)",
  "hsl(350, 65%, 55%)"
];


export const SCurveChart = React.forwardRef<HTMLDivElement, SCurveChartProps>(
  ({ data, showCostBreakdown = false }, ref) => {

    const providerKeys = React.useMemo(() => {
        if (!showCostBreakdown || !data || data.length === 0) return [];
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
    }, [data, showCostBreakdown]);

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

        if (showCostBreakdown) {
             providerKeys.forEach((name, index) => {
                 config[name] = {
                     label: name,
                     color: providerColors[index % providerColors.length],
                 }
             });
        }
        return config;
    }, [providerKeys, showCostBreakdown]);

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
              <linearGradient id="fillPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-planned)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-planned)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-actual)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-actual)" stopOpacity={0.1} />
              </linearGradient>
              {providerKeys.map((key) => {
                 const color = chartConfig[key]?.color;
                 if (!color) return null;
                 return (
                    <linearGradient key={`fill-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#fillPlanned)"
              stroke="var(--color-planned)"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
              name={chartConfig.planned.label}
            />

            {showCostBreakdown ? (
              <>
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
                            fill={`url(#fill-${key})`}
                            stroke={providerConfig.color}
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                            dot={false}
                            name={providerConfig.label as string}
                        />
                    )
                })}
              </>
            ) : (
              <Area
                  dataKey="actual"
                  type="monotone"
                  fill="url(#fillActual)"
                  stroke="var(--color-actual)"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={false}
                  name={chartConfig.actual.label}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }
);
SCurveChart.displayName = 'SCurveChart';