import { CreateMatchDataRequested } from '@/types/match';
import useSWR from 'swr';
import { createMatches } from './resources';

export function useCreateMatches() {
  const { data, error, mutate } = useSWR('/api/matches', () => null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const createNewMatches = async (matchesData: { matches: CreateMatchDataRequested[] }) => {
    const createdMatches = await createMatches(matchesData);
    mutate();
    return createdMatches;
  };

  return {
    createNewMatches,
    data,
    error,
    isLoading: !error && !data,
  };
}
