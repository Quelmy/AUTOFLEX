import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-success text-success-foreground',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  accent: 'bg-accent-foreground/20 text-accent-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {description && (
            <p
              className={cn(
                'mt-1 text-sm',
                variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
              )}
            >
              {description}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.positive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.positive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconVariantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
