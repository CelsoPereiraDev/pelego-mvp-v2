import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface UpdatePlayerScoresBody {
  scores: {
    playerId: string;
    points: number;
  }[];
}

export async function updatePlayerScoresHandler(app: FastifyInstance) {
  app.patch('/update_player_scores', async (request: FastifyRequest<{ Body: UpdatePlayerScoresBody }>, reply) => {
    const { scores } = request.body;

    try {
      const updatePromises = scores.map(score =>
        prisma.playerScore.create({
          data: {
            playerId: score.playerId,
            points: score.points,
          },
        })
      );

      await Promise.all(updatePromises);

      reply.status(200).send({ message: 'Pontuações atualizadas com sucesso' });
    } catch (error) {
      console.error("Erro ao atualizar pontuações:", error);
      reply.status(500).send({ error: 'Erro ao atualizar pontuações', details: error });
    }
  });
}
