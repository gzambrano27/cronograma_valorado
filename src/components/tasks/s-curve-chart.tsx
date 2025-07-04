"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SCurveData } from "@/lib/types"

interface SCurveChartProps {
  data: SCurveData[]
}

const chartConfig = {
  planned: {
    label: "Planificado",
    color: "hsl(var(--muted-foreground))",
  },
  actual: {
    label: "Real",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SCurveChart({ data }: SCurveChartProps) {
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
          </defs>
          <Tooltip
            cursor
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value) => `${value}%`}
              />
            }
          />
          <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: '1rem'}}/>
          <Area
            dataKey="planned"
            type="monotone"
            fill="url(#fillPlanned)"
            stroke="var(--color-planned)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="actual"
            type="monotone"
            stroke="var(--color-actual)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
