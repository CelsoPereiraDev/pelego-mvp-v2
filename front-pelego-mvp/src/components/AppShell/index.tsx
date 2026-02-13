'use client';

import { useAuth } from '@/contexts/AuthContext';
import { FutProvider, useFut } from '@/contexts/FutContext';
import MainMenu from '@/components/MainMenu';
import LandingPage from '@/app/landing/page';
import FutOnboarding from '@/components/FutOnboarding';
import { usePathname } from 'next/navigation';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { futId, loading: futLoading, futs, error: futError, refreshFuts } = useFut();
  const { signOut } = useAuth();
  const pathname = usePathname();

  // Invite pages bypass sidebar and FutOnboarding
  if (pathname.startsWith('/invite/')) {
    return <>{children}</>;
  }

  if (futLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (futError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md mx-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Não foi possível conectar ao servidor</h1>
          <p className="text-muted-foreground mb-6">
            Verifique se o backend está rodando e tente novamente.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={refreshFuts}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={signOut}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (futs.length === 0 || !futId) {
    return <FutOnboarding />;
  }

  return (
    <div className="flex min-h-screen">
      <MainMenu />
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <FutProvider>
      <AppShellInner>{children}</AppShellInner>
    </FutProvider>
  );
}
