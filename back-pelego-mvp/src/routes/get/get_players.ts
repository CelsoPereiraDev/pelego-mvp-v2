import { FastifyInstance } from "fastify";
import { prisma } from '../../lib/prisma';

export async function getPlayers(app: FastifyInstance) {
  app.get('/get_players', async (request, reply) => {
    try {
      
      const players = await prisma.player.findMany();

      const formattedPlayers = players.map(player => ({
        ...player,
        overall: JSON.parse(player.overall)
      }));

      reply.status(200).send(formattedPlayers);
    } catch (error) {
      console.error("Erro ao buscar jogadores:", error);
      reply.status(500).send({ error: 'Erro ao buscar jogadores' });
    }
  });
}
