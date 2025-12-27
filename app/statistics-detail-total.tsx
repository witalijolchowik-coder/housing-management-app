import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project } from '@/types';
import { loadData, calculateProjectStats } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function TotalDetailScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await loadData();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row items-center mb-6 gap-3">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-3xl font-bold text-foreground">Razem miejsc</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : projects.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Brak projektów</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Projects List */}
          {projects.map((project) => {
            const stats = calculateProjectStats(project);

            return (
              <Card key={project.id} className="p-4 mb-3">
                <View className="gap-3">
                  {/* Header */}
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">{project.name}</Text>
                      {project.city && (
                        <Text className="text-sm text-muted mt-1">{project.city}</Text>
                      )}
                    </View>
                  </View>

                  {/* Occupancy */}
                  <View className="gap-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-medium text-muted">Obłożenie</Text>
                      <Text className="text-2xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                    </View>
                    <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
                  </View>

                  {/* Stats Grid */}
                  <View className="flex-row gap-2 pt-2 border-t border-border/30">
                    <View className="flex-1 bg-surfaceVariant/50 rounded-lg p-2">
                      <Text className="text-xs text-muted">Razem</Text>
                      <Text className="text-xl font-bold text-foreground mt-1">
                        {stats.total}
                      </Text>
                    </View>
                    <View className="flex-1 bg-surfaceVariant/50 rounded-lg p-2">
                      <Text className="text-xs text-muted">Zajęte</Text>
                      <Text className="text-xl font-bold text-success mt-1">
                        {stats.occupied}
                      </Text>
                    </View>
                    <View className="flex-1 bg-surfaceVariant/50 rounded-lg p-2">
                      <Text className="text-xs text-muted">Wolne</Text>
                      <Text className="text-xl font-bold text-warning mt-1">
                        {stats.vacant}
                      </Text>
                    </View>
                  </View>

                  {/* Additional Stats */}
                  {stats.wypowiedzenie > 0 && (
                    <View className="flex-row items-center gap-2 pt-2 border-t border-border/30">
                      <MaterialIcons name="warning" size={16} color={colors.warning} />
                      <Text className="text-sm text-muted">
                        {stats.wypowiedzenie} na wypowiedzeniu
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
