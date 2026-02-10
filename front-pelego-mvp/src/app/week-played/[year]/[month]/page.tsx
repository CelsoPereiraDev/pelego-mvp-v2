'use client';

import SelectWithSearch from '@/components/SelectWithSearch';
import { Button } from '@/components/ui/button';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface Player {
  id: string;
  name: string;
}

interface PlayerWeeksTogether {
  [playerName: string]: {
    [otherPlayerName: string]: number;
  };
}

interface TableSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const PlayerWeeksTogetherPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string, 10);
  const month = params.month ? parseInt(params.month as string, 10) : undefined;

  const { weeks, isLoading, isError } = useWeeksByDate(year.toString(), month?.toString());

  const [playerWeeksTogether, setPlayerWeeksTogether] = useState<PlayerWeeksTogether>({});
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [sortConfig, setSortConfig] = useState<TableSortConfig | null>(null);
  const [sortConfigAll, setSortConfigAll] = useState<TableSortConfig | null>(null);

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      const jogadorMap: PlayerWeeksTogether = {};
      const playersSet = new Set<Player>();

      weeks.forEach(week => {
        week.teams.forEach(team => {
          const jogadores = team.players.map(playerData => ({
            id: playerData.player.id,
            name: playerData.player.name
          }));

          jogadores.forEach(jogador => {
            playersSet.add(jogador); // Armazena todos os jogadores disponíveis

            if (!jogadorMap[jogador.name]) {
              jogadorMap[jogador.name] = {};
            }

            jogadores.forEach(outroJogador => {
              if (jogador.name !== outroJogador.name) {
                if (!jogadorMap[jogador.name][outroJogador.name]) {
                  jogadorMap[jogador.name][outroJogador.name] = 0;
                }
                jogadorMap[jogador.name][outroJogador.name]++;
              }
            });
          });
        });
      });

      setPlayerWeeksTogether(jogadorMap);
      setAvailablePlayers(Array.from(playersSet)); // Converte o Set para array de jogadores disponíveis
    }
  }, [weeks, isLoading, isError]);

  const goToPreviousMonth = () => {
    let newYear = year;
    let newMonth = month ? month - 1 : 12;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    router.push(`/player-weeks/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let newYear = year;
    let newMonth = month ? month + 1 : 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    router.push(`/player-weeks/${newYear}/${String(newMonth).padStart(2, '0')}`);
  };

  if (isLoading) return <div className="text-[hsl(var(--foreground))]">Loading...</div>;
  if (isError) return <div className="text-[hsl(var(--foreground))]">Error: {isError.message}</div>;

  const filteredData = selectedPlayers
    .map((player) => ({
      player,
      companions: playerWeeksTogether[player.name] || {}
    }));

  // Função para remover duplicatas e evitar casos como "Jogador A jogou com Jogador B" e vice-versa
  const uniquePairs = (data: PlayerWeeksTogether) => {
    const processedPairs = new Set<string>();
    const uniquePairsArray = Object.entries(data).flatMap(([player, companions]) =>
      Object.entries(companions).map(([companion, weeksTogether]) => {
        const pairKey = [player, companion].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          return { player, companion, weeksTogether };
        }
        return null;
      })
    );
    return uniquePairsArray.filter(pair => pair !== null);
  };

  // Jogadores que jogaram 2 ou mais vezes juntos (sem repetição)
  const moreThanTwoTimesTogether = uniquePairs(playerWeeksTogether)
    .filter(pair => pair!.weeksTogether >= 2)
    .map(pair => pair!);

  // Função para ordenar os dados
  const sortData = (data: any[], config: TableSortConfig | null) => {
    if (config) {
      return [...data].sort((a, b) => {
        if (a[config.key] < b[config.key]) {
          return config.direction === 'asc' ? -1 : 1;
        }
        if (a[config.key] > b[config.key]) {
          return config.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  };

  const sortedSelectedData = sortData(filteredData, sortConfig);
  const sortedAllData = sortData(moreThanTwoTimesTogether, sortConfigAll);

  const requestSort = (key: string, setConfig: React.Dispatch<React.SetStateAction<TableSortConfig | null>>, currentConfig: TableSortConfig | null) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (currentConfig && currentConfig.key === key && currentConfig.direction === 'asc') {
      direction = 'desc';
    }
    setConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] w-full flex flex-col items-center p-8">
      <div className="flex justify-between w-full max-w-[1200px]">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-semibold mb-8 text-[hsl(var(--foreground))]">
          Jogadores que jogaram juntos no mês
        </h1>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* SelectWithSearch para escolher os jogadores */}
      <div className="mb-8 w-full max-w-[1200px]">
        <SelectWithSearch
          isMulti
          placeholder="Selecione os jogadores"
          options={availablePlayers.map(player => ({ label: player.name, value: player }))}
          value={selectedPlayers.map(player => ({ label: player.name, value: player }))}
          onChange={(selectedOptions) => setSelectedPlayers(selectedOptions.map((option: { label: string; value: Player }) => option.value))}
        />
      </div>

      {/* Tabela para jogadores selecionados */}
      <div className="overflow-x-auto w-full max-w-[1200px] mb-8">
        {sortedSelectedData.length > 0 ? (
          <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('player', setSortConfig, sortConfig)}>Jogador</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('companion', setSortConfig, sortConfig)}>Jogou com</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('weeksTogether', setSortConfig, sortConfig)}>Semanas Juntas</th>
              </tr>
            </thead>
            <tbody>
              {sortedSelectedData.map(({ player, companions }) =>
                Object.entries(companions).map(([companionName, weeksTogether], index) => (
                  <tr
                    key={`${player.name}-${companionName}-${index}`}
                    className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <td className="px-4 py-2">{player.name}</td>
                    <td className="px-4 py-2">{companionName}</td>
                    <td className="px-4 py-2">{weeksTogether}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <p className="text-[hsl(var(--foreground))]">Selecione um jogador para ver os dados.</p>
        )}
      </div>

      {/* Tabela para jogadores que jogaram 2 ou mais vezes juntos */}
      <div className="overflow-x-auto w-full max-w-[1200px]">
        <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--foreground))]">
          Jogadores que jogaram 2 vezes ou mais juntos
        </h2>
        {sortedAllData.length > 0 ? (
          <table className="w-full border-collapse bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-md rounded-lg border border-[hsl(var(--border))] text-nowrap">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('player', setSortConfigAll, sortConfigAll)}>Jogador</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('companion', setSortConfigAll, sortConfigAll)}>Jogou com</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('weeksTogether', setSortConfigAll, sortConfigAll)}>Semanas Juntas</th>
              </tr>
            </thead>
            <tbody>
              {sortedAllData.map((pair, index) => (
                <tr
                  key={`${pair.player}-${pair.companion}-${index}`}
                  className="odd:bg-[hsl(var(--background))] even:bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <td className="px-4 py-2">{pair.player}</td>
                  <td className="px-4 py-2">{pair.companion}</td>
                  <td className="px-4 py-2">{pair.weeksTogether}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[hsl(var(--foreground))]">Nenhum jogador jogou 2 ou mais vezes junto.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerWeeksTogetherPage;
