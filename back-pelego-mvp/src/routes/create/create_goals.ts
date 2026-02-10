import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const createGoalsSchema = z.array(z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  goals: z.number().min(1)
}));

export async function createGoalsHandler(app: FastifyInstance) {
  app.post('/create_goals', async (request: FastifyRequest<{ Body: z.infer<typeof createGoalsSchema> }>, reply) => {
    const goals = request.body;
    console.log("Received payload for goals:", JSON.stringify(goals, null, 2));

    try {
      const createdGoals = await prisma.goal.createMany({
        data: goals
      });

      console.log("Goals created:", JSON.stringify(createdGoals, null, 2));
      reply.status(201).send(createdGoals);
    } catch (error) {
      console.error("Erro ao criar gols:", );
      reply.status(500).send({ error: 'Erro ao criar gols' });
    }
  });
}
