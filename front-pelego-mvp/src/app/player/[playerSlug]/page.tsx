'use client'

import { PlayerCard } from "@/components/PlayerCard";
import { RadarGraphic } from "@/components/RadarGrahic";
import { RadialChart } from "@/components/RadialChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePlayerStatsForPlayer } from "@/mapper/allPlayersStatsMapper";
import { usePlayer } from "@/services/player/usePlayer";
import { useWeeks } from "@/services/weeks/useWeeks";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

interface PlayerProps {
  params: {
    playerSlug: string;
  };
}

export default function PlayerPage({ params: { playerSlug } }: PlayerProps) {
  const { weeks } = useWeeks();
  const { player } = usePlayer(playerSlug);
  const playerStats = calculatePlayerStatsForPlayer(weeks, player?.id);

  const chartData = [
    { stat: "Fôlego", valor: player?.overall.pace || 0 },
    { stat: "Chute", valor: player?.overall.shooting || 0 },
    { stat: "Passe", valor: player?.overall.passing || 0 },
    { stat: "Drible", valor: player?.overall.dribble || 0 },
    { stat: "Defesa", valor: player?.overall.defense || 0 },
    { stat: "Físico", valor: player?.overall.physics || 0 },
  ];

  const chartConfig = {
  desktop: {
    label: "Estatisticas do jogador",
    color: "hsl(270, 100%, 50%)",
  },
  };

  const radialChartData =[{ goals: "PPG", 
    APG: ((playerStats?.goals || 0) + (playerStats?.assists || 0)),
    PIG: (playerStats?.teamGoals || 0) - ((playerStats?.goals || 0) + (playerStats?.assists || 0)) || 0 }]
    

  const radialChartConfig = {
    APG: {
      label: "Part. direta nos gols  ",
      color: "hsl(270, 100%, 50%)",
    },
    PIG: {
      label: "Demais gols do time  ",
      color: "hsl(262.1 83.3% 65%)",
    },
    };

  const renderMainStats = (stats: typeof playerStats) => {
    if (!stats) return null;

    const mainStatsEntries = [
      { label: "Partidas", value: stats.matches, rank: stats.rankings?.matches },
      { label: "Vitórias", value: stats.wins, rank: stats.rankings?.wins },
      { label: "Derrotas", value: stats.losses, rank: stats.rankings?.losses },
      { label: "Empates", value: stats.draws, rank: stats.rankings?.draws },
      { label: "Pontos", value: stats.points, rank: stats.rankings?.points },
      { label: "Aproveitamento", value: stats.pointsPercentage.toFixed(2) + "%", rank: stats.rankings?.pointsPercentage },
      { label: "Média de Pontos por Semana", value: stats.averagePointsPerWeek.toFixed(2), rank: stats.rankings?.averagePointsPerWeek },
    ];

    return (
      <ul className="text-[hsl(var(--foreground))]">
        {mainStatsEntries.map((entry, index) => (
          <li key={index} className="mb-1">
            <strong>{entry.label}: </strong>{entry.value} {entry.rank !== undefined ? `(${entry.rank}º)` : ""}
          </li>
        ))}
      </ul>
    );
  };

  const renderGoalStats = (stats: typeof playerStats) => {
    if (!stats) return null;

    const goalStatsEntries = [
      { label: "Gols", value: stats.goals, rank: stats.rankings?.goals },
      { label: "Gols Contra", value: stats.ownGoals, rank: stats.rankings?.ownGoals },
      { label: "Média de Gols por Semana", value: stats.averageGoalsPerWeek.toFixed(2), rank: stats.rankings?.averageGoalsPerWeek },
    ];

    return (
      <ul className="text-[hsl(var(--foreground))]">
        {goalStatsEntries.map((entry, index) => (
          entry.value !== 0 &&
          <li key={index} className="mb-1">
            <strong>{entry.label}: </strong>{entry.value} {entry.rank !== undefined ? `(${entry.rank}º)` : ""}
          </li>
        ))}
      </ul>
    );
  };

  const renderAssistStats = (stats: typeof playerStats) => {
    if (!stats) return null;

    const assistStatsEntries = [
      { label: "Assistências", value: stats.assists, rank: stats.rankings?.assists },
      { label: "Média de Assistências por Semana", value: stats.averageAssistsPerWeek.toFixed(2), rank: stats.rankings?.averageAssistsPerWeek }
    ];

    return (
      <ul className="text-[hsl(var(--foreground))]">
        {assistStatsEntries.map((entry, index) => (
          <li key={index} className="mb-1">
            <strong>{entry.label}: </strong>{entry.value} {entry.rank !== undefined ? `(${entry.rank}º)` : ""}
          </li>
        ))}
      </ul>
    );
  };

  const renderDefenseStats = (stats: typeof playerStats) => {
    if (!stats) return null;

    const defenseStatsEntries = [
      { label: "Gols Sofridos", value: stats.goalsConceded, rank: stats.rankings?.goalsConceded },
      { label: "Média de Gols Sofridos por Partida", value: stats.averageGoalsConceded.toFixed(2), rank: stats.rankings?.averageGoalsConceded },
      { label: "Média de Gols Sofridos por Semana", value: stats.averageGoalsConcededPerWeek.toFixed(2), rank: stats.rankings?.averageGoalsConcededPerWeek },
    ];

    return (
      <ul className="text-[hsl(var(--foreground))]">
        {defenseStatsEntries.map((entry, index) => (
          <li key={index} className="mb-1">
            <strong>{entry.label}: </strong>{entry.value} {entry.rank !== undefined ? `(${entry.rank}º)` : ""}
          </li>
        ))}
      </ul>
    );
  };

  const renderTop5List = (title: string, list: Array<{ name: string; points: number; pointsExpected: number }>) => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--foreground))]">{title}</h3>
      <ul className="text-[hsl(var(--foreground))]">
        {list.map((item, index) => (
          <li key={index} className="mb-1">
            <strong>{item.name}:</strong> {((item.points / item.pointsExpected) * 100).toFixed(2)}%
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] max-w-screen flex justify-start flex-col p-12 items-center gap-4">
      <h1 className="text-3xl text-center mb-9 text-[hsl(var(--foreground))]">{player?.name}</h1>
      <Card className="max-w-[1440px] p-6 h-full rounded-lg w-full flex flex-col gap-12">
        <div className="flex flex-row gap-24">
          {player && <PlayerCard playerData={player} />}
          <CardContent className="flex flex-row gap-8">
            {playerStats && renderMainStats(playerStats)}
            <RadarGraphic
              title="Overall do Jogador"
              description="Análise dos principais atributos do jogador"
              chartData={chartData}
              chartConfig={chartConfig}
              maxDomain={100}
            />
            <RadialChart 
              valueInPercentage={ `${(((playerStats?.goals || 0) + (playerStats?.assists || 0))/(playerStats?.teamGoals || 1)* 100).toFixed(2)}  %`}
              chartData={radialChartData}
              chartConfig={radialChartConfig}
            />
          </CardContent>
        </div>
        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(var(--foreground))] flex flex-row"><SportsSoccerIcon className="mr-2 text-[hsl(var(--light-hover))]"/>Estatísticas de Gols</CardTitle>
            </CardHeader>
            <CardContent>
              {playerStats && renderGoalStats(playerStats)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(var(--foreground))]"><AutoAwesomeIcon className="mr-2 text-[hsl(var(--light-hover))]"/>Estatísticas de Assistências</CardTitle>
            </CardHeader>
            <CardContent>
              {playerStats && renderAssistStats(playerStats)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(var(--foreground))]"><ShieldIcon className="mr-2 text-[hsl(var(--light-hover))]"/>Estatísticas de Defesa</CardTitle>
            </CardHeader>
            <CardContent>
              {playerStats && renderDefenseStats(playerStats)}
            </CardContent>
          </Card>
          
            <Card className=" min-w-full">
              <CardHeader>
                <CardTitle className="text-lg text-[hsl(var(--foreground))]">Estatísticas de Companheiros</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {playerStats && renderTop5List("Melhores Companheiros", playerStats.top5PointsWithPlayers)}
                {playerStats && renderTop5List("Piores Companheiros", playerStats.top5WorstPerformingTeammates)}
              </CardContent>
            </Card>
            <Card className=" min-w-full">
              <CardHeader>
                <CardTitle className="text-lg text-[hsl(var(--foreground))]">Estatísticas de Adversários</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {playerStats && renderTop5List("Adversários que mais perdi pontos", playerStats.top5PointsAgainstPlayers)}
                {playerStats && renderTop5List("Adversários que mais cederam pontos", playerStats.top5PointsGivenByPlayers)}
              </CardContent>
            </Card>
          
        </CardContent>
      </Card>
    </div>
  );
}
