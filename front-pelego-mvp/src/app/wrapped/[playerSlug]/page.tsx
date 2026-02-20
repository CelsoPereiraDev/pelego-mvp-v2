'use client';

import { ShareButton } from '@/components/ShareButton';
import { calculatePlayerStatsForPlayer } from '@/mapper/allPlayersStatsMapper';
import { usePlayer } from '@/services/player/usePlayer';
import { useWeeks } from '@/services/weeks/useWeeks';
import { useRef } from 'react';

interface PlayerProps {
  params: {
    playerSlug: string;
  };
}

const formatRank = (rank: number | undefined) => {
  if (rank === 1) return '1º Lugar';
  if (rank === 2) return '2º Lugar';
  if (rank === 3) return '3º Lugar';
  if (rank !== undefined && rank >= 4 && rank <= 5) return 'Top 5';
  if (rank !== undefined && rank >= 6 && rank <= 10) return 'Top 10';
  return null;
};

export default function PlayerPage({ params: { playerSlug } }: PlayerProps) {
  const { weeks } = useWeeks();
  const { player } = usePlayer(playerSlug);
  const playerStats = calculatePlayerStatsForPlayer(weeks, player?.id ?? '');
  const shareRef = useRef<HTMLDivElement>(null);

  const renderPrimaryStats = (stats: typeof playerStats) => {
    if (!stats || !player) return null;

    const statsEntries = [
      { label: 'Semanas', value: weeks?.length, rank: null },
      {
        label: 'Jogos',
        value: stats.matches,
        rank: formatRank(stats.rankings?.matches),
      },
      {
        label: 'Gols Marcados',
        value: stats.goals,
        rank: formatRank(stats.rankings?.goals),
      },
      {
        label: 'Assistências',
        value: stats.assists,
        rank: formatRank(stats.rankings?.assists),
      },
      {
        label: 'Gols Sofridos / Semana',
        value: stats.averageGoalsConcededPerWeek.toFixed(2),
        rank: formatRank(stats.rankings?.averageGoalsConcededPerWeek),
      },
    ];

    return (
      <ul className="text-white text-lg sm:text-xl font-light mb-6 grid grid-cols-2 gap-4">
        {statsEntries
          .filter((entry) => entry.value !== null)
          .map((entry, index) => (
            <li key={index} className="mb-4 flex justify-between flex-col">
              <span className="flex flex-row justify-between">
                <span className="text-5xl">{entry.value}</span>
                {entry.rank && (
                  <span
                    className={`text-sm font-medium ${
                      entry.rank.includes('1º Lugar')
                        ? 'text-yellow-300' // Dourado
                        : entry.rank.includes('2º Lugar')
                          ? 'text-silver-400' // Prata (cinza claro)
                          : entry.rank.includes('3º Lugar')
                            ? 'text-amber-500' // Bronze (âmbar)
                            : entry.rank.includes('Top 5')
                              ? 'text-green-300' // Cinza claro
                              : entry.rank.includes('Top 10')
                                ? 'text-purple-400' // Laranja
                                : ''
                    } mr-1`}>
                    {entry.rank}
                  </span>
                )}
              </span>
              <strong className="font-semibold">{entry.label}</strong>
            </li>
          ))}
      </ul>
    );
  };

  // const renderAchievements = () => {
  //   const monthsInCategories = getMonthsInCategories();

  //   const achievementsEntries = [
  //     {
  //       value:
  //         monthsInCategories.assists?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.assists.length, "Líder em assistências", monthsInCategories.assists)
  //           : null,
  //     },
  //     {
  //       value:
  //         monthsInCategories.scorer?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.scorer.length, "Artilheiro", monthsInCategories.scorer)
  //           : null,
  //     },
  //     {
  //       value:
  //         monthsInCategories.mvp?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.mvp.length, "MVP", monthsInCategories.mvp)
  //           : null,
  //     },
  //     {
  //       value:
  //         monthsInCategories.lvp?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.lvp.length, "LVP", monthsInCategories.lvp)
  //           : null,
  //     },
  //     {
  //       value:
  //         monthsInCategories.bestDefender?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.bestDefender.length, "Melhor Defensor", monthsInCategories.bestDefender)
  //           : null,
  //     },
  //     {
  //       value:
  //         monthsInCategories.topPointer?.length > 0
  //           ? formatMonthCategoryText(monthsInCategories.topPointer.length, "Maior pontuador", monthsInCategories.topPointer)
  //           : null,
  //     },
  //   ];

  //   return (
  //     <ul className="text-white text-2xl font-light">
  //       {achievementsEntries
  //         .filter(entry => entry.value)
  //         .map((entry, index) => (
  //           <li key={index} className="mb-4">
  //             {entry.value}
  //           </li>
  //         ))}
  //     </ul>
  //   );
  // };

  const renderTop5List = (
    title: string,
    list: Array<{ name: string; points: number; pointsExpected: number }>,
  ) => (
    <div className="bg-white/10 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <ul className="text-white text-xs">
        {list.slice(0, 3).map((item, index) => (
          <li key={index} className="mb-2">
            <strong>{item.name}:</strong> {((item.points / item.pointsExpected) * 100).toFixed(2)}%
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 flex items-center p-6 flex-col">
      <h1 className="text-3xl sm:text-4xl text-center text-white font-extrabold mb-6">
        Sr. Caetano 2024
      </h1>
      <div ref={shareRef} className="w-full max-w-md bg-black/30 rounded-xl p-6 shadow-lg">
        <section className="mb-6">
          {/* <span className="text-xl">{player.name} - {translatePosition(player?.position)}</span> */}
          {renderPrimaryStats(playerStats)}
        </section>
        {/* <section className="mb-6">
          {renderAchievements()}
        </section> */}
        <div className="flex flex-wrap justify-between gap-6">
          <section className="flex-1 min-w-[40%]">
            {playerStats && renderTop5List('⬆ Parceiros', playerStats.top5PointsWithPlayers)}
          </section>
          <section className="flex-1 min-w-[40%]">
            {playerStats &&
              renderTop5List('⬇ Parceiros', playerStats.top5WorstPerformingTeammates)}
          </section>
          <section className="flex-1 min-w-[40%]">
            {playerStats &&
              renderTop5List('Pra quem mais perdi', playerStats.top5PointsAgainstPlayers)}
          </section>
          <section className="flex-1 min-w-[40%]">
            {playerStats &&
              renderTop5List('De quem mais ganhei', playerStats.top5PointsGivenByPlayers)}
          </section>
        </div>
      </div>
      <div className="mt-6">
        <ShareButton
          targetRef={shareRef}
          title="Meu Wrapped Pelego"
          text={`Confira as stats de ${player?.name ?? 'jogador'} no Pelego MVP!`}
        />
      </div>
    </div>
  );
}
