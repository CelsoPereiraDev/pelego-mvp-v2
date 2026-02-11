'use client';

import { db } from '@/lib/firebase';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface FirestoreDocumentResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFirestoreDocument<T = DocumentData>(
  docPath: string | null,
  converter: (data: DocumentData, id: string) => T,
): FirestoreDocumentResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docPath) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const docRef = doc(db, docPath);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(converter(snapshot.data(), snapshot.id));
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore listener error on ${docPath}:`, err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [docPath]);

  return { data, loading, error };
}
