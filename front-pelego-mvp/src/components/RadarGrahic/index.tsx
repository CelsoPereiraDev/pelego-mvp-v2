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
import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';

interface RadarGraphicProps {
  title: string;
  description: string;
  footer?: React.ReactNode;
  chartData: Array<{ stat: string; valor: number }>;
  chartConfig: ChartConfig;
  maxDomain?: number;
}

export function RadarGraphic({
  title,
  description,
  footer,
  chartData,
  chartConfig,
  maxDomain = 100,
}: RadarGraphicProps) {
  return (
    <Card className="w-auto min-w-[345px] h-min">
      <CardHeader className="items-center pb-4 ">
        <CardTitle className="text-[hsl(var(--foreground))]">{title}</CardTitle>
        <CardDescription className="text-[hsl(var(--muted-foreground))] text-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full">
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--muted-foreground))" />
            <PolarAngleAxis dataKey="stat" stroke="hsl(var(--foreground))" />
            <PolarRadiusAxis
              domain={[0, maxDomain]}
              stroke="hsl(var(--foreground))"
              tick={false}
              axisLine={false}
            />
            <Radar
              dataKey="valor"
              fill={chartConfig.desktop.color}
              fillOpacity={0.6}
              stroke={chartConfig.desktop.color}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>
        <CardFooter>{footer}</CardFooter>
      </CardContent>
    </Card>
  );
}
