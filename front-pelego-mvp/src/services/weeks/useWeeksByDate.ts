import { WeekResponse } from '@/types/weeks';
import useSWR from 'swr';
import { getWeeksByDate } from './resources';

export function useWeeksByDate(year: string, month?: string) {
  const endpoint = month ? `/api/weeks/${year}/${month}` : `/api/weeks/${year}`;
  const { data, error } = useSWR<WeekResponse[]>(endpoint, () => getWeeksByDate(year, month));

  return {
    weeks: data,
    isLoading: !error && !data,
    isError: error,
  };
}
