// src/routes/get/get_scores.ts

import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface GetScoresParams {
  year?: string;
  month?: string;
}

export async function getScoresHandler(app: FastifyInstance) {
  app.get('/scores/:year?/:month?', async (request: FastifyRequest<{ Params: GetScoresParams }>, reply) => {
    const { year, month } = request.params;

    try {
      const where: any = {};

      if (year) {
        where.createdAt = {
          gte: new Date(`${year}-${month || '01'}-01`),
          lte: new Date(parseInt(year), month ? parseInt(month) : 12, 0),
        };
      }

      const scores = await prisma.playerScore.findMany({
        where,
        select: {
          id: true,
          playerId: true,
          points: true,
          player: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      reply.status(200).send(scores);
    } catch (error) {
      console.error("Erro ao obter pontuações:", error);
      reply.status(500).send({ error: 'Erro ao obter pontuações', details: error });
    }
  });
}
