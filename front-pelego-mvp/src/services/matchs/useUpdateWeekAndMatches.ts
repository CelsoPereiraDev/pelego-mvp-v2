import { CreateWeekAndMatchesRequest } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import { useState } from 'react';
import { updateWeekAndMatches } from './resources';

export function useUpdateWeekAndMatches() {
  const { futId } = useFut();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWeekWithMatches = async (weekId: string, data: CreateWeekAndMatchesRequest) => {
    if (!futId) throw new Error('No fut selected');
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateWeekAndMatches(futId, weekId, data);
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
