'use client';

import { useState, useMemo } from 'react';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import SelectWithSearch from '@/components/SelectWithSearch';
import { GoalDetailsPanel } from '@/components/GoalDetailsPanel';
import { Trash2, Trophy, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerResponse } from '@/types/player';

interface CreateMatchForm {
  date: string;
  teams: {
    players: string[];
  }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: {
      goalsCount: string;
      whoScores?: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    homeAssists?: {
      assists: number;
      playerId: string;
    }[];
    awayGoals: {
      goalsCount: string;
      whoScores?: {
        goals: number;
        playerId: string;
        ownGoalPlayerId?: string;
      }[];
    };
    awayAssists?: {
      assists: number;
      playerId: string;
    }[];
  }[];
}

interface MatchCardProps {
  matchIndex: number;
  control: Control<CreateMatchForm>;
  setValue: UseFormSetValue<CreateMatchForm>;
  teams: { id: string; label: string; players: PlayerResponse[] }[];
  onRemove: () => void;
  canRemove: boolean;
}

export const MatchCard = ({
  matchIndex,
  control,
  setValue,
  teams,
  onRemove,
  canRemove,
}: MatchCardProps) => {
  const [homeDetailsOpen, setHomeDetailsOpen] = useState(false);
  const [awayDetailsOpen, setAwayDetailsOpen] = useState(false);

  // Watch match data
  const homeTeamId = useWatch({ control, name: `matches.${matchIndex}.homeTeamId` });
  const awayTeamId = useWatch({ control, name: `matches.${matchIndex}.awayTeamId` });
  const homeGoalsCount = useWatch({ control, name: `matches.${matchIndex}.homeGoals.goalsCount` });
  const awayGoalsCount = useWatch({ control, name: `matches.${matchIndex}.awayGoals.goalsCount` });
  const homeGoalScorers = useWatch({ control, name: `matches.${matchIndex}.homeGoals.whoScores` });
  const awayGoalScorers = useWatch({ control, name: `matches.${matchIndex}.awayGoals.whoScores` });

  // Get team players
  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  // Team options (disable already selected team)
  const homeTeamOptions = useMemo(() => {
    return teams.filter((t) => t.id !== awayTeamId).map((t) => ({ label: t.label, value: t.id }));
  }, [teams, awayTeamId]);

  const awayTeamOptions = useMemo(() => {
    return teams.filter((t) => t.id !== homeTeamId).map((t) => ({ label: t.label, value: t.id }));
  }, [teams, homeTeamId]);

  // Score options (0-10)
  const scoreOptions = Array.from({ length: 11 }, (_, i) => ({
    label: i.toString(),
    value: i.toString(),
  }));

  // Match result preview
  const matchResult = useMemo(() => {
    const homeScore = parseInt(homeGoalsCount || '0');
    const awayScore = parseInt(awayGoalsCount || '0');

    if (homeScore === 0 && awayScore === 0) {
      return { type: 'empty', message: 'Configure o placar' };
    }

    if (homeScore > awayScore) {
      return { type: 'home-win', message: 'Vitória Casa', winner: homeTeam?.label };
    }

    if (awayScore > homeScore) {
      return { type: 'away-win', message: 'Vitória Visitante', winner: awayTeam?.label };
    }

    return { type: 'draw', message: 'Empate' };
  }, [homeGoalsCount, awayGoalsCount, homeTeam, awayTeam]);

  // Calculate completion progress
  const completionProgress = useMemo(() => {
    let completed = 0;
    const total = 6; // 2 teams + 2 scores + 2 goal details

    // Teams selected
    if (homeTeamId) completed++;
    if (awayTeamId) completed++;

    // Scores entered
    if (homeGoalsCount && homeGoalsCount !== '0') completed++;
    if (awayGoalsCount && awayGoalsCount !== '0') completed++;

    // Goal details completed
    const homeScore = parseInt(homeGoalsCount || '0');
    const awayScore = parseInt(awayGoalsCount || '0');

    if (homeScore > 0) {
      const homeAllocated = homeGoalScorers?.reduce((sum, s) => sum + (s?.goals || 0), 0) || 0;
      const homeComplete = homeGoalScorers?.every((s) => s?.playerId);
      if (homeAllocated === homeScore && homeComplete) completed++;
    } else if (homeScore === 0) {
      completed++; // No goals = automatically complete
    }

    if (awayScore > 0) {
      const awayAllocated = awayGoalScorers?.reduce((sum, s) => sum + (s?.goals || 0), 0) || 0;
      const awayComplete = awayGoalScorers?.every((s) => s?.playerId);
      if (awayAllocated === awayScore && awayComplete) completed++;
    } else if (awayScore === 0) {
      completed++; // No goals = automatically complete
    }

    return { completed, total, percentage: (completed / total) * 100 };
  }, [homeTeamId, awayTeamId, homeGoalsCount, awayGoalsCount, homeGoalScorers, awayGoalScorers]);

  // Validation: Teams cannot be the same
  const hasSameTeamError = homeTeamId && awayTeamId && homeTeamId === awayTeamId;

  // Auto-expand goal details when score > 0
  const homeScoreNum = parseInt(homeGoalsCount || '0');
  const awayScoreNum = parseInt(awayGoalsCount || '0');

  return (
    <Card className={cn('relative', hasSameTeamError && 'border-destructive')}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Partida {matchIndex + 1}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Result Preview Badge */}
            {matchResult.type === 'home-win' && (
              <Badge variant="goal" className="gap-1">
                <Trophy className="w-3 h-3" />
                {matchResult.message}
              </Badge>
            )}
            {matchResult.type === 'away-win' && (
              <Badge variant="assist" className="gap-1">
                <Trophy className="w-3 h-3" />
                {matchResult.message}
              </Badge>
            )}
            {matchResult.type === 'draw' && homeScoreNum > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Minus className="w-3 h-3" />
                {matchResult.message}
              </Badge>
            )}

            {/* Delete Button */}
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>
              {completionProgress.completed}/{completionProgress.total}
            </span>
          </div>
          <Progress value={completionProgress.percentage} className="h-1.5" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`match-${matchIndex}-home-team`}>Time Casa</Label>
            <Controller
              control={control}
              name={`matches.${matchIndex}.homeTeamId`}
              render={({ field }) => (
                <SelectWithSearch
                  id={`match-${matchIndex}-home-team`}
                  options={homeTeamOptions}
                  value={homeTeamOptions.find((opt) => opt.value === field.value) || null}
                  onChange={(opt: { value: string } | null) => field.onChange(opt?.value || '')}
                  placeholder="Selecionar time..."
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`match-${matchIndex}-away-team`}>Time Visitante</Label>
            <Controller
              control={control}
              name={`matches.${matchIndex}.awayTeamId`}
              render={({ field }) => (
                <SelectWithSearch
                  id={`match-${matchIndex}-away-team`}
                  options={awayTeamOptions}
                  value={awayTeamOptions.find((opt) => opt.value === field.value) || null}
                  onChange={(opt: { value: string } | null) => field.onChange(opt?.value || '')}
                  placeholder="Selecionar time..."
                />
              )}
            />
          </div>
        </div>

        {/* Same Team Error */}
        {hasSameTeamError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>Um time não pode jogar contra si mesmo</span>
          </div>
        )}

        {/* Score Input */}
        {homeTeamId && awayTeamId && !hasSameTeamError && (
          <>
            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`match-${matchIndex}-home-score`}>
                  Gols {homeTeam?.label || 'Casa'}
                </Label>
                <Controller
                  control={control}
                  name={`matches.${matchIndex}.homeGoals.goalsCount`}
                  render={({ field }) => (
                    <SelectWithSearch
                      id={`match-${matchIndex}-home-score`}
                      options={scoreOptions}
                      value={scoreOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(opt: { value: string } | null) => {
                        field.onChange(opt?.value || '0');
                        // Auto-open details panel when score > 0
                        if (opt && parseInt(opt.value) > 0) {
                          setHomeDetailsOpen(true);
                        }
                      }}
                      placeholder="0"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`match-${matchIndex}-away-score`}>
                  Gols {awayTeam?.label || 'Visitante'}
                </Label>
                <Controller
                  control={control}
                  name={`matches.${matchIndex}.awayGoals.goalsCount`}
                  render={({ field }) => (
                    <SelectWithSearch
                      id={`match-${matchIndex}-away-score`}
                      options={scoreOptions}
                      value={scoreOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(opt: { value: string } | null) => {
                        field.onChange(opt?.value || '0');
                        // Auto-open details panel when score > 0
                        if (opt && parseInt(opt.value) > 0) {
                          setAwayDetailsOpen(true);
                        }
                      }}
                      placeholder="0"
                    />
                  )}
                />
              </div>
            </div>

            {/* Goal Details Panels */}
            {homeScoreNum > 0 && homeTeam && awayTeam && (
              <>
                <Separator />
                <GoalDetailsPanel
                  matchIndex={matchIndex}
                  side="home"
                  control={control}
                  setValue={setValue}
                  teamPlayers={homeTeam.players}
                  opposingTeamPlayers={awayTeam.players}
                  isOpen={homeDetailsOpen}
                  onOpenChange={setHomeDetailsOpen}
                />
              </>
            )}

            {awayScoreNum > 0 && awayTeam && homeTeam && (
              <>
                <Separator />
                <GoalDetailsPanel
                  matchIndex={matchIndex}
                  side="away"
                  control={control}
                  setValue={setValue}
                  teamPlayers={awayTeam.players}
                  opposingTeamPlayers={homeTeam.players}
                  isOpen={awayDetailsOpen}
                  onOpenChange={setAwayDetailsOpen}
                />
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
