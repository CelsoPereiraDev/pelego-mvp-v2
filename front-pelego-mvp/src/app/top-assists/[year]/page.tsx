'use client';

import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PlayerAssistsStats {
  name: string;
  assists: number;
  weeksPlayed: number;
  averageAssistsPerWeek: number;
}

const TopAssistsByDate: React.FC = () => {
  const params = useParams();
  const year = params.year;

  const { weeks, isLoading, isError } = useWeeksByDate(year.toString());

  const [topAssists, setTopAssists] = useState<PlayerAssistsStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerAssistsStats;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const playerAssistsMap: { [playerId: string]: PlayerAssistsStats } = {};
      const processedMatches = new Set<string>();

      weeks.forEach((week) => {
        week.teams
          .flatMap((team) => team.matchesHome.concat(team.matchesAway))
          .forEach((match) => {
            if (!processedMatches.has(match.id)) {
              processedMatches.add(match.id);

              match.assists.forEach((assist) => {
                if (assist.player) {
                  if (!playerAssistsMap[assist.player.id]) {
                    playerAssistsMap[assist.player.id] = {
                      name: assist.player.name,
                      assists: 0,
                      weeksPlayed: weeks.length,
                      averageAssistsPerWeek: 0,
                    };
                  }
                  playerAssistsMap[assist.player.id].assists += 1;
                }
              });
            }
          });
      });

      // Calcula a média de assistências por semana para cada jogador
      Object.values(playerAssistsMap).forEach((player) => {
        player.averageAssistsPerWeek = player.assists / player.weeksPlayed;
      });

      const sortedAssists = Object.values(playerAssistsMap).sort((a, b) => b.assists - a.assists);
      setTopAssists(sortedAssists);
    }
  }, [weeks, isLoading, isError]);

  const sortedStats = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...topAssists].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return topAssists;
  }, [topAssists, sortConfig]);

  const requestSort = (key: keyof PlayerAssistsStats) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  if (isError) return <div className="text-[hsl(var(--foreground))]">Error: {isError.message}</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
        Maiores Assistentes de {year}
      </h1>
      <div className="overflow-x-auto w-full max-w-[1200px]">
        <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
          <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            <tr>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort('name')}>
                Nome
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort('assists')}>
                Assistências
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort('weeksPlayed')}>
                Semanas Jogadas
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort('averageAssistsPerWeek')}>
                Média de Assistências por Semana
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((player, index) =>
              weeks && player.weeksPlayed >= weeks.length / 2 ? (
                <tr
                  key={index}
                  className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors">
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.assists}</td>
                  <td className="px-4 py-2">{player.weeksPlayed}</td>
                  <td className="px-4 py-2">{player.averageAssistsPerWeek.toFixed(2)}</td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopAssistsByDate;
