'use client';

import { useMemo } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, TrendingUp, AlertTriangle, Award } from 'lucide-react';
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

interface WeekPreviewProps {
  control: Control<CreateMatchForm>;
  teams: { players: string[] }[];
  players: PlayerResponse[];
}

export const WeekPreview = ({ control, teams, players }: WeekPreviewProps) => {
  const matches = useWatch({ control, name: 'matches' });

  // Calculate all statistics in real-time
  const statistics = useMemo(() => {
    if (!matches || matches.length === 0) {
      return null;
    }

    // Initialize team points
    const teamPoints: Record<number, number> = {};
    teams.forEach((_, idx) => (teamPoints[idx] = 0));

    // Initialize player stats
    const playerGoals: Record<string, number> = {};
    const playerAssists: Record<string, number> = {};
    let totalOwnGoals = 0;

    matches.forEach((match) => {
      const homeTeamIdx = parseInt(match.homeTeamId?.toString() || '-1');
      const awayTeamIdx = parseInt(match.awayTeamId?.toString() || '-1');

      if (homeTeamIdx === -1 || awayTeamIdx === -1) return;

      const homeScore = parseInt(match.homeGoals?.goalsCount || '0');
      const awayScore = parseInt(match.awayGoals?.goalsCount || '0');

      // Calculate points (3 win, 1 draw, 0 loss)
      if (homeScore > awayScore) {
        teamPoints[homeTeamIdx] += 3;
      } else if (awayScore > homeScore) {
        teamPoints[awayTeamIdx] += 3;
      } else if (homeScore === awayScore && homeScore > 0) {
        teamPoints[homeTeamIdx] += 1;
        teamPoints[awayTeamIdx] += 1;
      }

      // Count goals per player
      match.homeGoals?.whoScores?.forEach((goal) => {
        if (goal.playerId === 'GC') {
          totalOwnGoals += goal.goals || 0;
        } else if (goal.playerId) {
          playerGoals[goal.playerId] = (playerGoals[goal.playerId] || 0) + (goal.goals || 0);
        }
      });

      match.awayGoals?.whoScores?.forEach((goal) => {
        if (goal.playerId === 'GC') {
          totalOwnGoals += goal.goals || 0;
        } else if (goal.playerId) {
          playerGoals[goal.playerId] = (playerGoals[goal.playerId] || 0) + (goal.goals || 0);
        }
      });

      // Count assists per player
      match.homeAssists?.forEach((assist) => {
        if (assist.playerId && assist.assists) {
          playerAssists[assist.playerId] = (playerAssists[assist.playerId] || 0) + assist.assists;
        }
      });

      match.awayAssists?.forEach((assist) => {
        if (assist.playerId && assist.assists) {
          playerAssists[assist.playerId] = (playerAssists[assist.playerId] || 0) + assist.assists;
        }
      });
    });

    // Find top scorer
    let topScorer: { playerId: string; goals: number } | null = null;
    Object.entries(playerGoals).forEach(([playerId, goals]) => {
      if (!topScorer || goals > topScorer.goals) {
        topScorer = { playerId, goals };
      }
    });

    // Find top assister
    let topAssister: { playerId: string; assists: number } | null = null;
    Object.entries(playerAssists).forEach(([playerId, assists]) => {
      if (!topAssister || assists > topAssister.assists) {
        topAssister = { playerId, assists };
      }
    });

    // Find leader(s)
    const maxPoints = Math.max(...Object.values(teamPoints));
    const leaders = Object.entries(teamPoints)
      .filter(([_, points]) => points === maxPoints)
      .map(([teamIdx, points]) => ({ teamIdx: parseInt(teamIdx), points }));

    return {
      teamPoints,
      topScorer,
      topAssister,
      totalOwnGoals,
      leaders,
      totalMatches: matches.length,
      totalGoals: Object.values(playerGoals).reduce((sum, g) => sum + g, 0) + totalOwnGoals,
    };
  }, [matches, teams]);

  if (!statistics) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Adicione partidas para ver o preview</p>
        </CardContent>
      </Card>
    );
  }

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Desconhecido';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Preview da Semana
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Team Standings */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <Award className="w-4 h-4" />
            Classificação
          </h4>

          <div className="space-y-1.5">
            {Object.entries(statistics.teamPoints)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([teamIdx, points], position) => {
                const isLeader = statistics.leaders.some((l) => l.teamIdx === parseInt(teamIdx));
                return (
                  <div
                    key={teamIdx}
                    className="flex items-center justify-between p-2 rounded-md bg-card/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        {position + 1}º
                      </span>
                      <Badge variant={isLeader ? 'default' : 'secondary'}>
                        Time {parseInt(teamIdx) + 1}
                      </Badge>
                      {isLeader && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{points}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {statistics.leaders.length > 1 && (
            <p className="text-xs text-muted-foreground italic text-center">
              Empate na liderança ({statistics.leaders.length} times)
            </p>
          )}
        </div>

        <Separator />

        {/* Top Scorer */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="w-4 h-4" />
            Artilheiro da Semana
          </h4>

          {statistics.topScorer ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{getPlayerName(statistics.topScorer.playerId)}</p>
                  <p className="text-xs text-muted-foreground">Artilheiro</p>
                </div>
              </div>
              <Badge variant="goal" className="gap-1">
                {statistics.topScorer.goals}
                <span className="text-xs">
                  gol{statistics.topScorer.goals !== 1 ? 's' : ''}
                </span>
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Nenhum gol marcado ainda
            </p>
          )}
        </div>

        <Separator />

        {/* Top Assister */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Maior Assistente
          </h4>

          {statistics.topAssister ? (
            <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--assist-indicator))]/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--assist-indicator))]" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {getPlayerName(statistics.topAssister.playerId)}
                  </p>
                  <p className="text-xs text-muted-foreground">Assistente</p>
                </div>
              </div>
              <Badge variant="assist" className="gap-1">
                {statistics.topAssister.assists}
                <span className="text-xs">assist.</span>
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Nenhuma assistência registrada
            </p>
          )}
        </div>

        {/* Own Goals (only if > 0) */}
        {statistics.totalOwnGoals > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Gols Contra
              </h4>

              <div className="flex items-center justify-between p-3 rounded-md bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Gols Contra</p>
                    <p className="text-xs text-muted-foreground">Total na semana</p>
                  </div>
                </div>
                <Badge variant="ownGoal" className="gap-1">
                  {statistics.totalOwnGoals}
                  <span className="text-xs">GC</span>
                </Badge>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">{statistics.totalMatches}</p>
            <p className="text-xs text-muted-foreground">Partidas</p>
          </div>
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">{statistics.totalGoals}</p>
            <p className="text-xs text-muted-foreground">Gols</p>
          </div>
          <div className="p-2 rounded-md bg-card/50">
            <p className="text-xl font-bold">
              {statistics.totalGoals > 0
                ? (statistics.totalGoals / statistics.totalMatches).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-xs text-muted-foreground">Média</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
