'use client';

import { WeekResponse } from '@/types/weeks';
import { PlayerResponse } from '@/types/player';
import { useFut } from '@/contexts/FutContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { buildWeekResponse, firestorePlayerToResponse } from '@/services/firestore/converters';

export function useWeeksByDate(year: string, month?: string) {
  const { futId } = useFut();
  const [weeks, setWeeks] = useState<WeekResponse[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!futId || !year) {
      setWeeks(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchWeeks() {
      setLoading(true);
      try {
        const yearNum = parseInt(year, 10);
        const monthNum = month ? parseInt(month, 10) : undefined;

        // Build date range
        let startDate: Date;
        let endDate: Date;

        if (monthNum) {
          startDate = new Date(yearNum, monthNum - 1, 1);
          endDate = new Date(yearNum, monthNum, 1); // First day of next month
        } else {
          startDate = new Date(yearNum, 0, 1);
          endDate = new Date(yearNum + 1, 0, 1);
        }

        const weeksPath = `futs/${futId}/weeks`;
        const playersPath = `futs/${futId}/players`;

        // Query weeks by date range
        const weeksQuery = query(
          collection(db, weeksPath),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc'),
        );

        const [weeksSnapshot, playersSnapshot] = await Promise.all([
          getDocs(weeksQuery),
          getDocs(collection(db, playersPath)),
        ]);

        if (cancelled) return;

        // Build players map
        const playersMap = new Map<string, PlayerResponse>();
        for (const pDoc of playersSnapshot.docs) {
          playersMap.set(pDoc.id, firestorePlayerToResponse(pDoc.data(), pDoc.id));
        }

        // For each week, fetch teams and matches subcollections
        const weekResults: WeekResponse[] = await Promise.all(
          weeksSnapshot.docs.map(async (weekDoc) => {
            const weekId = weekDoc.id;
            const weekData = weekDoc.data();

            const [teamsSnapshot, matchesSnapshot] = await Promise.all([
              getDocs(collection(db, `${weeksPath}/${weekId}/teams`)),
              getDocs(collection(db, `${weeksPath}/${weekId}/matches`)),
            ]);

            const teamsData: Array<{ id: string; data: DocumentData }> = teamsSnapshot.docs.map(d => ({
              id: d.id,
              data: d.data(),
            }));

            const matchesData: Array<{ id: string; data: DocumentData }> = matchesSnapshot.docs.map(d => ({
              id: d.id,
              data: d.data(),
            }));

            return buildWeekResponse(weekId, weekData, teamsData, matchesData, playersMap);
          }),
        );

        if (cancelled) return;

        setWeeks(weekResults);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching weeks by date:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch weeks'));
      }
      setLoading(false);
    }

    fetchWeeks();

    return () => {
      cancelled = true;
    };
  }, [futId, year, month]);

  return {
    weeks,
    isLoading: loading,
    isError: error,
  };
}
