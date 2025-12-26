import { View, Text, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { loadData, calculateProjectStats } from '@/lib/store';
import { Project } from '@/types';

export default function ReportsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSpaces: 0,
    occupiedSpaces: 0,
    vacantSpaces: 0,
    evictionSpaces: 0,
    conflictSpaces: 0,
    occupancyPercent: 0,
  });

  useEffect(() => {
    loadProjectsData();
  }, []);

  const loadProjectsData = async () => {
    try {
      const data = await loadData();
      setProjects(data);

      // Calculate total statistics
      let totalOccupied = 0;
      let totalVacant = 0;
      let totalEviction = 0;
      let totalConflict = 0;
      let totalSpaces = 0;

      for (const project of data) {
        for (const address of project.addresses) {
          for (const room of address.rooms) {
            for (const space of room.spaces) {
              totalSpaces++;
              if (space.status === 'occupied') totalOccupied++;
              else if (space.status === 'vacant') totalVacant++;
              else if (space.status === 'wypowiedzenie') totalEviction++;
              else if (space.status === 'conflict') totalConflict++;
            }
          }
        }
      }

      const occupancyPercent = totalSpaces > 0 
        ? Math.round(((totalOccupied + totalEviction) / totalSpaces) * 100)
        : 0;

      setTotalStats({
        totalSpaces,
        occupiedSpaces: totalOccupied,
        vacantSpaces: totalVacant,
        evictionSpaces: totalEviction,
        conflictSpaces: totalConflict,
        occupancyPercent,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <Card className="p-4 flex-1">
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name={icon} size={20} color={color} />
          <Text className="text-xs text-muted flex-1">{label}</Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
      </View>
    </Card>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground">{t.reports.title}</Text>

          {/* Main Occupancy Card */}
          <Card className="p-6 bg-primary">
            <View className="gap-2">
              <Text className="text-sm text-foreground opacity-80">{t.reports.occupancyRate}</Text>
              <Text className="text-5xl font-bold text-foreground">{totalStats.occupancyPercent}%</Text>
            </View>
          </Card>

          {/* Statistics Grid */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard
                icon="apartment"
                label={t.reports.totalSpaces}
                value={totalStats.totalSpaces}
                color={colors.muted}
              />
              <StatCard
                icon="person"
                label={t.statistics.totalOccupied}
                value={totalStats.occupiedSpaces}
                color={colors.occupied}
              />
            </View>

            <View className="flex-row gap-3">
              <StatCard
                icon="check-circle"
                label={t.statistics.totalVacant}
                value={totalStats.vacantSpaces}
                color={colors.success}
              />
              <StatCard
                icon="warning"
                label={t.statistics.evictionCount}
                value={totalStats.evictionSpaces}
                color={colors.warning}
              />
            </View>

            <View className="flex-row gap-3">
              <StatCard
                icon="error"
                label={t.statistics.conflictCount}
                value={totalStats.conflictSpaces}
                color={colors.error}
              />
            </View>
          </View>

          {/* Projects List */}
          <View className="gap-2 mt-4">
            <Text className="text-lg font-semibold text-foreground">{t.dashboard.title}</Text>
            {projects.map((project) => {
              const stats = calculateProjectStats(project);
              return (
                <Card key={project.id} className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{project.name}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {stats.occupancyPercent}% {t.reports.occupancyRate}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-primary">{stats.occupancyPercent}%</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
