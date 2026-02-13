'use client';

import { ChartBar } from '@/components/BarChart';
import { ChartConfig } from '@/components/ui/chart';
import { useMonthResume } from '@/services/stats/useMonthResume';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';
import { useParams } from 'next/navigation';
import React from 'react';

const MonthResume: React.FC = () => {
  const params = useParams();
  const year = params.year as string;
  const { monthResume, isLoading, error } = useMonthResume(year);

  if (isLoading) {
    return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  }

  if (error) {
    return <div className="text-[hsl(var(--foreground))]">Error loading data</div>;
  }

  if (!monthResume) return null;

  const chartConfig: ChartConfig = {
    max: {
      label: 'Valor Máximo',
      color: 'hsl(261.2 72.6% 22.9%)',
    },
    secondHighest: {
      label: 'Segundo Valor Mais Alto',
      color: 'hsl(263.5 67.4% 34.9%)',
    },
    thirdHighest: {
      label: 'Terceiro Valor Mais Alto',
      color: 'hsl(263.4 69.3% 42.2%)',
    },
    fourthHighest: {
      label: 'Quarto Valor Mais Alto',
      color: 'hsl(263.4 70% 50.4%)',
    },
    fifthHighest: {
      label: 'Quinto Valor Mais Alto',
      color: 'hsl(262.1 83.3% 57.8%)',
    },
  };

  const categories = [
    {
      key: 'assists',
      title: <span className="mt-[2px]">Assistências</span>,
      order: 'desc',
      description: 'Quantidade de assistências',
      icon: <AutoAwesomeIcon className="text-[hsl(var(--light-hover))]" />,
    },
    {
      key: 'scorer',
      title: <span className="mt-[2px]">Artilheiros</span>,
      order: 'desc',
      description: 'Quantidade de gols marcados',
      icon: <SportsSoccerIcon className="text-[hsl(var(--light-hover))]" />,
    },
    {
      key: 'mvp',
      title: <span className="mt-[2px]">MVP</span>,
      order: 'desc',
      description: 'Quantidade de vezes que foi campeão da semana',
      icon: <EmojiEventsIcon className="text-[hsl(var(--light-hover))]" />,
    },
    {
      key: 'lvp',
      title: <span className="mt-[2px]">LVP</span>,
      order: 'asc',
      description: 'Porcentagem de aproveitamento',
      icon: <BatteryAlertIcon className="text-[hsl(var(--light-hover))]" />,
    },
    {
      key: 'bestDefender',
      title: <span className="mt-[2px]">Melhor Defensor</span>,
      order: 'asc',
      description: 'Média de gols sofridos por partida',
      icon: <LocalPoliceIcon className="text-[hsl(var(--light-hover))]" />,
    },
    {
      key: 'topPointer',
      title: <span className="mt-[2px]">Maior Pontuador</span>,
      order: 'desc',
      description: 'Quantidade de pontos feitos',
      icon: <StarIcon className="text-[hsl(var(--light-hover))]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8 gap-12">
      <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
        Prêmios individuais de {year}
      </h1>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => {
          const colorMax = chartConfig.max.color!;
          const colorSecond = chartConfig.secondHighest.color!;
          const colorThird = chartConfig.thirdHighest.color!;
          const colorFourth = chartConfig.fourthHighest.color!;
          const colorFifth = chartConfig.fifthHighest.color!;

          let sortedData = monthResume[category.key as keyof typeof monthResume].map((item: { name: string; count: number }) => ({
            name: item.name,
            value: item.count,
            fill: colorMax,
          }));

          // Ordena os dados de acordo com a configuração da categoria
          if (category.order === 'asc') {
            sortedData = sortedData.sort((a: { value: number }, b: { value: number }) => a.value - b.value);
          } else {
            sortedData = sortedData.sort((a: { value: number }, b: { value: number }) => b.value - a.value);
          }

          // Mapeia as cores de acordo com a posição e valores iguais
          let lastValue: number | null = null;
          let lastColorIndex = -1;

          sortedData.forEach((item, index) => {
            if (item.value !== lastValue) {
              lastColorIndex = index;
            }
            if (lastColorIndex === 0) item.fill = colorMax;
            else if (lastColorIndex === 1) item.fill = colorSecond;
            else if (lastColorIndex === 2) item.fill = colorThird;
            else if (lastColorIndex === 3) item.fill = colorFourth;
            else item.fill = colorFifth;

            lastValue = item.value;
          });

          return (
            <ChartBar
              key={category.key}
              title={
                <span className="flex flex-row gap-3">
                  {category.icon}
                  {category.title}
                </span>
              }
              description={category.description}
              chartData={sortedData}
              chartConfig={chartConfig}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthResume;
