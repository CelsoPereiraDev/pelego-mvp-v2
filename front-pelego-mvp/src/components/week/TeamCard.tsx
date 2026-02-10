'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/types/match';
import { cn } from '@/lib/utils';

interface TeamCardProps {
  teamNumber: number;
  players: TeamMember[];
  teamIcon?: React.ReactNode;
  className?: string;
}

export function TeamCard({ teamNumber, players, teamIcon, className }: TeamCardProps) {
  return (
    <Card
      className={cn(
        "border-primary/30 hover:border-primary/60 transition-base",
        className
      )}
      role="region"
      aria-labelledby={`team-${teamNumber}-heading`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            id={`team-${teamNumber}-heading`}
            className="text-lg text-foreground flex items-center gap-2"
          >
            {teamIcon}
            Time {teamNumber}
          </CardTitle>
          <Badge variant="stat" size="sm">
            {players.length} {players.length === 1 ? 'jogador' : 'jogadores'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5" role="list">
          {players.map((player) => (
            <li
              key={player.id}
              className="text-sm text-foreground/80 py-1 px-2 rounded-md hover:bg-muted/50 transition-fast"
            >
              {player.player.name}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
