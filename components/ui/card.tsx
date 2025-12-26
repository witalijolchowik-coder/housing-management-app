import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function Card({ className, variant = 'elevated', ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl bg-surface border border-border',
        variant === 'elevated' && 'shadow-md',
        className
      )}
      {...props}
    />
  );
}
