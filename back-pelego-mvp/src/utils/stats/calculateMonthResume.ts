import { MonthResumeProps, PlayerResumeData, WeekWithRelations } from "./types";
import { calculateSimpleAssistStats } from "./calculateAssists";
import { calculateBestDefender } from "./calculateBestDefender";
import { calculateSimplePlayerStats } from "./calculatePlayerStats";

interface PlayerGoalsMap {
  [playerId: string]: {
    name: string;
    goals: number;
  };
}

export const calculateMonthResume = (
  weeks: WeekWithRelations[],
  excludePlayerIds: string[] = []
): MonthResumeProps => {

  const ensureMaximumNinePlayers = (category: PlayerResumeData[]): PlayerResumeData[] => {
    return category.slice(0, 9);
  };

  // ASSISTÊNCIAS
  const assistPlayers = calculateSimpleAssistStats(weeks, excludePlayerIds);

  const sortedAssistPlayers = assistPlayers?.sort((a, b) => {
    if (b.assists === a.assists) {
      return a.matchesPlayed - b.matchesPlayed;
    }
    return b.assists - a.assists;
  });

  const fifthElementAssists = sortedAssistPlayers[4]?.assists;
  const bestAssistents = sortedAssistPlayers.filter(player => player.assists >= fifthElementAssists);

  const assistsResume = ensureMaximumNinePlayers(bestAssistents.map((assistent) => ({
    name: assistent.name,
    count: assistent.assists
  })));

  // BEST DEFENDER
  const bestDefenderPlayers = calculateBestDefender(weeks, excludePlayerIds);
  const justDefenders = bestDefenderPlayers?.filter(player =>
    (player.position === 'DEF' || player.position === 'GOL') &&
    (player.weeksPlayed >= weeks.length * 0.5)
  );

  const sortedBestDefenderPlayers = justDefenders?.sort((a, b) => a.averageGoalsConceded - b.averageGoalsConceded);

  const fifthElementDefender = sortedBestDefenderPlayers[4]?.averageGoalsConceded ?? sortedBestDefenderPlayers[sortedBestDefenderPlayers.length - 1]?.averageGoalsConceded;

  const bestDefenders = sortedBestDefenderPlayers.filter(player => player.averageGoalsConceded <= fifthElementDefender);

  const defendersResume = ensureMaximumNinePlayers(bestDefenders.map((defender) => {
    return {
      name: defender.playerName,
      count: defender.averageGoalsConceded
    };
  }));

  // ARTILHEIRO
  const playerGoalsMap: PlayerGoalsMap = {};
  const processedMatches = new Set<string>();
  weeks?.forEach((week) => {
    week.teams.flatMap((team) => team.matchesHome.concat(team.matchesAway)).forEach((match) => {
      if (!processedMatches.has(match.id)) {
        processedMatches.add(match.id);

        match.goals.forEach((goal) => {
          if (goal.player && !excludePlayerIds.includes(goal.player.id)) {
            if (!playerGoalsMap[goal.player.id]) {
              playerGoalsMap[goal.player.id] = { name: goal.player.name, goals: 0 };
            }
            playerGoalsMap[goal.player.id].goals += goal.goals;
          }
        });
      }
    });
  });
  const topScorers = Object.values(playerGoalsMap).sort((a, b) => b.goals - a.goals);
  const fifthElementScorer = topScorers[4]?.goals;
  const bestScorers = topScorers.filter(player => player.goals >= fifthElementScorer);

  const strikersResume = ensureMaximumNinePlayers(bestScorers.map((striker) => {
    return {
      name: striker.name,
      count: striker.goals
    };
  }));

  // TOP POINTER
  const pointStats = calculateSimplePlayerStats(weeks, excludePlayerIds);
  const sortedtopPointersPlayers = pointStats?.sort((a, b) => b.points - a.points);
  const fifthTopPointers = sortedtopPointersPlayers[4]?.points;
  const bestTopPointers = sortedtopPointersPlayers.filter(player => player.points >= fifthTopPointers);

  const topPointersResume = ensureMaximumNinePlayers(bestTopPointers.map((topPointer) => {
    return {
      name: topPointer.name,
      count: topPointer.points
    };
  }));

  // LVP
  const filtredLVP = pointStats?.filter(player => {
    const participatedWeeks = player.weeksParticipated;
    const requiredWeeks = Math.ceil(weeks.length / 2);
    return participatedWeeks >= requiredWeeks;
  });

  const sortedLVPPlayers = filtredLVP?.sort((a, b) => a.pointsPercentage - b.pointsPercentage);
  const fifthLVP = sortedLVPPlayers[4]?.pointsPercentage ?? sortedLVPPlayers[sortedLVPPlayers.length - 1]?.pointsPercentage;

  const bestLVP = sortedLVPPlayers.filter(player => player.pointsPercentage <= fifthLVP);

  const LVPResume = ensureMaximumNinePlayers(bestLVP.map((lowerPointer) => {
    return {
      name: lowerPointer.name,
      count: lowerPointer.pointsPercentage
    };
  }));

  // MVP
  const playerChampionCount: { [playerName: string]: { count: number, pointsPercentage: number, matches: number } } = {};

  weeks?.forEach((week) => {
    week.teams
      .filter(team => team.champion)
      .flatMap(team => team.players)
      .forEach(player => {
        const playerName = player.player.name;
        const playerId = player.player.id;

        // Skip excluded players
        if (excludePlayerIds.includes(playerId)) return;

        if (playerChampionCount[playerName]) {
          playerChampionCount[playerName].count++;
        } else {
          const playerStats = pointStats.find(stats => stats.name === playerName);

          const matches = playerStats ? playerStats.wins + playerStats.draws + playerStats.losses : 0;
          playerChampionCount[playerName] = {
            count: 1,
            pointsPercentage: playerStats?.pointsPercentage || 0,
            matches: matches,
          };
        }
      });
  });

  const raceForMVP = Object.entries(playerChampionCount).map(([name, data]) => ({
    name,
    count: data.count,
    pointsPercentage: data.pointsPercentage,
    matches: data.matches,
  }));

  const sortedMVPPlayers = raceForMVP.sort((a, b) => {
    if (b.count === a.count) {
      if (a.matches === b.matches) {
        return b.pointsPercentage - a.pointsPercentage;
      }
      return a.matches - b.matches;
    }
    return b.count - a.count;
  });

  const bestMVP = ensureMaximumNinePlayers(sortedMVPPlayers.slice(0, 9));

  const MVPResume = bestMVP.map((MVP) => {
    return {
      name: MVP.name,
      count: MVP.count
    };
  });

  return {
    assists: assistsResume,
    scorer: strikersResume,
    mvp: MVPResume,
    lvp: LVPResume,
    bestDefender: defendersResume,
    topPointer: topPointersResume,
  };
};
