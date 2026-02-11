import { getAuthHeaders, API_BASE_URL } from '@/utils/QueryRequest';

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
