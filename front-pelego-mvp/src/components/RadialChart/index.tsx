"use client"

import {
 Card,
 CardContent,
 CardDescription,
 CardFooter,
 CardHeader,
 CardTitle,
} from "@/components/ui/card"
import {
 ChartConfig,
 ChartContainer,
 ChartTooltip,
 ChartTooltipContent,
} from "@/components/ui/chart"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

interface RadialChartProps {
  valueInPercentage: string
  chartData: Array<{goals: string, APG: number, PIG: number }>;
  chartConfig: ChartConfig;
}

const chartData = [{ gols: "PPG", APG: 1260, PIG: 570 }]

const chartConfig = {
  APG: {
    label: "Desktop",
    color: "hsl(270, 100%, 50%)", // Cor roxa para Desktop
  },
  PIG: {
    label: "Mobile",
    color: "hsl(262.1 83.3% 65%)", // Outra tonalidade de roxo para Mobile
  },
} satisfies ChartConfig

export function RadialChart({ valueInPercentage, chartData,chartConfig}:RadialChartProps) {
  const totalVisitors = chartData[0].APG + chartData[0].PIG

  return (
    <Card className="flex flex-col h-min relative min-w-[345px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-[hsl(var(--foreground))] text-center">Participação direta em gols</CardTitle>
        <CardDescription className="text-[hsl(var(--muted-foreground))]">2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-[hsl(var(--foreground))] text-2xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-[hsl(var(--muted-foreground))]"
                        >
                          Gols do time
                        </tspan>
                      </text>
                    )
                  }
                }}
                className="pt-4"
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="APG"
              stackId="a"
              cornerRadius={5}
              fill={chartConfig.APG.color}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="PIG"
              fill={chartConfig.PIG.color}
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm absolute bottom-5 left-14">
        <div className="flex items-center gap-2 font-medium leading-none text-[hsl(var(--foreground))] max-w-[180px] text-center">
           Participou diretamente de {valueInPercentage} gols do seu time
        </div>
        <div className="leading-none text-[hsl(var(--muted-foreground))] max-w-[220px] text-center pt-2 text-xs">
          Valores referentes à todas as partidas disputadas
        </div>
      </CardFooter>
    </Card>
  )
}
