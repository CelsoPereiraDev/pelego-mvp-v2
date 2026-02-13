'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts';

interface ChartBarProps {
  title: string | React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  chartData: Array<{ name: string; value: number; fill: string }>;
  chartConfig: ChartConfig;
}

export function ChartBar({ title, description, footer, chartData, chartConfig }: ChartBarProps) {
  return (
    <Card className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]  max-h-[500px] min-w-[400px]">
      <CardHeader>
        <CardTitle className="text-[hsl(var(--foreground))] px-2">{title}</CardTitle>
        <CardDescription className="text-[hsl(var(--muted-foreground))] px-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            layout="vertical"
            width={400} // Largura total do gráfico
            height={400} // Altura do gráfico
            barSize={20} // Tamanho das barras ajustado
            barCategoryGap="10%" // Ajusta o espaço entre as barras
            margin={{
              left: 24, // Margem esquerda ajustada para rótulos
              right: 52,
            }}>
            <CartesianGrid
              horizontal={false}
              vertical={true}
              stroke="#27272a"
              strokeDasharray="none"
            />{' '}
            {/* Linhas horizontais */}
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{
                fill: 'hsl(var(--foreground))', // Cor do texto dos ticks
                fontSize: 10, // Tamanho da fonte do texto dos ticks
                fontWeight: 'bold', // Peso da fonte do texto dos ticks
              }}
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="value"
              layout="vertical"
              radius={5}
              fill="var(--color-value)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fill="hsl(var(--foreground))"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        {footer}
      </CardFooter>
    </Card>
  );
}
