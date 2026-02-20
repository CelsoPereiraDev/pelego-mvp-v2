'use client';

import React, { useRef } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { useWeek } from '@/services/weeks/useWeek';
import { usePlayerStreak } from '@/hooks/usePlayerStreak';
import { useMyWeekStats } from '@/hooks/useMyWeekStats';
import { MyWeekCard } from '@/components/week/MyWeekCard';
import { ShareButton } from '@/components/ShareButton';

export default function MyWeekPreviewPage() {
  const { weekId, playerId } = useParams<{ weekId: string; playerId: string }>();
  const cardRef = useRef<HTMLDivElement>(null);

  const { week, isLoading } = useWeek(weekId);
  const streak = usePlayerStreak(playerId);
  const stats = useMyWeekStats(week, playerId);

  const weekDate = week?.date ? format(new Date(week.date), 'dd/MM/yy') : '—';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats.hasData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Você não participou desta semana.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 px-4 py-10">
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
      />
    </div>
  );
}
