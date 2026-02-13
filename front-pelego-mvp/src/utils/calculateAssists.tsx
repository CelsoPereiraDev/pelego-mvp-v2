import { PlayerResponse } from '@/types/player';
import { WeekResponse } from '@/types/weeks';

export interface SimpleAssistStats {
  name: string;
  assists: number;
  matchesPlayed: number; // Total de partidas jogadas
}

export const calculateSimpleAssistStats = (weeks: WeekResponse[]): SimpleAssistStats[] => {
  const assistStatsMap: { [playerId: string]: SimpleAssistStats } = {};
  const processedMatches = new Set<string>(); // Para rastrear partidas já processadas

  weeks?.forEach((week) => {
    week.teams
      ?.flatMap((team) => team.matchesHome?.concat(team.matchesAway) ?? [])
      .forEach((match) => {
        if (!processedMatches.has(match.id)) {
          processedMatches.add(match.id); // Marca a partida como processada

          const allPlayers = new Set<PlayerResponse>();

          // Adiciona todos os jogadores que participaram da partida (independente de assistência)
          match.homeTeamId &&
            week.teams
              ?.find((team) => team.id === match.homeTeamId)
              ?.players?.forEach((member) => allPlayers.add(member.player));

          match.awayTeamId &&
            week.teams
              ?.find((team) => team.id === match.awayTeamId)
              ?.players?.forEach((member) => allPlayers.add(member.player));

          // Inicializa os jogadores no mapa de assistências
          allPlayers.forEach((player) => {
            if (!assistStatsMap[player.id]) {
              assistStatsMap[player.id] = {
                name: player.name,
                assists: 0,
                matchesPlayed: 0, // Inicializa o número total de partidas
              };
            }
            assistStatsMap[player.id].matchesPlayed += 1; // Incrementa o total de partidas jogadas
          });

          // Adiciona as assistências feitas na partida
          match.assists?.forEach((assist) => {
            if (assist.playerId) {
              assistStatsMap[assist.playerId].assists += assist.assists;
            }
          });
        }
      });
  });

  // Converte para array e aplica a ordenação com critério de desempate
  const sortedAssistStats = Object.values(assistStatsMap).sort((a, b) => {
    if (b.assists === a.assists) {
      return a.matchesPlayed - b.matchesPlayed; // Desempate: quem jogou menos partidas
    }
    return b.assists - a.assists;
  });

  return sortedAssistStats;
};
