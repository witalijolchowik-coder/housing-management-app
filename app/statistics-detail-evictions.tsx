import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Tenant } from '@/types';
import { loadData, calculateProjectStats } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function EvictionsDetailScreen() {
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

  const getEvictionsWithDetails = (project: Project) => {
    const evictions: Array<{
      projectId: string;
      projectName: string;
      addressId: string;
      addressName: string;
      roomId: string;
      roomName: string;
      tenant: Tenant;
      endDate: string;
    }> = [];

    for (const address of project.addresses) {
      for (const room of address.rooms) {
        for (const space of room.spaces) {
          if (space.tenant && space.wypowiedzenie) {
            evictions.push({
              projectId: project.id,
              projectName: project.name,
              addressId: address.id,
              addressName: address.name,
              roomId: room.id,
              roomName: room.name,
              tenant: space.tenant,
              endDate: space.wypowiedzenie.endDate,
            });
          }
        }
      }
    }

    return evictions;
  };

  const allEvictions = projects.flatMap(getEvictionsWithDetails);

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
        <Text className="text-3xl font-bold text-foreground">Wypowiedzenia</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : allEvictions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="check-circle" size={48} color={colors.success} />
          <Text className="text-muted mt-4">Brak wypowiedzeń</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Group by Project */}
          {projects.map((project) => {
            const projectEvictions = getEvictionsWithDetails(project);
            if (projectEvictions.length === 0) return null;

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
                          {projectEvictions.length} wypowiedzenie{projectEvictions.length !== 1 ? 'ń' : ''}
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
                    {/* Group by Address */}
                    {Array.from(new Set(projectEvictions.map((e) => e.addressId))).map((addressId) => {
                      const addressEvictions = projectEvictions.filter((e) => e.addressId === addressId);
                      const address = addressEvictions[0];

                      return (
                        <View key={addressId}>
                          {/* Address Header */}
                          <Pressable
                            onPress={() =>
                              setExpandedAddress(expandedAddress === addressId ? null : addressId)
                            }
                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                          >
                            <Card className="p-3 mb-2 bg-surfaceVariant/50">
                              <View className="flex-row justify-between items-center">
                                <View className="flex-1">
                                  <Text className="text-base font-semibold text-foreground">
                                    {address.addressName}
                                  </Text>
                                  <Text className="text-xs text-muted mt-1">
                                    {addressEvictions.length} wypowiedzenie{addressEvictions.length !== 1 ? 'ń' : ''}
                                  </Text>
                                </View>
                                <MaterialIcons
                                  name={expandedAddress === addressId ? 'expand-less' : 'expand-more'}
                                  size={20}
                                  color={colors.muted}
                                />
                              </View>
                            </Card>
                          </Pressable>

                          {/* Tenant Details */}
                          {expandedAddress === addressId && (
                            <View className="ml-2 gap-2">
                              {addressEvictions.map((eviction, idx) => (
                                <Card key={idx} className="p-3 bg-surfaceVariant/30">
                                  <View className="gap-2">
                                    {/* Room */}
                                    <View className="flex-row items-center gap-2">
                                      <MaterialIcons name="door-front" size={16} color={colors.muted} />
                                      <Text className="text-sm font-medium text-foreground">
                                        {eviction.roomName}
                                      </Text>
                                    </View>

                                    {/* Tenant */}
                                    <View className="flex-row items-center gap-2">
                                      <MaterialIcons name="person" size={16} color={colors.success} />
                                      <Text className="text-sm text-foreground">
                                        {eviction.tenant.firstName} {eviction.tenant.lastName}
                                      </Text>
                                    </View>

                                    {/* End Date */}
                                    <View className="flex-row items-center gap-2 pt-1 border-t border-border/20">
                                      <MaterialIcons name="calendar-today" size={16} color={colors.warning} />
                                  <Text className="text-sm text-muted">
                                    Koniec: {new Date(eviction.endDate).toLocaleDateString('pl')}
                                  </Text>
                                    </View>

                                    {/* Days remaining */}
                                    {(() => {
                                      const today = new Date();
                                      const endDate = new Date(eviction.endDate);
                                      const daysLeft = Math.ceil(
                                        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                                      );

                                      return (
                                        <Badge
                                          variant={daysLeft < 0 ? 'error' : daysLeft < 7 ? 'warning' : 'default'}
                                          size="sm"
                                          label={
                                            daysLeft < 0
                                              ? `Opóźnione o ${Math.abs(daysLeft)} dni`
                                              : `${daysLeft} dni`
                                          }
                                        />
                                      );
                                    })()}
                                  </View>
                                </Card>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
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
