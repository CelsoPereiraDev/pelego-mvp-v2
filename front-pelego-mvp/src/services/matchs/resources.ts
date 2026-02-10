import { CreateMatchDataRequested, CreateWeekAndMatchesRequest, CreateWeekAndMatchesResponse, GoalDetails, MatchResponse } from '@/types/match';
import { QueryRequest } from '@/utils/QueryRequest';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334/api';
const CLIENT_ID = 'your-client-id';

export async function createMatch(matchData: CreateMatchDataRequested) {
  const queryRequest = new QueryRequest<MatchResponse, CreateMatchDataRequested>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.post('create_matches', matchData);
}

export async function createMatches(matchesData: { matches: CreateMatchDataRequested[] }) {
  const queryRequest = new QueryRequest<{ message: string; createdMatches: MatchResponse[] }, { matches: CreateMatchDataRequested[] }>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.post('create_matches', matchesData);
}

export async function createGoals(goals: GoalDetails[]) {
  const queryRequest = new QueryRequest<GoalDetails[], GoalDetails[]>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.post('create_goals', goals);
}

export async function getMatchById(matchId: string) {
  const queryRequest = new QueryRequest<MatchResponse>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.getById(matchId, 'get_match');
}

export async function getMatches() {
  const queryRequest = new QueryRequest<Array<MatchResponse>>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.get('get_matches');
}

export async function deleteMatch(matchId: string) {
  const queryRequest = new QueryRequest<{ message: string }>(BASE_URL, CLIENT_ID);
  queryRequest.addDefaultHeaders();
  return queryRequest.delete(`delete_match/${matchId}`);
}

export async function createWeekWithTeams(date: string, teams: string[][]) {
  const response = await fetch(`${BASE_URL}/create_week_with_teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, teams }),
  });

  if (!response.ok) {
    throw new Error('Failed to create week and teams');
  }

  return await response.json();
}

export async function createWeekAndMatches(data: CreateWeekAndMatchesRequest): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${BASE_URL}/create_week_and_matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create week and matches');
  }

  return await response.json();
}

export async function updateWeekAndMatches(weekId: string, data: CreateWeekAndMatchesRequest): Promise<CreateWeekAndMatchesResponse> {
  const response = await fetch(`${BASE_URL}/week/${weekId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update week and matches');
  }

  return await response.json();
}
