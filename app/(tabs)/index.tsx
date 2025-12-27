import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { ProjectMenuModal } from '@/components/project-menu-modal';
import { ProjectFormModal } from '@/components/project-form-modal';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, ProjectStats, Conflict } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData, addProject, updateProject, deleteProject, getConflicts } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function DashboardScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      setLoading(true);
      let data = await loadData();
      if (data.length === 0) {
        await initializeDemoData();
        data = await loadData();
      }
      setProjects(data);
      
      // Collect all conflicts
      const allConflicts: Conflict[] = [];
      for (const project of data) {
        allConflicts.push(...getConflicts(project));
      }
      setConflicts(allConflicts);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalVacant = 0;
    let totalWypowiedzenie = 0;

    for (const project of projects) {
      const stats = calculateProjectStats(project);
      totalSpaces += stats.total;
      totalOccupied += stats.occupied;
      totalVacant += stats.vacant;
      totalWypowiedzenie += stats.wypowiedzenie;
    }

    const occupancyPercent = totalSpaces > 0 
      ? Math.round(((totalOccupied + totalWypowiedzenie) / totalSpaces) * 100)
      : 0;

    return { totalSpaces, totalOccupied, totalVacant, totalWypowiedzenie, occupancyPercent };
  };

  const handleProjectPress = (projectId: string) => {
    router.push({
      pathname: '/address-list',
      params: { projectId },
    });
  };

  const handleProjectMenu = (project: Project) => {
    setSelectedProject(project);
    setMenuVisible(true);
  };

  const handleEditProject = () => {
    if (selectedProject) {
      setEditingProject(selectedProject);
      setFormVisible(true);
    }
  };

  const handleDeleteProject = async () => {
    if (selectedProject) {
      try {
        await deleteProject(selectedProject.id);
        await loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleSaveProject = async (name: string, city?: string) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, { name, city });
      } else {
        await addProject(name, city);
      }
      setEditingProject(undefined);
      await loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  const handleStatClick = (type: string) => {
    switch (type) {
      case 'wypowiedzenie':
        router.push('/statistics-detail-evictions');
        break;
      case 'conflicts':
        router.push('/statistics-detail-conflicts');
        break;
      case 'vacant':
        router.push('/statistics-detail-vacant');
        break;
      case 'occupied':
        router.push('/statistics-detail-occupied');
        break;
      case 'total':
        router.push('/statistics-detail-total');
        break;
      default:
        break;
    }
  };

  const overallStats = calculateOverallStats();

  const renderProjectCard = ({ item }: { item: Project }) => {
    const stats = calculateProjectStats(item);
    const hasEvictions = stats.wypowiedzenie > 0;
    const hasConflicts = stats.conflictCount > 0;

    return (
      <Pressable
        onPress={() => handleProjectPress(item.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-5 mb-4">
          <View className="gap-4">
            {/* Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{item.name}</Text>
                {item.city && (
                  <Text className="text-sm text-muted mt-1">{item.city}</Text>
                )}
              </View>
              <Pressable
                onPress={() => handleProjectMenu(item)}
                className="bg-surfaceVariant/60 rounded-full p-2.5"
              >
                <MaterialIcons name="more-vert" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {/* Occupancy */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-4xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                <Text className="text-sm text-muted">
                  {stats.occupied}/{stats.total} {t.addressList.occupied}
                </Text>
              </View>
              <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-3 pt-2 border-t border-border/30">
              {hasEvictions && (
                <Badge variant="warning" size="sm" label={`${stats.wypowiedzenie} ${t.roomDetails.eviction}`} />
              )}
              {hasConflicts && (
                <Badge variant="error" size="sm" label={`${stats.conflictCount} ${t.statistics.conflictCount}`} />
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
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-bold text-foreground">{t.dashboard.title}</Text>
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="person" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Dashboard Statistics - Compact Grid */}
      {!loading && projects.length > 0 && (
        <View className="mb-6">
          {/* 2x3 Grid Layout */}
          <View className="flex-row gap-3 mb-3">
            {/* Occupancy */}
            <Pressable 
              onPress={() => handleStatClick('occupancy')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 bg-primary items-center">
                <Text className="text-white text-xs font-medium">Obłożenie</Text>
                <Text className="text-white text-3xl font-bold mt-1">{overallStats.occupancyPercent}%</Text>
              </Card>
            </Pressable>

            {/* Total Spaces */}
            <Pressable 
              onPress={() => handleStatClick('total')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="apartment" size={24} color={colors.primary} />
                <Text className="text-xs text-muted mt-1">Razem</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalSpaces}</Text>
              </Card>
            </Pressable>

            {/* Occupied */}
            <Pressable 
              onPress={() => handleStatClick('occupied')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="person" size={24} color={colors.success} />
                <Text className="text-xs text-muted mt-1">Zajęte</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalOccupied}</Text>
              </Card>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            {/* Vacant */}
            <Pressable 
              onPress={() => handleStatClick('vacant')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="event-available" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Wolne</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalVacant}</Text>
              </Card>
            </Pressable>

            {/* Wypowiedzenie */}
            <Pressable 
              onPress={() => handleStatClick('wypowiedzenie')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="warning" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Wyp.</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalWypowiedzenie}</Text>
              </Card>
            </Pressable>

            {/* Conflicts */}
            <Pressable 
              onPress={() => handleStatClick('conflicts')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="error" size={24} color={colors.error} />
                <Text className="text-xs text-muted mt-1">Konflikty</Text>
                <Text className="text-xl font-bold text-foreground">{conflicts.length}</Text>
              </Card>
            </Pressable>
          </View>
        </View>
      )}

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {projects.map((project) => (
            <View key={project.id}>
              {renderProjectCard({ item: project })}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB 
        icon="add" 
        onPress={() => {
          setEditingProject(undefined);
          setFormVisible(true);
        }} 
      />

      {/* Modals */}
      <ProjectMenuModal
        visible={menuVisible}
        projectName={selectedProject?.name || ''}
        onClose={() => setMenuVisible(false)}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />

      <ProjectFormModal
        visible={formVisible}
        project={editingProject}
        onClose={() => {
          setFormVisible(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
      />
    </ScreenContainer>
  );
}
