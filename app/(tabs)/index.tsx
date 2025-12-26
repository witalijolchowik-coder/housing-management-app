import { ScrollView, Text, View, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, ProjectStats } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      let data = await loadData();
      if (data.length === 0) {
        await initializeDemoData();
        data = await loadData();
      }
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectPress = (projectId: string) => {
    // TODO: Navigate to project details
    console.log('Navigate to project:', projectId);
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const stats = calculateProjectStats(item);
    const hasEvictions = item.addresses.some((addr) =>
      addr.rooms.some((room) =>
        room.spaces.some((space) => space.status === 'wypowiedzenie')
      )
    );
    const hasConflicts = item.addresses.some((addr) =>
      addr.rooms.some((room) =>
        room.spaces.some((space) => space.status === 'conflict')
      )
    );
    const hasOverdue = item.addresses.some((addr) =>
      addr.rooms.some((room) =>
        room.spaces.some((space) => space.status === 'overdue')
      )
    );

    return (
      <Pressable
        onPress={() => handleProjectPress(item.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-4 mb-4">
          <View className="gap-3">
            {/* Header */}
            <View className="flex-row justify-between items-start">
              <Text className="text-lg font-bold text-foreground flex-1">{item.name}</Text>
              <View className="bg-surfaceVariant rounded-full p-2">
                <MaterialIcons name="apartment" size={24} color={colors.primary} />
              </View>
            </View>

            {/* Occupancy */}
            <View className="gap-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-3xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                <Text className="text-sm text-muted">
                  {stats.occupied}/{stats.total} {t.addressList.occupied}
                </Text>
              </View>
              <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-2">
              {hasEvictions && (
                <Badge variant="warning" size="sm" label={`${t.roomDetails.eviction}`} />
              )}
              {hasConflicts && (
                <Badge variant="error" size="sm" label={`${stats.conflict} ${t.statistics.conflictCount}`} />
              )}
              {hasOverdue && (
                <Badge variant="error" size="sm" label={`${t.roomDetails.overdue}`} />
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-foreground">{t.dashboard.title}</Text>
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="person" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <Pressable
        className="bg-surfaceVariant rounded-full px-4 py-3 mb-6 flex-row items-center gap-2"
      >
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <Text className="text-muted">{t.dashboard.searchPlaceholder}</Text>
      </Pressable>

      {/* Projects List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : projects.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.messages.emptyProject}</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* FAB */}
      <FAB icon="add" onPress={() => console.log('Add project')} />
    </ScreenContainer>
  );
}
