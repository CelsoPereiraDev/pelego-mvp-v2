'use client'

import { Button } from '@/components/ui/button';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { calculateBestDefender } from '@/utils/calculateBestDefender';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface GoalsConcededStats {
  playerName: string;
  position: string;
  goalsConceded: number;
  averageGoalsConceded: number;
  weeksPlayed: number;
  averageGoalsConcededPerWeek: number;
}

const AssistLeaderPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;
  const { weeks, isLoading, isError } = useWeeksByDate(year.toString(), month?.toString());

  const [concededGoalsStats, setConcededGoalsStats] = useState<GoalsConcededStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof GoalsConcededStats, direction: 'asc' | 'desc' } | null>(null);

  function mapMonthNumberToText(monthNumber: number) {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthNumber - 1];
  }

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const stats = calculateBestDefender(weeks);
      setConcededGoalsStats(stats);
    }
  }, [weeks, isLoading, isError]);

  const sortedStats = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...concededGoalsStats].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return concededGoalsStats;
  }, [concededGoalsStats, sortConfig]);

  const requestSort = (key: keyof GoalsConcededStats) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  }

  if (isError) {
    return <div className="text-[hsl(var(--foreground))]">Error loading data</div>;
  }

  const goToPreviousMonth = () => {
    let newYear = year;
    let newMonth = month ? month - 1 : 12;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    router.push(`/best-defender/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/best-defender/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <div className='flex justify-between w-full max-w-[1200px]'>
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
        Melhores Defensores de {month ? `${mapMonthNumberToText(month)}` : `Ano ${year}`}
      </h1>
      <Button variant="outline" size="icon" onClick={goToNextMonth}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
      </div>
      <div className="overflow-x-auto w-full max-w-[1200px]">
        <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
          <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('playerName')}>Nome</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('position')}>Posição</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('goalsConceded')}>Gols Sofridos</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('averageGoalsConceded')}>Média de GS por partida</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('averageGoalsConcededPerWeek')}>Média de GS Por semana</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('weeksPlayed')}>Semanas jogadas</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((player, index) =>
              weeks && player.weeksPlayed >= weeks.length / 2 ? (
                <tr
                  key={index}
                  className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <td className="px-4 py-2">{player.playerName}</td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2">{player.goalsConceded}</td>
                  <td className="px-4 py-2">{player.averageGoalsConceded.toFixed(2)}</td>
                  <td className="px-4 py-2">{(player.goalsConceded / player.weeksPlayed).toFixed(2)}</td>
                  <td className="px-4 py-2">{player.weeksPlayed}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssistLeaderPage;
