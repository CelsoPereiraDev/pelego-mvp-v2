'use client'

import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { calculateBestDefender } from '@/utils/calculateBestDefender';
import { useParams } from 'next/navigation';
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
  const params = useParams();
  const year = params.year as string;
  const { weeks, isLoading, isError } = useWeeksByDate(year);

  const [concededGoalsStats, setConcededGoalsStats] = useState<GoalsConcededStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof GoalsConcededStats, direction: 'asc' | 'desc' } | null>(null);

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

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
        Melhores Defensores de  {year}
      </h1>
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
