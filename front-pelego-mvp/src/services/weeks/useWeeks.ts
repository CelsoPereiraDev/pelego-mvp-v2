
import { WeekResponse } from '@/types/weeks';
import useSWR from 'swr';
import { getWeeks } from './resources';

export function useWeeks() {
  const { data, error, mutate } = useSWR<WeekResponse[]>('/api/weeks', getWeeks, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    weeks: data,
    mutate,
    error,
    isLoading: !error && !data,
  };
}
