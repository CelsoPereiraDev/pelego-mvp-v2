'use client';

import { WeekResponse } from '@/types/weeks';
import { Player, PlayerResponse } from '@/types/player';
import { useFut } from '@/contexts/FutContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot, DocumentData } from 'firebase/firestore';
import { buildWeekResponse, firestorePlayerToResponse } from '@/services/firestore/converters';
import { deleteWeek } from './resources';

interface SubcollectionDoc {
  id: string;
  data: DocumentData;
}

export function useWeek(weekId: string, externalPlayersMap?: Map<string, PlayerResponse>) {
  const { futId } = useFut();

  const [week, setWeek] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!futId || !weekId) {
      setWeek(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const basePath = `futs/${futId}/weeks/${weekId}`;
    const playersPath = `futs/${futId}/players`;

    // State for each listener
    let weekData: DocumentData | null = null;
    let teamsData: SubcollectionDoc[] = [];
    let matchesData: SubcollectionDoc[] = [];
    let playersMap: Map<string, PlayerResponse> = externalPlayersMap ?? new Map<string, Player>();
    let weekReady = false;
    let teamsReady = false;
    let matchesReady = false;
    let playersReady = externalPlayersMap !== undefined; // skip wait if map provided externally

    function tryBuild() {
      if (!weekReady || !teamsReady || !matchesReady || !playersReady) return;
      if (!weekData) {
        setWeek(null);
        setLoading(false);
        return;
      }

      try {
        const built = buildWeekResponse(weekId, weekData, teamsData, matchesData, playersMap);
        setWeek(built);
        setError(null);
      } catch (err) {
        console.error('Error building week response:', err);
        setError(err instanceof Error ? err : new Error('Failed to build week'));
      }
      setLoading(false);
    }

    // 1. Listen to week document
    const unsubWeek = onSnapshot(
      doc(db, basePath),
      (snapshot) => {
        weekData = snapshot.exists() ? snapshot.data() : null;
        weekReady = true;
        tryBuild();
      },
      (err) => {
        console.error(`Firestore week listener error:`, err);
        setError(err);
        setLoading(false);
      },
    );

    // 2. Listen to teams subcollection
    const unsubTeams = onSnapshot(
      collection(db, `${basePath}/teams`),
      (snapshot) => {
        teamsData = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
        teamsReady = true;
        tryBuild();
      },
      (err) => {
        console.error(`Firestore teams listener error:`, err);
        setError(err);
        setLoading(false);
      },
    );

    // 3. Listen to matches subcollection
    const unsubMatches = onSnapshot(
      collection(db, `${basePath}/matches`),
      (snapshot) => {
        matchesData = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
        matchesReady = true;
        tryBuild();
      },
      (err) => {
        console.error(`Firestore matches listener error:`, err);
        setError(err);
        setLoading(false);
      },
    );

    // 4. Listen to players collection only when no external map was provided
    let unsubPlayers: (() => void) | undefined;
    if (!externalPlayersMap) {
      unsubPlayers = onSnapshot(
        collection(db, playersPath),
        (snapshot) => {
          const map = new Map<string, Player>();
          for (const d of snapshot.docs) {
            map.set(d.id, firestorePlayerToResponse(d.data(), d.id));
          }
          playersMap = map;
          playersReady = true;
          tryBuild();
        },
        (err) => {
          console.error(`Firestore players listener error:`, err);
          setError(err);
          setLoading(false);
        },
      );
    }

    return () => {
      unsubWeek();
      unsubTeams();
      unsubMatches();
      unsubPlayers?.();
    };
  }, [futId, weekId, externalPlayersMap]);

  const del = async () => {
    if (!futId) throw new Error('No fut selected');
    return deleteWeek(futId, weekId);
    // No mutate needed — listeners auto-update or component unmounts
  };

  return {
    week,
    isError: error,
    isLoading: loading,
    delete: del,
  };
}
