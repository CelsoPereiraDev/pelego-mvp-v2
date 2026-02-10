import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

export async function getMatchesHandler(app: FastifyInstance) {
  app.get('/matches', async (request: FastifyRequest, reply) => {
    try {
      const matches = await prisma.match.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
          goals: {
            include: {
              player: true
            }
          },
          result: true
        }
      });

      reply.status(200).send(matches);
    } catch (error) {
      console.error("Erro ao obter partidas:", error);
      reply.status(500).send({ error: 'Erro ao obter partidas', details: error });
    }
  });
}
