import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from '../../lib/prisma';


const playerOverallSchema = z.object({
  pace: z.number().int().min(0).max(100),
  shooting: z.number().int().min(0).max(100),
  passing: z.number().int().min(0).max(100),
  dribble: z.number().int().min(0).max(100),
  defense: z.number().int().min(0).max(100),
  physics: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
});


const playerSchema = z.object({
  name: z.string(),
  country: z.string().optional(),
  team: z.string().optional(),
  image: z.string().optional(),
  position: z.enum(['MEI', 'ATK', 'DEF', 'GOL']),
  isChampion: z.boolean().optional(),
  overall: playerOverallSchema
});


export async function createPlayer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/create_players', {
    schema: {
      body: playerSchema
    }
  }, async (request, reply) => {
    const { name, country, team, image, position, isChampion, overall } = request.body;

    try {     
      
      const player = await prisma.player.create({
        data: {
          name,
          country: country ?? "",
          team: team ?? "",
          image: image ?? "",
          position,
          isChampion: isChampion ?? false,
          overall: JSON.stringify(overall)
        }
      });

      reply.status(201).send(player);
    } catch (error) {
      console.error("Erro ao criar jogador:", error);
      reply.status(500).send({ error: 'Erro ao criar jogador' });
    }
  });
}
