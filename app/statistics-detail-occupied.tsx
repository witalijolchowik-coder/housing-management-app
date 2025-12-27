import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project } from '@/types';
import { loadData, calculateProjectStats } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function OccupiedDetailScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

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

  const getAddressStats = (project: Project) => {
    const addresses: Array<{
      id: string;
      name: string;
      totalSpaces: number;
      occupied: number;
      vacant: number;
    }> = [];

    for (const address of project.addresses) {
      let totalSpaces = 0;
      let occupied = 0;

      for (const room of address.rooms) {
        for (const space of room.spaces) {
          totalSpaces++;
          if (space.status === 'occupied' || space.status === 'wypowiedzenie') {
            occupied++;
          }
        }
      }

      addresses.push({
        id: address.id,
        name: address.name,
        totalSpaces,
        occupied,
        vacant: totalSpaces - occupied,
      });
    }

    return addresses;
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
        <Text className="text-3xl font-bold text-foreground">Zajęte miejsca</Text>
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
          {/* Group by Project */}
          {projects.map((project) => {
            const stats = calculateProjectStats(project);
            const addresses = getAddressStats(project);
            const totalOccupied = addresses.reduce((sum, addr) => sum + addr.occupied, 0);

            if (totalOccupied === 0) return null;

            return (
              <View key={project.id} className="mb-4">
                {/* Project Header */}
                <Pressable
                  onPress={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Card className="p-4 mb-2">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground">{project.name}</Text>
                        <Text className="text-sm text-muted mt-1">
                          {totalOccupied} zajętych miejsc
                        </Text>
                      </View>
                      <MaterialIcons
                        name={expandedProject === project.id ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={colors.muted}
                      />
                    </View>
                  </Card>
                </Pressable>

                {/* Expanded Content */}
                {expandedProject === project.id && (
                  <View className="ml-2 gap-2">
                    {addresses.map((address) => (
                      address.occupied > 0 && (
                        <Card key={address.id} className="p-3 bg-surfaceVariant/30">
                          <View className="gap-2">
                            {/* Address */}
                            <View className="flex-row items-center gap-2">
                              <MaterialIcons name="location-on" size={16} color={colors.muted} />
                              <Text className="text-sm font-medium text-foreground">
                                {address.name}
                              </Text>
                            </View>

                            {/* Stats */}
                            <View className="flex-row gap-4 pt-1 border-t border-border/20">
                              <View className="flex-1">
                                <Text className="text-xs text-muted">Razem</Text>
                                <Text className="text-lg font-bold text-foreground">
                                  {address.totalSpaces}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-xs text-muted">Zajęte</Text>
                                <Text className="text-lg font-bold text-success">
                                  {address.occupied}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-xs text-muted">Wolne</Text>
                                <Text className="text-lg font-bold text-warning">
                                  {address.vacant}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Card>
                      )
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
