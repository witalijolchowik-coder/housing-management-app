import { View } from 'react-native';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  height = 4,
  color = 'bg-primary',
  backgroundColor = 'bg-surfaceVariant',
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      className={cn(backgroundColor, 'rounded-full overflow-hidden', className)}
      style={{ height }}
    >
      <View
        className={cn(color, 'h-full rounded-full')}
        style={{ width: `${clampedProgress}%` }}
      />
    </View>
  );
}
