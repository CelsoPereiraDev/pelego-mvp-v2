'use client';

import { Button } from '@/components/ui/button';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { calculateBestOfEachPosition } from '@/utils/calculateBestOfPositions';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PlayerResumeData {
  name: string;
  goalsScore?: number;
  assistScore?: number;
  goalsAgainstScore?: number;
  pointsScore?: number;
  champioshipScore?: number;
  point: number;
}

const TopPlayersByPosition: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;

  const { weeks, isLoading, isError } = useWeeksByDate(year.toString(), month?.toString());

  const [atackers, setAtackers] = useState<PlayerResumeData[]>([]);
  const [midfielders, setMidfielders] = useState<PlayerResumeData[]>([]);
  const [defenders, setDefenders] = useState<PlayerResumeData[]>([]);

  const [sortConfigAtackers, setSortConfigAtackers] = useState<{ key: keyof PlayerResumeData; direction: 'asc' | 'desc' } | null>(null);
  const [sortConfigMidfielders, setSortConfigMidfielders] = useState<{ key: keyof PlayerResumeData; direction: 'asc' | 'desc' } | null>(null);
  const [sortConfigDefenders, setSortConfigDefenders] = useState<{ key: keyof PlayerResumeData; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const { atackers, midfielders, defenders } = calculateBestOfEachPosition(weeks);
      setAtackers(atackers);
      setMidfielders(midfielders);
      setDefenders(defenders);
    }
  }, [weeks, isLoading, isError]);

  const compareValues = (key: keyof PlayerResumeData, direction: 'asc' | 'desc') => {
    return (a: PlayerResumeData, b: PlayerResumeData): number => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    };
  };

  const sortPlayers = (players: PlayerResumeData[], sortConfig: { key: keyof PlayerResumeData; direction: 'asc' | 'desc' } | null) => {
    if (sortConfig !== null) {
      return [...players].sort(compareValues(sortConfig.key, sortConfig.direction));
    }
    return players;
  };

  const requestSortAtackers = (key: keyof PlayerResumeData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigAtackers && sortConfigAtackers.key === key && sortConfigAtackers.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigAtackers({ key, direction });
  };

  const requestSortMidfielders = (key: keyof PlayerResumeData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigMidfielders && sortConfigMidfielders.key === key && sortConfigMidfielders.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigMidfielders({ key, direction });
  };

  const requestSortDefenders = (key: keyof PlayerResumeData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigDefenders && sortConfigDefenders.key === key && sortConfigDefenders.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigDefenders({ key, direction });
  };

  const goToPreviousMonth = () => {
    let newYear = year;
    let newMonth = month ? month - 1 : 12;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    router.push(`/best-of-position/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/best-of-position/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const renderTable = (title: string, players: PlayerResumeData[], sortConfig: { key: keyof PlayerResumeData; direction: 'asc' | 'desc' } | null, requestSort: (key: keyof PlayerResumeData) => void) => (
    <div className="w-full max-w-[1200px] mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--foreground))]">{title}</h2>
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
          <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('name')}>Nome</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('goalsScore')}>Gols</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('assistScore')}>Assistências</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('goalsAgainstScore')}>Média de gols sofridos</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('pointsScore')}>Pontos</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('champioshipScore')}>Campeão Semanal</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('point')}>Pontuação Final</th>
            </tr>
          </thead>
          <tbody>
            {sortPlayers(players, sortConfig).map((player, index) => (
              <tr
                key={index}
                className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2">{player.goalsScore}</td>
                <td className="px-4 py-2">{player.assistScore}</td>
                <td className="px-4 py-2">{player.goalsAgainstScore?.toFixed(2)}</td>
                <td className="px-4 py-2">{player.pointsScore}</td>
                <td className="px-4 py-2">{player.champioshipScore}</td>
                <td className="px-4 py-2">{player.point.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  if (isError) return <div className="text-[hsl(var(--foreground))]">Error: {isError.message}</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <div className="flex justify-between w-full max-w-[1200px]">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
          Melhor Jogador por Posição de {month ? `${mapMonthNumberToText(month)}` : `Ano ${year}`}
        </h1>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      {renderTable('Atacantes', atackers, sortConfigAtackers, requestSortAtackers)}
      {renderTable('Meio-Campo', midfielders, sortConfigMidfielders, requestSortMidfielders)}
      {renderTable('Defensores', defenders, sortConfigDefenders, requestSortDefenders)}
    </div>
  );
};

export default TopPlayersByPosition;

function mapMonthNumberToText(monthNumber: number) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[monthNumber - 1];
}
