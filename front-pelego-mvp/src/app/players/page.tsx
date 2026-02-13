'use client';

import PlayerCardSmall from '@/components/PlayerCardSmall';
import { Card, CardContent } from '@/components/ui/card';
import { usePlayers } from '@/services/player/usePlayers';
import { useRouter } from 'next/navigation';

export default function AllPlayersPage() {
  const { players } = usePlayers();
  const router = useRouter();

  const goToPlayerPage = (playerId: string) => {
    router.push(`/player/${playerId}`);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] max-w-screen flex justify-start flex-col p-12 items-center gap-7">
      <h1 className="text-3xl text-center mb-9 text-[hsl(var(--foreground))]">Jogadores</h1>
      <Card className="p-6 bg-[hsl(var(--card))] min-h-full rounded-lg w-full max-w-[1440px]">
        <CardContent className="flex flex-row flex-wrap justify-start py-8">
          {players
            ?.sort((a, b) => a?.name.localeCompare(b?.name))
            ?.map((player, index) => (
              <div
                className="pb-10 cursor-pointer hover:opacity-80 transition-opacity"
                key={index}
                onClick={() => goToPlayerPage(player.id)}>
                <PlayerCardSmall playerData={player} showOverall={true} />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
