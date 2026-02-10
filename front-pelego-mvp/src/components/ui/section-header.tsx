'use client';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  description?: string;
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  action,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
