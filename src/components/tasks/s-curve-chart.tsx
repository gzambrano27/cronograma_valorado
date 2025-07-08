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
} from "recharts"
import { ArrowUp, ArrowDown } from "lucide-react"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SCurveData } from "@/lib/types"

interface SCurveChartProps {
  data: SCurveData[]
}

const chartConfig = {
  planned: {
    label: "Avance Planificado",
    color: "hsl(var(--muted-foreground))",
  },
  actual: {
    label: "Avance Real",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SCurveData;
    
    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[250px]">
        <p className="font-bold text-base mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-4">
                <span className="flex items-center text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: 'var(--color-planned)' }} />
                    Planificado:
                </span>
                <span className="font-mono font-semibold">{`${data.planned}% (${formatCurrency(data.cumulativePlannedValue)})`}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
                <span className="flex items-center text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: 'var(--color-actual)' }} />
                    Real:
                </span>
                <span className="font-mono font-semibold">{`${data.actual}% (${formatCurrency(data.cumulativeActualValue)})`}</span>
            </div>
             <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t">
                <span className="font-semibold">Desviación:</span>
                <span className={`font-mono font-bold flex items-center ${data.deviation < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {data.deviation > 0 && <ArrowUp className="h-4 w-4 mr-1" />}
                  {data.deviation < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                  {`${data.deviation}%`}
                </span>
            </div>
        </div>
      </div>
    );
  }

  return null;
};


export function SCurveChart({ data }: SCurveChartProps) {
  const [opacities, setOpacities] = React.useState({
    planned: 1,
    actual: 1,
  });

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    if (dataKey === 'planned' || dataKey === 'actual') {
        setOpacities(prev => ({
            ...prev,
            [dataKey]: prev[dataKey] === 1 ? 0.2 : 1,
        }));
    }
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={300}>
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
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <defs>
            <linearGradient id="fillPlanned" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-planned)"
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor="var(--color-planned)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-actual)"
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor="var(--color-actual)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={<CustomTooltip />}
          />
          <ChartLegend onClick={handleLegendClick} content={<ChartLegendContent />} align="right" verticalAlign="top" wrapperStyle={{paddingBottom: '1rem'}}/>
          <Area
            dataKey="planned"
            type="monotone"
            fill="url(#fillPlanned)"
            stroke="var(--color-planned)"
            strokeWidth={2}
            strokeOpacity={opacities.planned}
            fillOpacity={opacities.planned === 1 ? 0.4 : 0.1}
            activeDot={{ r: 6 }}
            dot={false}
          />
          <Area
            dataKey="actual"
            type="monotone"
            fill="url(#fillActual)"
            stroke="var(--color-actual)"
            strokeWidth={2}
            strokeOpacity={opacities.actual}
            fillOpacity={opacities.actual === 1 ? 0.4 : 0.1}
            activeDot={{ r: 6 }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
