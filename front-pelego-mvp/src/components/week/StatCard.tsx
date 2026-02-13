'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatVariant = 'goal' | 'assist' | 'ownGoal' | 'ranking';

interface StatData {
  name: string;
  value: number;
  label: string;
}

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  data: StatData[];
  variant: StatVariant;
  className?: string;
}

const variantConfig: Record<
  StatVariant,
  { borderClass: string; badgeVariant: 'goal' | 'assist' | 'ownGoal' | 'gold' }
> = {
  goal: {
    borderClass: 'border-[hsl(var(--goal-indicator))]/20',
    badgeVariant: 'goal',
  },
  assist: {
    borderClass: 'border-[hsl(var(--assist-indicator))]/20',
    badgeVariant: 'assist',
  },
  ownGoal: {
    borderClass: 'border-[hsl(var(--own-goal-indicator))]/20',
    badgeVariant: 'ownGoal',
  },
  ranking: {
    borderClass: 'border-[hsl(var(--accent-gold))]/20',
    badgeVariant: 'gold',
  },
};

export function StatCard({ title, icon, data, variant, className }: StatCardProps) {
  const config = variantConfig[variant];

  return (
    <Card
      className={cn(config.borderClass, 'transition-base', className)}
      role="region"
      aria-labelledby={`${variant}-heading`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <CardTitle id={`${variant}-heading`} className="text-lg text-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ol className="space-y-2" role="list">
            {data.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-fast">
                <div className="flex items-center gap-3">
                  <Badge variant={config.badgeVariant} size="sm">
                    {index + 1}º
                  </Badge>
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhum dado disponível</p>
        )}
      </CardContent>
    </Card>
  );
}
