"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface TaskStatusChartProps {
  data: any[]
  config: ChartConfig,
  totalTasks: number
}

export function TaskStatusChart({ data, config, totalTasks }: TaskStatusChartProps) {
  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="tasks" />}
        />
        <Pie
          data={data}
          dataKey="tasks"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
        >
           <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="text-3xl font-bold"
                    >
                      {totalTasks.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="text-sm text-muted-foreground"
                    >
                      Tareas
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="status" className="text-xs" />}
          className="-translate-y-[15px] flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
