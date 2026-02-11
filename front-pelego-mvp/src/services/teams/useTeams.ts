'use client';

import { TeamResponse } from '@/types/match';
import { useFut } from '@/contexts/FutContext';
import { updateTeams } from './resources';

export function useTeams() {
  const { futId } = useFut();

  const update = async (teams: TeamResponse[]) => {
    if (!futId) throw new Error('No fut selected');
    await updateTeams(futId, teams);
  };

  return { update };
}
