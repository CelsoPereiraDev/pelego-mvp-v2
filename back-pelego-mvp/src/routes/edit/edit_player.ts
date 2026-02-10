import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const updatePlayerSchema = z.object({
  name: z.string().optional(),
  country: z.string().optional(),
  image: z.string().optional(),
  position: z.enum(['MEI', 'ATK', 'DEF', 'GOL']).optional(),
  overall: z.object({
    pace: z.number().min(0).max(100).optional(),
    shooting: z.number().min(0).max(100).optional(),
    passing: z.number().min(0).max(100).optional(),
    dribble: z.number().min(0).max(100).optional(),
    defense: z.number().min(0).max(100).optional(),
    physics: z.number().min(0).max(100).optional(),
    overall: z.number().min(0).max(100).optional()
  }).optional(),
  isChampion: z.boolean().optional()
});

export async function updatePlayerHandler(app: FastifyInstance) {
  app.patch('/players/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updatePlayerSchema> }>, reply) => {
    const { id } = request.params;
    const updateData = request.body;
    console.log("Received payload for updating player:", JSON.stringify(updateData, null, 2)); // Log para debugging

    try {
      const existingPlayer = await prisma.player.findUnique({ where: { id } });
      if (!existingPlayer) {
        reply.status(404).send({ error: 'Player not found' });
        return;
      }

      const updatedPlayer = await prisma.player.update({
        where: { id },
        data: {
          ...updateData,
          overall: updateData.overall ? JSON.stringify(updateData.overall) : undefined,
        }
      });

      console.log("Player updated:", JSON.stringify(updatedPlayer, null, 2)); // Log para debugging
      reply.status(200).send(updatedPlayer);
    } catch (error) {
      console.error("Erro ao atualizar jogador:", error.message);
      reply.status(500).send({ error: 'Erro ao atualizar jogador', details: error.message });
    }
  });
}
