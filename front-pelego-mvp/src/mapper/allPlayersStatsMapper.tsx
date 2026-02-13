import { MatchResponse } from '@/types/match';
import { PlayerResponse } from '@/types/player';
import { WeekResponse } from '@/types/weeks';

interface InteractionStats {
  points: number;
  matches: number;
}

interface PlayerStats {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goals: number;
  ownGoals: number;
  assists: number;
  goalsConceded: number;
  averageGoalsConceded: number;
  averagePointsPerMatch: number;
  pointsPercentage: number;
  totalWeeks: Set<string>;
  totalGoalsPerWeek: number;
  totalAssistsPerWeek: number;
  totalPointsPerWeek: number;
  totalGoalsConcededPerWeek: number;
  averagePointsPerWeek: number;
  averageGoalsPerWeek: number;
  averageAssistsPerWeek: number;
  averageGoalsConcededPerWeek: number;
  pointsWithPlayers: Record<string, InteractionStats>;
  pointsAgainstPlayers: Record<string, InteractionStats>;
  pointsGivenByPlayers: Record<string, InteractionStats>;
  worstPerformingTeammates: Record<string, InteractionStats>;
  playWith: Array<{ name: string; points: number; pointsExpected: number }>;
  playAgainst: Array<{ name: string; points: number; pointsExpected: number }>;
  top5PointsWithPlayers: Array<{ name: string; points: number; pointsExpected: number }>;
  top5PointsAgainstPlayers: Array<{ name: string; points: number; pointsExpected: number }>;
  top5PointsGivenByPlayers: Array<{ name: string; points: number; pointsExpected: number }>;
  top5WorstPerformingTeammates: Array<{ name: string; points: number; pointsExpected: number }>;
  rankings?: Partial<Record<NumericPlayerStatsKeys, number>>;
  teamGoals: number;
}

type NumericPlayerStatsKeys = Exclude<
  keyof PlayerStats,
  | 'name'
  | 'totalWeeks'
  | 'pointsWithPlayers'
  | 'pointsAgainstPlayers'
  | 'pointsGivenByPlayers'
  | 'worstPerformingTeammates'
  | 'playWith'
  | 'playAgainst'
  | 'top5PointsWithPlayers'
  | 'top5PointsAgainstPlayers'
  | 'top5PointsGivenByPlayers'
  | 'top5WorstPerformingTeammates'
  | 'rankings'
>;

type PlayerStatsMap = { [playerId: string]: PlayerStats };

const ASCENDING_ORDER_ASPECTS: NumericPlayerStatsKeys[] = [
  'losses',
  'goalsConceded',
  'averagePointsPerMatch',
  'totalGoalsConcededPerWeek',
  'averageGoalsConcededPerWeek',
  'averageGoalsConceded',
];

const NUMERIC_ASPECTS: NumericPlayerStatsKeys[] = [
  'matches',
  'wins',
  'losses',
  'draws',
  'points',
  'goals',
  'ownGoals',
  'assists',
  'goalsConceded',
  'averageGoalsConceded',
  'averagePointsPerMatch',
  'pointsPercentage',
  'totalGoalsPerWeek',
  'totalAssistsPerWeek',
  'totalPointsPerWeek',
  'totalGoalsConcededPerWeek',
  'averagePointsPerWeek',
  'averageGoalsPerWeek',
  'averageAssistsPerWeek',
  'averageGoalsConcededPerWeek',
];

const initializePlayerStats = (player: PlayerResponse): PlayerStats => ({
  name: player.name,
  matches: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  points: 0,
  goals: 0,
  ownGoals: 0,
  assists: 0,
  goalsConceded: 0,
  averageGoalsConceded: 0,
  averagePointsPerMatch: 0,
  pointsPercentage: 0,
  totalWeeks: new Set<string>(),
  totalGoalsPerWeek: 0,
  totalAssistsPerWeek: 0,
  totalPointsPerWeek: 0,
  totalGoalsConcededPerWeek: 0,
  averagePointsPerWeek: 0,
  averageGoalsPerWeek: 0,
  averageAssistsPerWeek: 0,
  averageGoalsConcededPerWeek: 0,
  pointsWithPlayers: {},
  pointsAgainstPlayers: {},
  pointsGivenByPlayers: {},
  worstPerformingTeammates: {},
  playWith: [],
  playAgainst: [],
  top5PointsWithPlayers: [],
  top5PointsAgainstPlayers: [],
  top5PointsGivenByPlayers: [],
  top5WorstPerformingTeammates: [],
  teamGoals: 0,
});

const updatePlayerStats = (
  playerStats: PlayerStats,
  isWin: boolean,
  isDraw: boolean,
  points: number,
  goalsConceded: number,
) => {
  playerStats.matches += 1;
  if (isWin) {
    playerStats.wins += 1;
  } else if (isDraw) {
    playerStats.draws += 1;
  } else {
    playerStats.losses += 1;
  }
  playerStats.points += points;
  playerStats.goalsConceded += goalsConceded;
  playerStats.totalPointsPerWeek += points;
  playerStats.totalGoalsConcededPerWeek += goalsConceded;
};

const updateInteractionStats = (
  interactionStats: Record<string, InteractionStats>,
  playerName: string,
  points: number,
) => {
  if (!interactionStats[playerName]) {
    interactionStats[playerName] = { points: 0, matches: 0 };
  }
  interactionStats[playerName].points += points;
  interactionStats[playerName].matches += 1;
};

const updatePlayerInteractionStats = (
  playerId: string,
  playerStatsMap: PlayerStatsMap,
  teammates: PlayerResponse[],
  opponents: PlayerResponse[],
  points: number,
  isWorstPerforming: boolean,
) => {
  teammates.forEach((teammate) => {
    if (teammate.id !== playerId) {
      const key = teammate.name;
      const interaction = isWorstPerforming
        ? playerStatsMap[playerId].worstPerformingTeammates
        : playerStatsMap[playerId].pointsWithPlayers;
      updateInteractionStats(interaction, key, points);
    }
  });

  opponents.forEach((opponent) => {
    if (opponent.id !== playerId) {
      const key = opponent.name;
      updateInteractionStats(playerStatsMap[playerId].pointsAgainstPlayers, key, points);
    }
  });
};

const calculateRankings = (playerStatsMap: PlayerStatsMap, numberOfWeeks: number) => {
  const minWeeksRequired = numberOfWeeks * 0.2501;

  const filteredStatsList = Object.values(playerStatsMap).filter(
    (playerStats) => playerStats.totalWeeks.size >= minWeeksRequired,
  );

  NUMERIC_ASPECTS.forEach((aspect) => {
    filteredStatsList.sort((a, b) => {
      const aValue = a[aspect] ?? 0;
      const bValue = b[aspect] ?? 0;
      if (ASCENDING_ORDER_ASPECTS.includes(aspect)) {
        return aValue - bValue;
      }
      return bValue - aValue;
    });

    let currentRank = 1;

    filteredStatsList.forEach((playerStats, index) => {
      if (!playerStats.rankings) playerStats.rankings = {};

      if (index > 0) {
        const previousPlayerStats = filteredStatsList[index - 1];
        const previousValue = previousPlayerStats[aspect] ?? 0;
        const currentValue = playerStats[aspect] ?? 0;

        if (currentValue === previousValue) {
          playerStats.rankings[aspect] = previousPlayerStats.rankings![aspect];
        } else {
          currentRank = index + 1;
          playerStats.rankings[aspect] = currentRank;
        }
      } else {
        playerStats.rankings[aspect] = currentRank;
      }
    });
  });
};

const processGoalsAndAssists = (match: MatchResponse, playerStatsMap: PlayerStatsMap) => {
  match.goals?.forEach((goal) => {
    if (goal.playerId) {
      playerStatsMap[goal.playerId].goals += goal.goals;
      playerStatsMap[goal.playerId].totalGoalsPerWeek += goal.goals;
    }
    if (goal.ownGoalPlayerId) {
      playerStatsMap[goal.ownGoalPlayerId].ownGoals += goal.goals;
    }
  });

  match.assists?.forEach((assist) => {
    if (assist.playerId) {
      playerStatsMap[assist.playerId].assists += assist.assists;
      playerStatsMap[assist.playerId].totalAssistsPerWeek += assist.assists;
    }
  });
};

const calculatePlayersStats = (weeks: WeekResponse[]): PlayerStatsMap => {
  const playerStatsMap: PlayerStatsMap = {};
  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    week.teams
      ?.flatMap((team) => team.matchesHome?.concat(team.matchesAway) ?? [])
      .forEach((match) => {
        if (!processedMatches.has(match.id)) {
          processedMatches.add(match.id);

          let homePoints = 0;
          let awayPoints = 0;

          if (match.result) {
            homePoints =
              match.result.homeGoals > match.result.awayGoals
                ? 3
                : match.result.homeGoals === match.result.awayGoals
                  ? 1
                  : 0;
            awayPoints =
              match.result.awayGoals > match.result.homeGoals
                ? 3
                : match.result.awayGoals === match.result.homeGoals
                  ? 1
                  : 0;
          }

          const homeTeam = week.teams?.find((team) => team.id === match.homeTeamId);
          const awayTeam = week.teams?.find((team) => team.id === match.awayTeamId);

          homeTeam?.players?.forEach((member) => {
            const playerId = member.player.id;
            if (!playerStatsMap[playerId]) {
              playerStatsMap[playerId] = initializePlayerStats(member.player);
            }
            playerStatsMap[playerId].teamGoals += match.result?.homeGoals ?? 0;
          });

          awayTeam?.players?.forEach((member) => {
            const playerId = member.player.id;
            if (!playerStatsMap[playerId]) {
              playerStatsMap[playerId] = initializePlayerStats(member.player);
            }
            playerStatsMap[playerId].teamGoals += match.result?.awayGoals ?? 0;
          });

          const allPlayers = new Set<PlayerResponse>();
          homeTeam?.players?.forEach((member) => allPlayers.add(member.player));
          awayTeam?.players?.forEach((member) => allPlayers.add(member.player));
          match.goals?.forEach((goal) => {
            if (goal.player) allPlayers.add(goal.player);
            if (goal.ownGoalPlayer) allPlayers.add(goal.ownGoalPlayer);
          });

          allPlayers.forEach((player) => {
            if (!playerStatsMap[player.id]) {
              playerStatsMap[player.id] = initializePlayerStats(player);
            }
            playerStatsMap[player.id].totalWeeks.add(week.id);
          });

          homeTeam?.players?.forEach((member) => {
            const playerId = member.player.id;
            updatePlayerStats(
              playerStatsMap[playerId],
              homePoints === 3,
              homePoints === 1,
              homePoints,
              match.result?.awayGoals ?? 0,
            );
            updatePlayerInteractionStats(
              playerId,
              playerStatsMap,
              homeTeam.players.map((p) => p.player),
              awayTeam?.players?.map((p) => p.player) ?? [],
              homePoints,
              false,
            );
            updatePlayerInteractionStats(
              playerId,
              playerStatsMap,
              homeTeam.players.map((p) => p.player),
              awayTeam?.players?.map((p) => p.player) ?? [],
              homePoints,
              true,
            );
          });

          awayTeam?.players?.forEach((member) => {
            const playerId = member.player.id;
            updatePlayerStats(
              playerStatsMap[playerId],
              awayPoints === 3,
              awayPoints === 1,
              awayPoints,
              match.result?.homeGoals ?? 0,
            );
            updatePlayerInteractionStats(
              playerId,
              playerStatsMap,
              awayTeam.players.map((p) => p.player),
              homeTeam?.players?.map((p) => p.player) ?? [],
              awayPoints,
              false,
            );
            updatePlayerInteractionStats(
              playerId,
              playerStatsMap,
              awayTeam.players.map((p) => p.player),
              homeTeam?.players?.map((p) => p.player) ?? [],
              awayPoints,
              true,
            );
          });

          processGoalsAndAssists(match, playerStatsMap);
        }
      });
  });

  calculateAverageStats(playerStatsMap);
  calculateRankings(playerStatsMap, weeks?.length);

  return playerStatsMap;
};

const calculateAverageStats = (playerStatsMap: PlayerStatsMap) => {
  Object.values(playerStatsMap).forEach((playerStats) => {
    const totalWeeks = playerStats.totalWeeks.size;
    if (playerStats.matches > 0) {
      playerStats.averageGoalsConceded = parseFloat(
        (playerStats.goalsConceded / playerStats.matches).toFixed(2),
      );
      playerStats.averagePointsPerMatch = parseFloat(
        (playerStats.points / playerStats.matches).toFixed(2),
      );
      playerStats.pointsPercentage = parseFloat(
        ((playerStats.points / (playerStats.matches * 3)) * 100).toFixed(2),
      );
    }
    if (totalWeeks > 0) {
      playerStats.averagePointsPerWeek = parseFloat(
        (playerStats.totalPointsPerWeek / totalWeeks).toFixed(2),
      );
      playerStats.averageGoalsPerWeek = parseFloat(
        (playerStats.totalGoalsPerWeek / totalWeeks).toFixed(2),
      );
      playerStats.averageAssistsPerWeek = parseFloat(
        (playerStats.totalAssistsPerWeek / totalWeeks).toFixed(2),
      );
      playerStats.averageGoalsConcededPerWeek = parseFloat(
        (playerStats.totalGoalsConcededPerWeek / totalWeeks).toFixed(2),
      );
    }

    playerStats.playWith = Object.entries(playerStats.pointsWithPlayers)
      .map(([name, data]) => ({
        name,
        points: data.points,
        pointsExpected: data.matches * 3,
      }))
      .filter((data) => data.pointsExpected >= 39); // Jogaram pelo menos 2 vezes juntos

    playerStats.playAgainst = Object.entries(playerStats.pointsAgainstPlayers)
      .map(([name, data]) => ({
        name,
        points: data.points,
        pointsExpected: data.matches * 3,
      }))
      .filter((data) => data.pointsExpected >= 39); // Jogaram pelo menos 2 vezes juntos

    playerStats.top5PointsWithPlayers = playerStats.playWith
      .sort((a, b) => b.points / b.pointsExpected - a.points / a.pointsExpected)
      .slice(0, 5);

    playerStats.top5PointsAgainstPlayers = playerStats.playAgainst
      .sort((a, b) => a.points / a.pointsExpected - b.points / b.pointsExpected)
      .slice(0, 5);

    playerStats.top5PointsGivenByPlayers = playerStats.playAgainst
      .sort((a, b) => b.points / b.pointsExpected - a.points / a.pointsExpected)
      .slice(0, 5);

    playerStats.top5WorstPerformingTeammates = playerStats.playWith
      .sort((a, b) => a.points / a.pointsExpected - b.points / b.pointsExpected)
      .slice(0, 5);
  });
};

export const calculatePlayerStatsForPlayer = (
  weeks: WeekResponse[],
  playerId: string,
): PlayerStats | null => {
  const playerStatsMap = calculatePlayersStats(weeks);

  if (!playerStatsMap[playerId]) {
    return null;
  }

  return playerStatsMap[playerId];
};
