import { CreateMatch, CreateMatchDataRequested } from "@/types/match";

export function mapFormDataToBackend(data: CreateMatch, createdTeams: { id: string }[], weekId: string) {
  

  const matchesData: CreateMatchDataRequested[] = data.matches.map(match => {
    const homeTeam = createdTeams[parseInt(match.homeTeamId, 10)];
    const awayTeam = createdTeams[parseInt(match.awayTeamId, 10)];

    if (!homeTeam || !awayTeam) {
      throw new Error('Missing team IDs in matches data');
    }

    const mapGoals = (goals) => {
      return goals
        .filter(goal => goal.goals !== undefined && goal.goals !== null && goal.goals !== 0)
        .map(goal => {
          if (goal.playerId === 'GC') {
            return {
              ownGoalPlayerId: goal.ownGoalPlayerId,
              goals: typeof goal.goals === 'string' ? parseInt(goal.goals, 10) : goal.goals
            };
          } else {
            return {
              playerId: goal.playerId,
              goals: typeof goal.goals === 'string' ? parseInt(goal.goals, 10) : goal.goals
            };
          }
        });
    };

    const mapAssists = (assists) => {
      
      return assists
        .filter(assist => assist.assists !== undefined && assist.assists !== null && assist.assists !== 0 && assist.playerId !== undefined)
        .map(assist => {
          const mappedAssist = {
            playerId: assist.playerId,
            assists: typeof assist.assists === 'string' ? parseInt(assist.assists, 10) : assist.assists
          };
          
          return mappedAssist;
        });
    };

    const mappedMatch = {
      weekId,
      date: new Date(data.date).toISOString(),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeGoals: mapGoals(match.homeGoals.whoScores || []),
      awayGoals: mapGoals(match.awayGoals.whoScores || []),
      homeAssists: mapAssists(match.homeAssists || []),
      awayAssists: mapAssists(match.awayAssists || [])
    };

    

    return mappedMatch;
  });

  

  return { matchesData };
}
