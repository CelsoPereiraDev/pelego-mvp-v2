'use client';

import { CreatePlayerDataRequested, Player } from '@/types/player';
import { useFut } from '@/contexts/FutContext';
import { useFirestoreDocument } from '@/hooks/useFirestoreDocument';
import { firestorePlayerToResponse } from '@/services/firestore/converters';
import { deletePlayer, editPlayer } from './resources';

export function usePlayer(playerId: string) {
  const { futId } = useFut();
  const docPath = futId && playerId ? `futs/${futId}/players/${playerId}` : null;

  const { data, loading, error } = useFirestoreDocument<Player>(
    docPath,
    firestorePlayerToResponse,
  );

  const del = async () => {
    if (!futId) throw new Error('No fut selected');
    await deletePlayer(futId, playerId);
    // No mutate needed — Firestore listener auto-updates
  };

  const edit = async (playerData: CreatePlayerDataRequested) => {
    if (!futId) throw new Error('No fut selected');
    const updatedPlayer = await editPlayer(futId, playerId, playerData);
    return updatedPlayer;
  };

  return {
    player: data,
    delete: del,
    edit,
    isLoading: loading,
    isError: error,
  };
}
