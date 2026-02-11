import { CreateWeekAndMatchesRequest } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import { useState } from 'react';
import { createWeekAndMatches } from './resources';

export function useCreateWeekAndMatches() {
  const { futId } = useFut();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWeekWithMatches = async (data: CreateWeekAndMatchesRequest) => {
    if (!futId) throw new Error('No fut selected');
    setIsLoading(true);
    setError(null);

    try {
      const result = await createWeekAndMatches(futId, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar semana e partidas';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWeekWithMatches,
    isLoading,
    error,
  };
}
