import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface GetWeeksByDateParams {
  year: string;
  month?: string;
}

export async function getWeeksByDateHandler(app: FastifyInstance) {
  app.get('/weeks/:year/:month?', async (request: FastifyRequest<{ Params: GetWeeksByDateParams }>, reply: FastifyReply) => {
    const { year, month } = request.params;

    try {
      const startDate = new Date(`${year}-${month || '01'}-01`);
      const endDate = month ? new Date(`${year}-${month}-31`) : new Date(`${year}-12-31`);

      const weeks = await prisma.week.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
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
