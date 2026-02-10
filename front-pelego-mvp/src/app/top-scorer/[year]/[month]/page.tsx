'use client';

import { Button } from '@/components/ui/button';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PlayerGoalsStats {
  name: string;
  goals: number;
  weeksPlayed: number;
  averageGoalsPerWeek: number;
}

const TopScorersByDate: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;

  const { weeks, isLoading, isError } = useWeeksByDate(year.toString(), month?.toString());

  const [topScorers, setTopScorers] = useState<PlayerGoalsStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlayerGoalsStats; direction: 'asc' | 'desc' } | null>(null);

  function mapMonthNumberToText(monthNumber: number) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return months[monthNumber - 1];
  }

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const playerGoalsMap: { [playerId: string]: PlayerGoalsStats } = {};
      const processedMatches = new Set<string>();

      weeks.forEach((week) => {
        week.teams.flatMap((team) => team.matchesHome.concat(team.matchesAway)).forEach((match) => {
          if (!processedMatches.has(match.id)) {
            processedMatches.add(match.id);

            match.goals.forEach((goal) => {
              if (goal.player) {
                if (!playerGoalsMap[goal.player.id]) {
                  playerGoalsMap[goal.player.id] = {
                    name: goal.player.name,
                    goals: 0,
                    weeksPlayed: weeks.length, // Define weeksPlayed como weeks.length aqui
                    averageGoalsPerWeek: 0,
                  };
                }
                playerGoalsMap[goal.player.id].goals += goal.goals;
              }
            });
          }
        });
      });

      // Calcula a média de gols por semana para cada jogador
      Object.values(playerGoalsMap).forEach((player) => {
        player.averageGoalsPerWeek = player.goals / player.weeksPlayed;
      });

      const sortedScorers = Object.values(playerGoalsMap).sort((a, b) => b.goals - a.goals);
      setTopScorers(sortedScorers);
    }
  }, [weeks, isLoading, isError]);


  const sortedStats = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...topScorers].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return topScorers;
  }, [topScorers, sortConfig]);

  const requestSort = (key: keyof PlayerGoalsStats) => {
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

    router.push(`/top-scorer/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/top-scorer/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  if (isLoading) return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  if (isError) return <div className="text-[hsl(var(--foreground))]">Error: {isError.message}</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <div className="flex justify-between w-full max-w-[1200px]">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
          Artilharia de {month ? `${mapMonthNumberToText(month)}` : `Ano ${year}`}
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
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('goals')}>Gols Marcados</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('averageGoalsPerWeek')}>Média de Gols por Semana</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('weeksPlayed')}>Semanas Jogadas</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((player, index) =>
              (
                <tr
                  key={index}
                  className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.goals}</td>
                  <td className="px-4 py-2">{player.averageGoalsPerWeek.toFixed(2)}</td>
                  <td className="px-4 py-2">{player.weeksPlayed}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopScorersByDate;
