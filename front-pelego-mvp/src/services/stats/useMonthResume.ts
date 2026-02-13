'use client';

import { MonthResumeProps } from '@/types/stats';
import { useFut } from '@/contexts/FutContext';
import { useEffect, useState } from 'react';
import { getMonthResume } from './resources';

export function useMonthResume(year: string, month?: string, excludePlayerIds: string[] = []) {
  const { futId } = useFut();
  const [monthResume, setMonthResume] = useState<MonthResumeProps | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!futId || !year) {
      setMonthResume(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMonthResume(futId, year, month, excludePlayerIds)
      .then((data) => {
        if (!cancelled) {
          setMonthResume(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch month resume'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [futId, year, month, excludePlayerIds.join(',')]);

  return {
    monthResume,
    isLoading: loading,
    error,
  };
}
