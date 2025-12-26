import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  disabled?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  variant = 'outlined',
}: ChipProps) {
  const colors = useColors();

  const isFilledVariant = variant === 'filled' || (variant === 'default' && selected);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.8 : 1,
      })}
      className={cn(
        'flex-row items-center gap-2 px-4 py-2 rounded-full',
        isFilledVariant ? 'bg-primary' : 'bg-surfaceVariant border border-border',
        disabled && 'opacity-50'
      )}
    >
      {icon && (
        <MaterialIcons
          name={icon as any}
          size={18}
          color={isFilledVariant ? colors.foreground : colors.muted}
        />
      )}
      <Text
        className={cn(
          'font-medium text-sm',
          isFilledVariant ? 'text-foreground' : 'text-muted'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
