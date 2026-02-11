import { CreateMatchDataRequested, CreateWeekAndMatchesRequest, CreateWeekAndMatchesResponse, GoalDetails, MatchResponse } from '@/types/match';
import { QueryRequest, getAuthHeaders, API_BASE_URL } from '@/utils/QueryRequest';

export async function createMatch(matchData: CreateMatchDataRequested) {
  return new QueryRequest<MatchResponse, CreateMatchDataRequested>().post('create_matches', matchData);
}

export async function createMatches(matchesData: { matches: CreateMatchDataRequested[] }) {
  return new QueryRequest<{ message: string; createdMatches: MatchResponse[] }, { matches: CreateMatchDataRequested[] }>().post('create_matches', matchesData);
}

export async function createGoals(goals: GoalDetails[]) {
  return new QueryRequest<GoalDetails[], GoalDetails[]>().post('create_goals', goals);
}

export async function getMatchById(matchId: string) {
  return new QueryRequest<MatchResponse>().getById(matchId, 'get_match');
}

export async function getMatches() {
  return new QueryRequest<Array<MatchResponse>>().get('get_matches');
}

export async function deleteMatch(matchId: string) {
  return new QueryRequest<{ message: string }>().delete(`delete_match/${matchId}`);
}

export async function createWeekWithTeams(date: string, teams: string[][]) {
  return new QueryRequest<unknown, { date: string; teams: string[][] }>().post('create_week_with_teams', { date, teams });
}

export async function createWeekAndMatches(data: CreateWeekAndMatchesRequest): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${API_BASE_URL}/create_week_and_matches`, {
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

export async function updateWeekAndMatches(weekId: string, data: CreateWeekAndMatchesRequest): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${API_BASE_URL}/week/${weekId}`, {
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
