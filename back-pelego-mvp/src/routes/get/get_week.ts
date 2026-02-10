import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface GetWeekParams {
  weekId: string;
}

export async function getWeekHandler(app: FastifyInstance) {
  app.get('/week/:weekId', async (request: FastifyRequest<{ Params: GetWeekParams }>, reply: FastifyReply) => {
    const { weekId } = request.params;

    try {
      const week = await prisma.week.findUnique({
        where: { id: weekId },
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

      if (!week) {
        reply.status(404).send({ error: 'Semana não encontrada' });
        return;
      }

      // Log debug information about own goals
      week.teams.forEach(team => {
        console.log(`Team: ${team.id}`);
        team.matchesHome.forEach(match => {
          match.goals.forEach(goal => {
            if (goal.ownGoalPlayer) {
              console.log(`Own goal by ${goal.ownGoalPlayer.name} in match ${match.id}`);
            }
          });
        });
        team.matchesAway.forEach(match => {
          match.goals.forEach(goal => {
            if (goal.ownGoalPlayer) {
              console.log(`Own goal by ${goal.ownGoalPlayer.name} in match ${match.id}`);
            }
          });
        });
      });

      reply.status(200).send(week);
    } catch (error) {
      console.error("Erro ao obter semana:", error);
      reply.status(500).send({ error: 'Erro ao obter semana', details: error });
    }
  });
}
