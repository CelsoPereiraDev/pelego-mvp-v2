import { CreateWeekAndMatchesRequest } from '@/types/match';
import { useState } from 'react';
import { updateWeekAndMatches } from './resources';

export function useUpdateWeekAndMatches() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWeekWithMatches = async (weekId: string, data: CreateWeekAndMatchesRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateWeekAndMatches(weekId, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar semana e partidas';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateWeekWithMatches,
    isLoading,
    error,
  };
}
