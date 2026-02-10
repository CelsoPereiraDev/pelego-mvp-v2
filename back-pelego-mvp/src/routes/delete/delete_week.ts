import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface DeleteWeekParams {
  weekId: string;
}

export async function deleteWeekHandler(app: FastifyInstance) {
  app.delete('/weeks/:weekId', async (request: FastifyRequest<{ Params: DeleteWeekParams }>, reply: FastifyReply) => {
    const { weekId } = request.params;

    try {
      // 1. Verificar se a semana existe
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
              matchesHome: true,
              matchesAway: true
            }
          }
        }
      });

      if (!week) {
        return reply.status(404).send({ error: 'Semana não encontrada' });
      }

      // 2. Identificar todos os jogadores da semana e os campeões
      const allPlayerIds = week.teams.flatMap(team =>
        team.players.map(p => p.playerId)
      );

      const championTeam = week.teams.find(team => team.champion);
      const championPlayerIds = championTeam
        ? championTeam.players.map(p => p.playerId)
        : [];

      // 3. Buscar o mês da semana para atualizar MonthIndividualPrizes
      const weekDate = new Date(week.date);
      const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);

      // Executar tudo em uma transação para garantir atomicidade
      await prisma.$transaction(async (tx) => {
        // 4. Remover ChampionDates para jogadores campeões dessa semana
        if (championPlayerIds.length > 0) {
          const monthPrizes = await tx.monthIndividualPrizes.findMany({
            where: {
              playerId: { in: championPlayerIds },
              date: monthStart
            },
            include: {
              championDates: true
            }
          });

          for (const monthPrize of monthPrizes) {
            // Remover o ChampionDate específico desta semana
            await tx.championDate.deleteMany({
              where: {
                monthIndividualPrizeId: monthPrize.id,
                date: week.date
              }
            });

            // Decrementar championTimes
            const newChampionTimes = Math.max(0, monthPrize.championTimes - 1);

            if (newChampionTimes === 0) {
              // Se não tem mais campeonatos no mês, deletar o registro
              await tx.monthIndividualPrizes.delete({
                where: { id: monthPrize.id }
              });
            } else {
              // Caso contrário, apenas decrementar
              await tx.monthIndividualPrizes.update({
                where: { id: monthPrize.id },
                data: { championTimes: newChampionTimes }
              });
            }
          }
        }

        // 5. Resetar isChampion para todos os jogadores da semana
        // (outro jogo pode ter definido eles como campeões, então verificamos)
        if (allPlayerIds.length > 0) {
          // Buscar outras weeks onde esses jogadores são campeões
          const otherChampionTeams = await tx.team.findMany({
            where: {
              weekId: { not: weekId },
              champion: true,
              players: {
                some: {
                  playerId: { in: allPlayerIds }
                }
              }
            },
            include: {
              players: true
            }
          });

          // IDs de jogadores que ainda são campeões em outras semanas
          const stillChampionIds = new Set(
            otherChampionTeams.flatMap(team => team.players.map(p => p.playerId))
          );

          // Jogadores que NÃO são mais campeões em nenhuma semana
          const noLongerChampionIds = allPlayerIds.filter(
            id => !stillChampionIds.has(id)
          );

          if (noLongerChampionIds.length > 0) {
            await tx.player.updateMany({
              where: { id: { in: noLongerChampionIds } },
              data: { isChampion: false }
            });
          }
        }

        // 6. Deletar Assists relacionadas às partidas da semana
        await tx.assist.deleteMany({
          where: {
            match: {
              OR: [
                { homeTeam: { weekId } },
                { awayTeam: { weekId } }
              ]
            }
          }
        });

        // 7. Deletar Goals relacionados às partidas da semana
        await tx.goal.deleteMany({
          where: {
            match: {
              OR: [
                { homeTeam: { weekId } },
                { awayTeam: { weekId } }
              ]
            }
          }
        });

        // 8. Deletar MatchResults relacionados às partidas da semana
        await tx.matchResult.deleteMany({
          where: {
            match: {
              OR: [
                { homeTeam: { weekId } },
                { awayTeam: { weekId } }
              ]
            }
          }
        });

        // 9. Deletar Matches da semana
        await tx.match.deleteMany({
          where: {
            OR: [
              { homeTeam: { weekId } },
              { awayTeam: { weekId } }
            ]
          }
        });

        // 10. Deletar TeamMembers (relação jogadores-times)
        await tx.teamMember.deleteMany({
          where: {
            team: { weekId }
          }
        });

        // 11. Deletar Teams da semana
        await tx.team.deleteMany({
          where: { weekId }
        });

        // 12. Deletar a Week
        await tx.week.delete({
          where: { id: weekId }
        });
      });

      reply.status(200).send({
        message: 'Semana deletada com sucesso. Todos os dados relacionados foram removidos.',
        deletedWeekId: weekId,
        deletedWeekDate: week.date,
        championPlayersAffected: championPlayerIds.length,
        totalPlayersAffected: allPlayerIds.length
      });
    } catch (error) {
      console.error("Erro ao deletar semana:", error);
      reply.status(500).send({
        error: 'Erro ao deletar semana',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
}
