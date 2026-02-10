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

interface CreateWeekAndMatchesBody {
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

export async function createWeekAndMatchesHandler(app: FastifyInstance) {
  app.post('/create_week_and_matches', async (request: FastifyRequest<{ Body: CreateWeekAndMatchesBody }>, reply) => {
    const { date, teams, matches } = request.body;

    try {
      // Validação inicial
      if (!date || !teams || !Array.isArray(teams) || teams.length < 2) {
        return reply.status(400).send({
          error: 'Data e pelo menos 2 times são obrigatórios'
        });
      }

      if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return reply.status(400).send({
          error: 'Pelo menos uma partida é obrigatória'
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

      // Verificar se já existe uma week com a mesma data
      const existingWeek = await prisma.week.findFirst({
        where: {
          date: {
            gte: new Date(weekDate.setHours(0, 0, 0, 0)),
            lt: new Date(weekDate.setHours(23, 59, 59, 999))
          }
        },
        include: {
          teams: {
            include: {
              matchesHome: true,
              matchesAway: true
            }
          }
        }
      });

      let week;
      let createdTeams;

      if (existingWeek) {
        // Verificar se já existem partidas para essa semana
        const hasMatches = existingWeek.teams.some(
          team => team.matchesHome.length > 0 || team.matchesAway.length > 0
        );

        if (hasMatches) {
          return reply.status(400).send({
            error: 'Já existem partidas cadastradas para esta semana'
          });
        }

        week = existingWeek;
        createdTeams = existingWeek.teams;
      } else {
        // Criar week e teams em uma transação
        const result = await prisma.$transaction(async (prisma) => {
          const createdWeek = await prisma.week.create({
            data: { date: new Date(date) },
          });

          const createdTeamsData = await Promise.all(teams.map(async (teamPlayers) => {
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

          return { week: createdWeek, teams: createdTeamsData };
        });

        week = result.week;
        createdTeams = result.teams;
      }

      // Validar índices dos times nas partidas
      const invalidTeamIndex = matches.some(
        match => match.homeTeamIndex >= createdTeams.length ||
                 match.awayTeamIndex >= createdTeams.length ||
                 match.homeTeamIndex < 0 ||
                 match.awayTeamIndex < 0
      );

      if (invalidTeamIndex) {
        return reply.status(400).send({
          error: 'Índice de time inválido nas partidas'
        });
      }

      // Criar partidas em lote
      const createdMatches = await Promise.all(matches.map(async (matchData, index) => {
        const homeTeam = createdTeams[matchData.homeTeamIndex];
        const awayTeam = createdTeams[matchData.awayTeamIndex];

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

      // Calcular estatísticas dos times
      const teamStats = new Map<string, TeamStats>();

      createdTeams.forEach(team => {
        teamStats.set(team.id, {
          teamId: team.id,
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

        // Atualizar partidas jogadas
        homeStats.matchesPlayed++;
        awayStats.matchesPlayed++;

        // Atualizar gols
        homeStats.goalsScored += homeGoals;
        homeStats.goalsConceded += awayGoals;
        awayStats.goalsScored += awayGoals;
        awayStats.goalsConceded += homeGoals;

        // Atualizar saldo de gols
        homeStats.goalDifference = homeStats.goalsScored - homeStats.goalsConceded;
        awayStats.goalDifference = awayStats.goalsScored - awayStats.goalsConceded;

        // Atribuir pontos
        if (homeGoals > awayGoals) {
          homeStats.points += 3;
        } else if (awayGoals > homeGoals) {
          awayStats.points += 3;
        } else {
          homeStats.points += 1;
          awayStats.points += 1;
        }
      });

      // Determinar campeão com critérios de desempate
      const statsArray = Array.from(teamStats.values());
      const maxPoints = Math.max(...statsArray.map(s => s.points));

      let champions = statsArray.filter(s => s.points === maxPoints);

      // Critério 1: Menos partidas jogadas
      if (champions.length > 1) {
        const minMatches = Math.min(...champions.map(c => c.matchesPlayed));
        champions = champions.filter(c => c.matchesPlayed === minMatches);
      }

      // Critério 2: Maior saldo de gols
      if (champions.length > 1) {
        const maxGoalDiff = Math.max(...champions.map(c => c.goalDifference));
        champions = champions.filter(c => c.goalDifference === maxGoalDiff);
      }

      // Critério 3: Mais gols marcados
      if (champions.length > 1) {
        const maxGoalsScored = Math.max(...champions.map(c => c.goalsScored));
        champions = champions.filter(c => c.goalsScored === maxGoalsScored);
      }

      // Se ainda houver empate, não terá campeão
      const championTeamId = champions.length === 1 ? champions[0].teamId : null;

      // Atualizar times com pontos e campeão
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

      // Atualizar jogadores campeões
      if (championTeamId) {
        const championTeam = createdTeams.find(t => t.id === championTeamId);

        if (championTeam) {
          const playerIds = championTeam.players.map(p => p.playerId);

          // Atualizar isChampion nos jogadores
          await prisma.player.updateMany({
            where: { id: { in: playerIds } },
            data: { isChampion: true }
          });

          // Atualizar championDates para cada jogador
          await Promise.all(playerIds.map(async (playerId) => {
            // Buscar ou criar MonthIndividualPrizes
            const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);

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
            } else {
              await prisma.monthIndividualPrizes.update({
                where: { id: monthPrize.id },
                data: {
                  championTimes: { increment: 1 }
                }
              });
            }

            // Criar ChampionDate
            await prisma.championDate.create({
              data: {
                monthIndividualPrizeId: monthPrize.id,
                date: new Date(date)
              }
            });
          }));

          // Resetar isChampion dos não-campeões
          const nonChampionIds = createdTeams
            .filter(t => t.id !== championTeamId)
            .flatMap(t => t.players.map(p => p.playerId));

          if (nonChampionIds.length > 0) {
            await prisma.player.updateMany({
              where: { id: { in: nonChampionIds } },
              data: { isChampion: false }
            });
          }
        }
      } else {
        // Se não houver campeão, resetar isChampion de todos
        const allPlayerIds = createdTeams.flatMap(t => t.players.map(p => p.playerId));
        await prisma.player.updateMany({
          where: { id: { in: allPlayerIds } },
          data: { isChampion: false }
        });
      }

      reply.status(201).send({
        message: 'Semana, times e partidas criados com sucesso',
        week: {
          id: week.id,
          date: week.date
        },
        teams: createdTeams.map(team => ({
          id: team.id,
          points: teamStats.get(team.id)?.points || 0,
          champion: team.id === championTeamId,
          players: team.players.map(p => p.playerId)
        })),
        matches: createdMatches.map(match => ({
          id: match.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          result: match.result
        })),
        championTeamId
      });
    } catch (error) {
      console.error("Erro ao criar semana e partidas:", error);
      reply.status(500).send({ error: 'Erro ao criar semana e partidas' });
    }
  });
}
