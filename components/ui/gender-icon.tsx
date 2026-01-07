import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export type GenderType = 'male' | 'female' | 'pair' | 'couple';

interface GenderIconProps {
  gender: GenderType;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}

export function GenderIcon({ gender, count, size = 18, showCount = true, className = "" }: GenderIconProps) {
  const getIconData = () => {
    switch (gender) {
      case 'male':
        return { name: 'mars', color: '#3b82f6' };
      case 'female':
        return { name: 'venus', color: '#ec4899' };
      case 'pair':
      case 'couple':
        return { name: 'user-friends', color: '#a855f7' };
      default:
        return { name: 'question', color: '#94a3b8' };
    }
  };

  const icon = getIconData();

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <FontAwesome5 name={icon.name} size={size} color={icon.color} />
      {showCount && count !== undefined && (
        <Text className="text-base font-bold text-foreground">{count}</Text>
      )}
    </View>
  );
}
