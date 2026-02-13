'use client';

import { useState, useMemo, useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PlayerSelect } from '@/components/PlayerSelect';
import { TeamScoreDisplay } from '@/components/TeamScoreDisplay';
import { GoalDetailsPanelV2 } from '@/components/GoalDetailsPanel/GoalDetailsPanelV2';
import { Trash2, Trophy, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchCardProps } from './MatchCard.types';
import { SelectOption } from '@/types/components';

export const MatchCardV2: React.FC<MatchCardProps> = ({
  matchIndex,
  control,
  setValue,
  teams,
  onRemove,
  canRemove,
}) => {
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

  // Clean goal/assist data when teams change
  useEffect(() => {
    const homeTeamPlayers = homeTeam?.players.map((p) => p.id) || [];
    const awayTeamPlayers = awayTeam?.players.map((p) => p.id) || [];

    // Check and clean home goal scorers
    if (homeGoalScorers && homeGoalScorers.length > 0) {
      let needsCleanup = false;
      const cleanedScorers = homeGoalScorers.map((scorer) => {
        if (!scorer?.playerId) return scorer;

        // Check if scorer is still in the team
        if (scorer.playerId !== 'GC' && !homeTeamPlayers.includes(scorer.playerId)) {
          needsCleanup = true;
          return { ...scorer, playerId: '', goals: 0 };
        }

        // Check if own goal player is still in opposing team
        if (
          scorer.playerId === 'GC' &&
          scorer.ownGoalPlayerId &&
          !awayTeamPlayers.includes(scorer.ownGoalPlayerId)
        ) {
          needsCleanup = true;
          return { ...scorer, ownGoalPlayerId: '' };
        }

        return scorer;
      });

      if (needsCleanup) {
        setValue(`matches.${matchIndex}.homeGoals.whoScores`, cleanedScorers);
      }
    }

    // Check and clean away goal scorers
    if (awayGoalScorers && awayGoalScorers.length > 0) {
      let needsCleanup = false;
      const cleanedScorers = awayGoalScorers.map((scorer) => {
        if (!scorer?.playerId) return scorer;

        // Check if scorer is still in the team
        if (scorer.playerId !== 'GC' && !awayTeamPlayers.includes(scorer.playerId)) {
          needsCleanup = true;
          return { ...scorer, playerId: '', goals: 0 };
        }

        // Check if own goal player is still in opposing team
        if (
          scorer.playerId === 'GC' &&
          scorer.ownGoalPlayerId &&
          !homeTeamPlayers.includes(scorer.ownGoalPlayerId)
        ) {
          needsCleanup = true;
          return { ...scorer, ownGoalPlayerId: '' };
        }

        return scorer;
      });

      if (needsCleanup) {
        setValue(`matches.${matchIndex}.awayGoals.whoScores`, cleanedScorers);
      }
    }
  }, [
    homeTeamId,
    awayTeamId,
    homeTeam,
    awayTeam,
    homeGoalScorers,
    awayGoalScorers,
    matchIndex,
    setValue,
  ]);

  // Team options (disable already selected team)
  const homeTeamOptions = useMemo<SelectOption[]>(() => {
    return teams.filter((t) => t.id !== awayTeamId).map((t) => ({ label: t.label, value: t.id }));
  }, [teams, awayTeamId]);

  const awayTeamOptions = useMemo<SelectOption[]>(() => {
    return teams.filter((t) => t.id !== homeTeamId).map((t) => ({ label: t.label, value: t.id }));
  }, [teams, homeTeamId]);

  // Score options (1-10, not 0)
  const scoreOptions = useMemo<SelectOption<string>[]>(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      label: (i + 1).toString(),
      value: (i + 1).toString(),
    }));
  }, []);

  // Match result preview
  const matchResult = useMemo(() => {
    const homeScore = parseInt(homeGoalsCount || '0');
    const awayScore = parseInt(awayGoalsCount || '0');

    if (homeScore === 0 && awayScore === 0) {
      return { type: 'empty', message: 'Configure o placar' };
    }

    if (homeScore > awayScore) {
      return {
        type: 'home-win',
        message: `Vitória do ${homeTeam?.label || 'Time Casa'}`,
        winner: homeTeam?.label,
      };
    }

    if (awayScore > homeScore) {
      return {
        type: 'away-win',
        message: `Vitória do ${awayTeam?.label || 'Time Visitante'}`,
        winner: awayTeam?.label,
      };
    }

    return { type: 'draw', message: 'Empate' };
  }, [homeGoalsCount, awayGoalsCount, homeTeam, awayTeam]);

  // Calculate completion progress
  const completionProgress = useMemo(() => {
    let completed = 0;
    const total = 4; // 2 teams + 2 goal details (scores are always valid, even 0x0)

    // Teams selected
    if (homeTeamId) completed++;
    if (awayTeamId) completed++;

    // Goal details completed
    const homeScore = parseInt(homeGoalsCount || '0');
    const awayScore = parseInt(awayGoalsCount || '0');

    if (homeScore > 0) {
      const homeAllocated = homeGoalScorers?.reduce((sum, s) => sum + (s?.goals || 0), 0) || 0;
      const homeComplete = homeGoalScorers?.every((s) => s?.playerId);
      if (homeAllocated === homeScore && homeComplete) completed++;
    } else {
      completed++; // No goals = automatically complete
    }

    if (awayScore > 0) {
      const awayAllocated = awayGoalScorers?.reduce((sum, s) => sum + (s?.goals || 0), 0) || 0;
      const awayComplete = awayGoalScorers?.every((s) => s?.playerId);
      if (awayAllocated === awayScore && awayComplete) completed++;
    } else {
      completed++; // No goals = automatically complete
    }

    return { completed, total, percentage: (completed / total) * 100 };
  }, [homeTeamId, awayTeamId, homeGoalsCount, awayGoalsCount, homeGoalScorers, awayGoalScorers]);

  // Validation: Teams cannot be the same
  const hasSameTeamError = homeTeamId && awayTeamId && homeTeamId === awayTeamId;

  // Auto-expand goal details when score > 0
  const homeScoreNum = parseInt(homeGoalsCount || '0');
  const awayScoreNum = parseInt(awayGoalsCount || '0');

  // Both teams selected
  const bothTeamsSelected = homeTeam && awayTeam && !hasSameTeamError;

  return (
    <Card className={cn('relative', hasSameTeamError && 'border-destructive')}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Partida {matchIndex + 1}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Result Preview Badge - Updated labels */}
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
                <PlayerSelect
                  options={homeTeamOptions}
                  value={field.value}
                  onChange={field.onChange}
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
                <PlayerSelect
                  options={awayTeamOptions}
                  value={field.value}
                  onChange={field.onChange}
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

        {/* Team Score Display - NEW: Shows "Team A 0 x 0 Team B" */}
        {bothTeamsSelected && (
          <>
            <Separator />
            <TeamScoreDisplay
              homeTeamName={homeTeam.label}
              awayTeamName={awayTeam.label}
              homeScore={homeScoreNum}
              awayScore={awayScoreNum}
              isVisible={true}
            />
          </>
        )}

        {/* Score Input */}
        {bothTeamsSelected && (
          <>
            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`match-${matchIndex}-home-score`}>Gols {homeTeam.label}</Label>
                <Controller
                  control={control}
                  name={`matches.${matchIndex}.homeGoals.goalsCount`}
                  render={({ field }) => (
                    <PlayerSelect
                      options={scoreOptions}
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue || '0');
                        // Auto-open details panel when score > 0
                        if (parseInt(newValue) > 0) {
                          setHomeDetailsOpen(true);
                        }
                      }}
                      placeholder="0"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`match-${matchIndex}-away-score`}>Gols {awayTeam.label}</Label>
                <Controller
                  control={control}
                  name={`matches.${matchIndex}.awayGoals.goalsCount`}
                  render={({ field }) => (
                    <PlayerSelect
                      options={scoreOptions}
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue || '0');
                        // Auto-open details panel when score > 0
                        if (parseInt(newValue) > 0) {
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
            {homeScoreNum > 0 && (
              <>
                <Separator />
                <GoalDetailsPanelV2
                  matchIndex={matchIndex}
                  side="home"
                  teamName={homeTeam.label}
                  control={control}
                  setValue={setValue}
                  teamPlayers={homeTeam.players}
                  opposingTeamPlayers={awayTeam.players}
                  isOpen={homeDetailsOpen}
                  onOpenChange={setHomeDetailsOpen}
                />
              </>
            )}

            {awayScoreNum > 0 && (
              <>
                <Separator />
                <GoalDetailsPanelV2
                  matchIndex={matchIndex}
                  side="away"
                  teamName={awayTeam.label}
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
