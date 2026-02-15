import { WeekWithRelations } from './types';
import { calculateBestDefender } from './calculateBestDefender';
import { calculateSimpleAssistStats } from './calculateAssists';
import { calculateSimplePlayerStats } from './calculatePlayerStats';

export interface BestOfPositionEntry {
  name: string;
  point: number;
  goalsScore: number;
  assistScore: number;
  goalsAgainstScore: number;
  pointsScore: number;
  championshipScore: number;
}

export interface BestOfPositionsResult {
  attackers: BestOfPositionEntry[];
  midfielders: BestOfPositionEntry[];
  defenders: BestOfPositionEntry[];
  goalkeepers: BestOfPositionEntry[];
}

interface PlayerGoalsMap {
  [playerId: string]: {
    name: string;
    goals: number;
  };
}

export const calculateBestOfEachPosition = (
  weeks: WeekWithRelations[],
): BestOfPositionsResult => {
  const allPlayersGoalsAgainstCount = calculateBestDefender(weeks);
  const allPlayersAssistCount = calculateSimpleAssistStats(weeks);

  // Build goals map
  const allPlayersGoalsMap: PlayerGoalsMap = {};
  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    week.teams
      ?.flatMap((team) => (team.matchesHome ?? []).concat(team.matchesAway ?? []))
      .forEach((match) => {
        if (!processedMatches.has(match.id)) {
          processedMatches.add(match.id);
          match.goals?.forEach((goal) => {
            if (goal.player) {
              if (!allPlayersGoalsMap[goal.player.id]) {
                allPlayersGoalsMap[goal.player.id] = { name: goal.player.name, goals: 0 };
              }
              allPlayersGoalsMap[goal.player.id].goals += goal.goals;
            }
          });
        }
      });
  });

  const allPlayersPoint = calculateSimplePlayerStats(weeks);

  // Champion count per player name
  const allPlayersChampionCount: Record<string, number> = {};
  weeks?.forEach((week) => {
    week.teams
      ?.filter((team) => team.champion)
      .flatMap((team) => team.players ?? [])
      .forEach((member) => {
        const playerName = member.player.name;
        allPlayersChampionCount[playerName] = (allPlayersChampionCount[playerName] || 0) + 1;
      });
  });

  // Minimum participation: 50%+ of weeks
  const requiredWeeks = Math.ceil(weeks.length / 2);

  const attackers: BestOfPositionEntry[] = [];
  const midfielders: BestOfPositionEntry[] = [];
  const defenders: BestOfPositionEntry[] = [];
  const goalkeepers: BestOfPositionEntry[] = [];

  const eligiblePlayers = allPlayersGoalsAgainstCount.filter(
    (player) => player.weeksPlayed >= requiredWeeks,
  );

  eligiblePlayers.forEach((playerSummary) => {
    const playerId = Object.keys(allPlayersGoalsMap).find(
      (id) => allPlayersGoalsMap[id].name === playerSummary.playerName,
    );

    const goals = playerId ? allPlayersGoalsMap[playerId].goals : 0;
    const assists = allPlayersAssistCount.find(
      (a) => a.name === playerSummary.playerName,
    )?.assists || 0;
    const goalsAgainst = playerSummary.averageGoalsConceded || 0;
    const points = allPlayersPoint.find(
      (s) => s.name === playerSummary.playerName,
    )?.points || 0;
    const championships = allPlayersChampionCount[playerSummary.playerName] || 0;

    let totalPoints = 0;

    if (playerSummary.position === 'ATK') {
      totalPoints =
        goals * 0.8 +
        assists * 0.3 +
        championships * 2 +
        (1 / (goalsAgainst + 1)) * 6 +
        points * 0.1;
    } else if (playerSummary.position === 'MEI') {
      totalPoints =
        goals * 0.5 +
        assists * 0.6 +
        championships * 2 +
        (1 / (goalsAgainst + 1)) * 8 +
        points * 0.1;
    } else if (playerSummary.position === 'DEF' || playerSummary.position === 'GOL') {
      totalPoints =
        (1 / (goalsAgainst + 1)) * 60 +
        (goals + assists) * 0.1 +
        points * 0.1 +
        championships * 2 -
        25;
    }

    const entry: BestOfPositionEntry = {
      name: playerSummary.playerName,
      point: parseFloat(totalPoints.toFixed(2)),
      goalsScore: goals,
      assistScore: assists,
      goalsAgainstScore: goalsAgainst,
      pointsScore: points,
      championshipScore: championships,
    };

    if (playerSummary.position === 'ATK') {
      attackers.push(entry);
    } else if (playerSummary.position === 'MEI') {
      midfielders.push(entry);
    } else if (playerSummary.position === 'DEF') {
      defenders.push(entry);
    } else if (playerSummary.position === 'GOL') {
      goalkeepers.push(entry);
    }
  });

  // Sort each position by score descending
  attackers.sort((a, b) => b.point - a.point);
  midfielders.sort((a, b) => b.point - a.point);
  defenders.sort((a, b) => b.point - a.point);
  goalkeepers.sort((a, b) => b.point - a.point);

  return { attackers, midfielders, defenders, goalkeepers };
};
