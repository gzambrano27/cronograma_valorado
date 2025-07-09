"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"

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
  // Memoize chart data to add a fill property for the cells.
  // This ensures consistent colors defined in the config are used.
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      fill: `var(--color-${item.status})`,
    }));
  }, [data]);
  
  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          // Correctly use "status" as the nameKey to look up the proper label in the config.
          content={<ChartTooltipContent hideLabel nameKey="status" />}
        />
        <Pie
          data={chartData}
          dataKey="tasks"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
        >
           {/* Add explicit Cells to apply the correct colors */}
           {chartData.map((entry) => (
            <Cell key={`cell-${entry.status}`} fill={entry.fill} />
          ))}
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
          // Use nameKey="status" so the legend can look up the label in the config
          content={<ChartLegendContent nameKey="status" className="text-xs" />}
          className="-translate-y-[15px] flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
