import { WeekResponse } from '@/types/weeks';
import { QueryRequest, getAuthHeaders, API_BASE_URL } from '@/utils/QueryRequest';

export async function getWeekById(futId: string, weekId: string) {
  return new QueryRequest<WeekResponse>().get(`futs/${futId}/week/${weekId}`);
}

export async function getWeeks(futId: string) {
  return new QueryRequest<WeekResponse[]>().get(`futs/${futId}/weeks`);
}

export async function getWeeksByDate(futId: string, year: string, month?: string): Promise<WeekResponse[]> {
  const path = month ? `futs/${futId}/weeks/${year}/${month}` : `futs/${futId}/weeks/${year}`;
  return new QueryRequest<WeekResponse[]>().get(path);
}

interface DeleteWeekResponse {
  message: string;
  deletedWeekId: string;
  deletedWeekDate: string;
  championPlayersAffected: number;
  totalPlayersAffected: number;
}

export async function deleteWeek(futId: string, weekId: string): Promise<DeleteWeekResponse> {
  const response = await fetch(`${API_BASE_URL}/futs/${futId}/weeks/${weekId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar semana');
  }

  return await response.json();
}
