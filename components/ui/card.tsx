import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'filled' | 'outlined';
}

export function Card({ className, variant = 'elevated', ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-3xl',
        variant === 'elevated' && 'bg-surface shadow-lg',
        variant === 'filled' && 'bg-surfaceVariant',
        variant === 'outlined' && 'bg-surface border border-border',
        variant === 'default' && 'bg-surface border border-border/50',
        className
      )}
      {...props}
    />
  );
}
