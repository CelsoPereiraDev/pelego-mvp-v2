'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useFut } from '@/contexts/FutContext';

interface StreakEntry {
  playerId: string;
  streakCount: number;
}

interface FutStreaksDocument {
  weekChampion?: StreakEntry[];
  weekStriker?: StreakEntry[];
  weekTopAssist?: StreakEntry[];
  monthChampion?: StreakEntry | null;
  monthStriker?: StreakEntry | null;
  monthTopAssist?: StreakEntry | null;
}

interface PlayerStreakResult {
  championStreak: number;
  strikerStreak: number;
  assistStreak: number;
  monthChampionStreak: number;
  monthStrikerStreak: number;
  monthAssistStreak: number;
  loading: boolean;
}

const DEFAULT: PlayerStreakResult = {
  championStreak: 0,
  strikerStreak: 0,
  assistStreak: 0,
  monthChampionStreak: 0,
  monthStrikerStreak: 0,
  monthAssistStreak: 0,
  loading: true,
};

function findStreak(arr: StreakEntry[] | undefined, playerId: string): number {
  return arr?.find((e) => e.playerId === playerId)?.streakCount ?? 0;
}

function parseStreaks(data: DocumentData, playerId: string): PlayerStreakResult {
  const doc = data as FutStreaksDocument;
  return {
    championStreak: findStreak(doc.weekChampion, playerId),
    strikerStreak: findStreak(doc.weekStriker, playerId),
    assistStreak: findStreak(doc.weekTopAssist, playerId),
    monthChampionStreak:
      doc.monthChampion?.playerId === playerId ? (doc.monthChampion?.streakCount ?? 0) : 0,
    monthStrikerStreak:
      doc.monthStriker?.playerId === playerId ? (doc.monthStriker?.streakCount ?? 0) : 0,
    monthAssistStreak:
      doc.monthTopAssist?.playerId === playerId ? (doc.monthTopAssist?.streakCount ?? 0) : 0,
    loading: false,
  };
}

export function usePlayerStreak(playerId: string | null): PlayerStreakResult {
  const { futId } = useFut();
  const [result, setResult] = useState<PlayerStreakResult>(DEFAULT);

  useEffect(() => {
    if (!futId || !playerId) {
      setResult({ ...DEFAULT, loading: false });
      return;
    }

    setResult(DEFAULT);

    const docRef = doc(db, `futs/${futId}/streaks/current`);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setResult(parseStreaks(snapshot.data(), playerId));
        } else {
          setResult({ ...DEFAULT, loading: false });
        }
      },
      (err) => {
        console.error('Firestore streak listener error:', err);
        setResult({ ...DEFAULT, loading: false });
      },
    );

    return () => unsubscribe();
  }, [futId, playerId]);

  return result;
}
