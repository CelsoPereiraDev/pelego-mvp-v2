import { prisma } from '../lib/prisma';

interface GoalData {
  playerId?: string;
  ownGoalPlayerId?: string;
  goals: number;
  matchId?: string;
}

interface AssistData {
  playerId: string;
  assists: number;
  matchId?: string;
}

interface MatchData {
  date: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  goals: GoalData[];
  assists: AssistData[];
  orderIndex: number;
}

export async function createMatch(matchData: MatchData) {
  try {
    const homeTeamId = matchData.homeTeamId.trim();
    const awayTeamId = matchData.awayTeamId.trim();

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findFirst({ where: { id: homeTeamId } }),
      prisma.team.findFirst({ where: { id: awayTeamId } })
    ]);

    if (!homeTeam || !awayTeam) {
      throw new Error("Time(s) não encontrado(s)");
    }

    const allPlayerIds = [
      ...matchData.goals.map(g => g.playerId).filter(Boolean),
      ...matchData.goals.map(g => g.ownGoalPlayerId).filter(Boolean),
      ...matchData.assists.map(a => a.playerId).filter(Boolean)
    ];

    const uniquePlayerIds = Array.from(new Set(allPlayerIds.filter((id): id is string => Boolean(id))));

    const existingPlayers = await prisma.player.findMany({
      where: { id: { in: uniquePlayerIds } }
    });


    if (existingPlayers.length !== uniquePlayerIds.length) {
      throw new Error("Um ou mais jogadores não existem");
    }

    const createdMatch = await prisma.match.create({
      data: {
        date: matchData.date,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        orderIndex: matchData.orderIndex,
        result: {
          create: {
            homeGoals: matchData.homeGoals,
            awayGoals: matchData.awayGoals
          }
        },
        goals: {
          create: matchData.goals.map(goal => ({
            playerId: goal.playerId ?? null,
            ownGoalPlayerId: goal.ownGoalPlayerId ?? null,
            goals: goal.goals
          }))
        },
        assists: {
          create: matchData.assists.map(assist => ({
            playerId: assist.playerId,
            assists: assist.assists
          }))
        }
      }
    });

    return createdMatch;
  } catch (error) {
    throw new Error("Erro ao criar partida");
  }
}