import { PlayerInfo, SimplePlayerStats, WeekWithRelations } from "./types";

export const calculateSimplePlayerStats = (
  weeks: WeekWithRelations[],
  excludePlayerIds: string[] = []
): SimplePlayerStats[] => {
  const playerStatsMap: { [playerId: string]: SimplePlayerStats & { matches: number, weeksPlayedIn: Set<string> } } = {};

  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    const weekId = week.id;
    const playersInThisWeek = new Set<string>();

    week.teams?.flatMap((team) => team.matchesHome?.concat(team.matchesAway) ?? []).forEach((match) => {
      if (!processedMatches.has(match.id)) {
        processedMatches.add(match.id);

        let homePoints = 0;
        let awayPoints = 0;

        if (match.result) {
          homePoints = match.result.homeGoals > match.result.awayGoals ? 3 : match.result.homeGoals === match.result.awayGoals ? 1 : 0;
          awayPoints = match.result.awayGoals > match.result.homeGoals ? 3 : match.result.awayGoals === match.result.homeGoals ? 1 : 0;
        }

        const homeTeam = week.teams?.find(team => team.id === match.homeTeamId);
        const awayTeam = week.teams?.find(team => team.id === match.awayTeamId);

        const allPlayers = new Set<PlayerInfo>();
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

        allPlayers.forEach(player => {
          if (!playerStatsMap[player.id]) {
            playerStatsMap[player.id] = {
              name: player.name,
              points: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              matches: 0,
              weeksParticipated: 0,
              pointsPercentage: 0,
              weeksPlayedIn: new Set<string>()
            };
          }
          playersInThisWeek.add(player.id);
        });

        homeTeam?.players?.forEach(member => {
          if (excludePlayerIds.includes(member.player.id)) return;
          const id = member.player.id;
          const playerStats = playerStatsMap[id];
          playerStats.matches += 1;
          playerStats.points += homePoints;
          if (homePoints === 3) {
            playerStats.wins += 1;
          } else if (homePoints === 1) {
            playerStats.draws += 1;
          } else {
            playerStats.losses += 1;
          }
        });

        awayTeam?.players?.forEach(member => {
          if (excludePlayerIds.includes(member.player.id)) return;
          const id = member.player.id;
          const playerStats = playerStatsMap[id];
          playerStats.matches += 1;
          playerStats.points += awayPoints;
          if (awayPoints === 3) {
            playerStats.wins += 1;
          } else if (awayPoints === 1) {
            playerStats.draws += 1;
          } else {
            playerStats.losses += 1;
          }
        });
      }
    });

    playersInThisWeek.forEach(playerId => {
      playerStatsMap[playerId].weeksPlayedIn.add(weekId);
    });
  });

  Object.values(playerStatsMap).forEach(playerStats => {
    if (playerStats.matches > 0) {
      playerStats.pointsPercentage = parseFloat(((playerStats.points / (playerStats.matches * 3)) * 100).toFixed(2));
    }
    playerStats.weeksParticipated = playerStats.weeksPlayedIn.size;
  });

  return Object.values(playerStatsMap).map(({ name, points, wins, draws, losses, pointsPercentage, weeksParticipated }) => ({
    name,
    points,
    wins,
    draws,
    losses,
    pointsPercentage,
    weeksParticipated
  }));
};
