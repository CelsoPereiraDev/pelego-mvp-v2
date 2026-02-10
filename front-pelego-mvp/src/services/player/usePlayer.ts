import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import useSWR, { useSWRConfig } from 'swr';
import { deletePlayer, editPlayer, getPlayer } from './resources';

export function usePlayer(playerId: string, initialData?: PlayerResponse) {
  const { data, error, isLoading } = useSWR(playerId ? `/api/get_player/${playerId}` : null, () => getPlayer(playerId), {
    fallbackData: initialData,
  });

  const { mutate } = useSWRConfig();

  const methodsHandler = {
    delete: async function _delete() {
      await deletePlayer(playerId);
      mutate(`/api/get_players`);
    },
    edit: async function _edit(playerData: CreatePlayerDataRequested) {
      const updatedPlayer = await editPlayer(playerId, playerData);
      mutate(`/api/get_player/${playerId}`, updatedPlayer, false);
      return updatedPlayer;
    },
  };

  return {
    player: data,
    delete: methodsHandler.delete,
    edit: methodsHandler.edit,
    isLoading,
    isError: error,
  };
}
