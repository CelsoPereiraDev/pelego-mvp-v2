'use client';

import { Button } from '@/components/ui/button';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useRouter } from 'next/navigation';

interface WeekHeaderProps {
  date: string;
  weekId: string;
}

export function WeekHeader({ date, weekId }: WeekHeaderProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/week/${weekId}/edit`);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Semana</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Data: {date}
        </h1>
      </div>
      <Button
        variant="outline"
        onClick={handleEdit}
        className="gap-2"
        aria-label="Editar detalhes da semana"
      >
        <EditOutlinedIcon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Editar Semana</span>
      </Button>
    </div>
  );
}
