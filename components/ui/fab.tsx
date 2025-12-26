import { Pressable, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface FABProps {
  icon?: string;
  label?: string;
  onPress: () => void;
  position?: 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { button: 'w-12 h-12', icon: 24 },
  md: { button: 'w-14 h-14', icon: 28 },
  lg: { button: 'w-16 h-16', icon: 32 },
};

export function FAB({ 
  icon = 'add', 
  label,
  onPress, 
  position = 'center',
  size = 'md',
}: FABProps) {
  const colors = useColors();
  const sizeConfig = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
      className={cn(
        sizeConfig.button,
        'rounded-full bg-primary items-center justify-center',
        'absolute bottom-6',
        position === 'center' ? 'self-center' : 'right-6'
      )}
    >
      <MaterialIcons name={icon as any} size={sizeConfig.icon} color={colors.foreground} />
      {label && (
        <Text className="text-foreground text-xs font-semibold mt-1">{label}</Text>
      )}
    </Pressable>
  );
}
