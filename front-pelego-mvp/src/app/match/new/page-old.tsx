'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMatchSchema } from '@/schema/match';
import { CreateMatchForm } from '@/types/forms';
import { usePlayers } from '@/services/player/usePlayers';
import { useCreateWeekAndMatches } from '@/services/matchs/useCreateWeekAndMatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { WeekPreview } from '@/components/WeekPreview';
import { MatchCard } from '@/components/MatchCard';
import { Plus, Save, CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlayerResponse } from '@/types/player';
import { cn } from '@/lib/utils';

export default function NewMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { players, isLoading: playersLoading } = usePlayers();
  const { createWeekWithMatches, isLoading: submitting } = useCreateWeekAndMatches();

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const form = useForm<CreateMatchForm>({
    resolver: zodResolver(CreateMatchSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      teams: [],
      matches: [
        {
          homeTeamId: '',
          awayTeamId: '',
          homeGoals: { goalsCount: '0', whoScores: [] },
          awayGoals: { goalsCount: '0', whoScores: [] },
          homeAssists: [],
          awayAssists: [],
        },
      ],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control,
    name: 'teams',
  });

  const {
    fields: matchFields,
    append: appendMatch,
    remove: removeMatch,
  } = useFieldArray({
    control,
    name: 'matches',
  });

  const watchedDate = watch('date');
  const watchedTeams = watch('teams');
  const watchedMatches = watch('matches');

  // Transform teams for MatchCard component
  const teamsForMatches = teamFields.map((team, index) => {
    const teamPlayerIds = watch(`teams.${index}.players`) || [];
    const teamPlayers: PlayerResponse[] = teamPlayerIds
      .map((playerId) => players?.find((p) => p.id === playerId))
      .filter(Boolean) as PlayerResponse[];

    return {
      id: index.toString(),
      label: `Time ${index + 1}`,
      players: teamPlayers,
    };
  });

  // Available players for team selection (not already in a team)
  const availablePlayers = players?.filter((player) => {
    const allTeamPlayers = watchedTeams.flatMap((team) => team.players);
    return !allTeamPlayers.includes(player.id);
  });

  const handleAddTeam = () => {
    appendTeam({ players: [] });
  };

  const handleAddMatch = () => {
    appendMatch({
      homeTeamId: '',
      awayTeamId: '',
      homeGoals: { goalsCount: '0', whoScores: [] },
      awayGoals: { goalsCount: '0', whoScores: [] },
      homeAssists: [],
      awayAssists: [],
    });
  };

  const onSubmit = async (data: CreateMatchForm) => {
    try {
      // Map form data to backend format
      const mappedData = {
        date: new Date(data.date).toISOString(),
        teams: data.teams.map((team) => team.players),
        matches: data.matches.map((match) => {
          const mapGoals = (goals: any[]) => {
            return goals
              .filter((goal) => goal.goals > 0)
              .map((goal) => {
                if (goal.playerId === 'GC') {
                  return {
                    ownGoalPlayerId: goal.ownGoalPlayerId,
                    goals: goal.goals,
                  };
                } else {
                  return {
                    playerId: goal.playerId,
                    goals: goal.goals,
                  };
                }
              });
          };

          const mapAssists = (assists: any[]) => {
            return assists
              .filter((assist) => assist.assists > 0 && assist.playerId)
              .map((assist) => ({
                playerId: assist.playerId,
                assists: assist.assists,
              }));
          };

          return {
            homeTeamIndex: parseInt(match.homeTeamId),
            awayTeamIndex: parseInt(match.awayTeamId),
            homeGoals: mapGoals(match.homeGoals.whoScores || []),
            awayGoals: mapGoals(match.awayGoals.whoScores || []),
            homeAssists: mapAssists(match.homeAssists || []),
            awayAssists: mapAssists(match.awayAssists || []),
          };
        }),
      };

      const result = await createWeekWithMatches(mappedData);

      toast({
        title: 'Sucesso!',
        description: `Semana criada com ${result.matches.length} partidas`,
        variant: 'default',
      });

      // Redirect to week details or home
      router.push('/');
    } catch (error) {
      console.error('Error creating week:', error);
      toast({
        title: 'Erro ao criar semana',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Nova Semana de Partidas</h1>
          <p className="text-muted-foreground">
            Configure os times, crie as partidas e acompanhe o preview em tempo real
          </p>
        </div>

        {/* Date Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Data da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                {...form.register('date')}
                className={cn(errors.date && 'border-destructive')}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Teams and Matches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teams Section */}
            <Card>
              <CardHeader>
                <CardTitle>Times</CardTitle>
                <CardDescription>
                  Crie os times selecionando os jogadores disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamFields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Time {index + 1}</Label>
                      {teamFields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeam(index)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {teamsForMatches[index]?.players.length || 0} jogadores selecionados
                    </div>
                    {errors.teams?.[index] && (
                      <p className="text-xs text-destructive">
                        {errors.teams[index]?.message || 'Erro no time'}
                      </p>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTeam}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Time
                </Button>

                {errors.teams && (
                  <p className="text-xs text-destructive">
                    {typeof errors.teams === 'object' && 'message' in errors.teams
                      ? (errors.teams as any).message
                      : 'Erro nos times'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Matches Section */}
            <Card>
              <CardHeader>
                <CardTitle>Partidas</CardTitle>
                <CardDescription>
                  Configure as partidas entre os times criados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchFields.map((field, index) => (
                  <MatchCard
                    key={field.id}
                    matchIndex={index}
                    control={control}
                    setValue={setValue}
                    teams={teamsForMatches}
                    onRemove={() => removeMatch(index)}
                    canRemove={matchFields.length > 1}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMatch}
                  className="w-full"
                  disabled={teamFields.length < 2}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Partida
                </Button>

                {errors.matches && (
                  <p className="text-xs text-destructive">
                    {typeof errors.matches === 'object' && 'message' in errors.matches
                      ? (errors.matches as any).message
                      : 'Erro nas partidas'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submit Button (Mobile) */}
            <div className="lg:hidden">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || teamFields.length < 2}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Semana
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Preview (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <WeekPreview
                control={control}
                teams={teamFields}
                players={players || []}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || teamFields.length < 2}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Semana
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Preview */}
        <div className="lg:hidden mt-6">
          <WeekPreview
            control={control}
            teams={teamFields}
            players={players || []}
          />
        </div>
      </form>
    </div>
  );
}
