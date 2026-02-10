'use client';

import { Button } from '@/components/ui/button';
import { calculateSimplePlayerStats, SimplePlayerStats } from '@/mapper/playerStatMapper';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';


const PlayerStatsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;
  const { weeks, isLoading, isError } = useWeeksByDate(year.toString(), month?.toString());
  const [playerStats, setPlayerStats] = useState<SimplePlayerStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SimplePlayerStats; direction: 'asc' | 'desc' } | null>(null);

  function mapMonthNumberToText(monthNumber: number) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return months[monthNumber - 1];
  }

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const stats = calculateSimplePlayerStats(weeks);
      setPlayerStats(stats);
    }
  }, [weeks, isLoading, isError]);

  const sortedStats = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...playerStats].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return playerStats;
  }, [playerStats, sortConfig]);

  const requestSort = (key: keyof SimplePlayerStats) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const goToPreviousMonth = () => {
    let newYear = year;
    let newMonth = month ? month - 1 : 12;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    router.push(`/points/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/points/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <div className="flex justify-between w-full max-w-[1200px]">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
          Estatísticas dos Jogadores em {month ? `${mapMonthNumberToText(month)}` : `Ano ${year}`}
        </h1>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-x-auto w-full max-w-[1200px]">
        <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
          <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('name')}>Nome</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('points')}>Pontos</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('wins')}>Vitórias</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('draws')}>Empates</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('losses')}>Derrotas</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('pointsPercentage')}>Porcentagem de Pontos</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map(({ name, points, wins, draws, losses, pointsPercentage }, index) => (
              <tr key={index} className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors">
                <td className="px-4 py-2">{name}</td>
                <td className="px-4 py-2">{points}</td>
                <td className="px-4 py-2">{wins}</td>
                <td className="px-4 py-2">{draws}</td>
                <td className="px-4 py-2">{losses}</td>
                <td className="px-4 py-2">{pointsPercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerStatsPage;
