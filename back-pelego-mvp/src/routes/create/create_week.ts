import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface CreateWeekWithTeamsBody {
  date: string;
  teams: string[][];
}

export async function createWeekHandler(app: FastifyInstance) {
  app.post('/create_week_with_teams', async (request: FastifyRequest<{ Body: CreateWeekWithTeamsBody }>, reply) => {
    const { date, teams } = request.body;

    try {
      const weekDate = new Date(date);

      const week = await prisma.$transaction(async (prisma) => {
        const createdWeek = await prisma.week.create({
          data: { date: weekDate },
        });

        const createdTeams = await Promise.all(teams.map(async (teamPlayers) => {
          const team = await prisma.team.create({
            data: {
              weekId: createdWeek.id,
              players: {
                create: teamPlayers.map(playerId => ({
                  player: { connect: { id: playerId } },
                })),
              },
            },
            include: {
              players: {
                include: {
                  player: true
                }
              }
            }
          });
          return team;
        }));

        return { week: createdWeek, createdTeams };
      });

      const response = {
        week: {
          id: week.week.id,
          date: week.week.date
        },
        createdTeams: week.createdTeams.map(team => ({
          id: team.id,
          weekId: team.weekId,
          champion: team.champion,
          points: team.points,
          players: team.players.map(player => ({
            id: player.playerId,
            isChampion: player.player.isChampion
          }))
        }))
      };

      reply.status(201).send(response);
    } catch (error) {
      console.error("Erro ao criar semana e times:", error);
      reply.status(500).send({ error: 'Erro ao criar semana e times'});
    }
  });
}
