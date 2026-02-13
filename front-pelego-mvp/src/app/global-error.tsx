'use client';

export default function GlobalError({
  error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Erro critico</h2>
            <p className="text-gray-500 max-w-md">
              Ocorreu um erro inesperado na aplicacao. Tente recarregar a pagina.
            </p>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
