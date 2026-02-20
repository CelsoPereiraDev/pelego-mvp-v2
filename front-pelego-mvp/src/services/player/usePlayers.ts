'use client';

import { CreatePlayerDataRequested, Player } from '@/types/player';
import { useFut } from '@/contexts/FutContext';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { firestorePlayerToResponse } from '@/services/firestore/converters';
import { createPlayer } from './resources';

export function usePlayers() {
  const { futId } = useFut();
  const collectionPath = futId ? `futs/${futId}/players` : null;

  const { data, loading, error } = useFirestoreCollection<Player>(
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
