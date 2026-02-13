'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'pitch' | 'gold' | 'stat' | 'stadium';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'stat',
  trend,
  trendValue,
  className,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return (
          <div className="flex items-center gap-1 text-success text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            {trendValue}
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center gap-1 text-destructive text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            {trendValue}
          </div>
        );
      case 'neutral':
        return (
          <div className="flex items-center gap-1 text-muted-foreground text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            {trendValue}
          </div>
        );
    }
  };

  return (
    <Card variant={variant} className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide opacity-80">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              'p-2 rounded-lg transition-colors',
              variant === 'pitch' && 'bg-white/20',
              variant === 'gold' && 'bg-white/20',
              variant === 'stat' && 'bg-primary/10 text-primary',
              variant === 'stadium' && 'bg-primary/10 text-primary',
              variant === 'default' && 'bg-muted text-muted-foreground',
            )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div
            className={cn(
              'text-3xl font-bold tracking-tight',
              variant === 'pitch' && 'text-white',
              variant === 'gold' && 'text-white',
            )}>
            {value}
          </div>
          {subtitle && (
            <p
              className={cn(
                'text-xs opacity-70',
                variant === 'pitch' && 'text-white',
                variant === 'gold' && 'text-white',
                variant === 'stat' && 'text-muted-foreground',
                variant === 'stadium' && 'text-muted-foreground',
              )}>
              {subtitle}
            </p>
          )}
          {trend && getTrendIcon()}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
