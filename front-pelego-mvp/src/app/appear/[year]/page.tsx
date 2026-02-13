'use client';

import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PlayerParticipationStats {
  name: string;
  count: number;
  participation: number;
}

const PlayerParticipationByMonth: React.FC = () => {
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const { weeks, isLoading, isError } = useWeeksByDate(year.toString());

  const [playerParticipationList, setPlayerParticipationList] = useState<
    PlayerParticipationStats[]
  >([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PlayerParticipationStats;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const playerParticipationMap: { [key: string]: { name: string; count: number } } = {};

      weeks.forEach((week) => {
        week.teams.forEach((team) => {
          team.players.forEach((teamMember) => {
            const playerId = teamMember.player.id;
            const playerName = teamMember.player.name;
            if (!playerParticipationMap[playerId]) {
              playerParticipationMap[playerId] = { name: playerName, count: 0 };
            }
            playerParticipationMap[playerId].count += 1;
          });
        });
      });

      const totalWeeks = weeks.length;

      const participationList: PlayerParticipationStats[] = Object.values(
        playerParticipationMap,
      ).map((player) => ({
        name: player.name,
        count: player.count,
        participation: (player.count / totalWeeks) * 100,
      }));

      setPlayerParticipationList(
        participationList.sort((a, b) => b.participation - a.participation),
      );
    }
  }, [weeks, isLoading, isError]);

  const sortedStats = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...playerParticipationList].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return playerParticipationList;
  }, [playerParticipationList, sortConfig]);

  const requestSort = (key: keyof PlayerParticipationStats) => {
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
        Participação de Jogadores em {year}
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
                onClick={() => requestSort('count')}>
                Presenças
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort('participation')}>
                Participação (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((player, index) => (
              <tr
                key={index}
                className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors">
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2">{player.count}</td>
                <td className="px-4 py-2">{player.participation.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerParticipationByMonth;
