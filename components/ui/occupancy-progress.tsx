import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface OccupancyProgressProps {
  occupied: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
}

export function OccupancyProgress({ occupied, total, size = 'md' }: OccupancyProgressProps) {
  const colors = useColors();

  // Calculate percentage
  const percentage = total > 0 ? (occupied / total) * 100 : 0;

  // Determine color based on occupancy
  let barColor = colors.success; // Green - has space
  if (percentage >= 75) {
    barColor = colors.error; // Red - almost full
  } else if (percentage >= 50) {
    barColor = colors.warning; // Yellow - mostly full
  }

  // Size configuration
  const sizeConfig = {
    sm: {
      height: 'h-1.5',
      textSize: 'text-xs',
      containerGap: 'gap-1',
    },
    md: {
      height: 'h-2',
      textSize: 'text-sm',
      containerGap: 'gap-2',
    },
    lg: {
      height: 'h-3',
      textSize: 'text-base',
      containerGap: 'gap-2',
    },
  };

  const config = sizeConfig[size];

  return (
    <View className={`gap-1 ${config.containerGap}`}>
      {/* Progress Bar */}
      <View className={`w-full ${config.height} bg-surface rounded-full overflow-hidden`}>
        <View
          className={`${config.height} rounded-full`}
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </View>

      {/* Label */}
      <View className="flex-row justify-between items-center">
        <Text className={`${config.textSize} font-semibold text-foreground`}>
          {occupied}/{total}
        </Text>
        <Text className={`${config.textSize} text-muted`}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
}
