"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react"

interface ProjectValueChartProps {
  data: { name: string; value: number; consumed: number; progress: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl text-sm min-w-[280px]">
        <p className="font-bold text-base mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="flex items-center text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Valor Total:
            </span>
            <span className="font-mono font-semibold">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="flex items-center text-muted-foreground">
              <TrendingDown className="h-4 w-4 mr-2" />
              Valor Consumido:
            </span>
            <span className="font-mono font-semibold">{formatCurrency(data.consumed)}</span>
          </div>
          <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t">
            <span className="flex items-center font-semibold">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Progreso:
            </span>
             <span className="font-mono font-semibold">{`${data.progress.toFixed(2)}%`}</span>
          </div>
          <Progress value={data.progress} className="h-2" />
        </div>
      </div>
    );
  }

  return null;
};

export function ProjectValueChart({ data }: ProjectValueChartProps) {
  return (
    <ChartContainer config={{}} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          layout="vertical"
        >
           <defs>
              <linearGradient id="fillBar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              </linearGradient>
            </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number"
            tickFormatter={(value) => `$${Number(value).toLocaleString('es-ES', { notation: 'compact' })}`}
            axisLine={false}
            tickLine={false}
            className="text-xs"
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tickLine={false}
            axisLine={false}
            width={120}
            tick={{ fontSize: 12 }}
            className="text-xs"
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="value" fill="url(#fillBar)" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
