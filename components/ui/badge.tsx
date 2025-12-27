import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

const variantStyles = {
  success: 'bg-success/20 border border-success/50',
  warning: 'bg-warning/20 border border-warning/50',
  error: 'bg-error/20 border border-error/50',
  info: 'bg-primary/20 border border-primary/50',
  default: 'bg-surfaceVariant border border-border/50',
};

const textColorStyles = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-primary',
  default: 'text-foreground',
};

const sizeStyles = {
  sm: 'px-2 py-1',
  md: 'px-3 py-1.5',
  lg: 'px-4 py-2',
};

const textSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Badge({ 
  variant = 'default', 
  size = 'md', 
  label,
  className,
  ...props 
}: BadgeProps) {
  return (
    <View
      className={cn(
        'rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Text className={cn('font-semibold', textColorStyles[variant], textSizeStyles[size])}>
        {label}
      </Text>
    </View>
  );
}
