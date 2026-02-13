'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na aplicacao:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Algo deu errado</h2>
        <p className="text-muted-foreground max-w-md">
          Ocorreu um erro inesperado. Tente novamente ou volte para a pagina inicial.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Voltar ao inicio
        </Button>
      </div>
    </div>
  );
}
