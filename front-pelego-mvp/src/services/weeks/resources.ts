import { WeekResponse } from '@/types/weeks';
import { QueryRequest, getAuthHeaders, API_BASE_URL } from '@/utils/QueryRequest';

export async function getWeekById(weekId: string) {
  return new QueryRequest<WeekResponse>().get(`week/${weekId}`);
}

export async function getWeeks() {
  return new QueryRequest<WeekResponse[]>().get('weeks');
}

export async function getWeeksByDate(year: string, month?: string): Promise<WeekResponse[]> {
  const path = month ? `weeks/${year}/${month}` : `weeks/${year}`;
  return new QueryRequest<WeekResponse[]>().get(path);
}

interface DeleteWeekResponse {
  message: string;
  deletedWeekId: string;
  deletedWeekDate: string;
  championPlayersAffected: number;
  totalPlayersAffected: number;
}

export async function deleteWeek(weekId: string): Promise<DeleteWeekResponse> {
  const response = await fetch(`${API_BASE_URL}/weeks/${weekId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar semana');
  }

  return await response.json();
}
