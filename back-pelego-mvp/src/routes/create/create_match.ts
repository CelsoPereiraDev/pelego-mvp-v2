import { FastifyInstance, FastifyRequest } from "fastify";
import { createMatch } from "../../utils/createMatch";

interface Goal {
  playerId: string;
  goals: number;
  ownGoal?: boolean;
}

interface Assist {
  playerId: string;
  assists: number;
}

interface CreateMatchBody {
  date: string; 
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: Goal[];
  awayGoals: Goal[];
  homeAssists: Assist[];
  awayAssists: Assist[];
}

interface CreateMatchesBody {
  matches: CreateMatchBody[];
}

interface ProcessedGoal {
  playerId?: string;
  ownGoalPlayerId?: string;
  goals: number;
}

interface ProcessedAssist {
  playerId: string;
  assists: number;
}

interface MatchData {
  date: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  goals: ProcessedGoal[];
  assists: ProcessedAssist[];
  orderIndex: number;
}

async function createMatchesInBatches(matches, batchSize = 5) {
  const createdMatches = [];
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (matchData, index) => {
        const matchDate = new Date(matchData.date);
        const goals = [
          ...matchData.homeGoals.map(goal => ({
            playerId: goal.ownGoalPlayerId ? undefined : goal.playerId,
            ownGoalPlayerId: goal.ownGoalPlayerId ?? undefined,
            goals: goal.goals
          })),
          ...matchData.awayGoals.map(goal => ({
            playerId: goal.ownGoalPlayerId ? undefined : goal.playerId,
            ownGoalPlayerId: goal.ownGoalPlayerId ?? undefined,
            goals: goal.goals
          }))
        ];
        const assists = [
          ...matchData.homeAssists.map(assist => ({
            playerId: assist.playerId,
            assists: assist.assists
          })),
          ...matchData.awayAssists.map(assist => ({
            playerId: assist.playerId,
            assists: assist.assists
          }))
        ];
        const match = await createMatch({
          date: matchDate,
          homeTeamId: matchData.homeTeamId,
          awayTeamId: matchData.awayTeamId,
          homeGoals: matchData.homeGoals.reduce((acc, goal) => acc + goal.goals, 0),
          awayGoals: matchData.awayGoals.reduce((acc, goal) => acc + goal.goals, 0),
          goals,
          assists,
          orderIndex: i + index
        });
        return match;
      })
    );
    const fulfilledMatches = batchResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
    createdMatches.push(...fulfilledMatches);
    batchResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Erro na partida ${i + index}:`, result.reason);
      }
    });
  }
  return createdMatches.sort((a, b) => a.orderIndex - b.orderIndex);
} 




export async function createMatchHandler(app: FastifyInstance) {
  app.post('/create_matches', async (request: FastifyRequest<{ Body: CreateMatchesBody }>, reply) => {
    const { matches } = request.body;

    console.log("Received matches data:", matches);

    try {
      if (!matches || !Array.isArray(matches)) {
        throw new Error("Matches data is required and should be an array.");
      }

      const createdMatches = await createMatchesInBatches(matches);

      console.log("Created matches:", createdMatches);

      reply.status(201).send({ message: 'Matches created successfully', createdMatches });
    } catch (error) {
      console.error("Erro ao criar partidas:", error);
      reply.status(500).send({ error: 'Erro ao criar partidas'});
    }
  });
}

