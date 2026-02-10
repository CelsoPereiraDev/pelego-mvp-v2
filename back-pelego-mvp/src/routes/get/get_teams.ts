import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

export async function getTeamsHandler(app: FastifyInstance) {
  app.get('/teams', async (request: FastifyRequest, reply) => {
    try {
      const teams = await prisma.team.findMany({
        include: {
          players: {
            include: {
              player: true
            }
          }
        }
      });

      reply.status(200).send(teams);
    } catch (error) {
      console.error("Erro ao obter times:", error);
      reply.status(500).send({ error: 'Erro ao obter times', details: error });
    }
  });
}
