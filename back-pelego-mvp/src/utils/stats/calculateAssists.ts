import { PlayerInfo, SimpleAssistStats, WeekWithRelations } from "./types";

export const calculateSimpleAssistStats = (
  weeks: WeekWithRelations[],
  excludePlayerIds: string[] = []
): SimpleAssistStats[] => {
  const assistStatsMap: { [playerId: string]: SimpleAssistStats } = {};
  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    week.teams?.flatMap((team) => team.matchesHome?.concat(team.matchesAway) ?? []).forEach((match) => {
      if (!processedMatches.has(match.id)) {
        processedMatches.add(match.id);

        const allPlayers = new Set<PlayerInfo>();

        // Adiciona todos os jogadores que participaram da partida
        match.homeTeamId && week.teams
          ?.find(team => team.id === match.homeTeamId)
          ?.players?.forEach(member => allPlayers.add(member.player));

        match.awayTeamId && week.teams
          ?.find(team => team.id === match.awayTeamId)
          ?.players?.forEach(member => allPlayers.add(member.player));

        // Inicializa os jogadores no mapa de assistências
        allPlayers.forEach((player) => {
          // Skip excluded players
          if (excludePlayerIds.includes(player.id)) return;

          if (!assistStatsMap[player.id]) {
            assistStatsMap[player.id] = {
              name: player.name,
              assists: 0,
              matchesPlayed: 0,
            };
          }
          assistStatsMap[player.id].matchesPlayed += 1;
        });

        // Adiciona as assistências feitas na partida
        match.assists?.forEach((assist) => {
          if (assist.playerId && !excludePlayerIds.includes(assist.playerId)) {
            if (assistStatsMap[assist.playerId]) {
              assistStatsMap[assist.playerId].assists += assist.assists;
            }
          }
        });
      }
    });
  });

  // Converte para array e aplica a ordenação
  const sortedAssistStats = Object.values(assistStatsMap).sort((a, b) => {
    if (b.assists === a.assists) {
      return a.matchesPlayed - b.matchesPlayed; // Desempate: quem jogou menos partidas
    }
    return b.assists - a.assists;
  });

  return sortedAssistStats;
};
