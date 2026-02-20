'use client';

import { MyWeekStats } from '@/hooks/useMyWeekStats';
import { Player } from '@/types/player';
import { forwardRef } from 'react';
import PlayerCardSmall from '../PlayerCardSmall';

interface MyWeekCardProps {
  stats: MyWeekStats;
  weekDate: string;
  strikerStreak: number;
  assistStreak: number;
  championStreak: number;
}

export const MyWeekCard = forwardRef<HTMLDivElement, MyWeekCardProps>(
  ({ stats, weekDate, strikerStreak, assistStreak, championStreak }, ref) => {
    const {
      myPlayer,
      isChampion,
      isTopScorer,
      isTopAssist,
      goals,
      assists,
      ownGoals,
      goalsConceded,
      avgGoalsConcededPerMatch,
      groupAvgGoalsConceded,
      wins,
      draws,
      losses,
      points,
    } = stats;

    const aboveAvg = avgGoalsConcededPerMatch > groupAvgGoalsConceded;

    return (
      <div
        ref={ref}
        className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-sm text-white shadow-2xl pt-10">
        {/* Header: player card + info */}
        <div className="flex items-stretch">
          {/* Player card — fixed 200x200 */}
          {myPlayer && (
            <div className="flex-shrink-0">
              <PlayerCardSmall
                playerData={myPlayer as unknown as Player}
                showOverall
              />
            </div>
          )}

          {/* Info block */}
          <div className="flex flex-col justify-between py-4 pr-4 flex-1 min-w-0">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Minha Semana
              </p>
              <h2 className="text-lg font-bold truncate">{weekDate} &middot; </h2>
              
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10 py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">⚽</span>
                <span className="text-3xl font-bold">{goals}</span>
                <span className="text-xs text-gray-400">
                  {goals === 1 ? 'Gol' : 'Gols'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 px-4">
                <span className="text-2xl">🎩</span>
                <span className="text-3xl font-bold">{assists}</span>
                <span className="text-xs text-gray-400">
                  {assists === 1 ? 'Assist' : 'Assists'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-4" />

        {/* W/D/L/Pts */}
        <div className="grid grid-cols-4 divide-x divide-white/10 py-3 px-2 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">{wins}</span>
            <span className="text-xs text-gray-400">V</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">{draws}</span>
            <span className="text-xs text-gray-400">E</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">{losses}</span>
            <span className="text-xs text-gray-400">D</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">{points}</span>
            <span className="text-xs text-gray-400">Pts</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-4" />

        {/* Badges */}
        <div className="flex flex-wrap flex-col gap-2 my-3 px-4">
          {isChampion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-300 text-md font-semibold px-3 pb-0.5 pt-1.5 w-fit">
              🏆 Campeão{championStreak > 1 ? ` 🔥${championStreak}x` : ''}
            </span>
          )}
          {isTopScorer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-300 text-md font-semibold px-3 pb-0.5 pt-1.5 w-fit">
              ⚽ Artilheiro{strikerStreak > 1 ? ` 🔥${strikerStreak}x` : ''}
            </span>
          )}
          {isTopAssist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-300 text-md font-semibold px-3 pb-0.5 pt-1.5 w-fit">
              🎩 Líder de Assistências{assistStreak > 1 ? ` 🔥${assistStreak}x` : ''}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-4" />

        {/* Defense stats */}
        <div className="pr-4 pl-[20px] py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex flex-col">
                <div>
                  <span className="text-2xl font-bold">{goalsConceded}</span>
                  <span className="text-xs text-gray-400 ml-1">
                    {goalsConceded === 1 ? 'gol sofrido' : 'gols sofridos'}
                  </span>
                </div>
                <span className="text-xs font-medium text-green-400">
                  {!aboveAvg ? 'Melhor que a média da semana' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {avgGoalsConcededPerMatch.toFixed(2)}/jogo
              </span>
            </div>
          </div>

          {ownGoals > 0 && (
            <p className="text-xs text-red-400 mt-1">
              🔴 {ownGoals} {ownGoals === 1 ? 'gol contra' : 'gols contra'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-white/10 mx-4" />
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">
            Pelego
          </p>
        </div>
      </div>
    );
  },
);

MyWeekCard.displayName = 'MyWeekCard';
