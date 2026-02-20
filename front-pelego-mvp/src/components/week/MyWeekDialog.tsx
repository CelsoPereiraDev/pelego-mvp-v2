'use client';

import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShareButton } from '@/components/ShareButton';
import { MyWeekCard } from '@/components/week/MyWeekCard';
import { useMyWeekStats } from '@/hooks/useMyWeekStats';
import { usePlayerStreak } from '@/hooks/usePlayerStreak';
import { WeekResponse } from '@/types/weeks';

interface MyWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: WeekResponse | null;
  weekDate: string;
  myPlayerId: string | null;
  weekId: string;
}

export function MyWeekDialog({
  open,
  onOpenChange,
  week,
  weekDate,
  myPlayerId,
  weekId,
}: MyWeekDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const stats = useMyWeekStats(week, myPlayerId);
  const streak = usePlayerStreak(myPlayerId);

  const renderContent = () => {
    if (!myPlayerId) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <span className="text-3xl">🔗</span>
          <p className="text-sm text-muted-foreground max-w-[260px]">
            Vincule seu perfil em{' '}
            <span className="font-semibold text-foreground">Configurações do Fut</span> para ver
            sua semana.
          </p>
        </div>
      );
    }

    if (!stats.hasData) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <span className="text-3xl">👀</span>
          <p className="text-sm text-muted-foreground">Você não participou desta semana.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <MyWeekCard
          ref={cardRef}
          stats={stats}
          weekDate={weekDate}
          strikerStreak={streak.strikerStreak}
          assistStreak={streak.assistStreak}
          championStreak={streak.championStreak}
        />
        <ShareButton
          targetRef={cardRef}
          title={`Minha Semana — ${stats.myPlayer?.name ?? 'Pelego MVP'}`}
          text={`Confira meu desempenho na semana de ${weekDate} no Pelego MVP!`}
          previewUrl={`/week/${weekId}/my-week/${myPlayerId}`}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Minha Semana</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
