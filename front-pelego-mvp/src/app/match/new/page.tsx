'use client';

import { DatePickerWithShortcuts } from '@/components/DatePickerWithShortcuts';
import { MatchCardV2 } from '@/components/MatchCard/MatchCardV2';
import { TeamBuilder } from '@/components/TeamBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeekPreview } from '@/components/WeekPreview';
import { useToast } from '@/hooks/use-toast';
import { CreateMatchSchema } from '@/schema/match';
import RoleGate from '@/components/RoleGate';
import { useCreateWeekAndMatches } from '@/services/matchs/useCreateWeekAndMatches';
import { usePlayers } from '@/services/player/usePlayers';
import { CreateMatchForm } from '@/types/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Plus, Save, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

export default function NewMatchPageV2() {
  const router = useRouter();
  const { toast } = useToast();
  const { players, isLoading: playersLoading } = usePlayers();
  const { createWeekWithMatches, isLoading: submitting } = useCreateWeekAndMatches();

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

  const watchedTeams = watch('teams');

  // Transform teams for MatchCard component
  const teamsForMatches = useMemo(() => {
    return teamFields.map((team, index) => {
      const teamPlayerIds = watchedTeams[index]?.players || [];
      const teamPlayers = players?.filter((p) => teamPlayerIds.includes(p.id)) || [];

      return {
        id: index.toString(),
        label: `Time ${index + 1}`,
        players: teamPlayers,
      };
    });
  }, [teamFields, JSON.stringify(watchedTeams), players]);

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
          // Map goals - each entry = 1 goal, no grouping needed
          const mapGoals = (
            goals: { goals: number; playerId: string; ownGoalPlayerId?: string }[],
          ) => {
            return goals
              .filter((goal) => goal.playerId) // Only valid goals with playerId
              .map((goal) => {
                if (goal.playerId === 'GC') {
                  // Own goal
                  return {
                    ownGoalPlayerId: goal.ownGoalPlayerId,
                    goals: goal.goals || 1,
                  };
                } else {
                  // Regular goal
                  return {
                    playerId: goal.playerId,
                    goals: goal.goals || 1,
                  };
                }
              });
          };

          const mapAssists = (assists: { assists: number; playerId: string }[]) => {
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
            homeGoals: mapGoals((match.homeGoals.whoScores || []) as { goals: number; playerId: string; ownGoalPlayerId?: string }[]),
            awayGoals: mapGoals((match.awayGoals.whoScores || []) as { goals: number; playerId: string; ownGoalPlayerId?: string }[]),
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

      // Redirect to home or week details
      router.push('/');
    } catch (error) {
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
    <RoleGate
      allow={['admin', 'user']}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <p className="text-lg">Apenas membros e administradores podem criar semanas e partidas.</p>
        </div>
      }>
      <div className="container mx-auto py-8 px-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Nova Semana de Partidas</h1>
            <p className="text-muted-foreground">
              Configure a data, monte os times e crie as partidas
            </p>
          </div>

          {/* Date Selection with NEW DatePicker */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Data da Semana
              </CardTitle>
              <CardDescription>Selecione a data em que as partidas serão jogadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="date"
                render={({ field, fieldState }) => (
                  <DatePickerWithShortcuts
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    allowFutureDates={false}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Teams and Matches */}
            <div className="lg:col-span-2 space-y-6">
              {/* Teams Section with NEW TeamBuilder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Times
                  </CardTitle>
                  <CardDescription>
                    Monte os times selecionando os jogadores disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamFields.map((field, index) => (
                    <div key={field.id} className="space-y-2">
                      <Controller
                        control={control}
                        name={`teams.${index}.players`}
                        render={({ field: playersField, fieldState }) => {
                          // Get players already selected in OTHER teams
                          const otherTeamsPlayerIds = watchedTeams
                            .filter((_, idx) => idx !== index)
                            .flatMap((t) => t.players);

                          // Filter available players (not in other teams)
                          const availableForThisTeam =
                            players?.filter((p) => !otherTeamsPlayerIds.includes(p.id)) || [];

                          return (
                            <TeamBuilder
                              teamIndex={index}
                              selectedPlayerIds={playersField.value}
                              availablePlayers={availableForThisTeam}
                              onPlayersChange={playersField.onChange}
                              error={fieldState.error?.message}
                            />
                          );
                        }}
                      />

                      {teamFields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeam(index)}
                          className="w-full">
                          Remover Time
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTeam}
                    className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Time
                  </Button>

                  {errors.teams && (
                    <p className="text-xs text-destructive">
                      {typeof errors.teams === 'object' && 'message' in errors.teams
                        ? (errors.teams as { message?: string }).message
                        : 'Erro nos times'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Matches Section with NEW MatchCardV2 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Partidas
                  </CardTitle>
                  <CardDescription>Configure as partidas entre os times criados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {matchFields.map((field, index) => (
                    <MatchCardV2
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
                    disabled={teamFields.length < 2}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Partida
                  </Button>

                  {errors.matches && (
                    <div className="space-y-1">
                      {typeof errors.matches === 'object' && 'message' in errors.matches && (
                        <p className="text-xs text-destructive font-medium">
                          {(errors.matches as { message?: string }).message}
                        </p>
                      )}
                      {Array.isArray(errors.matches) &&
                        errors.matches.map(
                          (matchError, idx) =>
                            matchError && (
                              <div
                                key={idx}
                                className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                <p className="font-medium">Partida {idx + 1}:</p>
                                {matchError.homeTeamId && <p>- {matchError.homeTeamId.message}</p>}
                                {matchError.awayTeamId && <p>- {matchError.awayTeamId.message}</p>}
                                {matchError.homeGoals &&
                                  typeof matchError.homeGoals === 'object' &&
                                  'message' in matchError.homeGoals && (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    <p>- {(matchError.homeGoals as any).message}</p>
                                  )}
                                {matchError.homeAssists &&
                                  typeof matchError.homeAssists === 'object' &&
                                  'message' in matchError.homeAssists && (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    <p>- {(matchError.homeAssists as any).message}</p>
                                  )}
                              </div>
                            ),
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button (Mobile) */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || teamFields.length < 2}>
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
                <WeekPreview control={control} teams={teamFields} players={players || []} />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || teamFields.length < 2}>
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
            <WeekPreview control={control} teams={teamFields} players={players || []} />
          </div>
        </form>
      </div>
    </RoleGate>
  );
}
