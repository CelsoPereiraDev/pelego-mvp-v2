'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MatchResponse } from '@/types/match';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: MatchResponse;
  matchNumber: number;
  homeTeamNumber: number;
  awayTeamNumber: number;
  homeTeamIcon?: React.ReactNode;
  awayTeamIcon?: React.ReactNode;
  onMatchClick?: (matchId: string) => void;
}

interface AggregatedGoal {
  name: string;
  goals: number;
  isOwnGoal: boolean;
}

export function MatchCard({
  match,
  matchNumber,
  homeTeamNumber,
  awayTeamNumber,
  homeTeamIcon,
  awayTeamIcon,
  onMatchClick,
}: MatchCardProps) {
  const homeGoals = match.result?.homeGoals ?? 0;
  const awayGoals = match.result?.awayGoals ?? 0;

  // Determinar o resultado
  const getMatchResult = () => {
    if (homeGoals > awayGoals) return 'home-win';
    if (awayGoals > homeGoals) return 'away-win';
    return 'draw';
  };

  const result = getMatchResult();

  const getResultBadge = () => {
    switch (result) {
      case 'home-win':
        return 'Vitória Casa';
      case 'away-win':
        return 'Vitória Fora';
      case 'draw':
        return 'Empate';
    }
  };

  const getResultBorderClass = () => {
    switch (result) {
      case 'home-win':
      case 'away-win':
        return 'border-success/40';
      case 'draw':
        return 'border-warning/40';
    }
  };

  // Agregar gols por jogador
  const aggregatedGoals = match.goals.reduce((acc, goal) => {
    let key = '';
    let name = '';
    let isOwnGoal = false;

    if (goal.player) {
      key = goal.player.id;
      name = goal.player.name;
    } else if (goal.ownGoalPlayer) {
      key = goal.ownGoalPlayer.id + '_og';
      name = goal.ownGoalPlayer.name;
      isOwnGoal = true;
    }

    if (!acc[key]) {
      acc[key] = { name, goals: 0, isOwnGoal };
    }
    acc[key].goals += goal.goals;
    return acc;
  }, {} as Record<string, AggregatedGoal>);

  const goalsList = Object.values(aggregatedGoals);

  return (
    <Card
      className={cn(
        'border-2 transition-base cursor-pointer hover:shadow-soft',
        getResultBorderClass()
      )}
      onClick={() => onMatchClick?.(match.id)}
      role="article"
      aria-label={`Partida ${matchNumber}: Time ${homeTeamNumber} ${homeGoals} x ${awayGoals} Time ${awayTeamNumber}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">
            Partida {matchNumber}
          </CardTitle>
          <Badge variant="stat" size="sm">
            {getResultBadge()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Placar principal */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center flex-1">
            <div className="flex justify-center mb-1" aria-hidden="true">
              {homeTeamIcon}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Time {homeTeamNumber}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{homeGoals}</span>
            <span className="text-lg text-muted-foreground">×</span>
            <span className="text-3xl font-bold text-foreground">{awayGoals}</span>
          </div>

          <div className="text-center flex-1">
            <div className="flex justify-center mb-1" aria-hidden="true">
              {awayTeamIcon}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Time {awayTeamNumber}
            </p>
          </div>
        </div>

        {/* Gols por jogador */}
        {goalsList.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Gols
              </p>
              {goalsList.map((goalData, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">
                    {goalData.name}
                    {goalData.isOwnGoal && (
                      <span className="text-xs text-own-goal-indicator ml-1">(GC)</span>
                    )}
                  </span>
                  <Badge
                    variant={goalData.isOwnGoal ? 'ownGoal' : 'goal'}
                    size="sm"
                  >
                    {goalData.goals}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
