"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { SCurveData } from "@/lib/types"

interface SCurveChartProps {
    data: SCurveData[];
}

const chartConfig = {
  planned: {
    label: "Planificado",
    color: "hsl(var(--primary))",
  },
  actual: {
    label: "Real",
    color: "hsl(var(--accent))",
  },
}

export function SCurveChart({ data }: SCurveChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="day" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `Día ${value}`}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Legend />
          <Line
            dataKey="planned"
            type="monotone"
            stroke="var(--color-planned)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="actual"
            type="monotone"
            stroke="var(--color-actual)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
