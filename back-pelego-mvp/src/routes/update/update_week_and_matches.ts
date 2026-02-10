import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from '../../lib/prisma';

interface Goal {
  playerId?: string;
  ownGoalPlayerId?: string;
  goals: number;
}

interface Assist {
  playerId: string;
  assists: number;
}

interface MatchInput {
  homeTeamIndex: number;
  awayTeamIndex: number;
  homeGoals: Goal[];
  awayGoals: Goal[];
  homeAssists: Assist[];
  awayAssists: Assist[];
}

interface UpdateWeekAndMatchesBody {
  date: string;
  teams: string[][];
  matches: MatchInput[];
}

interface TeamStats {
  teamId: string;
  points: number;
  matchesPlayed: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
}

export async function updateWeekAndMatchesHandler(app: FastifyInstance) {
  app.put('/week/:weekId', async (request: FastifyRequest<{
    Params: { weekId: string };
    Body: UpdateWeekAndMatchesBody
  }>, reply) => {
    const { weekId } = request.params;
    const { date, teams, matches } = request.body;

    try {
      // Validação inicial
      if (!date || !teams || !Array.isArray(teams) || teams.length < 2) {
        return reply.status(400).send({
          error: 'Data e pelo menos 2 times são obrigatórios'
        });
      }

      if (!matches || !Array.isArray(matches)) {
        return reply.status(400).send({
          error: 'Array de partidas é obrigatório'
        });
      }

      // Buscar week existente
      const existingWeek = await prisma.week.findUnique({
        where: { id: weekId },
        include: {
          teams: {
            include: {
              players: true
            }
          }
        }
      });

      if (!existingWeek) {
        return reply.status(404).send({
          error: 'Semana não encontrada'
        });
      }

      // VALIDAÇÃO CRÍTICA: Número de times deve ser igual
      if (teams.length !== existingWeek.teams.length) {
        return reply.status(400).send({
          error: `Esperado ${existingWeek.teams.length} times, recebido ${teams.length}. Não é permitido adicionar ou remover times.`
        });
      }

      const weekDate = new Date(date);

      // Validar se todos os jogadores existem
      const allPlayerIds = teams.flat();
      const uniquePlayerIds = Array.from(new Set(allPlayerIds));

      const existingPlayers = await prisma.player.findMany({
        where: { id: { in: uniquePlayerIds } }
      });

      if (existingPlayers.length !== uniquePlayerIds.length) {
        return reply.status(400).send({
          error: 'Um ou mais jogadores não existem'
        });
      }

      // Executar update em transação
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Atualizar data da week
        const updatedWeek = await prisma.week.update({
          where: { id: weekId },
          data: { date: new Date(date) }
        });

        // 2. Atualizar jogadores de cada time
        const updatedTeams = await Promise.all(
          existingWeek.teams.map(async (team, index) => {
            const newPlayerIds = teams[index];

            // Deletar TeamMembers antigos
            await prisma.teamMember.deleteMany({
              where: { teamId: team.id }
            });

            // Criar novos TeamMembers
            await prisma.teamMember.createMany({
              data: newPlayerIds.map(playerId => ({
                teamId: team.id,
                playerId: playerId
              }))
            });

            // Retornar team atualizado
            return prisma.team.findUnique({
              where: { id: team.id },
              include: {
                players: {
                  include: {
                    player: true
                  }
                }
              }
            });
          })
        );

        // 3. Deletar partidas, gols e assistências antigas
        const oldMatches = await prisma.match.findMany({
          where: {
            OR: [
              { homeTeam: { weekId } },
              { awayTeam: { weekId } }
            ]
          }
        });

        for (const match of oldMatches) {
          await prisma.assist.deleteMany({ where: { matchId: match.id } });
          await prisma.goal.deleteMany({ where: { matchId: match.id } });
          await prisma.matchResult.deleteMany({ where: { matchId: match.id } });
        }

        await prisma.match.deleteMany({
          where: {
            OR: [
              { homeTeam: { weekId } },
              { awayTeam: { weekId } }
            ]
          }
        });

        // 4. Validar índices dos times nas partidas
        const invalidTeamIndex = matches.some(
          match => match.homeTeamIndex >= updatedTeams.length ||
                   match.awayTeamIndex >= updatedTeams.length ||
                   match.homeTeamIndex < 0 ||
                   match.awayTeamIndex < 0
        );

        if (invalidTeamIndex) {
          throw new Error('Índice de time inválido nas partidas');
        }

        // 5. Criar novas partidas
        const createdMatches = await Promise.all(matches.map(async (matchData, index) => {
          const homeTeam = updatedTeams[matchData.homeTeamIndex]!;
          const awayTeam = updatedTeams[matchData.awayTeamIndex]!;

          const homeGoalsCount = matchData.homeGoals.reduce((acc, goal) => acc + goal.goals, 0);
          const awayGoalsCount = matchData.awayGoals.reduce((acc, goal) => acc + goal.goals, 0);

          const match = await prisma.match.create({
            data: {
              date: new Date(date),
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              orderIndex: index,
              result: {
                create: {
                  homeGoals: homeGoalsCount,
                  awayGoals: awayGoalsCount
                }
              },
              goals: {
                create: [
                  ...matchData.homeGoals.map(goal => ({
                    playerId: goal.playerId ?? null,
                    ownGoalPlayerId: goal.ownGoalPlayerId ?? null,
                    goals: goal.goals
                  })),
                  ...matchData.awayGoals.map(goal => ({
                    playerId: goal.playerId ?? null,
                    ownGoalPlayerId: goal.ownGoalPlayerId ?? null,
                    goals: goal.goals
                  }))
                ]
              },
              assists: {
                create: [
                  ...matchData.homeAssists.map(assist => ({
                    playerId: assist.playerId,
                    assists: assist.assists
                  })),
                  ...matchData.awayAssists.map(assist => ({
                    playerId: assist.playerId,
                    assists: assist.assists
                  }))
                ]
              }
            },
            include: {
              result: true
            }
          });

          return match;
        }));

        // 6. Calcular estatísticas dos times
        const teamStats = new Map<string, TeamStats>();

        updatedTeams.forEach(team => {
          teamStats.set(team!.id, {
            teamId: team!.id,
            points: 0,
            matchesPlayed: 0,
            goalsScored: 0,
            goalsConceded: 0,
            goalDifference: 0
          });
        });

        createdMatches.forEach(match => {
          const homeStats = teamStats.get(match.homeTeamId)!;
          const awayStats = teamStats.get(match.awayTeamId)!;

          const homeGoals = match.result?.homeGoals || 0;
          const awayGoals = match.result?.awayGoals || 0;

          homeStats.matchesPlayed++;
          awayStats.matchesPlayed++;

          homeStats.goalsScored += homeGoals;
          homeStats.goalsConceded += awayGoals;
          awayStats.goalsScored += awayGoals;
          awayStats.goalsConceded += homeGoals;

          homeStats.goalDifference = homeStats.goalsScored - homeStats.goalsConceded;
          awayStats.goalDifference = awayStats.goalsScored - awayStats.goalsConceded;

          if (homeGoals > awayGoals) {
            homeStats.points += 3;
          } else if (awayGoals > homeGoals) {
            awayStats.points += 3;
          } else {
            homeStats.points += 1;
            awayStats.points += 1;
          }
        });

        // 7. Determinar campeão
        const statsArray = Array.from(teamStats.values());
        const maxPoints = Math.max(...statsArray.map(s => s.points));

        let champions = statsArray.filter(s => s.points === maxPoints);

        if (champions.length > 1) {
          const minMatches = Math.min(...champions.map(c => c.matchesPlayed));
          champions = champions.filter(c => c.matchesPlayed === minMatches);
        }

        if (champions.length > 1) {
          const maxGoalDiff = Math.max(...champions.map(c => c.goalDifference));
          champions = champions.filter(c => c.goalDifference === maxGoalDiff);
        }

        if (champions.length > 1) {
          const maxGoalsScored = Math.max(...champions.map(c => c.goalsScored));
          champions = champions.filter(c => c.goalsScored === maxGoalsScored);
        }

        const championTeamId = champions.length === 1 ? champions[0].teamId : null;

        // 8. Atualizar times com pontos e campeão
        await Promise.all(
          Array.from(teamStats.entries()).map(([teamId, stats]) =>
            prisma.team.update({
              where: { id: teamId },
              data: {
                points: stats.points,
                champion: teamId === championTeamId
              }
            })
          )
        );

        // 9. Resetar isChampion de todos os jogadores da semana
        const allWeekPlayerIds = updatedTeams.flatMap(t => t!.players.map(p => p.playerId));
        await prisma.player.updateMany({
          where: { id: { in: allWeekPlayerIds } },
          data: { isChampion: false }
        });

        // 10. Atualizar jogadores campeões
        if (championTeamId) {
          const championTeam = updatedTeams.find(t => t!.id === championTeamId);

          if (championTeam) {
            const playerIds = championTeam.players.map(p => p.playerId);

            await prisma.player.updateMany({
              where: { id: { in: playerIds } },
              data: { isChampion: true }
            });

            // Atualizar championDates (remover antigos, criar novos)
            const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);

            await Promise.all(playerIds.map(async (playerId) => {
              let monthPrize = await prisma.monthIndividualPrizes.findFirst({
                where: {
                  playerId: playerId,
                  date: monthStart
                }
              });

              if (!monthPrize) {
                monthPrize = await prisma.monthIndividualPrizes.create({
                  data: {
                    playerId: playerId,
                    date: monthStart,
                    championTimes: 1
                  }
                });
              }

              // Remover ChampionDate antigo para esta week
              await prisma.championDate.deleteMany({
                where: {
                  monthIndividualPrizeId: monthPrize.id,
                  date: {
                    gte: new Date(weekDate.setHours(0, 0, 0, 0)),
                    lt: new Date(weekDate.setHours(23, 59, 59, 999))
                  }
                }
              });

              // Criar novo ChampionDate
              await prisma.championDate.create({
                data: {
                  monthIndividualPrizeId: monthPrize.id,
                  date: new Date(date)
                }
              });
            }));
          }
        }

        return {
          week: updatedWeek,
          teams: updatedTeams,
          matches: createdMatches,
          championTeamId
        };
      });

      reply.status(200).send({
        message: 'Semana atualizada com sucesso',
        week: {
          id: result.week.id,
          date: result.week.date
        },
        teams: result.teams.map(team => ({
          id: team!.id,
          players: team!.players.map(p => p.playerId)
        })),
        matches: result.matches.map(match => ({
          id: match.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          result: match.result
        })),
        championTeamId: result.championTeamId
      });
    } catch (error) {
      console.error("Erro ao atualizar semana e partidas:", error);
      reply.status(500).send({
        error: 'Erro ao atualizar semana e partidas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
}
