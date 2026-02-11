'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMatchSchema } from '@/schema/match';
import { CreateMatchForm } from '@/types/forms';
import { usePlayers } from '@/services/player/usePlayers';
import { useWeek } from '@/services/weeks/useWeek';
import RoleGate from '@/components/RoleGate';
import { useUpdateWeekAndMatches } from '@/services/matchs/useUpdateWeekAndMatches';
import { mapWeekToFormValues } from '@/mapper/defaultValueMatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WeekPreview } from '@/components/WeekPreview';
import { DatePickerWithShortcuts } from '@/components/DatePickerWithShortcuts';
import { TeamBuilder } from '@/components/TeamBuilder';
import { MatchCardV2 } from '@/components/MatchCard/MatchCardV2';
import { Plus, Save, CalendarIcon, Loader2, Users, Trophy, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function EditWeekPage() {
  const router = useRouter();
  const params = useParams();
  const weekId = params?.weekId as string;
  const { toast } = useToast();
  const { players, isLoading: playersLoading } = usePlayers();
  const { week, isLoading: weekLoading } = useWeek(weekId);
  const { updateWeekWithMatches, isLoading: submitting } = useUpdateWeekAndMatches();

  const form = useForm<CreateMatchForm>({
    resolver: zodResolver(CreateMatchSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      teams: [],
      matches: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = form;

  // Load week data into form
  useEffect(() => {
    if (week && players) {
      const formValues = mapWeekToFormValues(week, players);
      reset(formValues);
    }
  }, [week, players, reset]);

  // Debug: Log errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', JSON.stringify(errors, null, 2));
    }
  }, [errors]);

  const {
    fields: teamFields,
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

  const allSelectedPlayerIds = useMemo(() => {
    return watchedTeams.flatMap((team) => team.players);
  }, [watchedTeams]);

  const availablePlayers = useMemo(() => {
    return players?.filter((player) => !allSelectedPlayerIds.includes(player.id)) || [];
  }, [players, allSelectedPlayerIds]);

  const teamsForMatches = useMemo(() => {
    return teamFields.map((team, index) => {
      const teamPlayerIds = watchedTeams[index]?.players || [];
      const teamPlayers =
        players?.filter((p) => teamPlayerIds.includes(p.id)) || [];

      return {
        id: index.toString(),
        label: `Time ${index + 1}`,
        players: teamPlayers,
      };
    });
  }, [teamFields, JSON.stringify(watchedTeams), players]);

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
      console.log('Form data before mapping:', JSON.stringify(data, null, 2));

      const mappedData = {
        date: new Date(data.date).toISOString(),
        teams: data.teams.map((team) => team.players),
        matches: data.matches.map((match) => {
          const mapGoals = (goals: { goals: number; playerId: string; ownGoalPlayerId?: string }[]) => {
            return goals
              .filter((goal) => goal.playerId)
              .map((goal) => {
                if (goal.playerId === 'GC') {
                  return {
                    ownGoalPlayerId: goal.ownGoalPlayerId,
                    goals: 1,
                  };
                } else {
                  return {
                    playerId: goal.playerId,
                    goals: 1,
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
            homeGoals: mapGoals(match.homeGoals.whoScores || []),
            awayGoals: mapGoals(match.awayGoals.whoScores || []),
            homeAssists: mapAssists(match.homeAssists || []),
            awayAssists: mapAssists(match.awayAssists || []),
          };
        }),
      };

      console.log('Mapped data to send:', JSON.stringify(mappedData, null, 2));

      const result = await updateWeekWithMatches(weekId, mappedData);

      console.log('Result from API:', result);

      toast({
        title: 'Sucesso!',
        description: `Semana atualizada com ${result.matches.length} partidas`,
        variant: 'default',
      });

      router.push(`/week/${weekId}`);
    } catch (error) {
      console.error('Error updating week:', error);
      toast({
        title: 'Erro ao atualizar semana',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (playersLoading || weekLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">Semana não encontrada</p>
      </div>
    );
  }

  return (
    <RoleGate allow={['admin']} fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <p className="text-lg">Apenas administradores podem editar semanas.</p>
      </div>
    }>
    <div className="container mx-auto py-8 px-4">
      <form onSubmit={(e) => {
          const values = getValues();
          console.log("🔴 FORM VALUES BEFORE VALIDATION:", JSON.stringify(values, null, 2));
          console.log("🔴 Match 7 specifically:", values.matches?.[7]);
          handleSubmit(onSubmit)(e);
        }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/week/${weekId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Editar Semana</h1>
            </div>
            <p className="text-muted-foreground">
              Atualize a data, jogadores dos times e resultados das partidas
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Data da Semana
            </CardTitle>
            <CardDescription>
              Altere a data em que as partidas foram jogadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <DatePickerWithShortcuts
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date?.toISOString().split('T')[0])
                  }
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
            {/* Teams Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Times ({teamFields.length})
                </CardTitle>
                <CardDescription>
                  Altere os jogadores de cada time. Não é permitido adicionar ou remover times.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamFields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <Controller
                      control={control}
                      name={`teams.${index}.players`}
                      render={({ field: playersField, fieldState }) => {
                        const otherTeamsPlayerIds = watchedTeams
                          .filter((_, idx) => idx !== index)
                          .flatMap((t) => t.players);

                        const availableForThisTeam =
                          players?.filter(
                            (p) => !otherTeamsPlayerIds.includes(p.id)
                          ) || [];

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
                  </div>
                ))}

                {errors.teams && (
                  <p className="text-xs text-destructive">
                    {typeof errors.teams === 'object' && 'message' in errors.teams
                      ? (errors.teams as { message?: string }).message
                      : 'Erro nos times'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Matches Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Partidas
                </CardTitle>
                <CardDescription>
                  Adicione, remova ou edite as partidas entre os times
                </CardDescription>
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
                  disabled={teamFields.length < 2}
                >
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
                disabled={submitting || teamFields.length < 2}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
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
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
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
    </RoleGate>
  );
}
