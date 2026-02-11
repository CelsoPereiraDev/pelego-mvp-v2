'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  orderBy,
  where,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface FirestoreCollectionOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  whereConstraints?: Array<{ field: string; op: '<' | '<=' | '==' | '>=' | '>' | '!=' | 'array-contains'; value: any }>;
}

export interface FirestoreCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestoreCollection<T = DocumentData>(
  collectionPath: string | null,
  converter: (doc: DocumentData, id: string) => T,
  options?: FirestoreCollectionOptions,
): FirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionPath) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const constraints: QueryConstraint[] = [];

    if (options?.whereConstraints) {
      for (const wc of options.whereConstraints) {
        constraints.push(where(wc.field, wc.op, wc.value));
      }
    }

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    const q = query(collection(db, collectionPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map(doc => converter(doc.data(), doc.id));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore listener error on ${collectionPath}:`, err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionPath, options?.orderByField, options?.orderDirection, JSON.stringify(options?.whereConstraints)]);

  return { data, loading, error };
}
