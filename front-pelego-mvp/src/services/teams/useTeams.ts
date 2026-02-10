
import { TeamResponse } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';
import useSWR from 'swr';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';
const CLIENT_ID = 'your-client-id';

export async function getTeams(): Promise<TeamResponse[]> {
  const queryRequest = new QueryRequest<TeamResponse[], void>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.get('teams');
}

export async function updateTeams(teams: TeamResponse[]): Promise<void> {
  const queryRequest = new QueryRequest<void, { teams: TeamResponse[] }>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  await queryRequest.patch('update_teams', { teams });
}

export function useTeams() {
  const { data, error, mutate } = useSWR('/teams', getTeams);

  const update = async (teams: TeamResponse[]) => {
    await updateTeams(teams);
    mutate();
  };

  return {
    teams: data,
    isLoading: !error && !data,
    isError: error,
    update,
  };
}
