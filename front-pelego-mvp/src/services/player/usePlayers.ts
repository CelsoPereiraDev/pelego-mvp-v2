'use client';

import { CreatePlayerDataRequested, PlayerResponse } from '@/types/player';
import { useFut } from '@/contexts/FutContext';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { firestorePlayerToResponse } from '@/services/firestore/converters';
import { createPlayer } from './resources';

export function usePlayers() {
  const { futId } = useFut();
  const collectionPath = futId ? `futs/${futId}/players` : null;

  const { data, loading, error } = useFirestoreCollection<PlayerResponse>(
    collectionPath,
    firestorePlayerToResponse,
  );

  const create = async (playerData: CreatePlayerDataRequested) => {
    if (!futId) throw new Error('No fut selected');
    await createPlayer(futId, playerData);
    // No mutate needed — Firestore listener auto-updates
  };

  return {
    players: data,
    create,
    isLoading: loading,
    error,
  };
}
