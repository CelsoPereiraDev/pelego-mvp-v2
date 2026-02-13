import { calculateSimplePlayerStats } from '@/mapper/playerStatMapper';
import { WeekResponse } from '@/types/weeks';
import { calculateSimpleAssistStats } from './calculateAssists';
import { calculateBestDefender } from './calculateBestDefender';

interface PlayerResumeData {
  name: string;
  goalsScore?: number;
  assistScore?: number;
  goalsAgainstScore?: number;
  pointsScore?: number;
  champioshipScore?: number;
  point: number;
}

export interface CalculateBestOfEachPositionProps {
  atackers: PlayerResumeData[];
  midfielders: PlayerResumeData[];
  defenders: PlayerResumeData[];
  goalkeepers: PlayerResumeData[];
}

interface PlayerGoalsMap {
  [playerId: string]: {
    name: string;
    goals: number;
  };
}

export const calculateBestOfEachPosition = (
  weeks: WeekResponse[],
): CalculateBestOfEachPositionProps => {
  const allPlayersGoalsAgainstCount = calculateBestDefender(weeks);
  const allPlayersAssistCount = calculateSimpleAssistStats(weeks);

  const allPlayersGoalsMap: PlayerGoalsMap = {};

  const processedMatches = new Set<string>();

  weeks?.forEach((week) => {
    week.teams
      .flatMap((team) => team.matchesHome.concat(team.matchesAway))
      .forEach((match) => {
        if (!processedMatches.has(match.id)) {
          processedMatches.add(match.id);

          match.goals.forEach((goal) => {
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
  const allPlayersChampionCount: Record<string, number> = {};

  weeks?.forEach((week) => {
    week.teams
      .filter((team) => team.champion)
      .flatMap((team) => team.players)
      .forEach((player) => {
        const playerName = player.player.name;
        if (allPlayersChampionCount[playerName]) {
          allPlayersChampionCount[playerName]++;
        } else {
          allPlayersChampionCount[playerName] = 1;
        }
      });
  });

  // Minimum participation: 50% + 1 of weeks
  const requiredWeeks = Math.ceil(weeks.length / 2);

  const atackers: PlayerResumeData[] = [];
  const midfielders: PlayerResumeData[] = [];
  const defenders: PlayerResumeData[] = [];
  const goalkeepers: PlayerResumeData[] = [];

  // Filter players with minimum participation
  const eligiblePlayers = allPlayersGoalsAgainstCount.filter(
    (player) => player.weeksPlayed >= requiredWeeks,
  );

  eligiblePlayers.forEach((playerSummary) => {
    const playerId = Object.keys(allPlayersGoalsMap).find(
      (id) => allPlayersGoalsMap[id].name === playerSummary.playerName,
    );

    const goals = playerId ? allPlayersGoalsMap[playerId].goals : 0;
    const assists =
      allPlayersAssistCount.find((assist) => assist.name === playerSummary.playerName)?.assists ||
      0;
    const goalsAgainst = playerSummary.averageGoalsConceded || 0;
    const points =
      allPlayersPoint.find((stats) => stats.name === playerSummary.playerName)?.points || 0;
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
    } else if (playerSummary.position === 'DEF') {
      totalPoints =
        (1 / (goalsAgainst + 1)) * 60 +
        (goals + assists) * 0.1 +
        points * 0.1 +
        championships * 2 -
        25;
    } else if (playerSummary.position === 'GOL') {
      totalPoints =
        (1 / (goalsAgainst + 1)) * 60 +
        (goals + assists) * 0.1 +
        points * 0.1 +
        championships * 2 -
        25;
    }

    const playerData: PlayerResumeData = {
      name: playerSummary.playerName,
      goalsScore: goals,
      assistScore: assists,
      goalsAgainstScore: goalsAgainst,
      pointsScore: points,
      champioshipScore: championships,
      point: parseFloat(totalPoints.toFixed(2)),
    };

    // Filtrar pela posição e adicionar ao array correspondente
    if (playerSummary.position === 'ATK') {
      atackers.push(playerData);
    } else if (playerSummary.position === 'MEI') {
      midfielders.push(playerData);
    } else if (playerSummary.position === 'DEF') {
      defenders.push(playerData);
    } else if (playerSummary.position === 'GOL') {
      goalkeepers.push(playerData);
    }
  });

  return {
    atackers,
    midfielders,
    defenders,
    goalkeepers,
  };
};
