'use client';

import { cn } from '@/lib/utils';

interface TeamScoreDisplayProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isVisible: boolean;
}

export const TeamScoreDisplay: React.FC<TeamScoreDisplayProps> = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  isVisible,
}) => {
  if (!isVisible) return null;

  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted/50 rounded-lg animate-in fade-in-50 duration-300">
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          homeWinning && 'text-primary font-semibold'
        )}
      >
        {homeTeamName}
      </span>
      <div className="flex items-center gap-2 text-lg font-bold">
        <span
          className={cn(
            'min-w-[2ch] text-center',
            homeWinning && 'text-primary'
          )}
        >
          {homeScore}
        </span>
        <span className="text-muted-foreground">x</span>
        <span
          className={cn(
            'min-w-[2ch] text-center',
            awayWinning && 'text-primary'
          )}
        >
          {awayScore}
        </span>
      </div>
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          awayWinning && 'text-primary font-semibold'
        )}
      >
        {awayTeamName}
      </span>
    </div>
  );
};
