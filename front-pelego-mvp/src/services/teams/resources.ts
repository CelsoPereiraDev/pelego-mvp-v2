import { TeamResponse } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';
const CLIENT_ID = 'your-client-id';

export async function getTeams(): Promise<TeamResponse[]> {
  const queryRequest = new QueryRequest<TeamResponse[], void>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.get('teams');
}

export async function updateTeams(teamsData: TeamResponse[]) {
  const queryRequest = new QueryRequest<void, TeamResponse[]>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.patch('update_teams', teamsData);
}


