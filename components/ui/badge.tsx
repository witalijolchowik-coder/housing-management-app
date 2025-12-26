import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

const variantStyles = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-primary',
  default: 'bg-surfaceVariant',
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
      <Text className={cn('font-semibold text-foreground', textSizeStyles[size])}>
        {label}
      </Text>
    </View>
  );
}
