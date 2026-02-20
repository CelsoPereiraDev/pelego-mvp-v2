'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/ui/section-header';
import { WeekHeader } from '@/components/week/WeekHeader';
import { TeamCard } from '@/components/week/TeamCard';
import { StatCard } from '@/components/week/StatCard';
import { MatchCard } from '@/components/match/MatchCard';
import { MyWeekDialog } from '@/components/week/MyWeekDialog';
import { useWeek } from '@/services/weeks/useWeek';
import { useLinkedPlayerId } from '@/hooks/useLinkedPlayerId';
import { MatchResponse } from '@/types/match';
import Looks3OutlinedIcon from '@mui/icons-material/Looks3Outlined';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';

type TeamIdToIndexMap = {
  [key: string]: number;
};

type PlayerAssistsMap = {
  [key: string]: {
    name: string;
    assists: number;
  };
};

type PlayerGoalsMap = {
  [key: string]: {
    name: string;
    goals: number;
  };
};

type OwnGoalsMap = {
  [key: string]: {
    name: string;
    ownGoals: number;
  };
};

type TeamPointsMap = {
  [key: string]: {
    name: string;
    points: number;
  };
};

const WeekDetails: React.FC = () => {
  const { weekId } = useParams();
  const { week, isLoading, isError } = useWeek(weekId as string);
  const { linkedPlayerId } = useLinkedPlayerId();
  const [myWeekOpen, setMyWeekOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {isError.message}</div>;

  const teamIdToIndexMap: TeamIdToIndexMap = {};
  week?.teams.forEach((team, index) => {
    teamIdToIndexMap[team.id] = index + 1;
  });

  const uniqueMatches: MatchResponse[] = [];
  const matchIds = new Set();
  week?.teams
    .flatMap((team) => team.matchesHome.concat(team.matchesAway))
    .forEach((match) => {
      if (!matchIds.has(match.id)) {
        uniqueMatches.push(match);
        matchIds.add(match.id);
      }
    });

  const sortedMatches = uniqueMatches.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const playerGoalsMap: PlayerGoalsMap = {};
  const ownGoalsMap: OwnGoalsMap = {};
  const playerAssistsMap: PlayerAssistsMap = {};
  sortedMatches.forEach((match) => {
    match.goals.forEach((goal) => {
      if (goal.player) {
        if (!playerGoalsMap[goal.player.id]) {
          playerGoalsMap[goal.player.id] = { name: goal.player.name, goals: 0 };
        }
        playerGoalsMap[goal.player.id].goals += goal.goals;
      } else if (goal.ownGoalPlayer) {
        if (!ownGoalsMap[goal.ownGoalPlayer.id]) {
          ownGoalsMap[goal.ownGoalPlayer.id] = { name: goal.ownGoalPlayer.name, ownGoals: 0 };
        }
        ownGoalsMap[goal.ownGoalPlayer.id].ownGoals += goal.goals;
      }
    });

    match.assists.forEach((assist) => {
      if (assist.player) {
        if (!playerAssistsMap[assist.player.id]) {
          playerAssistsMap[assist.player.id] = { name: assist.player.name, assists: 0 };
        }
        playerAssistsMap[assist.player.id].assists += 1;
      }
    });
  });

  const teamPointsMap: TeamPointsMap = {};
  week?.teams.forEach((team) => {
    teamPointsMap[team.id] = { name: `Time ${teamIdToIndexMap[team.id]}`, points: 0 };
  });

  sortedMatches.forEach((match) => {
    const homeGoals = match.result ? match.result.homeGoals : 0;
    const awayGoals = match.result ? match.result.awayGoals : 0;
    if (homeGoals > awayGoals) {
      teamPointsMap[match.homeTeamId].points += 3;
    } else if (homeGoals < awayGoals) {
      teamPointsMap[match.awayTeamId].points += 3;
    } else {
      teamPointsMap[match.homeTeamId].points += 1;
      teamPointsMap[match.awayTeamId].points += 1;
    }
  });

  const teamRankings = Object.values(teamPointsMap).sort((a, b) => b.points - a.points);
  const topScorers = Object.values(playerGoalsMap).sort((a, b) => b.goals - a.goals);
  const topAssistPlayers = Object.values(playerAssistsMap).sort((a, b) => b.assists - a.assists);
  const ownGoalsList = Object.values(ownGoalsMap).sort((a, b) => b.ownGoals - a.ownGoals);

  const renderIconForTeam = (index: number) => {
    switch (index) {
      case 1:
        return <LooksOneIcon className="text-destructive h-9 w-9" />;
      case 2:
        return <LooksTwoIcon className="text-foreground h-9 w-9" />;
      case 3:
        return <Looks3OutlinedIcon className="text-foreground h-9 w-9" />;
      default:
        return null;
    }
  };

  const formattedDate = week?.date ? format(new Date(week.date), 'dd/MM/yy') : 'Data indisponível';

  return (
    <div className="min-h-screen bg-background w-full flex justify-start flex-col p-4 md:p-8 lg:p-12 items-center">
      <div className="w-full max-w-7xl space-y-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <h1 className="text-3xl md:text-4xl text-center font-bold text-foreground">
            Detalhes da Semana
          </h1>
          <button
            onClick={() => setMyWeekOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap">
            👤 Minha Semana
          </button>
        </div>

        <MyWeekDialog
          open={myWeekOpen}
          onOpenChange={setMyWeekOpen}
          week={week}
          weekDate={formattedDate}
          myPlayerId={linkedPlayerId}
          weekId={weekId as string}
        />

        <Card className="w-full p-4 md:p-6 rounded-lg">
          <WeekHeader date={formattedDate} weekId={weekId as string} />

          <Separator className="my-6" />

          <CardContent className="p-0 space-y-8">
            {/* Seção Times da Semana */}
            <section>
              <SectionHeader
                title="Times da Semana"
                icon="📋"
                description={`${week?.teams.length} times formados`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {week?.teams.map((team, index) => (
                  <TeamCard
                    key={team.id}
                    teamNumber={index + 1}
                    players={team.players}
                    teamIcon={renderIconForTeam(index + 1)}
                  />
                ))}
              </div>
            </section>

            <Separator />

            {/* Seção Estatísticas */}
            <section>
              <SectionHeader title="Estatísticas da Semana" icon="📊" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="Artilheiros"
                  icon="⚽"
                  variant="goal"
                  data={topScorers.map((player) => ({
                    name: player.name,
                    value: player.goals,
                    label: `${player.goals} ${player.goals === 1 ? 'gol' : 'gols'}`,
                  }))}
                />

                <StatCard
                  title="Assistências"
                  icon="🅰️"
                  variant="assist"
                  data={topAssistPlayers.map((player) => ({
                    name: player.name,
                    value: player.assists,
                    label: `${player.assists} ${player.assists === 1 ? 'assist' : 'assists'}`,
                  }))}
                />

                <StatCard
                  title="Gols Contra"
                  icon="🔴"
                  variant="ownGoal"
                  data={ownGoalsList.map((player) => ({
                    name: player.name,
                    value: player.ownGoals,
                    label: `${player.ownGoals} ${player.ownGoals === 1 ? 'gol contra' : 'gols contra'}`,
                  }))}
                />

                <StatCard
                  title="Classificação"
                  icon="🏆"
                  variant="ranking"
                  data={teamRankings.map((team) => ({
                    name: team.name,
                    value: team.points,
                    label: `${team.points} pontos`,
                  }))}
                />
              </div>
            </section>

            <Separator />

            {/* Seção Partidas */}
            <section>
              <SectionHeader
                title="Partidas da Semana"
                icon="⚽"
                description={`${sortedMatches.length} partidas realizadas`}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    matchNumber={index + 1}
                    homeTeamNumber={teamIdToIndexMap[match.homeTeamId]}
                    awayTeamNumber={teamIdToIndexMap[match.awayTeamId]}
                    homeTeamIcon={renderIconForTeam(teamIdToIndexMap[match.homeTeamId])}
                    awayTeamIcon={renderIconForTeam(teamIdToIndexMap[match.awayTeamId])}
                  />
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeekDetails;
