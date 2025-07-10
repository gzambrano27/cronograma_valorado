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
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface ProjectValueChartProps {
  data: { name: string; value: number }[]
}

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
            content={<ChartTooltipContent 
                formatter={(value) => formatCurrency(value as number)} 
                labelKey="name"
                indicator="dot"
            />}
          />
          <Bar dataKey="value" fill="url(#fillBar)" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
