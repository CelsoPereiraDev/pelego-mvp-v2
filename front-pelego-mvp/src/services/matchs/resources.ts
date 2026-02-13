import {
  CreateMatchDataRequested,
  CreateWeekAndMatchesRequest,
  CreateWeekAndMatchesResponse,
  MatchResponse,
} from '@/types/match';
import { QueryRequest, getAuthHeaders, API_BASE_URL } from '@/utils/QueryRequest';

export async function createMatches(
  futId: string,
  matchesData: { matches: CreateMatchDataRequested[] },
) {
  return new QueryRequest<
    { message: string; createdMatches: MatchResponse[] },
    { matches: CreateMatchDataRequested[] }
  >().post(`futs/${futId}/create_matches`, matchesData);
}

export async function createWeekWithTeams(futId: string, date: string, teams: string[][]) {
  return new QueryRequest<
    { week: { id: string }; createdTeams: { id: string; players: string[] }[] },
    { date: string; teams: string[][] }
  >().post(`futs/${futId}/create_week_with_teams`, { date, teams });
}

export async function createWeekAndMatches(
  futId: string,
  data: CreateWeekAndMatchesRequest,
): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${API_BASE_URL}/futs/${futId}/create_week_and_matches`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create week and matches');
  }

  return await response.json();
}

export async function updateWeekAndMatches(
  futId: string,
  weekId: string,
  data: CreateWeekAndMatchesRequest,
): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${API_BASE_URL}/futs/${futId}/week/${weekId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update week and matches');
  }

  return await response.json();
}
