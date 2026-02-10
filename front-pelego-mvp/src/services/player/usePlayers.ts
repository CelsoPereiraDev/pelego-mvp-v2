import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import useSWR, { useSWRConfig } from 'swr';
import { createPlayer, getPlayers } from './resources';

export function usePlayers(initialData?: Array<PlayerResponse>) {
  const { data, error, isLoading } = useSWR('/api/get_players', getPlayers, {
    fallbackData: initialData,
  });

  const { mutate } = useSWRConfig();

  const methodsHandler = {
    create: async function _create(playerData: CreatePlayerDataRequested) {
      await createPlayer(playerData);
      mutate('/api/get_players');
    },
  };

  return {
    players: data,
    create: methodsHandler.create,
    isLoading,
    error,
  };
}
