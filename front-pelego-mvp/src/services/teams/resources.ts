import { TeamResponse } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

export async function updateTeams(futId: string, teamsData: TeamResponse[]) {
  return new QueryRequest<void, TeamResponse[]>().patch(`futs/${futId}/update_teams`, teamsData);
}
