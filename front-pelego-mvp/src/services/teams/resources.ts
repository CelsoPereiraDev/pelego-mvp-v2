import { TeamResponse } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

export async function getTeams(): Promise<TeamResponse[]> {
  return new QueryRequest<TeamResponse[], void>().get('teams');
}

export async function updateTeams(teamsData: TeamResponse[]) {
  return new QueryRequest<void, TeamResponse[]>().patch('update_teams', teamsData);
}
