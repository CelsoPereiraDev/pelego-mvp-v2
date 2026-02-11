
import { TeamResponse } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import useSWR from 'swr';
import { getTeams, updateTeams } from './resources';

export function useTeams() {
  const { futId } = useFut();
  const cacheKey = futId ? `/api/futs/${futId}/teams` : null;

  const { data, error, mutate } = useSWR(cacheKey, () => getTeams(futId!));

  const update = async (teams: TeamResponse[]) => {
    if (!futId) throw new Error('No fut selected');
    await updateTeams(futId, teams);
    mutate();
  };

  return {
    teams: data,
    isLoading: !error && !data,
    isError: error,
    update,
  };
}
