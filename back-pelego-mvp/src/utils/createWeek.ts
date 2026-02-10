import { prisma } from "../lib/prisma";


interface CreateWeekData {
  date: string;
  teams: string[][];
}

export async function createWeek(data: CreateWeekData) {
  const week = await prisma.week.create({
    data: {
      date: new Date(data.date),
      teams: {
        create: data.teams.map(players => ({
          players: {
            create: players.map(playerId => ({
              player: { connect: { id: playerId } }
            }))
          }
        }))
      }
    },
    include: {
      teams: {
        include: {
          players: {
            include: {
              player: true
            }
          }
        }
      }
    }
  });

  const createdTeams = week.teams.map(team => ({
    id: team.id,
    weekId: week.id,
    champion: team.champion,
    points: team.points,
    players: team.players.map(player => ({
      id: player.playerId,
      isChampion: player.player.isChampion
    }))
  }));

  return { week: { id: week.id, date: week.date }, createdTeams };
}
