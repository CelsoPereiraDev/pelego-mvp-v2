'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { QueryRequest } from '@/utils/QueryRequest';
import { MemberData } from '@/types/member';

interface FutData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
}

interface FutContextType {
  futId: string | null;
  futName: string | null;
  userRole: 'admin' | 'user' | 'viewer' | null;
  futs: FutData[];
  loading: boolean;
  error: boolean;
  switchFut: (futId: string) => void;
  createFut: (name: string, description?: string) => Promise<FutData>;
  refreshFuts: () => Promise<void>;
}

const FutContext = createContext<FutContextType | undefined>(undefined);

const STORAGE_KEY = 'pelego_selected_fut_id';

export function FutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [futs, setFuts] = useState<FutData[]>([]);
  const [futId, setFutId] = useState<string | null>(null);
  const [futName, setFutName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'viewer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadFuts = useCallback(async () => {
    if (!user) {
      setFuts([]);
      setFutId(null);
      setFutName(null);
      setUserRole(null);
      setLoading(false);
      setError(false);
      return;
    }

    setError(false);

    try {
      const futsData = await new QueryRequest<FutData[]>().get('futs');
      setFuts(futsData);

      if (futsData.length === 0) {
        setFutId(null);
        setFutName(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Try to restore from localStorage
      const savedFutId = localStorage.getItem(STORAGE_KEY);
      const savedFut = savedFutId ? futsData.find((f) => f.id === savedFutId) : null;

      if (savedFut) {
        setFutId(savedFut.id);
        setFutName(savedFut.name);
      } else {
        // Use primary fut or first available
        try {
          const { primaryFutId } = await new QueryRequest<{ primaryFutId: string | null }>().get(
            'user/primary-fut',
          );
          const primaryFut = primaryFutId ? futsData.find((f) => f.id === primaryFutId) : null;
          const selectedFut = primaryFut || futsData[0];
          setFutId(selectedFut.id);
          setFutName(selectedFut.name);
          localStorage.setItem(STORAGE_KEY, selectedFut.id);
        } catch {
          const selectedFut = futsData[0];
          setFutId(selectedFut.id);
          setFutName(selectedFut.name);
          localStorage.setItem(STORAGE_KEY, selectedFut.id);
        }
      }
    } catch (err) {
      console.error('Error loading futs:', err);
      setFuts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load user role when futId changes
  useEffect(() => {
    if (!futId || !user) {
      setUserRole(null);
      return;
    }

    const loadRole = async () => {
      try {
        const members = await new QueryRequest<MemberData[]>().get(`futs/${futId}/members`);
        const me = members.find((m) => m.userId === user.uid);
        setUserRole(me?.role || null);
      } catch {
        setUserRole(null);
      }
    };

    loadRole();
  }, [futId, user]);

  useEffect(() => {
    loadFuts();
  }, [loadFuts]);

  const switchFut = useCallback(
    (newFutId: string) => {
      const fut = futs.find((f) => f.id === newFutId);
      if (fut) {
        setFutId(fut.id);
        setFutName(fut.name);
        localStorage.setItem(STORAGE_KEY, fut.id);
      }
    },
    [futs],
  );

  const createFutFn = useCallback(
    async (name: string, description?: string): Promise<FutData> => {
      const newFut = await new QueryRequest<FutData, { name: string; description?: string }>().post(
        'futs',
        { name, description },
      );
      await loadFuts();
      switchFut(newFut.id);
      return newFut;
    },
    [loadFuts, switchFut],
  );

  const refreshFuts = useCallback(async () => {
    await loadFuts();
  }, [loadFuts]);

  return (
    <FutContext.Provider
      value={{
        futId,
        futName,
        userRole,
        futs,
        loading,
        error,
        switchFut,
        createFut: createFutFn,
        refreshFuts,
      }}>
      {children}
    </FutContext.Provider>
  );
}

export function useFut() {
  const context = useContext(FutContext);
  if (context === undefined) {
    throw new Error('useFut must be used within a FutProvider');
  }
  return context;
}
