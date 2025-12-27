import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Conflict } from '@/types';
import { loadData, getConflicts } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function ConflictsDetailScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);

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

  const getConflictsWithDetails = (project: Project) => {
    const conflicts = getConflicts(project);
    return conflicts.map((conflict) => {
      // Find room name from conflict
      let roomName = 'Nieznany pokój';
      for (const address of project.addresses) {
        if (address.id === conflict.addressId) {
          for (const room of address.rooms) {
            for (const space of room.spaces) {
              if (space.id === conflict.spaceId) {
                roomName = room.name;
              }
            }
          }
        }
      }

      return {
        ...conflict,
        roomName,
        tenantName: `${conflict.firstName} ${conflict.lastName}`,
      };
    });
  };

  const allConflicts = projects.flatMap(getConflictsWithDetails);

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
        <Text className="text-3xl font-bold text-foreground">Konflikty</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : allConflicts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="check-circle" size={48} color={colors.success} />
          <Text className="text-muted mt-4">Brak konfliktów</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Group by Project */}
          {projects.map((project) => {
            const projectConflicts = getConflictsWithDetails(project);
            if (projectConflicts.length === 0) return null;

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
                          {projectConflicts.length} konflikt{projectConflicts.length !== 1 ? 'ów' : ''}
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
                    {projectConflicts.map((conflict, idx) => (
                      <Card key={idx} className="p-3 bg-surfaceVariant/30">
                        <View className="gap-2">
                          {/* Address */}
                          <View className="flex-row items-center gap-2">
                            <MaterialIcons name="location-on" size={16} color={colors.muted} />
                            <Text className="text-sm font-medium text-foreground">
                              {conflict.addressName}
                            </Text>
                          </View>

                          {/* Tenant */}
                          <View className="flex-row items-center gap-2">
                            <MaterialIcons name="person" size={16} color={colors.error} />
                            <Text className="text-sm text-foreground">
                              {conflict.firstName} {conflict.lastName}
                            </Text>
                          </View>

                          {/* Conflict Type */}
                          <View className="flex-row items-center gap-2 pt-1 border-t border-border/20">
                            <MaterialIcons name="warning" size={16} color={colors.error} />
                            <Text className="text-sm text-muted">
                              {conflict.type === 'no_room' ? 'Brak miejsca' : 'Wypowiedzenie przeterminowane'}
                            </Text>
                          </View>

                          {/* Message */}
                          <Text className="text-xs text-muted mt-1">
                            {conflict.message}
                          </Text>

                          {/* Badge */}
                          <Badge
                            variant="error"
                            size="sm"
                            label="Wymaga uwagi"
                          />
                        </View>
                      </Card>
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
