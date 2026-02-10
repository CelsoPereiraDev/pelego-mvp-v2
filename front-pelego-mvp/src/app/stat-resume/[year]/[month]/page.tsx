'use client';

import { ChartBar } from '@/components/BarChart';
import SelectWithSearch from '@/components/SelectWithSearch';
import { Button } from '@/components/ui/button';
import { ChartConfig } from '@/components/ui/chart';
import { usePlayers } from '@/services/player/usePlayers';
import { useMonthResume } from '@/services/stats/useMonthResume';
import { Player } from '@/types/player';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

const MonthResume: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;

  const { players } = usePlayers();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  // Get excluded player IDs
  const excludedPlayerIds = selectedPlayers.map(player => player.id);

  // Call backend API with excluded player IDs
  const { monthResume, isLoading, error } = useMonthResume(
    year.toString(),
    month?.toString(),
    excludedPlayerIds
  );

  function mapMonthNumberToText(monthNumber: number) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return months[monthNumber - 1];
  }

  if (isLoading) {
    return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  }

  if (error) {
    return <div className="text-[hsl(var(--foreground))]">Error loading data</div>;
  }

  if (!monthResume) return null;

  const chartConfig: ChartConfig = {
    max: {
      label: "Valor Máximo",
      color: "hsl(261.2 72.6% 22.9%)",
    },
    secondHighest: {
      label: "Segundo Valor Mais Alto",
      color: "hsl(263.5 67.4% 34.9%)",
    },
    thirdHighest: {
      label: "Terceiro Valor Mais Alto",
      color: "hsl(263.4 69.3% 42.2%)",
    },
    fourthHighest: {
      label: "Quarto Valor Mais Alto",
      color: "hsl(263.4 70% 50.4%)",
    },
    fifthHighest: {
      label: "Quinto Valor Mais Alto",
      color: "hsl(262.1 83.3% 57.8%)",
    },
  };

  const categories = [
    { key: 'assists', title: <span className='mt-[2px]'>Assistências</span>, order: 'desc',  description: 'Quantidade de assistências', icon: <AutoAwesomeIcon className='text-[hsl(var(--light-hover))]'/> },
    { key: 'scorer', title: <span className='mt-[2px]'>Artilheiros</span>, order: 'desc', description: 'Quantidade de gols marcados',icon: <SportsSoccerIcon className='text-[hsl(var(--light-hover))]'/>},
    { key: 'mvp', title: <span className='mt-[2px]'>MVP</span>, order: 'desc', description: 'Quantidade de vezes que foi campeão da semana', icon: <EmojiEventsIcon className='text-[hsl(var(--light-hover))]'/> },
    { key: 'lvp', title: <span className='mt-[2px]'>LVP</span>, order: 'asc' , description: 'Porcentagem de aproveitamento' ,icon: <BatteryAlertIcon className='text-[hsl(var(--light-hover))]'/>},
    { key: 'bestDefender', title: <span className='mt-[2px]'>Melhor Defensor</span>, order: 'asc' ,description: 'Média de gols sofridos por partida' , icon: <LocalPoliceIcon className='text-[hsl(var(--light-hover))]'/>},
    { key: 'topPointer', title: <span className='mt-[2px]'>Maior Pontuador</span>, order: 'desc' ,description: 'Quantidade de pontos feitos',icon: <StarIcon className='text-[hsl(var(--light-hover))]'/>},
  ];

  const goToPreviousMonth = () => {
    let newYear = year;
    let newMonth = month ? month - 1 : 12;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    router.push(`/stat-resume/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/stat-resume/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const availablePlayers = players?.filter(player => !selectedPlayers.some(selected => selected.name === player.name));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8 gap-12">
      <div className="flex justify-between w-full max-w-[1200px]">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
          Prêmios individuais de {month ? `${mapMonthNumberToText(Number(month))}` : `Ano ${year}`}
        </h1>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <div className='grid grid-cols-3 gap-4'>
        {categories.map((category) => {
  let sortedData = monthResume[category.key as keyof typeof monthResume]
    .map(item => ({
      name: item.name,
      value: item.count,
      fill: chartConfig.max.color || 'hsl(261.2 72.6% 22.9%)' // Cor padrão
    }));

  // Ordena os dados de acordo com a configuração da categoria
  if (category.order === 'asc') {
    sortedData = sortedData.sort((a, b) => a.value - b.value);
  } else {
    sortedData = sortedData.sort((a, b) => b.value - a.value);
  }

  // Remover duplicatas com base no nome do jogador
  const uniqueData = sortedData.filter((item, index, self) =>
    index === self.findIndex((t) => t.name === item.name)
  );

  let lastValue = null;
  let lastColorIndex = -1;

  uniqueData.forEach((item, index) => {
    if (item.value !== lastValue) {
      lastColorIndex = index;
    }
    if (lastColorIndex === 0) item.fill = chartConfig.max.color || 'hsl(261.2 72.6% 22.9%)';
    else if (lastColorIndex === 1) item.fill = chartConfig.secondHighest.color || 'hsl(263.5 67.4% 34.9%)';
    else if (lastColorIndex === 2) item.fill = chartConfig.thirdHighest.color || 'hsl(263.4 69.3% 42.2%)';
    else if (lastColorIndex === 3) item.fill = chartConfig.fourthHighest.color || 'hsl(263.4 70% 50.4%)';
    else item.fill = chartConfig.fifthHighest.color || 'hsl(262.1 83.3% 57.8%)';

    lastValue = item.value;
  });

  return (
    <ChartBar
      key={category.key}
      title={
        <span className='flex flex-row gap-3'>
        {category.icon}
        {category.title}
        </span>
      }
      description={category.description}
      chartData={uniqueData} // Usar dados sem duplicatas
      chartConfig={chartConfig}
    />
  );
})}

        <SelectWithSearch
            isMulti
            placeholder='Jogadores'
            options={availablePlayers?.map(player => ({ label: player.name, value: player }))}
            value={selectedPlayers.map(player => ({ label: player.name, value: player }))}
            onChange={(selectedOptions) => setSelectedPlayers(selectedOptions.map((option: {
              label: string;
              value: Player;
          }) => option.value))}
          />
      </div>
    </div>
  );
};

export default MonthResume;
