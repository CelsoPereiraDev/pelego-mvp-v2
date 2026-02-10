import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

export async function updateTeamsHandler(app: FastifyInstance) {
  app.patch('/update_teams', async (request: FastifyRequest, reply) => {
    const { teams } = request.body;

    try {
      await prisma.player.updateMany({
        data: { isChampion: false }
      });

      const updateTeamPromises = teams.map(team =>
        prisma.team.update({
          where: { id: team.id },
          data: {
            champion: team.champion,
            points: team.points
          }
        })
      );

      await Promise.all(updateTeamPromises);

      const updatePlayerPromises = teams.flatMap(team =>
        team.players.map(player =>
          prisma.player.update({
            where: { id: player.id },
            data: { isChampion: player.isChampion }
          })
        )
      );

      await Promise.all(updatePlayerPromises);

      
      const currentDate = new Date();

      const updatePrizePromises = teams.flatMap(team =>
        team.players.map(player =>
          player.isChampion
            ? prisma.monthIndividualPrizes.upsert({
                where: {
                  playerId_date: {
                    playerId: player.id,
                    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                  }
                },
                update: {
                  championTimes: { increment: 1 },
                  championDates: {
                    create: {
                      date: currentDate,
                    }
                  }
                },
                create: {
                  playerId: player.id,
                  date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                  championTimes: 1,
                  championDates: {
                    create: {
                      date: currentDate,
                    }
                  }
                }
              })
            : Promise.resolve()
        )
      );

      await Promise.all(updatePrizePromises);

      reply.status(200).send({ message: 'Times e prêmios mensais atualizados com sucesso' });
    } catch (error) {
      console.error("Erro ao atualizar times e prêmios mensais:", error);
      reply.status(500).send({ error: 'Erro ao atualizar times e prêmios mensais', details: error });
    }
  });
}
