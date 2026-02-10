import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface DeletePlayerParams {
  id: string;
}

export async function deletePlayer(app: FastifyInstance) {
  app.delete('/delete_player/:id', async (request: FastifyRequest<{ Params: DeletePlayerParams }>, reply) => {
    const { id } = request.params;

    try {
      const player = await prisma.player.delete({
        where: { id },
      });

      if (!player) {
        return reply.status(404).send({ error: 'Jogador não encontrado' });
      }

      reply.status(200).send({ message: 'Jogador deletado com sucesso' });
    } catch (error) {
      console.error("Erro ao deletar jogador:", error);
      reply.status(500).send({ error: 'Erro ao deletar jogador' });
    }
  });
}
