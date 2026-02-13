import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-bold">Pagina nao encontrada</h2>
        <p className="text-muted-foreground max-w-md">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>
      </div>
      <Link href="/">
        <Button>Voltar ao inicio</Button>
      </Link>
    </div>
  );
}
