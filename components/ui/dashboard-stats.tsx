import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Card } from './card';

export interface DashboardStatsData {
  occupancyPercent: number;
  totalSpaces: number;
  occupiedSpaces: number;
  vacantSpaces: number;
  wypowiedzienieSpaces: number;
  conflictCount: number;
  totalCost?: number;
}

interface DashboardStatsProps {
  data: DashboardStatsData;
  onOccupancyPress?: () => void;
  onTotalSpacesPress?: () => void;
  onOccupiedPress?: () => void;
  onVacantPress?: () => void;
  onWypowiedzieniePress?: () => void;
  onConflictsPress?: () => void;
}

export function DashboardStats({
  data,
  onOccupancyPress,
  onTotalSpacesPress,
  onOccupiedPress,
  onVacantPress,
  onWypowiedzieniePress,
  onConflictsPress,
}: DashboardStatsProps) {
  const colors = useColors();

  return (
    <View className="gap-3 mb-6">
      {/* Occupancy - Large card */}
      <Pressable onPress={onOccupancyPress}>
        <Card className="p-6 bg-primary items-center">
          <Text className="text-white text-sm font-medium">Obłożenie</Text>
          <Text className="text-white text-5xl font-bold mt-2">{data.occupancyPercent}%</Text>
          <Text className="text-white/80 text-sm mt-2">Cel: 100%</Text>
        </Card>
      </Pressable>

      {/* Grid of stats - 2 columns */}
      <View className="gap-3">
        {/* Total Spaces */}
        <Pressable onPress={onTotalSpacesPress} className="flex-1">
          <Card className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Razem miejsc</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{data.totalSpaces}</Text>
            </View>
            <MaterialIcons name="apartment" size={32} color={colors.primary} />
          </Card>
        </Pressable>

        {/* Occupied Spaces */}
        <Pressable onPress={onOccupiedPress} className="flex-1">
          <Card className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Zajęte miejsca</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{data.occupiedSpaces}</Text>
            </View>
            <MaterialIcons name="person" size={32} color={colors.success} />
          </Card>
        </Pressable>

        {/* Vacant Spaces */}
        <Pressable onPress={onVacantPress} className="flex-1">
          <Card className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Wolne miejsca</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{data.vacantSpaces}</Text>
            </View>
            <MaterialIcons name="event-available" size={32} color={colors.warning} />
          </Card>
        </Pressable>

        {/* Wypowiedzenie */}
        <Pressable onPress={onWypowiedzieniePress} className="flex-1">
          <Card className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Na wypowiedzeniu</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{data.wypowiedzienieSpaces}</Text>
            </View>
            <MaterialIcons name="warning" size={32} color={colors.warning} />
          </Card>
        </Pressable>

        {/* Conflicts */}
        <Pressable onPress={onConflictsPress} className="flex-1">
          <Card className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Konflikty</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{data.conflictCount}</Text>
            </View>
            <MaterialIcons name="error" size={32} color={colors.error} />
          </Card>
        </Pressable>

        {/* Total Cost (if provided) */}
        {data.totalCost !== undefined && (
          <Pressable className="flex-1">
            <Card className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-sm text-muted">Całkowity koszt</Text>
                <Text className="text-2xl font-bold text-foreground mt-1">
                  {data.totalCost.toLocaleString('pl-PL')} PLN
                </Text>
              </View>
              <MaterialIcons name="attach-money" size={32} color={colors.primary} />
            </Card>
          </Pressable>
        )}
      </View>
    </View>
  );
}
