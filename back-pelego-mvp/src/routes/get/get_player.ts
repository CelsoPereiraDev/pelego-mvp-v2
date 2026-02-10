import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface GetPlayerParams {
  id: string;
}

export async function getPlayer(app: FastifyInstance) {
  app.get('/get_player/:id', async (request: FastifyRequest<{ Params: GetPlayerParams }>, reply) => {
    const { id } = request.params;

    try {
      const player = await prisma.player.findUnique({
        where: { id },
        include: { 
          goals: true,
          monthIndividualPrizes: {
            include: {
              championDates: true,
            },
          },
          yearIndividualPrizes: true, 
        }, 
      });

      if (!player) {
        return reply.status(404).send({ error: 'Jogador não encontrado' });
      }

      const formattedPlayer = {
        ...player,
        overall: JSON.parse(player.overall),
        goalsCount: player.goals.length,
        monthIndividualPrizes: player.monthIndividualPrizes.map(prize => ({
          ...prize,
          championDates: prize.championDates.map(date => ({
            id: date.id,
            date: date.date,
          })),
        })),
      };

      reply.status(200).send(formattedPlayer);
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      reply.status(500).send({ error: 'Erro ao buscar jogador' });
    }
  });
}
