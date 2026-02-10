import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";


export async function getWeeksHandler(app: FastifyInstance) {
  app.get('/weeks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const weeks = await prisma.week.findMany({
        include: {
          teams: {
            include: {
              players: {
                include: {
                  player: true
                }
              },
              matchesHome: {
                include: {
                  result: true,
                  goals: {
                    include: {
                      player: true,
                      ownGoalPlayer: true
                    }
                  },
                  assists: {
                    include: {
                      player: true 
                    }
                  }
                }
              },
              matchesAway: {
                include: {
                  result: true,
                  goals: {
                    include: {
                      player: true,
                      ownGoalPlayer: true
                    }
                  },
                  assists: {
                    include: {
                      player: true 
                    }
                  }
                }
              }
            }
          }
        }
      });

      reply.status(200).send(weeks);
    } catch (error) {
      console.error("Erro ao obter semanas:", error);
      reply.status(500).send({ error: 'Erro ao obter semanas', details: error });
    }
  });
}
