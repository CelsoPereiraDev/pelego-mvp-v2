'use client';

import { AssistCard, DefenderCard, MonthChampionCard, MostPointerCard, NormalPlayerCard, StrikerCard, TeamOfTheMonthCard } from '@/components/PlayerCardSmall';
import SelectWithSearch from '@/components/SelectWithSearch';
import { usePlayers } from '@/services/player/usePlayers';
import { useWeeksByDate } from '@/services/weeks/useWeeksByDate';
import { calculateBestOfEachPosition } from '@/utils/calculateBestOfPositions';
import { calculateMonthResume } from '@/utils/calculateMonthResume';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';


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
      return  `${count} assistências`;
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

const getBadge = (categoryKey: string, playerData: any) => {
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
    default:
      return category; 
  }
};

const MonthResume: React.FC = () => {
  const router = useRouter();
  const { year, month } = useParams();
  const { weeks, isLoading, isError } = useWeeksByDate(year, month);
  
  const { players } = usePlayers();
  const [monthResume, setMonthResume] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [bestOfEachPosition, setBestOfEachPosition] = useState(null);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [teamOfTheMonth, setTeamOfTheMonth] = useState([]); // Armazena a "Seleção do Mês"
  const [isButtonClicked, setIsButtonClicked] = useState(false);

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
      const initialSelectedPlayers = {};

      // Preencher selectedPlayers com os valores padrão das categorias
      categories.forEach(category => {
        const defaultPlayer = monthResume[category.key]?.[0]?.name;
        if (defaultPlayer) {
          initialSelectedPlayers[category.key] = defaultPlayer;
        }
      });

      // Preencher selectedPlayers com os valores padrão das posições
      ['atackers', 'midfielders', 'defenders'].forEach(position => {
        const sortedPlayers = bestOfEachPosition[position]?.sort((a, b) => b.point - a.point);
        const defaultFirstPlayer = sortedPlayers[0]?.name;
        const defaultSecondPlayer = sortedPlayers[1]?.name || defaultFirstPlayer;

        if (defaultFirstPlayer) {
          initialSelectedPlayers[position] = defaultFirstPlayer;
          initialSelectedPlayers[`${position}_second`] = defaultSecondPlayer;
        }
      });

      setSelectedPlayers(initialSelectedPlayers);
    }
  }, [players, bestOfEachPosition, monthResume]);

  const handlePlayerSelect = (categoryKey: string, selectedPlayerName: string) => {
    const updatedPlayers = { ...selectedPlayers, [categoryKey]: selectedPlayerName };
    setSelectedPlayers(updatedPlayers);
  };

  const handleFilterPlayers = () => {
    const filtered = [];
    const teamOfTheMonth = []; // Lista para jogadores de Atackers, Midfielders, Defenders

    // Para cada categoria, pegar os jogadores selecionados daquela categoria específica
    categories.forEach(category => {
      const categoryData = monthResume[category.key];
      if (categoryData) {
        categoryData.forEach(playerData => {
          const player = players.find(p => p.name === playerData.name);
          // Somente filtrar o jogador se ele estiver no valor padrão ou selecionado para aquela categoria
          if (player && selectedPlayers[category.key] === player.name) {
            filtered.push({
              ...player,
              category: category.title,
              count: playerData.count
            });
          }
        });
      }
    });

    // Para as posições, pegar os jogadores selecionados
    ['atackers', 'midfielders', 'defenders'].forEach(position => {
      const positionData = bestOfEachPosition[position];
      if (positionData) {
        positionData.forEach(playerData => {
          const player = players.find(p => p.name === playerData.name);
          if (player && (selectedPlayers[position] === player.name || selectedPlayers[`${position}_second`] === player.name)) {
            teamOfTheMonth.push({
              ...player,
              category: position.charAt(0).toUpperCase() + position.slice(1),
              count: playerData.point // Número de pontos na posição
            });
          }
        });
      }
    });

    setFilteredPlayers(filtered);
    setTeamOfTheMonth(teamOfTheMonth); // Adicionar a "Seleção do Mês"
    setIsButtonClicked(true); // Definir que o botão foi clicado
  };

  const renderCategory = (category) => {
    let data = monthResume[category.key]?.sort((a, b) => b.count - a.count) || [];
    if (category.sort === 'asc') {
      data = data.sort((a, b) => a.count - b.count);
    }
    const defaultPlayer = data[0]?.name;

    return (
      <div key={category.key} className='flex flex-col'>
        <h2 className='text-xl font-bold'>{category.title}</h2>
        <SelectWithSearch
          isMulti={false}
          options={data.map(player => ({ label: player.name, value: player.name }))}
          value={{ label: selectedPlayers[category.key] || defaultPlayer, value: selectedPlayers[category.key] || defaultPlayer }}
          onChange={(option) => handlePlayerSelect(category.key, option.value)}
        />
      </div>
    );
  };

  const renderPositionSelects = (positionKey: string, positionTitle: string, players) => {
    const sortedPlayers = players.sort((a, b) => b.point - a.point);
    const defaultFirstPlayer = sortedPlayers[0]?.name;
    const defaultSecondPlayer = sortedPlayers[1]?.name || defaultFirstPlayer;

    return (
      <div key={positionKey} className='flex flex-col'>
        <h2 className='text-xl font-bold'>{positionTitle}</h2>
        <SelectWithSearch
          isMulti={false}
          options={sortedPlayers.map(player => ({ label: player.name, value: player.name }))}
          value={{ label: selectedPlayers[positionKey] || defaultFirstPlayer, value: selectedPlayers[positionKey] || defaultFirstPlayer }}
          onChange={(option) => handlePlayerSelect(positionKey, option.value)}
        />
        <SelectWithSearch
          isMulti={false}
          options={sortedPlayers.map(player => ({ label: player.name, value: player.name }))}
          value={{ label: selectedPlayers[`${positionKey}_second`] || defaultSecondPlayer, value: selectedPlayers[`${positionKey}_second`] || defaultSecondPlayer }}
          onChange={(option) => handlePlayerSelect(`${positionKey}_second`, option.value)}
        />
      </div>
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !monthResume || !bestOfEachPosition) return <div>Error loading data</div>;

  return (
    <div className="min-h-screen p-8">
      <div className='grid grid-cols-3 gap-4'>
        {categories.map(renderCategory)}
        {renderPositionSelects('atackers', 'Atacantes', bestOfEachPosition.atackers)}
        {renderPositionSelects('midfielders', 'Meio-campistas', bestOfEachPosition.midfielders)}
        {renderPositionSelects('defenders', 'Defensores', bestOfEachPosition.defenders)}
      </div>
      
      <button
        className='mt-4 p-2 bg-blue-500 text-white rounded'
        onClick={handleFilterPlayers}
      >
        Filtrar Jogadores Selecionados
      </button>

      <h2 className="text-3xl font-bold my-8">Recompensas do mês</h2>
      {isButtonClicked && filteredPlayers.length > 0 && (
        <div className="">
          <h2 className="text-2xl font-bold my-6">Recompensas individuais</h2>
          <ul className='flex flex-row flex-wrap'>
            {filteredPlayers.map((player, index) => (
            <li key={index} className="p-2 flex flex-row ">
              <span className='text-2xl flex flex-col items-center max-w-[200px] text-wrap text-center justify-between'>
                {player.category}
                {getBadge(player.category, player)}
              <span className='text-lg max-w-[200px] text-wrap text-center'>{getCategoryLabel(player.count , player.category)}</span>
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
          <ul className='flex flex-row flex-wrap'>
            {teamOfTheMonth.map((player, index) => (
              <li key={index} className="p-2 flex flex-row">
                <span className='text-2xl flex flex-col items-center'>
                  {getCategoryLabelInPortuguese(player.category)} {/* Exibir a posição traduzida */}
                  {getBadge(player.category, player)} {/* Badge específica para cada jogador */}
                  <span className='text-lg max-w-[200px] text-wrap text-center'>
                    {getCategoryLabel(player.count , player.category)}
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
