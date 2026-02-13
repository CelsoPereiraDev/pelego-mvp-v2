import { WeekResponse } from '@/types/weeks';
import { PlayerResponse } from '@/types/player';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mapWeekToFormValues = (week: WeekResponse, players: PlayerResponse[]) => {
  const mappedMatchIds = new Set();

  // Mapeia o ID dos times para o índice correspondente em teams
  const teamIndexMap = week?.teams.reduce(
    (acc, team, index) => {
      acc[team.id] = index;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Cria um mapa de playerId -> teamId para identificar a qual time cada jogador pertence
  const playerToTeamMap: Record<string, string> = {};
  week?.teams.forEach((team) => {
    team.players.forEach((player) => {
      playerToTeamMap[player.playerId] = team.id;
    });
  });

  return {
    date: week?.date ? new Date(week.date).toISOString().split('T')[0] : '',
    teams:
      week?.teams.map((team) => ({
        players: team.players.map((player) => player.playerId),
      })) || [],
    matches:
      week?.teams
        .flatMap((team) => {
          return team.matchesHome.concat(team.matchesAway);
        })
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((match) => {
          if (mappedMatchIds.has(match.id)) return null;
          mappedMatchIds.add(match.id);

          // Separar gols por time
          const homeGoalsForForm: { goals: number; playerId: string; ownGoalPlayerId: string }[] =
            [];
          const awayGoalsForForm: { goals: number; playerId: string; ownGoalPlayerId: string }[] =
            [];

          match.goals.forEach((goal) => {
            // Gol contra (ownGoal)
            if (goal.ownGoalPlayerId) {
              const ownGoalPlayerTeam = playerToTeamMap[goal.ownGoalPlayerId];

              // Se o jogador que fez gol contra é do time da casa, beneficia o away
              // Se o jogador que fez gol contra é do time visitante, beneficia o home
              const benefitsHomeTeam = ownGoalPlayerTeam === match.awayTeamId;

              for (let i = 0; i < goal.goals; i++) {
                const goalEntry = {
                  goals: 1,
                  playerId: 'GC',
                  ownGoalPlayerId: goal.ownGoalPlayerId,
                };

                if (benefitsHomeTeam) {
                  homeGoalsForForm.push(goalEntry);
                } else {
                  awayGoalsForForm.push(goalEntry);
                }
              }
            }
            // Gol normal
            else if (goal.playerId) {
              const scorerTeam = playerToTeamMap[goal.playerId];

              for (let i = 0; i < goal.goals; i++) {
                const goalEntry = {
                  goals: 1,
                  playerId: goal.playerId,
                  ownGoalPlayerId: '',
                };

                if (scorerTeam === match.homeTeamId) {
                  homeGoalsForForm.push(goalEntry);
                } else if (scorerTeam === match.awayTeamId) {
                  awayGoalsForForm.push(goalEntry);
                }
              }
            }
          });

          // Separar assistências por time
          const homeAssists: { assists: number; playerId: string }[] = [];
          const awayAssists: { assists: number; playerId: string }[] = [];

          match.assists.forEach((assist) => {
            const assistPlayerTeam = playerToTeamMap[assist.playerId];

            // Criar uma entrada para cada assistência individual (assists: 1)
            for (let i = 0; i < assist.assists; i++) {
              const assistEntry = {
                assists: 1,
                playerId: assist.playerId,
              };

              if (assistPlayerTeam === match.homeTeamId) {
                homeAssists.push(assistEntry);
              } else if (assistPlayerTeam === match.awayTeamId) {
                awayAssists.push(assistEntry);
              }
            }
          });

          // Garantir que assistências tenham o mesmo tamanho que gols
          // (o formulário espera uma entrada de assistência para cada gol)
          while (homeAssists.length < homeGoalsForForm.length) {
            homeAssists.push({ assists: 0, playerId: '' });
          }
          while (awayAssists.length < awayGoalsForForm.length) {
            awayAssists.push({ assists: 0, playerId: '' });
          }

          const result = {
            homeTeamId: teamIndexMap[match.homeTeamId].toString(),
            awayTeamId: teamIndexMap[match.awayTeamId].toString(),
            homeGoals: {
              goalsCount: homeGoalsForForm.length.toString(),
              whoScores: homeGoalsForForm,
            },
            awayGoals: {
              goalsCount: awayGoalsForForm.length.toString(),
              whoScores: awayGoalsForForm,
            },
            homeAssists,
            awayAssists,
          };
          return result;
        })
        .filter((match) => match !== null) || [],
  };
};
