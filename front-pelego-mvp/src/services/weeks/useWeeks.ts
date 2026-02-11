'use client';

import { WeekResponse } from '@/types/weeks';
import { useFut } from '@/contexts/FutContext';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { DocumentData } from 'firebase/firestore';

function firestoreWeekToListResponse(data: DocumentData, id: string): WeekResponse {
  const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
  return {
    id,
    date,
    teams: [], // Teams loaded separately by useWeek for detail view
  };
}

export function useWeeks() {
  const { futId } = useFut();
  const collectionPath = futId ? `futs/${futId}/weeks` : null;

  const { data, loading, error } = useFirestoreCollection<WeekResponse>(
    collectionPath,
    firestoreWeekToListResponse,
    { orderByField: 'date', orderDirection: 'desc' },
  );

  return {
    weeks: data,
    error,
    isLoading: loading,
  };
}
