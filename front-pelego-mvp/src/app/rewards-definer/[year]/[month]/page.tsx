'use client';

import {
  AssistCard,
  DefenderCard,
  MonthChampionCard,
  MostPointerCard,
  NormalPlayerCard,
  StrikerCard,
  TeamOfTheMonthCard,
} from '@/components/PlayerCardSmall';
import { Player } from '@/types/player';
import SelectWithSearch from '@/components/SelectWithSearch';
import { usePlayers } from '@/services/player/usePlayers';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { calculateBestOfEachPosition, CalculateBestOfEachPositionProps } from '@/utils/calculateBestOfPositions';
import { calculateMonthResume, MonthResumeProps } from '@/utils/calculateMonthResume';
import { useFut } from '@/contexts/FutContext';
import { useToast } from '@/hooks/use-toast';
import { finalizeMonth as finalizeMonthApi, isMonthFinalized } from '@/services/stats/resources';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

interface FilteredPlayer extends Player {
  category: string;
  count: number;
}

interface PositionPlayerData {
  name: string;
  point: number;
  goalsScore?: number;
  assistScore?: number;
  goalsAgainstScore?: number;
  pointsScore?: number;
  champioshipScore?: number;
}

const categories = [
  { key: 'mvp', title: 'MVP' },
  { key: 'topPointer', title: 'Maior Pontuador' },
  { key: 'scorer', title: 'Paulo Baier' },
  { key: 'assists', title: 'BANP' },
  { key: 'bestDefender', title: 'Dedé do Vasco', sort: 'asc' },
  { key: 'lvp', title: 'LVP', sort: 'asc' },
];

const getCategoryLabel = (count: number, categoryKey: string) => {
  switch (categoryKey) {
    case 'Paulo Baier':
      return `${count} gols`;
    case 'BANP':
      return `${count} assistências`;
    case 'MVP':
      return `${count}x Campeão semanal`;
    case 'LVP':
      return `${count}% Pontos/Jogo`;
    case 'Dedé do Vasco':
      return `${count} Gols sofridos/J`;
    default:
      return `${count} Pontos`;
  }
};

const getBadge = (categoryKey: string, playerData: Player) => {
  switch (categoryKey) {
    case 'Paulo Baier':
      return <StrikerCard playerData={playerData} showOverall={true} />;
    case 'BANP':
      return <AssistCard playerData={playerData} showOverall={true} />;
    case 'MVP':
      return <MonthChampionCard playerData={playerData} showOverall={true} />;
    case 'LVP':
      return <NormalPlayerCard playerData={{ ...playerData, monthLVP: true }} showOverall={true} />;
    case 'Dedé do Vasco':
      return <DefenderCard playerData={playerData} showOverall={true} />;
    case 'Maior Pontuador':
      return <MostPointerCard playerData={playerData} showOverall={true} />;
    case 'Atackers':
    case 'Midfielders':
    case 'Defenders':
    case 'Goalkeepers':
      return <TeamOfTheMonthCard playerData={playerData} showOverall={true} />;
    default:
      return null;
  }
};

const getCategoryLabelInPortuguese = (category: string) => {
  switch (category) {
    case 'Atackers':
      return 'Atacante';
    case 'Midfielders':
      return 'Meio-campo';
    case 'Defenders':
      return 'Defensor';
    case 'Goalkeepers':
      return 'Goleiro';
    default:
      return category;
  }
};

const MonthResume: React.FC = () => {
  const { year, month } = useParams();
  const { futId } = useFut();
  const { toast } = useToast();
  const { weeks, isLoading, isError } = useWeeksByDate(year as string, month as string);

  const { players } = usePlayers();
  const [monthResume, setMonthResume] = useState<MonthResumeProps | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, string>>({});
  const [bestOfEachPosition, setBestOfEachPosition] = useState<CalculateBestOfEachPositionProps | null>(null);
  const [filteredPlayers, setFilteredPlayers] = useState<FilteredPlayer[]>([]);
  const [teamOfTheMonth, setTeamOfTheMonth] = useState<FilteredPlayer[]>([]);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Verificar se o mês já foi finalizado
  useEffect(() => {
    if (futId && year && month) {
      isMonthFinalized(futId, year as string, month as string)
        .then(({ finalized }) => setIsFinalized(finalized))
        .catch(() => {});
    }
  }, [futId, year, month]);

  useEffect(() => {
    if (weeks && !isLoading && !isError) {
      // Calcular os dados de resumo do mês e os melhores de cada posição
      setMonthResume(calculateMonthResume(weeks));
      setBestOfEachPosition(calculateBestOfEachPosition(weeks));
    }
  }, [weeks, isLoading, isError]);

  // Atualizar filteredPlayers quando os valores padrões forem carregados
  useEffect(() => {
    if (players && bestOfEachPosition && monthResume) {
      const initialSelectedPlayers: Record<string, string> = {};

      // Preencher selectedPlayers com os valores padrão das categorias
      categories.forEach((category) => {
        const defaultPlayer = monthResume[category.key as keyof MonthResumeProps]?.[0]?.name;
        if (defaultPlayer) {
          initialSelectedPlayers[category.key] = defaultPlayer;
        }
      });

      // Preencher selectedPlayers com os valores padrão das posições
      ['atackers', 'midfielders', 'defenders', 'goalkeepers'].forEach((position) => {
        const sortedPlayers = bestOfEachPosition[position as keyof CalculateBestOfEachPositionProps]?.sort((a, b) => b.point - a.point);
        const defaultFirstPlayer = sortedPlayers?.[0]?.name;
        const defaultSecondPlayer = sortedPlayers?.[1]?.name || defaultFirstPlayer;

        if (defaultFirstPlayer) {
          initialSelectedPlayers[position] = defaultFirstPlayer;
          initialSelectedPlayers[`${position}_second`] = defaultSecondPlayer!;
        }
      });

      setSelectedPlayers(initialSelectedPlayers);
    }
  }, [players, bestOfEachPosition, monthResume]);

  const handlePlayerSelect = (categoryKey: string, selectedPlayerName: string) => {
    const updatedPlayers = { ...selectedPlayers, [categoryKey]: selectedPlayerName };
    setSelectedPlayers(updatedPlayers);
  };

  const handleFinalizeMonth = useCallback(async () => {
    if (!futId || isFinalized || isFinalizing) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja finalizar este mês? Esta ação é irreversível.',
    );
    if (!confirmed) return;

    setIsFinalizing(true);

    const findPlayerId = (playerName: string) =>
      players.find((p) => p.name === playerName)?.id || '';

    const awards = {
      mvp: { playerId: findPlayerId(selectedPlayers.mvp), playerName: selectedPlayers.mvp },
      topPointer: { playerId: findPlayerId(selectedPlayers.topPointer), playerName: selectedPlayers.topPointer },
      scorer: { playerId: findPlayerId(selectedPlayers.scorer), playerName: selectedPlayers.scorer },
      assists: { playerId: findPlayerId(selectedPlayers.assists), playerName: selectedPlayers.assists },
      bestDefender: { playerId: findPlayerId(selectedPlayers.bestDefender), playerName: selectedPlayers.bestDefender },
      lvp: { playerId: findPlayerId(selectedPlayers.lvp), playerName: selectedPlayers.lvp },
    };

    const teamOfTheMonthPayload = {
      atackers: [selectedPlayers.atackers, selectedPlayers.atackers_second].filter(Boolean),
      midfielders: [selectedPlayers.midfielders, selectedPlayers.midfielders_second].filter(Boolean),
      defenders: [selectedPlayers.defenders, selectedPlayers.defenders_second].filter(Boolean),
      goalkeepers: [selectedPlayers.goalkeepers].filter(Boolean),
    };

    try {
      await finalizeMonthApi(futId, year as string, month as string, {
        awards,
        teamOfTheMonth: teamOfTheMonthPayload,
      });
      setIsFinalized(true);
      toast({ title: 'Mês finalizado com sucesso!' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar mês',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [futId, year, month, selectedPlayers, players, isFinalized, isFinalizing, toast]);

  const handleFilterPlayers = () => {
    const filtered: FilteredPlayer[] = [];
    const teamOfTheMonthLocal: FilteredPlayer[] = []; // Lista para jogadores de Atackers, Midfielders, Defenders

    // Para cada categoria, pegar os jogadores selecionados daquela categoria específica
    categories.forEach((category) => {
      const categoryData = monthResume?.[category.key as keyof MonthResumeProps];
      if (categoryData) {
        categoryData.forEach((playerData) => {
          const player = players.find((p) => p.name === playerData.name);
          // Somente filtrar o jogador se ele estiver no valor padrão ou selecionado para aquela categoria
          if (player && selectedPlayers[category.key] === player.name) {
            filtered.push({
              ...player,
              category: category.title,
              count: playerData.count,
            });
          }
        });
      }
    });

    // Para as posições, pegar os jogadores selecionados
    ['atackers', 'midfielders', 'defenders', 'goalkeepers'].forEach((position) => {
      const positionData = bestOfEachPosition?.[position as keyof CalculateBestOfEachPositionProps];
      if (positionData) {
        positionData.forEach((playerData) => {
          const player = players.find((p) => p.name === playerData.name);
          if (
            player &&
            (selectedPlayers[position] === player.name ||
              selectedPlayers[`${position}_second`] === player.name)
          ) {
            teamOfTheMonthLocal.push({
              ...player,
              category: position.charAt(0).toUpperCase() + position.slice(1),
              count: playerData.point, // Número de pontos na posição
            });
          }
        });
      }
    });

    setFilteredPlayers(filtered);
    setTeamOfTheMonth(teamOfTheMonthLocal); // Adicionar a "Seleção do Mês"
    setIsButtonClicked(true); // Definir que o botão foi clicado
  };

  const renderCategory = (category: { key: string; title: string; sort?: string }) => {
    let data = monthResume?.[category.key as keyof MonthResumeProps]?.sort((a, b) => b.count - a.count) || [];
    if (category.sort === 'asc') {
      data = [...data].sort((a, b) => a.count - b.count);
    }
    const defaultPlayer = data[0]?.name;

    return (
      <div key={category.key} className="flex flex-col">
        <h2 className="text-xl font-bold">{category.title}</h2>
        <SelectWithSearch
          isMulti={false}
          isDisabled={isFinalized}
          options={data.map((player) => ({ label: player.name, value: player.name }))}
          value={{
            label: selectedPlayers[category.key] || defaultPlayer,
            value: selectedPlayers[category.key] || defaultPlayer,
          }}
          onChange={(option) => handlePlayerSelect(category.key, option?.value ?? '')}
        />
      </div>
    );
  };

  const renderPositionSelects = (positionKey: string, positionTitle: string, players: PositionPlayerData[]) => {
    const sortedPlayers = [...players].sort((a, b) => b.point - a.point);
    const defaultFirstPlayer = sortedPlayers[0]?.name;
    const defaultSecondPlayer = sortedPlayers[1]?.name || defaultFirstPlayer;

    return (
      <div key={positionKey} className="flex flex-col">
        <h2 className="text-xl font-bold">{positionTitle}</h2>
        <SelectWithSearch
          isMulti={false}
          isDisabled={isFinalized}
          options={sortedPlayers.map((player) => ({ label: player.name, value: player.name }))}
          value={{
            label: selectedPlayers[positionKey] || defaultFirstPlayer,
            value: selectedPlayers[positionKey] || defaultFirstPlayer,
          }}
          onChange={(option) => handlePlayerSelect(positionKey, option?.value ?? '')}
        />
        {positionKey !== 'goalkeepers' && (
          <SelectWithSearch
            isMulti={false}
            isDisabled={isFinalized}
            options={sortedPlayers.map((player) => ({ label: player.name, value: player.name }))}
            value={{
              label: selectedPlayers[`${positionKey}_second`] || defaultSecondPlayer,
              value: selectedPlayers[`${positionKey}_second`] || defaultSecondPlayer,
            }}
            onChange={(option) => handlePlayerSelect(`${positionKey}_second`, option?.value ?? '')}
          />
        )}
      </div>
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !monthResume || !bestOfEachPosition) return <div>Error loading data</div>;

  return (
    <div className="min-h-screen p-8">
      <div className="grid grid-cols-3 gap-4">
        {categories.map(renderCategory)}
        {renderPositionSelects('atackers', 'Atacantes', bestOfEachPosition.atackers)}
        {renderPositionSelects('midfielders', 'Meio-campistas', bestOfEachPosition.midfielders)}
        {renderPositionSelects('defenders', 'Defensores', bestOfEachPosition.defenders)}
        {renderPositionSelects('goalkeepers', 'Goleiros', bestOfEachPosition.goalkeepers)}
      </div>

      <div className="flex gap-4 mt-4">
        <button className="p-2 bg-blue-500 text-white rounded" onClick={handleFilterPlayers} disabled={isFinalized}>
          Filtrar Jogadores Selecionados
        </button>

        <button
          className="p-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleFinalizeMonth}
          disabled={isFinalized || isFinalizing}
        >
          {isFinalizing ? 'Finalizando...' : isFinalized ? 'Mês Finalizado' : 'Finalizar Mês'}
        </button>
      </div>

      {isFinalized && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded border border-green-300">
          Este mês já foi finalizado. As premiações não podem mais ser alteradas.
        </div>
      )}

      <h2 className="text-3xl font-bold my-8">Recompensas do mês</h2>
      {isButtonClicked && filteredPlayers.length > 0 && (
        <div className="">
          <h2 className="text-2xl font-bold my-6">Recompensas individuais</h2>
          <ul className="flex flex-row flex-wrap">
            {filteredPlayers.map((player, index) => (
              <li key={index} className="p-2 flex flex-row ">
                <span className="text-2xl flex flex-col items-center max-w-[200px] text-wrap text-center justify-between">
                  {player.category}
                  {getBadge(player.category, player)}
                  <span className="text-lg max-w-[200px] text-wrap text-center">
                    {getCategoryLabel(player.count, player.category)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Renderizar Seleção do Mês */}
      {isButtonClicked && teamOfTheMonth.length > 0 && (
        <div className="">
          <h2 className="text-2xl font-bold my-6">Seleção do Mês</h2>
          <ul className="flex flex-row flex-wrap">
            {teamOfTheMonth.map((player, index) => (
              <li key={index} className="p-2 flex flex-row">
                <span className="text-2xl flex flex-col items-center">
                  {getCategoryLabelInPortuguese(player.category)} {/* Exibir a posição traduzida */}
                  {getBadge(player.category, player)} {/* Badge específica para cada jogador */}
                  <span className="text-lg max-w-[200px] text-wrap text-center">
                    {getCategoryLabel(player.count, player.category)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MonthResume;
