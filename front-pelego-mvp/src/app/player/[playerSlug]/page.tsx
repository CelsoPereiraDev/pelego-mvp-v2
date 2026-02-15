'use client';

import { PlayerCard } from '@/components/PlayerCard';
import { RadarGraphic } from '@/components/RadarGrahic';
import { RadialChart } from '@/components/RadialChart';
import RoleGate from '@/components/RoleGate';
import { StatsCard } from '@/components/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/week/StatCard';
import { usePlayerOverview } from '@/services/player/usePlayerOverview';
import { MonthPrizeRecord, Player, PlayerOverviewStats, YearIndividualPrizes } from '@/types/player';
import {
  BarChart3,
  Crown,
  Minus,
  Pencil,
  Percent,
  Shield,
  Star,
  Swords,
  Target,
  TrendingDown,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface PlayerProps {
  params: {
    playerSlug: string;
  };
}

function interactionToStatData(
  list: Array<{ name: string; points: number; pointsExpected: number }>,
) {
  return list.map((item) => ({
    name: item.name,
    value: parseFloat(((item.points / item.pointsExpected) * 100).toFixed(1)),
    label: `${((item.points / item.pointsExpected) * 100).toFixed(1)}%`,
  }));
}

function rankLabel(rank: number | undefined): string {
  return rank !== undefined ? `${rank}º no ranking` : '';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatPrizeMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getAwardLabels(prize: MonthPrizeRecord): Array<{ label: string; icon: string }> {
  const awards: Array<{ label: string; icon: string }> = [];
  if (prize.isMVP) awards.push({ label: 'MVP', icon: '👑' });
  if (prize.isTopPointer) awards.push({ label: 'Maior Pontuador', icon: '🎯' });
  if (prize.isStriker) awards.push({ label: 'Artilheiro', icon: '⚽' });
  if (prize.isBestAssist) awards.push({ label: 'Maior Assistente', icon: '🅰️' });
  if (prize.isBestDefender) awards.push({ label: 'Melhor Defensor', icon: '🛡️' });
  if (prize.isLVP) awards.push({ label: 'LVP', icon: '📉' });
  if (prize.isBestOfPosition) awards.push({ label: 'Seleção do Mês', icon: '⭐' });
  return awards;
}

function countAward(prizes: MonthPrizeRecord[], key: keyof MonthPrizeRecord): number {
  return prizes.filter((p) => p[key] === true).length;
}

function getYearAwardLabels(prize: YearIndividualPrizes): Array<{ label: string; icon: string }> {
  const awards: Array<{ label: string; icon: string }> = [];
  if (prize.yearChampion) awards.push({ label: 'Campeão do Ano', icon: '👑' });
  if (prize.yearTopPointer) awards.push({ label: 'Maior Pontuador', icon: '🎯' });
  if (prize.yearStriker) awards.push({ label: 'Artilheiro', icon: '⚽' });
  if (prize.yearBestAssist) awards.push({ label: 'Maior Assistente', icon: '🅰️' });
  if (prize.yearBestDefender) awards.push({ label: 'Melhor Defensor', icon: '🛡️' });
  if (prize.yearLVP) awards.push({ label: 'LVP', icon: '📉' });
  if (prize.yearBestOfPosition) awards.push({ label: 'Seleção do Ano', icon: '⭐' });
  return awards;
}

function countYearAward(prizes: YearIndividualPrizes[], key: keyof YearIndividualPrizes): number {
  return prizes.filter((p) => p[key] === true).length;
}

function formatPrizeYear(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return String(date.getFullYear());
}

export default function PlayerPage({ params: { playerSlug } }: PlayerProps) {
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const { overview, isLoading } = usePlayerOverview(
    playerSlug,
    selectedYear || undefined,
  );

  const player = overview?.player;
  const stats = overview?.stats;
  const availableYears = overview?.availableYears ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Jogador não encontrado.</p>
      </div>
    );
  }

  const playerCardData: Player = {
    id: player.id,
    name: player.name,
    overall: player.overall,
    country: player.country,
    image: player.image,
    position: player.position,
    isChampion: player.isChampion,
    email: player.email,
  };

  const chartData = [
    { stat: 'Fôlego', valor: player.overall.pace || 0 },
    { stat: 'Chute', valor: player.overall.shooting || 0 },
    { stat: 'Passe', valor: player.overall.passing || 0 },
    { stat: 'Drible', valor: player.overall.dribble || 0 },
    { stat: 'Defesa', valor: player.overall.defense || 0 },
    { stat: 'Físico', valor: player.overall.physics || 0 },
  ];

  const chartConfig = {
    desktop: {
      label: 'Estatisticas do jogador',
      color: 'hsl(var(--tier-mvp))',
    },
  };

  const radialChartData = [
    {
      goals: 'PPG',
      APG: (stats?.goals || 0) + (stats?.assists || 0),
      PIG:
        (stats?.teamGoals || 0) -
          ((stats?.goals || 0) + (stats?.assists || 0)) || 0,
    },
  ];

  const radialChartConfig = {
    APG: {
      label: 'Part. direta nos gols  ',
      color: 'hsl(var(--tier-mvp))',
    },
    PIG: {
      label: 'Demais gols do time  ',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  const buildGoalStatData = (s: PlayerOverviewStats) => {
    const items = [];
    if (s.goals > 0) items.push({ name: 'Gols', value: s.goals, label: `${s.goals} gols` });
    if (s.ownGoals > 0) items.push({ name: 'Gols Contra', value: s.ownGoals, label: `${s.ownGoals} gols contra` });
    items.push({ name: 'Média por Semana', value: parseFloat(s.averageGoalsPerWeek.toFixed(2)), label: `${s.averageGoalsPerWeek.toFixed(2)} gols/semana` });
    return items;
  };

  const buildAssistStatData = (s: PlayerOverviewStats) => [
    { name: 'Assistências', value: s.assists, label: `${s.assists} assistências` },
    { name: 'Média por Semana', value: parseFloat(s.averageAssistsPerWeek.toFixed(2)), label: `${s.averageAssistsPerWeek.toFixed(2)} assists/semana` },
  ];

  const buildDefenseStatData = (s: PlayerOverviewStats) => [
    { name: 'Gols Sofridos', value: s.goalsConceded, label: `${s.goalsConceded} gols sofridos` },
    { name: 'Média por Partida', value: parseFloat(s.averageGoalsConceded.toFixed(2)), label: `${s.averageGoalsConceded.toFixed(2)} gols/partida` },
    { name: 'Média por Semana', value: parseFloat(s.averageGoalsConcededPerWeek.toFixed(2)), label: `${s.averageGoalsConcededPerWeek.toFixed(2)} gols/semana` },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {player.name}
          </h1>
          <Badge variant={player.isAuthenticated ? 'success' : 'outline'} size="lg">
            {player.isAuthenticated ? 'Autenticado' : 'Não autenticado'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
          >
            <option value="">Todos os tempos</option>
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
          <RoleGate allow={['admin']}>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/edit-player/${player.id}`}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Editar
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Hero Section — PlayerCard + Charts */}
      <section className="bg-card rounded-xl border border-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
          <PlayerCard playerData={playerCardData} />
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <RadarGraphic
              title="Overall do Jogador"
              description="Análise dos principais atributos do jogador"
              chartData={chartData}
              chartConfig={chartConfig}
              maxDomain={100}
            />
            {stats && (
              <RadialChart
                valueInPercentage={`${((((stats.goals || 0) + (stats.assists || 0)) / (stats.teamGoals || 1)) * 100).toFixed(2)}  %`}
                chartData={radialChartData}
                chartConfig={radialChartConfig}
              />
            )}
          </div>
        </div>
      </section>

      {stats ? (
        <>
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Partidas"
              value={stats.matches}
              subtitle={rankLabel(stats.rankings?.matches)}
              icon={Swords}
            />
            <StatsCard
              title="Vitórias"
              value={stats.wins}
              subtitle={rankLabel(stats.rankings?.wins)}
              icon={Trophy}
            />
            <StatsCard
              title="Derrotas"
              value={stats.losses}
              subtitle={rankLabel(stats.rankings?.losses)}
              icon={TrendingDown}
            />
            <StatsCard
              title="Empates"
              value={stats.draws}
              subtitle={rankLabel(stats.rankings?.draws)}
              icon={Minus}
            />
            <StatsCard
              title="Pontos"
              value={stats.points}
              subtitle={rankLabel(stats.rankings?.points)}
              icon={Target}
            />
            <StatsCard
              title="Aproveitamento"
              value={`${stats.pointsPercentage.toFixed(1)}%`}
              subtitle={rankLabel(stats.rankings?.pointsPercentage)}
              icon={Percent}
            />
            <StatsCard
              title="Média Pts/Semana"
              value={stats.averagePointsPerWeek.toFixed(2)}
              subtitle={rankLabel(stats.rankings?.averagePointsPerWeek)}
              icon={BarChart3}
            />
          </div>

          <Separator />

          {/* Detailed Stats */}
          <section>
            <SectionHeader
              title="Estatísticas Detalhadas"
              icon="📊"
              description="Gols, assistências e defesa"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Gols"
                icon="⚽"
                variant="goal"
                data={buildGoalStatData(stats)}
              />
              <StatCard
                title="Assistências"
                icon="🅰️"
                variant="assist"
                data={buildAssistStatData(stats)}
              />
              <StatCard
                title="Defesa"
                icon="🛡️"
                variant="ranking"
                data={buildDefenseStatData(stats)}
              />
            </div>
          </section>

          <Separator />

          {/* Companions & Opponents */}
          <section>
            <SectionHeader
              title="Companheiros & Adversários"
              icon="🤝"
              description="Análise de desempenho com e contra outros jogadores"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Melhores Companheiros"
                icon="💚"
                variant="ranking"
                data={interactionToStatData(stats.top5PointsWithPlayers)}
              />
              <StatCard
                title="Piores Companheiros"
                icon="💔"
                variant="ranking"
                data={interactionToStatData(stats.top5WorstPerformingTeammates)}
              />
              <StatCard
                title="Adversários que mais perdi"
                icon="😤"
                variant="ranking"
                data={interactionToStatData(stats.top5PointsAgainstPlayers)}
              />
              <StatCard
                title="Adversários que mais venci"
                icon="😎"
                variant="ranking"
                data={interactionToStatData(stats.top5PointsGivenByPlayers)}
              />
            </div>
          </section>
        </>
      ) : (
        <section className="bg-card rounded-xl border border-border p-12">
          <p className="text-center text-muted-foreground">
            Sem dados estatísticos para este período.
          </p>
        </section>
      )}

      {/* Prizes Section — filtered by selected year */}
      {player.monthIndividualPrizes.length > 0 && (() => {
        const prizes = player.monthIndividualPrizes;
        const totalChampion = prizes.reduce((sum, p) => sum + p.championTimes, 0);
        const mvpCount = countAward(prizes, 'isMVP');
        const topPointerCount = countAward(prizes, 'isTopPointer');
        const strikerCount = countAward(prizes, 'isStriker');
        const bestAssistCount = countAward(prizes, 'isBestAssist');
        const bestDefenderCount = countAward(prizes, 'isBestDefender');
        const lvpCount = countAward(prizes, 'isLVP');
        const bestOfPositionCount = countAward(prizes, 'isBestOfPosition');

        const sortedPrizes = [...prizes].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return (
          <>
            <Separator />
            <section>
              <SectionHeader
                title="Premiações"
                icon="🏆"
                description="Histórico de conquistas do jogador"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                  title="Campeão da Semana"
                  value={totalChampion}
                  subtitle="vezes no total"
                  icon={Trophy}
                  variant="gold"
                />
                {mvpCount > 0 && (
                  <StatsCard title="MVP" value={mvpCount} subtitle="meses" icon={Crown} variant="gold" />
                )}
                {topPointerCount > 0 && (
                  <StatsCard title="Maior Pontuador" value={topPointerCount} subtitle="meses" icon={Target} />
                )}
                {strikerCount > 0 && (
                  <StatsCard title="Artilheiro" value={strikerCount} subtitle="meses" icon={Zap} />
                )}
                {bestAssistCount > 0 && (
                  <StatsCard title="Maior Assistente" value={bestAssistCount} subtitle="meses" icon={Star} />
                )}
                {bestDefenderCount > 0 && (
                  <StatsCard title="Melhor Defensor" value={bestDefenderCount} subtitle="meses" icon={Shield} />
                )}
                {lvpCount > 0 && (
                  <StatsCard title="LVP" value={lvpCount} subtitle="meses" icon={TrendingDown} />
                )}
                {bestOfPositionCount > 0 && (
                  <StatsCard title="Seleção do Mês" value={bestOfPositionCount} subtitle="meses" icon={Star} variant="gold" />
                )}
              </div>

              {/* Monthly Breakdown */}
              <div className="space-y-3">
                {sortedPrizes.map((prize) => {
                  const awards = getAwardLabels(prize);
                  return (
                    <div
                      key={prize.id}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {formatPrizeMonth(prize.date)}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {prize.championTimes > 0 && (
                            <Badge variant="trophy" size="sm">
                              {prize.championTimes}x Campeão
                            </Badge>
                          )}
                          {awards.map((award) => (
                            <Badge key={award.label} variant="mvp" size="sm">
                              {award.icon} {award.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {prize.championWeeks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Semanas:</span>
                          {prize.championWeeks.map((cw) => (
                            <Link
                              key={cw.weekId}
                              href={`/week/${cw.weekId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {formatWeekDate(cw.date)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        );
      })()}

      {/* Year Prizes Section */}
      {player.yearIndividualPrizes && player.yearIndividualPrizes.length > 0 && (() => {
        const yearPrizes = player.yearIndividualPrizes;
        const yearChampionCount = countYearAward(yearPrizes, 'yearChampion');
        const yearTopPointerCount = countYearAward(yearPrizes, 'yearTopPointer');
        const yearStrikerCount = countYearAward(yearPrizes, 'yearStriker');
        const yearBestAssistCount = countYearAward(yearPrizes, 'yearBestAssist');
        const yearBestDefenderCount = countYearAward(yearPrizes, 'yearBestDefender');
        const yearLvpCount = countYearAward(yearPrizes, 'yearLVP');
        const yearBestOfPositionCount = countYearAward(yearPrizes, 'yearBestOfPosition');
        const totalChampionOfWeek = yearPrizes.reduce((sum, p) => sum + (p.championOfTheWeek || 0), 0);

        const sortedYearPrizes = [...yearPrizes].sort(
          (a, b) => new Date(b.year).getTime() - new Date(a.year).getTime(),
        );

        return (
          <>
            <Separator />
            <section>
              <SectionHeader
                title="Premiações Anuais"
                icon="🏅"
                description="Conquistas acumuladas por ano"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {totalChampionOfWeek > 0 && (
                  <StatsCard title="Campeão da Semana" value={totalChampionOfWeek} subtitle="vezes no total" icon={Trophy} variant="gold" />
                )}
                {yearChampionCount > 0 && (
                  <StatsCard title="Campeão do Ano" value={yearChampionCount} subtitle="anos" icon={Crown} variant="gold" />
                )}
                {yearTopPointerCount > 0 && (
                  <StatsCard title="Maior Pontuador" value={yearTopPointerCount} subtitle="anos" icon={Target} />
                )}
                {yearStrikerCount > 0 && (
                  <StatsCard title="Artilheiro" value={yearStrikerCount} subtitle="anos" icon={Zap} />
                )}
                {yearBestAssistCount > 0 && (
                  <StatsCard title="Maior Assistente" value={yearBestAssistCount} subtitle="anos" icon={Star} />
                )}
                {yearBestDefenderCount > 0 && (
                  <StatsCard title="Melhor Defensor" value={yearBestDefenderCount} subtitle="anos" icon={Shield} />
                )}
                {yearLvpCount > 0 && (
                  <StatsCard title="LVP" value={yearLvpCount} subtitle="anos" icon={TrendingDown} />
                )}
                {yearBestOfPositionCount > 0 && (
                  <StatsCard title="Seleção do Ano" value={yearBestOfPositionCount} subtitle="anos" icon={Star} variant="gold" />
                )}
              </div>

              {/* Yearly Breakdown */}
              <div className="space-y-3">
                {sortedYearPrizes.map((prize, idx) => {
                  const awards = getYearAwardLabels(prize);
                  return (
                    <div
                      key={idx}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {formatPrizeYear(prize.year)}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {prize.championOfTheWeek > 0 && (
                            <Badge variant="trophy" size="sm">
                              {prize.championOfTheWeek}x Campeão da Semana
                            </Badge>
                          )}
                          {awards.map((award) => (
                            <Badge key={award.label} variant="mvp" size="sm">
                              {award.icon} {award.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        );
      })()}
    </div>
  );
}
