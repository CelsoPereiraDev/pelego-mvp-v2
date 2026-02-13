import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-soft hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/80',
        outline: 'text-foreground border-border hover:bg-accent',
        success:
          'border-transparent bg-success text-success-foreground shadow-soft hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground shadow-soft hover:bg-warning/80',
        // Football-themed variants
        pitch:
          'border-transparent bg-gradient-pitch text-white shadow-pitch hover:shadow-lg font-bold uppercase',
        gold: 'border-[hsl(var(--accent-gold))] bg-gradient-gold text-white shadow-gold hover:shadow-tier-gold animate-trophy',
        trophy:
          'border-transparent bg-gradient-trophy text-white shadow-tier-gold font-bold uppercase tracking-wide',
        mvp: 'border-transparent bg-[hsl(var(--tier-mvp))] text-white shadow-soft hover:shadow-lg font-bold',
        stat: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary',
        goal: 'border-[hsl(var(--goal-indicator))]/20 bg-[hsl(var(--goal-indicator))]/10 text-[hsl(var(--goal-indicator))] font-semibold hover:bg-[hsl(var(--goal-indicator))]/20',
        assist:
          'border-[hsl(var(--assist-indicator))]/20 bg-[hsl(var(--assist-indicator))]/10 text-[hsl(var(--assist-indicator))] font-semibold hover:bg-[hsl(var(--assist-indicator))]/20',
        ownGoal:
          'border-[hsl(var(--own-goal-indicator))]/20 bg-[hsl(var(--own-goal-indicator))]/10 text-[hsl(var(--own-goal-indicator))] font-semibold hover:bg-[hsl(var(--own-goal-indicator))]/20',
        modified:
          'border-[hsl(var(--field-dirty))]/20 bg-[hsl(var(--field-dirty))]/10 text-[hsl(var(--field-dirty))] font-semibold',
        defender: 'border-transparent bg-muted text-muted-foreground font-semibold',
        glass: 'glass-pitch border-primary/30 text-primary hover:border-primary/50',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0 text-[10px]',
        lg: 'px-4 py-1 text-sm',
        xl: 'px-6 py-2 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
