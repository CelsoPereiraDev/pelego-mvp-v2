'use client';

import { useEffect, useState } from 'react';
import { useFut } from '@/contexts/FutContext';
import { PlayerOverviewResponse } from '@/types/player';
import { getPlayerOverview } from './resources';

export function usePlayerOverview(playerId: string, year?: string) {
  const { futId } = useFut();
  const [overview, setOverview] = useState<PlayerOverviewResponse | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!futId || !playerId) {
      setOverview(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getPlayerOverview(futId, playerId, year)
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro ao buscar overview'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [futId, playerId, year]);

  return { overview, isLoading: loading, error };
}
