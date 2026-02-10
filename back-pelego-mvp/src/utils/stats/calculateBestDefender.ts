import { Player } from "@prisma/client";
import { PlayerStatsSummary, WeekWithRelations } from "./types";

type PlayerStatsSummaryMap = { [playerName: string]: PlayerStatsSummary };

const initializePlayerStatsSummary = (player: Player): PlayerStatsSummary => ({
  playerName: player.name,
  position: player.position,
  weeksPlayed: 0,
  goalsConceded: 0,
  matches: 0,
  averageGoalsConceded: 0,
  averageGoalsConcededPerWeek: 0,
});

const updatePlayerStatsSummary = (
  playerStats: PlayerStatsSummary,
  goalsConceded: number
) => {
  playerStats.matches += 1;
  playerStats.goalsConceded += goalsConceded;
};

const calculateAverageStatsSummary = (playerStatsMap: PlayerStatsSummaryMap) => {
  Object.values(playerStatsMap).forEach(playerStats => {
    if (playerStats.matches > 0) {
      playerStats.averageGoalsConceded = parseFloat((playerStats.goalsConceded / playerStats.matches).toFixed(2));
    }
    if (playerStats.weeksPlayed > 0) {
      playerStats.averageGoalsConcededPerWeek = parseFloat((playerStats.goalsConceded / playerStats.weeksPlayed).toFixed(2));
    }
  });
};

const calculatePlayersStatsSummary = (
  weeks: WeekWithRelations[],
  excludePlayerIds: string[] = []
): PlayerStatsSummaryMap => {
  const playerStatsMap: PlayerStatsSummaryMap = {};
  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    const playersInWeek = new Set<string>();
    week.teams?.flatMap((team) => team.matchesHome?.concat(team.matchesAway) ?? []).forEach((match) => {
      if (!processedMatches.has(match.id)) {
        processedMatches.add(match.id);

        const homeTeam = week.teams?.find(team => team.id === match.homeTeamId);
        const awayTeam = week.teams?.find(team => team.id === match.awayTeamId);

        const allPlayers = new Set<Player>();
        homeTeam?.players?.forEach(member => {
          if (!excludePlayerIds.includes(member.player.id)) {
            allPlayers.add(member.player);
          }
        });
        awayTeam?.players?.forEach(member => {
          if (!excludePlayerIds.includes(member.player.id)) {
            allPlayers.add(member.player);
          }
        });
        match.goals?.forEach(goal => {
          if (goal.player && !excludePlayerIds.includes(goal.player.id)) {
            allPlayers.add(goal.player);
          }
          if (goal.ownGoalPlayer && !excludePlayerIds.includes(goal.ownGoalPlayer.id)) {
            allPlayers.add(goal.ownGoalPlayer);
          }
        });

        allPlayers.forEach(player => {
          if (!playerStatsMap[player.name]) {
            playerStatsMap[player.name] = initializePlayerStatsSummary(player);
          }
          playersInWeek.add(player.name);
        });

        homeTeam?.players?.forEach(member => {
          if (excludePlayerIds.includes(member.player.id)) return;
          const playerName = member.player.name;
          updatePlayerStatsSummary(playerStatsMap[playerName], match.result?.awayGoals ?? 0);
        });

        awayTeam?.players?.forEach(member => {
          if (excludePlayerIds.includes(member.player.id)) return;
          const playerName = member.player.name;
          updatePlayerStatsSummary(playerStatsMap[playerName], match.result?.homeGoals ?? 0);
        });
      }
    });
    playersInWeek.forEach(playerName => {
      playerStatsMap[playerName].weeksPlayed += 1;
    });
  });

  calculateAverageStatsSummary(playerStatsMap);

  return playerStatsMap;
};

export const calculateBestDefender = (
  weeks: WeekWithRelations[],
  excludePlayerIds: string[] = []
): PlayerStatsSummary[] => {
  const playerStatsMap = calculatePlayersStatsSummary(weeks, excludePlayerIds);
  return Object.values(playerStatsMap);
};
