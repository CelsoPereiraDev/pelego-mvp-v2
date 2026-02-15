import { WeekData, PlayerData, MatchData } from '../../lib/firestore';

// ============================================================
// Types
// ============================================================

interface InteractionStats {
  points: number;
  matches: number;
}

export interface InteractionEntry {
  name: string;
  points: number;
  pointsExpected: number;
}

export interface PlayerOverviewStats {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goals: number;
  ownGoals: number;
  assists: number;
  goalsConceded: number;
  teamGoals: number;

  averageGoalsConceded: number;
  averagePointsPerMatch: number;
  pointsPercentage: number;
  averagePointsPerWeek: number;
  averageGoalsPerWeek: number;
  averageAssistsPerWeek: number;
  averageGoalsConcededPerWeek: number;

  totalWeeks: number;

  rankings: Partial<Record<NumericStatKey, number>>;

  top5PointsWithPlayers: InteractionEntry[];
  top5WorstPerformingTeammates: InteractionEntry[];
  top5PointsAgainstPlayers: InteractionEntry[];
  top5PointsGivenByPlayers: InteractionEntry[];
}

export type NumericStatKey =
  | 'matches' | 'wins' | 'losses' | 'draws' | 'points'
  | 'goals' | 'ownGoals' | 'assists' | 'goalsConceded'
  | 'averageGoalsConceded' | 'averagePointsPerMatch' | 'pointsPercentage'
  | 'totalGoalsPerWeek' | 'totalAssistsPerWeek' | 'totalPointsPerWeek'
  | 'totalGoalsConcededPerWeek' | 'averagePointsPerWeek' | 'averageGoalsPerWeek'
  | 'averageAssistsPerWeek' | 'averageGoalsConcededPerWeek';

export interface InternalPlayerStats {
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
  teamGoals: number;
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
  worstPerformingTeammates: Record<string, InteractionStats>;
  rankings: Partial<Record<NumericStatKey, number>>;
}

type PlayerStatsMap = Record<string, InternalPlayerStats>;

// ============================================================
// Constants
// ============================================================

const ASCENDING_ORDER_ASPECTS: NumericStatKey[] = [
  'losses',
  'goalsConceded',
  'averagePointsPerMatch',
  'totalGoalsConcededPerWeek',
  'averageGoalsConcededPerWeek',
  'averageGoalsConceded',
];

const NUMERIC_ASPECTS: NumericStatKey[] = [
  'matches', 'wins', 'losses', 'draws', 'points',
  'goals', 'ownGoals', 'assists', 'goalsConceded',
  'averageGoalsConceded', 'averagePointsPerMatch', 'pointsPercentage',
  'totalGoalsPerWeek', 'totalAssistsPerWeek', 'totalPointsPerWeek',
  'totalGoalsConcededPerWeek', 'averagePointsPerWeek', 'averageGoalsPerWeek',
  'averageAssistsPerWeek', 'averageGoalsConcededPerWeek',
];

const INTERACTION_MIN_POINTS_EXPECTED = 39;

// ============================================================
// Helpers
// ============================================================

function initializePlayerStats(name: string): InternalPlayerStats {
  return {
    name,
    matches: 0, wins: 0, losses: 0, draws: 0, points: 0,
    goals: 0, ownGoals: 0, assists: 0, goalsConceded: 0, teamGoals: 0,
    averageGoalsConceded: 0, averagePointsPerMatch: 0, pointsPercentage: 0,
    totalWeeks: new Set<string>(),
    totalGoalsPerWeek: 0, totalAssistsPerWeek: 0,
    totalPointsPerWeek: 0, totalGoalsConcededPerWeek: 0,
    averagePointsPerWeek: 0, averageGoalsPerWeek: 0,
    averageAssistsPerWeek: 0, averageGoalsConcededPerWeek: 0,
    pointsWithPlayers: {},
    pointsAgainstPlayers: {},
    worstPerformingTeammates: {},
    rankings: {},
  };
}

function updateInteractionStats(
  interactionMap: Record<string, InteractionStats>,
  playerName: string,
  points: number,
) {
  if (!interactionMap[playerName]) {
    interactionMap[playerName] = { points: 0, matches: 0 };
  }
  interactionMap[playerName].points += points;
  interactionMap[playerName].matches += 1;
}

function processGoalsAndAssists(match: MatchData, statsMap: PlayerStatsMap) {
  match.goals?.forEach((goal) => {
    if (goal.playerId && statsMap[goal.playerId]) {
      statsMap[goal.playerId].goals += goal.goals;
      statsMap[goal.playerId].totalGoalsPerWeek += goal.goals;
    }
    if (goal.ownGoalPlayerId && statsMap[goal.ownGoalPlayerId]) {
      statsMap[goal.ownGoalPlayerId].ownGoals += goal.goals;
    }
  });

  match.assists?.forEach((assist) => {
    if (assist.playerId && statsMap[assist.playerId]) {
      statsMap[assist.playerId].assists += assist.assists;
      statsMap[assist.playerId].totalAssistsPerWeek += assist.assists;
    }
  });
}

function calculateAverageStats(statsMap: PlayerStatsMap) {
  Object.values(statsMap).forEach((ps) => {
    const totalWeeks = ps.totalWeeks.size;

    if (ps.matches > 0) {
      ps.averageGoalsConceded = parseFloat((ps.goalsConceded / ps.matches).toFixed(2));
      ps.averagePointsPerMatch = parseFloat((ps.points / ps.matches).toFixed(2));
      ps.pointsPercentage = parseFloat(((ps.points / (ps.matches * 3)) * 100).toFixed(2));
    }

    if (totalWeeks > 0) {
      ps.averagePointsPerWeek = parseFloat((ps.totalPointsPerWeek / totalWeeks).toFixed(2));
      ps.averageGoalsPerWeek = parseFloat((ps.totalGoalsPerWeek / totalWeeks).toFixed(2));
      ps.averageAssistsPerWeek = parseFloat((ps.totalAssistsPerWeek / totalWeeks).toFixed(2));
      ps.averageGoalsConcededPerWeek = parseFloat((ps.totalGoalsConcededPerWeek / totalWeeks).toFixed(2));
    }
  });
}

function calculateRankings(statsMap: PlayerStatsMap, numberOfWeeks: number) {
  const minWeeksRequired = numberOfWeeks * 0.2501;

  const filteredStatsList = Object.values(statsMap).filter(
    (ps) => ps.totalWeeks.size >= minWeeksRequired,
  );

  NUMERIC_ASPECTS.forEach((aspect) => {
    filteredStatsList.sort((a, b) => {
      const aValue = (a as any)[aspect] ?? 0;
      const bValue = (b as any)[aspect] ?? 0;
      return ASCENDING_ORDER_ASPECTS.includes(aspect)
        ? aValue - bValue
        : bValue - aValue;
    });

    let currentRank = 1;
    filteredStatsList.forEach((ps, index) => {
      if (index > 0) {
        const prev = filteredStatsList[index - 1];
        const prevValue = (prev as any)[aspect] ?? 0;
        const currValue = (ps as any)[aspect] ?? 0;
        if (currValue === prevValue) {
          ps.rankings[aspect] = prev.rankings[aspect];
        } else {
          currentRank = index + 1;
          ps.rankings[aspect] = currentRank;
        }
      } else {
        ps.rankings[aspect] = currentRank;
      }
    });
  });
}

export function buildTop5Lists(ps: InternalPlayerStats) {
  const playWith = Object.entries(ps.pointsWithPlayers)
    .map(([name, data]) => ({ name, points: data.points, pointsExpected: data.matches * 3 }))
    .filter((d) => d.pointsExpected >= INTERACTION_MIN_POINTS_EXPECTED);

  const playAgainst = Object.entries(ps.pointsAgainstPlayers)
    .map(([name, data]) => ({ name, points: data.points, pointsExpected: data.matches * 3 }))
    .filter((d) => d.pointsExpected >= INTERACTION_MIN_POINTS_EXPECTED);

  return {
    top5PointsWithPlayers: [...playWith]
      .sort((a, b) => b.points / b.pointsExpected - a.points / a.pointsExpected)
      .slice(0, 5),
    top5WorstPerformingTeammates: [...playWith]
      .sort((a, b) => a.points / a.pointsExpected - b.points / b.pointsExpected)
      .slice(0, 5),
    top5PointsAgainstPlayers: [...playAgainst]
      .sort((a, b) => a.points / a.pointsExpected - b.points / b.pointsExpected)
      .slice(0, 5),
    top5PointsGivenByPlayers: [...playAgainst]
      .sort((a, b) => b.points / b.pointsExpected - a.points / a.pointsExpected)
      .slice(0, 5),
  };
}

// ============================================================
// Main — returns stats for ALL players
// ============================================================

export function calculateAllPlayerStats(
  weeks: WeekData[],
): { statsMap: PlayerStatsMap; numberOfWeeks: number } {
  const statsMap: PlayerStatsMap = {};
  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    week.teams
      ?.flatMap((team) => (team.matchesHome ?? []).concat(team.matchesAway ?? []))
      .forEach((match) => {
        if (processedMatches.has(match.id)) return;
        processedMatches.add(match.id);

        let homePoints = 0;
        let awayPoints = 0;

        if (match.result) {
          homePoints = match.result.homeGoals > match.result.awayGoals ? 3
            : match.result.homeGoals === match.result.awayGoals ? 1 : 0;
          awayPoints = match.result.awayGoals > match.result.homeGoals ? 3
            : match.result.awayGoals === match.result.homeGoals ? 1 : 0;
        }

        const homeTeam = week.teams?.find((t) => t.id === match.homeTeamId);
        const awayTeam = week.teams?.find((t) => t.id === match.awayTeamId);

        // Initialize stats for all players in this match
        const allPlayerIds = new Set<string>();
        homeTeam?.players?.forEach((m) => {
          allPlayerIds.add(m.player.id);
          if (!statsMap[m.player.id]) statsMap[m.player.id] = initializePlayerStats(m.player.name);
        });
        awayTeam?.players?.forEach((m) => {
          allPlayerIds.add(m.player.id);
          if (!statsMap[m.player.id]) statsMap[m.player.id] = initializePlayerStats(m.player.name);
        });
        match.goals?.forEach((goal) => {
          if (goal.player && !statsMap[goal.player.id]) {
            statsMap[goal.player.id] = initializePlayerStats(goal.player.name);
            allPlayerIds.add(goal.player.id);
          }
          if (goal.ownGoalPlayer && !statsMap[goal.ownGoalPlayer.id]) {
            statsMap[goal.ownGoalPlayer.id] = initializePlayerStats(goal.ownGoalPlayer.name);
            allPlayerIds.add(goal.ownGoalPlayer.id);
          }
        });

        // Track week participation
        allPlayerIds.forEach((pid) => statsMap[pid].totalWeeks.add(week.id));

        // Track teamGoals
        homeTeam?.players?.forEach((m) => {
          statsMap[m.player.id].teamGoals += match.result?.homeGoals ?? 0;
        });
        awayTeam?.players?.forEach((m) => {
          statsMap[m.player.id].teamGoals += match.result?.awayGoals ?? 0;
        });

        // Home team match stats + interactions
        const homePlayerNames = homeTeam?.players?.map((m) => m.player) ?? [];
        const awayPlayerNames = awayTeam?.players?.map((m) => m.player) ?? [];

        homeTeam?.players?.forEach((member) => {
          const pid = member.player.id;
          const ps = statsMap[pid];
          ps.matches += 1;
          ps.points += homePoints;
          ps.totalPointsPerWeek += homePoints;
          ps.goalsConceded += match.result?.awayGoals ?? 0;
          ps.totalGoalsConcededPerWeek += match.result?.awayGoals ?? 0;
          if (homePoints === 3) ps.wins += 1;
          else if (homePoints === 1) ps.draws += 1;
          else ps.losses += 1;

          homePlayerNames.forEach((teammate) => {
            if (teammate.id !== pid) {
              updateInteractionStats(ps.pointsWithPlayers, teammate.name, homePoints);
              updateInteractionStats(ps.worstPerformingTeammates, teammate.name, homePoints);
            }
          });
          awayPlayerNames.forEach((opponent) => {
            updateInteractionStats(ps.pointsAgainstPlayers, opponent.name, homePoints);
          });
        });

        // Away team match stats + interactions
        awayTeam?.players?.forEach((member) => {
          const pid = member.player.id;
          const ps = statsMap[pid];
          ps.matches += 1;
          ps.points += awayPoints;
          ps.totalPointsPerWeek += awayPoints;
          ps.goalsConceded += match.result?.homeGoals ?? 0;
          ps.totalGoalsConcededPerWeek += match.result?.homeGoals ?? 0;
          if (awayPoints === 3) ps.wins += 1;
          else if (awayPoints === 1) ps.draws += 1;
          else ps.losses += 1;

          awayPlayerNames.forEach((teammate) => {
            if (teammate.id !== pid) {
              updateInteractionStats(ps.pointsWithPlayers, teammate.name, awayPoints);
              updateInteractionStats(ps.worstPerformingTeammates, teammate.name, awayPoints);
            }
          });
          homePlayerNames.forEach((opponent) => {
            updateInteractionStats(ps.pointsAgainstPlayers, opponent.name, awayPoints);
          });
        });

        processGoalsAndAssists(match, statsMap);
      });
  });

  calculateAverageStats(statsMap);
  calculateRankings(statsMap, weeks?.length ?? 0);

  return { statsMap, numberOfWeeks: weeks?.length ?? 0 };
}

// ============================================================
// Single-player convenience wrapper (used by legacy/fallback)
// ============================================================

export function calculatePlayerOverview(
  weeks: WeekData[],
  playerId: string,
): PlayerOverviewStats | null {
  const { statsMap } = calculateAllPlayerStats(weeks);

  const playerStats = statsMap[playerId];
  if (!playerStats) return null;

  const top5 = buildTop5Lists(playerStats);

  return {
    matches: playerStats.matches,
    wins: playerStats.wins,
    losses: playerStats.losses,
    draws: playerStats.draws,
    points: playerStats.points,
    goals: playerStats.goals,
    ownGoals: playerStats.ownGoals,
    assists: playerStats.assists,
    goalsConceded: playerStats.goalsConceded,
    teamGoals: playerStats.teamGoals,
    averageGoalsConceded: playerStats.averageGoalsConceded,
    averagePointsPerMatch: playerStats.averagePointsPerMatch,
    pointsPercentage: playerStats.pointsPercentage,
    averagePointsPerWeek: playerStats.averagePointsPerWeek,
    averageGoalsPerWeek: playerStats.averageGoalsPerWeek,
    averageAssistsPerWeek: playerStats.averageAssistsPerWeek,
    averageGoalsConcededPerWeek: playerStats.averageGoalsConcededPerWeek,
    totalWeeks: playerStats.totalWeeks.size,
    rankings: playerStats.rankings,
    ...top5,
  };
}
